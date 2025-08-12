
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useExpiryStore } from "@/stores/expiry-store";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { moveExpiredItemsToWaste } from "@/lib/data";
import { Loader2 } from "lucide-react";

export function ExpiredItemsDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { expiredItemsToShow, clearExpiredItems } = useExpiryStore();
  const [isLogging, setIsLogging] = useState(false);

  const isOpen = expiredItemsToShow.length > 0;
  const itemNames = expiredItemsToShow.map(item => item.name).slice(0, 3).join(', ');
  const additionalItemsCount = expiredItemsToShow.length > 3 ? `and ${expiredItemsToShow.length - 3} more` : '';

  const handleLogWaste = async () => {
    if (!user || expiredItemsToShow.length === 0) return;

    setIsLogging(true);
    try {
      await moveExpiredItemsToWaste(user.uid, expiredItemsToShow);
      toast({
        title: "Waste Logged",
        description: `${expiredItemsToShow.length} expired item(s) have been moved to your waste history.`,
      });
      clearExpiredItems();
    } catch (error) {
      console.error("Failed to log expired items:", error);
      toast({
        variant: "destructive",
        title: "Logging Failed",
        description: "Could not log expired items. Please try again later.",
      });
    } finally {
      setIsLogging(false);
    }
  };
  
  const handleIgnore = () => {
    // In a real app, you might mark these items as "ignored_expiry" in Firestore
    // For this mock, we just clear them from the prompt.
    toast({
        title: "Got it!",
        description: "We won't prompt you for these items again this session."
    });
    clearExpiredItems();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && clearExpiredItems()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Heads up! Some items have expired.</AlertDialogTitle>
          <AlertDialogDescription>
            We detected that {itemNames} {additionalItemsCount} in your pantry have passed their expiration date. Would you like to log them as waste to keep your pantry and insights accurate?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={handleIgnore} disabled={isLogging}>
            Ignore For Now
          </Button>
          <AlertDialogAction onClick={handleLogWaste} disabled={isLogging}>
            {isLogging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Log as Waste
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
