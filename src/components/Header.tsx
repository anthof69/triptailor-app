import { NavLink } from 'react-router-dom';
import { IconAgents } from './icons';
import { Logo } from './atoms';
import type { SessionUser } from '../lib/useAuth';

const HEADER_NAV = [
  { id: 'explorer', label: 'Carte',       to: '/' },
  { id: 'inspire',  label: 'Inspire-moi', to: '/inspire' },
  { id: 'voyages',  label: 'Mes voyages', to: '/voyages' },
  { id: 'comparer', label: 'Comparer',    to: '/comparer' },
];

interface Props {
  onAgents: () => void;
  onLogin: () => void;
  onLogout: () => void;
  user: SessionUser | null;
}

export function Header({ onAgents, onLogin, onLogout, user }: Props) {
  return (
    <header className="g-nav">
      <div className="g-nav-l">
        <Logo/>
        <nav className="g-nav-links" aria-label="Navigation principale">
          {HEADER_NAV.map(n => (
            <NavLink key={n.id} to={n.to} end={n.to === '/'}
                     className={({ isActive }) => "g-nav-link " + (isActive ? 'is-on' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="g-nav-r">
        <button className="btn btn-sm btn-ghost g-agents" onClick={onAgents}>
          <IconAgents size={14}/> Agents IA
        </button>
        {user ? (
          <button className="user-pill" title={`Cliquer pour se déconnecter — ${user.email}`} onClick={onLogout}
                  style={{ background: 'transparent', cursor: 'pointer' }}>
            <span className="avatar">{user.initials}</span>
            <span className="user-pill-email">{user.email}</span>
          </button>
        ) : (
          <>
            <button className="btn btn-sm btn-ghost" onClick={onLogin}>Se connecter</button>
            <button className="btn btn-sm btn-primary" onClick={onLogin}>Créer un compte</button>
          </>
        )}
      </div>
    </header>
  );
}
