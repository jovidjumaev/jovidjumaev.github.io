// Enhanced AI Chatbot with Theme Toggle and Sidebar
let apiKey = null;
let currentTheme = 'dark';
let conversations = [];
let currentConversationId = null;

// DOM Elements
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
const mainLayout = document.getElementById("mainLayout");

// Enhanced Elements
const systemPromptInput = document.getElementById("systemPromptInput");
const updateSystemPromptButton = document.getElementById("updateSystemPrompt");
const presetPrompts = document.getElementById("presetPrompts");
const messageRole = document.getElementById("messageRole");
const roleIndicator = document.getElementById("roleIndicator");
const exportButton = document.getElementById("exportConversation");
const importButton = document.getElementById("importConversation");
const importFile = document.getElementById("importFile");
const viewHistoryButton = document.getElementById("viewHistory");
const historyModal = document.getElementById("historyModal");
const historyContent = document.getElementById("historyContent");
const clearHistoryButton = document.getElementById("clearHistory");
const closeModal = document.querySelector(".close");

// Theme Elements
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

// Sidebar Elements
const sidebar = document.getElementById("sidebar");
const toggleSidebar = document.getElementById("toggleSidebar");
const conversationList = document.getElementById("conversationList");
const exportAllButton = document.getElementById("exportAllConversations");
const clearAllButton = document.getElementById("clearAllHistory");
const newConversationButton = document.getElementById("newConversation");

// Conversation state
let messages = [{ role: "system", content: "You are a helpful assistant." }];
let conversationHistory = [];

// Role configurations
const roleConfig = {
    user: { emoji: "👤", label: "User", class: "user" },
    assistant: { emoji: "🤖", label: "Assistant", class: "assistant" },
    system: { emoji: "⚙️", label: "System", class: "system" },
    moderator: { emoji: "🛡️", label: "Moderator", class: "moderator" },
    expert: { emoji: "��", label: "Expert", class: "expert" },
    critic: { emoji: "🔍", label: "Critic", class: "critic" },
    facilitator: { emoji: "🎯", label: "Facilitator", class: "facilitator" }
};

// Initialize the application
function init() {
    setupEventListeners();
    updateRoleIndicator();
    loadConversationHistory();
    loadTheme();
    loadConversations();
    updateSidebar();
}

// Setup all event listeners
function setupEventListeners() {
    // Existing listeners
    setApiKeyButton.addEventListener("click", setApiKey);
    changeApiKeyButton.addEventListener("click", clearApiKey);
    sendButton.addEventListener("click", sendMessage);
    clearButton.addEventListener("click", clearChat);
    
    // Enhanced listeners
    updateSystemPromptButton.addEventListener("click", updateSystemPrompt);
    presetPrompts.addEventListener("change", loadPresetPrompt);
    messageRole.addEventListener("change", updateRoleIndicator);
    exportButton.addEventListener("click", exportConversation);
    importButton.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", importConversation);
    viewHistoryButton.addEventListener("click", showHistory);
    clearHistoryButton.addEventListener("click", clearConversationHistory);
    closeModal.addEventListener("click", hideHistory);
    
    // Theme toggle
    themeToggle.addEventListener("click", toggleTheme);
    
    // Sidebar listeners
    toggleSidebar.addEventListener("click", toggleSidebarVisibility);
    exportAllButton.addEventListener("click", exportAllConversations);
    clearAllButton.addEventListener("click", clearAllConversations);
    newConversationButton.addEventListener("click", createNewConversation);
    
    // Keyboard listeners
    inputField.addEventListener("keypress", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    apiKeyInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            setApiKeyButton.click();
        }
    });
    
    // Modal listeners
    window.addEventListener("click", function(e) {
        if (e.target === historyModal) {
            hideHistory();
        }
    });
    
    // Security measure
    window.addEventListener("beforeunload", function() {
        apiKey = null;
    });
}

// Theme Management
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeUI();
    saveTheme();
}

function updateThemeUI() {
    if (currentTheme === 'dark') {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
    } else {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('chatbot_theme');
    if (savedTheme) {
        currentTheme = savedTheme;
    }
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeUI();
}

function saveTheme() {
    localStorage.setItem('chatbot_theme', currentTheme);
}

// Sidebar Management
function toggleSidebarVisibility() {
    sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
}

function updateSidebar() {
    if (conversations.length === 0) {
        conversationList.innerHTML = '<p class="no-history">No conversations yet</p>';
        return;
    }
    
    conversationList.innerHTML = conversations.map(conv => `
        <div class="conversation-item ${conv.id === currentConversationId ? 'active' : ''}" 
             onclick="loadConversation('${conv.id}')">
            <div class="conversation-title">${conv.title}</div>
            <div class="conversation-preview">${conv.preview}</div>
        </div>
    `).join('');
}

function createNewConversation() {
    // Save current conversation if it exists
    if (currentConversationId) {
        saveConversation();
    }
    
    // Create new conversation
    const conversationId = 'conv_' + Date.now();
    const conversation = {
        id: conversationId,
        title: 'New Conversation',
        preview: 'Start a new conversation...',
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        systemPrompt: "You are a helpful assistant.",
        createdAt: new Date().toISOString()
    };
    
    conversations.unshift(conversation);
    currentConversationId = conversationId;
    
    // Reset messages and UI
    messages = [{ role: "system", content: "You are a helpful assistant." }];
    systemPromptInput.value = "You are a helpful assistant.";
    chatDiv.innerHTML = "";
    
    saveConversations();
    updateSidebar();
    
    // Show success message
    addMessageToChat("system", "New conversation created! You can start chatting now.");
}

function loadConversation(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    // Save current conversation first
    if (currentConversationId && currentConversationId !== conversationId) {
        saveConversation();
    }
    
    currentConversationId = conversationId;
    messages = [...conversation.messages];
    systemPromptInput.value = conversation.systemPrompt;
    
    // Clear and rebuild chat
    chatDiv.innerHTML = '';
    messages.slice(1).forEach(msg => {
        addMessageToChat(msg.role, msg.content);
    });
    
    updateSidebar();
}

function saveConversation() {
    if (!currentConversationId) return;
    
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (conversation) {
        conversation.messages = [...messages];
        conversation.systemPrompt = messages[0].content;
        conversation.preview = messages.length > 1 ? 
            messages[messages.length - 1].content.substring(0, 50) + '...' : 
            'Empty conversation';
        conversation.updatedAt = new Date().toISOString();
        
        // Update title if it's still "New Conversation" and we have messages
        if (conversation.title === 'New Conversation' && messages.length > 1) {
            const firstUserMessage = messages.find(msg => msg.role === 'user');
            if (firstUserMessage) {
                conversation.title = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
            }
        }
        
        saveConversations();
        updateSidebar();
    }
}

function loadConversations() {
    try {
        const saved = localStorage.getItem('chatbot_conversations');
        if (saved) {
            conversations = JSON.parse(saved);
        }
    } catch (error) {
        console.error("Error loading conversations:", error);
        conversations = [];
    }
}

function saveConversations() {
    localStorage.setItem('chatbot_conversations', JSON.stringify(conversations));
}

// API Key Management
function setApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        apiKey = key;
        apiKeyStatus.textContent = "API Key set successfully! You can now start chatting.";
        apiKeyStatus.style.color = "var(--accent-success)";
        
        // Hide API key section and show main layout with sidebar
        apiKeySection.style.display = "none";
        mainLayout.style.display = "grid";
        mainLayout.classList.add("show");
        
        apiKeyInput.value = "";
        
        // Create new conversation
        createNewConversation();
    } else {
        apiKeyStatus.textContent = "Please enter a valid API key.";
        apiKeyStatus.style.color = "var(--accent-error)";
    }
}

function clearApiKey() {
    apiKey = null;
    apiKeyInput.value = "";
    
    // Show API key section and hide main layout
    apiKeySection.style.display = "block";
    mainLayout.style.display = "none";
    mainLayout.classList.remove("show");
    
    apiKeyStatus.textContent = "";
    clearChat();
    currentConversationId = null;
}

// System Prompt Management
function updateSystemPrompt() {
    const newPrompt = systemPromptInput.value.trim();
    if (newPrompt) {
        messages[0] = { role: "system", content: newPrompt };
        addMessageToChat("system", `System prompt updated: "${newPrompt}"`);
        saveToHistory("system_update", { prompt: newPrompt });
        saveConversation();
    } else {
        alert("Please enter a valid system prompt.");
    }
}

function loadPresetPrompt() {
    const selectedPrompt = presetPrompts.value;
    if (selectedPrompt) {
        systemPromptInput.value = selectedPrompt;
        updateSystemPrompt();
        presetPrompts.value = "";
    }
}

// Role Management
function updateRoleIndicator() {
    const selectedRole = messageRole.value;
    const config = roleConfig[selectedRole];
    roleIndicator.textContent = `${config.emoji} ${config.label}`;
    roleIndicator.className = `role-indicator role-${config.class}`;
}

// Message Handling
async function sendMessage() {
    if (!apiKey) {
        alert("Please set your API key first!");
        return;
    }

    const userInput = inputField.value.trim();
    if (!userInput) return;

    // Create new conversation if none exists
    if (!currentConversationId) {
        createNewConversation();
    }

    const selectedRole = messageRole.value;
    
    // Add message to chat display
    addMessageToChat(selectedRole, userInput);
    
    // Add to messages array (convert custom roles to standard roles for API)
    const apiRole = convertToApiRole(selectedRole);
    messages.push({ role: apiRole, content: userInput });
    
    inputField.value = "";
    
    // Save to history
    saveToHistory("message", { role: selectedRole, content: userInput });
    saveConversation();

    // Show loading indicator
    const loadingId = addLoadingMessage();

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: messages.filter(msg => ["system", "user", "assistant"].includes(msg.role)),
            max_tokens: 300,
            temperature: 0.7
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }
        });

        removeLoadingMessage(loadingId);

        const reply = response.data.choices[0].message.content.trim();
        addMessageToChat("assistant", reply);
        messages.push({ role: "assistant", content: reply });
        
        // Save assistant response to history
        saveToHistory("response", { role: "assistant", content: reply });
        saveConversation();
        
    } catch (error) {
        removeLoadingMessage(loadingId);
        
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
        
        addMessageToChat("system", `Error: ${errorMessage}`);
    }
}

// Convert custom roles to API-compatible roles
function convertToApiRole(role) {
    const roleMapping = {
        user: "user",
        assistant: "assistant",
        system: "system",
        moderator: "user",
        expert: "user", 
        critic: "user",
        facilitator: "user"
    };
    return roleMapping[role] || "user";
}

// Chat Display Functions
function addMessageToChat(role, content) {
    const config = roleConfig[role];
    const messageDiv = document.createElement("div");
    messageDiv.className = `message message-${config.class}`;
    
    const timestamp = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `
        <span class="role-badge role-${config.class}">${config.emoji} ${config.label}</span>
        <span style="float: right; font-size: 11px; color: var(--text-muted);">${timestamp}</span>
        <div style="clear: both; margin-top: 5px;">${formatMessage(content)}</div>
    `;
    
    chatDiv.appendChild(messageDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
    return messageDiv;
}

function addLoadingMessage() {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message message-assistant";
    loadingDiv.id = `loading-${Date.now()}`;
    loadingDiv.innerHTML = `
        <span class="role-badge role-assistant">🤖 Assistant</span>
        <div style="margin-top: 5px;">
            <span class="loading"></span> Thinking...
        </div>
    `;
    
    chatDiv.appendChild(loadingDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
    return loadingDiv.id;
}

function removeLoadingMessage(loadingId) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function formatMessage(content) {
    // Basic formatting for better readability
    return content
        .replace(/\n/g, '<br>')
        .replace(/`([^`]+)`/g, '<code style="background: var(--bg-input); padding: 2px 4px; border-radius: 3px;">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// Chat Management
function clearChat() {
    chatDiv.innerHTML = "";
    messages.length = 1; // Keep only the system message
    currentConversationId = null;
}

// Conversation History Management
function saveToHistory(type, data) {
    const historyItem = {
        timestamp: new Date().toISOString(),
        type: type,
        data: data
    };
    conversationHistory.push(historyItem);
    
    // Keep only last 100 history items
    if (conversationHistory.length > 100) {
        conversationHistory = conversationHistory.slice(-100);
    }
    
    localStorage.setItem('chatbot_history', JSON.stringify(conversationHistory));
}

function loadConversationHistory() {
    try {
        const saved = localStorage.getItem('chatbot_history');
        if (saved) {
            conversationHistory = JSON.parse(saved);
        }
    } catch (error) {
        console.error("Error loading conversation history:", error);
        conversationHistory = [];
    }
}

function showHistory() {
    if (conversationHistory.length === 0) {
        historyContent.innerHTML = "<p>No conversation history available.</p>";
    } else {
        let historyHtml = "";
        conversationHistory.forEach((item, index) => {
            const date = new Date(item.timestamp).toLocaleString();
            historyHtml += `
                <div style="border-bottom: 1px solid var(--border-color); padding: 10px 0;">
                    <strong>${date}</strong> - ${item.type}
                    <br>
                    <small>${JSON.stringify(item.data, null, 2)}</small>
                </div>
            `;
        });
        historyContent.innerHTML = historyHtml;
    }
    historyModal.style.display = "block";
}

function hideHistory() {
    historyModal.style.display = "none";
}

function clearConversationHistory() {
    conversationHistory = [];
    localStorage.removeItem('chatbot_history');
    historyContent.innerHTML = "<p>Conversation history cleared.</p>";
}

// Export/Import Functions
function exportConversation() {
    const exportData = {
        timestamp: new Date().toISOString(),
        systemPrompt: messages[0].content,
        messages: messages.slice(1),
        history: conversationHistory
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `chatbot-conversation-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function exportAllConversations() {
    const exportData = {
        timestamp: new Date().toISOString(),
        conversations: conversations,
        history: conversationHistory
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `all-conversations-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importConversation(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            // Restore system prompt
            if (importData.systemPrompt) {
                systemPromptInput.value = importData.systemPrompt;
                updateSystemPrompt();
            }
            
            // Restore messages
            if (importData.messages && Array.isArray(importData.messages)) {
                clearChat();
                importData.messages.forEach(msg => {
                    if (msg.role && msg.content) {
                        addMessageToChat(msg.role, msg.content);
                        messages.push(msg);
                    }
                });
            }
            
            // Restore history
            if (importData.history && Array.isArray(importData.history)) {
                conversationHistory = importData.history;
                localStorage.setItem('chatbot_history', JSON.stringify(conversationHistory));
            }
            
            addMessageToChat("system", "Conversation imported successfully!");
            
        } catch (error) {
            console.error("Import error:", error);
            alert("Error importing conversation. Please check the file format.");
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function clearAllConversations() {
    if (confirm("Are you sure you want to clear all conversations? This cannot be undone.")) {
        conversations = [];
        currentConversationId = null;
        clearChat();
        saveConversations();
        updateSidebar();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
