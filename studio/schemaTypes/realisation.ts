import {defineField, defineType} from 'sanity'
import {CATEGORIES} from './categories'

export const realisation = defineType({
  name: 'realisation',
  title: 'Réalisation',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre du chantier',
      description: 'Ex. « Fenêtres cintrées sur-mesure ».',
      type: 'string',
      validation: (r) => r.required().max(80),
    }),
    defineField({
      name: 'city',
      title: 'Ville',
      description: 'Ex. « Marseille », « La Ciotat ».',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Types de prestation',
      description: 'Cochez une ou plusieurs catégories : elles servent aux filtres de la page Réalisations.',
      type: 'array',
      of: [{type: 'string'}],
      options: {list: CATEGORIES, layout: 'grid'},
      validation: (r) => r.required().min(1).unique(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Quelques lignes sur le chantier (affichée à l’agrandissement de la photo).',
      type: 'text',
      rows: 4,
      validation: (r) => r.max(400),
    }),
    defineField({
      name: 'mainPhoto',
      title: 'Photo principale',
      description: 'La photo affichée dans la grille. Avec un avant/après, mettez ici le résultat final.',
      type: 'photo',
      validation: (r) => r.required(),
    }),
    defineField({name: 'beforePhoto', title: 'Photo « Avant »', description: 'Facultatif.', type: 'photo'}),
    defineField({
      name: 'afterPhoto',
      title: 'Photo « Après »',
      description: 'Facultatif. Obligatoire si une photo « Avant » est renseignée.',
      type: 'photo',
      validation: (r) =>
        r.custom((value, ctx) =>
          (ctx.document as {beforePhoto?: unknown} | undefined)?.beforePhoto && !value
            ? 'Ajoutez la photo « Après » en plus de la photo « Avant ».'
            : true,
        ),
    }),
    defineField({
      name: 'gallery',
      title: 'Photos complémentaires',
      description: 'Autres photos du chantier (facultatif).',
      type: 'array',
      of: [{type: 'photo'}],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'order',
      title: 'Ordre d’affichage',
      description: 'Plus le nombre est petit, plus la réalisation apparaît en haut (1 = en premier).',
      type: 'number',
      initialValue: 100,
      hidden: true, // champ technique : valeur par défaut conservée, invisible pour l'utilisateur
      validation: (r) => r.required().integer().min(1),
    }),
    defineField({
      name: 'visible',
      title: 'Afficher sur le site',
      description: 'Désactivez pour masquer la réalisation sans la supprimer, puis cliquez sur « Publier ».',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [{title: 'Ordre d’affichage', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', city: 'city', media: 'mainPhoto', visible: 'visible'},
    prepare: ({title, city, media, visible}) => ({
      title,
      subtitle: `${city ?? ''}${visible === false ? ' — masqué' : ''}`,
      media,
    }),
  },
})
