# 📋 COMANDI COMPLETI PER GITHUB - Copia e Incolla

## 🎯 PARTE 1: Preparazione Locale

### Step 1: Vai nella Cartella del Progetto

```cmd
cd C:\Users\Personale\Documents\logovex
```

---

### Step 2: Inizializza Git

```cmd
git init
```

---

### Step 3: Configura Git (PRIMA VOLTA)

**Sostituisci con i tuoi dati:**

```cmd
git config --global user.name "Ilaria"
git config --global user.email "tua@email.com"
```

---

### Step 4: Aggiungi Tutti i File

```cmd
git add .
```

---

### Step 5: Verifica Cosa Verrà Caricato

```cmd
git status
```

**✅ Dovresti vedere:**
- ✅ .gitignore
- ✅ package.json
- ✅ server.js
- ✅ index.html
- ✅ script.js
- ✅ styles.css
- ✅ (altri file HTML)

**❌ NON dovresti vedere:**
- ❌ node_modules/ 
- ❌ .env

**Se vedi node_modules o .env → STOP! Non procedere!**

---

### Step 6: Fai il Commit

```cmd
git commit -m "Initial commit - LogoVex with DALL-E 3"
```

---

## 🎯 PARTE 2: Crea Repository su GitHub

1. Apri browser
2. Vai su: **https://github.com/new**
3. Compila:
   - **Repository name:** `logovex`
   - **Description:** "AI Logo Generator with DALL-E 3"
   - **Visibility:** Private (o Public)
4. ⚠️ **NON selezionare:**
   - ❌ Add a README
   - ❌ Add .gitignore
   - ❌ Choose a license
5. Click **"Create repository"**

---

## 🎯 PARTE 3: Collega e Carica

### Step 7: Collega Repository GitHub

**⚠️ SOSTITUISCI `TUO-USERNAME` con il tuo vero username GitHub!**

```cmd
git remote add origin https://github.com/TUO-USERNAME/logovex.git
```

**Esempio (se il tuo username è "ilaria92"):**
```cmd
git remote add origin https://github.com/ilaria92/logovex.git
```

---

### Step 8: Rinomina Branch in "main"

```cmd
git branch -M main
```

---

### Step 9: Carica su GitHub (PUSH)

```cmd
git push -u origin main
```

**Ti chiederà:**
- Username GitHub
- Password / Token

**⚠️ Se hai 2FA (autenticazione a 2 fattori):**
- NON usare la password normale
- Usa un **Personal Access Token**
- Generalo qui: https://github.com/settings/tokens
- Seleziona scope: `repo`
- Usa il token come password

---

## ✅ VERIFICA FINALE

Vai su:
```
https://github.com/TUO-USERNAME/logovex
```

Dovresti vedere tutti i file! 🎉

**Verifica che NON ci siano:**
- ❌ `node_modules/` (cartella)
- ❌ `.env` (file)

---

## 🔄 AGGIORNAMENTI FUTURI

Dopo aver modificato il codice in futuro:

```cmd
git add .
git commit -m "Descrizione delle modifiche"
git push
```

---

## 🆘 TROUBLESHOOTING

### Errore: "remote origin already exists"

```cmd
git remote remove origin
git remote add origin https://github.com/TUO-USERNAME/logovex.git
```

### Errore: "Authentication failed"

1. Genera Personal Access Token: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Seleziona scope `repo`
4. Copia il token
5. Usalo come password quando Git lo chiede

### Ho caricato .env per sbaglio!

```cmd
git rm --cached .env
git commit -m "Remove .env from repository"
git push
```

Poi vai su GitHub e cambia l'API key (perché è stata esposta)!

---

## 📝 RECAP VELOCISSIMO

```cmd
cd C:\Users\Personale\Documents\logovex
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TUO-USERNAME/logovex.git
git branch -M main
git push -u origin main
```

**Fatto! Ora il codice è su GitHub!** 🚀

---

## 🎯 PROSSIMO STEP: Railway

Dopo che il codice è su GitHub:
1. Vai su Railway.app
2. New Project → Deploy from GitHub repo
3. Seleziona `logovex`
4. Configura variabili ambiente
5. Deploy automatico!

**Ti guiderò passo-passo dopo che hai completato GitHub!**
