import { useEffect, type ReactNode } from 'react'

export function Sheet({ titel, onSchliessen, children }: { titel: string; onSchliessen: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onSchliessen()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onSchliessen])
  return (
    <div className="scrim" onClick={onSchliessen}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={titel} onClick={e => e.stopPropagation()}>
        <div className="griff" />
        <h3>{titel}</h3>
        {children}
      </div>
    </div>
  )
}
