
/**
 * @fileOverview A centralized unit conversion library for ingredients.
 */

// Represents the canonical base unit for a type of measurement.
type BaseUnit = 'g' | 'ml' | 'pcs' | 'clove' | 'leaf';

// Defines conversion factors for a specific ingredient or category.
interface ConversionConfig {
  baseUnit: BaseUnit;
  // A map where the key is a unit (e.g., 'kg', 'cup') and the value is its factor relative to the baseUnit.
  factors: Record<string, number>;
}

// Main conversion map. Can be extended with more ingredients.
const conversions: Record<string, ConversionConfig> = {
  // --- Generic Conversions ---
  weight: {
    baseUnit: 'g',
    factors: {
      'kg': 1000,
      'g': 1,
      'mg': 0.001,
      'oz': 28.35,
      'lb': 453.592,
    }
  },
  volume: {
    baseUnit: 'ml',
    factors: {
      'l': 1000,
      'ml': 1,
      'cup': 240, // US cup
      'tbsp': 15,
      'tsp': 5,
    }
  },
  quantity: {
    baseUnit: 'pcs',
    factors: {
        'pcs': 1,
        'piece': 1,
        'dozen': 12,
    }
  },
  // --- Specific Ingredient Conversions ---
  garlic: {
    baseUnit: 'clove',
    factors: {
      'bulb': 10, // Approx. 10 cloves per bulb
      'clove': 1,
    }
  },
  herbs: {
      baseUnit: 'leaf',
      factors: {
          'sprig': 5,
          'bunch': 50,
          'leaf': 1,
      }
  }
};

/**
 * Finds the appropriate conversion configuration for a given ingredient.
 * @param itemName The name of the ingredient (e.g., "garlic", "flour").
 * @returns The matching ConversionConfig or a generic one.
 */
const getConversionConfig = (itemName: string): ConversionConfig => {
    const lowerItem = itemName.toLowerCase();
    if (lowerItem.includes('garlic')) return conversions.garlic;

    // Add more specific ingredient checks here...

    // Fallback to generic types
    const weightUnits = Object.keys(conversions.weight.factors);
    if (weightUnits.some(unit => lowerItem.includes(unit))) return conversions.weight;
    
    const volumeUnits = Object.keys(conversions.volume.factors);
    if (volumeUnits.some(unit => lowerItem.includes(unit))) return conversions.volume;

    return conversions.quantity; // Default fallback
}

/**
 * Converts a given quantity and unit to its base unit equivalent.
 * @param quantity The amount of the ingredient.
 * @param unit The unit of the ingredient (e.g., 'kg', 'bulb').
 * @param itemName The name of the ingredient to determine context.
 * @returns An object with the quantity in the base unit and the base unit itself.
 * @throws An error if the unit is not recognized.
 */
export const convertToBaseUnit = (quantity: number, unit: string, itemName: string): { quantity: number, unit: BaseUnit } => {
    const config = getConversionConfig(itemName);
    const normalizedUnit = unit.toLowerCase().replace(/s$/, ''); // Handle plurals

    const factor = config.factors[normalizedUnit];
    if (factor === undefined) {
        // If not found in specific config, try generic configs
        if (conversions.weight.factors[normalizedUnit]) {
            return { quantity: quantity * conversions.weight.factors[normalizedUnit], unit: 'g' };
        }
        if (conversions.volume.factors[normalizedUnit]) {
            return { quantity: quantity * conversions.volume.factors[normalizedUnit], unit: 'ml' };
        }
        if (conversions.quantity.factors[normalizedUnit]) {
            return { quantity: quantity * conversions.quantity.factors[normalizedUnit], unit: 'pcs' };
        }
        throw new Error(`Unrecognized unit "${unit}" for item "${itemName}".`);
    }

    return { quantity: quantity * factor, unit: config.baseUnit };
};

/**
 * Converts a quantity from a base unit back to a specified target unit.
 * @param quantity The amount in the base unit.
 * @param baseUnit The base unit of the quantity.
 * @param targetUnit The desired final unit.
 * @param itemName The name of the ingredient for context.
 * @returns An object with the converted quantity and the target unit.
 * @throws An error if the conversion is not possible.
 */
export const convertFromBaseUnit = (quantity: number, baseUnit: BaseUnit, targetUnit: string, itemName: string): { quantity: number, unit: string } => {
    const config = getConversionConfig(itemName);
     const normalizedTargetUnit = targetUnit.toLowerCase().replace(/s$/, '');

    if (config.baseUnit !== baseUnit) {
        // This case indicates a mismatch in logic, e.g. trying to convert grams from a 'pcs' base.
        // A more advanced system could handle density conversions (e.g., grams of flour to cups).
        // For now, we throw an error if the base units don't align.
        
        // Attempt to find the target unit in ANY config
        const allConfigs = [conversions.weight, conversions.volume, conversions.quantity, conversions.garlic, conversions.herbs];
        const targetConfig = allConfigs.find(c => c.factors[normalizedTargetUnit]);

        if (!targetConfig || targetConfig.baseUnit !== baseUnit) {
           throw new Error(`Cannot convert from base unit "${baseUnit}" to "${targetUnit}" for item "${itemName}". Mismatched types.`);
        }
    }

    const factor = config.factors[normalizedTargetUnit];
    if (factor === undefined) {
        throw new Error(`Unrecognized target unit "${targetUnit}" for item "${itemName}".`);
    }

    return { quantity: quantity / factor, unit: targetUnit };
}
