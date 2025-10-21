/**
 * Voice interaction types for the conversational AI interface
 * Defines the structure of voice intents, conversation state, and responses
 */

import { BasicInputs, Assets, IncomeSources, Expenses, Assumptions } from './calculator';

/**
 * Types of intents that can be extracted from voice input
 */
export type VoiceIntentType =
  | 'greeting'
  | 'provide_basic_info'
  | 'provide_assets'
  | 'provide_income'
  | 'provide_expenses'
  | 'provide_assumptions'
  | 'modify_scenario'
  | 'run_calculation'
  | 'compare_scenarios'
  | 'ask_question'
  | 'request_explanation'
  | 'save_scenario'
  | 'load_scenario'
  | 'unclear'
  | 'goodbye';

/**
 * Extracted data from voice input based on intent type
 */
export type ExtractedData =
  | Partial<BasicInputs>
  | Partial<Assets>
  | Partial<IncomeSources>
  | Partial<Expenses>
  | Partial<Assumptions>
  | { question: string }
  | { modification: string }
  | { scenario_name: string }
  | null;

/**
 * Voice intent extracted from user speech
 */
export interface VoiceIntent {
  /** Type of intent detected */
  type: VoiceIntentType;
  /** Confidence score (0-1) of intent classification */
  confidence: number;
  /** Structured data extracted from the speech */
  extracted_data: ExtractedData;
  /** Raw transcribed text */
  raw_text: string;
}

/**
 * Steps in the conversation flow
 */
export type ConversationStep =
  | 'greeting'
  | 'collect_basic_info'
  | 'collect_assets'
  | 'collect_income'
  | 'collect_expenses'
  | 'collect_assumptions'
  | 'review_inputs'
  | 'show_results'
  | 'refine_scenario'
  | 'compare_scenarios'
  | 'completed';

/**
 * Clarification request for ambiguous or missing data
 */
export interface Clarification {
  /** Field that needs clarification */
  field: string;
  /** Question to ask the user */
  question: string;
  /** Type of data expected */
  expected_type: 'number' | 'text' | 'date' | 'boolean';
  /** Suggested values or range */
  suggestions?: string[];
}

/**
 * Partial scenario data collected during conversation
 */
export interface CollectedData {
  /** Basic inputs collected */
  basic_inputs?: Partial<BasicInputs>;
  /** Assets collected */
  assets?: Partial<Assets>;
  /** Income sources collected */
  income_sources?: Partial<IncomeSources>;
  /** Expenses collected */
  expenses?: Partial<Expenses>;
  /** Assumptions collected */
  assumptions?: Partial<Assumptions>;
}

/**
 * Current state of the conversation
 */
export interface ConversationState {
  /** Current step in the conversation flow */
  current_step: ConversationStep;
  /** Data collected so far */
  collected_data: CollectedData;
  /** Pending clarifications */
  pending_clarifications: Clarification[];
  /** Conversation history (for context) */
  history: VoiceIntent[];
  /** ID of the active scenario being worked on */
  active_scenario_id?: string;
  /** Whether user wants to compare scenarios */
  comparison_mode: boolean;
  /** IDs of scenarios being compared */
  comparison_scenario_ids?: string[];
}

/**
 * Voice response to be sent back to the user
 */
export interface VoiceResponse {
  /** Text to be spoken to the user */
  text: string;
  /** Optional audio URL (if using pre-recorded responses) */
  audio_url?: string;
  /** Whether to wait for user response */
  should_wait_for_response: boolean;
  /** Next expected intent types (for better recognition) */
  expected_intents?: VoiceIntentType[];
  /** Visual data to display alongside voice response */
  visual_data?: {
    /** Type of visualization */
    type: 'chart' | 'table' | 'summary' | 'comparison';
    /** Data for the visualization */
    data: any;
  };
}

/**
 * Voice session metadata
 */
export interface VoiceSession {
  /** Session ID */
  id: string;
  /** User ID */
  user_id: string;
  /** Conversation state */
  state: ConversationState;
  /** Session start time */
  started_at: string;
  /** Last activity time */
  last_activity_at: string;
  /** Whether session is active */
  is_active: boolean;
}

/**
 * Voice interaction event for analytics
 */
export interface VoiceInteractionEvent {
  /** Event timestamp */
  timestamp: string;
  /** Session ID */
  session_id: string;
  /** Intent detected */
  intent: VoiceIntent;
  /** Response given */
  response: VoiceResponse;
  /** Conversation step during event */
  step: ConversationStep;
  /** Duration of interaction in milliseconds */
  duration_ms: number;
}
