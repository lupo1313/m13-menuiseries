// Contrôle du dossier généré avant tout déploiement. Échoue (code 1) au moindre problème.
// Usage : node build/validate-output.mjs --out <dossier>
import {parse} from 'node-html-parser'
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {isTestContent} from './render-lists.mjs'
import {SITE_URL} from './render-article.mjs'

const args = process.argv.slice(2)
const OUT = path.resolve(args[args.indexOf('--out') + 1] || '')
const SITE = fileURLToPath(new URL('../../', import.meta.url))
const errors = []
const fail = (m) => errors.push(m)
const exists = (rel) => existsSync(path.join(OUT, rel)) || existsSync(path.join(SITE, rel))
const page = (u) => { const p = u.replace(SITE_URL, '').replace(/^\//, '').split(/[?#]/)[0]; return p === '' ? 'index.html' : /\.\w+$/.test(p) ? p : `${p}.html` }

if (!args.includes('--out') || !existsSync(OUT)) { console.error('Dossier de sortie absent'); process.exit(1) }
for (const f of ['blog.html', 'realisations.html', 'sitemap.xml']) if (!existsSync(path.join(OUT, f)) || statSync(path.join(OUT, f)).size < 500) fail(`${f} manquant ou vide`)

for (const f of readdirSync(OUT).filter((x) => x.endsWith('.html'))) {
  const html = readFileSync(path.join(OUT, f), 'utf8')
  const doc = parse(html)
  if (!/<\/html>\s*$/.test(html) || !doc.querySelector('main') || !doc.querySelector('footer.site-footer') || !doc.querySelector('header')) fail(`${f} : structure de page incomplète`)
  if (/drafts\./.test(html)) fail(`${f} : référence à un brouillon`)
  if (/cdn\.sanity\.io/.test(html)) fail(`${f} : image servie depuis Sanity (interdit par la CSP)`)
  if (doc.querySelectorAll('h1').length !== 1) fail(`${f} : nombre de H1 ≠ 1`)
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) { try { JSON.parse(s.innerHTML) } catch { fail(`${f} : JSON-LD invalide`) } }
  for (const el of doc.querySelectorAll('img[src], source[srcset], [data-full]')) {
    const src = el.getAttribute('src') || el.getAttribute('srcset') || el.getAttribute('data-full')
    if (!/^https?:/.test(src) && !exists(src.split('?')[0])) fail(`${f} : image introuvable ${src}`)
  }
  for (const el of doc.querySelectorAll('link[rel="stylesheet"][href], script[src]')) {
    const src = (el.getAttribute('href') || el.getAttribute('src')).split('?')[0]
    if (!/^https?:/.test(src) && !exists(src)) fail(`${f} : fichier CSS/JS introuvable ${src}`)
  }
  for (const g of doc.querySelectorAll('[data-portfolio]')) {
    try {
      const d = JSON.parse(g.getAttribute('data-portfolio'))
      for (const i of [d.main, d.before, d.after, ...(d.photos || [])].filter(Boolean)) if (!exists(i.src) || (i.srcM && !exists(i.srcM)) || !i.w || !i.h) fail(`${f} : photo du portfolio invalide ${i.src}`)
      if (!!d.before !== !!d.after) fail(`${f} : paire avant/après incomplète`)
    } catch { fail(`${f} : données portfolio illisibles`) }
  }
  for (const t of doc.querySelectorAll('.blog-card h2, .gallery-item figcaption strong')) if (isTestContent(t.text)) fail(`${f} : contenu de test visible « ${t.text.trim()} »`)
  if (/-marseille\.html$/.test(f) && doc.querySelector('link[rel="canonical"]')?.getAttribute('href') !== `${SITE_URL}/${f.replace('.html', '')}`) fail(`${f} : canonical incorrect`)
}

// Aucune perte par rapport au site actuel.
const count = (file, sel) => parse(readFileSync(file, 'utf8')).querySelectorAll(sel).length
if (count(path.join(OUT, 'blog.html'), 'article.blog-card') < count(path.join(SITE, 'blog.html'), 'article.blog-card')) fail('blog.html : moins de cartes que la page actuelle')
const realOut = parse(readFileSync(path.join(OUT, 'realisations.html'), 'utf8'))
if (!realOut.querySelectorAll('.gallery-item').length) fail('realisations.html : aucune réalisation')
const filters = new Set(realOut.querySelectorAll('.filter-btn').map((b) => b.getAttribute('data-filter')))
for (const g of realOut.querySelectorAll('.gallery-item')) for (const c of (g.getAttribute('data-cat') || '').split(/\s+/)) if (!filters.has(c)) fail(`realisations.html : catégorie sans filtre « ${c} »`)
for (const c of parse(readFileSync(path.join(OUT, 'blog.html'), 'utf8')).querySelectorAll('.blog-card h2 a')) if (!exists(page(c.getAttribute('href')))) fail(`blog.html : lien vers une page absente ${c.getAttribute('href')}`)

const locs = (f) => [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const outLocs = new Set(locs(path.join(OUT, 'sitemap.xml')))
for (const u of locs(path.join(SITE, 'sitemap.xml'))) if (!outLocs.has(u)) fail(`sitemap.xml : URL existante supprimée ${u}`)
for (const u of outLocs) if (!exists(page(u))) fail(`sitemap.xml : URL sans page ${u}`)

if (errors.length) { console.error(`✗ ${errors.length} problème(s) :\n- ${errors.join('\n- ')}`); process.exit(1) }
console.log(`✓ sortie valide (${readdirSync(OUT).filter((x) => x.endsWith('.html')).length} page(s), sitemap ${outLocs.size} URL)`)
