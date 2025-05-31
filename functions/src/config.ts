// functions/src/config.ts
import * as functions from "firebase-functions";

// For production, use Firebase environment configuration:
// `firebase functions:config:set kingdomkoders.oracle_pk="YOUR_PRIVATE_KEY"`
// `firebase functions:config:set kingdomkoders.ronin_rpc="YOUR_RPC_URL"` etc.
// Then access via functions.config().kingdomkoders.oracle_pk

// For local emulators, you can use process.env or define here (ensure .env is gitignored)
// if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
//     require('dotenv').config(); // If using dotenv for local dev
// }

export const getConfig = () => {
    const config = functions.config(); // This will be empty when running locally without `firebase functions:config:get > .runtimeconfig.json`
                                      // and `firebase emulators:start --import=./.firebase-emulators-data`
                                      // OR if not deployed with `firebase functions:config:set`

    // It's often easier to manage dev vs prod outside this file, or use default values for local.
    const isEmulated = process.env.FUNCTIONS_EMULATOR === 'true';

    return {
        oraclePrivateKey: isEmulated ? "YOUR_LOCAL_DEV_ORACLE_PRIVATE_KEY" : config.kingdomkoders?.oracle_pk || "MISSING_ORACLE_PK",
        roninRpcUrl: isEmulated ? "https://saigon-testnet.roninchain.com/rpc" : config.kingdomkoders?.ronin_rpc || "MISSING_RONIN_RPC",
        forgeContractAddress: isEmulated ? "YOUR_DEV_FORGE_CONTRACT_ADDRESS" : config.kingdomkoders?.forge_address || "MISSING_FORGE_ADDRESS",
        kkNftContractAddress: isEmulated ? "YOUR_DEV_KKNFT_CONTRACT_ADDRESS" : config.kingdomkoders?.kknft_address || "MISSING_KKNFT_ADDRESS",
        ipfsApiKey: isEmulated ? "YOUR_LOCAL_DEV_IPFS_KEY" : config.kingdomkoders?.ipfs_key || "MISSING_IPFS_KEY", // For pinning service
        ipfsApiSecret: isEmulated ? "YOUR_LOCAL_DEV_IPFS_SECRET" : config.kingdomkoders?.ipfs_secret || "MISSING_IPFS_SECRET", // If applicable
        // TODO: Add paths or Firestore collection names for collection_rules.json, trait_rules.json, component_manifest.json
        // Example: forgeConfigCollection: "forgeConfiguration"
    };
};

// Ensure you set these environment variables in Firebase for deployed functions
// firebase functions:config:set kingdomkoders.oracle_pk="YOUR_ORACLE_PRIVATE_KEY_FOR_PROD"
// firebase functions:config:set kingdomkoders.ronin_rpc="https://api.roninchain.com/rpc"
// ... and so on.
