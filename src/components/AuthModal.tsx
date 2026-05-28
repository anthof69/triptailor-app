import { useEffect, useRef, useState } from 'react';
import { IconClose, IconArrow } from './icons';
import { countries } from '../data/countries';
import type { AuthResult } from '../lib/useAuth';

const DEST_COUNT = countries.length;

interface Props {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<AuthResult>;
  onSignUp: (email: string, password: string, firstName: string) => Promise<AuthResult>;
  error: string | null;
}

export function AuthModal({ open, onClose, onSignIn, onSignUp, error }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management: focus first field on open, Escape to close, trap Tab.
  useEffect(() => {
    if (!open) return;
    const root = modalRef.current;
    const first = root?.querySelector<HTMLElement>('input') ?? root?.querySelector<HTMLElement>('button');
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !root) return;
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const firstEl = focusables[0], lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, mode, confirmSent, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      // Use the returned result — not the closure `error` (which is stale until next render).
      const res = mode === 'login'
        ? await onSignIn(email, password)
        : await onSignUp(email, password, firstName);
      if (res.ok && res.needsEmailConfirm) {
        setConfirmSent(true);        // show "check your mail", keep modal open
      } else if (res.ok) {
        onClose();                   // logged in
      }
      // res.ok === false → leave modal open; `error` prop renders the message
    } finally {
      setPending(false);
    }
  };

  const switchMode = (m: 'login' | 'signup') => { setMode(m); setConfirmSent(false); };

  return (
    <div className="modal-bg" onClick={onClose} role="dialog" aria-modal="true" aria-label="Connexion à TripTailor">
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <button className="cp-close modal-x" onClick={onClose} aria-label="Fermer"><IconClose size={18}/></button>

        <div className="modal-l">
          <div className="modal-eyebrow t-eyebrow">TripTailor</div>
          <h2 className="modal-h">
            <i>{mode === 'login' ? 'Retrouvez vos voyages.' : 'Commencez à rêver.'}</i>
          </h2>
          <p className="modal-p">
            {mode === 'login'
              ? "Vos destinations enregistrées, vos comparaisons et vos conversations avec les agents — tout reste à portée."
              : "Créez un compte pour enregistrer vos voyages, comparer plusieurs pays et garder l'historique des analyses IA."}
          </p>
          <ul className="modal-feats">
            <li><span>—</span>{DEST_COUNT} destinations notées sur 12 mois</li>
            <li><span>—</span>4 agents IA : climat, budget, sécurité, planning</li>
            <li><span>—</span>Comparaison côte à côte</li>
          </ul>
        </div>

        <div className="modal-r">
          {confirmSent ? (
            <div className="modal-confirm">
              <div className="modal-confirm-glyph">✦</div>
              <h3 className="modal-confirm-h"><i>Vérifiez vos mails.</i></h3>
              <p className="modal-confirm-p">
                On vient d'envoyer un lien de confirmation à <b>{email}</b>.
                Cliquez-le pour activer votre compte, puis revenez vous connecter.
              </p>
              <button type="button" className="btn btn-ghost" onClick={() => switchMode('login')}>
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <div className="modal-tabs">
                <button className={mode === 'login' ? 'is-on' : ''} onClick={() => switchMode('login')}>Se connecter</button>
                <button className={mode === 'signup' ? 'is-on' : ''} onClick={() => switchMode('signup')}>Créer un compte</button>
              </div>
              <form className="modal-form" onSubmit={submit}>
                {mode === 'signup' && (
                  <label className="modal-label">
                    <span className="t-eyebrow">Prénom</span>
                    <input className="input" placeholder="Camille" type="text" value={firstName} onChange={e => setFirstName(e.target.value)}/>
                  </label>
                )}
                <label className="modal-label">
                  <span className="t-eyebrow">Email</span>
                  <input className="input" placeholder="vous@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required/>
                </label>
                <label className="modal-label">
                  <span className="t-eyebrow">Mot de passe</span>
                  <input className="input" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}/>
                </label>
                {error && (
                  <div role="alert" style={{ color: 'var(--tt-terra-soft)', fontSize: 12.5, padding: '6px 10px', background: 'rgba(217,119,87,0.08)', borderRadius: 8, border: '1px solid rgba(217,119,87,0.25)' }}>{error}</div>
                )}
                <button type="submit" className="btn btn-primary btn-lg modal-cta" disabled={pending}>
                  {pending ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <IconArrow/>
                </button>
                <button type="button" className="modal-alt" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                  {mode === 'login' ? "Pas encore de compte ? Créez-en un" : "J'ai déjà un compte"}
                </button>
                <div className="modal-fine">Pas de pub. Pas de revente de données. Voyagez tranquille.</div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
