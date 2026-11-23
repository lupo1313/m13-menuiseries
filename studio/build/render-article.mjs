// Rendu HTML d'un article Sanity dans le gabarit existant du site (même balisage, mêmes classes CSS).
// Réutilisable par le futur build de production. Aucune dépendance externe.
import {existsSync} from 'node:fs'
import path from 'node:path'

export const SITE_URL = 'https://m13menuiseries.fr'

// Projection GROQ : tout ce dont le rendu a besoin, images résolues (nom de fichier + dimensions).
export const IMG = `{alt, "file": asset->originalFilename, "url": asset->url, "id": asset->_id, "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height}`
export const ARTICLE_PROJECTION = `{
  _id, title, "slug": slug.current, shortTitle, lead, readingTime, category, cardTitle, cardCategory, cardLinkLabel, excerpt,
  publishedAt, _createdAt, updatedAt, "mainImage": mainImage${IMG},
  body[]{..., _type == "inlineImage" => {..., "image": image${IMG}}},
  faq[]{question, answer},
  seo{metaTitle, metaDescription, ogTitle, ogDescription, structuredHeadline, structuredDescription, noindex, "ogImage": ogImage${IMG}}
}`

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;')
const attr = (s) => esc(s).replace(/"/g, '&quot;')
const parisDate = (iso) => new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Paris'}).format(new Date(iso)) // AAAA-MM-JJ
const monthYear = (iso) => new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric', timeZone: 'Europe/Paris'}).format(new Date(iso))

// ---------- Texte enrichi ----------
function spans(block) {
  const defs = Object.fromEntries((block.markDefs || []).map((m) => [m._key, m]))
  // Liens externes : nouvel onglet + nofollow, comme sur les pages actuelles.
  const ext = (h) => /^https?:\/\//.test(h) && !h.startsWith(SITE_URL) ? ' target="_blank" rel="noopener nofollow"' : ''
  const open = (m) => (m === 'strong' ? '<strong>' : m === 'em' ? '<em>' : defs[m]?._type === 'link' ? `<a href="${attr(defs[m].href)}"${ext(defs[m].href)}>` : '')
  const close = (m) => (m === 'strong' ? '</strong>' : m === 'em' ? '</em>' : defs[m]?._type === 'link' ? '</a>' : '')
  let html = ''
  let stack = []
  for (const s of block.children || []) {
    const marks = (s.marks || []).filter((m) => defs[m]?._type !== 'anchor') // l'ancre devient l'id du titre
    let k = 0
    while (k < stack.length && stack[k] === marks[k]) k++
    for (const m of stack.slice(k).reverse()) html += close(m)
    for (const m of marks.slice(k)) html += open(m)
    stack = marks
    html += esc(s.text).replace(/\n/g, '<br />')
  }
  for (const m of stack.reverse()) html += close(m)
  return html
}
const anchorOf = (b) => (b.markDefs || []).find((m) => m._type === 'anchor')?.id

// Les images doivent avoir été résolues au préalable (images.mjs : src, srcM, w, h).
export function picture(img, extra = '') {
  const source = img.srcM ? `<source media="(max-width:768px)" srcset="${attr(img.srcM)}" />` : ''
  return `<picture>${source}<img src="${attr(img.src)}"${extra} alt="${attr(img.alt)}" loading="lazy" /></picture>`
}

function figure(img, siteDir, caption, indent = '        ') {
  if (!img?.src) return ''
  return `${indent}<figure>\n${indent}  ${picture(img, ` width="${img.w}" height="${img.h}"`)}\n${caption ? `${indent}  <figcaption>${esc(caption)}</figcaption>\n` : ''}${indent}</figure>`
}
export {esc, attr}

export function renderBody(body, siteDir) {
  const out = []
  const I = '        '
  for (let i = 0; i < body.length; i++) {
    const b = body[i]
    if (b._type === 'block' && b.listItem) {
      const tag = b.listItem === 'number' ? 'ol' : 'ul'
      const items = []
      while (i < body.length && body[i]._type === 'block' && body[i].listItem === b.listItem) items.push(`${I}  <li>${spans(body[i++])}</li>`)
      i--
      out.push(`${I}<${tag}>\n${items.join('\n')}\n${I}</${tag}>`)
    } else if (b._type === 'block') {
      const id = anchorOf(b)
      if (b.style === 'h2' || b.style === 'h3') out.push(`${I}<${b.style}${id ? ` id="${attr(id)}"` : ''}>${spans(b)}</${b.style}>`)
      else if (b.style === 'note') out.push(`${I}<p class="article-note"><i class="fa-solid fa-book-open" aria-hidden="true"></i> ${spans(b)}</p>`)
      else out.push(`${I}<p${id ? ` id="${attr(id)}"` : ''}>${spans(b)}</p>`)
    } else if (b._type === 'inlineImage') out.push(figure(b.image, siteDir, b.caption, I))
    else if (b._type === 'simpleTable') {
      const [head, ...rows] = b.rows || []
      const tr = (r, c) => `<tr>${(r.cells || []).map((x) => `<${c}>${esc(x)}</${c}>`).join('')}</tr>`
      out.push(`${I}<table class="article-table">\n${I}  <thead>\n${I}    ${tr(head, 'th')}\n${I}  </thead>\n${I}  <tbody>\n${rows.map((r) => `${I}    ${tr(r, 'td')}`).join('\n')}\n${I}  </tbody>\n${I}</table>`)
    } else if (b._type === 'tocBlock') {
      out.push(`${I}<div class="article-toc" aria-label="Sommaire">\n${I}  <strong>${esc(b.title)}</strong>\n${I}  <ul>\n${(b.items || []).map((x) => `${I}    <li><a href="#${attr(x.anchor)}">${esc(x.label)}</a></li>`).join('\n')}\n${I}  </ul>\n${I}</div>`)
    } else if (b._type === 'ctaBlock') {
      out.push(`${I}<div class="article-cta">\n${I}  <h3>${esc(b.title)}</h3>\n${b.text ? `${I}  <p>${esc(b.text)}</p>\n` : ''}${I}  <a href="${attr(b.buttonLink || 'contact')}" class="btn btn-primary btn-lg">${esc(b.buttonLabel || 'Demander mon devis gratuit')} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>\n${I}</div>`)
    } else throw new Error(`Bloc inconnu : ${b._type}`)
  }
  out.push(`${I}<p style="margin-top:2rem"><a href="blog" class="link-arrow"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Retour au blog</a></p>`)
  return out.join('\n\n')
}

// ---------- Page complète ----------
export function renderArticlePage(a, shell, siteDir) {
  const seo = a.seo || {}
  const url = `${SITE_URL}/${a.slug}`
  const metaTitle = seo.metaTitle || a.title
  const image = `${SITE_URL}/${(seo.ogImage || a.mainImage)?.src}`
  const head = [
    `<title>${esc(metaTitle)}</title>`,
    `<meta name="description" content="${attr(seo.metaDescription)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${seo.noindex ? 'noindex, follow' : 'index, follow'}" />`,
    '<meta name="theme-color" content="#122F4A" />',
    '<meta name="geo.region" content="FR-13" />',
    '<meta name="geo.placename" content="Marseille" />',
    '<meta property="og:type" content="article" />',
    '<meta property="og:site_name" content="M13 Menuiseries" />',
    '<meta property="og:locale" content="fr_FR" />',
    `<meta property="og:title" content="${attr(seo.ogTitle || metaTitle)}" />`,
    `<meta property="og:description" content="${attr(seo.ogDescription || seo.metaDescription)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
  ].join('\n')
  const posting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: seo.structuredHeadline || a.title,
    description: seo.structuredDescription || seo.metaDescription,
    image,
    datePublished: parisDate(a.publishedAt),
    dateModified: parisDate(a.updatedAt || a.publishedAt),
    author: {'@type': 'Organization', name: 'M13 Menuiseries', areaServed: 'Marseille, Bouches-du-Rhône, Var'},
    publisher: {'@type': 'Organization', name: 'M13 Menuiseries', logo: {'@type': 'ImageObject', url: `${SITE_URL}/assets/logo/m13-logo-horizontal-couleur.png`}},
    mainEntityOfPage: url,
  }
  const ld = [posting]
  // La FAQ visible est dans le corps de l'article ; le champ « faq » ne sert qu'aux données structurées (pas de double affichage).
  if (a.faq?.length) ld.push({'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map((q) => ({'@type': 'Question', name: q.question, acceptedAnswer: {'@type': 'Answer', text: q.answer}}))})
  const scripts = ld.map((x) => `<script type="application/ld+json">\n${JSON.stringify(x, null, 2)}\n</script>`).join('\n')
  const hero = `
      <nav class="breadcrumb" aria-label="Fil d'ariane">
        <a href="/">Accueil</a><span class="sep">/</span><a href="blog">Blog</a><span class="sep">/</span><span aria-current="page">${esc(a.shortTitle || a.title)}</span>
      </nav>
      <span class="eyebrow eyebrow-light">${esc(a.category)}</span>
      <h1>${esc(a.title)}</h1>
${a.lead ? `      <p class="lead">${esc(a.lead)}</p>\n` : ''}      <div class="article-meta">
        <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> Mis à jour en ${monthYear(a.updatedAt || a.publishedAt)}</span>
${a.readingTime ? `        <span><i class="fa-regular fa-clock" aria-hidden="true"></i> Lecture ${a.readingTime} min</span>\n` : ''}        <span><i class="fa-solid fa-user-pen" aria-hidden="true"></i> Par M13 Menuiseries</span>
      </div>
    `

  let html = shell
  const swap = (re, fn, what) => {
    if (!re.test(html)) throw new Error(`Gabarit : zone introuvable (${what})`)
    html = html.replace(re, fn)
  }
  swap(/<title>[\s\S]*?<meta name="twitter:card"[^>]*>/, () => head, 'métadonnées')
  let first = true
  swap(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, () => (first ? ((first = false), `${scripts}\n`) : ''), 'JSON-LD')
  swap(/(<section class="page-hero article-hero">\s*<div class="container">)[\s\S]*?(<\/div>\s*<\/section>)/, (_, o, c) => `${o}${hero}${c}`, 'en-tête article')
  swap(/(<div class="article-body">)[\s\S]*?(\s*<\/div>\s*<\/div>\s*<\/section>\s*<\/main>)/, (_, o, c) => `${o}\n\n${renderBody(a.body || [], siteDir)}\n${c}`, 'corps article')
  return html
}
