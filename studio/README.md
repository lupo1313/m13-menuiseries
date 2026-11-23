# Sanity Studio — M13 Menuiseries (préparation locale)

1. `copy .env.example .env` puis renseigner `SANITY_STUDIO_PROJECT_ID` (et le dataset) :
   https://www.sanity.io/manage → projet « M13 Menuiseries » → identifiant du projet (Project ID) ; dataset dans l'onglet « Datasets ».
2. `npm install` puis `npm run dev` (Studio sur http://localhost:3333).
3. Contrôles : `npm run typecheck`, `npm run validate`, `npm run check:queries`.

Aucun jeton n'est requis pour cette étape. Le jeton de lecture du futur build restera un secret GitHub.
Ce dossier n'est jamais publié sur Hostinger (hors liste blanche de `package-deploy.ps1`).
