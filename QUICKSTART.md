# 🚀 GUIDA RAPIDA - LogoForge

## Setup Veloce (5 minuti)

### 1️⃣ Modalità Standalone (Solo Frontend)

**Perfetto per: Testing locale, demo, prototipo**

```bash
# 1. Apri la cartella in VS Code
code .

# 2. Installa estensione Live Server in VS Code

# 3. Click destro su index.html → "Open with Live Server"

# 4. Il sito si aprirà su http://localhost:5500
```

✅ **Vantaggi:** Setup immediato, nessuna dipendenza
❌ **Limiti:** Generazione AI non funzionante (usa loghi di esempio)

---

### 2️⃣ Modalità Full Stack (Con Backend)

**Perfetto per: Produzione, generazione AI reale**

#### A. Installazione

```bash
# 1. Installa dipendenze
npm install

# 2. Crea file .env
cp .env.example .env

# 3. Modifica .env e aggiungi la tua API key Anthropic
# Apri .env e cambia:
ANTHROPIC_API_KEY=sk-ant-api03-la-tua-chiave-qui
```

#### B. Ottieni API Key Anthropic

1. Vai su https://console.anthropic.com/
2. Registrati / Login
3. Vai su "API Keys"
4. Crea una nuova chiave
5. Copiala nel file `.env`

#### C. Avvia il Server

```bash
# Modalità development (con auto-reload)
npm run dev

# Oppure modalità produzione
npm start
```

Server avviato su: **http://localhost:3000** ✅

#### D. Test

1. Apri http://localhost:3000
2. Vai alla sezione "Genera Logo"
3. Compila il form
4. Click "Genera Logo"
5. Guarda la magia! ✨

---

## 📦 Struttura File Finale

```
logoforge/
├── public/                 # File statici serviti dal server
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── server.js              # Backend Node.js
├── package.json           # Dipendenze Node
├── .env                   # Configurazione (NON committare!)
├── .env.example           # Template configurazione
├── .gitignore            # File da ignorare in Git
└── README.md             # Documentazione completa
```

**IMPORTANTE:** Sposta `index.html`, `styles.css`, `script.js` nella cartella `public/`

```bash
# Crea cartella public
mkdir public

# Sposta file
mv index.html styles.css script.js public/
```

---

## 🔧 Modifica Frontend per Backend

Apri `public/script.js` e modifica la funzione `callAnthropicAPI`:

```javascript
// PRIMA (frontend diretto - non funziona)
async function callAnthropicAPI(prompt, brandName, style, industry) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        // ...
    });
}

// DOPO (usa il backend)
async function callAnthropicAPI(prompt, brandName, style, industry) {
    const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            brandName, 
            industry, 
            style, 
            colors: document.getElementById('colors').value,
            description: document.getElementById('description').value
        })
    });
    
    if (!response.ok) throw new Error('Generation failed');
    return await response.json();
}
```

---

## 💳 Aggiungi Pagamenti (Opzionale)

### Con Stripe

```bash
# 1. Installa già incluso in package.json
npm install stripe

# 2. Registrati su https://stripe.com/
# 3. Ottieni chiavi API

# 4. Aggiungi a .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# 5. Aggiungi al frontend (public/index.html)
<script src="https://js.stripe.com/v3/"></script>

# 6. Modifica checkout in public/script.js
async function checkout() {
    const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state.cart })
    });
    
    const { sessionId } = await response.json();
    const stripe = Stripe('pk_test_...');  // Tua chiave pubblica
    await stripe.redirectToCheckout({ sessionId });
}
```

---

## 🌐 Deploy in Produzione

### Opzione 1: Heroku (Gratuito per iniziare)

```bash
# 1. Installa Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Crea app
heroku create logoforge-app

# 4. Aggiungi variabili ambiente
heroku config:set ANTHROPIC_API_KEY=sk-ant-...

# 5. Deploy
git push heroku main

# 6. Apri app
heroku open
```

### Opzione 2: Vercel (Serverless)

```bash
# 1. Installa Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Segui il wizard
```

### Opzione 3: DigitalOcean / AWS

1. Crea server Linux (Ubuntu 22.04)
2. Installa Node.js
3. Clona repository
4. Setup Nginx reverse proxy
5. Setup PM2 per process management
6. Configura SSL con Let's Encrypt

---

## ✅ Checklist Pre-Produzione

- [ ] API key Anthropic configurata e funzionante
- [ ] File .env creato e configurato (NON committare!)
- [ ] File spostati in cartella `public/`
- [ ] Backend testa in locale (http://localhost:3000)
- [ ] Generazione loghi funziona
- [ ] Carrello funziona
- [ ] (Opzionale) Stripe configurato e testato
- [ ] .gitignore include .env
- [ ] README.md aggiornato con tue info
- [ ] Testato su mobile e desktop

---

## 🆘 Problemi Comuni

### "Cannot find module '@anthropic-ai/sdk'"
```bash
npm install
```

### "ANTHROPIC_API_KEY not found"
- Verifica che .env esista
- Verifica che la chiave sia corretta
- Riavvia il server dopo modifiche a .env

### Loghi non si generano
- Controlla console browser (F12)
- Controlla logs server nel terminale
- Verifica API key valida

### Pagina bianca
- Verifica che i file siano in `public/`
- Controlla console browser per errori
- Hard refresh (Ctrl+F5)

---

## 📞 Prossimi Passi

1. ✅ **Setup Base**: Segui questa guida
2. 🎨 **Personalizza**: Modifica colori, font, prezzi
3. 🧪 **Testa**: Genera alcuni loghi
4. 💳 **Pagamenti**: Integra Stripe (opzionale)
5. 🚀 **Deploy**: Pubblica online
6. 📊 **Monitora**: Aggiungi analytics

---

## 🎯 Risultato Finale

Un sito professionale dove:
- ✨ Gli utenti generano loghi con AI
- 💰 Vedono prezzi dinamici
- 🛒 Aggiungono al carrello
- 💳 Completano il checkout
- 📥 Scaricano i loghi

**Budget stimato per 1000 loghi/mese:**
- Hosting: €5-20/mese
- API Anthropic: ~€30-50/mese
- Stripe: 1.5% + €0.25 per transazione
- **Totale: ~€40-80/mese**

---

Buon lavoro! 🚀 Se hai domande, consulta il README.md completo.
