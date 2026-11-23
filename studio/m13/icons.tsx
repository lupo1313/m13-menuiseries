// Icônes au trait (SVG) de l'espace M13.
const P = {fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round'} as const

export const Plus = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={2.6} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
export const Chevron = ({className = 'm13-chev'}: {className?: string}) => <svg className={className} viewBox="0 0 24 24" {...P} strokeWidth={2.4} aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
export const Back = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={2.4} aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
export const Arrow = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={2.2} aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
export const Pictures = () => <svg viewBox="0 0 32 32" {...P} strokeWidth={2.2} aria-hidden="true"><rect x="3" y="5" width="26" height="22" rx="2.5" /><circle cx="11" cy="12" r="2.5" /><path d="M3.5 24l8-8 6 6 4-4 7 7" /></svg>
export const Doc = () => <svg viewBox="0 0 32 32" {...P} strokeWidth={2.2} aria-hidden="true"><path d="M8 3h11l7 7v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M19 3v7h7M11 17h10M11 22h10" /></svg>
export const Camera = () => <svg viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
export const Check = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={2.6} aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>

// Porte entrouverte (logo M13) et icône de l'espace de travail.
export const Door = () => (
  <svg viewBox="0 0 44 76" fill="none" stroke="#bb8f60" strokeWidth={3} strokeLinejoin="round" aria-hidden="true">
    <path d="M6 73V9L36 2v71" />
    <path d="M36 73h-30" />
    <path d="M29 39.5v3" strokeWidth={2.6} strokeLinecap="round" />
  </svg>
)
export const M13Icon = () => (
  <svg viewBox="0 0 32 32" width="1em" height="1em" aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#13304b" />
    <path d="M11 25V8.5l11-2.5v19M10 25h13" fill="none" stroke="#bb8f60" strokeWidth={2.2} strokeLinejoin="round" />
  </svg>
)
