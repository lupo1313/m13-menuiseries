import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {API_VERSION, newId} from './lib'
import {Chevron, Doc, Door, Pictures, Plus} from './icons'
import type {Go} from './M13App'

type Counts = {r: number; ad: number; ap: number}
const plural = (n: number, s: string, p = `${s}s`) => `${n} ${n > 1 ? p : s}`

export function Home({go, openUrl}: {go: Go; openUrl: (path: string) => void}) {
  const client = useClient({apiVersion: API_VERSION})
  const [c, setC] = useState<Counts | null>(null)
  useEffect(() => {
    client
      .withConfig({perspective: 'raw'})
      .fetch<Counts>(`{
        "r": count(*[_type == "realisation" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]),
        "ad": count(*[_type == "article" && _id in path("drafts.**")]),
        "ap": count(*[_type == "article" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))])
      }`)
      .then(setC)
      .catch(() => setC(null))
  }, [client])

  const realSub = !c ? '…' : c.r ? `${plural(c.r, 'chantier publié', 'chantiers publiés')}` : 'Aucun chantier publié pour l’instant'
  const artSub = !c ? '…' : [c.ap && plural(c.ap, 'article publié', 'articles publiés'), c.ad && `${plural(c.ad, 'article')} en brouillon`].filter(Boolean).join(' · ') || 'Aucun article'

  return (
    <div className="m13-home">
      <div className="m13-col">
        <div className="m13-home-top">
          <span className="m13-logo" aria-label="M13 Menuiseries">
            <Door />
            <span>
              <span className="m13-logo-m">M13</span>
              <span className="m13-logo-s">MENUISERIES</span>
            </span>
          </span>
          <h1>Mon espace</h1>
          <p className="m13-home-sub">Gestion du site M13 Menuiseries</p>
        </div>
        <nav className="m13-actions" aria-label="Actions principales">
          <button type="button" className="m13-card m13-card--primary" onClick={() => go({screen: 'chantier', id: newId()})}>
            <span className="m13-card-ico"><Plus /></span>
            <span className="m13-card-txt"><span className="m13-card-t">Ajouter un chantier</span></span>
            <Chevron />
          </button>
          <button type="button" className="m13-card" onClick={() => go({screen: 'realisations'})}>
            <span className="m13-card-ico"><Pictures /></span>
            <span className="m13-card-txt"><span className="m13-card-t">Mes réalisations</span><span className="m13-card-s">{realSub}</span></span>
            <Chevron />
          </button>
          <button type="button" className="m13-card" onClick={() => openUrl('/structure/articles')}>
            <span className="m13-card-ico"><Doc /></span>
            <span className="m13-card-txt"><span className="m13-card-t">Mes articles</span><span className="m13-card-s">{artSub}</span></span>
            <Chevron />
          </button>
        </nav>
      </div>
      <div className="m13-home-photo" aria-hidden="true" />
    </div>
  )
}
