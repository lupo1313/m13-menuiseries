// Conversion fidèle des 6 articles HTML existants vers des documents Sanity "article" (Portable Text).
// Lecture seule des fichiers du site : aucune page HTML n'est modifiée.
import {parse} from 'node-html-parser'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

export const SITE_DIR = fileURLToPath(new URL('../../', import.meta.url))
export const SLUGS = [
  'changer-fenetres-marseille',
  'guide-prix-fenetre-pvc-marseille',
  'fenetre-pvc-ou-aluminium-marseille',
  'prix-climatisation-reversible-marseille',
  'prix-volets-roulants-marseille',
  'garde-corps-verre-marseille',
]
export const docId = (slug) => `article-${slug}` // identifiant stable (brouillon : "drafts." + id)

const read = (f) => readFileSync(path.join(SITE_DIR, f), 'utf8')
const norm = (s) => (s ?? '').replace(/[ \t\r\n]+/g, ' ').trim() // conserve les espaces insécables
const keyOf = (...parts) => createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12)
const isEl = (n) => n.nodeType === 1
const tag = (n) => (n.rawTagName || '').toLowerCase()
const cls = (n, c) => isEl(n) && (n.getAttribute('class') || '').split(/\s+/).includes(c)
const isIcon = (n) => tag(n) === 'i' && /(^|\s)fa-/.test(n.getAttribute('class') || '')
const localImg = (src) => (src || '').replace(/^https:\/\/m13menuiseries\.fr\//, '').replace(/^\//, '').split('?')[0]

// ---------- Texte enrichi en ligne -> spans + markDefs ----------
function inline(node, marks, ctx, out) {
  for (const n of node.childNodes) {
    if (n.nodeType === 3) { out.push({text: n.text, marks}); continue }
    if (!isEl(n) || isIcon(n)) continue
    const t = tag(n)
    if (t === 'strong' || t === 'b') inline(n, [...marks, 'strong'], ctx, out)
    else if (t === 'em' || t === 'i') inline(n, [...marks, 'em'], ctx, out)
    else if (t === 'a') {
      const href = n.getAttribute('href') || ''
      const _key = keyOf(ctx.base, 'link', ctx.markDefs.length, href)
      ctx.markDefs.push({_key, _type: 'link', href})
      inline(n, [...marks, _key], ctx, out)
    } else if (t === 'br') out.push({text: '\n', marks})
    else if (t === 'span') inline(n, marks, ctx, out)
    else { ctx.warn(`balise en ligne non gérée <${t}> (texte conservé)`); inline(n, marks, ctx, out) }
  }
  return out
}

function spansFrom(raw, base) {
  // Normalise les espaces à travers les spans puis fusionne les spans de mêmes marques.
  const res = []
  let lastSpace = true
  for (const r of raw) {
    let t = r.text.replace(/[ \t\r\n]+/g, ' ')
    if (lastSpace && t.startsWith(' ')) t = t.slice(1)
    if (!t) continue
    lastSpace = t.endsWith(' ')
    const prev = res[res.length - 1]
    if (prev && prev.marks.join() === r.marks.join()) prev.text += t
    else res.push({text: t, marks: r.marks})
  }
  if (res.length) res[res.length - 1].text = res[res.length - 1].text.replace(/ $/, '')
  const spans = res.filter((s) => s.text).map((s, i) => ({_type: 'span', _key: keyOf(base, 's', i), text: s.text, marks: s.marks}))
  return spans.length ? spans : [{_type: 'span', _key: keyOf(base, 's', 0), text: '', marks: []}]
}

function block(el, style, base, warn, extra = {}) {
  const ctx = {base, markDefs: [], warn}
  const raw = inline(el, [], ctx, [])
  const children = spansFrom(raw, base)
  const used = new Set(children.flatMap((c) => c.marks))
  return {_type: 'block', _key: keyOf(base), style, markDefs: ctx.markDefs.filter((m) => used.has(m._key)), children, ...extra}
}

const flatText = (el, warn, what) => {
  if (el.querySelectorAll('*').some((c) => !isIcon(c))) warn(`${what} : mise en forme simplifiée en texte brut`)
  return norm(el.text)
}

// ---------- Corps de l'article ----------
function convertBody(bodyEl, slug, warn) {
  const out = []
  const origin = [] // texte original par bloc produit, pour la comparaison
  const skipped = []
  let i = 0
  const base = () => `${slug}|${i++}`
  for (const el of bodyEl.childNodes) {
    if (!isEl(el)) { if (norm(el.text)) warn(`texte hors balise ignoré : « ${norm(el.text).slice(0, 40)} »`); continue }
    const t = tag(el)
    if (t === 'p' && el.querySelector('a.link-arrow') && /Retour au blog/.test(el.text)) { skipped.push('lien « Retour au blog » (élément du gabarit)'); continue }
    if (t === 'p' || t === 'h2' || t === 'h3') {
      const style = t === 'p' ? (cls(el, 'article-note') ? 'note' : 'normal') : t
      if (t === 'p' && el.getAttribute('class') && style === 'normal') warn(`classe de paragraphe ignorée : ${el.getAttribute('class')}`)
      const b = block(el, style, base(), warn)
      const id = el.getAttribute('id')
      if (id) {
        // Ancre conservée via une annotation "anchor" posée sur tout le texte du titre.
        const _key = keyOf(b._key, 'anchor', id)
        b.markDefs.push({_key, _type: 'anchor', id})
        for (const c of b.children) c.marks = [...c.marks, _key]
        b.__anchor = id
      }
      out.push(b); origin.push({kind: t, text: norm(el.text)})
    } else if (t === 'ul' || t === 'ol') {
      for (const li of el.childNodes.filter(isEl)) {
        if (li.querySelector('ul,ol')) warn('liste imbriquée aplatie')
        out.push(block(li, 'normal', base(), warn, {listItem: t === 'ul' ? 'bullet' : 'number', level: 1}))
        origin.push({kind: 'li', text: norm(li.text)})
      }
    } else if (t === 'figure') {
      const img = el.querySelector('img')
      const cap = el.querySelector('figcaption')
      out.push({_type: 'inlineImage', _key: keyOf(base()), image: {_type: 'photo', alt: img.getAttribute('alt') || '', __file: localImg(img.getAttribute('src'))}, caption: cap ? flatText(cap, warn, 'légende') : undefined})
      origin.push({kind: 'figure', text: `${img.getAttribute('src')}|${cap ? norm(cap.text) : ''}`})
    } else if (t === 'table') {
      const rows = el.querySelectorAll('tr').map((tr, r) => ({
        _type: 'row', _key: keyOf(slug, 'tr', i, r),
        cells: tr.childNodes.filter(isEl).map((c) => flatText(c, warn, 'cellule de tableau')),
      }))
      out.push({_type: 'simpleTable', _key: keyOf(base()), rows})
      origin.push({kind: 'table', text: rows.map((r) => r.cells.join('|')).join('/')})
    } else if (t === 'div' && cls(el, 'article-toc')) {
      const items = el.querySelectorAll('li a').map((a, k) => ({_type: 'tocItem', _key: keyOf(slug, 'toc', k), label: norm(a.text), anchor: (a.getAttribute('href') || '').replace(/^#/, '')}))
      out.push({_type: 'tocBlock', _key: keyOf(base()), title: norm(el.querySelector('strong')?.text), items})
      origin.push({kind: 'toc', text: items.map((x) => `${x.label}#${x.anchor}`).join('/')})
    } else if (t === 'div' && cls(el, 'article-cta')) {
      const a = el.querySelector('a')
      out.push({_type: 'ctaBlock', _key: keyOf(base()), title: norm(el.querySelector('h3')?.text), text: flatText(el.querySelector('p'), warn, 'texte du bloc devis'), buttonLabel: norm(a?.text), buttonLink: a?.getAttribute('href')})
      origin.push({kind: 'cta', text: norm(el.text)})
    } else {
      warn(`élément non géré <${t} class="${el.getAttribute('class') || ''}"> : ${norm(el.text).slice(0, 50)}`)
    }
  }
  return {body: out, origin, skipped}
}

// ---------- Lecture d'un article + carte du blog ----------
export function buildArticle(slug) {
  const warnings = []
  const warn = (m) => warnings.push(m)
  const doc = parse(read(`${slug}.html`), {comment: false})
  const blog = parse(read('blog.html'), {comment: false})
  const meta = (sel, attr = 'content') => doc.querySelector(sel)?.getAttribute(attr)
  const ld = doc.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.innerHTML))
  const posting = ld.find((x) => x['@type'] === 'BlogPosting') || {}
  const faqLd = ld.find((x) => x['@type'] === 'FAQPage')
  const hero = doc.querySelector('.article-hero')
  const card = blog.querySelectorAll('article.blog-card').find((c) => c.querySelector('h2 a')?.getAttribute('href') === slug)
  if (!card) warn('carte absente de blog.html')
  const cardImg = card?.querySelector('img')
  const metaSpans = hero.querySelectorAll('.article-meta span').map((s) => norm(s.text))
  const reading = metaSpans.map((s) => s.match(/Lecture (\d+) min/)).find(Boolean)
  const {body, origin, skipped} = convertBody(doc.querySelector('.article-body'), slug, warn)

  const ogImg = localImg(meta('meta[property="og:image"]'))
  const mainImgFile = localImg(cardImg?.getAttribute('src'))
  const title = norm(hero.querySelector('h1').text)
  const crumb = norm(hero.querySelector('.breadcrumb [aria-current="page"]')?.text)
  const metaTitle = norm(doc.querySelector('title').text)
  const metaDescription = meta('meta[name="description"]')
  const ogTitle = meta('meta[property="og:title"]')
  const ogDescription = meta('meta[property="og:description"]')
  const toDate = (d) => (d ? `${d}T12:00:00.000Z` : undefined)

  const article = {
    _id: `drafts.${docId(slug)}`,
    _type: 'article',
    title,
    slug: {_type: 'slug', current: slug},
    shortTitle: crumb && crumb !== title ? crumb : undefined,
    lead: norm(hero.querySelector('p.lead')?.text) || undefined,
    readingTime: reading ? Number(reading[1]) : undefined,
    category: norm(hero.querySelector('.eyebrow')?.text),
    cardTitle: card && norm(card.querySelector('h2 a').text) !== title ? norm(card.querySelector('h2 a').text) : undefined,
    cardLinkLabel: card && norm(card.querySelector('.link-arrow')?.text) !== 'Lire le guide' ? norm(card.querySelector('.link-arrow')?.text) : undefined,
    cardCategory: card && norm(card.querySelector('.blog-cat')?.text) !== norm(hero.querySelector('.eyebrow')?.text) ? norm(card.querySelector('.blog-cat')?.text) : undefined,
    excerpt: norm(card?.querySelector('.blog-card-body p')?.text),
    mainImage: {_type: 'photo', alt: cardImg?.getAttribute('alt') || '', __file: mainImgFile},
    publishedAt: toDate(posting.datePublished),
    updatedAt: posting.dateModified && posting.dateModified !== posting.datePublished ? toDate(posting.dateModified) : undefined,
    body,
    faq: (faqLd?.mainEntity || []).map((q, k) => ({_type: 'faqItem', _key: keyOf(slug, 'faq', k), question: q.name, answer: q.acceptedAnswer?.text})),
    seo: {
      _type: 'seo',
      metaTitle,
      metaDescription,
      ogTitle: ogTitle && ogTitle !== metaTitle ? ogTitle : undefined,
      ogDescription: ogDescription && ogDescription !== metaDescription ? ogDescription : undefined,
      ogImage: ogImg && ogImg !== mainImgFile ? {_type: 'photo', alt: cardImg?.getAttribute('alt') || title, __file: ogImg} : undefined,
      noindex: /noindex/.test(meta('meta[name="robots"]') || ''),
      structuredHeadline: posting.headline && norm(posting.headline) !== title ? posting.headline : undefined,
      structuredDescription: posting.description && norm(posting.description) !== norm(metaDescription) ? posting.description : undefined,
    },
  }

  // ---------- Contrôles de fidélité ----------
  const checks = [] // différences non conservées = à corriger
  const notes = [] // particularités du contenu d'origine, conservées telles quelles
  const loose = (s) => norm((s ?? '').replace(/ /g, ' '))
  const eq = (label, a, b) => { if (norm(a) !== norm(b)) checks.push(`${label} : « ${norm(a).slice(0, 70)} » ≠ « ${norm(b).slice(0, 70)} »`) }
  if (posting.headline && norm(posting.headline) !== title) notes.push('titre JSON-LD différent du H1 → conservé dans « Titre technique »')
  if (article.cardTitle) notes.push(`titre de la carte différent du H1 → conservé dans « Titre sur la carte »`)
  if (article.cardCategory) notes.push(`étiquette de la carte différente → conservée dans « Étiquette sur la carte »`)
  if (article.seo.structuredDescription) notes.push('description JSON-LD propre → conservée dans « Description technique »')
  const ldImg = localImg(typeof posting.image === 'string' ? posting.image : posting.image?.url)
  if (ldImg && ldImg !== mainImgFile && ldImg !== ogImg) checks.push(`image JSON-LD (${ldImg}) ≠ image principale (${mainImgFile})`)
  if (meta('link[rel="canonical"]', 'href') !== `https://m13menuiseries.fr/${slug}`) checks.push(`canonical inattendu : ${meta('link[rel="canonical"]', 'href')}`)
  if (!cardImg?.getAttribute('alt')) checks.push('image de la carte sans texte alternatif')
  const metaNotes = metaSpans.filter((s) => !/^Lecture|^Par M13|^Mis à jour/.test(s))
  if (metaNotes.length) checks.push(`méta d'article non reprise : ${metaNotes.join(' / ')}`)
  // Sommaire <-> ancres des titres H2
  const h2 = body.filter((b) => b.style === 'h2')
  for (const toc of body.filter((b) => b._type === 'tocBlock')) for (const it of toc.items) {
    const target = h2.find((b) => b.__anchor === it.anchor)
    if (!target) checks.push(`sommaire : ancre #${it.anchor} sans titre correspondant`)
    else if (loose(target.children.map((c) => c.text).join('')) !== loose(it.label)) notes.push(`sommaire : libellé abrégé « ${it.label} » (conservé)`)
  }
  // FAQ visible (corps) vs FAQ JSON-LD
  const faqStart = h2.find((b) => b.__anchor === 'faq')
  if (faqStart) {
    const after = body.slice(body.indexOf(faqStart) + 1)
    const pairs = []
    for (let k = 0; k < after.length; k++) {
      if (after[k].style === 'h2') break
      if (after[k].style === 'h3') pairs.push({q: after[k].children.map((c) => c.text).join(''), a: after[k + 1]?.children?.map((c) => c.text).join('')})
    }
    if (pairs.length !== article.faq.length) checks.push(`FAQ : ${pairs.length} questions visibles vs ${article.faq.length} en JSON-LD`)
    const diff = pairs.filter((p, k) => article.faq[k] && (loose(p.q) !== loose(article.faq[k].question) || loose(p.a) !== loose(article.faq[k].answer))).length
    if (diff) notes.push(`FAQ : ${diff}/${pairs.length} question(s) formulée(s) différemment entre la page et le JSON-LD Google (les deux versions conservées)`)
  } else if (article.faq.length) checks.push('FAQ JSON-LD présente mais pas de section #faq visible')
  // Aller-retour : texte reconstruit depuis le Portable Text vs texte HTML original
  const ptText = (b) => {
    if (b._type === 'block') return norm(b.children.map((c) => c.text).join(''))
    if (b._type === 'inlineImage') return null
    if (b._type === 'simpleTable') return b.rows.map((r) => r.cells.join('|')).join('/')
    if (b._type === 'tocBlock') return b.items.map((x) => `${x.label}#${x.anchor}`).join('/')
    if (b._type === 'ctaBlock') return norm(`${b.title} ${b.text} ${b.buttonLabel}`)
  }
  let textDiff = 0
  body.forEach((b, k) => { const t = ptText(b); if (t !== null && t !== origin[k].text) { textDiff++; checks.push(`texte bloc ${k + 1} (${origin[k].kind}) différent`) } })
  // Liens : tous conservés ?
  const htmlLinks = doc.querySelector('.article-body').querySelectorAll('a').filter((a) => !a.classList.contains('link-arrow')).length
  const ptLinks = body.reduce((n, b) => n + (b.markDefs?.filter((m) => m._type === 'link').length || 0) + (b._type === 'ctaBlock' ? 1 : 0) + (b._type === 'tocBlock' ? b.items.length : 0), 0)
  if (htmlLinks !== ptLinks) checks.push(`liens : ${htmlLinks} dans le HTML vs ${ptLinks} convertis`)

  for (const b of body) delete b.__anchor
  const stats = {
    blocs: body.length,
    h2: h2.length,
    h3: body.filter((b) => b.style === 'h3').length,
    puces: body.filter((b) => b.listItem).length,
    tableaux: body.filter((b) => b._type === 'simpleTable').length,
    images: body.filter((b) => b._type === 'inlineImage').length,
    liens: ptLinks,
    faq: article.faq.length,
    texteDifferent: textDiff,
  }
  return {article: JSON.parse(JSON.stringify(article)), warnings, checks, notes, skipped, stats}
}

// Fichiers image à envoyer (chemins locaux relatifs au site).
export function collectFiles(article) {
  const files = []
  JSON.stringify(article, (k, v) => { if (k === '__file') files.push(v); return v })
  return [...new Set(files)]
}
