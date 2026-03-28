import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, User, Crown } from 'lucide-react';

export default function UserMenu() {
  const { user, tier, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-auto py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium truncate">{user.email}</p>
            {tier === 'subscriber' && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Crown className="h-3 w-3" /> Pro
              </p>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-2">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium truncate">{user.email}</p>
          <div className="mt-1">
            {tier === 'subscriber' ? (
              <Badge variant="default" className="text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                <Crown className="h-3 w-3" /> Pro
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                <User className="h-3 w-3" /> Free
              </Badge>
            )}
          </div>
        </div>
        <Separator className="my-1" />
        <button
          onClick={() => { signOut(); setOpen(false); }}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
