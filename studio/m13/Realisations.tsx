// Liste « Mes réalisations » : brouillons et publiées, ouverture dans le parcours simplifié.
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {API_VERSION, newId, photoUrl, type Photo} from './lib'
import {Back, Chevron, Plus} from './icons'
import type {Go} from './M13App'

type Row = {_id: string; _updatedAt: string; title?: string; city?: string; mainPhoto?: Photo; order?: number; visible?: boolean}
type Item = Row & {base: string; status: 'pub' | 'draft' | 'changed'}

export function Realisations({go, openUrl}: {go: Go; openUrl: (path: string) => void}) {
  const client = useClient({apiVersion: API_VERSION})
  const cfg = client.config()
  const [items, setItems] = useState<Item[] | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    client
      .withConfig({perspective: 'raw'})
      .fetch<Row[]>(`*[_type == "realisation" && !(_id in path("versions.**"))]{_id, _updatedAt, title, city, mainPhoto, order, visible}`)
      .then((rows) => {
        const by = new Map<string, {draft?: Row; pub?: Row}>()
        for (const r of rows) {
          const base = r._id.replace(/^drafts\./, '')
          const e = by.get(base) ?? {}
          if (r._id.startsWith('drafts.')) e.draft = r
          else e.pub = r
          by.set(base, e)
        }
        const list = [...by.entries()].map(([base, {draft, pub}]) => ({...(draft ?? pub)!, base, status: (draft && pub ? 'changed' : draft ? 'draft' : 'pub') as Item['status']}))
        list.sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || b._updatedAt.localeCompare(a._updatedAt))
        setItems(list)
      })
      .catch(() => setErr(true))
  }, [client])

  const label = {pub: 'Publié', draft: 'Brouillon', changed: 'Modifications non publiées'}
  return (
    <>
      <div className="m13-bar">
        <div className="m13-bar-in">
          <button type="button" className="m13-back" onClick={() => go({})} aria-label="Retour"><Back /></button>
          <h1>Mes réalisations</h1>
        </div>
      </div>
      <div className="m13-panel" style={{paddingTop: 22}}>
        <div className="m13-col">
          <button type="button" className="m13-card m13-card--primary" style={{minHeight: 76, boxShadow: 'none'}} onClick={() => go({screen: 'chantier', id: newId()})}>
            <span className="m13-card-ico" style={{width: 44, height: 44}}><Plus /></span>
            <span className="m13-card-txt"><span className="m13-card-t" style={{fontSize: 20}}>Ajouter un chantier</span></span>
            <Chevron />
          </button>
          {err && <p className="m13-empty">Impossible de charger la liste. Vérifiez votre connexion.</p>}
          {!items && !err && <div className="m13-busy"><span className="m13-spin" /> Chargement…</div>}
          {items && !items.length && <p className="m13-empty">Aucun chantier pour l’instant.</p>}
          {items && !!items.length && (
            <div className="m13-list" style={{marginTop: 18}}>
              {items.map((it) => (
                <button key={it.base} type="button" className="m13-item" onClick={() => go({screen: 'chantier', id: it.base})}>
                  {it.mainPhoto?.asset ? <img src={photoUrl(it.mainPhoto, cfg, 200)} alt="" /> : <span className="m13-noimg" />}
                  <span style={{flex: 1, minWidth: 0}}>
                    <span className="m13-item-t">{it.title || 'Sans titre'}</span>
                    <span className="m13-item-s">{it.city || '—'}{it.visible === false ? ' · masqué sur le site' : ''}</span>
                    <span className={`m13-tag ${it.status === 'pub' ? 'm13-tag--pub' : 'm13-tag--draft'}`}>{label[it.status]}</span>
                  </span>
                  <Chevron />
                </button>
              ))}
            </div>
          )}
          <button type="button" className="m13-btn-link m13-more" onClick={() => openUrl('/structure/realisations')}>Ouvrir l’éditeur complet</button>
        </div>
      </div>
    </>
  )
}
