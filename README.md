# 🏥 AI स्वास्थ्य सहायक — AI Digital Health Assistant

A beautiful, responsive AI-powered health assistant built for rural India. Get detailed health advice in Hindi using Gemini AI.

## ✨ Features

- 🗣️ **Hindi Voice Input** — Speak your symptoms using the microphone
- 🔊 **Text-to-Speech** — Listen to the health advice read aloud in Hindi
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop
- 🌿 **Structured Advice** — Organized sections: Condition, Suggestions, Home Remedies, Warnings, General Tips
- ⚡ **Quick Symptoms** — One-tap common symptom selection
- 💎 **Beautiful Dark UI** — Glass morphism design with smooth animations

## 🚀 Setup

### Backend

```bash
cd backend
npm install
# Add your Gemini API key to .env
echo "GEMINI_API_KEY=your_key_here" > .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Add backend URL to .env
echo "VITE_API_BASE_URL=http://localhost:5000" > .env
npm run dev
```

## 🌾 Built for Rural India

This assistant provides health guidance in simple everyday Hindi, designed for villagers who need accessible healthcare information.

> ⚠️ This is an informational tool only. Always consult a qualified doctor for medical advice.
