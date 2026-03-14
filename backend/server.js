import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = process.env.MODEL_NAME || "gemini-2.0-flash";
const MAX_TOKENS = parseInt(process.env.MAX_OUTPUT_TOKENS || "8192", 10);

if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env file");
  process.exit(1);
}

// ─── System instruction (sent separately, NOT mixed into user content) ───────
function getSystemInstruction() {
  return {
    parts: [{
      text: `You are "Dr. Sahayak", an AI Digital Health Assistant for rural India.
Always respond in simple Hindi (avoid medical jargon).
Address the patient as "आप".

STRICT RULES:
- Never use *, **, #, _ or any markdown symbols.
- Use only plain text. Use - (dash) or 1, 2, 3 for lists.
- Never mention any medicine name or dosage.
- Never give a short answer. Always write a detailed, complete response.
- Do NOT start with greetings or introduction. Go DIRECTLY to the 5 sections below.
- Every single section is MANDATORY. Do not skip any section.
- Write at least 4-6 lines per section.

ALWAYS respond in EXACTLY this structure:

🩺 1. संभावित समस्या (Possible Condition)
[Explain possible causes of the symptoms in detail. Minimum 4-5 sentences.]

📋 2. विस्तृत सुझाव (Detailed Recommendation)
[What to do immediately, what to watch in next 24-48 hours, when to see a doctor. Minimum 5 points.]

🌿 3. घरेलू उपचार (Safe Home Remedies)
[Safe, easy home remedies available in villages. Explain each remedy step by step. Minimum 4 remedies.]

⚠️ 4. चेतावनी संकेत (Warning Signs)
[List symptoms that require IMMEDIATE hospital visit. Minimum 4-5 warning signs.]

📌 5. सामान्य जानकारी (General Health Advice)
[Lifestyle, diet and prevention tips. Minimum 4-5 points.]`
    }]
  };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/check-health", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid symptoms input" });
    }
    if (!prompt.trim()) {
      return res.status(400).json({ error: "Symptoms cannot be empty" });
    }

    // ── Proper Gemini payload: system_instruction + user role message ──────────
    const payload = {
      system_instruction: getSystemInstruction(),
      contents: [
        {
          role: "user",
          parts: [{ text: `मेरे लक्षण: ${prompt.trim()}` }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: MAX_TOKENS,
        topP: 0.9,
        topK: 40,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    const url = `${GEMINI_BASE}/${MODEL}:generateContent`;

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      timeout: 30000,
    });

    const result =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "क्षमा करें, अभी कुछ समस्या आ रही है। थोड़ी देर बाद फिर कोशिश करें। 🙏";

    res.json({ result });

  } catch (err) {
    console.error("🔥 /check-health error:", err?.response?.data || err.message);
    res.status(500).json({
      error: "Internal server error",
      detail: err?.response?.data || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ AI Health Server running at http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL} | Max Tokens: ${MAX_TOKENS}`);
});