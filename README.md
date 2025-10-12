# Fluencai WebGen App (Next.js)

- Home page
- Left sidebar (LeftBanner) + persistent layout
- **/webgen** generator page with **Laptop + Phone previews**
- API: `/api/generate` using **OpenAI** by default
- Output: single-file **Tailwind HTML** (safe: no scripts)

## Set up
```bash
npm install
# set your OpenAI key
echo "OPENAI_API_KEY=sk-..." > .env.local
# optional: choose model
echo "OPENAI_MODEL=gpt-5-nano" >> .env.local
npm run dev
# open http://localhost:3000 → New App Project
```

If you later prefer local/OSS models, we can add a toggle back—this package is currently OpenAI-first for higher quality layout fidelity.
