import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, GitCompare, Search, Database, Menu, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const NAV_ITEMS = [
  { icon: BarChart3, label: 'Overview', path: '/' },
  { icon: GitCompare, label: 'Comparison', path: '/comparison' },
  { icon: Search, label: 'Vehicle Lookup', path: '/vehicle' },
  { icon: Database, label: 'Data Status', path: '/status' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="md:hidden flex items-center justify-between border-b px-4 py-3 bg-card">
      <Link to="/" className="flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" />
        <span className="text-sm font-bold text-primary">Autoturg</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="px-5 py-5 border-b">
            <SheetTitle className="flex items-center gap-2 text-left">
              <Car className="h-5 w-5 text-primary" />
              <span className="text-primary">Autoturg</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="px-3 py-4 space-y-1">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
              const isActive =
                path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(path);

              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
