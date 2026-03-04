import { getServiceAdapter, serviceInstances } from './adapter.js';

/**
 * Initialize API services
 * @param {Object} config - The server configuration
 * @returns {Promise<Object>} The initialized services
 */
export async function initApiService(config) {
    // Initialize configured service adapter at startup
    try {
        console.log(`[Initialization] Initializing service adapter for ${config.MODEL_PROVIDER}...`);
        getServiceAdapter(config);
    } catch (error) {
        console.warn(`[Initialization Warning] Failed to initialize service adapter: ${error.message}`);
    }

    return serviceInstances;
}

/**
 * Get API service adapter
 * @param {Object} config - The current request configuration
 * @returns {Promise<Object>} The API service adapter
 */
export async function getApiService(config) {
    return getServiceAdapter(config);
}
