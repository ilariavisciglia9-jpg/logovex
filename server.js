// server.js - Backend LogoVex con DALL-E 3 - FIXED VERSION
// Genera IMMAGINI VERE di loghi!

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = process.env.OPENAI_API_KEY;
console.log('🔑 OPENAI_API_KEY:', apiKey ? 'PRESENTE' : 'ASSENTE');
if (apiKey) {
    console.log('🔑 Primi 15 caratteri:', apiKey.substring(0, 15));
    console.log('🔑 Ultimi 10 caratteri:', apiKey.slice(-10));
}

const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
});
// Trust proxy per Railway
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Troppe richieste, riprova tra qualche minuto'
});

app.use('/api/', limiter);

// =====================================================
// ENDPOINT: Genera Logo con DALL-E 3
// =====================================================
app.post('/api/generate-logo', async (req, res) => {
    try {
        const { brandName, industry, style, colors, description } = req.body;
        
        // Validazione
        if (!brandName || !industry || !style) {
            return res.status(400).json({ error: 'Campi obbligatori mancanti' });
        }
        
        console.log(`ðŸŽ¨ Generazione logo per: ${brandName} (${style})`);
        
        // FASE 1: Genera concept con GPT-4
        const concept = await generateLogoConcept(brandName, industry, style, colors, description);
        console.log('âœ… Concept generato');
        
        // FASE 2: Genera immagine con DALL-E 3
        const imageUrl = await generateLogoImage(concept, brandName, style);
        console.log('âœ… Immagine generata:', imageUrl);
        
        // Risposta completa
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
        console.error('âŒ Errore generazione:', error.message);
        
        const fallback = createFallbackLogo(
            req.body.brandName, 
            req.body.style, 
            req.body.industry
        );
        
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
            { 
                role: "system", 
                content: "Sei un esperto designer di loghi. Rispondi SOLO con JSON valido, senza markdown backticks." 
            },
            { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
    });
    
    const text = completion.choices[0].message.content.trim();
    
    // Rimuovi markdown backticks se presenti
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
        const parsed = JSON.parse(cleanText);
        return parsed;
    } catch (parseError) {
        console.error('âŒ Errore parsing JSON concept:', parseError);
        console.error('Testo ricevuto:', text);
        
        // Fallback se parsing fallisce
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
    
    // FIX: Rimuovi caratteri speciali che causano errori JSON
    const safeBrandName = String(brandName || '').replace(/["'\n\r\t\\]/g, '');
    const safeVisualDesc = String(concept.visualDescription || concept.description || '')
        .replace(/["'\n\r\t\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 200); // Limita lunghezza
    const safeColors = Array.isArray(concept.colors) 
        ? concept.colors.join(', ') 
        : '#3B82F6, #1E293B';
    
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
        minimal: 7,      // Stile più semplice
        modern: 9,
        playful: 9,
        geometric: 10,
        bold: 12,
        vintage: 13,     // Più elaborato
        elegant: 15      // Stile più complesso
    };
    
    const basePrice = PRICING_BASE[style] || 9;
    const complexityBonus = nameLength > 15 ? 2 : 0;
    return basePrice + complexityBonus;
}

function generateId() {
    return 'logo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createFallbackLogo(brandName, style, industry) {
    const symbols = ['â—†', 'â—ˆ', 'â—‰', 'â¬Ÿ', 'â¬¢', 'â¬£', 'â–²', 'â—¼', 'â—'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
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
        logoText: `${symbol} ${brandName}`,
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
                    description: `Stile: ${item.style} | Settore: ${item.industry}`,
                    images: item.imageUrl ? [item.imageUrl] : []
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: 1,
        }));
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/#cart`,
        });
        
        res.json({ sessionId: session.id, url: session.url });
        
    } catch (error) {
        console.error('Errore checkout:', error);
        res.status(500).json({ error: 'Errore checkout' });
    }
});

// =====================================================
// HEALTH CHECK
// =====================================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        apis: {
            openai: !!process.env.OPENAI_API_KEY,
            dalle: !!process.env.OPENAI_API_KEY,
            stripe: !!process.env.STRIPE_SECRET_KEY
        }
    });
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
    console.log(`
    â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
    â•‘     ðŸŽ¨ LogoVex con DALL-E 3           â•‘
    â•‘                                       â•‘
    â•‘  Port: ${PORT}                          â•‘
    â•‘  Environment: ${process.env.NODE_ENV || 'development'}           â•‘
    â•‘                                       â•‘
    â•‘  APIs Configured:                     â•‘
    â•‘  ${process.env.OPENAI_API_KEY ? 'âœ…' : 'âŒ'} OpenAI GPT-4                     â•‘
    â•‘  ${process.env.OPENAI_API_KEY ? 'âœ…' : 'âŒ'} DALL-E 3 (Image Generation)    â•‘
    â•‘  ${process.env.STRIPE_SECRET_KEY ? 'âœ…' : 'âŒ'} Stripe                          â•‘
    â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
    ðŸŽ¨ Genera loghi VERI con immagini!
    ðŸ“¸ DALL-E 3 crea immagini uniche e originali
    ðŸ’° Costo: ~â‚¬0.04 per logo
    `);
});

module.exports = app;
