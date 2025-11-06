// SCRIPT CHATBOT DENGAN LOCAL STORAGE
// ------------------------------------
(function() {
    const CHATS_STORAGE_KEY = 'stellarflow_ai_chats';
    const chatContainer = document.getElementById('chat-container');
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const chatHistoryEl = document.querySelector('.chat-history');
    const newChatBtn = document.querySelector('.new-chat-btn');

    // GANTI DENGAN API KEY ANDA
    const API_KEY = 'AIzaSyA4BnoJUxOopad0gnJDyFKBRcT6yrZlxPg'; 
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    let files = [];
    let allChats = [];
    let currentChatIndex = -1;

    // --- Local Storage & Data Management ---

    function saveChats() {
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(allChats));
    }

    function loadChats() {
        try {
            const storedChats = localStorage.getItem(CHATS_STORAGE_KEY);
            allChats = storedChats ? JSON.parse(storedChats) : [];
            renderChatHistory();
            if (allChats.length > 0) {
                selectChat(0);
            } else {
                startNewChat();
            }
        } catch (error) {
            console.error('Error loading chats:', error);
            allChats = [];
            startNewChat();
        }
    }

    function startNewChat() {
        currentChatIndex = -1;
        chatContainer.innerHTML = '';
        addMessage('StellarFlow — Where stellar intelligence meets seamless execution. What milestone shall we conquer today?', 'ai');
        renderChatHistory();
    }

    function renderChatHistory() {
        if (!chatHistoryEl) return;
        
        chatHistoryEl.innerHTML = '';

        if (allChats.length === 0) {
            chatHistoryEl.innerHTML = '<div style="padding: 20px; color: #888; text-align: center;">No chat history</div>';
            return;
        }

        allChats.forEach((chat, index) => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (index === currentChatIndex) {
                chatItem.classList.add('active');
            }
            
            const firstUserMessage = chat.messages.find(m => m.sender === 'user');
            const title = firstUserMessage ? 
                firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '') : 
                'New Chat';

            chatItem.innerHTML = `<i class="fas fa-comment"></i> ${title}`;
            chatItem.addEventListener('click', () => {
                selectChat(index);
                toggleSidebar();
            });
            chatHistoryEl.appendChild(chatItem);
        });
    }

    function selectChat(index) {
        currentChatIndex = index;
        const chat = allChats[index];
        
        if (!chatContainer) return;
        
        chatContainer.innerHTML = '';
        chat.messages.forEach(msg => {
            addMessage(msg.text, msg.sender);
        });
        renderChatHistory();
    }

    // --- UI Functions ---

    function toggleSidebar() {
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('active');
        }
    }

    function updateSendButton() {
        if (sendBtn) {
            sendBtn.disabled = promptInput.value.trim() === '' && files.length === 0;
        }
    }
    
    function addFiles(fileList) {
        if (!filePreview) return;
        
        for (const file of fileList) {
            files.push(file);
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-file';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = file.name;
            
            const removeBtn = document.createElement('i');
            removeBtn.className = 'file-remove fas fa-times';
            removeBtn.addEventListener('click', () => {
                files = files.filter(f => f !== file);
                fileItem.remove();
                updateSendButton();
            });
            
            fileItem.appendChild(icon);
            fileItem.appendChild(nameSpan);
            fileItem.appendChild(removeBtn);
            filePreview.appendChild(fileItem);
        }
        updateSendButton();
    }
    
    function addMessage(text, sender = 'ai') {
        if (!chatContainer) return null;
        
        const msg = document.createElement('div');
        msg.className = 'message ' + sender;
        msg.textContent = text;
        chatContainer.appendChild(msg);
        
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return msg;
    }
    
    function addTypingIndicator() {
        if (!chatContainer) return null;
        
        const typingBubble = document.createElement('div');
        typingBubble.className = 'message ai typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'typing-dot';
            typingBubble.appendChild(dot);
        }
        
        chatContainer.appendChild(typingBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return typingBubble;
    }
    
    function autoResizeTextarea() {
        if (!promptInput) return;
        
        promptInput.style.height = 'auto';
        promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
    }

    // --- API Call Function ---

    async function sendToAI(prompt) {
        if (!API_KEY || API_KEY === 'AIzaSyA4BnoJUxOopad0gnJDyFKBRcT6yrZlxPg') {
            throw new Error('API key not configured. Please add your Gemini API key.');
        }

        const requestBody = { 
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('No response from AI');
        }
    }

    // --- Main Send Function ---

    async function handleSend() {
        const prompt = promptInput.value.trim();
        if (!prompt && files.length === 0) return;

        // Save user message
        if (currentChatIndex === -1) {
            const newChat = {
                id: Date.now(),
                messages: []
            };
            allChats.unshift(newChat);
            currentChatIndex = 0;
        }
        
        const userMessage = { text: prompt, sender: 'user' };
        allChats[currentChatIndex].messages.push(userMessage);

        // Add user message to UI
        if (prompt) addMessage(prompt, 'user');
        if (files.length > 0) {
            addMessage(`[Sent ${files.length} file(s)]`, 'user');
            allChats[currentChatIndex].messages.push({ 
                text: `[Sent ${files.length} file(s)]`, 
                sender: 'user' 
            });
        }

        saveChats();

        // Clear input and show typing
        promptInput.value = '';
        filePreview.innerHTML = '';
        files = [];
        updateSendButton();
        autoResizeTextarea();
        sendBtn.disabled = true;
        
        const typingBubble = addTypingIndicator();

        try {
            // Send to AI
            const aiResponse = await sendToAI(prompt);
            
            // Replace typing with actual response
            typingBubble.textContent = aiResponse;
            typingBubble.className = 'message ai';

            // Save AI response
            allChats[currentChatIndex].messages.push({ 
                text: aiResponse, 
                sender: 'ai' 
            });
            saveChats();
            renderChatHistory();

        } catch (error) {
            // Show error
            typingBubble.textContent = `Error: ${error.message}`;
            typingBubble.className = 'message ai error';
            
            allChats[currentChatIndex].messages.push({ 
                text: `Error: ${error.message}`, 
                sender: 'ai' 
            });
            saveChats();
        } finally {
            sendBtn.disabled = false;
        }
    }

    // --- Event Listeners ---

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSend);
    }

    if (promptInput) {
        promptInput.addEventListener('input', () => {
            updateSendButton();
            autoResizeTextarea();
        });
        
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendBtn.disabled) handleSend();
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                addFiles(e.target.files);
                e.target.value = '';
            }
        });
    }
    
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'sidebar-overlay') {
                toggleSidebar();
            }
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            startNewChat();
            toggleSidebar();
        });
    }

    // --- Initialize ---
    function init() {
        updateSendButton();
        autoResizeTextarea();
        loadChats();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();