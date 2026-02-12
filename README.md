# 🎨 LogoVex - AI Logo Generator

Generatore di loghi professionali powered by OpenAI DALL-E 3.

## ✨ Caratteristiche

- 🤖 Generazione loghi con DALL-E 3
- 🎨 7 stili diversi (Minimal, Modern, Vintage, Playful, Elegant, Bold, Geometric)
- 🛒 Sistema carrello integrato
- 💳 Integrazione Stripe (opzionale)
- 📱 Design responsive

## 🚀 Deploy su Railway

### 1. Crea progetto su Railway
- Vai su [Railway](https://railway.app)
- Login con GitHub
- New Project → Deploy from GitHub repo
- Seleziona questo repository

### 2. Configura variabili ambiente

Nella tab **Variables** su Railway, aggiungi:

```
OPENAI_API_KEY=sk-proj-LA-TUA-CHIAVE-OPENAI
NODE_ENV=production
PORT=${PORT}
```

### 3. Deploy automatico

Railway deploierà automaticamente! Aspetta 2-3 minuti.

## 💻 Sviluppo Locale

### Prerequisiti
- Node.js 18+
- API Key OpenAI

### Setup

```bash
# Installa dipendenze
npm install

# Crea file .env
cp .env.example .env

# Modifica .env e aggiungi la tua OPENAI_API_KEY

# Avvia server
npm start

# Oppure con auto-reload
npm run dev
```

Apri http://localhost:3000

## 📝 Configurazione

File `.env`:
```env
OPENAI_API_KEY=sk-proj-xxx  # La tua API key OpenAI
NODE_ENV=development
PORT=3000
```

## 💰 Costi

- **DALL-E 3**: ~€0.04 per logo (1024x1024px)
- **Railway**: $5/mese (piano Hobby)

## 🛠️ Tecnologie

- **Backend**: Node.js + Express
- **AI**: OpenAI DALL-E 3 + GPT-4
- **Pagamenti**: Stripe (opzionale)
- **Hosting**: Railway

## 📄 Licenza

MIT

## 🔗 Links

- [OpenAI Platform](https://platform.openai.com)
- [Railway Docs](https://docs.railway.app)
- [Stripe Docs](https://stripe.com/docs)

---

Made with ❤️ by Ilaria