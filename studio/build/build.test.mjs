// Tests des garde-fous du générateur (données fictives en mémoire, aucun appel à Sanity).
// Usage : node build/build.test.mjs
import assert from 'node:assert/strict'
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import path from 'node:path'
import {parse} from 'node-html-parser'
import {renderBlog, renderRealisations, renderSitemap, isTestContent, portfolioOf} from './render-lists.mjs'
import {SITE_DIR} from '../scripts/articles-lib.mjs'

const read = (f) => readFileSync(path.join(SITE_DIR, f), 'utf8')
const blog = read('blog.html'), real = read('realisations.html'), sitemap = read('sitemap.xml')
const img = (file) => ({file, alt: 'Porte vitrée posée à Marseille', src: `assets/img/${file}`, srcM: `assets/img/${file.replace('.webp', '-m.webp')}`})
let n = 0
const t = (name, fn) => { fn(); n++; console.log(`✓ ${name}`) }

t('aucun contenu publié → pages identiques (jamais de page vide)', () => {
  assert.equal(renderBlog([], blog), blog)
  assert.equal(renderRealisations([], real), real)
  assert.equal(renderSitemap([], sitemap), sitemap)
})
t('publication partielle du blog → les 6 cartes restent présentes', () => {
  const a = {slug: 'prix-volets-roulants-marseille', title: 'T', category: 'C', excerpt: 'E', mainImage: img('service-volets-roulants.webp')}
  const cards = parse(renderBlog([a], blog)).querySelectorAll('article.blog-card')
  assert.equal(cards.length, 6)
  assert.equal(cards[0].querySelector('h2 a').getAttribute('href'), 'prix-volets-roulants-marseille')
})
t('nouvel article → ajouté au sitemap, URL existantes inchangées', () => {
  const out = renderSitemap([{slug: 'nouvel-article'}, {slug: 'blog'}], sitemap)
  assert.equal((out.match(/<url>/g) || []).length, 15)
  assert.ok(out.startsWith(sitemap.replace('</urlset>', '').trimEnd().slice(0, 200)))
})
t('les titres « Test… » sont détectés comme contenus de test', () => {
  assert.ok(isTestContent('Test chantier M13') && isTestContent(' test ') && !isTestContent('Testament') && !isTestContent('Porte vitrée'))
})
t('réalisation Sanity → ajoutée en tête, filtres conservés, doublon de photo retiré', () => {
  const r = {title: 'Porte vitrée (exemple)', city: 'Aubagne', categories: ['portes', 'exterieur'], mainPhoto: img('realisation-porte-vitree-entree.webp')}
  const out = renderRealisations([r], real)
  const doc = parse(out)
  const figs = doc.querySelectorAll('.real-grid figure.gallery-item')
  assert.equal(figs.length, 30) // 30 actuelles - 1 reprise + 1 nouvelle
  assert.equal(figs[0].getAttribute('data-cat'), 'portes exterieur')
  assert.equal(figs[0].getAttribute('data-full'), 'assets/img/realisation-porte-vitree-entree.webp')
  assert.equal(doc.querySelectorAll('.filter-btn').length, parse(real).querySelectorAll('.filter-btn').length)
  const dir = new URL('../import/fixtures/', import.meta.url)
  mkdirSync(dir, {recursive: true})
  writeFileSync(new URL('realisations-exemple.html', dir), out.replace('<head>', `<head><base href="${new URL('../../', import.meta.url).href}">`))
})
t('avant/après affiché seulement si la paire est complète ; sans photo en plus → carte actuelle', () => {
  const base = {title: 'X', city: 'Y', categories: ['portes'], mainPhoto: img('realisation-porte-vitree-entree.webp')}
  assert.equal(portfolioOf(base), null)
  assert.equal(portfolioOf({...base, beforePhoto: img('a.webp')}), null) // « Avant » seul : ignoré
  const pf = portfolioOf({...base, beforePhoto: img('a.webp'), afterPhoto: img('b.webp')})
  assert.ok(pf.before && pf.after && pf.photos.length === 0)
  const out = renderRealisations([base], real)
  assert.ok(!out.includes('pf-badge') && !out.includes('portfolio.js'))
  const out2 = renderRealisations([{...base, beforePhoto: img('a.webp'), afterPhoto: img('b.webp')}], real)
  assert.ok(out2.includes('Avant / Après') && out2.includes('js/portfolio.js') && !out2.includes('photo de plus'))
})
console.log(`${n} test(s) réussi(s)`)
