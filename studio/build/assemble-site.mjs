// Assemble le site complet à déployer : fichiers du site (même liste blanche que package-deploy.ps1)
// + pages générées depuis Sanity par-dessus. Aucun envoi : prépare seulement un dossier.
// Usage : node build/assemble-site.mjs --gen ../dist-generated --out ../dist-test [--test]
//   --test : site de TEST non indexable (robots.txt bloquant + en-tête X-Robots-Tag noindex).
import {cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const args = process.argv.slice(2)
const arg = (k) => (args.includes(k) ? path.resolve(args[args.indexOf(k) + 1] || '') : null)
const SITE = fileURLToPath(new URL('../../', import.meta.url))
const GEN = arg('--gen')
const OUT = arg('--out')
const TEST = args.includes('--test')
if (!GEN || !OUT || !existsSync(GEN)) throw new Error('Préciser --gen <dossier généré existant> et --out <dossier>')
// Garde-fou : le dossier de sortie (vidé) doit être un dossier dist-* à la racine du dépôt.
if (path.dirname(OUT) !== path.resolve(SITE) || !/^dist-[\w-]+$/.test(path.basename(OUT))) throw new Error(`Refus : sortie hors dist-* (${OUT})`)

rmSync(OUT, {recursive: true, force: true})
mkdirSync(OUT, {recursive: true})

// 1. Site actuel (liste blanche).
for (const f of readdirSync(SITE)) {
  if (f.endsWith('.html') && f !== 'test-liquid-glass.html') cpSync(path.join(SITE, f), path.join(OUT, f))
}
for (const f of ['.htaccess', 'robots.txt', 'sitemap.xml']) cpSync(path.join(SITE, f), path.join(OUT, f))
for (const d of ['css', 'js', 'assets']) cpSync(path.join(SITE, d), path.join(OUT, d), {recursive: true})

// 2. Pages générées par-dessus (articles, listes, sitemap, images Sanity, portfolio).
cpSync(GEN, OUT, {recursive: true})

// 3. Site de test : jamais indexé.
if (TEST) {
  writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
  const ht = readFileSync(path.join(OUT, '.htaccess'), 'utf8')
  writeFileSync(path.join(OUT, '.htaccess'), `${ht.trimEnd()}\n\n# --- SITE DE TEST : jamais indexé ---\n<IfModule mod_headers.c>\n  Header always set X-Robots-Tag "noindex, nofollow"\n</IfModule>\n`)
}

// 4. Contrôles : fichiers interdits, pages essentielles présentes et non vides.
const all = []
const walk = (d) => { for (const f of readdirSync(d)) { const p = path.join(d, f); statSync(p).isDirectory() ? walk(p) : all.push(path.relative(OUT, p)) } }
walk(OUT)
const bad = all.filter((f) => /(^|[\\/])(\.mcp\.json|\.env.*|test-liquid-glass\.html|settings\.local\.json)$/.test(f) || /\.(zip|md|ps1|pem|key|sql|log|bak)$/i.test(f) || /(^|[\\/])(strategie|Md 13 Menuiserie|\.git|\.claude|\.agents|studio|node_modules)[\\/]/.test(f))
if (bad.length) throw new Error(`Fichiers interdits : ${bad.join(', ')}`)
for (const f of ['index.html', 'contact.html', 'blog.html', 'realisations.html', 'sitemap.xml', '.htaccess', 'css/styles.css', 'js/script.js']) {
  if (!existsSync(path.join(OUT, f)) || statSync(path.join(OUT, f)).size < 200) throw new Error(`Fichier essentiel manquant ou vide : ${f}`)
}
console.log(`✓ site ${TEST ? 'de TEST ' : ''}assemblé : ${all.length} fichiers → ${OUT}`)
