
'use client';
import { db } from './firebase';
import type { Insight, WasteLog, PantryItem, Recipe, User, SavingsEvent } from '@/types';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    onSnapshot,
    query,
    writeBatch,
    Unsubscribe,
    getDocs,
    setDoc,
    getDoc,
    orderBy,
    limit,
    updateDoc
} from 'firebase/firestore';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useInsightStore } from '@/stores/insight-store';
import type { PantryLogItem } from '@/stores/pantry-store';

// --- Listener Management ---
const listenerManager: { [key: string]: Unsubscribe[] } = {
    wasteLogs: [],
    pantry: [],
    userSettings: [],
    savedRecipes: [],
    insights: [],
};

export const cleanupListeners = (key?: 'wasteLogs' | 'pantry' | 'userSettings' | 'savedRecipes' | 'insights') => {
    const unsubscribeAll = (keys: string[]) => {
        keys.forEach(k => {
            if (listenerManager[k]) {
                listenerManager[k].forEach(unsub => unsub());
                listenerManager[k] = [];
            }
        });
    };

    if (key) {
        unsubscribeAll([key]);
    } else {
        unsubscribeAll(Object.keys(listenerManager));
    }
};

// --- Cache Initialization ---
export const initializeUserCache = (userId: string) => {
    cleanupListeners();
    useWasteLogStore.getState().setLogsInitialized(false);
    usePantryLogStore.getState().setPantryInitialized(false);
    useInsightStore.getState().setInsightsInitialized(false);

    // Listener for Waste Logs
    const wasteLogsQuery = query(collection(db, `users/${userId}/wasteLogs`), orderBy('date', 'desc'));
    const wasteLogsUnsub = onSnapshot(wasteLogsQuery, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteLog));
        useWasteLogStore.getState().setLogs(logs);
        useWasteLogStore.getState().setLogsInitialized(true);
    }, (error) => {
        console.error("Error with wasteLogs listener:", error);
        useWasteLogStore.getState().setLogsInitialized(true); 
    });
    listenerManager.wasteLogs.push(wasteLogsUnsub);
    
    // Listener for Pantry Items
    const pantryQuery = query(collection(db, `users/${userId}/pantry`), orderBy('estimatedExpirationDate', 'asc'));
    const pantryUnsub = onSnapshot(pantryQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryItem));
        usePantryLogStore.getState().setLiveItems(items);
        usePantryLogStore.getState().setPantryInitialized(true);
    }, (error) => {
        console.error("Error with pantry listener:", error);
        usePantryLogStore.getState().setPantryInitialized(true);
    });
    listenerManager.pantry.push(pantryUnsub);
    
    // Listener for Insights
    const insightsQuery = query(collection(db, `users/${userId}/insights`), orderBy('date', 'desc'));
    const insightsUnsub = onSnapshot(insightsQuery, (snapshot) => {
        const insights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insight));
        useInsightStore.getState().setInsights(insights);
        useInsightStore.getState().setInsightsInitialized(true);
    }, (error) => {
        console.error("Error with insights listener:", error);
        useInsightStore.getState().setInsightsInitialized(true);
    });
    listenerManager.insights.push(insightsUnsub);
};


// --- Waste Log Functions ---
export const saveWasteLog = async (logData: Omit<WasteLog, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, `users/${logData.userId}/wasteLogs`), logData);
    return docRef.id;
};

export const getWasteLogsForUser = async (userId: string): Promise<WasteLog[]> => {
    const q = query(collection(db, `users/${userId}/wasteLogs`), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteLog));
};

export const deleteWasteLog = async (userId: string, logId: string) => {
    await deleteDoc(doc(db, `users/${userId}/wasteLogs`, logId));
};

// --- Pantry Functions ---
export const getPantryItemsForUser = async (userId: string): Promise<PantryItem[]> => {
    const q = query(collection(db, `users/${userId}/pantry`), orderBy('estimatedExpirationDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryItem));
};

export const savePantryItems = async (userId: string, itemsToSave: PantryLogItem[]): Promise<PantryItem[]> => {
    const batch = writeBatch(db);
    const savedItems: PantryItem[] = [];
    const pantryCollection = collection(db, `users/${userId}/pantry`);
    
    itemsToSave.forEach(item => {
        const docRef = doc(pantryCollection, item.id);
        const { id, ...itemData } = item;

        const newItemData: Omit<PantryItem, 'id'> = {
            name: itemData.name,
            estimatedAmount: itemData.estimatedAmount,
            estimatedExpirationDate: itemData.estimatedExpirationDate,
            addedDate: new Date().toISOString(),
            carbonFootprint: itemData.carbonFootprint || 0,
            status: 'live', // New items are always live
        };
        
        // Add optional fields only if they have a value
        if (itemData.storageLocation) newItemData.storageLocation = itemData.storageLocation;
        if (itemData.useByTimeline) newItemData.useByTimeline = itemData.useByTimeline;
        if (itemData.purchaseSource) newItemData.purchaseSource = itemData.purchaseSource;
        if (itemData.estimatedCost) newItemData.estimatedCost = itemData.estimatedCost;

        batch.set(docRef, newItemData);
        savedItems.push({ ...newItemData, id: item.id });
    });

    await batch.commit();
    return savedItems;
};

export const updatePantryItemStatus = async (userId: string, itemId: string, status: 'used' | 'wasted') => {
    const itemRef = doc(db, `users/${userId}/pantry`, itemId);
    await updateDoc(itemRef, { status });
    // This function only updates the status. The item is not deleted from the pantry collection.
    // It will be filtered out in the UI based on its status.
    // In a real app, you might move it to a different collection or have a cron job for cleanup.
};


export const deletePantryItem = async (userId: string, itemId: string) => {
    await deleteDoc(doc(db, `users/${userId}/pantry`, itemId));
};


// --- Recipe Functions ---
export const getSavedRecipes = async (userId: string): Promise<Recipe[]> => {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/savedRecipes`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
}

export const saveRecipe = async (userId: string, recipe: Recipe): Promise<string> => {
    const recipeRef = doc(db, `users/${userId}/savedRecipes`, recipe.id);
    await setDoc(recipeRef, recipe);
    return recipe.id;
}

export const unsaveRecipe = async (userId: string, recipeId: string) => {
    await deleteDoc(doc(db, `users/${userId}/savedRecipes`, recipeId));
}

// --- Insight Functions ---
export const getLatestInsight = async (userId: string): Promise<Insight | null> => {
    const q = query(collection(db, `users/${userId}/insights`), orderBy('date', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Insight;
};

export const saveInsight = async (insightData: Omit<Insight, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, `users/${insightData.userId}/insights`), insightData);
    return docRef.id;
};

export const updateInsightStatus = async (userId: string, insightId: string, status: Insight['status']) => {
    const insightRef = doc(db, `users/${userId}/insights`, insightId);
    await updateDoc(insightRef, { status });
};


// --- User Settings Functions ---
export const getUserSettings = async (userId: string): Promise<any> => {
    const docRef = doc(db, `users/${userId}/settings`, 'app');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : {};
};

export const saveUserSettings = async (userId: string, settings: any) => {
    const docRef = doc(db, `users/${userId}/settings`, 'app');
    await setDoc(docRef, settings, { merge: true });
};

// --- Savings Functions ---
export const saveSavingsEvent = async (userId: string, event: Omit<SavingsEvent, 'id'>): Promise<string> => {
    const savingsCollection = collection(db, `users/${userId}/savingsEvents`);
    const docRef = await addDoc(savingsCollection, event);
    return docRef.id;
};
