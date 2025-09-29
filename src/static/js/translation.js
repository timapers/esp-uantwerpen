let translationDict = {};
let loaded = false;

// Fetch the dictionary when the page loads
function loadTranslationDict() {
    if (loaded) return Promise.resolve();

    return fetch('/get-translation-dict')
        .then(response => response.json())
        .then(data => {
            translationDict = Object.freeze(data);
            loaded = true;
        })
        .catch(error => console.error("Error fetching dictionary:", error));
}

function refreshTranslationDict() {
    return fetch('/get-translation-dict')
        .then(response => response.json())
        .then(data => {
            translationDict = Object.freeze(data);
        })
        .catch(error => console.error("Error refreshing dictionary:", error));
}
// Usage:
async function initializeTranslation() {
    await loadTranslationDict()
}

initializeTranslation();

// Function to translate a key
function translate(key) {
    if (!translationDict || !translationDict[key]) {
        return key; // fallback: return original key
    }
    return translationDict[key][language] || key;
}
