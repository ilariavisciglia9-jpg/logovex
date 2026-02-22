// server.js - Backend LogoVex con DALL-E 3 - FINAL VERSION
// Genera IMMAGINI VERE di loghi!

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Salva temporaneamente i dati degli ordini in memoria
const pendingOrders = {};

const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
});

// Trust proxy per Railway
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
// =====================================================
// REDIRECT www → non-www
// =====================================================
app.use((req, res, next) => {
    if (req.headers.host && req.headers.host.startsWith('www.')) {
        return res.redirect(301, 'https://logovex.com' + req.url);
    }
    next();
});
// ENDPOINT DEBUG
app.get('/debug-stripe-key', (req, res) => {
    const key = process.env.STRIPE_SECRET_KEY;
    res.json({
        keyPrefix: key ? key.substring(0, 20) + '...' : 'NOT FOUND',
        keyLength: key ? key.length : 0,
        environment: process.env.NODE_ENV
    });
});

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Troppe richieste, riprova tra qualche minuto'
});

// =====================================================
// ENDPOINT: Genera Logo con DALL-E 3
// =====================================================
app.post('/api/generate-logo', async (req, res) => {
    try {
        const { brandName, industry, style, colors, description } = req.body;
        
        if (!brandName || !industry || !style) {
            return res.status(400).json({ error: 'Campi obbligatori mancanti' });
        }
        
        console.log(`🎨 Generazione logo per: ${brandName} (${style})`);
        
        const concept = await generateLogoConcept(brandName, industry, style, colors, description);
        console.log('✅ Concept generato');
        
        const imageUrl = await generateLogoImage(concept, brandName, style);
        console.log('✅ Immagine generata:', imageUrl);
        
        const logoData = {
            id: generateId(),
            brandName: brandName,
            logoText: concept.logoText,
            tagline: concept.tagline,
            colors: concept.colors,
            description: concept.description,
            imageUrl: imageUrl,
            style: style,
            industry: industry,
            price: calculatePrice(style, brandName.length),
            timestamp: Date.now()
        };
        
        res.json(logoData);
        
    } catch (error) {
        console.error('❌ Errore generazione:', error.message);
        const fallback = createFallbackLogo(req.body.brandName, req.body.style, req.body.industry);
        res.json(fallback);
    }
});

async function generateLogoConcept(brandName, industry, style, colors, description) {
    const prompt = `Crea un concept per un logo professionale:
- Brand: ${brandName}
- Settore: ${industry}
- Stile: ${style}
- Colori: ${colors || 'scegli tu i migliori'}
- Note: ${description || 'nessuna'}

Rispondi SOLO con JSON (senza markdown, senza backticks):
{
    "logoText": "testo del logo",
    "tagline": "tagline accattivante in inglese",
    "colors": ["#hex1", "#hex2"],
    "description": "descrizione concept in italiano",
    "visualDescription": "descrizione visiva dettagliata per generare immagine"
}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "Sei un esperto designer di loghi. Rispondi SOLO con JSON valido, senza markdown backticks." },
            { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
    });
    
    const text = completion.choices[0].message.content.trim();
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
        return JSON.parse(cleanText);
    } catch (parseError) {
        console.error('❌ Errore parsing JSON concept:', parseError);
        return {
            logoText: brandName,
            tagline: `Excellence in ${industry}`,
            colors: ['#3B82F6', '#1E293B'],
            description: `Un logo ${style} per ${brandName}`,
            visualDescription: `A ${style} logo for ${brandName}, ${industry} company`
        };
    }
}

async function generateLogoImage(concept, brandName, style) {
    const dallePrompt = createDallePrompt(concept, brandName, style);
    console.log('🎨 DALL-E prompt:', dallePrompt);
    
    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: dallePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
    });
    
    return response.data[0].url;
}

function createDallePrompt(concept, brandName, style) {
    const styleDescriptions = {
        minimal: 'minimalist, clean lines, simple shapes, monochromatic',
        modern: 'modern, sleek, geometric, bold',
        vintage: 'vintage, retro, classic, ornate details',
        playful: 'playful, fun, colorful, whimsical',
        elegant: 'elegant, sophisticated, luxury, refined',
        bold: 'bold, strong, impactful, dynamic',
        geometric: 'geometric, abstract, angular, mathematical'
    };
    
    const styleDesc = styleDescriptions[style] || 'professional, clean';
    const safeBrandName = String(brandName || '').replace(/["'\n\r\t\\]/g, '');
    const safeVisualDesc = String(concept.visualDescription || concept.description || '')
        .replace(/["'\n\r\t\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 200);
    const safeColors = Array.isArray(concept.colors) ? concept.colors.join(', ') : '#3B82F6, #1E293B';
    
    return `A professional ${styleDesc} logo symbol or icon for a company called "${safeBrandName}". 
${safeVisualDesc}. 
Create ONLY an abstract symbol, icon, or graphic mark WITHOUT any text or letters. 
No typography, no words, no brand name written.
Just a clean, memorable visual symbol that represents the brand identity.
Colors: ${safeColors}. 
White background, centered composition, vector-style design suitable for professional business use.`;
}

function calculatePrice(style, nameLength) {
    const PRICING_BASE = {
        minimal: 7,
        modern: 9,
        playful: 9,
        geometric: 10,
        bold: 12,
        vintage: 13,
        elegant: 15
    };
    const basePrice = PRICING_BASE[style] || 9;
    const complexityBonus = nameLength > 15 ? 2 : 0;
    return basePrice + complexityBonus;
}

function generateId() {
    return 'logo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createFallbackLogo(brandName, style, industry) {
    const colorPalettes = {
        minimal: ['#000000', '#FFFFFF'],
        modern: ['#3B82F6', '#1E293B'],
        vintage: ['#8B4513', '#F5DEB3'],
        playful: ['#FF6B6B', '#4ECDC4'],
        elegant: ['#1a1a2e', '#d4af37'],
        bold: ['#DC2626', '#000000'],
        geometric: ['#6366F1', '#EC4899']
    };
    const colors = colorPalettes[style] || ['#3B82F6', '#1E293B'];
    
    return {
        id: generateId(),
        brandName: brandName,
        logoText: brandName,
        tagline: `Excellence in ${industry}`,
        colors: colors,
        description: `Un logo ${style} professionale per ${brandName}`,
        imageUrl: null,
        style: style,
        industry: industry,
        price: calculatePrice(style, brandName.length),
        timestamp: Date.now()
    };
}

// =====================================================
// STRIPE CHECKOUT
// =====================================================
app.post('/api/create-checkout', async (req, res) => {
    try {
        console.log('💳 Richiesta checkout ricevuta');
        
        const { items } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrello vuoto' });
        }
        
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({ error: 'Stripe non configurato' });
        }
        
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `Logo ${item.brandName}`,
                    description: `Stile: ${item.style}`,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: 1,
        }));
        
        console.log('📦 Line items:', lineItems.length);

        // ✅ Solo brandName nei metadata (evita limite 500 char di Stripe)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            metadata: {
                items: JSON.stringify(items.map(i => ({ 
                    brandName: i.brandName.substring(0, 50)
                })))
            },
            success_url: `${process.env.CLIENT_URL || 'https://logovex.com'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'https://logovex.com'}/#cart`,
        });

        // ✅ Salva i dati COMPLETI (con imageUrl) in memoria usando session.id come chiave
        pendingOrders[session.id] = items.map(i => ({
            brandName: i.brandName,
            imageUrl: i.imageUrl
        }));
        console.log('💾 Ordine salvato in memoria, session:', session.id);
        
        console.log('✅ Sessione Stripe creata:', session.id);
        res.json({ url: session.url });
        
    } catch (error) {
        console.error('❌ Errore Stripe:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// DOWNLOAD LOGO (proxy per evitare CORS e link scaduti)
// =====================================================
app.get('/api/download-logo', async (req, res) => {
    const { url, name } = req.query;
    if (!url) return res.status(400).json({ error: 'URL mancante' });
    try {
        const fetch = require('node-fetch');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch fallito');
        const buffer = await response.arrayBuffer();
        const safeName = (name || 'logo').replace(/[^a-zA-Z0-9_-]/g, '_');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}_logo.png"`);
        res.setHeader('Content-Type', 'image/png');
        res.send(Buffer.from(buffer));
    } catch (e) {
        console.error('❌ Errore download logo:', e.message);
        res.status(500).json({ error: 'Download fallito: ' + e.message });
    }
});
// =====================================================
// RECUPERA DATI ORDINE PER PAGINA SUCCESS
// =====================================================
app.get('/api/order-details', (req, res) => {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id mancante' });
    
    const items = pendingOrders[session_id] || [];
    res.json({ items });
});

// =====================================================
// STRIPE WEBHOOK → manda email con logo
// =====================================================
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('❌ Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email;
        const sessionId = session.id;

        // ✅ Recupera i dati completi (con imageUrl) dalla memoria
        const items = pendingOrders[sessionId] || [];
        console.log('📦 Ordine recuperato per email:', sessionId, '-', items.length, 'items');

        // Pulisci dalla memoria dopo l'uso
        delete pendingOrders[sessionId];
        
        if (customerEmail && items.length > 0) {
            await sendLogoEmail(customerEmail, items);
        } else {
            console.log('⚠️ Email non inviata - email:', customerEmail, 'items:', items.length);
        }
    }
    
    res.json({ received: true });
});

// =====================================================
// SEND EMAIL CON LOGO
// =====================================================
async function sendLogoEmail(email, items) {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
        host: 'smtps.aruba.it',
        port: 465,
        secure: true,
        auth: {
           user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
        }
    });
    
    const logosHTML = items.map(item => `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="color: #1a1a2e;">${item.brandName}</h3>
            ${item.imageUrl ? `
                <img src="${item.imageUrl}" style="max-width: 300px; border-radius: 8px;" />
                <br><br>
                <a href="${item.imageUrl}" 
                   style="background:#d4af37; color:#1a1a2e; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">
                   Scarica Logo
                </a>
            ` : '<p style="color:#999;">Immagine non disponibile</p>'}
        </div>
    `).join('');
    
    await transporter.sendMail({
        from: `"LogoVex" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'I tuoi loghi LogoVex sono pronti!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #1a1a2e;">Grazie per il tuo acquisto!</h1>
                <p style="color: #666;">I tuoi loghi sono pronti. Scaricali entro 24 ore cliccando il pulsante sotto.</p>
                ${logosHTML}
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                    Problemi? Contatta <a href="mailto:info@logovex.com" style="color: #d4af37;">info@logovex.com</a>
                </p>
            </div>
        `
    });
    
    console.log('✅ Email inviata a:', email);
}

// =====================================================
// HEALTH CHECK
// =====================================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        pendingOrders: Object.keys(pendingOrders).length,
        apis: {
            openai: !!process.env.OPENAI_API_KEY,
            dalle: !!process.env.OPENAI_API_KEY,
            stripe: !!process.env.STRIPE_SECRET_KEY,
            email: !!process.env.EMAIL_USER
        }
    });
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     🎨 LogoVex con DALL-E 3            ║
║                                        ║
║  Port: ${PORT}                             ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║                                        ║
║  APIs Configured:                      ║
║  ${process.env.OPENAI_API_KEY ? '✅' : '❌'} OpenAI GPT-4                      ║
║  ${process.env.OPENAI_API_KEY ? '✅' : '❌'} DALL-E 3 (Image Generation)     ║
║  ${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'} Stripe                           ║
║  ${process.env.EMAIL_USER ? '✅' : '❌'} Email (Nodemailer)              ║
╚════════════════════════════════════════╝
    `);
});

module.exports = app;
