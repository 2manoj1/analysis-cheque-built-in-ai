# Analysis Cheque Built-in AI

A Next.js application demonstrating **secure, on-device cheque data analysis** using Chrome's Built-in AI APIs—**no data leaves the browser**.

🚀 **Live Demo URL**: https://demo-analysis-cheque.vercel.app  
🏆 Built for the **Google Chrome Built-in AI Challenge 2025**

This README provides setup and testing instructions for tester and developers. For the full problem statement, architecture, and feature details, see:

- 📄 [`HACKATHON_SUBMISSION.md`](HACKATHON_SUBMISSION.md)
- 🏗️ [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## Tech Stack & Tooling

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **AI Engine**: Chrome Built-in AI APIs (`LanguageModel` - Gemini Nano)
- **Node Requirement**: Node.js LTS **22+**
- **Package Manager**: pnpm

---

## Prerequisites

To run this project, you must have the following installed:

1. **Node.js**: Version 22 or higher.
2. **pnpm**: Install it globally via:

   ```bash
   npm install -g pnpm
   ```

3. **Google Chrome**: **Version 140 or newer** (or a Canary/Dev build) where the Built-in AI APIs are active.

### ⚠️ Testing Requirement

The core functionality relies on experimental APIs. If you encounter issues, please ensure the necessary feature flags are enabled in your Chrome browser:

1. Open Chrome and navigate to `chrome://flags`.
2. Search for flags related to "On-device AI" or "Gemini Nano" and ensure they are set to **Enabled**.

⚠️ These APIs are experimental.

---

## Getting Started

The application runs locally on port 3000.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/2manoj1/analysis-cheque-built-in-ai.git
   cd analysis-cheque-built-in-ai
   ```

2. **Install dependencies:**

   ```bash
   pnpm i
   ```

3. **Run the development server:**

   ```bash
   pnpm run dev
   ```

4. **Open the application:**
   The application will be accessible at: `http://localhost:3000`

---

## Testing Scenarios & Verification

### 1. Visual Analysis & Data Extraction Test

This test verifies the application's core functionality: using on-device AI for visual analysis and structured data extraction.

1. **Download a Sample Cheque**:
   Navigate to the sample image repository:
   [https://github.com/2manoj1/ocr-img-cheque/tree/main/images](https://github.com/2manoj1/ocr-img-cheque/tree/main/images)
   Download any image file (e.g., `1.jpg`).

2. **Step 1: Upload**

   - In the running app, click the **"Choose file"** button.
   - Select the downloaded cheque image.
   - Click **"Extract & Prefill"**.

3. **Expected Result for Step 1**:
   The system should display a status message confirming that extraction is running **entirely on-device**.

4. **Step 2: Review**
   - The app should automatically move to the **"Review"** step (2).
   - The form fields (e.g., Cheque Number, Payee, Amount, IFSC etc) must be accurately populated by the on-device AI.
   - Verify extracted fields (Cheque No., Payee, Amount, IFSC, etc.)
   - Edit if needed
5. **Steps 3–4**: Add remarks → Run AI analysis → Try translation

All processing happens **locally in your browser**—no network calls, no cloud.

---

## Licensing

This project is released under the **[MIT License](LICENSE)**.
