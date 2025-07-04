// Enhanced ChatBot logic with avatars, typing indicator, and close/minimize functionality

let appointmentState = null;
let appointmentData = {};

function resetAppointment() {
    appointmentState = null;
    appointmentData = {};
}

document.addEventListener('DOMContentLoaded', function () {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatbotContainer = document.getElementById('chatbot-container');
    const closeButton = document.getElementById('close-button');
    const minimizeButton = document.getElementById('minimize-button');
    let typingIndicator = null;
    let isMinimized = false;

    function createBotAvatar() {
        // Simple animated SVG robot avatar
        return `<span class="bot-avatar">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="16" fill="#2bb6a8"/>
                <ellipse cx="12" cy="18" rx="3" ry="4" fill="#fff"/>
                <ellipse cx="24" cy="18" rx="3" ry="4" fill="#fff"/>
                <circle cx="12" cy="18" r="1.2" fill="#2bb6a8"/>
                <circle cx="24" cy="18" r="1.2" fill="#2bb6a8"/>
                <rect x="14" y="25" width="8" height="2" rx="1" fill="#fff"/>
            </svg>
        </span>`;
    }

    function appendMessage(text, sender, contactIntent = false) {
        const row = document.createElement('div');
        row.className = 'message-row ' + (sender === 'user' ? 'user-message' : 'bot-message');
        let messageBubbleSelector = '.message-bubble';
        if (sender === 'bot') {
            // Detect contact keywords in the bot's reply (for fallback)
            const contactKeywords = [
                'contact',
                'contacter un conseiller',
                'conseiller',
                'nous contacter',
                'joindre un conseiller',
                'prendre contact',
                'parler à un conseiller',
                'aide contact',
                'support contact'
            ];
            const lowerText = text.toLowerCase();
            const hasContact = contactKeywords.some(keyword => lowerText.includes(keyword));
            let messageHtml = `<div class=\"message-bubble\">${marked.parse(text)}</div>`;
            if (contactIntent || hasContact) {
                messageHtml += `
                  <div class='contact-link-container' style='margin-top:8px; display: flex; gap: 12px;'>
                    <a href='https://umod.fr/nous-contacter/' target='_blank' class='contact-link' style='color:#2bb6a8;font-weight:600;text-decoration:underline;cursor:pointer;'>Nous Contacter</a>
                    <button class='appointment-btn' style='color:#fff;background:#2bb6a8;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;'>Prendre un RDV</button>
                  </div>
                `;
            }
            row.innerHTML = `
                ${messageHtml}
                ${createBotAvatar()}
            `;
        } else {
            row.innerHTML = `
                <div class=\"message-bubble\">${text}</div>
            `;
        }
        chatMessages.appendChild(row);
        // Add animation class to the message bubble
        const bubble = row.querySelector('.message-bubble');
        if (bubble) {
            bubble.classList.add('message-appear');
            bubble.addEventListener('animationend', function handler() {
                bubble.classList.remove('message-appear');
                bubble.removeEventListener('animationend', handler);
            });
        }
        // Add event listener for appointment button
        const appointmentBtn = row.querySelector('.appointment-btn');
        if (appointmentBtn) {
            appointmentBtn.addEventListener('click', function() {
                startAppointmentFlow();
            });
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function startAppointmentFlow() {
        appointmentState = 'nom';
        appointmentData = {};
        appendMessage("Pour prendre rendez-vous, quel est votre nom ?", 'bot');
    }

    // Show welcome message on load
    appendMessage("Comment pouvons-nous vous aider aujourd'hui ?", 'bot');

    function showTypingIndicator() {
        typingIndicator = document.createElement('div');
        typingIndicator.className = 'message-row bot-message';
        typingIndicator.innerHTML = `
            <div class="message-bubble typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
            ${createBotAvatar()}
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        if (typingIndicator) {
            chatMessages.removeChild(typingIndicator);
            typingIndicator = null;
        }
    }

    function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;
        appendMessage(text, 'user');
        userInput.value = '';
        if (appointmentState) {
            handleAppointmentInput(text);
            return;
        }
        showTypingIndicator();
        fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        })
        .then(res => res.json())
        .then(data => {
            removeTypingIndicator();
            const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";
            const contactIntent = data.contact_intent === true;
            appendMessage(reply, 'bot', contactIntent);
        })
        .catch(() => {
            removeTypingIndicator();
            appendMessage('Une erreur est survenue. Veuillez réessayer.', 'bot');
        });
    }

    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Close button logic
    closeButton.addEventListener('click', function (e) {
        e.stopPropagation();
        chatbotContainer.classList.add('closing');
        setTimeout(() => {
            chatbotContainer.style.display = 'none';
            chatbotContainer.classList.remove('closing');
        }, 300); // Match the CSS opacity transition duration
    });

    // Minimize button logic
    minimizeButton.addEventListener('click', function (e) {
        e.stopPropagation();
        isMinimized = !isMinimized;
        if (isMinimized) {
            chatbotContainer.classList.add('minimized');
        } else {
            chatbotContainer.classList.remove('minimized');
        }
    });

    // Restore chatbot when clicking the minimized bar (except on close/minimize buttons)
    chatbotContainer.addEventListener('click', function (e) {
        if (isMinimized && !e.target.closest('#close-button') && !e.target.closest('#minimize-button')) {
            isMinimized = false;
            chatbotContainer.classList.remove('minimized');
        }
    });
});