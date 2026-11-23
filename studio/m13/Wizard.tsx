// Parcours « Ajouter / modifier un chantier » en 3 étapes.
// Enregistrement automatique en brouillon ; publication par l'opération officielle du Studio
// (useDocumentOperation) après contrôle des règles de validation du schéma (useValidationStatus).
import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from 'react'
import {useClient, useDocumentOperation, useEditState, useValidationStatus} from 'sanity'
import {API_VERSION, CATEGORIES, CITIES, FIELDS, FIELD_LABELS, categoryLabel, missing, newKey, photoUrl, suggestAlt, type Chantier, type Photo, type PhotoSlot} from './lib'
import {Arrow, Back, Camera, Check} from './icons'
import type {Go} from './M13App'

const TYPE = 'realisation'
const STEPS = ['Le chantier', 'Les photos', 'Publier']
type Save = {t: 'idle' | 'saving' | 'saved' | 'error'; at?: Date}
const strip = ({_id, _rev, _createdAt, _updatedAt, ...rest}: Record<string, unknown>) => rest

export function Wizard({id, go}: {id: string; go: Go}) {
  const client = useClient({apiVersion: API_VERSION})
  const cfg = client.config()
  const draftId = `drafts.${id}`
  const [doc, setDoc] = useState<Chantier | null>(null)
  const [isNew, setIsNew] = useState(true)
  const [step, setStep] = useState(0)
  const [save, setSave] = useState<Save>({t: 'idle'})
  const [loadError, setLoadError] = useState('')
  const docRef = useRef<Chantier | null>(null)
  docRef.current = doc
  const dirty = useRef(false)
  const published = useRef<Record<string, unknown> | null>(null)
  const queue = useRef<Promise<string | null>>(Promise.resolve(null))
  const lastRev = useRef<string | null>(null)
  const top = useRef<HTMLDivElement>(null)

  // Chargement : brouillon s'il existe, sinon version publiée, sinon nouveau chantier.
  useEffect(() => {
    client
      .withConfig({perspective: 'raw'})
      .fetch<Record<string, unknown>[]>(`*[_id in [$id, $d] && _type == $t]`, {id, d: draftId, t: TYPE})
      .then((docs) => {
        const draft = docs.find((d) => d._id === draftId)
        published.current = docs.find((d) => d._id === id) ?? null
        const src = (draft ?? published.current) as Chantier | undefined
        setIsNew(!src)
        setDoc(src ? {...src, order: src.order ?? 100, visible: src.visible ?? true} : {order: 100, visible: true, categories: []})
      })
      .catch(() => setLoadError('Impossible de charger le chantier. Vérifiez votre connexion.'))
  }, [client, id, draftId])

  const persist = useCallback(async (): Promise<string | null> => {
    const c = docRef.current
    if (!c || !dirty.current) return lastRev.current
    dirty.current = false
    const set: Record<string, unknown> = {}
    const unset: string[] = []
    for (const f of FIELDS) {
      const v = c[f]
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) unset.push(f)
      else set[f] = v
    }
    setSave({t: 'saving'})
    try {
      const base = published.current ? strip(published.current) : {}
      const res = await client
        .transaction()
        .createIfNotExists({...base, _id: draftId, _type: TYPE})
        .patch(draftId, (p) => p.set(set).unset(unset))
        .commit({autoGenerateArrayKeys: true})
      lastRev.current = res.transactionId
      setSave({t: 'saved', at: new Date()})
      return res.transactionId
    } catch {
      dirty.current = true
      setSave({t: 'error'})
      return null
    }
  }, [client, draftId])
  const flush = useCallback(() => (queue.current = queue.current.then(persist, persist)), [persist])

  const update = useCallback((patch: Partial<Chantier>) => {
    dirty.current = true
    setDoc((d) => ({...(d as Chantier), ...patch}))
  }, [])
  // Enregistrement automatique 1,5 s après la dernière modification.
  useEffect(() => {
    if (!doc || !dirty.current) return
    const t = setTimeout(flush, 1500)
    return () => clearTimeout(t)
  }, [doc, flush])
  // Dernière sauvegarde si l'écran est quitté.
  useEffect(() => () => void flush(), [flush])

  const goStep = (n: number) => {
    void flush()
    setStep(n)
    top.current?.closest('.m13')?.scrollTo({top: 0})
  }
  const exit = () => {
    void flush()
    go(isNew ? {} : {screen: 'realisations'})
  }

  if (loadError) return <Frame title="Chantier" onBack={() => go({})}><p className="m13-empty">{loadError}</p></Frame>
  if (!doc) return <Frame title="Chantier" onBack={() => go({})}><div className="m13-busy"><span className="m13-spin" /> Chargement…</div></Frame>

  const saveText =
    save.t === 'saving' ? 'Enregistrement…' : save.t === 'error' ? 'Échec de l’enregistrement — vérifiez la connexion' : save.t === 'saved' ? `Brouillon enregistré à ${save.at!.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}` : ''

  return (
    <Frame title={isNew ? 'Ajouter un chantier' : 'Modifier le chantier'} onBack={step ? () => goStep(step - 1) : exit} topRef={top}>
      <div className="m13-steps" role="list" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <button key={s} type="button" role="listitem" className={`m13-step${i === step ? ' is-on' : i < step ? ' is-done' : ''}`} aria-current={i === step ? 'step' : undefined} onClick={() => goStep(i)}>
            <span className="m13-step-n">{i < step ? <Check /> : i + 1}</span>
            <span className="m13-step-l">{s}</span>
          </button>
        ))}
      </div>
      <div className="m13-col">
        {step === 0 && <StepInfo doc={doc} update={update} />}
        {step === 1 && <StepPhotos doc={doc} update={update} cfg={cfg} upload={(f) => client.assets.upload('image', f, {filename: f.name})} />}
        {step === 2 && <StepPublish id={id} doc={doc} cfg={cfg} goStep={goStep} flush={flush} lastRev={lastRev} dirty={dirty} go={go} saveText={saveText} saveErr={save.t === 'error'} />}
      </div>
      {step < 2 && (
        <div className="m13-foot">
          <div className="m13-col">
            <button type="button" className="m13-btn" onClick={() => goStep(step + 1)}>Suivant <Arrow /></button>
            <div className={`m13-save${save.t === 'error' ? ' is-err' : ''}`} aria-live="polite">{saveText}</div>
          </div>
        </div>
      )}
    </Frame>
  )
}

function Frame({title, onBack, children, topRef}: {title: string; onBack: () => void; children: ReactNode; topRef?: React.Ref<HTMLDivElement>}) {
  return (
    <>
      <div className="m13-bar" ref={topRef}>
        <div className="m13-bar-in">
          <button type="button" className="m13-back" onClick={onBack} aria-label="Retour"><Back /></button>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="m13-panel">{children}</div>
    </>
  )
}

// ---------- Étape 1 ----------
function StepInfo({doc, update}: {doc: Chantier; update: (p: Partial<Chantier>) => void}) {
  const cats = doc.categories ?? []
  return (
    <>
      <h2>Le chantier</h2>
      <label className="m13-field">
        <span className="m13-label">Titre du chantier<span className="m13-req">*</span></span>
        <input className="m13-input" value={doc.title ?? ''} maxLength={80} placeholder="Ex. Rénovation de fenêtres" onChange={(e) => update({title: e.target.value})} />
      </label>
      <div className="m13-row">
        <label className="m13-field">
          <span className="m13-label">Ville<span className="m13-req">*</span></span>
          <input className="m13-input" list="m13-cities" value={doc.city ?? ''} placeholder="Marseille" autoComplete="off" onChange={(e) => update({city: e.target.value})} />
          <datalist id="m13-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="m13-field">
          <span className="m13-label">Prestation<span className="m13-req">*</span></span>
          <select className="m13-select" value={cats[0] ?? ''} onChange={(e) => update({categories: [e.target.value, ...cats.slice(1).filter((c) => c !== e.target.value)]})}>
            <option value="" disabled>Choisir…</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.title}</option>)}
          </select>
        </label>
      </div>
      {cats.length > 1 && <p className="m13-hint" style={{marginTop: -14, marginBottom: 18}}>Autres prestations conservées : {cats.slice(1).map(categoryLabel).join(', ')}</p>}
      <label className="m13-field">
        <span className="m13-label">Description <i>(facultatif)</i></span>
        <textarea className="m13-textarea" value={doc.description ?? ''} maxLength={400} placeholder="Quelques mots sur le chantier…" onChange={(e) => update({description: e.target.value})} />
      </label>
    </>
  )
}

// ---------- Étape 2 ----------
type Upload = (f: File) => Promise<{_id: string}>
type Cfg = {projectId?: string; dataset?: string}
const toPhoto = (assetId: string, alt: string): Photo => ({_type: 'photo', asset: {_type: 'reference', _ref: assetId}, alt})

function StepPhotos({doc, update, cfg, upload}: {doc: Chantier; update: (p: Partial<Chantier>) => void; cfg: Cfg; upload: Upload}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const docRef = useRef(doc)
  docRef.current = doc

  const putSlot = async (slot: PhotoSlot, file: File) => {
    setBusy(slot); setErr('')
    try {
      const a = await upload(file)
      const cur = docRef.current[slot]
      update({[slot]: toPhoto(a._id, cur?.alt?.trim() ? cur.alt : suggestAlt(slot, docRef.current))})
    } catch {
      setErr('L’envoi de la photo a échoué. Réessayez (connexion ?).')
    } finally { setBusy(null) }
  }
  const addGallery = async (files: FileList) => {
    setBusy('gallery'); setErr('')
    try {
      for (const f of Array.from(files)) {
        const a = await upload(f)
        const g = docRef.current.gallery ?? []
        const p = {...toPhoto(a._id, suggestAlt('gallery', docRef.current, g.length)), _key: newKey()}
        docRef.current = {...docRef.current, gallery: [...g, p]}
        update({gallery: docRef.current.gallery})
      }
    } catch {
      setErr('L’envoi d’une photo a échoué. Réessayez (connexion ?).')
    } finally { setBusy(null) }
  }
  const after = doc.afterPhoto
  const canReuse = !!after?.asset && after.asset._ref !== doc.mainPhoto?.asset?._ref

  return (
    <>
      <h2>Les photos</h2>
      {err && <p className="m13-check is-ko" role="alert">{err}</p>}
      <PhotoBox title="Photo principale" required hint="La photo affichée sur la carte du site." slot="mainPhoto" doc={doc} cfg={cfg} busy={busy === 'mainPhoto'} onFile={(f) => putSlot('mainPhoto', f)} update={update}>
        {canReuse && (
          <button type="button" className="m13-btn-link" onClick={() => update({mainPhoto: {...after!, _key: undefined, alt: doc.mainPhoto?.alt?.trim() ? doc.mainPhoto.alt : suggestAlt('mainPhoto', doc)}})}>
            Utiliser la photo « Après » comme photo principale
          </button>
        )}
      </PhotoBox>
      <PhotoBox title="Photo avant" optional slot="beforePhoto" doc={doc} cfg={cfg} busy={busy === 'beforePhoto'} onFile={(f) => putSlot('beforePhoto', f)} update={update} />
      <PhotoBox title="Photo après" optional={!doc.beforePhoto} required={!!doc.beforePhoto} slot="afterPhoto" doc={doc} cfg={cfg} busy={busy === 'afterPhoto'} onFile={(f) => putSlot('afterPhoto', f)} update={update} />
      <div className="m13-ph">
        <div className="m13-ph-h"><span className="m13-ph-t">Galerie complémentaire</span><span className="m13-ph-o">Facultatif</span></div>
        <div className="m13-gal">
          {(doc.gallery ?? []).map((p, i) => (
            <div className="m13-gal-i" key={p._key ?? i}>
              <img src={photoUrl(p, cfg, 400)} alt="" />
              <input className="m13-input" aria-label={`Description de la photo ${i + 1}`} value={p.alt ?? ''} onChange={(e) => update({gallery: doc.gallery!.map((g, j) => (j === i ? {...g, alt: e.target.value} : g))})} />
              <button type="button" className="m13-btn-s is-danger" style={{width: '100%', marginTop: 8}} onClick={() => update({gallery: doc.gallery!.filter((_, j) => j !== i)})}>Retirer</button>
            </div>
          ))}
          <FilePick multiple busy={busy === 'gallery'} label="Ajouter des photos" onFiles={(fs) => addGallery(fs)} />
        </div>
      </div>
    </>
  )
}

function PhotoBox({title, hint, slot, doc, cfg, busy, onFile, update, required, optional, children}: {
  title: string; hint?: string; slot: PhotoSlot; doc: Chantier; cfg: Cfg; busy: boolean; onFile: (f: File) => void
  update: (p: Partial<Chantier>) => void; required?: boolean; optional?: boolean; children?: ReactNode
}) {
  const p = doc[slot]
  return (
    <div className="m13-ph">
      <div className="m13-ph-h">
        <span className="m13-ph-t">{title}{required && <span className="m13-req">*</span>}</span>
        {optional && <span className="m13-ph-o">Facultatif</span>}
      </div>
      {p?.asset && !busy ? (
        <>
          <div className="m13-img"><img src={photoUrl(p, cfg, 900)} alt="" /></div>
          <div className="m13-img-acts">
            <FilePick compact label="Changer" onFiles={(fs) => onFile(fs[0])} />
            <button type="button" className="m13-btn-s is-danger" onClick={() => update({[slot]: undefined})}>Retirer</button>
          </div>
          <label className="m13-field" style={{marginBottom: 4}}>
            <span className="m13-label" style={{fontSize: 15}}>Description de la photo<span className="m13-req">*</span></span>
            <input className="m13-input" value={p.alt ?? ''} onChange={(e) => update({[slot]: {...p, alt: e.target.value}})} />
          </label>
          <p className="m13-hint">Proposée automatiquement si elle est vide, toujours modifiable. Elle aide Google et les personnes malvoyantes.</p>
        </>
      ) : (
        <FilePick busy={busy} label="Choisir une photo" sub={hint} onFiles={(fs) => onFile(fs[0])} />
      )}
      {children}
    </div>
  )
}

// Sélecteur natif : sur iPhone, propose Photothèque, Prendre une photo ou Fichiers.
function FilePick({label, sub, busy, multiple, compact, onFiles}: {label: string; sub?: string; busy?: boolean; multiple?: boolean; compact?: boolean; onFiles: (f: FileList) => void}) {
  const ref = useRef<HTMLInputElement>(null)
  const input = (
    <input ref={ref} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = '' }} />
  )
  if (busy) return <div className="m13-busy" role="status"><span className="m13-spin" /> Envoi de la photo…</div>
  if (compact) return <>{input}<button type="button" className="m13-btn-s" onClick={() => ref.current?.click()}>{label}</button></>
  return (
    <>
      {input}
      <button type="button" className="m13-drop" onClick={() => ref.current?.click()}>
        <Camera />{label}{sub && <small>{sub}</small>}
      </button>
    </>
  )
}

// ---------- Étape 3 ----------
function StepPublish({id, doc, cfg, goStep, flush, lastRev, dirty, go, saveText, saveErr}: {
  id: string; doc: Chantier; cfg: Cfg; goStep: (n: number) => void; flush: () => Promise<string | null>
  lastRev: React.MutableRefObject<string | null>; dirty: React.MutableRefObject<boolean>; go: Go; saveText: string; saveErr: boolean
}) {
  const ops = useDocumentOperation(id, TYPE)
  const edit = useEditState(id, TYPE)
  const val = useValidationStatus(id, TYPE)
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'publishing' | 'done' | 'error'>('idle')
  const [errors, setErrors] = useState<string[]>([])
  const [tick, setTick] = useState(0)
  const started = useRef(0)
  const todo = useMemo(() => missing(doc), [doc])

  const onPublish = async () => {
    setErrors([])
    setPhase('waiting')
    started.current = Date.now()
    const rev = await flush()
    if (dirty.current || (rev === null && !edit.draft)) { setPhase('error'); setErrors(['Le brouillon n’a pas pu être enregistré. Vérifiez la connexion puis réessayez.']); return }
  }

  // Publication dès que le Studio voit la dernière version du brouillon et a fini de la valider.
  useEffect(() => {
    if (phase === 'waiting') {
      const fresh = edit.ready && edit.draft && (!lastRev.current || edit.draft._rev === lastRev.current)
      if (fresh && !val.isValidating && !ops.publish.disabled) {
        const errs = val.validation.filter((m) => m.level === 'error').map((m) => `${FIELD_LABELS[String(m.path?.[0])] ?? 'Champ'} : ${m.message}`)
        if (errs.length) { setErrors(errs); setPhase('error'); return }
        setPhase('publishing')
        ops.publish.execute()
        return
      }
      if (edit.ready && !edit.draft && edit.published && !dirty.current) { setPhase('done'); return }
    }
    if (phase === 'publishing' && edit.ready && !edit.draft && edit.published) setPhase('done')
    if ((phase === 'waiting' || phase === 'publishing') && Date.now() - started.current > 20000) {
      setPhase('error'); setErrors(['La publication prend plus de temps que prévu. Vérifiez dans « Mes réalisations ».'])
    }
  }, [phase, edit, val, ops, lastRev, dirty, tick])
  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'publishing') return
    const t = setInterval(() => setTick((n) => n + 1), 2000) // relance le contrôle du délai
    return () => clearInterval(t)
  }, [phase])

  if (phase === 'done') {
    return (
      <div className="m13-done">
        <div className="m13-done-ico"><Check /></div>
        <h2>Chantier publié</h2>
        <p className="m13-sum-m">Il apparaîtra sur le site lors de la prochaine mise à jour du site.</p>
        <div style={{display: 'grid', gap: 12, marginTop: 24}}>
          <button type="button" className="m13-btn" onClick={() => go({})}>Retour à mon espace</button>
          <button type="button" className="m13-btn m13-btn--ghost" onClick={() => go({screen: 'realisations'})}>Voir mes réalisations</button>
        </div>
      </div>
    )
  }

  const photos = [doc.mainPhoto, doc.beforePhoto, doc.afterPhoto].filter((p) => p?.asset).length + (doc.gallery?.length ?? 0)
  const alreadyLive = edit.ready && !edit.draft && !!edit.published && !dirty.current
  const working = phase === 'waiting' || phase === 'publishing'
  return (
    <>
      <h2>Publier</h2>
      <div className="m13-sum">
        {doc.mainPhoto?.asset && <img src={photoUrl(doc.mainPhoto, cfg, 900)} alt="" />}
        <div className="m13-sum-b">
          <p className="m13-sum-t">{doc.title || 'Sans titre'}</p>
          <p className="m13-sum-m">{[doc.city, (doc.categories ?? []).map(categoryLabel).join(', ')].filter(Boolean).join(' · ') || 'Ville et prestation à compléter'}</p>
          {doc.description && <p className="m13-sum-d">{doc.description}</p>}
          <div className="m13-chips">
            <span className="m13-chip">{photos} photo{photos > 1 ? 's' : ''}</span>
            {doc.beforePhoto?.asset && doc.afterPhoto?.asset && <span className="m13-chip">Avant / Après</span>}
            {!!doc.gallery?.length && <span className="m13-chip">Galerie : {doc.gallery.length}</span>}
          </div>
        </div>
      </div>
      {todo.length ? (
        <ul className="m13-check is-ko" aria-label="À compléter avant de publier">
          {todo.map((t) => (
            <li key={t.label}>{t.label}<button type="button" className="m13-btn-link" onClick={() => goStep(t.step)}>Compléter</button></li>
          ))}
        </ul>
      ) : (
        <ul className="m13-check is-ok"><li>Tout est prêt pour la publication.</li></ul>
      )}
      {!!errors.length && <ul className="m13-check is-ko" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <div className="m13-foot" style={{position: 'static', background: 'none', padding: 0}}>
        <div style={{display: 'grid', gap: 12}}>
          <button type="button" className="m13-btn" disabled={!!todo.length || working || alreadyLive} onClick={onPublish}>
            {working ? <><span className="m13-spin" /> Publication…</> : alreadyLive ? 'Déjà en ligne' : 'Publier'}
          </button>
          <button type="button" className="m13-btn m13-btn--ghost" disabled={working} onClick={() => { dirty.current = dirty.current || !edit.draft; void flush() }}>
            Enregistrer en brouillon
          </button>
          <div className={`m13-save${saveErr ? ' is-err' : ''}`} aria-live="polite">{saveText || (edit.draft ? 'Brouillon enregistré' : '')}</div>
        </div>
      </div>
    </>
  )
}
