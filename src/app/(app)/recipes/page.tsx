
'use client';

import { RecipeGenerator } from '@/components/recipes/RecipeGenerator';

export default function RecipesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Recipe Generator</h1>
        <p className="text-muted-foreground">
          Get recipe ideas based on your pantry items.
        </p>
      </div>
      <RecipeGenerator />
    </div>
  );
}
