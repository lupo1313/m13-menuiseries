import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {frFRLocale} from '@sanity/locale-fr-fr'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {m13Tool} from './m13/M13App'
import {m13Theme} from './m13/theme'
import {M13Icon} from './m13/icons'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) {
  throw new Error(
    "SANITY_STUDIO_PROJECT_ID manquant : copiez .env.example en .env et renseignez l'identifiant du projet « M13 Menuiseries ».",
  )
}

export default defineConfig({
  name: 'm13',
  title: 'M13 Menuiseries',
  projectId,
  dataset,
  icon: M13Icon,
  theme: m13Theme,
  plugins: [frFRLocale(), structureTool({structure, title: 'Éditeur complet'}), visionTool()],
  // « Mon espace » en premier : c'est la page d'accueil du Studio.
  tools: (prev) => [m13Tool, ...prev],
  schema: {types: schemaTypes},
})
