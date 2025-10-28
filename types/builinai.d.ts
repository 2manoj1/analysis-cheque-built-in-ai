export {}

// ============================================================================
// W3C Prompt API - Complete TypeScript Definitions
// Based on: https://webmachinelearning.github.io/prompt-api
// ============================================================================

// Core Enums
type LanguageModelMessageRole = "system" | "user" | "assistant"
type LanguageModelMessageType = "text" | "image" | "audio"
type Availability = "unavailable" | "downloadable" | "downloading" | "available"

// Message Value Types
type ImageBitmapSource = ImageBitmap | Blob | ImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas
type LanguageModelMessageValue = ImageBitmapSource | AudioBuffer | BufferSource | string

// Message Content
interface LanguageModelMessageContent {
  type: LanguageModelMessageType
  value: LanguageModelMessageValue
}

// Message Structure
interface LanguageModelMessage {
  role: LanguageModelMessageRole
  content: string | LanguageModelMessageContent[]
  prefix?: boolean
}

// Prompt Input (can be shorthand string or full message array)
type LanguageModelPrompt = LanguageModelMessage[] | string

// Tool Function
type LanguageModelToolFunction = (...args: any[]) => Promise<string>

// Tool Definition
interface LanguageModelTool {
  name: string
  description: string
  inputSchema: object // JSON Schema
  execute: LanguageModelToolFunction
}

// Expected Input/Output Types
interface LanguageModelExpected {
  type: LanguageModelMessageType
  languages?: string[] // BCP 47 language tags
}

// Create Options
interface LanguageModelCreateCoreOptions {
  topK?: number
  temperature?: number
  expectedInputs?: LanguageModelExpected[]
  expectedOutputs?: LanguageModelExpected[]
  tools?: LanguageModelTool[]
}

interface LanguageModelCreateOptions extends LanguageModelCreateCoreOptions {
  signal?: AbortSignal
  monitor?: CreateMonitorCallback
  initialPrompts?: LanguageModelMessage[]
}

// Prompt Options
interface LanguageModelPromptOptions {
  responseConstraint?: object // JSON Schema
  omitResponseConstraintInput?: boolean
  signal?: AbortSignal
}

// Append Options
interface LanguageModelAppendOptions {
  signal?: AbortSignal
}

// Clone Options
interface LanguageModelCloneOptions {
  signal?: AbortSignal
}

// Model Parameters
interface LanguageModelParams {
  readonly defaultTopK: number
  readonly maxTopK: number
  readonly defaultTemperature: number
  readonly maxTemperature: number
}

// Monitor Callback for download progress
type CreateMonitorCallback = (monitor: {
  addEventListener: (
    type: "downloadprogress",
    listener: (event: { loaded: number; total: number }) => void
  ) => void
}) => void

// ============================================================================
// Main LanguageModel Interface
// ============================================================================

interface LanguageModel extends EventTarget {
  // Instance Methods
  
  /**
   * Prompts the language model and returns the complete response.
   * @throws {DOMException} NotSupportedError if role = "system" in non-initial prompts
   */
  prompt(
    input: LanguageModelPrompt,
    options?: LanguageModelPromptOptions
  ): Promise<string>

  /**
   * Prompts the language model and returns a streaming response.
   * @returns ReadableStream that yields string chunks
   * @throws {DOMException} NotSupportedError if role = "system" in non-initial prompts
   */
  promptStreaming(
    input: LanguageModelPrompt,
    options?: LanguageModelPromptOptions
  ): ReadableStream<string>

  /**
   * Appends messages to the session context without getting a response.
   * Useful for preprocessing or providing additional context.
   * @throws {DOMException} NotSupportedError if role = "system"
   */
  append(
    input: LanguageModelPrompt,
    options?: LanguageModelAppendOptions
  ): Promise<void>

  /**
   * Measures how much of the input quota would be used by a prompt.
   * Does not actually execute the prompt.
   */
  measureInputUsage(
    input: LanguageModelPrompt,
    options?: LanguageModelPromptOptions
  ): Promise<number>

  /**
   * Current amount of input quota used by this session.
   */
  readonly inputUsage: number

  /**
   * Maximum input quota available for this session.
   * Can be Infinity if unlimited.
   */
  readonly inputQuota: number

  /**
   * Event handler for when the input quota is exceeded.
   */
  onquotaoverflow: ((this: LanguageModel, ev: Event) => any) | null

  /**
   * The top-K sampling parameter for this session.
   */
  readonly topK: number

  /**
   * The temperature parameter for this session.
   */
  readonly temperature: number

  /**
   * Creates a clone of this session with the same initial prompts
   * but reset conversation context.
   */
  clone(options?: LanguageModelCloneOptions): Promise<LanguageModel>

  /**
   * Destroys the session and frees resources.
   * The session cannot be used after calling this method.
   */
  destroy(): void

  // Event Target methods (inherited)
  addEventListener<K extends keyof LanguageModelEventMap>(
    type: K,
    listener: (this: LanguageModel, ev: LanguageModelEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof LanguageModelEventMap>(
    type: K,
    listener: (this: LanguageModel, ev: LanguageModelEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
}

// Event Map for LanguageModel
interface LanguageModelEventMap {
  quotaoverflow: Event
}

// ============================================================================
// Static Members (Constructor Interface)
// ============================================================================

interface LanguageModelConstructor {
  prototype: LanguageModel

  /**
   * Creates a new language model session.
   * @throws {DOMException} Various errors depending on availability and options
   */
  create(options?: LanguageModelCreateOptions): Promise<LanguageModel>

  /**
   * Checks if the language model is available.
   * - "readily": Model is ready to use immediately
   * - "after-download": Model needs to be downloaded first
   * - "no": Model is not available
   */
  availability(options?: LanguageModelCreateCoreOptions): Promise<Availability>

  /**
   * Returns the default and maximum parameters for the language model.
   * Returns null if the model is not available.
   */
  params(): Promise<LanguageModelParams | null>
}

// ============================================================================
// Global Window Interface Extension
// ============================================================================

declare global {
  interface Window {
    LanguageModel: LanguageModelConstructor
    Summarizer?: any
    LanguageDetector?: any // ADDED: Ensure LanguageDetector is declared
    Translator?: any // ADDED: Ensure Translator is declared
  }

  // Also available in secure contexts
  const LanguageModel: LanguageModelConstructor
}
