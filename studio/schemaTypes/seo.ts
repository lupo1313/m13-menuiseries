import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'Référencement (Google)',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Titre pour Google',
      description: 'Idéalement 50 à 60 caractères. Laissé vide : le titre de l’article est utilisé.',
      type: 'string',
      validation: (r) => r.max(70).warning('Au-delà de 60 caractères, Google risque de couper le titre.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Description pour Google',
      description: 'Idéalement 140 à 160 caractères : la phrase affichée sous le titre dans les résultats.',
      type: 'text',
      rows: 3,
      validation: (r) =>
        r.required().max(170).warning('Au-delà de 160 caractères, Google risque de couper la description.'),
    }),
    defineField({
      name: 'ogTitle',
      title: 'Titre de partage (réseaux sociaux)',
      description: 'Facultatif. Par défaut : le titre pour Google.',
      type: 'string',
    }),
    defineField({
      name: 'ogDescription',
      title: 'Description de partage (réseaux sociaux)',
      description: 'Facultatif. Par défaut : la description pour Google.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ogImage',
      title: 'Image de partage (réseaux sociaux)',
      description: 'Facultatif. Par défaut : l’image principale de l’article.',
      type: 'photo',
    }),
    defineField({name: 'noindex', title: 'Ne pas référencer sur Google', type: 'boolean', initialValue: false}),
    defineField({
      name: 'structuredHeadline',
      title: 'Titre technique (données structurées)',
      description: 'Facultatif, réservé aux réglages avancés. Laissé vide : le titre de l’article est utilisé.',
      type: 'string',
      fieldset: 'advanced',
    }),
    defineField({
      name: 'structuredDescription',
      title: 'Description technique (données structurées)',
      description: 'Facultatif, réservé aux réglages avancés. Laissé vide : la description pour Google est utilisée.',
      type: 'text',
      rows: 2,
      fieldset: 'advanced',
    }),
  ],
  fieldsets: [{name: 'advanced', title: 'Avancé', options: {collapsible: true, collapsed: true}}],
})
