// Crée (une seule fois) le webhook Sanity → GitHub Actions « Publication Sanity (automatique) ».
// Le jeton GitHub (fine-grained, dépôt m13-menuiseries uniquement, permission Actions : lecture/écriture)
// est lu dans un fichier local, jamais affiché, puis le fichier est supprimé après succès.
// Usage (depuis studio/) : npx sanity exec scripts/create-webhook.mjs --with-user-token -- <fichier-jeton>
import {getCliClient} from 'sanity/cli'
import {readFileSync, rmSync} from 'node:fs'

const file = process.argv.slice(2).find((a) => !a.startsWith('-'))
if (!file) throw new Error('Préciser le fichier contenant le jeton GitHub.')
const token = readFileSync(file, 'utf8').trim()
if (!/^github_pat_[A-Za-z0-9_]{40,}$/.test(token)) throw new Error('Jeton refusé : utiliser un jeton GitHub « fine-grained » (github_pat_…), pas un jeton classique.')

const NAME = 'GitHub – publication M13'
const client = getCliClient({apiVersion: '2021-10-04'}).withConfig({useProjectHostname: false})
const projectId = client.config().projectId
const hooks = await client.request({url: `/hooks/projects/${projectId}`})
const existing = hooks.find((h) => h.name === NAME)
if (existing) {
  // --remplacer-jeton : met à jour seulement l'en-tête d'authentification (jeton renouvelé).
  if (!process.argv.includes('--remplacer-jeton')) { console.log(`Le webhook « ${NAME} » existe déjà : rien à faire.`); process.exit(0) }
  await client.request({url: `/hooks/projects/${projectId}/${existing.id}`, method: 'PATCH', body: {headers: {...existing.headers, Authorization: `Bearer ${token}`}}})
  rmSync(file)
  console.log(`✓ Jeton du webhook remplacé (${existing.id}). Fichier du jeton supprimé.`)
  process.exit(0)
}

const hook = await client.request({
  url: `/hooks/projects/${projectId}`,
  method: 'POST',
  body: {
    type: 'document',
    name: NAME,
    description: 'Contenu publié (article ou réalisation) → génération et mise à jour du site. Brouillons ignorés.',
    dataset: 'production',
    url: 'https://api.github.com/repos/lupo1313/m13-menuiseries/actions/workflows/publication-sanity.yml/dispatches',
    httpMethod: 'POST',
    apiVersion: 'v2021-03-25',
    includeDrafts: false,
    headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'},
    rule: {on: ['create', 'update', 'delete'], filter: '_type in ["article", "realisation"]', projection: '{"ref": "main"}'},
    isDisabledByUser: false,
  },
})
rmSync(file)
console.log(`✓ Webhook créé (${hook.id}) : articles et réalisations publiés uniquement. Fichier du jeton supprimé.`)
