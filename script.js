// Konfigurasi API - GANTI DENGAN API KEY ANDA YANG VALID
const API_KEY = 'AIzaSyA4BnoJUxOopad0gnJDyFKBRcT6yrZlxPg'; // INI HARUS DIGANTI!
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// ------------------------------------
// SCRIPT ANIMASI PARTIKEL
// ------------------------------------
(function() {
    const canvas = document.getElementById('particles-js');
    const ctx = canvas.getContext('2d');
    let W, H, particles;
    const particleCount = 100;
    const maxDistance = 100;

    function Particle() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.radius = 1 + Math.random() * 2;
        this.directionX = Math.random() * 0.4 - 0.2;
        this.directionY = Math.random() * 0.4 - 0.2;
        this.color = `rgba(0, 255, 255, ${0.1 + Math.random() * 0.4})`;
    }

    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    };

    Particle.prototype.update = function() {
        this.x += this.directionX;
        this.y += this.directionY;

        if (this.x > W + this.radius || this.x < -this.radius) this.directionX *= -1;
        if (this.y > H + this.radius || this.y < -this.radius) this.directionY *= -1;

        this.draw();
    };

    function connectParticles() {
        let i, j, distance, opacity;
        for (i = 0; i < particleCount; i++) {
            for (j = i + 1; j < particleCount; j++) {
                distance = Math.sqrt(
                    Math.pow(particles[i].x - particles[j].x, 2) + 
                    Math.pow(particles[i].y - particles[j].y, 2)
                );

                if (distance < maxDistance) {
                    opacity = 1 - (distance / maxDistance);
                    ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * 0.15})`; 
                    ctx.lineWidth = 1;
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
        requestAnimationFrame(animate);
        
        ctx.fillStyle = 'rgba(17, 25, 40, 0.15)'; 
        ctx.fillRect(0, 0, W, H);

        const gradient = ctx.createLinearGradient(0, 0, W, H);
        gradient.addColorStop(0, 'rgba(17, 25, 40, 1)'); 
        gradient.addColorStop(1, 'rgba(31, 42, 55, 1)');
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'destination-over'; 
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over'; 

        connectParticles();
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
    }

    window.addEventListener('resize', init);
    init();
    animate();
})();

// ------------------------------------
// SCRIPT CHATBOT DENGAN FITUR BARU DAN ERROR HANDLING
// ------------------------------------
(function() {
    // Konstanta dan variabel global
    const CHATS_STORAGE_KEY = 'oracle_ai_chats';
    
    // DOM Elements
    const chatContainer = document.getElementById('chat-container');
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const chatHistoryEl = document.querySelector('.chat-history');
    const newChatBtn = document.querySelector('.new-chat-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const voiceBtn = document.getElementById('voice-btn');
    const modelBtns = document.querySelectorAll('.model-btn');
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    
    // Variabel aplikasi
    let files = [];
    let allChats = [];
    let currentChatIndex = -1; // -1 berarti chat baru
    let recognition = null;
    let isListening = false;
    let isProcessing = false; // Flag untuk mencegah multiple requests
    
    // Inisialisasi aplikasi
    function init() {
        // Load data dari localStorage
        loadChats();
        
        // Setup event listeners
        setupEventListeners();
        
        // Render UI berdasarkan data yang dimuat
        renderChatHistory();
        updateUI();
        
        // Setup Web Speech API jika tersedia
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setupSpeechRecognition();
        } else {
            voiceBtn.style.display = 'none';
        }
        
        // Setup auto-resize textarea
        setupAutoResize();
        
        // Cek status API key
        checkAPIKeyStatus();
    }
    
    // Cek status API key
    function checkAPIKeyStatus() {
        if (!API_KEY || API_KEY === 'AIzaSyA4BnoJUxOopad0gnJDyFKBRcT6yrZlxPg') {
            showToast('⚠️ API Key tidak valid! Silakan ganti API_KEY di script.js', 'error', 10000);
            console.error('API Key tidak valid. Silakan ganti dengan API key Gemini yang valid.');
        }
    }
    
    // Load chat history dari localStorage
    function loadChats() {
        try {
            const storedChats = localStorage.getItem(CHATS_STORAGE_KEY);
            if (storedChats) {
                allChats = JSON.parse(storedChats);
                // Set current chat ke yang terakhir
                if (allChats.length > 0) {
                    currentChatIndex = allChats.length - 1;
                }
            } else {
                allChats = [];
                currentChatIndex = -1;
            }
        } catch (error) {
            console.error('Error loading chats:', error);
            allChats = [];
            currentChatIndex = -1;
            showToast('Error loading chat history', 'error');
        }
    }
    
    // Save chat history ke localStorage
    function saveChats() {
        try {
            localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(allChats));
        } catch (error) {
            console.error('Error saving chats:', error);
            showToast('Error saving chat history', 'error');
        }
    }
    
    // Setup semua event listeners
    function setupEventListeners() {
        // Send button
        sendBtn.addEventListener('click', sendMessage);
        
        // Enter key untuk kirim pesan (Shift+Enter untuk new line)
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Input validation
        promptInput.addEventListener('input', () => {
            sendBtn.disabled = promptInput.value.trim() === '' || isProcessing;
        });
        
        // File upload
        document.getElementById('upload-btn').addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleFileUpload);
        
        // Voice input
        voiceBtn.addEventListener('click', toggleVoiceInput);
        
        // Sidebar toggle
        menuToggleBtn.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', (e) => {
            if (e.target === sidebarOverlay) {
                toggleSidebar();
            }
        });
        
        // New chat
        newChatBtn.addEventListener('click', createNewChat);
        
        // Model selection
        modelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modelBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                showToast(`Model ${btn.dataset.model} dipilih`, 'info');
            });
        });
        
        // Suggestion cards
        suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.dataset.prompt;
                promptInput.value = prompt;
                sendBtn.disabled = false;
                // Auto focus ke input
                promptInput.focus();
            });
        });
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Tab menjadi aktif kembali, update UI jika perlu
                updateSendButtonState();
            }
        });
    }
    
    // Setup auto-resize untuk textarea
    function setupAutoResize() {
        promptInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    // Update send button state
    function updateSendButtonState() {
        sendBtn.disabled = promptInput.value.trim() === '' || isProcessing;
    }
    
    // Setup speech recognition
    function setupSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'id-ID'; // Bahasa Indonesia
                
                recognition.onstart = function() {
                    isListening = true;
                    voiceBtn.classList.add('listening');
                    showToast('🎤 Mendengarkan...', 'info');
                };
                
                recognition.onresult = function(event) {
                    const transcript = event.results[0][0].transcript;
                    promptInput.value = transcript;
                    updateSendButtonState();
                    isListening = false;
                    voiceBtn.classList.remove('listening');
                    showToast('✅ Suara berhasil dikenali', 'success');
                };
                
                recognition.onerror = function(event) {
                    console.error('Speech recognition error', event.error);
                    isListening = false;
                    voiceBtn.classList.remove('listening');
                    
                    let errorMessage = 'Error speech recognition';
                    switch(event.error) {
                        case 'not-allowed':
                            errorMessage = 'Microphone tidak diizinkan';
                            break;
                        case 'audio-capture':
                            errorMessage = 'Tidak dapat mengakses microphone';
                            break;
                        case 'network':
                            errorMessage = 'Error jaringan';
                            break;
                    }
                    showToast(`❌ ${errorMessage}`, 'error');
                };
                
                recognition.onend = function() {
                    isListening = false;
                    voiceBtn.classList.remove('listening');
                };
            }
        } catch (error) {
            console.error('Error setting up speech recognition:', error);
            voiceBtn.style.display = 'none';
        }
    }
    
    // Toggle voice input
    function toggleVoiceInput() {
        if (!recognition) {
            showToast('❌ Speech recognition tidak tersedia', 'error');
            return;
        }
        
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                showToast('❌ Gagal memulai speech recognition', 'error');
            }
        }
    }
    
    // Handle file upload
    function handleFileUpload(e) {
        const uploadedFiles = Array.from(e.target.files);
        
        if (uploadedFiles.length > 0) {
            files = [...files, ...uploadedFiles];
            renderFilePreview();
            showToast(`📁 ${uploadedFiles.length} file berhasil diunggah`, 'success');
        }
        
        // Reset input
        fileInput.value = '';
    }
    
    // Render file preview
    function renderFilePreview() {
        filePreview.innerHTML = '';
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name}</span>
            <button class="file-remove" data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            filePreview.appendChild(fileItem);
        });
        
        // Add event listeners untuk remove buttons
        document.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                files.splice(index, 1);
                renderFilePreview();
            });
        });
    }
    
    // Toggle sidebar
    function toggleSidebar() {
        sidebarOverlay.classList.toggle('active');
    }
    
    // Create new chat
    function createNewChat() {
        currentChatIndex = -1;
        files = [];
        filePreview.innerHTML = '';
        promptInput.value = '';
        updateSendButtonState();
        updateUI();
        toggleSidebar();
        showToast('💬 Chat baru dibuat', 'info');
    }
    
    // Render chat history di sidebar
    function renderChatHistory() {
        chatHistoryEl.innerHTML = '';
        
        if (allChats.length === 0) {
            chatHistoryEl.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--gray);">
                    <i class="fas fa-comments" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    Belum ada percakapan
                </div>
            `;
            return;
        }
        
        allChats.forEach((chat, index) => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${index === currentChatIndex ? 'active' : ''}`;
            chatItem.dataset.index = index;
            
            // Ambil pesan pertama sebagai judul chat
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
            
            // Delete chat
            const deleteBtn = chatItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(index);
            });
            
            chatHistoryEl.appendChild(chatItem);
        });
    }
    
    // Load chat
    function loadChat(index) {
        if (index < 0 || index >= allChats.length) return;
        
        currentChatIndex = index;
        updateUI();
        toggleSidebar();
        showToast(`📂 Membuka percakapan`, 'info');
    }
    
    // Delete chat
    function deleteChat(index) {
        if (index < 0 || index >= allChats.length) return;
        
        const chatTitle = allChats[index].title || 'Percakapan';
        
        if (confirm(`Hapus percakapan "${chatTitle}"?`)) {
            allChats.splice(index, 1);
            
            if (currentChatIndex === index) {
                currentChatIndex = allChats.length > 0 ? allChats.length - 1 : -1;
            } else if (currentChatIndex > index) {
                currentChatIndex--;
            }
            
            saveChats();
            renderChatHistory();
            updateUI();
            showToast('🗑️ Percakapan dihapus', 'success');
        }
    }
    
    // Update UI berdasarkan state saat ini
    function updateUI() {
        // Tampilkan welcome screen atau chat container
        if (currentChatIndex === -1) {
            welcomeScreen.style.display = 'flex';
            chatContainer.style.display = 'none';
            chatContainer.innerHTML = '';
        } else {
            welcomeScreen.style.display = 'none';
            chatContainer.style.display = 'flex';
            
            // Render messages dari chat yang aktif
            renderMessages();
        }
        
        // Update chat history
        renderChatHistory();
    }
    
    // Render messages di chat container
    function renderMessages() {
        if (currentChatIndex === -1 || !allChats[currentChatIndex]) return;
        
        const chat = allChats[currentChatIndex];
        chatContainer.innerHTML = '';
        
        chat.messages.forEach(message => {
            const messageEl = createMessageElement(message);
            chatContainer.appendChild(messageEl);
        });
        
        // Scroll ke bawah
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }
    
    // Create message element
    function createMessageElement(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;
        
        // Format pesan dengan deteksi code blocks
        const formattedContent = formatMessage(message.content);
        messageEl.innerHTML = formattedContent;
        
        // Add copy buttons untuk code blocks
        messageEl.querySelectorAll('.code-block').forEach(block => {
            const copyBtn = block.querySelector('.copy-code-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    const code = block.querySelector('.code-content').textContent;
                    copyToClipboard(code);
                });
            }
        });
        
        return messageEl;
    }
    
    // Format pesan dengan deteksi code blocks
    function formatMessage(content) {
        if (!content) return '';
        
        // Deteksi code blocks dengan ```
        const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
        
        let result = '';
        let lastIndex = 0;
        let match;
        
        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Tambahkan teks sebelum code block
            result += escapeHtml(content.substring(lastIndex, match.index));
            
            // Ekstrak bahasa dan kode
            const language = match[1] || 'text';
            const code = match[2].trim();
            
            // Buat code block
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
        
        // Tambahkan sisa teks
        result += escapeHtml(content.substring(lastIndex));
        
        // Ganti newlines dengan <br>
        result = result.replace(/\n/g, '<br>');
        
        return result;
    }
    
    // Escape HTML untuk mencegah XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Copy text ke clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Kode berhasil disalin', 'success');
        }).catch(err => {
            console.error('Gagal menyalin: ', err);
            showToast('❌ Gagal menyalin kode', 'error');
        });
    }
    
    // Send message
    async function sendMessage() {
        if (isProcessing) {
            showToast('⏳ Sedang memproses...', 'warning');
            return;
        }
        
        const prompt = promptInput.value.trim();
        if (!prompt && files.length === 0) {
            showToast('✍️ Silakan ketik pesan', 'warning');
            return;
        }
        
        // Validasi API key
        if (!API_KEY || API_KEY === 'AIzaSyCQaC6JYg9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9') {
            showToast('❌ API Key tidak valid! Ganti API_KEY di script.js', 'error', 10000);
            return;
        }
        
        isProcessing = true;
        updateSendButtonState();
        
        // Jika ini chat baru, buat chat baru
        if (currentChatIndex === -1) {
            const newChat = {
                id: Date.now(),
                title: prompt.substring(0, 25) || 'Percakapan Baru',
                messages: [],
                createdAt: new Date().toISOString()
            };
            allChats.push(newChat);
            currentChatIndex = allChats.length - 1;
        }
        
        // Tambahkan pesan user ke chat
        const userMessage = {
            role: 'user',
            content: prompt + (files.length > 0 ? `\n\n[Lampiran: ${files.length} file]` : ''),
            timestamp: new Date().toISOString()
        };
        
        allChats[currentChatIndex].messages.push(userMessage);
        
        // Update UI
        updateUI();
        
        // Reset input
        promptInput.value = '';
        files = [];
        filePreview.innerHTML = '';
        promptInput.style.height = 'auto';
        
        // Tampilkan typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing"></div>
            <div class="typing"></div>
            <div class="typing"></div>
        `;
        chatContainer.appendChild(typingIndicator);
        
        // Scroll ke bawah
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
        
        try {
            // Generate response dari AI
            const response = await generateAIResponse(prompt);
            
            // Hapus typing indicator
            typingIndicator.remove();
            
            // Tambahkan pesan AI ke chat
            const aiMessage = {
                role: 'ai',
                content: response,
                timestamp: new Date().toISOString()
            };
            
            allChats[currentChatIndex].messages.push(aiMessage);
            
            // Update judul chat jika perlu
            if (allChats[currentChatIndex].title === 'Percakapan Baru' && prompt.length > 0) {
                allChats[currentChatIndex].title = prompt.substring(0, 25) + (prompt.length > 25 ? '...' : '');
            }
            
            // Update UI
            updateUI();
            
            // Simpan chat
            saveChats();
            
            // Play sound effect
            playNotificationSound();
            
            showToast('✅ Respons diterima', 'success');
            
        } catch (error) {
            // Hapus typing indicator
            typingIndicator.remove();
            
            console.error('Error generating AI response:', error);
            
            // Tampilkan pesan error yang lebih informatif
            let errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.';
            
            if (error.message.includes('API key not valid')) {
                errorMessage = '❌ API Key tidak valid! Silakan ganti API_KEY di script.js dengan kunci yang valid dari Google AI Studio.';
                showToast(errorMessage, 'error', 10000);
            } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
                errorMessage = '⏳ Quota API habis atau rate limit tercapai. Silakan coba lagi nanti.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = '🌐 Error jaringan. Periksa koneksi internet Anda.';
            }
            
            const errorMessageObj = {
                role: 'ai',
                content: errorMessage,
                timestamp: new Date().toISOString()
            };
            
            allChats[currentChatIndex].messages.push(errorMessageObj);
            updateUI();
            
        } finally {
            isProcessing = false;
            updateSendButtonState();
        }
    }
    
    // Generate AI response menggunakan Gemini API
    async function generateAIResponse(prompt) {
        // Validasi input
        if (!prompt || prompt.trim() === '') {
            throw new Error('Prompt tidak boleh kosong');
        }
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
                topP: 0.8,
                topK: 40
            }
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout 30 detik
        
        try {
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                
                if (response.status === 401) {
                    throw new Error('API key not valid. Please pass a valid API key.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.');
                } else {
                    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
                }
            }
            
            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format from API');
            }
            
            return data.candidates[0].content.parts[0].text;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }
            throw error;
        }
    }
    
    // Play notification sound
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
            console.error('Error playing sound:', error);
        }
    }
    
    // Show toast notification
    function showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.querySelector('.toast-container');
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
            <button class="close-toast"><i class="fas fa-times"></i></button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto remove setelah duration
        const removeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        };
        
        setTimeout(removeToast, duration);
        
        // Close button
        toast.querySelector('.close-toast').addEventListener('click', removeToast);
    }
    
    // Inisialisasi aplikasi
    init();
})();