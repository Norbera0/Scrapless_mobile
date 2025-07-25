
import { PantryDashboard } from '@/components/pantry/PantryDashboard';
import { getPantryItemsForUser } from '@/lib/data';
import { auth } from '@/lib/firebase/server';
import type { PantryItem } from '@/types';

export default async function PantryPage() {
  let items: PantryItem[] = [];
  try {
    const user = auth.currentUser;
    if (user) {
      items = await getPantryItemsForUser(user.uid);
    }
  } catch (e) {
    console.error('Failed to fetch pantry items:', e);
    // Handle error case, maybe show a message
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Virtual Pantry</h1>
        <p className="text-muted-foreground">
          Keep track of your food items to reduce waste.
        </p>
      </div>
      <PantryDashboard initialItems={items} />
    </div>
  );
}
