const SERVER_BASE_URL = 'https://keycompanion.vercel.app';

let cachedServerApiKey = null;
let cachedServerKeyId = null;
let lastAcquiredAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache TTL

/**
 * Acquire or get cached Server Gemini API Key for Paid Members / Admins
 * @param {string} userToken - User JWT token
 * @returns {Promise<{ apiKey: string, keyId: string } | null>}
 */
async function getServerGeminiKey(userToken) {
    if (!userToken) return null;

    // Return cached key if valid and fresh
    if (cachedServerApiKey && (Date.now() - lastAcquiredAt < CACHE_TTL_MS)) {
        return { apiKey: cachedServerApiKey, keyId: cachedServerKeyId };
    }

    try {
        const response = await fetch(`${SERVER_BASE_URL}/api/keys/acquire`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        if (data.success && data.apiKey) {
            cachedServerApiKey = data.apiKey;
            cachedServerKeyId = data.keyId;
            lastAcquiredAt = Date.now();
            console.log('[CloudKeyManager] Acquired key from server pool:', data.keyId);
            return { apiKey: cachedServerApiKey, keyId: cachedServerKeyId };
        } else {
            console.warn('[CloudKeyManager] Server key acquisition warning:', data.error);
            return null;
        }
    } catch (err) {
        console.error('[CloudKeyManager] Error fetching key from server:', err.message);
        return null;
    }
}

/**
 * Report 429 Quota Exceeded error to server and rotate to a new fresh key immediately
 * @param {string} userToken - User JWT token
 * @param {string} modelName - Model that returned 429 quota error
 * @returns {Promise<{ apiKey: string, keyId: string } | null>}
 */
async function reportQuotaExceededAndRotate(userToken, modelName = '') {
    if (!userToken) return null;

    console.warn(`[CloudKeyManager] ⚠️ Reporting 429 Quota Exceeded for key ${cachedServerKeyId} on model ${modelName}`);

    try {
        const response = await fetch(`${SERVER_BASE_URL}/api/keys/report-quota-exceeded`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keyId: cachedServerKeyId,
                model: modelName,
            }),
        });

        const data = await response.json();
        if (data.success && data.newApiKey) {
            cachedServerApiKey = data.newApiKey;
            cachedServerKeyId = data.newKeyId;
            lastAcquiredAt = Date.now();
            console.log('[CloudKeyManager] 🔄 Key rotated successfully to:', data.newKeyId);
            return { apiKey: cachedServerApiKey, keyId: cachedServerKeyId };
        } else {
            console.error('[CloudKeyManager] Rotation failed:', data.error);
            // Clear invalid cache so next call re-fetches
            cachedServerApiKey = null;
            cachedServerKeyId = null;
            return null;
        }
    } catch (err) {
        console.error('[CloudKeyManager] Error reporting quota error:', err.message);
        return null;
    }
}

function clearKeyCache() {
    cachedServerApiKey = null;
    cachedServerKeyId = null;
    lastAcquiredAt = 0;
}

module.exports = {
    getServerGeminiKey,
    reportQuotaExceededAndRotate,
    clearKeyCache,
};
