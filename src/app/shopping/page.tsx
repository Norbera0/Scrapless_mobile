
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackagePlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ShoppingHubPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateList = () => {
    setIsLoading(true);
    // TODO: Implement the actual smart list generation logic.
    // For now, we'll just simulate a delay.
    setTimeout(() => {
        setIsLoading(false);
        toast({
            title: 'List Generated!',
            description: 'Your smart shopping list is ready. (Feature coming soon)',
        });
    }, 1500);
  };


  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Generate Smart List</h1>
        <p className="text-muted-foreground">
          Create a shopping list based on your pantry and waste patterns.
        </p>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Create This Week's List</CardTitle>
            <CardDescription>Our AI will analyze your current pantry, items you're running low on, and your common waste habits to suggest a shopping list that helps you buy just what you need.</CardDescription>
        </CardHeader>
        <CardContent>
             <Button className="w-full" onClick={handleGenerateList} disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Generate Shopping List
                    </>
                )}
            </Button>
        </CardContent>
    </Card>
    </div>
  );
}
