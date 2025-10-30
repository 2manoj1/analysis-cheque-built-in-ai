import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
	title: "ChequeAI: Analysis Cheque",
	description:
		"A comprehensive application demonstrating secure, on-device cheque data analysis using Chrome's Built-in AI APIs.",
	keywords: "cheque, analysis, AI, secure, on-device",
	themeColor: "#ffffff",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
