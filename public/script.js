// LogoVex - Script principale con integrazione backend
// Genera VERI loghi con DALL-E 3!

// =====================================================
// CONFIGURAZIONE API BACKEND
// =====================================================
const API_BASE_URL = 'https://logovex.com';

// =====================================================
// CART MODAL FUNCTIONS
// =====================================================
function openCartModal() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'flex';
    renderCartModal();
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'none';
}

function renderCartModal() {
    const cartModalContent = document.getElementById('cartModalContent');
    const cartModalSummary = document.getElementById('cartModalSummary');
    
    if (state.cart.length === 0) {
        cartModalContent.innerHTML = `
            <div class="cart-empty" style="text-align: center; padding: 40px;">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style="margin: 0 auto 20px;">
                    <circle cx="30" cy="30" r="25" stroke="currentColor" stroke-width="2"/>
                    <path d="M20 35L30 25L40 35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p style="color: #666; margin-bottom: 20px;">Il tuo carrello è vuoto</p>
                <a href="#generator" class="btn btn-primary" onclick="closeCartModal()" style="display: inline-block; padding: 12px 24px; background: #d4af37; color: #1a1a2e; text-decoration: none; border-radius: 4px;">Genera un Logo</a>
            </div>
        `;
        cartModalSummary.style.display = 'none';
        return;
    }
    
    cartModalContent.innerHTML = state.cart.map(logo => {
        let imageHTML = '';
        
        if (logo.imageUrl) {
            imageHTML = `<img src="${logo.imageUrl}" alt="Logo ${logo.brandName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">`;
        } else {
            imageHTML = `
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${logo.colors[0]}, ${logo.colors[1] || logo.colors[0]}); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${logo.logoText}
                </div>
            `;
        }
        
        return `
            <div style="display: flex; gap: 20px; padding: 20px; border-bottom: 1px solid #eee; align-items: center;">
                ${imageHTML}
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0;">${logo.brandName}</h4>
                    <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">${logo.tagline}</p>
                    <div style="display: flex; gap: 10px;">
                        <span style="background: #f0f0f0; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${logo.style}</span>
                        <span style="background: #f0f0f0; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${logo.industry}</span>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: #d4af37; margin-bottom: 10px;">€${logo.price.toFixed(2)}</div>
                    <button onclick="removeFromCart('${logo.id}')" style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">🗑️ Rimuovi</button>
                </div>
            </div>
        `;
    }).join('');
    
    updateCartModalSummary();
    cartModalSummary.style.display = 'block';
}

function updateCartModalSummary() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
    const vat = subtotal * 0.22;
    const total = subtotal + vat;
    
    document.getElementById('modalSubtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('modalTax').textContent = `€${vat.toFixed(2)}`;
    document.getElementById('modalTotal').textContent = `€${total.toFixed(2)}`;
}

// =====================================================
// STATE MANAGEMENT
// =====================================================
const state = {
    cart: JSON.parse(localStorage.getItem('logoCart')) || [],
    generatedLogos: [],
    currentView: 'home'
};

// =====================================================
// NAVIGATION
// =====================================================
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        state.currentView = sectionId;
    }
    
    // Update cart badge
    updateCartBadge();
}

// =====================================================
// LOGO GENERATOR - CHIAMATA AL BACKEND (VERSIONE CORRETTA)
// =====================================================
async function generateLogo(event) {
    event.preventDefault();
    
    const brandName = document.getElementById('brandName').value.trim();
    const industry = document.getElementById('industry').value;
    const style = document.getElementById('style').value;
    const colors = document.getElementById('colors').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (!brandName) {
        showNotification('Inserisci il nome del brand', 'error');
        return;
    }
    
    const generateBtn = document.querySelector('#generator-form button[type="submit"]');
    const originalText = generateBtn.innerHTML;
    
    try {
        // Show loading
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generazione in corso...';
        generateBtn.disabled = true;
        
        console.log('🎨 Invio richiesta al backend...');
        console.log('📍 URL:', window.location.origin + '/api/generate-logo');
        console.log('📦 Dati:', { brandName, industry, style, colors, description });
        
        // CHIAMATA AL BACKEND
        const response = await fetch(API_BASE_URL + '/api/generate-logo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                brandName,
                industry,
                style,
                colors,
                description
            })
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', {
            contentType: response.headers.get('content-type'),
            status: response.status,
            statusText: response.statusText
        });
        
        // CONTROLLO TIPO DI RISPOSTA
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ Il server ha restituito HTML invece di JSON!');
            console.error('Content-Type ricevuto:', contentType);
            
            // Leggi il contenuto per vedere cosa è stato restituito
            const text = await response.text();
            console.error('Contenuto ricevuto (primi 500 caratteri):', text.substring(0, 500));
            
            throw new Error(
                '⚠️ IL SERVER NON È IN ESECUZIONE O NON RISPONDE CORRETTAMENTE!\n\n' +
                'Assicurati che:\n' +
                '1. Il server Node.js sia avviato (npm start)\n' +
                '2. Il file .env contenga OPENAI_API_KEY\n' +
                '3. Non ci siano errori nel terminale del server\n\n' +
                'Controlla il terminale per vedere i log del server.'
            );
        }
        
        // PARSING JSON
        let logoData;
        try {
            const responseText = await response.text();
            console.log('📥 Risposta JSON:', responseText);
            logoData = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('❌ Errore parsing JSON:', jsonError);
            throw new Error('Il server ha restituito una risposta non valida');
        }
        
        // CONTROLLO ERRORI NELLA RISPOSTA
        if (!response.ok) {
            throw new Error(logoData.error || 'Errore nella generazione');
        }
        
        console.log('✅ Logo ricevuto:', logoData);
        
        // Verifica che logoData contenga i campi necessari
        if (!logoData.id || !logoData.brandName) {
            console.error('❌ Risposta malformata:', logoData);
            throw new Error('Risposta dal server non valida');
        }
        
        // Add to generated logos
        state.generatedLogos.unshift(logoData);
        
        // Display result
        displayGeneratedLogo(logoData);
        
        // Show success notification
        showNotification('Logo generato con successo!', 'success');
        
        // Reset form
        document.getElementById('generator-form').reset();
        
    } catch (error) {
        console.error('❌ Errore completo:', error);
        console.error('Stack trace:', error.stack);
        
        // Messaggio più dettagliato all'utente
        let errorMessage = 'Errore nella generazione del logo';
        
        if (error.message.includes('SERVER NON È IN ESECUZIONE')) {
            errorMessage = error.message;
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '⚠️ IMPOSSIBILE RAGGIUNGERE IL SERVER!\n\n' +
                          'Il server Node.js non è in esecuzione.\n' +
                          'Apri il terminale e avvia il server con: npm start';
        } else {
            errorMessage = 'Errore: ' + error.message;
        }
        
        showNotification(errorMessage, 'error');
        
    } finally {
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// =====================================================
// DISPLAY GENERATED LOGO
// =====================================================
function displayGeneratedLogo(logo) {
    const previewContainer = document.getElementById('previewContainer');
    
    if (!previewContainer) {
        console.error('Preview container non trovato!');
        showNotification('Errore visualizzazione logo', 'error');
        return;
    }
    
    let imageHTML = '';
    
    if (logo.imageUrl) {
        // Logo con immagine DALL-E 3
        imageHTML = `
            <div class="logo-image-container">
                <img src="${logo.imageUrl}" alt="Logo ${logo.brandName}" class="generated-logo-image" style="max-width: 100%; border-radius: 8px;">
            </div>
        `;
    } else {
        // Fallback testuale
        imageHTML = `
            <div class="logo-preview-symbol" style="background: linear-gradient(135deg, ${logo.colors[0]}, ${logo.colors[1] || logo.colors[0]}); padding: 40px; border-radius: 8px; text-align: center;">
                <div class="logo-text" style="font-size: 32px; color: white; font-weight: bold;">${logo.logoText}</div>
            </div>
        `;
    }
    
    previewContainer.innerHTML = `
        <div class="logo-card large" style="text-align: center;">
            ${imageHTML}
            
            <div class="logo-details" style="margin-top: 20px;">
                <h3 style="font-size: 24px; margin-bottom: 10px;">${logo.brandName}</h3>
                <p class="logo-tagline" style="color: #666; margin-bottom: 15px;">${logo.tagline}</p>
                
                <div class="logo-colors" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
                    ${logo.colors.map(color => `
                        <span class="color-swatch" style="width: 30px; height: 30px; background: ${color}; border-radius: 4px; border: 2px solid #ddd;"></span>
                    `).join('')}
                </div>
                
                <p class="logo-description" style="color: #666; margin-bottom: 20px;">${logo.description}</p>
                
                <div class="logo-meta" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
                    <span class="badge" style="background: #f0f0f0; padding: 5px 15px; border-radius: 20px;">${logo.style}</span>
                    <span class="badge" style="background: #f0f0f0; padding: 5px 15px; border-radius: 20px;">${logo.industry}</span>
                </div>
                
                <div class="logo-actions" style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                    <span class="price" style="font-size: 28px; font-weight: bold; color: #d4af37;">€${logo.price.toFixed(2)}</span>
                    <button class="btn btn-primary" onclick="addToCart('${logo.id}')" style="padding: 12px 30px; background: #d4af37; color: #1a1a2e; border: none; border-radius: 4px; cursor: pointer;">
                        🛒 Aggiungi al Carrello
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Smooth scroll
    previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Aggiorna la galleria
    renderGallery();
    localStorage.setItem('generatedLogos', JSON.stringify(state.generatedLogos));
}

// =====================================================
// CART MANAGEMENT
// =====================================================
function addToCart(logoId) {
    const logo = state.generatedLogos.find(l => l.id === logoId);
    
    if (!logo) {
        showNotification('Logo non trovato', 'error');
        return;
    }
    
    // Check if already in cart
    if (state.cart.some(item => item.id === logoId)) {
        showNotification('Logo già nel carrello', 'warning');
        return;
    }
    
    state.cart.push(logo);
    saveCart();
    updateCartBadge();
    showNotification('Logo aggiunto al carrello!', 'success');
}

function removeFromCart(logoId) {
    state.cart = state.cart.filter(item => item.id !== logoId);
    saveCart();
    updateCartBadge();
    renderCartModal(); // Aggiorna il modal
    showNotification('Logo rimosso dal carrello', 'info');
}

function saveCart() {
    localStorage.setItem('logoCart', JSON.stringify(state.cart));
}

function updateCartBadge() {
    const badge = document.querySelector('.cart-count');
    if (badge) {
        badge.textContent = state.cart.length;
        badge.style.display = state.cart.length > 0 ? 'inline-block' : 'none';
    }
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const emptyMessage = document.getElementById('cart-empty');
    const cartSummary = document.getElementById('cart-summary');
    
    if (state.cart.length === 0) {
        emptyMessage.style.display = 'block';
        cartSummary.style.display = 'none';
        cartContainer.innerHTML = '';
        return;
    }
    
    emptyMessage.style.display = 'none';
    cartSummary.style.display = 'block';
    
    cartContainer.innerHTML = state.cart.map(logo => {
        let imageHTML = '';
        
        if (logo.imageUrl) {
            imageHTML = `<img src="${logo.imageUrl}" alt="Logo ${logo.brandName}" class="cart-item-image">`;
        } else {
            imageHTML = `
                <div class="cart-item-preview" style="background: linear-gradient(135deg, ${logo.colors[0]}, ${logo.colors[1] || logo.colors[0]})">
                    <span>${logo.logoText}</span>
                </div>
            `;
        }
        
        return `
            <div class="cart-item">
                ${imageHTML}
                <div class="cart-item-details">
                    <h4>${logo.brandName}</h4>
                    <p>${logo.tagline}</p>
                    <div class="cart-item-meta">
                        <span class="badge">${logo.style}</span>
                        <span class="badge">${logo.industry}</span>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <span class="price">€${logo.price.toFixed(2)}</span>
                    <button class="btn-remove" onclick="removeFromCart('${logo.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    updateCartSummary();
}

function updateCartSummary() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
    const vat = subtotal * 0.22;
    const total = subtotal + vat;
    
    document.getElementById('subtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('vat').textContent = `€${vat.toFixed(2)}`;
    document.getElementById('total').textContent = `€${total.toFixed(2)}`;
}

function clearCart() {
    if (confirm('Vuoi svuotare il carrello?')) {
        state.cart = [];
        saveCart();
        renderCart();
        updateCartBadge();
        showNotification('Carrello svuotato', 'info');
    }
}

// =====================================================
// CHECKOUT
// =====================================================
async function checkout() {
    const cart = JSON.parse(localStorage.getItem('logoCart') || '[]');
    
    if (cart.length === 0) {
        alert('Il carrello è vuoto!');
        return;
    }
    
    // ✅ SALVA I LOGHI PRIMA DEL REDIRECT
    localStorage.setItem('pending_logos', JSON.stringify(
        cart.map(item => ({
            brandName: item.brandName,
            imageUrl: item.imageUrl,
            price: item.price
        }))
    ));
    
    try {
        const btn = document.getElementById('modalCheckoutBtn');
        if (btn) {
            btn.innerHTML = '⏳ Reindirizzamento...';
            btn.disabled = true;
        }
        
        console.log('🛒 Checkout con', cart.length, 'item(s)');
        
        const response = await fetch(API_BASE_URL + '/api/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart })
        });
        
        const data = await response.json();
        console.log('📡 Risposta server:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Errore server');
        }
        
        if (data.url) {
            console.log('✅ Reindirizzo a Stripe');
            window.location.href = data.url;
        } else {
            throw new Error('Nessun URL Stripe ricevuto');
        }
        
    } catch (error) {
        console.error('❌ Errore checkout:', error);
        alert('Errore: ' + error.message);
        const btn = document.getElementById('modalCheckoutBtn');
        if (btn) {
            btn.innerHTML = 'Procedi al Pagamento';
            btn.disabled = false;
        }
    }
}
// =====================================================
// NOTIFICATIONS
// =====================================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// =====================================================
// SEARCH & FILTER (Gallery)
// =====================================================
function searchLogos() {
    const query = document.getElementById('search').value.toLowerCase();
    renderGallery(query);
}

function filterByCategory(category) {
    renderGallery('', category);
}

function filterByStyle(style) {
    renderGallery('', '', style);
}

function renderGallery(searchQuery = '', category = '', style = '') {
    const galleryGrid = document.querySelector('.gallery-grid');
    
    let filteredLogos = state.generatedLogos;
    
    if (searchQuery) {
        filteredLogos = filteredLogos.filter(logo => 
            logo.brandName.toLowerCase().includes(searchQuery) ||
            logo.description.toLowerCase().includes(searchQuery)
        );
    }
    
    if (category) {
        filteredLogos = filteredLogos.filter(logo => logo.industry === category);
    }
    
    if (style) {
        filteredLogos = filteredLogos.filter(logo => logo.style === style);
    }
    
    if (filteredLogos.length === 0) {
    galleryGrid.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style="margin: 0 auto 20px; opacity: 0.3;">
                <circle cx="40" cy="40" r="30" stroke="currentColor" stroke-width="2"/>
                <path d="M30 40h20M40 30v20" stroke="currentColor" stroke-width="2"/>
            </svg>
            <h3 style="color: #666; margin-bottom: 10px;">La galleria è ancora vuota</h3>
            <p style="color: #999; margin-bottom: 20px;">Inizia a generare loghi per popolare la galleria!</p>
            <a href="#generator" style="display: inline-block; padding: 12px 24px; background: #d4af37; color: #1a1a2e; text-decoration: none; border-radius: 4px; font-weight: bold;">
                🎨 Genera il Primo Logo
            </a>
        </div>
    `;
    return;
}
    
    galleryGrid.innerHTML = filteredLogos.map(logo => {
        let imageHTML = '';
        
        if (logo.imageUrl) {
            imageHTML = `<img src="${logo.imageUrl}" alt="Logo ${logo.brandName}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            // Design SVG per ogni stile
const logoDesigns = {
    minimal: `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <defs>
                <clipPath id="circleClip_${logo.id}">
                    <circle cx="100" cy="80" r="30"/>
                </clipPath>
            </defs>
            <rect width="200" height="200" fill="${logo.colors[0]}"/>
            <image href="${logo.logoImage || 'https://via.placeholder.com/60'}" 
                   x="70" y="50" width="60" height="60" 
                   clip-path="url(#circleClip_${logo.id})" />
            <text x="100" y="140" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="${logo.colors[1] || '#ffffff'}">${logo.brandName.substring(0, 12)}</text>
        </svg>
    `,
    
    modern: `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <defs>
                <linearGradient id="grad_${logo.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${logo.colors[0]};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${logo.colors[1] || logo.colors[0]};stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#grad_${logo.id})"/>
            <image href="${logo.logoImage || 'https://via.placeholder.com/60'}" 
                   x="70" y="40" width="60" height="60" />
            <text x="100" y="165" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${logo.brandName.substring(0, 12)}</text>
        </svg>
    `,
    
    vintage: `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <defs>
                <clipPath id="vintageClip_${logo.id}">
                    <circle cx="100" cy="100" r="50"/>
                </clipPath>
            </defs>
            <rect width="200" height="200" fill="${logo.colors[0]}"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="${logo.colors[1] || '#ffffff'}" stroke-width="3"/>
            <circle cx="100" cy="100" r="50" fill="none" stroke="${logo.colors[1] || '#ffffff'}" stroke-width="2"/>
            <image href="${logo.logoImage || 'https://via.placeholder.com/100'}" 
                   x="50" y="50" width="100" height="100" 
                   clip-path="url(#vintageClip_${logo.id})" opacity="0.9"/>
            <text x="100" y="175" font-family="serif" font-size="10" text-anchor="middle" fill="${logo.colors[1] || '#ffffff'}">EST. 2025</text>
        </svg>
    `,
    
    playful: `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <rect width="200" height="200" fill="${logo.colors[0]}"/>
            <image href="${logo.logoImage || 'https://via.placeholder.com/80'}" 
                   x="60" y="50" width="80" height="80" />
            <text x="100" y="175" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="${logo.colors[1] || '#FFD700'}">${logo.brandName.substring(0, 12)}</text>
        </svg>
    `,
    
    elegant: `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <rect width="200" height="200" fill="${logo.colors[0]}"/>
            <path d="M 100 40 L 140 100 L 100 160 L 60 100 Z" fill="none" stroke="${logo.colors[1] || '#D4AF37'}" stroke-width="2"/>
            <image href="${logo.logoImage || 'https://via.placeholder.com/30'}" 
                   x="85" y="85" width="30" height="30" />
            <text x="100" y="185" font-family="serif" font-size="14" font-weight="300" letter-spacing="3" text-anchor="middle" fill="${logo.colors[1] || '#D4AF37'}">${logo.brandName.substring(0, 12).toUpperCase()}</text>
        </svg>
    `,
    
    bold: `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <rect width="200" height="200" fill="${logo.colors[0]}"/>
            <rect x="50" y="50" width="100" height="100" fill="${logo.colors[1] || '#FFFFFF'}" transform="rotate(45 100 100)"/>
            <image href="${logo.logoImage || 'https://via.placeholder.com/60'}" 
                   x="70" y="70" width="60" height="60" />
            <text x="100" y="175" font-family="Arial, sans-serif" font-size="18" font-weight="900" text-anchor="middle" fill="${logo.colors[1] || '#FFFFFF'}">${logo.brandName.substring(0, 10).toUpperCase()}</text>
        </svg>
    `,
    
    geometric: `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <rect width="200" height="200" fill="${logo.colors[0]}"/>
            <polygon points="100,50 150,100 100,150 50,100" fill="none" stroke="${logo.colors[1] || '#FFFFFF'}" stroke-width="3"/>
            <image href="${logo.logoImage || 'https://via.placeholder.com/60'}" 
                   x="70" y="70" width="60" height="60" />
            <text x="100" y="180" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="${logo.colors[1] || '#FFFFFF'}">${logo.brandName.substring(0, 12)}</text>
        </svg>
    `
};
            
            imageHTML = logoDesigns[logo.style] || logoDesigns['minimal'];
        }
        
        return `
            <div class="logo-card" onclick="viewLogoDetails('${logo.id}')" style="cursor: pointer; transition: transform 0.3s;">
                <div style="width: 100%; height: 250px; overflow: hidden; background: #f5f5f5; border-radius: 8px 8px 0 0;">
                    ${imageHTML}
                </div>
                <div class="logo-info" style="padding: 20px; background: white; border-radius: 0 0 8px 8px;">
                    <h3 style="font-size: 20px; margin-bottom: 8px; color: #1a1a2e;">${logo.brandName}</h3>
                    <p style="color: #666; font-size: 14px; margin-bottom: 15px;">${logo.tagline}</p>
                    <div class="logo-meta" style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="badge" style="background: #f0f0f0; padding: 6px 14px; border-radius: 20px; font-size: 12px; color: #666;">${logo.style}</span>
                        <span class="price" style="font-size: 22px; font-weight: bold; color: #d4af37;">€${logo.price.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function viewLogoDetails(logoId) {
    const logo = state.generatedLogos.find(l => l.id === logoId);
    if (logo) {
        displayGeneratedLogo(logo);
    }
}

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Setup form handler
    const generatorForm = document.getElementById('generator-form');
    if (generatorForm) {
        generatorForm.addEventListener('submit', generateLogo);
    }
    // =====================================================
    // GALLERIA - Si popola con i loghi generati dagli utenti
    // =====================================================
    // Carica loghi salvati da sessioni precedenti (se esistono)
    const savedLogos = localStorage.getItem('generatedLogos');
    if (savedLogos) {
        state.generatedLogos = JSON.parse(savedLogos);
    }
    
    // Renderizza la galleria (vuota all'inizio, poi si riempie)
    renderGallery();
    // Update cart badge on load
    updateCartBadge();
    
    // Setup gallery filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            if (filter === 'all') {
                renderGallery();
            } else {
                // Check if it's an industry or style
                const industries = ['tech', 'fashion', 'food', 'health', 'finance', 'education', 'creative', 'sport'];
                if (industries.includes(filter)) {
                    renderGallery('', filter);
                } else {
                    renderGallery('', '', filter);
                }
            }
        });
    });
    
    // Initial gallery render
    renderGallery();
    
    // Check URL hash for deep linking
    const hash = window.location.hash.slice(1);
    if (hash) {
        showSection(hash);
    }
    
    console.log('✅ LogoVex initialized');
    console.log('🎨 Ready to generate logos with DALL-E 3!');
});

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
function downloadLogo(logoId) {
    const logo = state.generatedLogos.find(l => l.id === logoId);
    if (!logo) return;
    
    if (logo.imageUrl) {
        // Download real image
        const a = document.createElement('a');
a.href = `/api/download-logo?url=${encodeURIComponent(logo.imageUrl)}&name=${encodeURIComponent(logo.brandName)}`;
        a.download = `${logo.brandName.replace(/\s+/g, '_')}_logo.png`;
        a.click();
    } else {
        showNotification('Funzione disponibile solo per loghi con immagine', 'info');
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    nav.classList.toggle('mobile-active');
}

