import {defineArrayMember, defineField, defineType} from 'sanity'

export const article = defineType({
  name: 'article',
  title: 'Article du blog',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre de l’article',
      type: 'string',
      validation: (r) => r.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Adresse de la page (URL)',
      description:
        'Ex. « prix-volets-roulants-marseille » → m13menuiseries.fr/prix-volets-roulants-marseille. ATTENTION : ne la modifiez pas pour un article déjà publié (le lien existant ne fonctionnerait plus).',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (r) =>
        r.required().custom((s) => {
          const v = s?.current
          if (!v) return true
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)
            ? true
            : 'Uniquement des minuscules, chiffres et tirets (sans accent ni espace).'
        }),
    }),
    defineField({
      name: 'shortTitle',
      title: 'Titre court (fil d’Ariane)',
      description: 'Facultatif. Ex. « Changer ses fenêtres à Marseille ». Laissé vide : le titre est utilisé.',
      type: 'string',
    }),
    defineField({
      name: 'lead',
      title: 'Introduction sous le titre',
      description: 'Le paragraphe affiché sous le grand titre de l’article.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'readingTime',
      title: 'Durée de lecture (minutes)',
      type: 'number',
      validation: (r) => r.integer().min(1),
    }),
    defineField({
      name: 'category',
      title: 'Étiquette',
      description: 'Affichée au-dessus du titre de l’article. Ex. « Fenêtres · Guide complet ».',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'cardTitle',
      title: 'Titre sur la carte du blog (facultatif)',
      description: 'Laissé vide : le titre de l’article est utilisé.',
      type: 'string',
    }),
    defineField({
      name: 'cardLinkLabel',
      title: 'Texte du lien sur la carte du blog (facultatif)',
      description: 'Laissé vide : « Lire le guide ».',
      type: 'string',
    }),
    defineField({
      name: 'cardCategory',
      title: 'Étiquette sur la carte du blog (facultatif)',
      description: 'Laissé vide : l’étiquette de l’article est utilisée.',
      type: 'string',
    }),
    defineField({
      name: 'excerpt',
      title: 'Résumé (liste du blog)',
      description: '1 à 2 phrases affichées sur la carte de l’article.',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(240),
    }),
    defineField({name: 'mainImage', title: 'Image principale', type: 'photo', validation: (r) => r.required()}),
    defineField({
      name: 'publishedAt',
      title: 'Date de publication',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({name: 'updatedAt', title: 'Dernière mise à jour (facultatif)', type: 'datetime'}),
    defineField({
      name: 'body',
      title: 'Contenu de l’article',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Paragraphe', value: 'normal'},
            {title: 'Titre de section', value: 'h2'},
            {title: 'Sous-titre', value: 'h3'},
            {title: 'Encadré « À lire aussi »', value: 'note'},
          ],
          lists: [
            {title: 'Liste à puces', value: 'bullet'},
            {title: 'Liste numérotée', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Gras', value: 'strong'},
              {title: 'Italique', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Lien',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'Adresse du lien',
                    description: 'Lien interne : /contact — lien externe : https://…',
                    type: 'string',
                    validation: (r) => r.required(),
                  }),
                ],
              },
              {
                name: 'anchor',
                type: 'object',
                title: 'Ancre (technique)',
                fields: [
                  defineField({
                    name: 'id',
                    title: 'Identifiant de l’ancre',
                    description: 'Utilisé par le sommaire (ex. « prix » → #prix). Minuscules et tirets.',
                    type: 'string',
                    validation: (r) => r.required().regex(/^[a-z0-9-]+$/),
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({type: 'inlineImage'}),
        defineArrayMember({type: 'simpleTable'}),
        defineArrayMember({type: 'ctaBlock'}),
        defineArrayMember({type: 'tocBlock'}),
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'faq',
      title: 'Questions fréquentes (facultatif)',
      description: 'Affichées en bas de l’article et utilisées par Google (résultats enrichis).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({name: 'question', title: 'Question', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'answer', title: 'Réponse', type: 'text', rows: 3, validation: (r) => r.required()}),
          ],
          preview: {select: {title: 'question'}},
        }),
      ],
    }),
    defineField({name: 'seo', title: 'Référencement (Google)', type: 'seo'}),
  ],
  orderings: [{title: 'Date (récent en premier)', name: 'dateDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'slug.current', media: 'mainImage'},
    prepare: ({title, subtitle, media}) => ({title, subtitle: subtitle ? `/${subtitle}` : 'URL à définir', media}),
  },
})
