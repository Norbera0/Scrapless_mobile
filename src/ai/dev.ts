
import { config } from 'dotenv';
config();

import '@/ai/flows/log-food-waste.ts';
import '@/ai/flows/log-food-waste-from-audio.ts';
import '@/ai/flows/log-food-waste-from-text.ts';
import '@/ai/flows/log-pantry-item.ts';
import '@/ai/flows/suggest-recipes.ts';
import '@/ai/flows/chat-with-assistant.ts';
import '@/ai/flows/food-image-generation.ts';
import '@/ai/flows/generate-shopping-list.ts';
import '@/ai/flows/get-kitchen-coach-advice.ts';
import '@/ai/flows/get-coach-solutions.ts';
import '@/ai/flows/analyze-waste-patterns.ts';
import '@/ai/flows/get-disposal-tip.ts';
import '@/ai/flows/get-waste-breakdown-insight.ts';
import '@/ai/flows/get-item-insights.ts';
    
