import {defineCliConfig} from 'sanity/cli'

// Les identifiants viennent de .env (jamais écrits en dur).
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Studio hébergé : https://m13-menuiseries.sanity.studio (identifiant public, pas un secret).
  deployment: {appId: 'jwszn9h6hlbqzh73ket21d3w'},
})
