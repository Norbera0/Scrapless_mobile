'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

// This providers file is a placeholder for future client-side providers.
// For now, it initializes the useAuth hook.

export function Providers({ children }: { children: ReactNode }) {
  useAuth();
  return <>{children}</>;
}
