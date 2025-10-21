# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Retirement planning application built with Next.js 14, TypeScript, and AI capabilities.

## Supabase Configuration

**Project ID**: `xrtlrsovgqgivpbumany`
Always use this project_id when interacting with Supabase MCP tools.

## Tech Stack

### Core Framework
- **Next.js 14** (App Router) with TypeScript
- **React 18** with React DOM
- **Tailwind CSS** with PostCSS and Autoprefixer

### Voice & AI
- **Layercode WebRTC SDK** (@layercode/react-sdk, @layercode/node-server-sdk) - Real-time voice streaming
- **OpenAI** (GPT-4 via @ai-sdk/openai)
- **Google Gemini** (@ai-sdk/google, @google/generative-ai)
- **Vercel AI SDK** (ai package) - AI provider abstraction

### Database
- **Supabase** (@supabase/supabase-js) - PostgreSQL backend

### UI & Styling
- **Framer Motion** - Animations
- **Lucide React** - Icon system
- **clsx** + **tailwind-merge** - Utility for conditional CSS classes

### State Management
- **Zustand** - Lightweight state management

### Development Tools
- **TypeScript** (strict mode)
- **tsx** - TypeScript execution for scripts
- **dotenv** - Environment variable management

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Repository Structure

```
retire/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Homepage
│   │   └── globals.css   # Global styles with Tailwind
│   ├── components/       # React components
│   ├── lib/              # Business logic utilities
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── docs/                 # Documentation
└── .env.local.example    # Environment variable template
```

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Fill in your API keys and credentials:
   - **Layercode**: Pipeline ID and API keys from https://layercode.com
   - **OpenAI**: API key from https://platform.openai.com/api-keys
   - **Gemini**: API key from https://ai.google.dev/
   - **Supabase**: URL and keys from your Supabase project
3. Run `npm run dev` to start development

## Path Aliases

This project uses TypeScript path aliases:
- `@/*` maps to `./src/*`

Example: `import { MyComponent } from '@/components/MyComponent'`
