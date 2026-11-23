// Requêtes GROQ prévues pour le futur build statique Node (contenus PUBLIÉS uniquement).
// Utilisation : client Sanity en perspective "published" + jeton de lecture stocké en secret GitHub.
export const REALISATIONS_QUERY = `*[_type == "realisation" && visible != false] | order(order asc, _createdAt asc){
  _id, title, city, categories, description, order,
  "mainPhoto": mainPhoto{alt, asset->{url, metadata{dimensions}}},
  "beforePhoto": beforePhoto{alt, asset->{url}},
  "afterPhoto": afterPhoto{alt, asset->{url}},
  "gallery": gallery[]{alt, asset->{url}}
}`

export const ARTICLES_QUERY = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
  _id, title, "slug": slug.current, shortTitle, lead, readingTime, category, cardTitle, cardCategory, excerpt, publishedAt, updatedAt,
  "mainImage": mainImage{alt, asset->{url, metadata{dimensions}}},
  body[]{..., _type == "inlineImage" => {..., image{alt, asset->{url}}}},
  faq[]{question, answer},
  seo{metaTitle, metaDescription, ogTitle, ogDescription, structuredHeadline, structuredDescription, noindex, "ogImage": ogImage{alt, asset->{url}}}
}`
