// Simulation locale : convertit les 6 articles et écrit un rapport, sans aucun appel à Sanity.
import {mkdirSync, writeFileSync, existsSync} from 'node:fs'
import path from 'node:path'
import {buildArticle, collectFiles, SLUGS, SITE_DIR} from './articles-lib.mjs'

const outDir = new URL('../import/', import.meta.url)
mkdirSync(outDir, {recursive: true})
const lines = ['# Simulation d’import des articles (aucune écriture dans Sanity)', '']
const all = []
let problems = 0
for (const slug of SLUGS) {
  const r = buildArticle(slug)
  all.push(r.article)
  const missing = collectFiles(r.article).filter((f) => !existsSync(path.join(SITE_DIR, f)))
  problems += r.checks.length + r.warnings.length + missing.length
  lines.push(`## ${slug}`, '', `- ${Object.entries(r.stats).map(([k, v]) => `${k}: ${v}`).join(' · ')}`)
  lines.push(`- images : ${collectFiles(r.article).length}${missing.length ? ` — MANQUANTES : ${missing.join(', ')}` : ''}`)
  if (r.skipped.length) lines.push(`- ignoré : ${r.skipped.join(' ; ')}`)
  for (const w of r.warnings) lines.push(`- ⚠ ${w}`)
  for (const c of r.checks) lines.push(`- ✗ ${c}`)
  for (const n of r.notes) lines.push(`- ℹ ${n}`)
  if (!r.warnings.length && !r.checks.length && !missing.length) lines.push('- ✓ aucune différence détectée')
  lines.push('')
}
writeFileSync(new URL('articles.json', outDir), JSON.stringify(all, null, 2))
writeFileSync(new URL('rapport-simulation.md', outDir), lines.join('\n'))
console.log(lines.join('\n'))
console.log(problems ? `\n${problems} point(s) à examiner` : '\n✓ conversion fidèle pour les 6 articles')
