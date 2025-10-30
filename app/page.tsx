"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChequeUploader } from "@/components/cheque-uploader";
import { ChequeForm } from "@/components/cheque-form";
import { RemarksAudio } from "@/components/remarks-audio";
import { AnalysisPanel } from "@/components/analysis-panel";
import { useChequeSession } from "@/hooks/use-cheque-session";
import { isPromptAvailable } from "@/lib/prompt";
import { Logo } from "@/components/Logo";

const steps = [
	{ key: "upload", title: "Upload", subtitle: "Cheque front image" },
	{ key: "review", title: "Review", subtitle: "Update extracted fields" },
	{ key: "remarks", title: "Remarks", subtitle: "Add notes and audio" },
	{ key: "analysis", title: "Analysis", subtitle: "Run and translate" },
] as const;

export default function Page() {
	const [stepIndex, setStepIndex] = useState(0);
	const { data: session, reset } = useChequeSession();
	const [apiAvailable, setApiAvailable] = useState(false);

	useEffect(() => {
		const checkApiAvailability = async () => {
			// Check if Chrome API is available
			const available = await isPromptAvailable();
			setApiAvailable(available);
		};

		checkApiAvailability();
	}, []);

	const canNext = useMemo(() => {
		if (stepIndex === 0) return Boolean(session?.imageDataUrl);
		if (stepIndex === 1) return Boolean(session?.edited);
		if (stepIndex === 2) return true;
		return false;
	}, [stepIndex, session]);

	const handleStartOver = () => {
		reset();
		setStepIndex(0);
	};

	const showInstructions = () => {
		alert(
			"To enable the Chrome API, please open a new tab and navigate to chrome://flags. Search for the relevant API and enable it."
		);
	};

	return (
		<main className="min-h-screen bg-background text-foreground flex flex-col">
			{/* Full-width glassy app header (minimal: icon + name + badge) */}
			<header className="w-full bg-white/4 backdrop-blur-md border-b border-white/8 shadow-sm">
				<div className="mx-auto w-full max-w-5xl px-6 py-4 flex items-center gap-4">
					<span
						className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-transparent shadow-sm ring-1 ring-white/6"
						aria-hidden="true"
					>
						<Logo className="w-14 h-14" />
					</span>

					<div className="flex items-center gap-3">
						<h1 className="text-lg md:text-xl font-semibold tracking-tight">
							ChequeAI
						</h1>
						<span className="text-[11px] font-semibold uppercase px-2 py-1 rounded-full bg-white/6 text-muted-foreground">
							Beta
						</span>
					</div>
				</div>
			</header>

			{/* Centered page content container (fluid header above, content aligned center) */}
			<div className="mx-auto w-full max-w-5xl px-6 py-4 flex-1">
				{/* Sub-header (separate from app header) */}
				<div className="mb-6">
					<h2 className="text-2xl md:text-3xl font-semibold">
						Cheque Review & Visual Analysis
					</h2>
					<p className="text-sm text-muted-foreground mt-2 max-w-xl">
						Fast, private cheque intelligence — on‑device AI that keeps your data
						local.
					</p>
				</div>

				{/* Main content */}
				{!apiAvailable ? (
					<Card className="w-full p-4 md:p-6 bg-card text-card-foreground">
						<div className="flex justify-center">
							<Button onClick={showInstructions}>Enable Chrome API</Button>
						</div>
					</Card>
				) : (
					<Card className="w-full p-4 md:p-6 bg-card text-card-foreground">
						<div className="flex flex-col gap-4">
							<nav
								aria-label="Progress"
								className="grid grid-cols-1 md:grid-cols-4 gap-3"
							>
								{steps.map((s, i) => {
									const active = i === stepIndex;
									const completed = i < stepIndex;
									return (
										<div
											key={s.key}
											className={`w-full rounded-md border p-3 transition-colors ${
												active
													? "bg-primary text-primary-foreground"
													: "bg-secondary text-secondary-foreground"
											}`}
										>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">{s.title}</span>
												{completed ? (
													<Badge
														className="w-14 text-center"
														variant={
															active ? "secondary" : "default"
														}
													>
														Done
													</Badge>
												) : (
													<Badge
														className="w-8 text-center"
														variant={
															active ? "secondary" : "outline"
														}
													>
														{i + 1}
													</Badge>
												)}
											</div>
											<p
												className={`text-xs mt-1 ${
													active ? "opacity-90" : "text-muted-foreground"
												}`}
											>
												{s.subtitle}
											</p>
										</div>
									);
								})}
							</nav>

							<Separator />

							<section aria-live="polite">
								{stepIndex === 0 && (
									<ChequeUploader onNext={() => setStepIndex(1)} />
								)}
								{stepIndex === 1 && <ChequeForm />}
								{stepIndex === 2 && <RemarksAudio />}
								{stepIndex === 3 && <AnalysisPanel />}
							</section>

							<Separator />

							<div className="flex items-center justify-between">
								<Button
									variant="outline"
									onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
									disabled={stepIndex === 0}
								>
									Back
								</Button>

								<div className="flex items-center gap-2">
									{stepIndex < steps.length - 1 ? (
										<Button
											onClick={() =>
												setStepIndex((i) => Math.min(steps.length - 1, i + 1))
											}
											disabled={!canNext}
										>
											Next
										</Button>
									) : (
										<Button variant="secondary" onClick={handleStartOver}>
											Start Over
										</Button>
									)}
								</div>
							</div>
						</div>
					</Card>
				)}
			</div>
			<footer className="mt-8 border-t pt-4">
				<div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
					<span>© {new Date().getFullYear()} ChequeAI</span>
					<span className="mx-2">•</span>
					<span>Offline-first, on-device analysis</span>
				</div>
			</footer>
		</main>
	);
}
