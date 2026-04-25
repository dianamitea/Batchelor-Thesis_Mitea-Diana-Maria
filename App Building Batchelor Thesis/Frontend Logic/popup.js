document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const statusText = document.getElementById('status');
    statusText.innerText = "Extracting text from page...";

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }, () => {
        chrome.tabs.sendMessage(tab.id, { action: "extract_text" }, async (response) => {
            
            if (response && response.text) {
                statusText.innerText = "Text extracted! Sending to Python backend...";

try {
    const apiResponse = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: response.text })
    });
    
    const result = await apiResponse.json();
    
    statusText.innerText = `Analysis complete! Score: ${result.score} (Length: ${result.received_length} chars)`;
    
} catch (error) {
    statusText.innerText = "Error: Could not connect to Python server.";
    console.error("Fetch error: ", error);
}
            }
        });
    });
});