import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Upload, Library, NotebookText, History, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FloatingShapes from './Shapes';
import GenerationToast from './GenerationToast';
import BuyCreditsModal from './BuyCreditsModal';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload PDF', icon: Upload },
  { path: '/library', label: 'Library', icon: Library },
  { path: '/notebooks', label: 'Notebooks', icon: NotebookText },
  { path: '/history', label: 'History', icon: History },
];

function AppShell() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [cookieConsentAccepted, setCookieConsentAccepted] = useState(() => {
    return localStorage.getItem('prepmate_cookie_consent') === 'true';
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chalk">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-iris border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const acceptCookies = () => {
    localStorage.setItem('prepmate_cookie_consent', 'true');
    setCookieConsentAccepted(true);
  };

  return (
    <div className="min-h-screen bg-chalk flex flex-col relative font-body text-ink selection:bg-frost">
      {/* Decorative Paper-Cut Cutout Shapes Layer (z-0) */}
      <FloatingShapes />

      {/* SuperHi Sticky Top Navigation Bar (White #ffffff, 1px bottom border #e1edff, ~64px height, no drop shadow) */}
      <header className="sticky top-0 z-40 bg-paper border-b border-frost h-16 px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Round 32px Logo Mark + Wordmark & Navigation Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <span className="font-display font-extrabold text-xl tracking-tight text-ink">PrepMate</span>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `text-[20px] font-normal tracking-tight transition-all py-1 ${
                    isActive
                      ? 'text-electric-iris underline decoration-2 underline-offset-4'
                      : 'text-ink hover:text-electric-iris'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Credits indicator, Buy Credits pill, User Avatar & Sign out */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-chalk px-4 py-1.5 rounded-full border border-frost">
            <span className="text-sm font-normal text-ink/70">Credits:</span>
            <span className="text-base font-normal text-electric-iris">{user.credits}</span>
            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="ml-1 px-3 py-1 bg-electric-iris text-white text-xs font-normal rounded-full shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              + Buy Credits
            </button>
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-frost">
            <div className="w-8 h-8 rounded-full bg-electric-iris text-white flex items-center justify-center text-sm font-normal" title={user.email}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:inline text-sm font-normal text-ink truncate max-w-[120px]">
              {user.name?.split(' ')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 bg-transparent border border-ink text-ink font-normal text-sm rounded-full hover:bg-frost transition-all"
            >
              Sign out
            </button>
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden p-2 text-ink hover:bg-frost rounded-xl"
            aria-label="Toggle Navigation"
          >
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileNavOpen && (
        <div className="lg:hidden bg-paper border-b border-frost p-4 space-y-3 z-30 animate-fade-in-up">
          <div className="flex sm:hidden items-center justify-between bg-chalk p-3 rounded-2xl border border-frost mb-3">
            <div>
              <span className="text-sm font-normal text-ink/70">Available Credits: </span>
              <span className="text-base font-normal text-electric-iris">{user.credits}</span>
            </div>
            <button
              onClick={() => { setIsBuyModalOpen(true); setMobileNavOpen(false); }}
              className="px-3 py-1 bg-electric-iris text-white text-xs font-normal rounded-full shadow-hard-sm"
            >
              + Buy
            </button>
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-[18px] font-normal transition-all ${
                  isActive
                    ? 'bg-electric-iris text-white shadow-hard-sm'
                    : 'text-ink hover:bg-frost'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Main Content Rail (max-width 1200px, alternating canvas and white card surfaces, relative z-10 over shapes) */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-8 lg:py-12 relative z-10">
        <Outlet />
      </main>

      {/* SuperHi Cookie Consent Bar (Fixed bottom full-width, fill #111118, 16px 24px padding, white text, 48px pill buttons) */}
      {!cookieConsentAccepted && (
        <aside className="fixed bottom-0 inset-x-0 bg-ink text-white p-4 sm:px-6 z-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-frost shadow-hard animate-fade-in-up">
          <p className="text-[16px] font-normal leading-relaxed text-white/90">
            We use essential cookies and storage to maintain your active study session, save your notebook progress, and verify AI credit tokens.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={acceptCookies}
              className="px-5 py-2 bg-transparent border border-white text-white font-normal text-[16px] rounded-full hover:bg-white/10 transition-all"
            >
              Essential cookies only
            </button>
            <button
              onClick={acceptCookies}
              className="px-6 py-2 bg-carbon text-white font-normal text-[16px] rounded-full shadow-hard-iris hover:translate-y-0.5 transition-all"
            >
              Sure thing
            </button>
          </div>
        </aside>
      )}

      {/* Toast & Modal components */}
      <GenerationToast />
      <BuyCreditsModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
    </div>
  );
}

export default AppShell;
