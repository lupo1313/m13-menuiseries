// Outil « Mon espace » : page d'accueil du Studio (API officielle des outils Sanity + routeur du Studio).
import {useCallback} from 'react'
import type {Tool} from 'sanity'
import {route, useRouter} from 'sanity/router'
import {css} from './styles'
import {Home} from './Home'
import {Wizard} from './Wizard'
import {Realisations} from './Realisations'
import {M13Icon} from './icons'

export type Screen = {screen?: 'chantier' | 'realisations'; id?: string}
export type Go = (s: Screen) => void

function M13App() {
  const router = useRouter()
  const st = router.state as Screen
  const go = useCallback<Go>((s) => router.navigate(s as Record<string, string>), [router])
  const openUrl = useCallback((path: string) => router.navigateUrl({path}), [router])
  let view
  if (st.screen === 'chantier' && st.id) view = <Wizard key={st.id} id={st.id} go={go} />
  else if (st.screen === 'realisations') view = <Realisations go={go} openUrl={openUrl} />
  else view = <Home go={go} openUrl={openUrl} />
  return (
    <div className="m13">
      <style>{css}</style>
      {view}
    </div>
  )
}

export const m13Tool: Tool = {
  name: 'espace',
  title: 'Mon espace',
  icon: M13Icon,
  component: M13App,
  router: route.create('/', [route.create('/:screen', [route.create('/:id')])]),
}
