
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { PantryLogger } from '@/components/pantry/PantryLogger';

export default function AddToPantryPage() {
  const router = useRouter();
  const resetStore = usePantryLogStore((state) => state.reset);

  useEffect(() => {
    // Reset the store to ensure a clean slate for each new entry.
    resetStore();
  }, [resetStore]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Add to Pantry</h1>
        <p className="text-muted-foreground">
          Log your new groceries using your camera, voice, or by typing.
        </p>
      </div>
      <PantryLogger />
    </div>
  );
}
