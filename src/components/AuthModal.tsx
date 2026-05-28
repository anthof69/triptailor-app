import { useState } from 'react';
import { IconClose, IconArrow } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, firstName: string) => Promise<void>;
  error: string | null;
}

export function AuthModal({ open, onClose, onSignIn, onSignUp, error }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [pending, setPending] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      if (mode === 'login') await onSignIn(email, password);
      else                  await onSignUp(email, password, firstName);
      if (!error) onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={e => e.stopPropagation()}>
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
            <li><span>—</span>175 destinations notées sur 12 mois</li>
            <li><span>—</span>4 agents IA : climat, budget, sécurité, planning</li>
            <li><span>—</span>Comparaison côte à côte</li>
          </ul>
        </div>

        <div className="modal-r">
          <div className="modal-tabs">
            <button className={mode === 'login' ? 'is-on' : ''} onClick={() => setMode('login')}>Se connecter</button>
            <button className={mode === 'signup' ? 'is-on' : ''} onClick={() => setMode('signup')}>Créer un compte</button>
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
              <div style={{ color: 'var(--tt-terra-soft)', fontSize: 12.5, padding: '6px 10px', background: 'rgba(217,119,87,0.08)', borderRadius: 8, border: '1px solid rgba(217,119,87,0.25)' }}>{error}</div>
            )}
            <button type="submit" className="btn btn-primary btn-lg modal-cta" disabled={pending}>
              {pending ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <IconArrow/>
            </button>
            <button type="button" className="modal-alt" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? "Pas encore de compte ? Créez-en un" : "J'ai déjà un compte"}
            </button>
            <div className="modal-fine">Pas de pub. Pas de revente de données. Voyagez tranquille.</div>
          </form>
        </div>
      </div>
    </div>
  );
}
