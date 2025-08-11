
'use client';

import { type WeatherData } from "@/types";

/**
 * A mock weather service.
 * In a real application, this would make an API call to a weather service provider.
 * For this prototype, it returns a static, realistic weather condition for Makati.
 */
export async function getWeatherForMakati(): Promise<WeatherData> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Return mock data for a typical hot and humid day in Makati
    return {
        location: "Makati, Metro Manila",
        temperature: 33, // Celsius
        condition: 'sunny',
        humidity: 75, // Percent
    };
}
