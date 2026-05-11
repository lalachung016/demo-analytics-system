import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NAV_ITEMS } from '../router/routes';

const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isMobileOpen]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-x-clip md:flex md:overflow-x-visible">
      {/* 手機版頂列 */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-white">Analytics System</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="開啟選單"
          className="p-2 rounded-lg text-slate-300 hover:bg-slate-800/60"
        >
          <MenuIcon fontSize="small" />
        </button>
      </header>

      {/* 手機版背景遮罩 */}
      <div
        className={[
          'md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-200',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden
      />

      <aside
        className={[
          'flex flex-col shrink-0 border-r border-slate-800',
          'fixed inset-y-0 left-0 z-50 w-full bg-slate-900',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:sticky md:top-0 md:h-screen md:translate-x-0 md:bg-slate-900/60',
          isCollapsed ? 'md:w-16' : 'md:w-56',
          'transition-[width,transform] duration-200 ease-out',
        ].join(' ')}
      >
        <div
          className={[
            'border-b border-slate-800 flex items-center gap-2 min-h-[64px] px-4',
            isCollapsed ? 'md:px-2 md:justify-center' : 'justify-between',
          ].join(' ')}
        >
          <div className={isCollapsed ? 'block md:hidden' : 'block'}>
            <div className="text-lg font-bold text-white">Analytics System</div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="關閉選單"
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800/60"
          >
            <CloseIcon fontSize="small" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            aria-label={isCollapsed ? '展開選單' : '收合選單'}
            className="hidden md:inline-flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          >
            {isCollapsed ? (
              <ChevronRightIcon fontSize="small" />
            ) : (
              <ChevronLeftIcon fontSize="small" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  isCollapsed ? 'md:justify-center md:px-2' : '',
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent',
                ].join(' ')
              }
            >
              <span className="flex items-center text-current">{item.icon}</span>
              <span className={isCollapsed ? 'md:hidden' : ''}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className={[
            'py-3 text-xs text-slate-600 border-t border-slate-800',
            isCollapsed ? 'md:text-center md:px-2' : 'px-5',
          ].join(' ')}
        >
          v0.0.0
        </div>
      </aside>

      <main className="w-full min-w-0 md:w-auto md:flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
