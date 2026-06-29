'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MessageSquare, Users, Bell, MessageCircle,
  GraduationCap, BookOpen, Terminal, Sparkles, FileText,
  Briefcase, Award, Trophy, Store, Calendar, Gamepad2,
  Compass, MapPin, Heart, EyeOff, User, Settings, Palette,
  ShieldCheck, Bookmark, ShieldAlert, Search, X, Star, Rocket, UserCheck,
} from 'lucide-react';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModuleItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  desc: string;
  category: string;
  disabled?: boolean;
  requiredRole?: string[];
}

const ALL_MODULES: ModuleItem[] = [
  // Communication
  { id: 'feed', label: 'Feed', href: '/dashboard', icon: Home, desc: 'Public campus discussion and updates', category: 'Communication' },
  { id: 'messages', label: 'Messages', href: '/messages', icon: MessageSquare, desc: 'Direct messages with peers', category: 'Communication' },
  { id: 'friends', label: 'Friends', href: '/friends', icon: Users, desc: 'Connect and view friend list', category: 'Communication' },
  { id: 'notifications', label: 'Notifications', href: '#notifications', icon: Bell, desc: 'Real-time alerts and activity updates', category: 'Communication' },
  { id: 'communities', label: 'Communities', href: '/community', icon: MessageCircle, desc: 'Explore interest-based student groups', category: 'Communication' },
  // Learning
  { id: 'study', label: 'Study Hub', href: '/study', icon: GraduationCap, desc: 'Create and join virtual study rooms', category: 'Learning' },
  { id: 'notes', label: 'Notes Library', href: '/notes', icon: BookOpen, desc: 'Access and share student notes', category: 'Learning' },
  { id: 'coding', label: 'Coding Arena', href: '/coding-arena', icon: Terminal, desc: 'Practice coding and compete in challenges', category: 'Learning' },
  { id: 'ai', label: 'AI Assistant', href: '/ai', icon: Sparkles, desc: 'Get help from the Campus AI assistant', category: 'Learning' },
  { id: 'papers', label: 'Resources', href: '/papers', icon: FileText, desc: 'Browse past exams and study papers', category: 'Learning' },
  // Career
  { id: 'internships', label: 'Internships', href: '/internships', icon: Briefcase, desc: 'Apply to verified student internships', category: 'Career' },
  { id: 'mentorship', label: 'Mentorship', href: '/mentorship', icon: UserCheck, desc: 'Connect with senior mentors and guides', category: 'Career' },
  { id: 'placements', label: 'Placements', href: '/placements', icon: Briefcase, desc: 'View campus placement records and openings', category: 'Career' },
  { id: 'resume', label: 'Resume Builder', href: '#disabled', icon: Award, desc: 'Generate a professional resume (Coming Soon)', category: 'Career', disabled: true },
  { id: 'rewards', label: 'Rewards', href: '/rewards', icon: Award, desc: 'Earn points and redeem prizes', category: 'Career' },
  { id: 'leaderboard', label: 'Leaderboard', href: '/rewards?tab=leaderboard', icon: Trophy, desc: 'Compare your achievements with peers', category: 'Career' },
  // Campus
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace', icon: Store, desc: 'Buy and sell student items on campus', category: 'Campus' },
  { id: 'events', label: 'Events', href: '/events', icon: Calendar, desc: 'Discover upcoming college events', category: 'Campus' },
  { id: 'calendar', label: 'Calendar', href: '/calendar', icon: Calendar, desc: 'View scheduled classes and academic dates', category: 'Campus' },
  { id: 'clubs', label: 'Clubs', href: '/clubs', icon: Gamepad2, desc: 'Browse student organizations and clubs', category: 'Campus' },
  { id: 'startup', label: 'Startup Cell', href: '/startup', icon: Rocket, desc: 'Incubate and develop your business ideas', category: 'Campus' },
  { id: 'directory', label: 'Campus Directory', href: '/discover', icon: Compass, desc: 'Find other verified campus students', category: 'Campus' },
  { id: 'map', label: 'Campus Map', href: '#disabled', icon: MapPin, desc: 'Find campus buildings & venues (Coming Soon)', category: 'Campus', disabled: true },
  // Social
  { id: 'dating', label: 'Dating', href: '/dating', icon: Heart, desc: 'Meet other verified campus students', category: 'Social' },
  { id: 'confessions', label: 'Confessions', href: '#disabled', icon: EyeOff, desc: 'Post anonymous student confessions (Coming Soon)', category: 'Social', disabled: true },
  { id: 'groups', label: 'Groups', href: '/community', icon: Users, desc: 'Join specific student subgroups', category: 'Social' },
  // Personal
  { id: 'profile', label: 'Profile', href: '/profile', icon: User, desc: 'View your public profile and accomplishments', category: 'Personal' },
  { id: 'settings', label: 'Account Settings', href: '/settings', icon: Settings, desc: 'Edit profile info and credentials', category: 'Personal' },
  { id: 'appearance', label: 'Appearance', href: '/settings?tab=appearance', icon: Palette, desc: 'Customize themes and visual layouts', category: 'Personal' },
  { id: 'privacy', label: 'Privacy', href: '/settings?tab=appearance', icon: ShieldCheck, desc: 'Control visibility and active status', category: 'Personal' },
  { id: 'saved', label: 'Saved Posts', href: '#disabled', icon: Bookmark, desc: 'View bookmarks and saved items (Coming Soon)', category: 'Personal', disabled: true },
  // Administration – role based
  { id: 'moderator', label: 'Moderator', href: '/super-admin?tab=moderation', icon: ShieldAlert, desc: 'Moderate reported posts and activity', category: 'Administration', requiredRole: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ADMIN', 'MODERATOR'] },
  { id: 'college_admin', label: 'College Admin', href: '/super-admin?tab=admins', icon: ShieldAlert, desc: 'Configure college settings and invites', category: 'Administration', requiredRole: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ADMIN'] },
  { id: 'platform_admin', label: 'Platform Admin', href: '/super-admin', icon: ShieldAlert, desc: 'Full root level configuration control', category: 'Administration', requiredRole: ['SUPER_ADMIN'] },
];

const CATEGORIES = ['All', 'Communication', 'Learning', 'Career', 'Campus', 'Social', 'Personal', 'Administration'];

// Framer Motion variants
const overlayVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
} as const;

const modalVariants: any = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } },
} as const;

const cardContainerVariants: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
} as const;

const cardVariants: any = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
} as const;

export default function AppLauncher({ isOpen, onClose }: AppLauncherProps) {
  const router = useRouter();
  const { profile } = useCurrentProfile();
  const userRole = profile?.role?.toUpperCase() ?? 'STUDENT';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Refs for focus management and DOM elements
  const backdropRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const fav = localStorage.getItem('campusconnect_favorites');
        if (fav) setFavorites(JSON.parse(fav));
        const rec = localStorage.getItem('campusconnect_recently_used');
        if (rec) setRecentlyUsed(JSON.parse(rec));
      } catch (e) {
        console.error('Failed to load App Launcher cache', e);
      }
    }
  }, []);

  // Focus handling when opening/closing
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (previousFocus.current instanceof HTMLElement) {
      previousFocus.current.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Keyboard navigation within grid (ArrowUp/Down, Enter)
const filteredModules = useMemo(() => {
  return ALL_MODULES.filter((mod) => {
    if (mod.category === 'Administration') {
      if (!mod.requiredRole) return false;
      return mod.requiredRole.includes(userRole);
    }
    return true;
  });
}, [userRole]);

const visibleModules = useMemo(() => {
  return filteredModules.filter((mod) => {
    if (selectedCategory !== 'All' && mod.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        mod.label.toLowerCase().includes(q) ||
        mod.desc.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q)
      );
    }
    return true;
  });
}, [filteredModules, selectedCategory, searchQuery]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id) ? favorites.filter((fid) => fid !== id) : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('campusconnect_favorites', JSON.stringify(updated));
  };

  const handleLaunch = useCallback((mod: ModuleItem) => {
    if (mod.disabled) return;
    const updatedRecents = [mod.id, ...recentlyUsed.filter((i) => i !== mod.id)].slice(0, 8);
    setRecentlyUsed(updatedRecents);
    localStorage.setItem('campusconnect_recently_used', JSON.stringify(updatedRecents));
    onClose();
    if (mod.href === '#notifications') {
      window.dispatchEvent(new CustomEvent('open-notifications'));
    } else {
      router.push(mod.href);
    }
  }, [onClose, router, recentlyUsed]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      const total = visibleModules.length;
      if (total === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % total);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + total) % total);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const mod = visibleModules[focusedIndex];
        if (mod) handleLaunch(mod);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, visibleModules, focusedIndex, handleLaunch]);

  // Scroll focused card into view
  useEffect(() => {
    if (!itemsContainerRef.current) return;
    const active = itemsContainerRef.current.querySelector('.app-card-active') as HTMLElement | null;
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex]);

  // Reset focused index when filters change
  useEffect(() => {
    setFocusedIndex(0);
  }, [selectedCategory, searchQuery]);



  const favoriteModules = useMemo(() => filteredModules.filter((mod) => favorites.includes(mod.id)), [filteredModules, favorites]);
  const recentlyUsedModules = useMemo(() => {
    return filteredModules
      .filter((mod) => recentlyUsed.includes(mod.id))
      .sort((a, b) => recentlyUsed.indexOf(a.id) - recentlyUsed.indexOf(b.id))
      .slice(0, 4);
  }, [filteredModules, recentlyUsed]);



  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-10 select-none"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        ref={backdropRef}
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        <motion.div
          className="relative w-full max-w-5xl h-[85vh] max-h-[640px] glass-modal rounded-3xl overflow-hidden flex flex-col z-10 bg-white/5 backdrop-blur-lg"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          ref={containerRef}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
            <Search size={18} className="text-zinc-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search CampusConnect apps, categories, actions... (Esc to close)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-0 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.02] px-1.5 font-mono text-[9px] font-medium text-zinc-500">
              <span>ESC</span>
            </kbd>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar categories */}
            <aside className="w-48 border-r border-white/[0.05] bg-white/[0.01] p-3 hidden sm:flex flex-col gap-1 overflow-y-auto custom-scrollbar shrink-0 select-none">
              <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2.5 mb-2">Categories</p>
              {CATEGORIES.map((cat) => {
                if (cat === 'Administration') {
                  const hasAccess = ALL_MODULES.some((mod) => mod.category === 'Administration' && mod.requiredRole?.includes(userRole));
                  if (!hasAccess) return null;
                }
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    ref={(el) => { categoryRefs.current[cat] = el; }}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-xs font-semibold font-display tracking-wide transition-all duration-200 hover:bg-white/[0.03]',
                      isActive ? 'text-brand-400 bg-brand-500/10 border border-brand-500/15' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </aside>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar" ref={itemsContainerRef}>
              {/* Mobile category pills */}
              <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-3 -mx-2 px-2 shrink-0 select-none custom-scrollbar border-b border-white/[0.05] mb-4">
                {CATEGORIES.map((cat) => {
                  if (cat === 'Administration') {
                    const hasAccess = ALL_MODULES.some((mod) => mod.category === 'Administration' && mod.requiredRole?.includes(userRole));
                    if (!hasAccess) return null;
                  }
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0',
                        isActive ? 'bg-brand-500 text-white' : 'bg-white/5 text-zinc-400 border border-white/[0.05]'
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Favorites */}
              {searchQuery === '' && selectedCategory === 'All' && favoriteModules.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2 px-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Favorite Apps</p>
                  </div>
                  <motion.div variants={cardContainerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {favoriteModules.map((mod) => (
                      <AppCard
                        key={`fav-${mod.id}`}
                        mod={mod}
                        isFavorite={true}
                        isFocused={false}
                        onToggleFavorite={(e) => toggleFavorite(mod.id, e)}
                        onLaunch={() => handleLaunch(mod)}
                      />
                    ))}
                  </motion.div>

                </section>
              )}

              {/* Recently Used */}
              {searchQuery === '' && selectedCategory === 'All' && recentlyUsedModules.length > 0 && (
                <section className="space-y-2.5">
                  <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-1">Recently Used</p>
                  <motion.div variants={cardContainerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentlyUsedModules.map((mod) => (
                      <AppCard
                        key={`recent-${mod.id}`}
                        mod={mod}
                        isFavorite={favorites.includes(mod.id)}
                        isFocused={false}
                        onToggleFavorite={(e) => toggleFavorite(mod.id, e)}
                        onLaunch={() => handleLaunch(mod)}
                      />
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Main grid */}
              <section className="space-y-3.5">
                <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                  {searchQuery !== '' ? 'Search Results' : selectedCategory === 'All' ? 'All Applications' : `${selectedCategory} Modules`}
                </p>
                {visibleModules.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-3">
                      <Compass className="text-zinc-500" size={20} />
                    </div>
                    <p className="text-[12px] font-medium text-zinc-300">No applications found</p>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-[240px]">Try refining your search query or selecting a different category.</p>
                  </div>
                ) : (
                  <motion.div variants={cardContainerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleModules.map((mod, idx) => {
                      const isFav = favorites.includes(mod.id);
                      const isFocused = idx === focusedIndex;
                      return (
                        <AppCard
                          key={mod.id}
                          mod={mod}
                          isFavorite={isFav}
                          isFocused={isFocused}
                          onToggleFavorite={(e) => toggleFavorite(mod.id, e)}
                          onLaunch={() => handleLaunch(mod)}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// Card component
interface AppCardProps {
  mod: ModuleItem;
  isFavorite: boolean;
  isFocused: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onLaunch: () => void;
}

function AppCard({ mod, isFavorite, isFocused, onToggleFavorite, onLaunch }: AppCardProps) {
  const Icon = mod.icon;
  const getThemeClass = (cat: string) => {
    switch (cat) {
      case 'Communication':
        return 'text-blue-400 group-hover:text-blue-3... (truncated)'
    }
  };

  return (
    <motion.div
      className={cn(
        'app-card flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.04] transition-all group relative',
        mod.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        isFocused && 'app-card-active border-brand-500/40 bg-white/[0.03] scale-[1.01] shadow-premium'
      )}
      variants={cardVariants}
      whileHover={{ scale: 1.025 }}
      onClick={onLaunch}
    >
      <div className="app-icon-container w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.05] shrink-0 transition-transform select-none">
        <Icon size={16} className={cn('transition-colors duration-200', getThemeClass(mod.category))} />
      </div>
      <div className="flex-1 min-w-0 pr-5 select-none">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-neutral-200 group-hover:text-white leading-tight truncate">{mod.label}</p>
          {mod.disabled && (
            <span className="text-[7px] font-mono font-bold px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase leading-none shrink-0">Soon</span>
          )}
        </div>
        <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed">{mod.desc}</p>
      </div>
      {!mod.disabled && (
        <button
          onClick={onToggleFavorite}
          className={cn(
            'absolute right-2 top-2 p-1.5 rounded-lg text-zinc-600 hover:text-amber-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200',
            isFavorite && 'opacity-100 text-amber-400'
          )}
          title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Star size={13} className={cn(isFavorite && 'fill-amber-400')} />
        </button>
      )}
    </motion.div>
  );
}
