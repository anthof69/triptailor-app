import { useEffect, useRef, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

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
        <button className="btn btn-sm btn-ghost g-agents" onClick={onAgents} aria-label="Agents IA">
          <IconAgents size={14}/>
          <span className="g-agents-label">Agents IA</span>
        </button>
        {user ? (
          <div className="user-menu" ref={menuRef}>
            <button className="user-pill" onClick={() => setMenuOpen(o => !o)}
                    aria-haspopup="menu" aria-expanded={menuOpen} title={user.email}>
              <span className="avatar">{user.initials}</span>
              <span className="user-pill-email">{user.email}</span>
            </button>
            {menuOpen && (
              <div className="user-pop" role="menu">
                <div className="user-pop-email">{user.email}</div>
                <hr className="rule" style={{ margin: '6px 0' }}/>
                <button role="menuitem" className="user-pop-item is-danger"
                        onClick={() => {
                          setMenuOpen(false);
                          if (window.confirm('Se déconnecter de TripTailor ?')) onLogout();
                        }}>
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="btn btn-sm btn-ghost" onClick={onLogin}>Se connecter</button>
            <button className="btn btn-sm btn-primary" onClick={onLogin}>
              <span className="g-signup-long">Créer un compte</span>
              <span className="g-signup-short">S'inscrire</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
