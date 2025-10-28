# Analysis Cheque Built-in AI: Architecture Documentation

## Executive Summary

**Analysis Cheque Built-in AI** is a privacy-first, offline-capable web app that leverages Chrome’s Built-in AI APIs to securely analyze cheques **entirely on-device**—no data ever leaves the user’s browser. Built for internal banking workflows, it eliminates the need for cloud-based OCR or third-party AI services, solving a critical compliance and security gap in financial document handling.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [AI APIs Used](#ai-apis-used)
3. [Architecture](#architecture)
4. [Core Features](#core-features)
5. [Privacy Model](#privacy-model)
6. [User Flow](#user-flow)
7. [Offline-First](#offline-first)
8. [Why It Matters](#why-it-matters)

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui
- **State**: SWR + Zod-validated session state
- **AI**: Chrome Built-in AI (Gemini Nano via `window.LanguageModel`, `window.Translator`, `window.LanguageDetector`)
- **Media**: Native Web APIs (no external libraries for image/audio)

---

## AI APIs Used

| API                       | Purpose                                                  | On-Device? |
| ------------------------- | -------------------------------------------------------- | ---------- |
| `window.LanguageModel`    | Extract fields & run forensic analysis from cheque image | ✅         |
| `window.LanguageDetector` | Auto-detect report language                              | ✅         |
| `window.Translator`       | Translate analysis into 5 languages                      | ✅         |

All AI runs **locally** using Gemini Nano—no network calls, no API keys.

---

## Architecture

```bash
[ User Uploads Cheque ]
        ↓
[ Next.js App (Client Only) ]
        ↓
[ Chrome Built-in AI (Gemini Nano) ]
        ↓
[ Structured Fields → Editable Form → Audio/Text Remarks → AI Report ]
        ↓
[ Real-time Translation (if needed) ]
```

- **Zero backend**: Entire app runs in-browser
- **No localStorage**: All data stays in memory (cleared on refresh)
- **Modular lib**: `lib/prompt.ts` abstracts all AI logic
- **Typed state**: `ChequeSession` interface with Zod validation

---

## Core Features

1. **On-Device OCR**  
   Upload a cheque → AI extracts 11+ fields (amount, IFSC, payee, etc.) using multimodal prompting.

2. **Smart Form Review**  
   Edit extracted data with sticky image preview + full-screen viewer (zoom/rotate/pan).

3. **Voice + Text Remarks**  
   Add audio notes or text comments—stored only in session.

4. **Forensic AI Analysis**  
   AI inspects image + data + remarks → generates severity-tagged markdown report:

   - 🔴 **High**: Tampering signs
   - 🟡 **Medium**: Data inconsistencies
   - 🔵 **Low**: Risk assessment & actions

5. **Instant Translation**  
   Switch report language → AI translates **preserving markdown structure**.

---

## Privacy Model

🔒 **Zero-Trust by Design**

- ❌ No data leaves the device
- ❌ No telemetry, analytics, or cookies
- ❌ No server, cloud, or third parties
- ✅ 100% compliant with GDPR, PCI-DSS, and banking data policies

All processing happens inside Chrome’s secure sandbox using on-device AI.

---

## User Flow

4-Step Wizard

1. **Upload** → Choose image → “Extract & Prefill” (on-device OCR)
2. **Review** → Edit fields + inspect image
3. **Remarks** → Add text or voice notes
4. **Analyze** → Get AI report → Translate if needed

Back/Next navigation preserves all session data.

---

## Offline-First

- Works **without internet** after initial load
- AI model (Gemini Nano) pre-installed in Chrome 140+
- PWA-ready: Can be installed as desktop/mobile app
- No external dependencies during runtime

---

## Why It Matters

This isn’t just a demo—it’s a **new paradigm for enterprise AI**:

- **Banks** can process cheques without violating data residency rules
- **Costs drop to zero**: No OCR licenses, no cloud AI fees
- **Speed improves**: No network latency
- **Trust increases**: Users control their data

We prove that **on-device AI = enterprise-ready AI**.

---

> **Built for Chrome Built-in AI Challenge 2025**  
> GitHub: [github.com/2manoj1/analysis-cheque-built-in-ai](https://github.com/2manoj1/analysis-cheque-built-in-ai)  
> License: MIT
