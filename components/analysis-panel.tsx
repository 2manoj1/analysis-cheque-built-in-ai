"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChequeSession } from "@/hooks/use-cheque-session";
import { analyzeCheque, isPromptAvailable, translate, summarizeMarkdown } from "@/lib/prompt";
import {
	Languages,
	Sparkles,
	Loader2,
} from "lucide-react";

// --- Language Configuration ---
const SUPPORTED_LANGUAGES = [
	{ code: "en", name: "English" },
	{ code: "hi", name: "हिन्दी (Hindi)" },
	{ code: "bn", name: "বাংলা (Bengali)" },
	{ code: "ta", name: "தமிழ் (Tamil)" },
	{ code: "kn", name: "ಕನ್ನಡ (Kannada)" },
	{ code: "mr", name: "मराठी (Marathi)" },
];

// Function to generate summary from full markdown
async function generateSummary(markdown: string): Promise<string> {
	const summary = await summarizeMarkdown(markdown);
	return summary ?? "No summary available.";
}

// --- AnalysisPanel Component ---
export function AnalysisPanel() {
	const { data: session, update } = useChequeSession();
	const [busy, setBusy] = useState(false);
	const [selectedLanguage, setSelectedLanguage] = useState("en");
	const [englishSummary, setEnglishSummary] = useState("");
	const [translatedSummary, setTranslatedSummary] = useState("");
	const [showSummary, setShowSummary] = useState(false);
	const [summaryLoading, setSummaryLoading] = useState(false);
	const [translateLoading, setTranslateLoading] = useState(false);

	// Generate English summary from full markdown
	const handleGenerateSummary = async () => {
		if (!session?.analysisMarkdown) {
			alert("No analysis report available. Please run analysis first.");
			return;
		}

		try {
			setSummaryLoading(true);
			const summary = await generateSummary(session.analysisMarkdown);
			setEnglishSummary(summary);
			setTranslatedSummary(summary); // Default to English
			setShowSummary(true);
			setSelectedLanguage("en"); // Reset to English
		} catch (e: any) {
			alert(`Error generating summary: ${e?.message || "unknown error"}`);
			console.error("Summary generation error:", e);
		} finally {
			setSummaryLoading(false);
		}
	};

	// Translate the English summary to selected language
	const handleTranslateSummary = async (targetLanguage: string) => {
		if (!englishSummary) {
			alert("Please generate summary first.");
			return;
		}

		if (targetLanguage === "en") {
			setTranslatedSummary(englishSummary);
			return;
		}

		try {
			setTranslateLoading(true);
			const { translatedMarkdown } = await translate(
				englishSummary,
				targetLanguage
			);
			setTranslatedSummary(translatedMarkdown);
		} catch (e: any) {
			if (e.message.includes("user gesture")) {
				alert("Translation requires a user action. Please try again.");
			} else {
				alert(`Translation error: ${e?.message || "unknown error"}`);
			}
			console.error("Translation error:", e);
		} finally {
			setTranslateLoading(false);
		}
	};

	// Language change handler
	const handleLanguageChange = async (
		e: React.ChangeEvent<HTMLSelectElement>
	) => {
		const newLanguage = e.target.value;
		setSelectedLanguage(newLanguage);
		
		if (englishSummary) {
			await handleTranslateSummary(newLanguage);
		}
	};


	// Cleanup speech on unmount
	useEffect(() => {
		return () => {
			window.speechSynthesis.cancel();
		};
	}, []);

	const onAnalyze = async () => {
		const ok = await isPromptAvailable();
		if (!ok) {
			alert(
				"Chrome Prompt API not available. Please enable it in Chrome Canary."
			);
			return;
		}
		if (!session?.imageDataUrl || !session?.edited) {
			alert("Missing image or form data.");
			return;
		}

		try {
			setBusy(true);
			// Reset summary when running new analysis
			setEnglishSummary("");
			setTranslatedSummary("");
			setShowSummary(false);
			
			const imgBlob = await (await fetch(session.imageDataUrl)).blob();
			const audioBlob = session.audioDataUrl
				? await (await fetch(session.audioDataUrl)).blob()
				: undefined;

			const { markdown } = await analyzeCheque(
				imgBlob,
				session.edited,
				session.remarks || "",
				audioBlob
			);

			if (typeof markdown !== "string") {
				throw new Error("Expected markdown to be a string");
			}

			await update({ analysisMarkdown: markdown });
		} catch (e: any) {
			const errorMsg = `Error: ${e?.message || "unable to analyze"}`;
			await update({ analysisMarkdown: errorMsg });
		} finally {
			setBusy(false);
		}
	};

	return (
		<Card className="p-6 bg-card text-card-foreground">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-xl font-semibold">
							Cheque Review & Visual Analysis
						</h2>
						<p className="text-sm text-muted-foreground mt-1">
							Combines cheque image + updated fields + banker remarks
							(on-device).
						</p>
					</div>
					<Button onClick={onAnalyze} disabled={busy}>
						{busy ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Analyzing...
							</>
						) : (
							"Run Analysis"
						)}
					</Button>
				</div>

				{/* Full Analysis Report */}
				{session?.analysisMarkdown && (
					<section className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Full Analysis Report</h3>
							<Button
								onClick={handleGenerateSummary}
								disabled={summaryLoading}
								variant="outline"
								size="sm">
								{summaryLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Generating...
									</>
								) : (
									<>
										<Sparkles className="w-4 h-4 mr-2" />
										Generate Summary
									</>
								)}
							</Button>
						</div>
						
						<div className="bg-secondary/30 rounded-lg p-6 border">
							<article className="prose prose-sm prose-slate max-w-none dark:prose-invert">
								<ReactMarkdown>{session.analysisMarkdown}</ReactMarkdown>
							</article>
						</div>
						
						<p className="text-xs text-muted-foreground italic">
							Generated via on-device language model analysis
						</p>
					</section>
				)}

				{/* Summary Section */}
				{showSummary && englishSummary && (
					<section className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Summary</h3>
							<div className="flex items-center gap-3">
								{/* Language Selection */}
								<div className="flex items-center gap-2">
									<Languages className="w-4 h-4 text-muted-foreground" />
									<select
										id="language-select"
										value={selectedLanguage}
										onChange={handleLanguageChange}
										className="p-2 border rounded-md shadow-sm text-sm bg-background"
										disabled={translateLoading}>
										{SUPPORTED_LANGUAGES.map((lang) => (
											<option key={lang.code} value={lang.code}>
												{lang.name}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						<div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
							{translateLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
									<span className="ml-2 text-sm text-muted-foreground">
										Translating to{" "}
										{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}...
									</span>
								</div>
							) : (
								<article className="prose prose-sm prose-slate max-w-none dark:prose-invert">
									<ReactMarkdown>{translatedSummary}</ReactMarkdown>
								</article>
							)}
						</div>

						<p className="text-xs text-muted-foreground italic">
							Summary generated and translated via on-device AI
						</p>
					</section>
				)}
			</div>
		</Card>
	);
}