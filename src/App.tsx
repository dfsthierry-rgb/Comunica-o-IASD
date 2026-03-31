import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sparkles, LogOut, LogIn } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { SharedView } from './pages/SharedView';
import { auth, signInWithGoogle, logOut } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

function AppContent({ user }: { user: User | null }) {
  const location = useLocation();
  const isSharedView = location.pathname.startsWith('/shared/');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {!isSharedView && (
        <header className="bg-blue-900 text-white py-4 shadow-md flex-shrink-0">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400" />
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Comunicação IASD Central de Itapevi</h1>
                  <p className="text-blue-200 text-xs">Gerador de Apresentações e Roteiros</p>
                </div>
              </div>
              <div>
                {user ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-blue-200 hidden sm:inline">{user.email}</span>
                    <button onClick={logOut} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded text-sm transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <button onClick={signInWithGoogle} className="flex items-center gap-2 bg-white text-blue-900 hover:bg-gray-100 px-4 py-2 rounded font-medium transition-colors">
                    <LogIn className="w-4 h-4" />
                    Entrar com Google
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={user ? <Dashboard /> : <div className="p-12 text-center"><h2 className="text-2xl font-bold mb-4">Bem-vindo ao Gerador de Apresentações</h2><p className="text-gray-600 mb-6">Faça login com sua conta do Google para criar e gerenciar apresentações.</p><button onClick={signInWithGoogle} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">Entrar com Google</button></div>} />
          <Route path="/editor/:id" element={user ? <Editor /> : <Navigate to="/" />} />
          <Route path="/shared/:id" element={<SharedView />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Definitive timeout: force loading to false if Firebase hangs
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Auth timeout reached, assuming not logged in');
        setLoading(false);
      }
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return (
    <HashRouter>
      <AppWrapper user={user} loading={loading} />
    </HashRouter>
  );
}

function AppWrapper({ user, loading }: { user: User | null, loading: boolean }) {
  const location = useLocation();
  const isSharedView = location.pathname.startsWith('/shared/');

  // If we are in shared view, never show the global spinner
  if (loading && !isSharedView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <AppContent user={user} />;
}
