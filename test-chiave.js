require('dotenv').config();
const OpenAI = require('openai');

console.log('🔍 Testing API Key...\n');

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Chiave NON trovata nel .env!');
    process.exit(1);
}

console.log('✅ Chiave trovata:', process.env.OPENAI_API_KEY.substring(0, 20) + '...\n');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('🧪 Test GPT-4o-mini...');
openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Say OK" }],
    max_tokens: 5
})
.then(r => {
    console.log('✅ GPT funziona!');
    console.log('📝 Risposta:', r.choices[0].message.content);
    console.log('\n🎉 LA TUA CHIAVE FUNZIONA!\n');
})
.catch(e => {
    console.error('❌ ERRORE:', e.message);
    if (e.message.includes('API key')) {
        console.log('\n🔑 Chiave invalida! Creane una nuova su:');
        console.log('https://platform.openai.com/api-keys\n');
    }
});