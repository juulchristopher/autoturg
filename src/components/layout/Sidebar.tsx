import { Link, useLocation } from 'react-router-dom';
import { BarChart3, GitCompare, Search, Database, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Separator } from '@/components/ui/separator';

const NAV_ITEMS = [
  { icon: BarChart3, label: 'Overview', path: '/' },
  { icon: GitCompare, label: 'Comparison', path: '/comparison' },
  { icon: Search, label: 'Vehicle Lookup', path: '/vehicle' },
  { icon: Database, label: 'Data Status', path: '/status' },
];

export default function Sidebar() {
  const location = useLocation();
  const { loading, db } = useData();

  const monthCount = db.jarelturg.length;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-card h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-primary">Autoturg</span>
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

      {/* Status */}
      <div className="px-5 py-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
      </div>
    </aside>
  );
}
