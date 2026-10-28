import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/hooks/useData';
import { cn } from '@/lib/utils';
import {
  Search, X, TrendingUp, BarChart3, Layers, Briefcase,
  Eye, Newspaper, Settings, ChevronLeft, ChevronRight, Activity,
  ArrowUpRight, ArrowDownRight, Gauge, GitCompareArrows,
  Menu, Sun, Moon, LogOut, Radio, LineChart, Zap, LayoutDashboard, FileText, LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/', label: 'Market Overview', icon: Activity },
  { path: '/stocks', label: 'Stocks Explorer', icon: TrendingUp },
  { path: '/gainers', label: 'Top Gainers', icon: ArrowUpRight },
  { path: '/losers', label: 'Top Losers', icon: ArrowDownRight },
  { path: '/rankings', label: 'Performance Rankings', icon: BarChart3 },
  { path: '/etfs', label: 'ETFs Explorer', icon: Layers },
  { path: '/sectors', label: 'Sector Analysis', icon: LineChart },
  { path: '/stock-screener', label: 'Stock Screener', icon: Gauge },
  { path: '/comparison', label: 'Asset Comparison', icon: GitCompareArrows },
  { path: '/watchlists', label: 'Watchlists', icon: Eye },
  { path: '/portfolio', label: 'Portfolio Tracker', icon: Briefcase },
  { path: '/news', label: 'Market News', icon: Newspaper },
  { path: '/terms', label: 'Terms of Service', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const NAV_GROUPS = ['Markets', 'Explorers', 'Tools', 'Personal'];

function getGroup(item: NavItem): string {
  const idx = NAV_ITEMS.indexOf(item);
  if (idx <= 0) return 'Personal';
  if (idx <= 4) return 'Markets';
  if (idx <= 7) return 'Explorers';
  if (idx <= 9) return 'Tools';
  return 'Personal';
}

interface SidebarProps {
  route: string;
  navigate: (path: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ route, navigate, collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const currentGroup: string[] = [];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 lg:translate-x-0',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className={cn('flex h-14 items-center border-b border-border px-4', collapsed && 'justify-center px-0')}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <span className="text-base font-semibold tracking-tight text-foreground">
                Market<span className="text-primary">Pulse</span>
              </span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map((item, idx) => {
            const group = getGroup(item);
            if (!collapsed && !currentGroup.includes(group)) {
              currentGroup.push(group);
              return (
                <div key={item.path}>
                  <div className="px-4 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group}
                  </div>
                  <NavButton item={item} route={route} navigate={navigate} collapsed={collapsed} onMobileClose={onMobileClose} />
                </div>
              );
            }
            if (collapsed && idx === 0) currentGroup.length = 0;
            return (
              <NavButton key={item.path} item={item} route={route} navigate={navigate} collapsed={collapsed} onMobileClose={onMobileClose} />
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden border-t border-border p-2 lg:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-center"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </>
  );
}

function NavButton({
  item, route, navigate, collapsed, onMobileClose,
}: {
  item: NavItem;
  route: string;
  navigate: (path: string) => void;
  collapsed: boolean;
  onMobileClose: () => void;
}) {
  const isActive = route === item.path || (item.path !== '/' && route.startsWith(item.path));
  const Icon = item.icon;

  return (
    <button
      onClick={() => {
        navigate(item.path);
        onMobileClose();
      }}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2 text-sm font-medium transition-colors',
        collapsed && 'justify-center px-0',
        isActive
          ? 'border-l-2 border-primary bg-primary/10 text-primary'
          : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

interface TopBarProps {
  route: string;
  navigate: (path: string) => void;
  onMobileMenu: () => void;
  onOpenAuth: () => void;
}

export function TopBar({ navigate, onMobileMenu, onOpenAuth }: TopBarProps) {
  const store = useAppStore();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 200);
  const results = useSearch(debouncedQuery);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleResultClick(type: string, ticker: string) {
    setSearchQuery('');
    setShowResults(false);
    if (type === 'stock') navigate(`/stock/${ticker}`);
    else if (type === 'etf') navigate(`/etf/${ticker}`);
    else if (type === 'index') navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenu}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stocks, ETFs, indices..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="h-9 w-full rounded-lg border border-input bg-muted/30 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search results */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl">
            {results.map((r) => (
              <button
                key={`${r.type}-${r.ticker}`}
                onClick={() => handleResultClick(r.type, r.ticker)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{r.ticker}</span>
                  <span className="text-muted-foreground">{r.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">{r.type}</Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-2">
        {/* Data freshness */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-success/30 bg-success/5 px-2.5 py-1.5 sm:flex">
          <Zap className="h-3 w-3 text-success" />
          <span className="text-xs text-success font-medium">Live</span>
        </div>

        {/* Market indicator */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 sm:flex">
          <span className="text-xs font-medium text-foreground">US</span>
        </div>

        {/* Currency indicator */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 sm:flex">
          <span className="text-xs font-medium text-foreground">USD</span>
        </div>

        {/* Watchlist shortcut */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/watchlists')}>
          <Eye className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={store.toggleTheme}>
          {store.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Account */}
        {user ? (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button size="sm" className="h-8" onClick={onOpenAuth}>
            <LogIn className="h-4 w-4 mr-1.5" />
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
