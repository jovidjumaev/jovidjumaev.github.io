let apiKey = null;
const chatDiv = document.getElementById("chat");
const inputField = document.getElementById("input");
const sendButton = document.getElementById("send");
const clearButton = document.getElementById("clearChat");
const changeApiKeyButton = document.getElementById("changeApiKey");
const apiKeyInput = document.getElementById("apiKeyInput");
const setApiKeyButton = document.getElementById("setApiKey");
const apiKeySection = document.getElementById("apiKeySection");
const chatSection = document.getElementById("chatSection");
const apiKeyStatus = document.getElementById("apiKeyStatus");

const messages = [{ role: "system", content: "You are a helpful assistant." }];

// Clear API key from memory
function clearApiKey() {
    apiKey = null;
    apiKeyInput.value = "";
    apiKeySection.style.display = "block";
    chatSection.style.display = "none";
    apiKeyStatus.textContent = "";
    clearChat();
}

// Set API Key functionality
setApiKeyButton.addEventListener("click", function() {
    const key = apiKeyInput.value.trim();
    if (key) {
        apiKey = key;
        apiKeyStatus.textContent = "API Key set successfully! You can now start chatting.";
        apiKeyStatus.style.color = "#28a745";
        apiKeySection.style.display = "none";
        chatSection.style.display = "block";
        // Clear the input field for security
        apiKeyInput.value = "";
    } else {
        apiKeyStatus.textContent = "Please enter a valid API key.";
        apiKeyStatus.style.color = "#dc3545";
    }
});

// Change API Key functionality
changeApiKeyButton.addEventListener("click", clearApiKey);

// Send message functionality
async function sendMessage() {
    if (!apiKey) {
        alert("Please set your API key first!");
        return;
    }

    const userInput = inputField.value;
    if (!userInput) return;

    // Display user message
    chatDiv.innerHTML += `<p><strong>You:</strong> ${userInput}</p>`;
    messages.push({ role: "user", content: userInput });
    inputField.value = "";

    // Show loading indicator
    chatDiv.innerHTML += `<p><em>Assistant is typing...</em></p>`;
    chatDiv.scrollTop = chatDiv.scrollHeight;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 200
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }
        });

        // Remove loading indicator
        chatDiv.innerHTML = chatDiv.innerHTML.replace(/<p><em>Assistant is typing\.\.\.<\/em><\/p>/, "");

        const reply = response.data.choices[0].message.content.trim();
        chatDiv.innerHTML += `<p><strong>Assistant:</strong> ${reply}</p>`;
        messages.push({ role: "assistant", content: reply });
        chatDiv.scrollTop = chatDiv.scrollHeight; // Scroll to bottom
    } catch (error) {
        // Remove loading indicator
        chatDiv.innerHTML = chatDiv.innerHTML.replace(/<p><em>Assistant is typing\.\.\.<\/em><\/p>/, "");
        
        console.error("Error:", error);
        let errorMessage = "An error occurred while processing your request.";
        
        if (error.response) {
            if (error.response.status === 401) {
                errorMessage = "Invalid API key. Please check your API key and try again.";
            } else if (error.response.status === 429) {
                errorMessage = "Rate limit exceeded. Please try again later.";
            } else {
                errorMessage = `Error: ${error.response.data?.error?.message || error.message}`;
            }
        }
        
        chatDiv.innerHTML += `<p><strong>Error:</strong> ${errorMessage}</p>`;
        chatDiv.scrollTop = chatDiv.scrollHeight;
    }
}

// Clear chat functionality
function clearChat() {
    chatDiv.innerHTML = "";
    messages.length = 1; // Keep only the system message
}

// Event listeners
sendButton.addEventListener("click", sendMessage);
clearButton.addEventListener("click", clearChat);

inputField.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
});

// Allow Enter key in API key input
apiKeyInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        setApiKeyButton.click();
    }
});

// Clear API key when page is about to unload (security measure)
window.addEventListener("beforeunload", function() {
    apiKey = null;
});
