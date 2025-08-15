"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterPriceAggregator = void 0;
// Import all the necessary libraries
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const cheerio = require("cheerio");
// pdf-parse doesn't have default TypeScript types, so we import it like this
const pdfParse = require("pdf-parse");
// Initialize Firebase Admin so we can talk to Firestore
admin.initializeApp();
const db = admin.firestore();
// --- Helper Function for Dept. of Agriculture (DA) ---
async function fetchAndParseDA() {
    let pdfPath;
    try {
        const daMonitorUrl = "https://www.da.gov.ph/price-monitoring/";
        const mainPageResponse = await axios_1.default.get(daMonitorUrl);
        const $ = cheerio.load(mainPageResponse.data);
        pdfPath = $('#tablepress-105 > tbody > tr.row-2 > td.column-1 > a').attr('href');
        if (!pdfPath) {
            throw new Error("Could not find PDF link on DA page.");
        }
        console.log(`Found latest DA PDF link: ${pdfPath}`);
        const pdfResponse = await axios_1.default.get(pdfPath, { responseType: 'arraybuffer' });
        const pdfData = await pdfParse(pdfResponse.data);
        const rawText = pdfData.text;
        const extractedPrices = {};
        const findPrice = (itemName, text) => {
            const regex = new RegExp(`${itemName}\\s*([\\d,]+\\.\\d{2})`, 'i');
            const match = text.match(regex);
            if (match?.[1]) {
                return parseFloat(match[1].replace(',', ''));
            }
            return null;
        };
        extractedPrices.porkLiempo_kg = findPrice("Pork Liempo", rawText);
        extractedPrices.tilapia_kg = findPrice("Tilapia", rawText);
        extractedPrices.redOnion_kg = findPrice("Red Onion.*Local", rawText);
        extractedPrices.importedGarlic_kg = findPrice("Garlic.*Imported", rawText);
        const parsedPrices = Object.fromEntries(Object.entries(extractedPrices).filter(([_, v]) => v != null));
        if (Object.keys(parsedPrices).length === 0) {
            // Instead of throwing an error, return the raw text for debugging
            console.log("Could not extract any prices. Returning raw text for debugging.");
            return { pdfPath: pdfPath, rawText: rawText, error: "Could not extract any prices from the PDF text." };
        }
        console.log("Successfully parsed data from DA PDF.");
        return { pdfPath: pdfPath, prices: parsedPrices };
    }
    catch (error) {
        console.error("Error in fetchAndParseDA:", error);
        // Include pdfPath in the return if it was found before the error
        return { pdfPath: pdfPath, error: error.message };
    }
}
// --- The Main Orchestrator Function ---
exports.masterPriceAggregator = functions
    .region("asia-southeast1")
    .runWith({ timeoutSeconds: 300, memory: "512MB" })
    .pubsub.topic("fetch-latest-prices")
    .onPublish(async (message) => {
    console.log("Master price aggregator function triggered.");
    const resultsDocRef = db.collection("market_prices").doc("latest");
    // Initial log
    let log = {
        last_attempted_run: new Date().toISOString(),
        pdf_retrieval_status: 'FAILURE',
        data_extraction_status: 'PENDING',
    };
    const daResult = await fetchAndParseDA();
    // Update log based on result
    if (daResult.pdfPath) {
        log.pdf_retrieval_status = 'SUCCESS';
        log.pdf_url = daResult.pdfPath;
    }
    if (daResult.prices && Object.keys(daResult.prices).length > 0) {
        log.data_extraction_status = 'SUCCESS';
        log.prices = daResult.prices;
        log.last_successful_update = new Date().toISOString();
        delete log.error_message; // Clean up any previous error
        delete log.raw_pdf_text; // Clean up debugging text
    }
    else {
        log.data_extraction_status = 'FAILURE';
        if (daResult.error) {
            log.error_message = daResult.error;
        }
        if (daResult.rawText) {
            log.raw_pdf_text = daResult.rawText; // Save raw text for debugging
        }
    }
    await resultsDocRef.set(log, { merge: true });
    console.log("Processing complete. Log written to Firestore.");
    return null;
});
//# sourceMappingURL=index.js.map