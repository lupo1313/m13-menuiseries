// Outils partagés de l'espace M13 (aucun jeton : le client Sanity utilise la session de l'utilisateur connecté).
import {CATEGORIES} from '../schemaTypes/categories'

export const API_VERSION = '2025-02-19'
export {CATEGORIES}

export type Photo = {_type: 'photo'; _key?: string; asset: {_type: 'reference'; _ref: string}; alt?: string; hotspot?: unknown; crop?: unknown}
export type Chantier = {
  title?: string
  city?: string
  categories?: string[]
  description?: string
  mainPhoto?: Photo
  beforePhoto?: Photo
  afterPhoto?: Photo
  gallery?: Photo[]
  order?: number
  visible?: boolean
}
export const FIELDS = ['title', 'city', 'categories', 'description', 'mainPhoto', 'beforePhoto', 'afterPhoto', 'gallery', 'order', 'visible'] as const
export type PhotoSlot = 'mainPhoto' | 'beforePhoto' | 'afterPhoto'

export const CITIES = ['Marseille', 'Aubagne', 'La Ciotat', 'Cassis', 'Aix-en-Provence', 'Allauch', 'Plan-de-Cuques', 'Gémenos', 'Les Pennes-Mirabeau', 'Septèmes-les-Vallons', 'Carry-le-Rouet', 'Martigues']

export const newKey = () => Math.random().toString(36).slice(2, 12)
export const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${newKey()}${newKey()}`)
export const categoryLabel = (v?: string) => CATEGORIES.find((c) => c.value === v)?.title ?? ''

// URL d'aperçu d'une image Sanity à partir de sa référence (image-<hash>-<l>x<h>-<ext>).
export function photoUrl(p: Photo | undefined, cfg: {projectId?: string; dataset?: string}, w = 600) {
  const m = p?.asset?._ref?.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/)
  return m ? `https://cdn.sanity.io/images/${cfg.projectId}/${cfg.dataset}/${m[1]}-${m[2]}.${m[3]}?w=${w}&fit=max&auto=format` : ''
}

const lcFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s)
// Description proposée pour une photo (jamais imposée : utilisée seulement si la description est vide).
export function suggestAlt(slot: PhotoSlot | 'gallery', c: Chantier, index = 0) {
  const place = [c.title?.trim(), c.city?.trim() && `à ${c.city.trim()}`].filter(Boolean).join(' ') || 'Chantier M13 Menuiseries'
  if (slot === 'beforePhoto') return `Avant travaux : ${lcFirst(place)}`
  if (slot === 'afterPhoto') return `Après travaux : ${lcFirst(place)}`
  if (slot === 'gallery') return `${place}, photo ${index + 2}`
  return place
}

// Contrôles affichés à l'étape « Publier » (les règles du schéma Sanity sont vérifiées en plus).
export function missing(c: Chantier) {
  const out: {label: string; step: number}[] = []
  if (!c.title?.trim()) out.push({label: 'Le titre du chantier', step: 0})
  if (!c.city?.trim()) out.push({label: 'La ville', step: 0})
  if (!c.categories?.length) out.push({label: 'Le type de prestation', step: 0})
  if (!c.mainPhoto?.asset) out.push({label: 'La photo principale', step: 1})
  for (const [k, l] of [['mainPhoto', 'principale'], ['beforePhoto', '« Avant »'], ['afterPhoto', '« Après »']] as const) {
    if (c[k]?.asset && !c[k]?.alt?.trim()) out.push({label: `La description de la photo ${l}`, step: 1})
  }
  if (c.beforePhoto?.asset && !c.afterPhoto?.asset) out.push({label: 'La photo « Après » (une photo « Avant » est ajoutée)', step: 1})
  if ((c.gallery || []).some((p) => !p.alt?.trim())) out.push({label: 'La description des photos complémentaires', step: 1})
  return out
}

// Champs du schéma → libellés simples pour les messages de validation Sanity.
export const FIELD_LABELS: Record<string, string> = {
  title: 'Titre', city: 'Ville', categories: 'Prestation', description: 'Description', mainPhoto: 'Photo principale',
  beforePhoto: 'Photo « Avant »', afterPhoto: 'Photo « Après »', gallery: 'Photos complémentaires', order: 'Ordre', visible: 'Affichage',
}
