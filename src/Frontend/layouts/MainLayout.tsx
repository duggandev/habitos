import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardNav, { NavKey } from './barra/barra';
import {UserButton } from '@clerk/clerk-react';
import { Search } from 'lucide-react';
import { useSubscription } from './state/SubscriptionContext';
import { useSearch } from '../hooks/useSearch';
import SearchResultsDropdown from '../components/search/SearchResults';
import SearchModal from '../components/search/SearchModal';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription } = useSubscription();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { 
    searchQuery, 
    handleSearch, 
    results, 
    showResults, 
    setShowResults, 
    handleResultClick 
  } = useSearch();
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const getCurrentNavKey = (): NavKey => {
    const path = location.pathname;
    // Keep "home" selected when viewing group habit details
    if (path.includes('/dashboard/grupal/habit/')) return 'home';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/perks')) return 'perks';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/billing')) return 'billing';
    return 'home';
  };

  const handleNavigation = (key: NavKey) => {
    window.scrollTo(0, 0);
    
    switch (key) {
      case 'home': navigate('/home'); break;
      case 'dashboard': navigate('/dashboard'); break;
      case 'reports': navigate('/reports'); break;
      case 'perks': navigate('/perks'); break;
      case 'billing': navigate('/billing'); break;
      case 'settings': navigate('/settings'); break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* TopBar */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-gray-950/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1">
            <img src="/favicon.svg" alt="Hábitos" className="w-8 h-8" />
            <span className="text-lg font-bold">abitos</span>
            {subscription && (
              <span 
                className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${
                  subscription.plan.codigo === 'premium' 
                    ? 'border-purple-400/30 bg-purple-500/10 text-purple-300'
                    : 'border-yellow-400/30 bg-yellow-500/10 text-yellow-300'
                }`}
              >
                ★ {subscription.plan.nombre}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Búsqueda versión desktop */}
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar Habito..."
                className="w-64 rounded-lg border border-white/10 bg-gray-900/70 pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              />
              
              <SearchResultsDropdown
                results={results}
                show={showResults && results.length > 0}
                onClose={() => setShowResults(false)}
                onResultClick={handleResultClick}
              />
            </div>

            {/* Botón de búsqueda versión móvil */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden rounded-lg border border-white/10 bg-gray-900/70 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="pl-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "ring-1 ring-white/15 rounded-full",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* 
        pt-20: deja espacio al TopBar fijo
        pb-16 md:pb-0: reserva espacio para la barra inferior SOLO en mobile
        extra: añadimos safe-area con style
      */}
      <div className="max-w-7xl mx-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Sidebar - Fixed position on desktop */}
            <div className="w-full md:w-80">
              <div className="hidden md:block md:fixed md:w-80 pt-5 md:pt-20">
                <DashboardNav 
                  active={getCurrentNavKey()} 
                  onSelect={handleNavigation} 
                />
              </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 pt-16 md:pt-20 pb-24 md:pb-8">
              <div className="max-w-4xl mb-20 md:mb-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Fixed for mobile */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gray-950/90 backdrop-blur-md border-t border-white/10">
          <div className="h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <DashboardNav 
              active={getCurrentNavKey()} 
              onSelect={handleNavigation} 
            />
          </div>
        </div>
      </div>

      {/* Modal de búsqueda para móvil */}
      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
