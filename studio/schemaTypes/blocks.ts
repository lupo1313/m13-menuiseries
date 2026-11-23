import {defineArrayMember, defineField, defineType} from 'sanity'

// Tableau simple (comme les tableaux de prix des articles actuels).
export const simpleTable = defineType({
  name: 'simpleTable',
  title: 'Tableau',
  type: 'object',
  fields: [
    defineField({name: 'caption', title: 'Légende (facultatif)', type: 'string'}),
    defineField({
      name: 'rows',
      title: 'Lignes',
      description: 'La première ligne est l’en-tête du tableau.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [defineField({name: 'cells', title: 'Cellules', type: 'array', of: [{type: 'string'}]})],
          preview: {select: {cells: 'cells'}, prepare: ({cells}) => ({title: (cells ?? []).join(' | ')})},
        }),
      ],
      validation: (r) => r.required().min(2),
    }),
  ],
  preview: {select: {title: 'caption'}, prepare: ({title}) => ({title: title || 'Tableau'})},
})

// Bloc « Demander un devis » (article-cta).
export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'Bloc « Demander un devis »',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Titre', type: 'string', initialValue: 'Un projet ? Demandez votre devis gratuit'}),
    defineField({name: 'text', title: 'Texte', type: 'text', rows: 2}),
    defineField({name: 'buttonLabel', title: 'Texte du bouton', type: 'string', initialValue: 'Demander mon devis gratuit'}),
    defineField({name: 'buttonLink', title: 'Lien du bouton', type: 'string', initialValue: 'contact'}),
  ],
  preview: {select: {title: 'title'}},
})

// Sommaire de l'article : chaque entrée pointe vers un titre de section (ancre).
export const tocBlock = defineType({
  name: 'tocBlock',
  title: 'Sommaire',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Titre du sommaire', type: 'string', initialValue: 'Au sommaire'}),
    defineField({
      name: 'items',
      title: 'Entrées',
      description: 'Le texte doit être identique au « Titre de section » visé.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tocItem',
          fields: [
            defineField({name: 'label', title: 'Texte', type: 'string', validation: (r) => r.required()}),
            defineField({
              name: 'anchor',
              title: 'Ancre (technique)',
              description: 'Ex. « prix » → lien vers #prix. Minuscules et tirets.',
              type: 'string',
              validation: (r) => r.required().regex(/^[a-z0-9-]+$/),
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'anchor'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title'}, prepare: ({title}) => ({title: title || 'Sommaire'})},
})

// Image dans le texte.
export const inlineImage = defineType({
  name: 'inlineImage',
  title: 'Image dans le texte',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Photo', type: 'photo', validation: (r) => r.required()}),
    defineField({name: 'caption', title: 'Légende (facultatif)', type: 'string'}),
  ],
  preview: {select: {title: 'caption', media: 'image'}, prepare: ({title, media}) => ({title: title || 'Image', media})},
})
