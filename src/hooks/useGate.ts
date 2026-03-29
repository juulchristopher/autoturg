import { useAuth } from '@/context/AuthContext';
import type { UserTier } from '@/types';

/**
 * Returns whether the current user can access a given tier of content.
 *
 * Usage:
 *   const { canAccess } = useGate();
 *   if (!canAccess('subscriber')) { ... }
 */
export function useGate() {
  const { tier, user, loading } = useAuth();

  return {
    tier,
    user,
    loading,
    canAccess: (required: UserTier): boolean => {
      if (required === 'free') return true;
      if (required === 'subscriber') return tier === 'subscriber';
      return false;
    },
  };
}
