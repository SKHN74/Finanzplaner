import type { ReactNode } from 'react'

export function Punkt({ text }: { text: string }) {
  return <span className="punkt" aria-hidden="true">{text.replace('[TEST] ', '').trim().charAt(0).toUpperCase() || '•'}</span>
}

export function Eintrag({ titel, unter, rechts, onClick, gedimmt }: { titel: string; unter?: ReactNode; rechts?: ReactNode; onClick?: () => void; gedimmt?: boolean }) {
  return (
    <button type="button" className={`eintrag ${gedimmt ? 'gedimmt' : ''}`} onClick={onClick}>
      <Punkt text={titel} />
      <span className="haupt"><span className="t">{titel}</span>{unter && <span className="s">{unter}</span>}</span>
      {rechts}
    </button>
  )
}

export function Leer({ children }: { children: ReactNode }) {
  return <p className="gedaempft klein">{children}</p>
}

export function Balken({ anteil, ueber }: { anteil: number; ueber?: boolean }) {
  return <div className="balken"><i className={ueber ? 'ueber' : ''} style={{ width: `${Math.max(0, Math.min(100, anteil * 100))}%` }} /></div>
}
