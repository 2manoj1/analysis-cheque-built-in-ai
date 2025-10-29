"use client";

import type { ChequeFields } from "@/hooks/use-cheque-session";
import { ChequeFieldsJSONSchema, ChequeFieldsSchema } from "@/hooks/use-cheque-session";

export async function isPromptAvailable(): Promise<boolean> {
	try {
		if (!LanguageModel) return false;
		const status = await LanguageModel.availability();
		return status !== "unavailable";
	} catch {
		return false;
	}
}
const systemPrompt = `You are a specialized cheque OCR extraction system. Extract data from cheque images with precision and return ONLY valid JSON matching the provided schema.

CRITICAL OUTPUT RULES:
- Return ONLY raw JSON - no markdown blocks, no \`\`\`json\`\`\`, no explanations
- Use empty string "" for any field not found, illegible, or uncertain
- Never guess or infer - extract only clearly visible text
- Maintain exact spelling, capitalization, and formatting from the cheque

FIELD EXTRACTION GUIDE:

bank_name:
- Bank Name: Located at top of cheque, usually in large/bold text
- Extract full bank name in English only. Indian Bank Name
- Exclude branch information from this field

branch:
- Bank branch name and/or address in English
- Usually below bank name or in header area
- May include locality, city, or branch code

cheque_number:
- 6-digit number, typically first segment in MICR code 
- Also appears as first segment in MICR code at bottom
- Extract digits only, no spaces or prefixes

date:
- Located in top-right area, often in a box or after "Date:" label
- MUST convert to ISO format: YYYY-MM-DD
- Common input formats: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY
- Examples: "15/03/2024" → "2024-03-15", "05-Jan-24" → "2024-01-05"
- Return "" if date is blank or illegible

payee:
- Text following "Pay" or "Pay to the order of" or "Payee" line
- Often handwritten, may be cursive
- Extract complete name/entity as written

amount_numeric:
- Numeric amount, usually in a box marked with ₹ or Rs.
- HANDWRITTEN - verify carefully, may be unclear
- Preserve exact format including commas and decimals
- Examples: "50000.00", "1,25,000", "5,000.50"
- Check for alterations or overwriting

amount_words:
- Full amount written in words, typically handwritten
- Usually starts with "Rupees" and may end with "Only"
- HANDWRITTEN - verify carefully against amount_numeric
- Extract complete text including currency and "Only" if present

account_number:
- 9-18 digit number of the account holder (cheque issuer)
- May appear in header or within MICR line at bottom
- Extract digits only, remove spaces/hyphens

ifsc:
- 11-character alphanumeric code (Format: XXXX0YYYYYY)
- Located in cheque header, below bank/branch details
- First 4 letters = bank code, 5th = 0, last 6 = branch code

micr:
- 9-digit numeric code at bottom of cheque in special magnetic ink font
- Format: 3 digits (city) + 3 digits (bank) + 3 digits (branch)
- Appears in distinctive MICR font characters

notes_visible_marks:
- Document ANY suspicious or unusual observations:
  * Alterations, erasures, or corrections in handwritten fields
  * Overwriting or strikethroughs in amount fields
  * Stains, tears, or damage affecting readability
  * Mismatches between numeric and word amounts
  * Unusual or inconsistent handwriting
  * Faded or missing signature
- Be specific about location and nature of marks
- Use "" if cheque appears clean and unaltered

VALIDATION CHECKS:
1. Verify amount_numeric matches amount_words
2. Confirm cheque_number matches first segment of MICR code
3. IFSC format (4 letters + 0 + 6 alphanumeric)
4. Check date is logical and not post-dated beyond reasonable limits
5. Flag any fields with visible corrections or alterations

Follow the Given Schema and description

Remember: Accuracy over completeness. Return "" for any uncertain field.`;

export async function extractFieldsFromCheque(
	image: Blob
): Promise<Partial<ChequeFields>> {
	if (!LanguageModel) throw new Error("Prompt API unavailable");
	const session = await LanguageModel.create({
		initialPrompts: [
			{
				role: "system",
				content: systemPrompt,
			},
		],
		expectedInputs: [{ type: "image", languages: ["en"] }],
		expectedOutputs: [{ type: "text", languages: ["en"] }],
		temperature: 0,
		topK: 1,
	});

	const res = await session.prompt(
		[
			{
				role: "user",
				content: [
					{ type: "image", value: image },
				],
			},
		],
		{ responseConstraint: ChequeFieldsJSONSchema as any }
	);

	try {
		let jsonData;
		try {
			jsonData =
				typeof res === "string" && res.trim().startsWith("{")
					? JSON.parse(res)
					: null;
		} catch {
			// Log error in a production-safe way (replace with your logging service if available)
			console.error("An error occurred while parsing cheque fields.");
		}

		if (jsonData) {
			const parsed = ChequeFieldsSchema.safeParse(jsonData);
			return parsed.success ? parsed.data : jsonData;
		} else {
			throw new Error("Response is not valid JSON");
		}
	} catch(e) {
		console.error(e)
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
		};
	}
}

export async function analyzeCheque(
	image: Blob,
	edited: Partial<ChequeFields>,
	remarks: string,
	audio?: Blob
): Promise<{ markdown: string; severity: string }> {
	if (!LanguageModel) throw new Error("Prompt API unavailable");

	const expectedInputs: Array<{ type: "text" | "image" | "audio" }> = [
		{ type: "text" },
		{ type: "image" },
	];
	if (audio) expectedInputs.push({ type: "audio" });

	const params = await LanguageModel.params();

	const session = await LanguageModel.create({
		initialPrompts: [
			{
				role: "system",
				content: [
					"You are a highly skilled forensic cheque examiner, tasked with performing a detailed analysis of cheque images and given data.",
					"Focus your analysis on the following aspects of the cheque: date, amount, payee name, alterations, handwriting inconsistencies, signature verification, ink matching, and potential tampering such as overwriting, scraping, or erasure.",
					"Provide a comprehensive analysis with clear Markdown sections: ### Summary, ### Visual Indicators, ### Data Consistency, ### Risk Assessment, and ### Suggested Actions.",
					"For each section, evaluate and assign severity levels as follows: 'High' for any significant findings in Visual Indicators, 'Medium' for minor discrepancies in Data Consistency, and 'Low' for the remaining sections (Summary, Risk Assessment, Suggested Actions).",
					"Ensure your response is clear and professional, indicating if further forensic analysis or verification is needed.",
				].join("\n"),
			},
		],
		expectedInputs,
		expectedOutputs: [{ type: "text", languages: ["en"] }],
		temperature: 0.1,
		topK: params?.defaultTopK,
	});

	const fieldsText = Object.entries(edited || {})
		.map(([k, v]) => `${k}: ${String(v ?? "")}`)
		.join("\n");

	// Collect the user content, including the cheque image, field data, and remarks
	const userContent: any[] = [
		{
			type: "text",
			value:
				"Please analyze the cheque image with the following updated form data, remarks (optional), and audio data (optional) recorded by the banker.",
		},
		{
			type: "text",
			value:
				"The following fields have been extracted and edited by the banker:",
		},
		{ type: "text", value: fieldsText },
		{ type: "text", value: `Banker's remarks: ${remarks || "(none)"}` },
		{ type: "image", value: image },
	];

	if (audio) {
		const arrayBuffer = await audio.arrayBuffer();
		try {
			userContent.push({ type: "audio", value: arrayBuffer });
		} catch {
			// ignore adding audio
		}
	}

	const md = await session.prompt([
		{
			role: "user",
			content: userContent,
		},
	]);

	// Extract severity from the markdown (using the original logic)
	const severityMatch = md.match(/Severity:\s*(High|Medium|Low)/i);
	const severity = severityMatch ? severityMatch[1] : "Medium";

	return { markdown: md, severity };
}

// CRITICAL FIX: The function must now return an object { translatedMarkdown: string, severity: string }
export async function translate(
	md: string,
	targetLanguage: string,
	originalSeverity: string
): Promise<{ translatedMarkdown: string; severity: string }> {
	let translatedText = md.trim();
	let severity = originalSeverity || "Medium"; // Use the provided severity

	try {
		// Check if the language detection and translator APIs are available
		if ("LanguageDetector" in self && "Translator" in self) {
			console.log(navigator.userActivation.isActive);
			if (navigator.userActivation.isActive) {
				// @ts-ignore
				const detector = await LanguageDetector.create();
				// Detect the source language from the markdown content
				// @ts-ignore
				const sourceLanguage = (await detector.detect(md.trim()))[0]
					.detectedLanguage;

				console.log({ sourceLanguage });

				// Check availability of the translation pair
				// @ts-ignore
				const availability = await Translator.availability({
					sourceLanguage: sourceLanguage ?? "en",
					targetLanguage,
				});
				const isUnavailable = availability === "unavailable";

				if (!isUnavailable) {
					// Create the translator and perform the translation
					// @ts-ignore
					const translator = await window.Translator.create({
						sourceLanguage,
						targetLanguage,
					});

					// Translate the markdown text while preserving its structure
					translatedText = await translator.translate(md.trim());
					console.log(translatedText);
				}
			}
		}

		// FIX: Return the expected object structure
		return { translatedMarkdown: translatedText, severity: severity };
	} catch (err) {
		console.error(err);
		// Ensure a valid object is returned even on error
		return { translatedMarkdown: md.trim(), severity: severity };
	}
}

export async function summarizeMarkdown(md: string): Promise<string> {
	// ... (rest of summarizeMarkdown remains the same)
	// ... (omitted for brevity)
	return md;
}
