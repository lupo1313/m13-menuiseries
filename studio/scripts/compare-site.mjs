// Compare chaque fichier généré (import/site-preview) au fichier actuel du site, balise par balise.
import {parse} from 'node-html-parser'
import {readFileSync, readdirSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {SITE_DIR} from './articles-lib.mjs'

const DIR = new URL('../import/site-preview/', import.meta.url)
const norm = (s) => s.replace(/[ \t\r\n]+/g, ' ').trim()
const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v)

function tokens(html) {
  const out = []
  const walk = (n) => {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) { const t = norm(c.text); if (t) out.push(`« ${t} »`); continue }
      if (c.nodeType !== 1) continue
      const tag = c.rawTagName.toLowerCase()
      if (tag === 'script' && c.getAttribute('type') === 'application/ld+json') { out.push(JSON.stringify(sortKeys(JSON.parse(c.innerHTML)))); continue }
      const attrs = Object.entries(c.attributes).sort().map(([k, v]) => `${k}="${norm(v)}"`).join(' ')
      out.push(`<${tag}${attrs ? ' ' + attrs : ''}>`)
      walk(c)
      out.push(`</${tag}>`)
    }
  }
  walk(parse(html, {comment: false}))
  return out
}
function diff(a, b) {
  const n = a.length, m = b.length
  const L = Array.from({length: n + 1}, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const res = []
  let i = 0, j = 0
  while (i < n && j < m) { if (a[i] === b[j]) { i++; j++ } else if (L[i + 1][j] >= L[i][j + 1]) res.push(`- ${a[i++]}`); else res.push(`+ ${b[j++]}`) }
  while (i < n) res.push(`- ${a[i++]}`)
  while (j < m) res.push(`+ ${b[j++]}`)
  return res
}

const lines = ['# Comparaison fichiers générés / fichiers actuels', '']
for (const f of readdirSync(DIR).filter((x) => /\.(html|xml)$/.test(x))) {
  const d = diff(tokens(readFileSync(path.join(SITE_DIR, f), 'utf8')), tokens(readFileSync(new URL(f, DIR), 'utf8')))
  lines.push(`## ${f} — ${d.length ? `${d.length} écart(s)` : '✓ identique'}`)
  for (const x of d.slice(0, 10)) lines.push(`    ${x.slice(0, 170)}`)
  if (d.length > 10) lines.push(`    … ${d.length - 10} autre(s)`)
}
writeFileSync(new URL('../import/rapport-comparaison-site.md', import.meta.url), lines.join('\n'))
console.log(lines.join('\n'))
