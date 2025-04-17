// Acquire VS Code API
const vscode = acquireVsCodeApi();

// Initialize state
let state = {
    messages: [],
    connected: false,
};

// Try to load any previously saved state
const previousState = vscode.getState();
if (previousState) {
    state = previousState;
}

// Get DOM elements
const messagesContainer = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const connectionStatus = document.getElementById("connection-status");

// Update connection status UI
function updateConnectionStatus(isConnected) {
    state.connected = isConnected;

    if (isConnected) {
        connectionStatus.textContent = "Connected";
        connectionStatus.classList.add("connected");
        messageInput.disabled = false;
        sendButton.disabled = false;
    } else {
        connectionStatus.textContent = "Disconnected";
        connectionStatus.classList.remove("connected");
        messageInput.disabled = true;
        sendButton.disabled = true;
    }

    // Save state
    vscode.setState(state);
}

// Add a message to the chat
function addMessage(text, isSelf, isSystem = false) {
    // Create message object
    const message = {
        text,
        isSelf,
        isSystem,
        timestamp: new Date().toISOString(),
    };

    // Add to state
    state.messages.push(message);

    // Add to UI
    renderMessage(message);

    // Save state
    vscode.setState(state);
}

// Format timestamp for display
function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Render a message in the UI
function renderMessage(message) {
    const messageElement = document.createElement("div");

    if (message.isSystem) {
        messageElement.className = "system-message";
        messageElement.textContent = message.text;
    } else {
        messageElement.className = message.isSelf ? "message self" : "message peer";

        // Text content
        const textSpan = document.createElement("div");
        textSpan.className = "message-text";
        textSpan.textContent = message.text;
        messageElement.appendChild(textSpan);

        // Timestamp
        const timestampSpan = document.createElement("div");
        timestampSpan.className = "timestamp";
        timestampSpan.textContent = formatTimestamp(message.timestamp);
        messageElement.appendChild(timestampSpan);
    }

    messagesContainer.appendChild(messageElement);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send a message
function sendMessage() {
    const text = messageInput.value.trim();

    if (text && state.connected) {
        // Send to extension
        vscode.postMessage({
            type: "sendMessage",
            text: text,
        });

        // Add to chat (optimistic)
        addMessage(text, true);

        // Clear input
        messageInput.value = "";
        messageInput.focus();
    }
}

// Handle button click
sendButton.addEventListener("click", () => {
    sendMessage();
});

// Handle enter key in input field
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Render any messages from saved state
function renderSavedMessages() {
    // Clear welcome message if we have saved messages
    if (state.messages.length > 0) {
        messagesContainer.innerHTML = "";
    }

    // Render each message
    state.messages.forEach((message) => {
        renderMessage(message);
    });

    // Update connection status
    updateConnectionStatus(state.connected);
}

// Listen for messages from the extension
window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
        case "receiveMessage":
            addMessage(message.text, false);
            break;

        case "systemMessage":
            addMessage(message.text, false, true);
            break;

        case "connectionStatus":
            updateConnectionStatus(message.connected);

            // Add system message about connection
            if (message.connected) {
                addMessage("Connected to peer", false, true);
            } else {
                addMessage("Disconnected from peer", false, true);
            }
            break;

        case "clearChat":
            // Clear chat history
            messagesContainer.innerHTML = "";
            state.messages = [];
            vscode.setState(state);

            // Add welcome message back
            const welcomeDiv = document.createElement("div");
            welcomeDiv.className = "welcome-message";
            welcomeDiv.textContent = "Welcome to ChattyMcChatface! Waiting for connection...";
            messagesContainer.appendChild(welcomeDiv);
            break;
    }
});

// Initialize UI with saved state
renderSavedMessages();
