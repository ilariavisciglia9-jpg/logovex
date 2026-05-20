// LogoVex - Script principale con integrazione backend
// Genera VERI loghi con DALL-E 3!

// =====================================================
// CONFIGURAZIONE API BACKEND
// =====================================================
const API_BASE_URL = 'https://logovex.com';

// =====================================================
// STATE MANAGEMENT
// In-memory per imageUrl (base64 troppo grande per localStorage)
// =====================================================
const state = {
    cart: [],
    generatedLogos: [],
    currentView: 'home'
};

// Carica carrello dal localStorage (solo metadati, senza imageUrl)
(function initCart() {
    try {
        const saved = localStorage.getItem('logoCart');
        if (saved) state.cart = JSON.parse(saved);
    } catch(e) {
        state.cart = [];
    }
})();

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
        // Cerca imageUrl in memoria (potrebbe non esserci se sessione precedente)
        const inMemory = state.generatedLogos.find(l => l.id === logo.id);
        const imageUrl = inMemory ? inMemory.imageUrl : null;

        let imageHTML = '';
        if (imageUrl) {
            imageHTML = `<img src="${imageUrl}" alt="Logo ${logo.brandName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">`;
        } else {
            imageHTML = `
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${logo.colors[0]}, ${logo.colors[1] || logo.colors[0]}); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; text-align: center; padding: 4px;">
                    ${logo.logoText || logo.brandName}
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
    updateCartBadge();
}

// =====================================================
// LOGO GENERATOR
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
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generazione in corso...';
        generateBtn.disabled = true;

        console.log('🎨 Invio richiesta al backend...');
        console.log('📍 URL:', window.location.origin + '/api/generate-logo');
        console.log('📦 Dati:', { brandName, industry, style, colors, description });

        const response = await fetch(API_BASE_URL + '/api/generate-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandName, industry, style, colors, description })
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', {
            contentType: response.headers.get('content-type'),
            status: response.status,
            statusText: response.statusText
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Contenuto ricevuto:', text.substring(0, 500));
            throw new Error('Il server non risponde correttamente. Controlla Railway.');
        }

        let logoData;
        try {
            const responseText = await response.text();
            console.log('📥 Risposta JSON:', responseText.substring(0, 300) + '...');
            logoData = JSON.parse(responseText);
        } catch (jsonError) {
            throw new Error('Il server ha restituito una risposta non valida');
        }

        if (!response.ok) throw new Error(logoData.error || 'Errore nella generazione');
        if (!logoData.id || !logoData.brandName) throw new Error('Risposta dal server non valida');

        console.log('✅ Logo ricevuto:', logoData.id, '- imageUrl:', logoData.imageUrl ? 'presente' : 'assente');

        // Aggiunge in memoria (con imageUrl base64)
        state.generatedLogos.unshift(logoData);

        displayGeneratedLogo(logoData);
        showNotification('Logo generato con successo!', 'success');
        document.getElementById('generator-form').reset();

    } catch (error) {
        console.error('❌ Errore completo:', error);
        console.error('Stack trace:', error.stack);
        let errorMessage = 'Errore: ' + error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMessage = '⚠️ Impossibile raggiungere il server. Riprova tra qualche secondo.';
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
        showNotification('Errore visualizzazione logo', 'error');
        return;
    }

    let imageHTML = '';
    if (logo.imageUrl) {
        imageHTML = `
            <div class="logo-image-container">
                <img src="${logo.imageUrl}" alt="Logo ${logo.brandName}" class="generated-logo-image" style="max-width: 100%; border-radius: 8px;">
            </div>
        `;
    } else {
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

    previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    renderGallery();
    // NON salviamo in localStorage: imageUrl base64 è troppo grande
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
    if (state.cart.some(item => item.id === logoId)) {
        showNotification('Logo già nel carrello', 'warning');
        return;
    }

    // Salva nel carrello solo i metadati (NO imageUrl — base64 troppo grande)
    state.cart.push({
        id: logo.id,
        brandName: logo.brandName,
        logoText: logo.logoText,
        tagline: logo.tagline,
        colors: logo.colors,
        description: logo.description,
        style: logo.style,
        industry: logo.industry,
        price: logo.price,
        timestamp: logo.timestamp
        // imageUrl NON incluso qui: resta solo in state.generatedLogos (in-memory)
    });

    saveCart();
    updateCartBadge();
    showNotification('Logo aggiunto al carrello!', 'success');
}

function removeFromCart(logoId) {
    state.cart = state.cart.filter(item => item.id !== logoId);
    saveCart();
    updateCartBadge();
    renderCartModal();
    showNotification('Logo rimosso dal carrello', 'info');
}

function saveCart() {
    try {
        // Il carrello contiene solo metadati (senza imageUrl), quindi è piccolo
        localStorage.setItem('logoCart', JSON.stringify(state.cart));
    } catch(e) {
        console.error('Errore salvataggio carrello:', e);
    }
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
        const inMemory = state.generatedLogos.find(l => l.id === logo.id);
        const imageUrl = inMemory ? inMemory.imageUrl : null;

        let imageHTML = '';
        if (imageUrl) {
            imageHTML = `<img src="${imageUrl}" alt="Logo ${logo.brandName}" class="cart-item-image">`;
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
// Il server riceve imageUrl (base64) e la usa per:
// 1. Salvarla in pendingOrders (memoria RAM Railway)
// 2. Mandarla via email al cliente dopo il pagamento
// 3. Renderla disponibile sulla pagina success per download
// =====================================================
async function checkout() {
    if (state.cart.length === 0) {
        alert('Il carrello è vuoto!');
        return;
    }

    // Costruisce gli items con imageUrl preso da state.generatedLogos (in-memory)
    const itemsWithImages = state.cart.map(item => {
        const inMemory = state.generatedLogos.find(l => l.id === item.id);
        return {
            ...item,
            imageUrl: inMemory ? inMemory.imageUrl : null
        };
    });

    try {
        const btn = document.getElementById('modalCheckoutBtn');
        if (btn) {
            btn.innerHTML = '⏳ Reindirizzamento...';
            btn.disabled = true;
        }

        console.log('🛒 Checkout con', itemsWithImages.length, 'item(s)');
        console.log('🖼️ Items con immagini:', itemsWithImages.filter(i => i.imageUrl).length);

        const response = await fetch(API_BASE_URL + '/api/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsWithImages })
        });

        const data = await response.json();
        console.log('📡 Risposta server:', data.url ? 'URL Stripe OK' : data);

        if (!response.ok) throw new Error(data.error || 'Errore server');

        if (data.url) {
            // Pulisce il carrello dopo il redirect
            state.cart = [];
            saveCart();
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
    if (!galleryGrid) return;

    let filteredLogos = state.generatedLogos;

    if (searchQuery) {
        filteredLogos = filteredLogos.filter(logo =>
            logo.brandName.toLowerCase().includes(searchQuery) ||
            logo.description.toLowerCase().includes(searchQuery)
        );
    }
    if (category) filteredLogos = filteredLogos.filter(logo => logo.industry === category);
    if (style) filteredLogos = filteredLogos.filter(logo => logo.style === style);

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
            const logoDesigns = {
                minimal: `<svg viewBox="0 0 200 200" style="width:100%;height:100%;"><rect width="200" height="200" fill="${logo.colors[0]}"/><text x="100" y="110" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="${logo.colors[1]||'#fff'}">${logo.brandName.substring(0,12)}</text></svg>`,
                modern: `<svg viewBox="0 0 200 200" style="width:100%;height:100%;"><defs><linearGradient id="g_${logo.id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${logo.colors[0]}"/><stop offset="100%" style="stop-color:${logo.colors[1]||logo.colors[0]}"/></linearGradient></defs><rect width="200" height="200" fill="url(#g_${logo.id})"/><text x="100" y="110" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${logo.brandName.substring(0,12)}</text></svg>`,
                vintage: `<svg viewBox="0 0 200 200" style="width:100%;height:100%;"><rect width="200" height="200" fill="${logo.colors[0]}"/><circle cx="100" cy="100" r="70" fill="none" stroke="${logo.colors[1]||'#fff'}" stroke-width="3"/><text x="100" y="108" font-family="serif" font-size="14" text-anchor="middle" fill="${logo.colors[1]||'#fff'}">${logo.brandName.substring(0,12)}</text></svg>`,
                playful: `<svg viewBox="0 0 200 200" style="width:100%;height:100%;"><rect width="200" height="200" fill="${logo.colors[0]}"/><circle cx="100" cy="90" r="40" fill="${logo.colors[1]||'#FFD700'}"/><text x="100" y="160" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${logo.brandName.substring(0,12)}</text></svg>`,
                elegant: `<svg viewBox="0 0 200 200" style="width:100%;height:100%;"><rect width="200" height="200" fill="${logo.colors[0]}"/><path d="M100 40 L140 100 L100 160 L60 100 Z" fill="none" stroke="${logo.colors[1]||'#D4AF37'}" stroke-width="2"/><text x="100" y="108" font-family="serif" font-size="12" letter-spacing="3" text-anchor="middle" fill="${logo.colors[1]||'#D4AF37'}">${logo.brandName.substring(0,10).toUpperCase()}</text></svg>`,
                bold: `<svg viewBox="0 0 200 200" style="width:100%;height:100%;"><rect width="200" height="200" fill="${logo.colors[0]}"/><rect x="50" y="50" width="100" height="100" fill="${logo.colors[1]||'#fff'}" transform="rotate(45 100 100)"/><text x="100" y="108" font-family="Arial" font-size="16" font-weight="900" text-anchor="middle" fill="${logo.colors[0]}">${logo.brandName.substring(0,10).toUpperCase()}</text></svg>`,
                geometric: `<svg viewBox="0 0 200 200" style="width:100%;height:100%;"><rect width="200" height="200" fill="${logo.colors[0]}"/><polygon points="100,50 150,100 100,150 50,100" fill="none" stroke="${logo.colors[1]||'#fff'}" stroke-width="3"/><text x="100" y="108" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" fill="${logo.colors[1]||'#fff'}">${logo.brandName.substring(0,12)}</text></svg>`
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
    if (logo) displayGeneratedLogo(logo);
}

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    const generatorForm = document.getElementById('generator-form');
    if (generatorForm) generatorForm.addEventListener('submit', generateLogo);

    renderGallery();
    updateCartBadge();

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            if (filter === 'all') {
                renderGallery();
            } else {
                const industries = ['tech', 'fashion', 'food', 'health', 'finance', 'education', 'creative', 'sport'];
                if (industries.includes(filter)) {
                    renderGallery('', filter);
                } else {
                    renderGallery('', '', filter);
                }
            }
        });
    });

    renderGallery();

    const hash = window.location.hash.slice(1);
    if (hash) showSection(hash);

    console.log('✅ LogoVex initialized');
    console.log('🎨 Ready to generate logos with DALL-E 3!');
});

// =====================================================
// DOWNLOAD LOGO
// Funziona sia con URL che con base64
// =====================================================
function downloadLogo(logoId) {
    const logo = state.generatedLogos.find(l => l.id === logoId);
    if (!logo || !logo.imageUrl) {
        showNotification('Immagine non disponibile per il download', 'info');
        return;
    }

    if (logo.imageUrl.startsWith('data:')) {
        // Base64: download diretto nel browser
        const a = document.createElement('a');
        a.href = logo.imageUrl;
        a.download = `${logo.brandName.replace(/\s+/g, '_')}_logo.png`;
        a.click();
    } else {
        // URL esterno: usa il proxy
        const a = document.createElement('a');
        a.href = `/api/download-logo?url=${encodeURIComponent(logo.imageUrl)}&name=${encodeURIComponent(logo.brandName)}`;
        a.download = `${logo.brandName.replace(/\s+/g, '_')}_logo.png`;
        a.click();
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    nav.classList.toggle('mobile-active');
}
