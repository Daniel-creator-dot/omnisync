import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { navLinks, type NavLink } from '../lib/nav';

interface CommandPaletteProps {
  open: boolean;
  role?: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, role, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const links = useMemo(() => navLinks(role), [role]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(q));
  }, [links, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const choose = (item: NavLink) => {
    onSelect(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/50 px-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Search the desk"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-white/10">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose();
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              }
              if (event.key === 'Enter' && results[active]) choose(results[active]);
            }}
            placeholder="Jump to invoices, people, policies…"
            className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-slate-500">Nothing matches that.</p>
          )}
          {results.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(item)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${
                index === active ? 'bg-indigo-50 text-indigo-950 dark:bg-white/10 dark:text-white' : 'text-slate-700 dark:text-zinc-300'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">{item.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
