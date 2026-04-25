// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_text") {
        // Grab text
        const pageText = document.body.innerText; 
        
        // Send text back
        sendResponse({ text: pageText });
    }
    return true; 
});