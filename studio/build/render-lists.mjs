// Pages de liste : blog.html (cartes), realisations.html (grille + filtres), sitemap.xml.
// Principe de sécurité : les éléments existants du site sont CONSERVÉS tant qu'ils n'ont pas
// d'équivalent publié dans Sanity ; sans contenu Sanity, la page d'origine est rendue inchangée.
import {parse} from 'node-html-parser'
import path from 'node:path'
import {IMG, SITE_URL, esc, attr, picture} from './render-article.mjs'

export const REALISATION_PROJECTION = `{_id, title, city, categories, description, order, visible, "mainPhoto": mainPhoto${IMG}, "beforePhoto": beforePhoto${IMG}, "afterPhoto": afterPhoto${IMG}, "gallery": gallery[]${IMG}}`
export const PORTFOLIO_ASSETS = {css: 'css/portfolio.css', js: 'js/portfolio.js', version: '20261123'}

const ICON_BA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>'
const ICON_PHOTOS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/></svg>'
const slim = (i) => (i?.src ? {src: i.src, srcM: i.srcM || null, w: i.w, h: i.h, alt: i.alt || ''} : null)

// Données de la fenêtre avant/après + galerie. Null si la réalisation n'a ni paire avant/après complète ni photo complémentaire.
export function portfolioOf(r) {
  const hasBA = !!(r.beforePhoto?.src && r.afterPhoto?.src)
  const photos = (r.gallery || []).map(slim).filter(Boolean)
  if (!hasBA && !photos.length) return null
  return {title: r.title, city: r.city, description: r.description || '', main: slim(r.mainPhoto), before: hasBA ? slim(r.beforePhoto) : null, after: hasBA ? slim(r.afterPhoto) : null, photos}
}

// Garde-fou : un contenu dont le titre commence par « Test » n'est jamais publié sur le site.
export const isTestContent = (title) => /^\s*test\b/i.test(title || '')

function swapRegion(html, re, fn, what) {
  if (!re.test(html)) throw new Error(`Gabarit : zone introuvable (${what})`)
  return html.replace(re, fn)
}

// ---------- blog.html ----------
export function renderBlog(articles, shell) {
  if (!articles.length) return shell // jamais de page vide
  const grid = parse(shell).querySelector('.blog-grid')
  const sanitySlugs = new Set(articles.map((a) => a.slug))
  const legacy = grid.querySelectorAll('article.blog-card').filter((c) => !sanitySlugs.has(c.querySelector('h2 a').getAttribute('href'))).map((c) => `        ${c.outerHTML}`)
  const cards = articles.map((a) => `        <article class="blog-card">
          <a href="${attr(a.slug)}" class="blog-card-media" aria-label="Lire : ${attr(a.cardTitle || a.title)}">
            ${picture(a.mainImage, ' width="600" height="375"')}
          </a>
          <div class="blog-card-body">
            <span class="blog-cat">${esc(a.cardCategory || a.category)}</span>
            <h2><a href="${attr(a.slug)}">${esc(a.cardTitle || a.title)}</a></h2>
            <p>${esc(a.excerpt)}</p>
            <a href="${attr(a.slug)}" class="link-arrow">${esc(a.cardLinkLabel || 'Lire le guide')} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
          </div>
        </article>`)
  return swapRegion(shell, /(<div class="blog-grid">)[\s\S]*<\/article>/, (_, o) => `${o}\n\n${[...cards, ...legacy].join('\n\n')}`, 'grille du blog')
}

// ---------- realisations.html ----------
export function renderRealisations(items, shell) {
  if (!items.length) return shell // jamais de page vide : les réalisations actuelles restent
  const grid = parse(shell).querySelector('.real-grid')
  const migrated = new Set(items.map((r) => r.mainPhoto.file))
  // Une réalisation actuelle disparaît seulement si la même photo a été reprise dans Sanity.
  const legacy = grid.querySelectorAll('figure.gallery-item').filter((f) => !migrated.has(path.basename(f.querySelector('img').getAttribute('src')))).map((f) => `        ${f.outerHTML}`)
  const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '')
  let usesPortfolio = false
  const figs = items.map((r) => {
    const pf = portfolioOf(r)
    if (pf) usesPortfolio = true
    const extra = pf ? [pf.before && 'comparaison avant/après', pf.photos.length && `${pf.photos.length} photo${pf.photos.length > 1 ? 's' : ''} de plus`].filter(Boolean).join(' et ') : ''
    const badges = pf ? `\n          <span class="pf-badges" aria-hidden="true">${pf.before ? `<span class="pf-badge pf-badge--ba">${ICON_BA}Avant / Après</span>` : ''}${pf.photos.length ? `<span class="pf-badge">${ICON_PHOTOS}+${pf.photos.length} photo${pf.photos.length > 1 ? 's' : ''}</span>` : ''}</span>` : ''
    return `        <figure class="gallery-item filter-item reveal${pf ? ' js-portfolio' : ''}" data-cat="${attr(r.categories.join(' '))}" tabindex="0" role="button" aria-label="Agrandir : ${attr(lc(r.mainPhoto.alt))}${extra ? ` (${extra})` : ''}" data-full="${attr(r.mainPhoto.src)}" data-caption="${attr(`${r.title} — ${r.city}`)}"${pf ? ` data-portfolio="${attr(JSON.stringify(pf))}"` : ''}>${badges}
          ${picture(r.mainPhoto).replace(' loading="lazy" />', ' loading="lazy" decoding="async" />')}
          <figcaption><strong>${esc(r.title)}</strong><span>${esc(r.city)}</span></figcaption>
        </figure>`
  })
  let html = swapRegion(shell, /(<div class="real-grid js-lightbox">)[\s\S]*<\/figure>/, (_, o) => `${o}\n\n${[...figs, ...legacy].join('\n\n')}`, 'grille des réalisations')
  if (usesPortfolio) {
    const v = PORTFOLIO_ASSETS.version
    html = html.replace('</head>', `<link rel="stylesheet" href="${PORTFOLIO_ASSETS.css}?v=${v}" />\n</head>`)
    html = html.replace('</body>', `<script defer src="${PORTFOLIO_ASSETS.js}?v=${v}"></script>\n</body>`)
  }
  return html
}

// ---------- sitemap.xml ----------
export function renderSitemap(articles, shell) {
  const known = new Set([...shell.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
  const added = articles.map((a) => `${SITE_URL}/${a.slug}`).filter((u) => !known.has(u))
  if (!added.length) return shell // URL existantes inchangées
  const entries = added.map((u) => `  <url>\n    <loc>${u}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`).join('')
  return shell.replace('</urlset>', `${entries}</urlset>`)
}
