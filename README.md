<div align="center">

<img src="docs/images/voxa-icon.svg" alt="Calliva Logo" width="96" height="96" />

# Calliva AI

### **The Multilingual AI Voice Receptionist for Modern Businesses**

An intelligent voice-first receptionist that answers customer calls 24/7, speaks natural regional languages (English, Hindi, Hinglish), books real calendar appointments, and captures hot leads into a real-time CRM dashboard.

<br>

[![Developer](https://img.shields.io/badge/Developer-Pooja_Rajput-6366F1?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Pooja-Rajput05/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/pooja-rajput-65056a30a/)
[![Email](https://img.shields.io/badge/Email-poojarajput271205@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:poojarajput271205@gmail.com)
[![License](https://img.shields.io/badge/License-MIT-EC4899?style=for-the-badge)](#-license)

<br>

![Next.js](https://img.shields.io/badge/Next.js_15-000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)
![Web Speech API](https://img.shields.io/badge/Web_Speech_STT_/_TTS-FF6F00?style=flat)

</div>

<br>

---

## 🌟 Overview

Every day, clinics, salons, legal offices, and local businesses lose valuable customers because calls go unanswered after business hours. **Calliva** solves this by acting as an always-on AI receptionist that:
- **Speaks naturally** in English, Hindi, and Hinglish.
- **Handles complex customer queries** using RAG knowledge base.
- **Books calendar slots** with slot validation.
- **Captures verified leads** with automated sentiment analysis and scoring (1-10) directly in a real-time Supabase dashboard.
- **Runs 100% Free** directly in the browser via Web Speech API and Gemini AI integration.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎙️ **Interactive In-Browser Voice Calling** | Test voice conversations directly through the browser with real-time mic input, animated audio waveforms, and low-latency responses. |
| 🌐 **Multilingual Conversational AI** | Context-aware voice interaction supporting English and Hindi/Hinglish with polite receptionist personas. |
| 📊 **Real-time CRM & Telemetry** | Full analytics dashboard powered by Supabase with live call history, audio visualizers, and categorized lead Kanban. |
| 🎯 **Automated Lead Scoring** | Evaluates customer intent, scores leads from 1 to 10, identifies high-intent queries, and generates suggested follow-ups. |
| 📅 **Calendar & Appointment Booking** | Automated slot resolution and appointment confirmation workflow with simulated WhatsApp confirmations. |
| ⚡ **Next.js 15 & Modern UI** | Built with Next.js 15 App Router, Turbopack, Tailwind CSS, Motion/Framer animations, and Lucide icons. |

---

## 🏗️ Architecture & Tech Stack

```mermaid
flowchart LR
    User([🎙️ User Mic / Audio]) --> WebSpeech[Web Speech Recognition / STT]
    WebSpeech --> Gemini[Google Gemini AI Backend]
    Gemini --> ToolExecution[Slot / Lead / Intent Extraction]
    ToolExecution --> TTS[SpeechSynthesis TTS Voice]
    TTS --> UserAudio([🔊 Audio Output])
    
    ToolExecution --> SaveCall[/api/voice/save-call]
    SaveCall --> Supabase[(Supabase PostgreSQL)]
    Supabase --> Dashboard[Real-time Analytics Dashboard]
```

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Motion, Radix UI.
- **AI Backend:** Google Gemini API (`@google/generative-ai`) with structured JSON extraction.
- **Database:** Supabase PostgreSQL (Row-Level Security, Realtime Publications, Stored Procedures).
- **Voice Pipeline:** Web Speech API (`webkitSpeechRecognition` + `speechSynthesis`).

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Pooja-Rajput05/calliva.git
cd calliva
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Setup Database Schema
Execute the SQL script located at [`supabase/full_schema_and_seed.sql`](supabase/full_schema_and_seed.sql) inside your Supabase project's **SQL Editor**.

### 5. Run the Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (or port 3001) in your browser.

---

## 📂 Project Structure

```text
├── app/
│   ├── (app)/                  # Authenticated CRM Dashboard, Calls & Leads pages
│   ├── api/
│   │   └── voice/              # Gemini voice chat & call persistence routes
│   ├── layout.tsx              # Root layout & theme configuration
│   └── page.tsx                # Calliva landing page & in-browser call launcher
├── components/
│   ├── brand/                  # Calliva logo & wordmark
│   ├── dashboard/              # KPI cards, audio players & call logs
│   ├── landing/                # Hero, Features, About, FAQ, Footer
│   ├── voice/                  # In-Browser interactive voice call modal
│   └── ui/                     # UI components & primitives
├── lib/
│   ├── supabase/               # Client, server, and types configuration
│   └── dashboard-data.ts       # Database aggregate queries
└── supabase/
    └── full_schema_and_seed.sql # Complete database migration & seed data
```

---

## 👩‍💻 Author

**Pooja Rajput**

* GitHub: [@Pooja-Rajput05](https://github.com/Pooja-Rajput05/)
* LinkedIn: [Pooja Rajput](https://www.linkedin.com/in/pooja-rajput-65056a30a/)
* Twitter: [@PoojaRajput](https://x.com/home)
* Email: [poojarajput271205@gmail.com](mailto:poojarajput271205@gmail.com)

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
