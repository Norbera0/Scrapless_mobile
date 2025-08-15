"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyPriceExtractor = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const vertexai_1 = require("@google-cloud/vertexai");
// Initialize Firebase and Vertex AI
admin.initializeApp();
const db = admin.firestore();
const vertex_ai = new vertexai_1.VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'asia-southeast1' });
const model = 'gemini-2.5-flash-lite'; // Corrected to the stable, latest model name
/**
 * Generates the DA's daily price index PDF URL for the previous day in Manila.
 * @returns {string} The formatted URL.
 */
function generateDailyPdfUrl() {
    const now = new Date();
    const manilaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    manilaDate.setDate(manilaDate.getDate() - 1);
    const year = manilaDate.getFullYear();
    const month = (manilaDate.getMonth() + 1).toString().padStart(2, '0');
    const monthName = manilaDate.toLocaleString('en-US', { month: 'long' });
    const day = manilaDate.getDate().toString().padStart(2, '0');
    const formattedDateForUrl = `${monthName}-${day}-${year}`;
    return `https://www.da.gov.ph/wp-content/uploads/${year}/${month}/Daily-Price-Index-${formattedDateForUrl}.pdf`;
}
// --- The Main Orchestrator Function ---
exports.dailyPriceExtractor = functions
    .region("asia-southeast1")
    .runWith({ timeoutSeconds: 300, memory: "1GB" })
    .pubsub.topic("fetch-latest-prices")
    .onPublish(async (message) => {
    console.log("Daily Price Extractor function triggered.");
    const resultsDocRef = db.collection("market_prices").doc("latest");
    const log = {
        last_attempted_run: new Date().toISOString(),
        pdf_retrieval_status: 'FAILURE',
        data_extraction_status: 'PENDING',
    };
    try {
        const pdfUrl = generateDailyPdfUrl();
        log.pdf_url = pdfUrl;
        console.log(`Attempting to fetch PDF from: ${pdfUrl}`);
        const pdfResponse = await axios_1.default.get(pdfUrl, { responseType: 'arraybuffer' });
        const pdfBase64 = Buffer.from(pdfResponse.data).toString('base64');
        log.pdf_retrieval_status = 'SUCCESS';
        console.log("Successfully downloaded PDF.");
        const generativeModel = vertex_ai.preview.getGenerativeModel({ model: model });
        const pdfPart = {
            inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
            },
        };
        const prompt = `
            Analyze the attached PDF, which contains a table of prevailing retail prices for agricultural commodities.
            Extract the "PREVAILING RETAIL PRICE PER UNIT (P/UNIT)" for the following specific items and return the data in a clean JSON format.

            - Commodity: Pork Picnic Shoulder (Kasim), Specification: Local
            - Commodity: Tilapia, Specification: Medium (5-6pcs/kg)
            - Commodity: Red Onion
            - Commodity: Garlic (Imported)

            The JSON output should look exactly like this, with floating point numbers for the prices:
            {
              "porkKasim_kg": <price>,
              "tilapia_kg": <price>,
              "redOnion_local_kg": <price>,
              "importedGarlic_kg": <price>
            }
        `;
        const request = {
            contents: [{ role: 'user', parts: [pdfPart, { text: prompt }] }],
        };
        console.log("Sending request to Vertex AI Gemini model...");
        const result = await generativeModel.generateContent(request);
        if (!result.response.candidates || result.response.candidates.length === 0) {
            throw new Error("AI model returned no candidates.");
        }
        const jsonResponseText = result.response.candidates[0].content.parts[0].text?.replace(/```json|```/g, '').trim();
        if (!jsonResponseText) {
            throw new Error("AI model returned an empty response.");
        }
        console.log("Received response from model:", jsonResponseText);
        const extractedPrices = JSON.parse(jsonResponseText);
        log.data_extraction_status = 'SUCCESS';
        log.prices = extractedPrices;
        log.last_successful_update = new Date().toISOString();
        delete log.error_message;
    }
    catch (error) {
        console.error("An error occurred:", error);
        log.data_extraction_status = 'FAILURE';
        log.error_message = error.message || 'An unknown error occurred.';
        if (error.response) {
            log.error_details = error.response.data;
        }
    }
    await resultsDocRef.set(log, { merge: true });
    console.log("Processing complete. Log written to Firestore.");
    return null;
});
//# sourceMappingURL=index.js.map