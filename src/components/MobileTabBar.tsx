import { NavLink } from 'react-router-dom';
import { IconGlobe, IconCompare, IconBookmark } from './icons';

function IconSparkles({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

const TABS = [
  { to: '/',         label: 'Carte',    icon: IconGlobe,    end: true  },
  { to: '/inspire',  label: 'Inspire',  icon: IconSparkles, end: false },
  { to: '/voyages',  label: 'Voyages',  icon: IconBookmark, end: false },
  { to: '/comparer', label: 'Comparer', icon: IconCompare,  end: false },
];

export function MobileTabBar() {
  return (
    <nav className="m-tabbar" aria-label="Navigation mobile">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}
                 className={({ isActive }) => 'm-tab ' + (isActive ? 'is-on' : '')}>
          <Icon size={20}/>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
