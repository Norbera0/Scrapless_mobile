
'use client';
import { db } from './firebase';
import type { WasteLog, PantryItem, Recipe, User, SavingsEvent, GreenPointsEvent, UserSettings } from '@/types';
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
import type { PantryLogItem } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import { useGreenPointsStore } from '@/stores/green-points-store';
import { FOOD_DATA_MAP } from './food-data';
import { GREEN_POINTS_CONFIG } from './points-config';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';
import { useUserSettingsStore } from '@/stores/user-settings-store';

// --- Listener Management ---
const listenerManager: { [key: string]: Unsubscribe[] } = {
    wasteLogs: [],
    pantry: [],
    userSettings: [],
    savedRecipes: [],
    savingsEvents: [],
    greenPointsEvents: [],
};

export const cleanupListeners = (key?: keyof typeof listenerManager) => {
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

const defaultSettings: UserSettings = {
    language: 'en',
    savingsGoal: 5000,
    householdSize: '2',
    monthlyBudget: '6k_10k',
    dietaryRestrictions: [],
    foodAllergies: '',
    cookingFrequency: 'daily',
    shoppingLocations: ['supermarket'],
    primaryGoal: 'save_money',
    notes: '',
};

// --- Cache Initialization ---
export const initializeUserCache = (userId: string) => {
    cleanupListeners();
    useWasteLogStore.getState().setLogsInitialized(false);
    usePantryLogStore.getState().setPantryInitialized(false);
    useSavingsStore.getState().setSavingsInitialized(true); // Should be true, as it's just a local cache for now.
    useGreenPointsStore.getState().setPointsInitialized(false);
    useUserSettingsStore.getState().setSettingsInitialized(false);

    // Listener for User Settings
    const settingsDoc = doc(db, `users/${userId}/settings`, 'app');
    const settingsUnsub = onSnapshot(settingsDoc, (doc) => {
        const settings = doc.data() as UserSettings;
        // Ensure default values if fields are missing
        const finalSettings = { ...defaultSettings, ...settings };
        useUserSettingsStore.getState().setSettings(finalSettings);
        useUserSettingsStore.getState().setSettingsInitialized(true);
    }, (error) => {
        console.error("Error with settings listener:", error);
        // Set default settings on error
        useUserSettingsStore.getState().setSettings(defaultSettings);
        useUserSettingsStore.getState().setSettingsInitialized(true);
    });
    listenerManager.userSettings.push(settingsUnsub);


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
    
    // Listener for Savings Events
    const savingsQuery = query(collection(db, `users/${userId}/savingsEvents`), orderBy('date', 'desc'));
    const savingsUnsub = onSnapshot(savingsQuery, (snapshot) => {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsEvent));
        useSavingsStore.getState().setSavingsEvents(events);
    }, (error) => {
        console.error("Error with savings listener:", error);
    });
    listenerManager.savingsEvents.push(savingsUnsub);

    // Listener for Green Points Events
    const greenPointsQuery = query(collection(db, `users/${userId}/greenPointsEvents`), orderBy('date', 'desc'));
    const greenPointsUnsub = onSnapshot(greenPointsQuery, (snapshot) => {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GreenPointsEvent));
        useGreenPointsStore.getState().setEvents(events);
        useGreenPointsStore.getState().setPointsInitialized(true);
    }, (error) => {
        console.error("Error with Green Points listener:", error);
        useGreenPointsStore.getState().setPointsInitialized(true);
    });
    listenerManager.greenPointsEvents.push(greenPointsUnsub);
};


// --- Waste Log Functions ---
export const saveWasteLog = async (logData: Omit<WasteLog, 'id'>): Promise<string> => {
    const batch = writeBatch(db);
    const wasteLogsCollection = collection(db, `users/${logData.userId}/wasteLogs`);
    const docRef = doc(wasteLogsCollection);
    batch.set(docRef, logData);

    // Check for zero-waste week achievement before this log
    const lastLogQuery = query(wasteLogsCollection, orderBy('date', 'desc'), limit(1));
    const lastLogSnapshot = await getDocs(lastLogQuery);

    if (!lastLogSnapshot.empty) {
        const lastLog = lastLogSnapshot.docs[0].data() as WasteLog;
        const daysBetween = differenceInDays(parseISO(logData.date), parseISO(lastLog.date));
        
        if (daysBetween >= 7) {
            const pointsConfig = GREEN_POINTS_CONFIG.zero_waste_week;
            const pointsEvent: Omit<GreenPointsEvent, 'id'> = {
                userId: logData.userId,
                date: new Date().toISOString(),
                type: 'zero_waste_week',
                points: pointsConfig.points,
                description: pointsConfig.defaultDescription(),
            };
            const pointsDocRef = doc(collection(db, `users/${logData.userId}/greenPointsEvents`));
            batch.set(pointsDocRef, pointsEvent);
        }
    }

    await batch.commit();
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

export const savePantryItems = async (userId: string, itemsToSave: PantryItem[]): Promise<PantryItem[]> => {
    const batch = writeBatch(db);
    const savedItems: PantryItem[] = [];
    const pantryCollection = collection(db, `users/${userId}/pantry`);
    
    itemsToSave.forEach(item => {
        const docRef = doc(pantryCollection, item.id); // Use existing ID for updates or new for creation
        
        // If it's a new item, set the added date
        const isNewItem = !item.addedDate;
        const itemData: PantryItem = {
            ...item,
            userId,
            addedDate: isNewItem ? new Date().toISOString() : item.addedDate,
            status: 'live',
        };
        
        batch.set(docRef, itemData, { merge: true }); // Use merge to avoid overwriting fields if it's an update
        savedItems.push(itemData);

        if (isNewItem) {
            // Award Green Points only for logging a new item
            const pointsConfig = GREEN_POINTS_CONFIG.log_pantry_item;
            const pointsEvent: Omit<GreenPointsEvent, 'id'> = {
                userId,
                date: new Date().toISOString(),
                type: 'log_pantry_item',
                points: pointsConfig.points,
                description: pointsConfig.defaultDescription(item.name),
                relatedPantryItemId: item.id,
            };
            const pointsDocRef = doc(collection(db, `users/${userId}/greenPointsEvents`));
            batch.set(pointsDocRef, pointsEvent);
        }
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
    await setDoc(recipeRef, recipe, { merge: true });
    return recipe.id;
}

export const unsaveRecipe = async (userId: string, recipeId: string) => {
    await deleteDoc(doc(db, `users/${userId}/savedRecipes`, recipeId));
}

export const scheduleRecipe = async (userId: string, recipe: Recipe, scheduledDate: string, mealType: Recipe['mealType']) => {
    const savedRecipeCollection = collection(db, `users/${userId}/savedRecipes`);
    const recipeQuery = query(savedRecipeCollection, where('id', '==', recipe.id));
    const querySnapshot = await getDocs(recipeQuery);

    let docRef;
    if (querySnapshot.empty) {
        docRef = doc(savedRecipeCollection, recipe.id);
    } else {
        docRef = querySnapshot.docs[0].ref;
    }

    console.log('[scheduleRecipe] Saving to Firestore:', { isScheduled: true, scheduledDate, mealType });

    // Create a new object without the photoDataUri to avoid saving large base64 strings
    const { photoDataUri, ...recipeToSave } = recipe;

    await setDoc(docRef, {
        ...recipeToSave,
        isScheduled: true,
        scheduledDate,
        mealType,
    }, { merge: true });
};

// --- User Settings Functions ---
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
    const docRef = doc(db, `users/${userId}/settings`, 'app');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const settings = docSnap.data() as UserSettings;
        // Ensure default values if fields are missing
        return { ...defaultSettings, ...settings };
    }
    // Return default settings if document doesn't exist
    return defaultSettings;
};


export const saveUserSettings = async (userId: string, settings: UserSettings) => {
    const docRef = doc(db, `users/${userId}/settings`, 'app');
    await setDoc(docRef, settings, { merge: true });
};

// --- Savings Functions ---
export const saveSavingsEvent = async (userId: string, event: Omit<SavingsEvent, 'id'>): Promise<string> => {
    const savingsCollection = collection(db, `users/${userId}/savingsEvents`);
    const docRef = await addDoc(savingsCollection, event);
    return docRef.id;
};


// --- Green Points Functions ---
export const saveGreenPointsEvent = async (userId: string, event: Omit<GreenPointsEvent, 'id'>): Promise<string> => {
    const greenPointsCollection = collection(db, `users/${userId}/greenPointsEvents`);
    const docRef = await addDoc(greenPointsCollection, event);
    return docRef.id;
};
