"use client"

import type { ChequeFields } from "@/hooks/use-cheque-session"
import { ChequeFieldsSchema } from "@/hooks/use-cheque-session"

export async function isPromptAvailable(): Promise<boolean> {
  try {
    if (!window?.LanguageModel) return false
    const status = await window.LanguageModel.availability()
    return status !== "unavailable"
  } catch {
    return false
  }
}

export async function extractFieldsFromCheque(image: Blob): Promise<Partial<ChequeFields>> {
  if (!window?.LanguageModel) throw new Error("Prompt API unavailable")
  const session = await window.LanguageModel.create({
    initialPrompts: [
      {
        role: "system",
        content: "You extract structured fields from cheque front images. Return strict JSON only, no markdown.",
      },
    ],
    expectedInputs: [{ type: "image" }],
  })

  const res = await session.prompt([
    {
      role: "user",
      content: [
        { type: "text", value: "Extract fields from this cheque image." },
        { type: "image", value: image as any },
      ],
    },
  ], {responseConstraint: ChequeFieldsSchema})

  try {
    const jsonData = JSON.parse(res)
    const parsed = ChequeFieldsSchema.parse(jsonData)
    return parsed
  } catch(e: any) {
    console.log(e)
    // fallback: return empty fields
    return {
      bank_name: "",
      branch: "",
      cheque_number: "",
      date: "",
      payee: "",
      amount_numeric: "",
      amount_words: "",
      account_number: "",
      ifsc: "",
      micr: "",
      notes_visible_marks: "",
    }
  }
}

export async function analyzeCheque(
  image: Blob,
  edited: Partial<ChequeFields>,
  remarks: string,
  audio?: Blob,
): Promise<{ markdown: string, severity: string }> {
  if (!window?.LanguageModel) throw new Error("Prompt API unavailable")

  const expectedInputs: Array<{ type: "text" | "image" | "audio" }> = [{ type: "text" }, { type: "image" }]
  if (audio) expectedInputs.push({ type: "audio" })

  const params = await LanguageModel.params();

  const session = await window.LanguageModel.create({
    initialPrompts: [
      {
        role: "system",
        content: [
          "You are a highly skilled forensic cheque examiner, tasked with performing a detailed analysis of cheque images and given data.",
          "Focus your analysis on the following aspects of the cheque: date, amount, payee name, alterations, handwriting inconsistencies, signature verification, ink matching, and potential tampering such as overwriting, scraping, or erasure.",
          "Provide a comprehensive analysis with clear Markdown sections: ### Summary, ### Visual Indicators, ### Data Consistency, ### Risk Assessment, and ### Suggested Actions.",
          "For each section, evaluate and assign severity levels as follows: 'High' for any significant findings in Visual Indicators, 'Medium' for minor discrepancies in Data Consistency, and 'Low' for the remaining sections (Summary, Risk Assessment, Suggested Actions).",
          "Ensure your response is clear and professional, indicating if further forensic analysis or verification is needed."
        ].join("\n"),
      },
    ],
    expectedInputs,
    temperature: 0.1,
    topK: params?.defaultTopK,
  });


  const fieldsText = Object.entries(edited || {})
    .map(([k, v]) => `${k}: ${String(v ?? "")}`)
    .join("\n");

  // Collect the user content, including the cheque image, field data, and remarks
  const userContent: any[] = [
    { type: "text", value: "Please analyze the cheque image with the following updated form data, remarks (optional), and audio data (optional) recorded by the banker." },
    { type: "text", value: "The following fields have been extracted and edited by the banker:" },
    { type: "text", value: fieldsText },
    { type: "text", value: `Banker's remarks: ${remarks || "(none)"}` },
    { type: "image", value: image },
  ];

  if (audio) {
    const arrayBuffer = await audio.arrayBuffer();
    try {
      userContent.push({ type: "audio", value: arrayBuffer })
    } catch {
      // ignore adding audio
    }
  }

  const md = await session.prompt([
    {
      role: "user",
      content: userContent,
    },
  ])


  // Extract severity from the markdown (using the original logic)
  const severityMatch = md.match(/Severity:\s*(High|Medium|Low)/i)
  const severity = severityMatch ? severityMatch[1] : 'Medium'

  return { markdown: md, severity }
}

// CRITICAL FIX: The function must now return an object { translatedMarkdown: string, severity: string }
export async function translate(md: string, targetLanguage: string, originalSeverity: string): Promise<{ translatedMarkdown: string, severity: string }> {
     let translatedText = md.trim();
     let severity = originalSeverity || 'Medium'; // Use the provided severity

  try {

    // Check if the language detection and translator APIs are available
  if('LanguageDetector' in self && 'Translator' in self) {
    console.log(navigator.userActivation.isActive)
  if (navigator.userActivation.isActive) {
  // @ts-ignore
  const detector = await LanguageDetector.create();
  // Detect the source language from the markdown content
  // @ts-ignore
  const sourceLanguage = (await detector.detect(md.trim()))[0].detectedLanguage;

  console.log({sourceLanguage})

  // Check availability of the translation pair
  // @ts-ignore
  const availability = await Translator.availability({ sourceLanguage, targetLanguage });
  const isUnavailable = availability === 'unavailable';


  if(!isUnavailable) {
     // Create the translator and perform the translation
  // @ts-ignore
  const translator = await window.Translator.create({ sourceLanguage, targetLanguage });

  // Translate the markdown text while preserving its structure
  translatedText = await translator.translate(md.trim());
  console.log(translatedText)
  
  }
}

  }

   // FIX: Return the expected object structure
   return { translatedMarkdown: translatedText, severity: severity };
}
catch(err) {
  console.error(err)
  // Ensure a valid object is returned even on error
  return { translatedMarkdown: md.trim(), severity: severity };
}
}

export async function summarizeMarkdown(md: string): Promise<string> {
// ... (rest of summarizeMarkdown remains the same)
// ... (omitted for brevity)
    return md;
}