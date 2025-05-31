// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK ONCE (if not already initialized)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore(); // Example, if you use Firestore

// --- Import Services (Feature-Rich Versions) ---
// These services would be the detailed ones we discussed, now living within functions/src/
import { RoninNodeService } from "./services/roninNodeService";
import { IpfsService } from "./services/ipfsService";
import { MetadataIngestionService } from "./core_algorithm/1_metadataIngestionService";
import { RarityPowerService } from "./core_algorithm/2_rarityPowerService";
import { UniquenessEngineService } from "./core_algorithm/3_uniquenessEngineService";
import { ThematicEngineService } from "./core_algorithm/4_thematicEngineService";
import { VisualAssemblerService } from "./core_algorithm/5_visualAssemblerService";
import { KkNftMetadataBuilderService } from "./core_algorithm/6_kkNftMetadataBuilderService";
import { ForgeOrchestratorService } from "./core_algorithm/forgeOrchestratorService"; // The feature-rich one

import { getConfig } from "./config";
import { ForgeRequestEventData, // Assume these are defined in a types.ts file
         InputNftIdentifierBE, 
         PrioritizedAttributeInputBE } from "./types"; 

// --- Initialize Services (Singleton instances) ---
const currentConfig = getConfig();

// TODO: Initialize all services with their necessary configurations and dependencies
// For example, collection_rules, trait_rules, and art_manifest might be loaded from Firestore
// or bundled JSON files accessible to the functions.

// Placeholder for service initialization - you'll need to manage config loading properly.
const roninNodeService = new RoninNodeService(
    currentConfig.roninRpcUrl,
    currentConfig.oraclePrivateKey,
    currentConfig.forgeContractAddress,
    [] // TODO: Add Forge Contract ABI here
);
const ipfsService = new IpfsService(/* ipfs config from currentConfig */);

// TODO: Create instances of MetadataIngestionService, RarityPowerService, etc.
// These might require loading config files (e.g., collection_rules.json, component_manifest.json)
// which could be stored in Firestore or bundled with the functions.
const metadataIngestionService = new MetadataIngestionService(roninNodeService /*, collectionRules */);
const rarityPowerService = new RarityPowerService(/* rarityRules, nxsTierConfig */);
const uniquenessEngineService = new UniquenessEngineService(/* traitGenerationRules, componentManifest */);
const thematicEngineService = new ThematicEngineService(/* themeDefinitions */);
const visualAssemblerService = new VisualAssemblerService(/* componentManifestData - loaded from Firestore/file */);
const kkNftMetadataBuilderService = new KkNftMetadataBuilderService();


const forgeOrchestrator = new ForgeOrchestratorService(
    roninNodeService,
    ipfsService,
    metadataIngestionService,
    rarityPowerService,
    uniquenessEngineService,
    thematicEngineService,
    visualAssemblerService,
    kkNftMetadataBuilderService
);

/**
 * HTTPS Cloud Function to process a ForgeRequested event.
 * This endpoint would be called by your separate blockchain event listener/poller
 * when a TheKingdomsForge.sol::ForgeRequested event is detected.
 */
export const processForgeEventHandler = functions.https.onRequest(async (request, response) => {
    if (request.method !== "POST") {
        functions.logger.warn("Received non-POST request for processForgeEventHandler");
        response.status(405).send("Method Not Allowed");
        return;
    }

    // TODO: Implement robust security for this endpoint.
    // It should only be callable by your trusted event listener service (e.g., IP whitelist, secret key).
    // const apiKey = request.headers["x-api-key"];
    // if (apiKey !== currentConfig.eventListenerApiKey) {
    //     functions.logger.error("Unauthorized attempt to call processForgeEventHandler");
    //     response.status(401).send("Unauthorized");
    //     return;
    // }

    const eventData = request.body as ForgeRequestEventData; // Assuming direct pass-through of event data
    functions.logger.info(`Received forge event for processing: RequestID ${eventData.requestId}`, { structuredData: true, eventData });

    if (!eventData || !eventData.requestId || !eventData.user || !eventData.inputNfts || eventData.inputNfts.length !== 2) {
        functions.logger.error("Invalid event data received", { eventData });
        response.status(400).send("Missing or invalid required event data fields.");
        return;
    }

    try {
        // Asynchronously process the forge request. Do not await here if it's long-running,
        // unless you configure the function for longer timeouts and handle client expectations.
        // For simplicity in MVP, we might await, but for production, consider a queue.
        await forgeOrchestrator.processForgeRequest(eventData);
        
        // Optionally, store the initial request details in Firestore for tracking
        // await db.collection('forgeRequests').doc(eventData.requestId.toString()).set({
        //     ...eventData,
        //     status: "PROCESSING_QUEUED",
        //     receivedAt: admin.firestore.FieldValue.serverTimestamp()
        // });

        functions.logger.info(`Forge request ${eventData.requestId} successfully queued/sent for processing.`);
        response.status(200).send({ success: true, message: `Forge request ${eventData.requestId} received for processing.` });
    } catch (error: any) {
        functions.logger.error(`Error in processForgeEventHandler for Request ID ${eventData.requestId}:`, error, { structuredData: true });
        // await db.collection('forgeRequests').doc(eventData.requestId.toString()).update({
        //     status: "ERROR_QUEUING",
        //     errorMessage: error.message,
        //     updatedAt: admin.firestore.FieldValue.serverTimestamp()
        // });
        response.status(500).send({ success: false, message: `Failed to process forge request: ${error.message}` });
    }
});

// --- Other Potential Cloud Functions ---
// - A scheduled function to update the Leaderboard.
// - HTTP functions for admin tasks (e.g., updating forgeConfig in Firestore).
// - HTTP functions for the frontend to query forge request statuses from Firestore (if you store them there).

/**
 * NOTE: The actual `backend_forge_service/src/core_algorithm/` files (1_metadataIngestionService.ts, etc.)
 * would be moved into `functions/src/core_algorithm/` and their internal logic (the "secret sauce")
 * needs to be implemented by you based on our detailed discussions in the Project Compendium.
 * The code provided for those services previously (turn 65) were skeletons.
 */
