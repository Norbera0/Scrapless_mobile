
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as pdf from "pdf-parse";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

/**
 * Generates the DA's daily price index PDF URL for the previous day in Manila.
 * @returns {string} The formatted URL.
 */
function generateDailyPdfUrl(): string {
    const now = new Date();
    // Adjust for Manila timezone (UTC+8)
    const manilaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

    // Subtract one day to get yesterday's date
    manilaDate.setDate(manilaDate.getDate() - 1);

    const year = manilaDate.getFullYear();
    const month = (manilaDate.getMonth() + 1).toString().padStart(2, '0');
    
    // Format: "Month-Day-Year" e.g., "August-14-2025"
    const monthName = manilaDate.toLocaleString('en-US', { month: 'long' });
    const day = manilaDate.getDate().toString().padStart(2, '0');
    const formattedDateForUrl = `${monthName}-${day}-${year}`;
    
    // Example URL: https://www.da.gov.ph/wp-content/uploads/2025/08/Daily-Price-Index-August-14-2025.pdf
    return `https://www.da.gov.ph/wp-content/uploads/${year}/${month}/Daily-Price-Index-${formattedDateForUrl}.pdf`;
}

// --- The Main Orchestrator Function ---
export const dailyPriceExtractor = functions
  .region("asia-southeast1")
  .runWith({ timeoutSeconds: 300, memory: "512MB" })
  .pubsub.topic("fetch-latest-prices")
  .onPublish(async (message) => {
    console.log("Daily Price Extractor function triggered.");

    const resultsDocRef = db.collection("market_prices").doc("latest");
    const log: Record<string, any> = {
        last_attempted_run: new Date().toISOString(),
        pdf_retrieval_status: 'FAILURE',
        data_extraction_status: 'PENDING',
    };

    try {
        const pdfUrl = generateDailyPdfUrl();
        log.pdf_url = pdfUrl;
        console.log(`Attempting to fetch PDF from: ${pdfUrl}`);

        const pdfResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
        log.pdf_retrieval_status = 'SUCCESS';
        console.log("Successfully downloaded PDF.");

        const pdfData = await pdf(pdfResponse.data);
        const rawText = pdfData.text;
        
        if (!rawText || rawText.trim() === '') {
            throw new Error("PDF text is empty. It might be an image-only PDF.");
        }
        
        log.raw_pdf_text = rawText; // For debugging

        const extractedPrices: Record<string, any> = {};
        const findPrice = (itemName: string, text: string): number | null => {
            // Regex to find the item and the first valid price after it on the same line.
            // It looks for a number with two decimal places.
            const regex = new RegExp(`${itemName}[^\\n]*?(\\d+\\.\\d{2})`, 'i');
            const match = text.match(regex);
            if (match && match[1]) {
                return parseFloat(match[1].replace(',', ''));
            }
            return null;
        };

        // Update these keys to match the commodities in the new PDF
        extractedPrices.porkKasim_kg = findPrice("Pork Kasim", rawText);
        extractedPrices.tilapia_kg = findPrice("Tilapia", rawText);
        extractedPrices.redOnion_local_kg = findPrice("Red Onion.*Local", rawText);
        extractedPrices.importedGarlic_kg = findPrice("Imported Garlic", rawText);

        const parsedPrices = Object.fromEntries(Object.entries(extractedPrices).filter(([_, v]) => v != null));

        if (Object.keys(parsedPrices).length === 0) {
            throw new Error("Could not extract any of the target prices from the PDF text.");
        }

        log.data_extraction_status = 'SUCCESS';
        log.prices = parsedPrices;
        log.last_successful_update = new Date().toISOString();
        delete log.error_message;

    } catch (error: any) {
        console.error("An error occurred:", error);
        log.data_extraction_status = 'FAILURE';
        log.error_message = error.message || 'An unknown error occurred.';
    }

    await resultsDocRef.set(log, { merge: true });
    console.log("Processing complete. Log written to Firestore.");

    return null;
  });
