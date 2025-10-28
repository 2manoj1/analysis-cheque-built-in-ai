# Analysis Cheque Built-in AI: Official Hackathon Submission

## 1. The Problem: Internal Banker Tools & Data Security

**Context:** The project targets the financial sector, specifically internal tools used by bankers. Handling financial documents like cheques requires high security and strict data residency compliance.

**The Challenge:** Existing OCR/analysis solutions force banks to compromise:

1. Use expensive, legacy hardware/software.
2. **OR** Send highly sensitive, private cheque data to a third-party cloud AI API, which violates the **Zero-Trust** security model required for internal financial data.

## 2. Our Solution: Offline-First, Zero-Trust Analysis

**Analysis Cheque Built-in AI** is designed as a **private, offline-first tool** using Next.js/React. It uses Chrome's on-device AI (Gemini Nano) to move the entire computation boundary from the cloud/server to the client's local machine.

- **Result**: The tool provides instant, high-accuracy analysis, eliminates API costs, and most importantly, guarantees **Zero Data Leakage**, as the sensitive financial data never leaves the banker's device.

## 3. Technical Requirements & Compliance

- **Architecture**: Built as an **Offline-First** single-page experience using Next.js, ensuring core analysis functions remain available even during network outages.
- **APIs Used**: `prompt()`, `summarize()`, and `translate()`.
- **Security Model**: The application is an exemplar of Privacy-by-Design, fulfilling the need for a **private, on-device** analytical tool in a regulated industry.

---

## 4. Submission Checklist

- **Application Built**: Yes (Next.js, Tailwind v4, shadcn/ui, Chrome AI)
- **GitHub Repository**: [https://github.com/2manoj1/analysis-cheque-built-in-ai](https://github.com/2manoj1/analysis-cheque-built-in-ai) (Includes clear `README.md` instructions)
- **Public Demo URL**: [Insert your live demo URL here]
- **Demo Video Link**: [Insert your public YouTube/Vimeo link here]
