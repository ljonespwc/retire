/**
 * AI Provider Abstraction
 * Supports switchable OpenAI and Gemini providers via AI_PROVIDER environment variable
 */

import { OpenAI } from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  generateCompletion(
    messages: AIMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
      timeout?: number  // Timeout in ms (default: 10000)
    }
  ): Promise<string>
  generateStream(
    messages: AIMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
      timeout?: number  // Timeout in ms (default: 10000)
    }
  ): Promise<AsyncIterable<string>>
  getName(): string
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private aiSdkClient: ReturnType<typeof createOpenAI>

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.aiSdkClient = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async generateCompletion(
    messages: AIMessage[],
    options: { temperature?: number; maxTokens?: number; timeout?: number } = {}
  ): Promise<string> {
    const timeoutMs = options.timeout ?? 10000

    const completionPromise = this.client.chat.completions.create({
      model: 'gpt-4-1106-preview', // gpt-4.1-mini
      messages: messages as any,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 200
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timeout')), timeoutMs)
    })

    try {
      const completion = await Promise.race([completionPromise, timeoutPromise])
      return completion.choices[0].message.content?.trim() || ''
    } catch (error) {
      if (error instanceof Error && error.message === 'OpenAI request timeout') {
        console.error(`⏱️ OpenAI timeout after ${timeoutMs}ms`)
      }
      throw error
    }
  }

  async generateStream(
    messages: AIMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<AsyncIterable<string>> {
    // Separate system messages from conversation messages for Vercel AI SDK
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const { textStream } = streamText({
      model: this.aiSdkClient('gpt-4.1-mini'),
      system: systemMessage,
      messages: conversationMessages,
      temperature: options.temperature ?? 0.7
      // Note: Vercel AI SDK doesn't use maxTokens, responses are naturally brief
    })

    return textStream
  }

  getName(): string {
    return 'OpenAI (GPT-4.1-mini)'
  }
}

class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI
  private model: any
  private aiSdkClient: ReturnType<typeof createGoogleGenerativeAI>

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set')
    }
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.client.getGenerativeModel({
      model: 'gemini-2.5-flash-lite'
    })
    this.aiSdkClient = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  }

  async generateCompletion(
    messages: AIMessage[],
    options: { temperature?: number; maxTokens?: number; timeout?: number } = {}
  ): Promise<string> {
    const timeoutMs = options.timeout ?? 10000

    const completionPromise = (async () => {
      // Convert OpenAI format to Gemini format
      // Gemini doesn't have system messages, so we prepend them to the first user message
      const geminiMessages: any[] = []
      let systemContext = ''

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemContext += msg.content + '\n\n'
        } else if (msg.role === 'user') {
          const content = systemContext ? systemContext + msg.content : msg.content
          geminiMessages.push({
            role: 'user',
            parts: [{ text: content }]
          })
          systemContext = '' // Reset after using
        } else if (msg.role === 'assistant') {
          geminiMessages.push({
            role: 'model',
            parts: [{ text: msg.content }]
          })
        }
      }

      // If we only have system context and no user messages, create one
      if (systemContext && geminiMessages.length === 0) {
        geminiMessages.push({
          role: 'user',
          parts: [{ text: systemContext }]
        })
      }

      const chat = this.model.startChat({
        history: geminiMessages.slice(0, -1), // All but the last message
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 200,
        }
      })

      // Send the last message
      const lastMessage = geminiMessages[geminiMessages.length - 1]
      const result = await chat.sendMessage(lastMessage.parts[0].text)
      const response = await result.response

      return response.text().trim()
    })()

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini request timeout')), timeoutMs)
    })

    try {
      return await Promise.race([completionPromise, timeoutPromise])
    } catch (error) {
      if (error instanceof Error && error.message === 'Gemini request timeout') {
        console.error(`⏱️ Gemini timeout after ${timeoutMs}ms`)
      }
      throw error
    }
  }

  async generateStream(
    messages: AIMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<AsyncIterable<string>> {
    // Separate system messages from conversation messages for Vercel AI SDK
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const { textStream } = streamText({
      model: this.aiSdkClient('gemini-2.5-flash-lite'), // Fast Gemini model
      system: systemMessage,
      messages: conversationMessages,
      temperature: options.temperature ?? 0.7
      // Note: Vercel AI SDK doesn't use maxTokens, responses are naturally brief
    })

    return textStream
  }

  getName(): string {
    return 'Gemini (2.5-flash-lite)'
  }
}

// Singleton instances
let openaiProvider: OpenAIProvider | null = null
let geminiProvider: GeminiProvider | null = null

/**
 * Get the configured AI provider
 * Controlled by AI_PROVIDER environment variable ('openai' | 'gemini')
 * Defaults to 'openai'
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'openai'

  console.log(`🤖 Using AI Provider: ${provider}`)

  switch(provider) {
    case 'gemini':
      if (!geminiProvider) {
        geminiProvider = new GeminiProvider()
      }
      return geminiProvider

    case 'openai':
    default:
      if (!openaiProvider) {
        openaiProvider = new OpenAIProvider()
      }
      return openaiProvider
  }
}

/**
 * Helper to get provider name for logging
 */
export function getCurrentProviderName(): string {
  return getAIProvider().getName()
}
