// =============================================
// ORAKELFLOW AI CHAT - SCRIPT.JS
// =============================================

// 🔑 GANTI API KEY ANDA DI SINI!
const API_KEY = 'AIzaSyA4BnoJUxOopad0gnJDyFKBRcT6yrZlxPg'; // ← GANTI INI!
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// =============================================
// PARTICLE ANIMATION
// =============================================
(function() {
    const canvas = document.getElementById('particles-js');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    const particleCount = 80;
    const maxDistance = 120;

    function Particle() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.radius = Math.random() * 2 + 1;
        this.directionX = (Math.random() * 0.5 - 0.25);
        this.directionY = (Math.random() * 0.5 - 0.25);
        this.color = `rgba(0, 255, 255, ${Math.random() * 0.3 + 0.1})`;
    }

    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    };

    Particle.prototype.update = function() {
        this.x += this.directionX;
        this.y += this.directionY;

        if (this.x > W + this.radius) this.x = -this.radius;
        if (this.x < -this.radius) this.x = W + this.radius;
        if (this.y > H + this.radius) this.y = -this.radius;
        if (this.y < -this.radius) this.y = H + this.radius;

        this.draw();
    };

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacity = 1 - (distance / maxDistance);
                    ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * 0.1})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function init() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;

        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(17, 25, 40, 0.05)';
        ctx.fillRect(0, 0, W, H);

        connectParticles();
        particles.forEach(particle => particle.update());

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();
})();

// =============================================
// CHAT APPLICATION
// =============================================
(function() {
    // Constants
    const CHATS_STORAGE_KEY = 'oracle_ai_chats';
    
    // DOM Elements
    const elements = {
        chatContainer: document.getElementById('chat-container'),
        promptInput: document.getElementById('prompt-input'),
        sendBtn: document.getElementById('send-btn'),
        fileInput: document.getElementById('file-input'),
        filePreview: document.getElementById('file-preview'),
        menuToggleBtn: document.getElementById('menu-toggle-btn'),
        sidebarOverlay: document.getElementById('sidebar-overlay'),
        chatHistoryEl: document.querySelector('.chat-history'),
        newChatBtn: document.querySelector('.new-chat-btn'),
        welcomeScreen: document.getElementById('welcome-screen'),
        voiceBtn: document.getElementById('voice-btn'),
        uploadBtn: document.getElementById('upload-btn'),
        modelBtns: document.querySelectorAll('.model-btn'),
        suggestionCards: document.querySelectorAll('.suggestion-card')
    };

    // State
    let state = {
        files: [],
        allChats: [],
        currentChatIndex: -1,
        recognition: null,
        isListening: false,
        isProcessing: false
    };

    // =============================================
    // INITIALIZATION
    // =============================================
    function init() {
        loadChats();
        setupEventListeners();
        renderChatHistory();
        updateUI();
        setupSpeechRecognition();
        setupAutoResize();
        checkAPIKey();
        
        console.log('OracleFlow AI initialized successfully');
    }

    function checkAPIKey() {
        if (!API_KEY || API_KEY === 'AIzaSyA4BnoJUxOopad0gnJDyFKBRcT6yrZlxPg') {
            showToast('⚠️ GANTI API KEY! Buka script.js dan ganti YOUR_GEMINI_API_KEY_HERE', 'error', 10000);
        }
    }

    // =============================================
    // DATA MANAGEMENT
    // =============================================
    function loadChats() {
        try {
            const storedChats = localStorage.getItem(CHATS_STORAGE_KEY);
            state.allChats = storedChats ? JSON.parse(storedChats) : [];
            
            if (state.allChats.length > 0) {
                state.currentChatIndex = state.allChats.length - 1;
            }
        } catch (error) {
            console.error('Error loading chats:', error);
            state.allChats = [];
            state.currentChatIndex = -1;
        }
    }

    function saveChats() {
        try {
            localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(state.allChats));
        } catch (error) {
            console.error('Error saving chats:', error);
            showToast('Error menyimpan riwayat chat', 'error');
        }
    }

    // =============================================
    // EVENT LISTENERS
    // =============================================
    function setupEventListeners() {
        // Send message
        elements.sendBtn.addEventListener('click', sendMessage);
        
        // Enter key to send
        elements.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Input validation
        elements.promptInput.addEventListener('input', updateSendButton);

        // File upload
        elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput.addEventListener('change', handleFileUpload);

        // Voice input
        elements.voiceBtn.addEventListener('click', toggleVoiceInput);

        // Sidebar
        elements.menuToggleBtn.addEventListener('click', toggleSidebar);
        elements.sidebarOverlay.addEventListener('click', (e) => {
            if (e.target === elements.sidebarOverlay) toggleSidebar();
        });

        // New chat
        elements.newChatBtn.addEventListener('click', createNewChat);

        // Model selection
        elements.modelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.modelBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                showToast(`Model ${btn.dataset.model} dipilih`, 'info');
            });
        });

        // Suggestion cards
        elements.suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.dataset.prompt;
                elements.promptInput.value = prompt;
                updateSendButton();
                elements.promptInput.focus();
            });
        });

        // Auto-resize textarea
        setupAutoResize();
    }

    function setupAutoResize() {
        elements.promptInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }

    // =============================================
    // UI MANAGEMENT
    // =============================================
    function updateSendButton() {
        const hasText = elements.promptInput.value.trim() !== '';
        const hasFiles = state.files.length > 0;
        elements.sendBtn.disabled = !hasText && !hasFiles;
    }

    function toggleSidebar() {
        elements.sidebarOverlay.classList.toggle('active');
    }

    function createNewChat() {
        state.currentChatIndex = -1;
        state.files = [];
        elements.filePreview.innerHTML = '';
        elements.promptInput.value = '';
        updateSendButton();
        updateUI();
        toggleSidebar();
        showToast('💬 Chat baru dibuat', 'success');
    }

    function renderChatHistory() {
        if (!elements.chatHistoryEl) return;
        
        elements.chatHistoryEl.innerHTML = '';

        if (state.allChats.length === 0) {
            elements.chatHistoryEl.innerHTML = `
                <div style="padding: 30px 20px; text-align: center; color: var(--gray);">
                    <i class="fas fa-comments" style="font-size: 32px; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                    <div>Belum ada percakapan</div>
                    <div style="font-size: 12px; margin-top: 8px;">Mulai chat baru untuk memulai</div>
                </div>
            `;
            return;
        }

        state.allChats.forEach((chat, index) => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${index === state.currentChatIndex ? 'active' : ''}`;
            
            const firstUserMessage = chat.messages.find(m => m.role === 'user');
            const title = firstUserMessage ? 
                firstUserMessage.content.substring(0, 25) + (firstUserMessage.content.length > 25 ? '...' : '') : 
                'Percakapan Baru';

            chatItem.innerHTML = `
                <div class="chat-info">
                    <i class="fas fa-comment"></i>
                    <span>${title}</span>
                </div>
                <div class="chat-actions">
                    <button class="chat-action-btn delete-btn" title="Hapus chat">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            chatItem.addEventListener('click', (e) => {
                if (!e.target.closest('.chat-action-btn')) {
                    loadChat(index);
                }
            });

            const deleteBtn = chatItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(index);
            });

            elements.chatHistoryEl.appendChild(chatItem);
        });
    }

    function loadChat(index) {
        if (index < 0 || index >= state.allChats.length) return;
        
        state.currentChatIndex = index;
        updateUI();
        toggleSidebar();
    }

    function deleteChat(index) {
        if (index < 0 || index >= state.allChats.length) return;

        const chatTitle = state.allChats[index].title || 'Percakapan';
        
        if (confirm(`Hapus percakapan "${chatTitle}"?`)) {
            state.allChats.splice(index, 1);
            
            if (state.currentChatIndex === index) {
                state.currentChatIndex = state.allChats.length > 0 ? state.allChats.length - 1 : -1;
            } else if (state.currentChatIndex > index) {
                state.currentChatIndex--;
            }
            
            saveChats();
            renderChatHistory();
            updateUI();
            showToast('🗑️ Percakapan dihapus', 'success');
        }
    }

    function updateUI() {
        // Show welcome screen or chat container
        if (state.currentChatIndex === -1) {
            elements.welcomeScreen.style.display = 'flex';
            elements.chatContainer.style.display = 'none';
            elements.chatContainer.innerHTML = '';
        } else {
            elements.welcomeScreen.style.display = 'none';
            elements.chatContainer.style.display = 'flex';
            renderMessages();
        }
        
        renderChatHistory();
    }

    function renderMessages() {
        if (state.currentChatIndex === -1 || !state.allChats[state.currentChatIndex]) return;
        
        const chat = state.allChats[state.currentChatIndex];
        elements.chatContainer.innerHTML = '';
        
        chat.messages.forEach(message => {
            const messageEl = createMessageElement(message);
            elements.chatContainer.appendChild(messageEl);
        });
        
        // Scroll to bottom dengan delay untuk memastikan render selesai
        setTimeout(() => {
            elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
        }, 100);
    }

    // =============================================
    // MESSAGE MANAGEMENT
    // =============================================
    function createMessageElement(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;
        messageEl.innerHTML = formatMessage(message.content);
        
        // Add copy functionality for code blocks
        messageEl.querySelectorAll('.copy-code-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const code = this.closest('.code-block').querySelector('.code-content').textContent;
                copyToClipboard(code);
                
                // Update button state
                const originalHTML = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> Disalin';
                this.classList.add('copied');
                
                setTimeout(() => {
                    this.innerHTML = originalHTML;
                    this.classList.remove('copied');
                }, 2000);
            });
        });
        
        return messageEl;
    }

    function formatMessage(content) {
        if (!content) return '';
        
        // Handle code blocks
        const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
        let result = '';
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Add text before code block
            result += escapeHtml(content.substring(lastIndex, match.index));
            
            const language = match[1] || 'text';
            const code = match[2].trim();
            
            result += `
                <div class="code-block">
                    <div class="code-header">
                        <span class="code-language">${language}</span>
                        <button class="copy-code-btn"><i class="fas fa-copy"></i> Salin</button>
                    </div>
                    <pre class="code-content">${escapeHtml(code)}</pre>
                </div>
            `;
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        result += escapeHtml(content.substring(lastIndex));
        
        // Replace newlines with <br>
        return result.replace(/\n/g, '<br>');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =============================================
    // FILE HANDLING
    // =============================================
    function handleFileUpload(e) {
        const uploadedFiles = Array.from(e.target.files);
        
        if (uploadedFiles.length > 0) {
            state.files = [...state.files, ...uploadedFiles];
            renderFilePreview();
            showToast(`📁 ${uploadedFiles.length} file ditambahkan`, 'success');
        }
        
        elements.fileInput.value = '';
        updateSendButton();
    }

    function renderFilePreview() {
        elements.filePreview.innerHTML = '';
        
        state.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${file.name}</span>
                <button class="file-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            elements.filePreview.appendChild(fileItem);
        });
        
        // Add remove event listeners
        elements.filePreview.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                state.files.splice(index, 1);
                renderFilePreview();
                updateSendButton();
            });
        });
    }

    // =============================================
    // SPEECH RECOGNITION
    // =============================================
    function setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            elements.voiceBtn.style.display = 'none';
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            state.recognition = new SpeechRecognition();
            state.recognition.continuous = false;
            state.recognition.interimResults = false;
            state.recognition.lang = 'id-ID';

            state.recognition.onstart = () => {
                state.isListening = true;
                elements.voiceBtn.classList.add('listening');
                showToast('🎤 Mendengarkan...', 'info');
            };

            state.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                elements.promptInput.value = transcript;
                updateSendButton();
                state.isListening = false;
                elements.voiceBtn.classList.remove('listening');
                showToast('✅ Suara dikenali', 'success');
            };

            state.recognition.onerror = (event) => {
                state.isListening = false;
                elements.voiceBtn.classList.remove('listening');
                showToast(`❌ Error: ${event.error}`, 'error');
            };

            state.recognition.onend = () => {
                state.isListening = false;
                elements.voiceBtn.classList.remove('listening');
            };
        } catch (error) {
            console.error('Speech recognition setup failed:', error);
            elements.voiceBtn.style.display = 'none';
        }
    }

    function toggleVoiceInput() {
        if (!state.recognition) {
            showToast('❌ Voice input tidak tersedia', 'error');
            return;
        }

        if (state.isListening) {
            state.recognition.stop();
        } else {
            state.recognition.start();
        }
    }

    // =============================================
    // MESSAGE SENDING & AI RESPONSE
    // =============================================
    async function sendMessage() {
        if (state.isProcessing) {
            showToast('⏳ Sedang memproses...', 'warning');
            return;
        }

        const prompt = elements.promptInput.value.trim();
        if (!prompt && state.files.length === 0) {
            showToast('✍️ Silakan ketik pesan', 'warning');
            return;
        }

        // API key validation
        if (!API_KEY || API_KEY === 'AIzaSyA4BnoJUxOopad0gnJDyFKBRcT6yrZlxPg') {
            showToast('❌ API Key belum diganti! Buka script.js dan ganti YOUR_GEMINI_API_KEY_HERE', 'error', 10000);
            return;
        }

        state.isProcessing = true;
        updateSendButton();

        // Create new chat if needed
        if (state.currentChatIndex === -1) {
            const newChat = {
                id: Date.now(),
                title: prompt.substring(0, 25) || 'Percakapan Baru',
                messages: [],
                createdAt: new Date().toISOString()
            };
            state.allChats.push(newChat);
            state.currentChatIndex = state.allChats.length - 1;
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: prompt + (state.files.length > 0 ? `\n\n[Mengirim ${state.files.length} file]` : ''),
            timestamp: new Date().toISOString()
        };

        state.allChats[state.currentChatIndex].messages.push(userMessage);
        updateUI();

        // Clear input
        elements.promptInput.value = '';
        state.files = [];
        elements.filePreview.innerHTML = '';
        elements.promptInput.style.height = 'auto';

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing"></div>
            <div class="typing"></div>
            <div class="typing"></div>
        `;
        elements.chatContainer.appendChild(typingIndicator);
        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;

        try {
            // Get AI response
            const response = await generateAIResponse(prompt);
            typingIndicator.remove();

            // Add AI message
            const aiMessage = {
                role: 'ai',
                content: response,
                timestamp: new Date().toISOString()
            };

            state.allChats[state.currentChatIndex].messages.push(aiMessage);
            
            // Update chat title if needed
            if (state.allChats[state.currentChatIndex].title === 'Percakapan Baru' && prompt.length > 0) {
                state.allChats[state.currentChatIndex].title = prompt.substring(0, 25) + (prompt.length > 25 ? '...' : '');
            }

            updateUI();
            saveChats();
            playNotificationSound();
            
        } catch (error) {
            typingIndicator.remove();
            console.error('AI Response Error:', error);
            
            let errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.';
            
            if (error.message.includes('API key not valid')) {
                errorMessage = '❌ API Key tidak valid! Pastikan Anda sudah mengganti API_KEY di script.js';
            } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
                errorMessage = '⏳ Quota API habis. Silakan coba lagi nanti atau gunakan API key yang berbeda.';
            } else if (error.message.includes('network')) {
                errorMessage = '🌐 Error koneksi. Periksa internet Anda.';
            }

            const errorMessageObj = {
                role: 'ai',
                content: errorMessage,
                timestamp: new Date().toISOString()
            };

            state.allChats[state.currentChatIndex].messages.push(errorMessageObj);
            updateUI();
            showToast(errorMessage, 'error');
            
        } finally {
            state.isProcessing = false;
            updateSendButton();
        }
    }

    async function generateAIResponse(prompt) {
        if (!prompt.trim()) {
            throw new Error('Prompt tidak boleh kosong');
        }

        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
                topP: 0.8,
                topK: 40
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 401) {
                    throw new Error('API key not valid. Please pass a valid API key.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else {
                    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
                }
            }

            const data = await response.json();
            
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Format respons AI tidak valid');
            }

            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Timeout: Respons terlalu lama. Silakan coba lagi.');
            }
            throw error;
        }
    }

    // =============================================
    // UTILITY FUNCTIONS
    // =============================================
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Kode disalin!', 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showToast('❌ Gagal menyalin', 'error');
        });
    }

    function playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.1;

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Silent fail for audio
        }
    }

    function showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="toast-icon ${icons[type] || icons.info}"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="close-toast">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Show animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        const removeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        };

        setTimeout(removeToast, duration);
        toast.querySelector('.close-toast').addEventListener('click', removeToast);
    }

    // =============================================
    // INITIALIZE APP
    // =============================================
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();