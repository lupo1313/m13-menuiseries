// Vérifie que chaque champ lu par les requêtes du build existe dans le schéma extrait (schema.json).
import {readFileSync} from 'node:fs'
import {REALISATIONS_QUERY, ARTICLES_QUERY} from '../queries.mjs'

const schema = JSON.parse(readFileSync(new URL('../schema.json', import.meta.url), 'utf8'))
const doc = (n) => schema.find((t) => t.type === 'document' && t.name === n)?.attributes ?? {}
const checks = {
  realisation: [REALISATIONS_QUERY, ['title', 'city', 'categories', 'description', 'order', 'mainPhoto', 'beforePhoto', 'afterPhoto', 'gallery', 'visible']],
  article: [ARTICLES_QUERY, ['title', 'slug', 'shortTitle', 'lead', 'readingTime', 'category', 'excerpt', 'publishedAt', 'updatedAt', 'mainImage', 'body', 'faq', 'seo']],
}
let bad = 0
for (const [type, [query, fields]] of Object.entries(checks)) {
  const attrs = doc(type)
  for (const f of fields) {
    if (!(f in attrs)) { console.error(`✗ ${type}.${f} absent du schéma`); bad++ }
    else if (!query.includes(f)) { console.error(`✗ ${type}.${f} non lu par la requête`); bad++ }
  }
}
console.log(bad ? `${bad} problème(s)` : '✓ requêtes GROQ cohérentes avec les schémas')
process.exit(bad ? 1 : 0)
