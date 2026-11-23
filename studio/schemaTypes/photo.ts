import {defineField, defineType} from 'sanity'

// Photo réutilisable : description obligatoire (accessibilité + SEO).
export const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Description de la photo',
      description:
        'Une courte phrase décrivant ce que l’on voit (ex. « Fenêtres PVC blanches posées sur une façade à Marseille »).',
      type: 'string',
      validation: (r) => r.required().error('Décrivez la photo en quelques mots.'),
    }),
  ],
})
