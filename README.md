# SchemeSaathi · योजनासाथी

A multilingual **Citizen Welfare Copilot** for India (English + Marathi interface, supporting Marathi, Hindi, and English voice & text input).

## Core Principle: Zero LLM Scheme Guessing
1. **Multilingual Voice / Text Intake**: Citizens speak or type their situation in Marathi (`mr-IN`), Hindi (`hi-IN`), or English (`en-IN`). Low-literacy users can dictate via microphone and listen to read-aloud summaries.
2. **Structured JSON Extraction (`Ollama` first, Gemini/local fallback)**: The server-side `/api/ollama-chat` endpoint sends the citizen's natural Marathi, Hindi, or English text to `http://127.0.0.1:11434/api/chat` (`qwen2.5:3b` by default, or configurable Gemini alternative) to extract a typed `CitizenProfile` JSON object. It **never** predicts or guesses scheme eligibility.
3. **Deterministic Rules Engine (`src/engine/rulesEngine.ts`)**: Pure TypeScript predicates evaluate the extracted JSON against verified Central and Maharashtra Government scheme rules, producing clause-by-clause proof (`pass` / `missing` / `fail`).
4. **Grounded Explanations & Citations**: The LLM explains the deterministic rules-engine output in plain Marathi or English and cites the official government portal & circular reference.
5. **Document Checklists & Pre-Filled Application Desk**: Auto-populates printable PDF-ready application sheets from the citizen's extracted JSON profile.

## Running Locally with Ollama
```bash
# 1. Start Ollama locally with qwen2.5:3b
ollama pull qwen2.5:3b
ollama serve

# 2. Configure environment
cp .env.example .env

# 3. Install & run full-stack dev server (keeps all model calls server-side)
npm install
npm run dev
```

## Push to GitHub (`Scheme-Saathiii`) & Deploy to Vercel
```bash
git init
git add .
git commit -m "Initial SchemeSaathi MVP"
git branch -M main
git remote add origin https://github.com/<your-username>/Scheme-Saathiii.git
git push -u origin main

# Deploy to Vercel
npx vercel --prod
```
