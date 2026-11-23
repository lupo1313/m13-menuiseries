// Génère les pages dynamiques du site à partir de Sanity, dans un dossier de sortie séparé.
// Les fichiers du site ne sont JAMAIS modifiés : ils servent de gabarits.
//   Test local (brouillons) : npx sanity exec build/build-site.mjs --with-user-token -- --preview
//   Production (publiés)    : npx sanity exec build/build-site.mjs -- --out <dossier>
import {getCliClient} from 'sanity/cli'
import {readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {ARTICLE_PROJECTION, renderArticlePage} from './render-article.mjs'
import {REALISATION_PROJECTION, PORTFOLIO_ASSETS, isTestContent, renderBlog, renderRealisations, renderSitemap} from './render-lists.mjs'
import {resolveAll} from './images.mjs'

const args = process.argv.slice(2)
const PREVIEW = args.includes('--preview')
if (PREVIEW && process.env.CI) throw new Error('Mode brouillons interdit en intégration continue : seuls les contenus publiés sont générés.')
const SITE_DIR = fileURLToPath(new URL('../../', import.meta.url))
const OUT = PREVIEW ? fileURLToPath(new URL('../import/site-preview/', import.meta.url)) : path.resolve(args[args.indexOf('--out') + 1] || '')
if (!PREVIEW && !args.includes('--out')) throw new Error('Préciser --out <dossier>')
// Garde-fou (le dossier de sortie est vidé) : jamais le site, un de ses parents, ni un de ses dossiers sources.
{
  const rel = path.relative(SITE_DIR, OUT)
  const siteInsideOut = !path.relative(OUT, SITE_DIR).startsWith('..')
  const outInsideSite = rel && !rel.startsWith('..') && !path.isAbsolute(rel)
  if (!rel || siteInsideOut || (outInsideSite && !/^(studio[\\/]import|dist-)/.test(rel))) {
    throw new Error(`Refus : dossier de sortie dangereux (${OUT}).`)
  }
}

const client = getCliClient({apiVersion: '2025-02-19', useCdn: false, perspective: PREVIEW ? 'drafts' : 'published'})
const read = (f) => readFileSync(path.join(SITE_DIR, f), 'utf8')
const warn = (m) => console.warn(`⚠ ${m}`)

const articlesRaw = await client.fetch(`*[_type == "article" && defined(slug.current)] | order(publishedAt asc, _createdAt asc)${ARTICLE_PROJECTION}`)
const realRaw = await client.fetch(`*[_type == "realisation" && visible != false] | order(order asc, _createdAt asc)${REALISATION_PROJECTION}`)

const articles = articlesRaw.filter((a) => {
  if (isTestContent(a.title)) return warn(`article de test exclu : ${a.title}`), false
  if (!a.title || !a.body?.length || !a.mainImage?.file) return warn(`article incomplet exclu : ${a.slug}`), false
  return true
})
const realisations = realRaw.filter((r) => {
  if (isTestContent(r.title)) return warn(`réalisation de test exclue : ${r.title}`), false
  if (!r.title || !r.city || !r.categories?.length || !r.mainPhoto?.file) return warn(`réalisation incomplète exclue : ${r.title || r._id}`), false
  return true
})

rmSync(OUT, {recursive: true, force: true})
mkdirSync(OUT, {recursive: true})
const ctx = {siteDir: SITE_DIR, outDir: OUT}
await resolveAll(articles, ctx)
await resolveAll(realisations, ctx)

const shell = read('changer-fenetres-marseille.html')
for (const a of articles) writeFileSync(path.join(OUT, `${a.slug}.html`), renderArticlePage(a, shell, SITE_DIR))
writeFileSync(path.join(OUT, 'blog.html'), renderBlog(articles, read('blog.html')))
const realHtml = renderRealisations(realisations, read('realisations.html'))
writeFileSync(path.join(OUT, 'realisations.html'), realHtml)
if (realHtml.includes(PORTFOLIO_ASSETS.js)) {
  for (const [kind, rel] of [['css', PORTFOLIO_ASSETS.css], ['js', PORTFOLIO_ASSETS.js]]) {
    mkdirSync(path.join(OUT, kind), {recursive: true})
    copyFileSync(new URL(`./assets/${path.basename(rel)}`, import.meta.url), path.join(OUT, rel))
  }
}
writeFileSync(path.join(OUT, 'sitemap.xml'), renderSitemap(articles, read('sitemap.xml')))
console.log(`${PREVIEW ? 'APERÇU (brouillons)' : 'PRODUCTION (publiés)'} → ${OUT}`)
console.log(`articles : ${articles.length} · réalisations Sanity : ${realisations.length} (exclues : ${realRaw.length - realisations.length})`)
