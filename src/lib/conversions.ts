
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
      'gram': 1,
      'mg': 0.001,
      'oz': 28.35,
      'lb': 453.592,
    }
  },
  volume: {
    baseUnit: 'ml',
    factors: {
      'l': 1000,
      'liter': 1000,
      'ml': 1,
      'cup': 240, // US cup
      'tbsp': 15,
      'tsp': 5,
      'fl oz': 29.5735,
    }
  },
  quantity: {
    baseUnit: 'pcs',
    factors: {
        'pcs': 1,
        'piece': 1,
        'dozen': 12,
        'potato': 1, // Treat 'potato' as a unit of 1 piece
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
  },
  rice: {
    baseUnit: 'g',
    factors: {
        'cup': 185, // Approx. 185g for 1 cup of uncooked rice
    }
  },
  egg: {
      baseUnit: 'pcs',
      factors: {
          'pcs': 1,
          'piece': 1,
          'egg': 1,
          'dozen': 12,
      }
  }
};

/**
 * Finds the appropriate conversion configuration for a given ingredient or unit.
 * @param itemName The name of the ingredient (e.g., "garlic", "flour").
 * @param unit The unit being converted, to help with fallback matching.
 * @returns The matching ConversionConfig.
 */
const getConversionConfig = (itemName: string, unit: string): ConversionConfig => {
    const lowerItem = itemName.toLowerCase();
    const lowerUnit = unit.toLowerCase().replace(/s$/, '');

    // Specific ingredient matches first
    if (lowerItem.includes('egg')) return conversions.egg;
    if (lowerItem.includes('garlic')) return conversions.garlic;
    if (lowerItem.includes('rice')) return conversions.rice;

    // Add more specific ingredient checks here...

    // Fallback to generic types based on unit
    if (conversions.weight.factors[lowerUnit]) return conversions.weight;
    if (conversions.volume.factors[lowerUnit]) return conversions.volume;
    
    // Default fallback is quantity-based
    return conversions.quantity; 
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
    const normalizedUnit = unit.toLowerCase().replace(/s$/, ''); // Handle plurals
    const config = getConversionConfig(itemName, normalizedUnit);

    const factor = config.factors[normalizedUnit];
    
    if (factor === undefined) {
        // If not found in its specific config, try a final check in generics.
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
    const normalizedTargetUnit = targetUnit.toLowerCase().replace(/s$/, '');
    const config = getConversionConfig(itemName, normalizedTargetUnit);

    if (config.baseUnit !== baseUnit) {
        // Attempt to find a suitable converter if base units don't match
        const allConfigs = Object.values(conversions);
        const targetConfig = allConfigs.find(c => c.factors[normalizedTargetUnit] && c.baseUnit === baseUnit);
        
        if (!targetConfig) {
             throw new Error(`Cannot convert from base unit "${baseUnit}" to "${targetUnit}" for item "${itemName}". Mismatched types.`);
        }
    }

    const factor = config.factors[normalizedTargetUnit];

    if (factor === undefined) {
         // Final fallback check on generic converters
        if (conversions.weight.factors[normalizedTargetUnit] && baseUnit === 'g') {
             return { quantity: quantity / conversions.weight.factors[normalizedTargetUnit], unit: targetUnit };
        }
        if (conversions.volume.factors[normalizedTargetUnit] && baseUnit === 'ml') {
             return { quantity: quantity / conversions.volume.factors[normalizedTargetUnit], unit: targetUnit };
        }
        if (conversions.quantity.factors[normalizedTargetUnit] && baseUnit === 'pcs') {
             return { quantity: quantity / conversions.quantity.factors[normalizedTargetUnit], unit: targetUnit };
        }
        throw new Error(`Unrecognized target unit "${targetUnit}" for item "${itemName}".`);
    }

    return { quantity: quantity / factor, unit: targetUnit };
}
