// Import des 6 articles en BROUILLONS dans Sanity, puis vérification.
// Authentification : session du compte Sanity de l'utilisateur (`npx sanity login`), aucun jeton dans les fichiers.
// Simulation (aucune écriture) : npx sanity exec scripts/import-articles.mjs --with-user-token
// Import réel             : npx sanity exec scripts/import-articles.mjs --with-user-token -- --execute
import {getCliClient} from 'sanity/cli'
import {createReadStream, writeFileSync, mkdirSync} from 'node:fs'
import path from 'node:path'
import {buildArticle, collectFiles, SLUGS, SITE_DIR, docId} from './articles-lib.mjs'

const EXECUTE = process.argv.includes('--execute')
const client = getCliClient({apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})
const log = []
const say = (m) => { console.log(m); log.push(m) }

// Remplace récursivement les { __file } par une référence d'asset.
const withAssets = (v, map) => {
  if (Array.isArray(v)) return v.map((x) => withAssets(x, map))
  if (v && typeof v === 'object') {
    const o = {}
    for (const [k, x] of Object.entries(v)) {
      if (k === '__file') o.asset = {_type: 'reference', _ref: map.get(x)}
      else o[k] = withAssets(x, map)
    }
    return o
  }
  return v
}
// Pour comparer : asset -> nom de fichier d'origine ; retire les champs système.
const comparable = (v, names) => {
  if (Array.isArray(v)) return v.map((x) => comparable(x, names))
  if (v && typeof v === 'object') {
    const o = {}
    for (const k of Object.keys(v).sort()) {
      if (['_createdAt', '_updatedAt', '_rev', '_system'].includes(k)) continue
      if (k === 'asset') o.file = names.get(v.asset?._ref)
      else if (k === '__file') o.file = path.basename(v.__file)
      else o[k] = comparable(v[k], names)
    }
    return Object.fromEntries(Object.entries(o).sort(([x], [y]) => (x < y ? -1 : 1)))
  }
  return v
}

const local = Object.fromEntries(SLUGS.map((s) => [s, buildArticle(s).article]))
for (const a of Object.values(local)) if (!a._id.startsWith('drafts.')) throw new Error(`Refus : ${a._id} n'est pas un brouillon`)

// 1. Documents déjà présents (publiés ou brouillons, même id ou même slug) : jamais écrasés.
const ids = SLUGS.flatMap((s) => [docId(s), `drafts.${docId(s)}`])
const existing = await client.fetch(
  `*[_type == "article" && (_id in $ids || slug.current in $slugs)]{_id, "slug": slug.current}`,
  {ids, slugs: SLUGS},
)
say(`Projet ${client.config().projectId} / ${client.config().dataset} — ${EXECUTE ? 'IMPORT' : 'SIMULATION'}`)
const todo = SLUGS.filter((s) => {
  const found = existing.filter((e) => e.slug === s || e._id.endsWith(docId(s)))
  if (found.length) say(`• ${s} : déjà présent (${found.map((f) => f._id).join(', ')}) → ignoré`)
  return !found.length
})
say(`${todo.length} article(s) à importer en brouillon`)

// 2. Import (uniquement avec --execute)
if (EXECUTE && todo.length) {
  const map = new Map()
  for (const f of [...new Set(todo.flatMap((s) => collectFiles(local[s])))]) {
    const asset = await client.assets.upload('image', createReadStream(path.join(SITE_DIR, f)), {filename: path.basename(f)})
    map.set(f, asset._id) // Sanity déduplique les fichiers identiques : relancer ne crée pas de doublon.
  }
  for (const s of todo) {
    await client.createIfNotExists(withAssets(local[s], map))
    say(`✓ ${s} : brouillon créé (${local[s]._id})`)
  }
}

// 3. Vérification : chaque brouillon présent dans Sanity est comparé à la conversion du HTML d'origine.
const drafts = await client.fetch(`*[_id in $ids]`, {ids: SLUGS.map((s) => `drafts.${docId(s)}`)})
const refs = [...new Set(JSON.stringify(drafts).match(/image-[a-f0-9]+-\d+x\d+-\w+/g) || [])]
const names = new Map((await client.fetch(`*[_id in $refs]{_id, originalFilename}`, {refs})).map((a) => [a._id, a.originalFilename]))
for (const s of SLUGS) {
  const remote = drafts.find((d) => d._id === `drafts.${docId(s)}`)
  if (!remote) { say(`– ${s} : pas de brouillon à vérifier`); continue }
  const a = comparable(remote, names)
  const b = comparable(local[s], names)
  const diff = Object.keys({...a, ...b}).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
  if (diff.length && process.argv.includes('--debug')) console.log(JSON.stringify(a[diff.at(-1)]).slice(0, 300), '\n', JSON.stringify(b[diff.at(-1)]).slice(0, 300))
  say(diff.length ? `✗ ${s} : différences sur ${diff.join(', ')}` :`✓ ${s} : brouillon identique au HTML d'origine (texte, liens, tableaux, images, FAQ, SEO)`)
}
mkdirSync(new URL('../import/', import.meta.url), {recursive: true})
writeFileSync(new URL('../import/rapport-import.md', import.meta.url), log.join('\n'))
