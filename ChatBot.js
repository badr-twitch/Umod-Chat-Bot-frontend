// Enhanced ChatBot logic with avatars, typing indicator, and close/minimize functionality

// Remove flatpickr imports and functions

document.addEventListener('DOMContentLoaded', function () {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatbotContainer = document.getElementById('chatbot-container');
    const closeButton = document.getElementById('close-button');
    const minimizeButton = document.getElementById('minimize-button');
    const bubble = document.getElementById('chatbot-bubble');
    let typingIndicator = null;
    let isMinimized = false;

    // Show only the bubble at start
    chatbotContainer.classList.remove('open', 'closing');
    chatbotContainer.style.display = 'none';
    bubble.style.display = 'flex';

    bubble.onclick = function() {
        chatbotContainer.style.display = 'flex';
        // Force reflow to allow transition
        void chatbotContainer.offsetWidth;
        chatbotContainer.classList.add('open');
        chatbotContainer.classList.remove('closing');
        bubble.style.display = 'none';
    };

    function createBotAvatar() {
        // Simple animated SVG robot avatar with a smile
        return `<span class="bot-avatar">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="16" fill="#2bb6a8"/>
                <ellipse cx="12" cy="18" rx="3" ry="4" fill="#fff"/>
                <ellipse cx="24" cy="18" rx="3" ry="4" fill="#fff"/>
                <circle cx="12" cy="18" r="1.2" fill="#2bb6a8"/>
                <circle cx="24" cy="18" r="1.2" fill="#2bb6a8"/>
                <!-- Smiling mouth -->
                <path d="M14 25 Q18 29 22 25" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
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
            let messageHtml = `<div class="message-bubble">${marked.parse(text)}</div>`;
            row.innerHTML = `
                ${messageHtml}
                ${createBotAvatar()}
            `;
            chatMessages.appendChild(row);
            if (contactIntent || hasContact) {
                // Insert the contact link as a new full-width row below the bot message row
                const contactRow = document.createElement('div');
                contactRow.className = 'message-row contact-link-row';
                contactRow.style.width = '100%';
                contactRow.innerHTML = `
                    <div class='contact-link-container' style='margin: 8px 0 0 0; display: flex; flex-direction: column; gap: 10px;'>
                        <button class='contact-action-btn' onclick="window.open('https://umod.fr/nous-contacter/', '_blank')">Nous Contacter</button>
                        <button class='contact-action-btn rdv-button'>Prendre RDV</button>
                    </div>`;
                chatMessages.appendChild(contactRow);
            }
        } else {
            row.innerHTML = `
                <div class=\"message-bubble\">${text}</div>
            `;
            chatMessages.appendChild(row);
        }
        // Add animation class to the message bubble
        const bubble = row.querySelector('.message-bubble');
        if (bubble) {
            bubble.classList.add('message-appear');
            bubble.addEventListener('animationend', function handler() {
                bubble.classList.remove('message-appear');
                bubble.removeEventListener('animationend', handler);
            });
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
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

    let rdvFormActive = false;
    let rdvFormStep = 0;
    let rdvFormData = { nom: '', prenom: '', email: '', numero: '' };
    let rdvDateConfirmed = false;
    let rdvTimeConfirmed = false;

    function resetRdvForm() {
        rdvFormActive = false;
        rdvFormStep = 0;
        rdvFormData = { nom: '', prenom: '', email: '', numero: '' };
        rdvDateConfirmed = false;
        rdvTimeConfirmed = false;
    }

    function startRdvForm() {
        rdvFormActive = true;
        rdvFormStep = 1;
        appendMessage("Pour prendre rendez-vous, quel est votre <b>nom</b> ?", 'bot');
    }

    // No import for flatpickr, use global from CDN
    function showDatePicker() {
        let dateInput = document.getElementById('rdv-date-input');
        if (!dateInput) {
            dateInput = document.createElement('input');
            dateInput.id = 'rdv-date-input';
            dateInput.className = 'user-input';
            dateInput.placeholder = 'Choisissez une date...';
            document.querySelector('.chat-input-container').prepend(dateInput);
        }
        dateInput.style.display = 'block';
        userInput.style.display = 'none';
        flatpickr(dateInput, {
            locale: 'fr',
            minDate: "today",
            dateFormat: "Y-m-d",
            disable: [
                function(date) { return (date.getDay() === 0 || date.getDay() === 6); }
            ],
            onClose: function(selectedDates, dateStr) {
                if (dateStr) {
                    rdvFormData.date = dateStr;
                    dateInput.style.display = 'none';
                    userInput.style.display = 'block';
                    rdvFormStep = 5.5;
                    appendMessage(`Vous avez choisi le <b>${dateStr}</b>. Voulez-vous confirmer cette date ? (Oui / Non)`, 'bot');
                }
            }
        });
    }

    function showTimePicker() {
        let timeInput = document.getElementById('rdv-time-input');
        if (!timeInput) {
            timeInput = document.createElement('input');
            timeInput.id = 'rdv-time-input';
            timeInput.className = 'user-input';
            timeInput.placeholder = 'Choisissez une heure...';
            document.querySelector('.chat-input-container').prepend(timeInput);
        }
        timeInput.style.display = 'block';
        userInput.style.display = 'none';
        flatpickr(timeInput, {
            locale: 'fr',
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            minTime: "09:00",
            maxTime: "18:00",
            minuteIncrement: 30,
            onClose: function(selectedDates, timeStr) {
                if (timeStr) {
                    rdvFormData.heure = timeStr;
                    timeInput.style.display = 'none';
                    userInput.style.display = 'block';
                    rdvFormStep = 6.5;
                    appendMessage(`Vous avez choisi <b>${timeStr}</b>. Voulez-vous confirmer cette heure ? (Oui / Non)`, 'bot');
                }
            }
        });
    }

    function handleRdvFormInput(text) {
        const lowerText = text.trim().toLowerCase();
        if (rdvFormStep === 1) {
            rdvFormData.nom = text;
            rdvFormStep = 2;
            appendMessage("Merci. Quel est votre <b>prénom</b> ?", 'bot');
        } else if (rdvFormStep === 2) {
            rdvFormData.prenom = text;
            rdvFormStep = 3;
            appendMessage("Merci. Quel est votre <b>email</b> ?", 'bot');
        } else if (rdvFormStep === 3) {
            rdvFormData.email = text;
            rdvFormStep = 4;
            appendMessage("Merci. Quel est votre <b>numéro de téléphone</b> ?", 'bot');
        } else if (rdvFormStep === 4) {
            rdvFormData.numero = text;
            rdvFormStep = 5;
            appendMessage("Merci ! Pour finir, choisissez une <b>date</b> pour votre rendez-vous :", 'bot');
            showDatePicker();
        } else if (rdvFormStep === 5.5) {
            if (lowerText === 'oui') {
                rdvDateConfirmed = true;
                rdvFormStep = 6;
                appendMessage("À quelle <b>heure</b> souhaitez-vous votre rendez-vous ?", 'bot');
                showTimePicker();
            } else if (lowerText === 'non') {
                rdvDateConfirmed = false;
                rdvFormStep = 5;
                appendMessage("Veuillez choisir une nouvelle <b>date</b> :", 'bot');
                showDatePicker();
            } else {
                appendMessage("Merci de répondre par 'Oui' ou 'Non' pour confirmer la date.", 'bot');
            }
        } else if (rdvFormStep === 6.5) {
            if (lowerText === 'oui') {
                rdvTimeConfirmed = true;
                rdvFormStep = 7;
                appendMessage("Merci ! Nous envoyons votre demande de rendez-vous...", 'bot');
                // Send to backend
                fetch('https://umod-chat-bot-backend.onrender.com/book-appointment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(rdvFormData)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        appendMessage("Votre rendez-vous a bien été enregistré dans notre agenda. Vous serez contacté prochainement ! 😊", 'bot');
                    } else {
                        appendMessage("Une erreur est survenue lors de la réservation. Veuillez réessayer plus tard.", 'bot');
                    }
                    resetRdvForm();
                })
                .catch(() => {
                    appendMessage("Une erreur est survenue lors de la réservation. Veuillez réessayer plus tard.", 'bot');
                    resetRdvForm();
                });
            } else if (lowerText === 'non') {
                rdvTimeConfirmed = false;
                rdvFormStep = 6;
                appendMessage("Veuillez choisir une nouvelle <b>heure</b> :", 'bot');
                showTimePicker();
            } else {
                appendMessage("Merci de répondre par 'Oui' ou 'Non' pour confirmer l'heure.", 'bot');
            }
        }
    }

    // Add event delegation for Prendre RDV button
    chatMessages.addEventListener('click', function(e) {
        if (e.target.classList.contains('rdv-button')) {
            if (!rdvFormActive) {
                startRdvForm();
            }
        }
    });

    // Update handleSend to support RDV form flow
    function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;
        appendMessage(text, 'user');
        userInput.value = '';
        if (rdvFormActive) {
            handleRdvFormInput(text);
            return;
        }
        showTypingIndicator();
        fetch('https://umod-chat-bot-backend.onrender.com/chat', {
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
    // Draggable logic for the chatbot container
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let initialPosition = { right: 20, bottom: 20 };

    function setInitialPosition() {
        chatbotContainer.style.right = initialPosition.right + 'px';
        chatbotContainer.style.bottom = initialPosition.bottom + 'px';
        chatbotContainer.style.left = '';
        chatbotContainer.style.top = '';
    }

    setInitialPosition();

    chatbotContainer.addEventListener('mousedown', function (e) {
        // Only start drag if not clicking on input or button
        if (e.target.closest('.chat-input-container') || e.target.closest('button') || e.target.closest('input')) return;
        isDragging = true;
        // Get mouse position relative to the container
        const rect = chatbotContainer.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        chatbotContainer.style.transition = 'none';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        // Move the container
        let left = e.clientX - dragOffsetX;
        let top = e.clientY - dragOffsetY;
        chatbotContainer.style.left = left + 'px';
        chatbotContainer.style.top = top + 'px';
        chatbotContainer.style.right = '';
        chatbotContainer.style.bottom = '';
    });

    document.addEventListener('mouseup', function () {
        if (isDragging) {
            isDragging = false;
            chatbotContainer.style.transition = '';
            document.body.style.userSelect = '';
        }
    });

    // When closing, reset position
    closeButton.addEventListener('click', function (e) {
        e.stopPropagation();
        chatbotContainer.classList.add('closing');
        chatbotContainer.classList.remove('open');
        setTimeout(() => {
            chatbotContainer.style.display = 'none';
            chatbotContainer.classList.remove('closing');
            bubble.style.display = 'flex';
            setInitialPosition(); // Reset position on close
        }, 350);
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