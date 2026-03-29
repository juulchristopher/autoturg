import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, GitCompare, Search, Database, Car, LogIn, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import LoginDialog from '@/components/shared/LoginDialog';
import UserMenu from '@/components/shared/UserMenu';

const NAV_ITEMS = [
  { icon: BarChart3, label: 'Overview', path: '/' },
  { icon: GitCompare, label: 'Comparison', path: '/comparison' },
  { icon: Search, label: 'Vehicle Lookup', path: '/vehicle' },
  { icon: Database, label: 'Data Status', path: '/status' },
  { icon: CreditCard, label: 'Pricing', path: '/pricing' },
];

export default function Sidebar() {
  const location = useLocation();
  const { loading, db } = useData();
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const monthCount = db.jarelturg.length;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r h-screen sticky top-0 bg-gradient-to-b from-card via-card to-primary/[0.03]">
      {/* Brand */}
      <div className="px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-primary">Autoturg Orchestrator</span>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Estonian Vehicle Market Intelligence
        </p>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Status + auth */}
      <div className="px-3 py-4 border-t space-y-3">
        <div className="px-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              loading
                ? 'bg-yellow-500 animate-pulse'
                : monthCount > 0
                  ? 'bg-green-500'
                  : 'bg-red-500'
            )}
          />
          {loading ? 'Loading data...' : `${monthCount} months loaded`}
        </div>

        {user ? (
          <UserMenu />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => setLoginOpen(true)}
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </Button>
        )}

        <Link
          to="/privacy"
          className="block text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Privacy policy
        </Link>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </aside>
  );
}
