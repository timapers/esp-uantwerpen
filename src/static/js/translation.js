let translationDict = {};
let loaded = false;

// Fetch the dictionary when the page loads
function loadTranslationDict() {
    // Check if the dictionary is already loaded
    if (loaded) {
        return;
    }
    fetch('/get-translation-dict')
        .then(response => response.json())
        .then(data => {
            translationDict = Object.freeze(data);
            loaded = true;
            // console.log("Translation Dictionary Loaded:", translationDict);
        })
        .catch(error => console.error("Error fetching dictionary:", error));
}

// Call the function to load the dictionary
loadTranslationDict();

// Function to translate a key
function translate(key) {
    return translationDict[key] || key;
}