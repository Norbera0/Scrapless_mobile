
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
    updateDoc,
    runTransaction,
    collectionGroup,
    where
} from 'firebase/firestore';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useInsightStore } from '@/stores/insight-store';
import type { PantryLogItem } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import { FOOD_DATA_MAP } from './food-data';

// --- Listener Management ---
const listenerManager: { [key: string]: Unsubscribe[] } = {
    wasteLogs: [],
    pantry: [],
    userSettings: [],
    savedRecipes: [],
    insights: [],
    savingsEvents: [],
};

export const cleanupListeners = (key?: 'wasteLogs' | 'pantry' | 'userSettings' | 'savedRecipes' | 'insights' | 'savingsEvents') => {
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
    useSavingsStore.getState().setSavingsInitialized(false);

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
    
    // Listener for Archived Pantry Items
    const archivedPantryQuery = query(collection(db, `users/${userId}/archivedPantryItems`), orderBy('addedDate', 'desc'), limit(100)); // Limit to last 100 for performance
    const archivedPantryUnsub = onSnapshot(archivedPantryQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryItem));
        usePantryLogStore.getState().setArchivedItems(items);
    }, (error) => {
        console.error("Error with archivedPantry listener:", error);
    });

    listenerManager.pantry.push(pantryUnsub, archivedPantryUnsub);
    
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

    // Listener for Savings Events
    const savingsQuery = query(collection(db, `users/${userId}/savingsEvents`), orderBy('date', 'desc'));
    const savingsUnsub = onSnapshot(savingsQuery, (snapshot) => {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsEvent));
        useSavingsStore.getState().setSavingsEvents(events);
        useSavingsStore.getState().setSavingsInitialized(true);
    }, (error) => {
        console.error("Error with savings listener:", error);
        useSavingsStore.getState().setSavingsInitialized(true);
    });
    listenerManager.savingsEvents.push(savingsUnsub);
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

export const getExpiredPantryItems = async (userId: string): Promise<PantryItem[]> => {
    const todayISO = new Date().toISOString();
    const q = query(
        collection(db, `users/${userId}/pantry`), 
        where('estimatedExpirationDate', '<', todayISO)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryItem));
};

export const moveExpiredItemsToWaste = async (userId: string, expiredItems: PantryItem[]) => {
    if (expiredItems.length === 0) return;

    const batch = writeBatch(db);

    const getImpact = (itemName: string): { peso: number; co2e: number } => {
        const lowerCaseItem = itemName.toLowerCase();
        for (const key in FOOD_DATA_MAP) {
            if (lowerCaseItem.includes(key)) {
                return { peso: FOOD_DATA_MAP[key].peso, co2e: FOOD_DATA_MAP[key].co2e };
            }
        }
        return { peso: 5, co2e: 0.1 }; // Default
    };

    let totalPesoValue = 0;
    let totalCarbonFootprint = 0;

    const foodItemsForLog = expiredItems.map(item => {
        const { peso, co2e } = getImpact(item.name);
        totalPesoValue += peso;
        totalCarbonFootprint += co2e;
        return {
            id: item.id,
            name: item.name,
            estimatedAmount: `${item.quantity} ${item.unit}`,
            pesoValue: peso,
            carbonFootprint: co2e,
            wasteReason: 'Past expiry date',
        };
    });
    
    // 1. Create a new single waste log for all expired items
    const wasteLogRef = doc(collection(db, `users/${userId}/wasteLogs`));
    const newWasteLog: Omit<WasteLog, 'id'> = {
        date: new Date().toISOString(),
        userId,
        items: foodItemsForLog,
        totalPesoValue,
        totalCarbonFootprint,
        sessionWasteReason: 'Past expiry date',
    };
    batch.set(wasteLogRef, newWasteLog);

    // 2. Move items from pantry to archivedPantryItems
    for (const item of expiredItems) {
        const pantryRef = doc(db, `users/${userId}/pantry`, item.id);
        const archiveRef = doc(db, `users/${userId}/archivedPantryItems`, item.id);
        const archivedData: PantryItem = { 
            ...item, 
            status: 'wasted', 
            usedDate: new Date().toISOString() 
        };

        batch.set(archiveRef, archivedData);
        batch.delete(pantryRef);
    }
    
    await batch.commit();
    console.log(`Successfully moved ${expiredItems.length} expired items to waste log.`);
};


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
            ...itemData,
            addedDate: new Date().toISOString(),
            status: 'live', // New items are always live
        };
        
        batch.set(docRef, newItemData);
        savedItems.push({ ...newItemData, id: item.id });
    });

    await batch.commit();
    return savedItems;
};

export const updatePantryItemStatus = async (userId: string, itemId: string, status: 'used' | 'wasted', newQuantity?: number) => {
    const itemRef = doc(db, `users/${userId}/pantry`, itemId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const itemSnap = await transaction.get(itemRef);
            if (!itemSnap.exists()) {
                console.log(`Pantry item ${itemId} not found, likely already archived.`);
                return;
            }
    
            const itemData = itemSnap.data() as Omit<PantryItem, 'id'>;

            if (newQuantity !== undefined && newQuantity > 0) {
                // This is a partial use, so just update the quantity
                transaction.update(itemRef, { quantity: newQuantity });
            } else {
                // This is a full use or waste, so move it to archives
                const archiveRef = doc(db, `users/${userId}/archivedPantryItems`, itemId);
                const archivedData = { ...itemData, status: status, usedDate: new Date().toISOString(), quantity: 0 };
                transaction.set(archiveRef, archivedData);
                transaction.delete(itemRef);
            }
        });
    } catch (error) {
        console.error("Transaction to update/archive pantry item failed:", error);
    }
};

export const deletePantryItem = async (userId: string, itemId: string) => {
    await deleteDoc(doc(db, `users/${userId}/pantry`, itemId));
};

export const getUserWasteStats = async (userId: string): Promise<{ avgWasteRate: number; logsCount: number }> => {
    const archivedItemsQuery = query(collection(db, `users/${userId}/archivedPantryItems`));
    const querySnapshot = await getDocs(archivedItemsQuery);
    
    if (querySnapshot.empty) {
        return { avgWasteRate: 0, logsCount: 0 };
    }

    let wastedCount = 0;
    let usedCount = 0;

    querySnapshot.forEach(doc => {
        const item = doc.data() as PantryItem;
        if (item.status === 'wasted') {
            wastedCount++;
        } else if (item.status === 'used') {
            usedCount++;
        }
    });

    const totalLogs = wastedCount + usedCount;
    const avgWasteRate = totalLogs > 0 ? wastedCount / totalLogs : 0;
    
    return { avgWasteRate, logsCount: totalLogs };
}


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
