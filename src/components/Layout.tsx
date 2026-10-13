import React from 'react';
import { motion } from 'motion/react';
import { Landmark, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import CommandPalette from './CommandPalette';
import { isSection, visibleNav } from '../lib/nav';
import { toggleTheme } from '../lib/theme';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { profile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'));

  const items = visibleNav(profile?.role);
  const activeLink = items.find((item) => !isSection(item) && item.id === activeTab);
  const activeLabel = activeLink && !isSection(activeLink) ? activeLink.label : 'Dashboard';

  React.useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (id: string) => setActiveTab(id);

  const avatar = (
    <Avatar className="h-8 w-8 ring-1 ring-white/15">
      <AvatarImage src={profile?.displayName ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName}` : undefined} />
      <AvatarFallback className="bg-white/10 text-xs font-medium text-white">{profile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
    </Avatar>
  );

  const navButton = (id: string, label: string, Icon: React.ComponentType<{ className?: string }>, compact = false) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => go(id)}
        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 text-left transition-colors ${
          compact ? 'h-10 text-sm' : 'h-9 text-[13px]'
        } ${active ? 'bg-white text-slate-950' : 'text-zinc-300 hover:bg-white/8 hover:text-white'}`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-indigo-600' : 'text-zinc-400'}`} />
        {(compact || isSidebarOpen) && <span className="truncate font-medium">{label}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <header className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-zinc-950 px-4 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
            <Landmark className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold tracking-tight">Bytz360</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label="Search" onClick={() => setPaletteOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={() => setDark(toggleTheme() === 'dark')}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 76 }}
        className="hidden shrink-0 flex-col bg-zinc-950 text-white lg:flex"
      >
        <div className="flex h-16 items-center justify-between px-3">
          {isSidebarOpen && (
            <div className="flex items-center gap-2.5 pl-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none tracking-tight">Bytz360</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Desk</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {items.map((item, index) => {
            if (isSection(item)) {
              return (
                <div key={item.section} className={`px-2 pb-1 ${index > 0 ? 'mt-4' : 'mt-1'}`}>
                  {isSidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{item.section}</p>}
                </div>
              );
            }
            return navButton(item.id, item.label, item.icon);
          })}
        </nav>

        <div className="border-t border-white/10 p-2">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            {avatar}
            {isSidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.displayName}</p>
                <p className="truncate text-xs capitalize text-zinc-400">{profile?.role}</p>
              </div>
            )}
          </div>
          <Button variant="ghost" className="h-8 w-full justify-start gap-2.5 text-[13px] text-zinc-400 hover:bg-white/10 hover:text-white" onClick={logout}>
            <LogOut className="h-4 w-4 shrink-0" />
            {isSidebarOpen && <span>Log out</span>}
          </Button>
        </div>
      </motion.aside>

      {isMobileMenuOpen && <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isMobileMenuOpen ? 0 : -320 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className="fixed top-0 bottom-0 left-0 z-50 flex w-[280px] flex-col bg-zinc-950 text-white shadow-2xl lg:hidden"
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="font-semibold tracking-tight">Bytz360</span>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label="Close menu" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {items.map((item) => isSection(item) ? (
            <p key={item.section} className="px-2 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{item.section}</p>
          ) : navButton(item.id, item.label, item.icon, true))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3">
            {avatar}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile?.displayName}</p>
              <p className="truncate text-xs capitalize text-zinc-400">{profile?.role}</p>
            </div>
          </div>
          <Button variant="outline" className="h-9 w-full border-white/15 bg-transparent text-white hover:bg-white/10" onClick={logout}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur lg:flex">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-10 w-full max-w-md items-center gap-2 rounded-full border border-border bg-card px-3 text-sm text-muted-foreground shadow-sm"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search the desk</span>
            <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{activeLabel}</span>
            <Button
              variant="outline"
              size="icon"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
              onClick={() => setDark(toggleTheme() === 'dark')}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <main className="custom-scrollbar flex-1 overflow-y-auto px-4 pt-[4.75rem] pb-10 md:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} role={profile?.role} onClose={() => setPaletteOpen(false)} onSelect={go} />
    </div>
  );
};

export default Layout;
