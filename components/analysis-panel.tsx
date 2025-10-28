"use client"

import { JSX, useState, useMemo, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useChequeSession } from "@/hooks/use-cheque-session"
import { analyzeCheque, isPromptAvailable, translate } from "@/lib/prompt" 
import { AlertTriangle, XCircle, FileWarning, LucideIcon, Languages } from "lucide-react"

// Define the structure for a risk issue
export type RiskIssue = {
  id: number;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
};

// --- Helper Functions (getRiskStyles, RiskIssueCard, CustomHeading) ---

const getRiskStyles = (severity: RiskIssue['severity']): { icon: LucideIcon, color: string, borderColor: string, bgClass: string } => {
  switch (severity) {
    case 'High':
      return {
        icon: XCircle,
        color: 'text-red-600',
        borderColor: 'border-red-400',
        bgClass: 'bg-red-50/50',
      };
    case 'Medium':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        borderColor: 'border-yellow-400',
        bgClass: 'bg-yellow-50/50',
      };
    case 'Low':
      return {
        icon: FileWarning,
        color: 'text-blue-600',
        borderColor: 'border-blue-400',
        bgClass: 'bg-blue-50/50',
      };
    default:
      return { icon: FileWarning, color: 'text-gray-500', borderColor: 'border-gray-300', bgClass: 'bg-gray-50' };
  }
};

// Component to display each risk clearly
const RiskIssueCard = ({ title, description, severity }: RiskIssue) => {
  const { icon: Icon, color, borderColor, bgClass } = getRiskStyles(severity);

  return (
    <Card className={`p-4 border-l-4 ${borderColor} ${bgClass} flex gap-4 items-start shadow-sm`}>
      <div className={`p-2 rounded-full ${color} bg-white border border-dashed`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-semibold text-base">{title}</h4>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color} border ${borderColor}`}>
            {severity}
          </span>
        </div>
        <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="text-sm text-muted-foreground" {...props} />
              }}
            >
                {description}
            </ReactMarkdown>
        </div>
      </div>
    </Card>
  );
};

// Custom heading component (kept for stability)
const CustomHeading = ({ level, children }: { level: number, children?: React.ReactNode }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag className="custom-heading">{children}</Tag>;
};

// --- Language Configuration ---

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
];

// --- AnalysisPanel Component ---

export function AnalysisPanel() {
  const { data: session, update } = useChequeSession()
  const [busy, setBusy] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [fullTranslatedReport, setFullTranslatedReport] = useState(''); 
  const available = typeof window !== "undefined" ? !!(window as any).LanguageModel : false

  // Memoized function for translation using useCallback for stability
  const translateAndSaveReport = useCallback(async (markdown: string, targetLanguage: string, severity: string) => {
    if (!markdown) return setFullTranslatedReport('');
    
    try {
      // FIX: Destructure the object returned by translate() to get the string
      const { translatedMarkdown } = await translate(markdown, targetLanguage, severity);
      
      setFullTranslatedReport(translatedMarkdown); 

    } catch (e: any) {
      if (e.message.includes('user gesture')) {
        setFullTranslatedReport("Error: Translation components require a new user click (e.g., Run Analysis or change language) to finish downloading.");
      } else {
        setFullTranslatedReport(`Error: Could not process translation. ${e?.message || "unknown error"}`);
      }
      console.error("Error during translation:", e);
    }
  }, []); 

  // Language Dropdown Change Handler
  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);

    if (session?.analysisMarkdown) {
        setBusy(true);
        await translateAndSaveReport(session.analysisMarkdown, newLanguage, session.severity || 'Medium');
        setBusy(false);
    } else {
        setFullTranslatedReport('');
    }
  };
  
  // Initial load/analysis update effect
  useEffect(() => {
    if (session?.analysisMarkdown && fullTranslatedReport === '') {
        translateAndSaveReport(session.analysisMarkdown, selectedLanguage, session.severity || 'Medium');
    }
  }, [session?.analysisMarkdown, session?.severity, selectedLanguage, translateAndSaveReport, fullTranslatedReport]); 

  const onAnalyze = async () => {
    const ok = await isPromptAvailable()
    if (!ok) {
      alert("Chrome Prompt API not available. Please enable it in Chrome Canary.")
      return
    }
    if (!session?.imageDataUrl || !session?.edited) {
      alert("Missing image or form data.")
      return
    }
    
    try {
      setBusy(true)
      const imgBlob = await (await fetch(session.imageDataUrl)).blob()
      const audioBlob = session.audioDataUrl ? await (await fetch(session.audioDataUrl)).blob() : undefined

      const { markdown, severity } = await analyzeCheque(imgBlob, session.edited, session.remarks || "", audioBlob)
      
      if (typeof markdown !== 'string') {
        throw new Error("Expected markdown to be a string");
      }

      await translateAndSaveReport(markdown, selectedLanguage, severity);
      await update({ analysisMarkdown: markdown, severity: severity })

    } catch (e: any) {
      await update({ analysisMarkdown: `Error: ${e?.message || "unable to analyze"}` })
      setFullTranslatedReport(`Error: ${e?.message || "unable to analyze"}`)
    } finally {
      setBusy(false)
    }
  }

  // Function to parse the translated markdown and extract categories
  const parseMarkdownToCategories = (markdown: string, sessionSeverity: string): RiskIssue[] => {
    if (typeof markdown !== 'string') {
      console.error("Expected markdown to be a string for parsing");
      return [];
    }

    // Split aggressively by two newlines to separate the main sections (the safest way after translation)
    const sections = markdown.split(/\n\n+/);
    const risks: RiskIssue[] = [];
    
    // Helper to assign severity based on translated keyword
    const getSectionSeverity = (title: string): RiskIssue['severity'] => {
        const lowerTitle = title.toLowerCase();
        
        // Match keywords in any language to infer severity based on the section content type
        if (lowerTitle.includes("visual") || lowerTitle.includes("visuels") || lowerTitle.includes("indicators")) return 'High';
        if (lowerTitle.includes("data") || lowerTitle.includes("datos") || lowerTitle.includes("données") || lowerTitle.includes("consistency")) return 'Medium';
        if (lowerTitle.includes("risk") || lowerTitle.includes("riesgo") || lowerTitle.includes("risque")) return 'Medium';
        
        return 'Low'; 
    };

    sections.forEach((section, index) => {
        const cleanSection = section.trim();
        if (cleanSection.length === 0) return;

        // Use a regex to find the FIRST line that starts with ### (Markdown H3)
        // This regex is highly tolerant of leading whitespace/tabs before the hashes.
        const headerMatch = cleanSection.match(/^(\s*#+[\s\t]*)(.*)/);
        
        if (headerMatch && headerMatch[1].trim().startsWith('###')) { // Specifically target H3
            const titleWithHashes = headerMatch[0].trim(); // e.g., "### Summary"
            const title = headerMatch[2].trim();    // e.g., "Summary" or "Resumen"
            
            // Extract description: find the start of the description by slicing after the matched header line
            const description = cleanSection.substring(titleWithHashes.length).trim();
            
            if (title.length > 0) {
                 risks.push({
                    id: risks.length,
                    title: title,
                    description: description,
                    severity: getSectionSeverity(title),
                });
            }
        } 
    });

    // Fallback if structured parsing still failed, ensuring *something* shows up
    if (risks.length === 0 && markdown.length > 50) {
        risks.push({
            id: 0,
            title: `Full Analysis Report (Unstructured - Manual Review Required)`,
            description: markdown.trim(), 
            severity: sessionSeverity as RiskIssue['severity'],
        });
    }

    return risks;
  }

  // Use useMemo to parse the FULL TRANSLATED REPORT into cards
  const risks = useMemo(() => {
    return fullTranslatedReport ? parseMarkdownToCategories(fullTranslatedReport, session?.severity || 'Medium') : []
  }, [fullTranslatedReport, session?.severity])

  return (
    <Card className="p-4 bg-card text-card-foreground">
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Cheque Review & Visual Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Combines cheque image + updated fields + banker remarks {available ? "(on-device)" : ""}.
            </p>
          </div>
          <Button onClick={onAnalyze} disabled={busy}>
            {busy ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>

        {/* Language Selection Dropdown */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <label htmlFor="language-select" className="text-sm font-medium">
              Report Language:
            </label>
          </div>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={handleLanguageChange} 
            className="p-2 border rounded-md shadow-sm text-sm"
            disabled={busy}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Detailed Risk Indicators (Renders based on translated content) */}
        {risks.length > 0 && (
          <section className="bg-secondary rounded-md p-4 border">
            <h3 className="font-semibold text-xl mb-4">
                Full Analysis Report ({SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name})
            </h3>
            <div className="grid gap-3">
              {risks.map((risk) => (
                <RiskIssueCard key={risk.id} {...risk} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              This report is generated via **on-device language model analysis** and **on-device translation**. Each card represents a section from the full report.
            </p>
          </section>
        )}
      </div>
    </Card>
  )
}