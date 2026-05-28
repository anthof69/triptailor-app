import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { Explorer } from './pages/Explorer';
import { Inspire } from './pages/Inspire';
import { Voyages } from './pages/Voyages';
import { Comparer } from './pages/Comparer';
import { useAuth } from './lib/useAuth';
import { useSavedTrips, type SavedTrip } from './lib/useSavedTrips';

export interface AppState {
  monthIdx: number;
  saved: string[];                 // derived from useSavedTrips for UI compatibility
  savedTrips: SavedTrip[];         // full records (with month + addedAt)
  comparePicks: string[];
  agentsOpen: boolean;
}

const INITIAL: AppState = {
  monthIdx: 4,
  saved: [],
  savedTrips: [],
  comparePicks: [],
  agentsOpen: false,
};

export default function App() {
  const auth = useAuth();
  const saved = useSavedTrips(auth.user);
  const [appState, setAppState] = useState<AppState>(INITIAL);
  const [authOpen, setAuthOpen] = useState(false);

  // Mirror the saved-trips hook into appState so existing pages see the same data shape.
  useEffect(() => {
    setAppState(s => ({
      ...s,
      saved: saved.trips.map(t => t.iso),
      savedTrips: saved.trips,
    }));
  }, [saved.trips]);

  // Light persistence for non-auth fields (month, comparePicks).
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tt:state');
      if (raw) {
        const parsed = JSON.parse(raw);
        setAppState(s => ({ ...s, monthIdx: parsed.monthIdx ?? s.monthIdx, comparePicks: parsed.comparePicks ?? s.comparePicks }));
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('tt:state', JSON.stringify({
        monthIdx: appState.monthIdx,
        comparePicks: appState.comparePicks,
      }));
    } catch { /* ignore */ }
  }, [appState.monthIdx, appState.comparePicks]);

  const onAgents = () => setAppState(s => ({ ...s, agentsOpen: !s.agentsOpen }));

  // Bridge add/remove for pages to call.
  const addTrip    = (iso: string, month?: number) => saved.add(iso, month ?? appState.monthIdx);
  const removeTrip = (iso: string)                  => saved.remove(iso);

  const pageProps = { appState, setAppState, addTrip, removeTrip };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header
          user={auth.user}
          onAgents={onAgents}
          onLogin={() => setAuthOpen(true)}
          onLogout={auth.signOut}
        />
        <div className="app-main">
          <Routes>
            <Route path="/"         element={<Explorer {...pageProps}/>}/>
            <Route path="/inspire"  element={<Inspire  {...pageProps}/>}/>
            <Route path="/voyages"  element={<Voyages  {...pageProps}/>}/>
            <Route path="/comparer" element={<Comparer {...pageProps}/>}/>
          </Routes>
        </div>
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSignIn={auth.signIn}
          onSignUp={auth.signUp}
          error={auth.error}
        />
      </div>
    </BrowserRouter>
  );
}

export type PageProps = {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  addTrip: (iso: string, month?: number) => Promise<void> | void;
  removeTrip: (iso: string) => Promise<void> | void;
};
