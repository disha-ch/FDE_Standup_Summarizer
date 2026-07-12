# Standup_Summarizer

Vikram's dashboard to centrally collect, parse, and segregate team daily standup messages using Gemini AI.

**Vercel Live URL:** [https://fde-standup-summarizer.vercel.app/](https://fde-standup-summarizer.vercel.app/)

---

## 🎯 The Core Intent of the Standup Segregator / Summarizer

The primary objective of **Standup_Summarizer** (originally called the *Standup Segregator*) is to solve "Standup Fatigue" and contextual fragmentation for engineering managers and team members. 

In active software teams, daily standup updates are frequently shared as unstructured paragraphs, conversational Slack/Teams threads, or bullet-point logs containing a mix of resolved tasks, active tickets, minor frustrations, and critical blocks. 

This tool serves as an **intelligent information sieve**:
1. **Reduces Cognitive Load:** Instead of manually reading and decoding long threads, a manager or team member can view a neat, segregated layout of what is truly happening.
2. **Highlights Critical Path Roadblocks:** By extracting *Blockers* into a high-visibility container, the dashboard acts as an early warning system for unresolved dependencies, API outages, or design paralysis.
3. **Improves Standup Quality:** Distinguishes between completed tasks, in-flight work, and reviews requiring feedback so the team can focus discussions on progress and support, rather than repetitive status updates.

---

## 🚀 Overview

**Standup_Summarizer** is a high-performance, full-stack visual dashboard designed specifically for engineering teams to capture, parse, and automatically organize daily standup threads. Powered by Gemini AI and standard environment variables, it transforms conversational standup logs into structured, actionable sections.

### Key Features
*   **Public Access Mode:** Simplified workflow with the authentication layer removed, making it fully ready for direct collaborative team use.
*   **Intelligent AI Segregation:** Categorizes individual updates into four clear segments:
    1.  **Blockers:** Unresolved critical path issues.
    2.  **Completed:** Completed tasks and highlights.
    3.  **Active Work:** Current active engineering effort.
    4.  **Awaiting Feedback:** Pull requests and reviews waiting on feedback.
*   **Vercel & GitHub Ready:** Bundled cleanly as a serverless-friendly API backend coupled with a Vite single-page application.
*   **Durable Temp File Store:** Leverages dynamic path handling (`/tmp` storage on Vercel) to ensure serverless state stability.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
*   **Backend:** Express (Node.js) serverless API structure
*   **AI Engine:** `@google/genai` (SDK utilizing Gemini models)
*   **Hosting:** Fully configured for deployment to **Vercel**

---

## 🔑 Environment Setup

Configure the following secrets or local environment variables before deploying:

```env
# Google Gemini API key used for the standup segregation logic
GOOGLE_API_KEY="your_google_api_key_here"

# Alternative key (fallback for compatibility)
GEMINI_API_KEY="your_gemini_api_key_here"
```

---

## 📦 Local Installation

To run this project locally:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development environment:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
