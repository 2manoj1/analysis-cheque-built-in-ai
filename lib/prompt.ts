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

important: Follow the Given Schema and description carefully. 

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
): Promise<{ markdown: string; }> {
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
					"Provide a comprehensive analysis with clear Markdown sections: ### Visual Indicators, ### Data Consistency, ### Risk Assessment, and ### Suggested Actions.",
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


	return { markdown: md };
}

// CRITICAL FIX: The function must now return an object { translatedMarkdown: string }
export async function translate(
	md: string,
	targetLanguage: string
): Promise<{ translatedMarkdown: string; }> {
	let translatedText = md.trim();

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
		return { translatedMarkdown: translatedText };
	} catch (err) {
		console.error(err);
		// Ensure a valid object is returned even on error
		return { translatedMarkdown: md.trim() };
	}
}

export async function summarizeMarkdown(md: string): Promise<string> {
	// Check if Summarizer API is available
	if (!('Summarizer' in self)) {
		throw new Error('Chrome Summarizer API not available. Please use Chrome 138+ with AI features enabled.');
	}

	try {
		// Check API availability
		const availability = await Summarizer.availability();
		if (availability === 'unavailable') {
			throw new Error('Summarizer API is not available on this device.');
		}

		// Create summarizer instance with monitoring for download progress
		const summarizer = await Summarizer.create({
			type: 'teaser',
			format: 'plain-text',
			length: 'long',
			monitor(m: any) {
				m.addEventListener('downloadprogress', (e: any) => {
					console.log(`Summarizer model downloaded ${e.loaded * 100}%`);
				});
			}
		});

		// Generate summary
		const summary = await summarizer.summarize(md, {context: 'This summary is intended for an Indian banker audience.',});
		
		// Clean up
		summarizer.destroy();

		return summary;
	} catch (error: any) {
		console.error('Summarization error:', error);
		return md; // Fallback to original markdown on error
	}
}
