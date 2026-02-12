# 🪟 GUIDA INSTALLAZIONE WINDOWS - LogoVex

## ⚠️ Risolvi Prima l'Errore PowerShell

Se vedi l'errore "L'esecuzione di script è disabilitata", segui questi passi:

### Passo 1: Apri PowerShell come Amministratore

1. Premi `Win + X`
2. Clicca su **"Windows PowerShell (Amministratore)"**
3. Clicca "Sì" quando chiede conferma

### Passo 2: Sblocca l'Esecuzione Script

Nel PowerShell amministratore, copia e incolla questo comando:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Premi `S` e poi `Invio` per confermare.

✅ **Fatto!** Ora npm funzionerà correttamente.

---

## 📦 Installazione Completa

### 1️⃣ Verifica Node.js Installato

Apri un normale PowerShell (non amministratore) e digita:

```powershell
node --version
npm --version
```

Dovresti vedere le versioni (es: v20.x.x).

❌ **Se non hai Node.js:**
- Scaricalo da https://nodejs.org/
- Installa la versione LTS
- Riavvia PowerShell

### 2️⃣ Vai nella Cartella LogoVex

```powershell
cd C:\Users\Personale\LogoVex
```

(o dove hai salvato la cartella)

### 3️⃣ Installa le Dipendenze

```powershell
npm install
```

Aspetta che finisca (può richiedere 1-2 minuti).

### 4️⃣ Configura la Chiave API OpenAI

1. **Ottieni una chiave OpenAI:**
   - Vai su https://platform.openai.com/api-keys
   - Registrati/Accedi
   - Clicca "Create new secret key"
   - **COPIA LA CHIAVE** (la vedrai una sola volta!)

2. **Apri il file `.env` con Notepad:**

```powershell
notepad .env
```

3. **Modifica questa riga:**

```env
OPENAI_API_KEY=sk-proj-METTI-QUI-LA-TUA-CHIAVE-OPENAI
```

Sostituisci `sk-proj-METTI-QUI-LA-TUA-CHIAVE-OPENAI` con la tua vera chiave OpenAI.

Esempio:
```env
OPENAI_API_KEY=sk-proj-abc123xyz789tuachiavevera
```

4. **Salva e chiudi** (Ctrl+S, poi chiudi Notepad)

### 5️⃣ Testa la Chiave API

Prima di avviare il server, verifica che la chiave funzioni:

```powershell
node test-chiave.js
```

✅ **Se vedi "LA TUA CHIAVE FUNZIONA!"** → tutto ok!

❌ **Se vedi errori:**
- Controlla di aver copiato tutta la chiave
- Verifica che non ci siano spazi prima/dopo
- Assicurati di avere crediti OpenAI (serve carta di credito registrata)

### 6️⃣ Avvia il Server

```powershell
npm start
```

O per la modalità sviluppo con auto-reload:

```powershell
npm run dev
```

Dovresti vedere:

```
â•"â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•'     🎨 LogoVex con DALL-E 3           â•'
â•'  Port: 3000                           â•'
â•'  ✅ OpenAI GPT-4                      â•'
â•'  ✅ DALL-E 3                          â•'
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 7️⃣ Apri il Sito

Nel browser, vai su:

```
http://localhost:3000
```

### 8️⃣ Genera il Primo Logo!

1. Clicca su "Genera Logo"
2. Compila il form:
   - Nome brand: "TechVision"
   - Settore: "Tecnologia"
   - Stile: "Modern"
   - Descrizione: "Azienda innovativa di software AI"
3. Clicca "Genera Logo"
4. Aspetta 10-15 secondi
5. 🎉 **Vedrai un'immagine VERA generata da DALL-E 3!**

---

## 🔧 Comandi Utili

### Avviare il server
```powershell
npm start
```

### Avviare in modalità sviluppo (auto-reload)
```powershell
npm run dev
```

### Fermare il server
Premi `Ctrl + C` nel PowerShell

### Testare la chiave API
```powershell
node test-chiave.js
```

### Reinstallare dipendenze (se qualcosa va storto)
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

---

## ❌ Problemi Comuni

### "Errore: Cannot find module 'openai'"

**Soluzione:**
```powershell
npm install
```

### "OPENAI_API_KEY not found"

**Causa:** File .env non configurato o chiave mancante

**Soluzione:**
1. Apri il file .env: `notepad .env`
2. Verifica che la riga `OPENAI_API_KEY=...` abbia la tua vera chiave
3. Riavvia il server

### "Port 3000 already in use"

**Causa:** Il server è già in esecuzione o un'altra app usa la porta 3000

**Soluzione:**
```powershell
# Opzione 1: Trova e chiudi il processo
netstat -ano | findstr :3000
taskkill /PID <numero_processo> /F

# Opzione 2: Usa un'altra porta
# Apri .env e cambia: PORT=3001
```

### "Network error" o "CORS error"

**Causa:** Il frontend sta provando a chiamare direttamente OpenAI invece del backend

**Soluzione:** Verifica che in `public/script.js` la funzione `generateLogo` chiami:
```javascript
fetch('/api/generate-logo', ...)
```
e NON:
```javascript
fetch('https://api.openai.com/...', ...)
```

### "Invalid API Key"

**Causa:** Chiave OpenAI non valida o scaduta

**Soluzione:**
1. Vai su https://platform.openai.com/api-keys
2. Crea una NUOVA chiave
3. Aggiornala nel file .env
4. Riavvia il server

### "Insufficient quota" o "You exceeded your quota"

**Causa:** Hai finito i crediti OpenAI

**Soluzione:**
1. Vai su https://platform.openai.com/settings/organization/billing
2. Aggiungi una carta di credito
3. Aggiungi crediti (minimo $5)

---

## 💰 Costi

### Generazione Logo (con DALL-E 3)
- **1 logo = ~€0.04** (circa 4 centesimi)
- Risoluzione: 1024x1024px
- Qualità: Standard

### Esempio Budget Mensile:
- 100 loghi/mese = €4
- 500 loghi/mese = €20
- 1000 loghi/mese = €40

### Come Controllare i Costi:
1. Vai su https://platform.openai.com/usage
2. Monitora il consumo giornaliero

---

## 🎯 Prossimi Passi

1. ✅ Installazione completata
2. ✅ Server avviato
3. ✅ Primo logo generato
4. 🎨 **Personalizza il design** (colori, font in styles.css)
5. 💳 **Integra Stripe** per pagamenti veri (opzionale)
6. 🚀 **Deploy online** (Heroku, Vercel, DigitalOcean)

---

## 📞 Hai Ancora Problemi?

### Checklist Finale:

- [ ] PowerShell sbloccato con `Set-ExecutionPolicy`?
- [ ] Node.js installato? (`node --version`)
- [ ] Dipendenze installate? (`npm install`)
- [ ] File .env configurato con chiave OpenAI valida?
- [ ] Crediti OpenAI disponibili?
- [ ] Porta 3000 libera?
- [ ] Server avviato? (`npm start`)

Se tutto è ✅ ma non funziona ancora:

1. **Controlla la console del browser** (F12 → Console)
2. **Controlla i log del server** (nel PowerShell dove hai avviato npm start)
3. **Riavvia tutto**:
   ```powershell
   # Stop server (Ctrl+C)
   # Riavvia
   npm start
   ```

---

## 🎉 Congratulazioni!

Ora hai un generatore di loghi AI completamente funzionante che:
- ✅ Genera VERE immagini con DALL-E 3
- ✅ Funziona in locale sul tuo PC
- ✅ Costa solo ~4 centesimi per logo
- ✅ È completamente personalizzabile

**Buon divertimento con LogoVex!** 🚀
