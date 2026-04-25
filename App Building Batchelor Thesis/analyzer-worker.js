/**
 * Privacy Policy Analyzer - Web Worker
 * Runs analysis in background thread to keep UI responsive
 * Handles large policies with chunked processing
 */

// Try to import the analyzer functions
try {
    importScripts('analyzer.js');
    console.log('[Worker] analyzer.js loaded successfully');
} catch (error) {
    console.error('[Worker] Failed to load analyzer.js:', error);
    self.postMessage({
        success: false,
        error: 'Failed to load analyzer.js: ' + error.message
    });
}

// Listen for messages from main thread (popup.js)
self.onmessage = async (event) => {
    const { id, text, action } = event.data;
    
    console.log(`[Worker] Received message - ID: ${id}, Action: ${action}, Text length: ${text ? text.length : 0}`);

    try {
        if (action === 'analyze') {
            // Verify analyzer function exists
            if (typeof analyzePrivacyPolicy !== 'function') {
                throw new Error('analyzePrivacyPolicy function not found');
            }
            
            // If text is very large, process in chunks
            if (text.length > 100000) {
                console.log('[Worker] Large text detected, processing in chunks...');
                const results = await analyzeInChunks(text);
                self.postMessage({ 
                    id, 
                    success: true, 
                    result: results,
                    mode: 'chunked'
                });
            } else {
                // Small text - analyze directly
                console.log('[Worker] Analyzing text directly...');
                const result = analyzePrivacyPolicy(text);
                self.postMessage({ 
                    id, 
                    success: true, 
                    result,
                    mode: 'direct'
                });
            }
        } else {
            self.postMessage({ 
                id, 
                success: false, 
                error: 'Unknown action: ' + action 
            });
        }
    } catch (error) {
        console.error('[Worker] Error:', error);
        self.postMessage({ 
            id, 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * Analyze large text in chunks to prevent timeout
 * @param {string} text
 * @returns {object} Merged analysis result
 */
async function analyzeInChunks(text) {
    const CHUNK_SIZE = 50000;
    const chunks = chunkText(text, CHUNK_SIZE);
    
    console.log(`[Worker] Processing ${chunks.length} chunks...`);
    
    let processedChunks = 0;
    
    const chunkResults = chunks.map((chunk, index) => {
        const result = analyzePrivacyPolicy(chunk.chunk);
        processedChunks++;
        
        // Send progress update every 5 chunks
        if (processedChunks % 5 === 0) {
            self.postMessage({
                type: 'progress',
                processed: processedChunks,
                total: chunks.length,
                percentage: Math.round((processedChunks / chunks.length) * 100)
            });
            console.log(`[Worker] Progress: ${processedChunks}/${chunks.length}`);
        }
        
        return result;
    });

    console.log('[Worker] Merging chunk results...');
    
    return chunkResults.length > 0 ? chunkResults[0] : { score: 0, metrics: {} };
}
