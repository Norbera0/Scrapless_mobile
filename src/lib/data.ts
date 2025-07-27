
'use client';
import { db } from './firebase';
import type { WasteLog, PantryItem, Recipe, User } from '@/types';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    onSnapshot,
    query,
    where,
    writeBatch,
    Unsubscribe,
    getDocs,
    setDoc,
    getDoc,
    orderBy
} from 'firebase/firestore';

// --- Listener Management ---
// This will hold all active unsubscribe functions for the current user.
const listenerManager: { [key: string]: Unsubscribe[] } = {
    wasteLogs: [],
    pantry: [],
    userSettings: [],
    savedRecipes: []
};

// Function to unsubscribe from all active listeners for a specific key or all.
export const cleanupListeners = (key?: 'wasteLogs' | 'pantry' | 'userSettings' | 'savedRecipes') => {
    const unsubscribeAll = (keys: string[]) => {
        keys.forEach(k => {
            if (listenerManager[k]) {
                listenerManager[k].forEach(unsub => unsub());
                listenerManager[k] = []; // Clear the array
                console.log(`Unsubscribed from all ${k} listeners.`);
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
/**
 * Initializes real-time listeners for all user-specific data.
 * This should be called on user login.
 */
export const initializeUserCache = (userId: string) => {
    console.log(`Initializing user cache for ${userId}...`);
    // Ensure any previous listeners are cleaned up before starting new ones.
    cleanupListeners();

    // Listener for Waste Logs
    const wasteLogsQuery = query(collection(db, `users/${userId}/wasteLogs`), orderBy('date', 'desc'));
    const wasteLogsUnsub = onSnapshot(wasteLogsQuery, (snapshot) => {
        console.log(`Firestore: Received wasteLogs snapshot with ${snapshot.docs.length} documents.`);
        // In a real app, you'd likely update a client-side store (like Zustand or React Context) here.
        // For this implementation, we rely on Firestore's cache to serve data to get... functions.
    }, (error) => {
        console.error("Error with wasteLogs listener:", error);
    });
    listenerManager.wasteLogs.push(wasteLogsUnsub);
    
    // Listener for Pantry Items
    const pantryQuery = query(collection(db, `users/${userId}/pantry`), orderBy('estimatedExpirationDate', 'asc'));
    const pantryUnsub = onSnapshot(pantryQuery, (snapshot) => {
        console.log(`Firestore: Received pantry snapshot with ${snapshot.docs.length} documents.`);
    }, (error) => {
        console.error("Error with pantry listener:", error);
    });
    listenerManager.pantry.push(pantryUnsub);
    
    // Listener for Saved Recipes
    const savedRecipesQuery = query(collection(db, `users/${userId}/savedRecipes`));
    const savedRecipesUnsub = onSnapshot(savedRecipesQuery, (snapshot) => {
        console.log(`Firestore: Received savedRecipes snapshot with ${snapshot.docs.length} documents.`);
    }, (error) => {
        console.error("Error with savedRecipes listener:", error);
    });
    listenerManager.savedRecipes.push(savedRecipesUnsub);
};


// --- Waste Log Functions ---
export const saveWasteLog = async (userId: string, newLog: Omit<WasteLog, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, `users/${userId}/wasteLogs`), newLog);
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

export const savePantryItems = async (userId: string, newItems: Omit<PantryItem, 'id'>[]): Promise<string[]> => {
    const batch = writeBatch(db);
    const itemIds: string[] = [];
    const pantryCollection = collection(db, `users/${userId}/pantry`);
    
    newItems.forEach(item => {
        const docRef = doc(pantryCollection); // Create a new doc with a random ID
        batch.set(docRef, item);
        itemIds.push(docRef.id);
    });

    await batch.commit();
    return itemIds;
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
