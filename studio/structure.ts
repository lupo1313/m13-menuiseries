import type {StructureResolver} from 'sanity/structure'

// Menu de gauche simple, en français.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('M13 Menuiseries')
    .items([
      S.listItem().id('realisations').title('Réalisations').child(S.documentTypeList('realisation').title('Réalisations')),
      S.listItem().id('articles').title('Articles du blog').child(S.documentTypeList('article').title('Articles du blog')),
    ])
