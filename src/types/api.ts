// API Types and Interfaces
// FIXED: Enhanced artifact types for streaming support

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  is_admin?: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  user?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  tools_used?: ToolUsage[];
  metadata?: MessageMetadata;
  artifacts?: Artifact[];  // Added for direct artifact access
}

export interface MessageMetadata {
  artifacts?: Artifact[];
  has_artifacts?: boolean;
  streaming?: boolean;
  complete?: boolean;
  parts?: any[];  // Added to support AI SDK parts format
}

// FIXED: Complete artifact type definition with streaming support
export interface Artifact {
  id: string;
  type: ArtifactType;
  language: string;
  code: string;
  title?: string;
  description?: string;
  start?: number;
  end?: number;
  complete?: boolean;  // Added: Track if artifact code block is complete during streaming
  render_config?: ArtifactRenderConfig;
}

// FIXED: Comprehensive artifact types including all streaming variations
export type ArtifactType = 
  | 'react' 
  | 'html' 
  | 'svg' 
  | 'mermaid' 
  | 'markdown' 
  | 'code' 
  | 'jsx'      // Added for React variants
  | 'tsx'      // Added for TypeScript React
  | 'javascript' 
  | 'typescript'  // Added
  | 'js' 
  | 'ts'       // Added
  | 'python'   // Added for code examples
  | 'json'     // Added for data
  | 'css'      // Added for styling
  | 'text';    // Added for plain text

export interface ArtifactRenderConfig {
  theme?: 'light' | 'dark';
  width?: string;
  height?: string;
  dependencies?: string[];
  autoRender?: boolean;  // Added: Control auto-rendering
  sandbox?: string[];    // Added: iframe sandbox permissions
}

export interface ToolUsage {
  tool: string;
  input: Record<string, any>;
  result_preview?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  conversation_type?: string;
  created_at: string;
  updated_at: string;
}

export interface AFLGenerateRequest {
  prompt: string;
  strategy_type?: 'standalone' | 'entry' | 'exit';
  settings?: {
    initial_equity?: number;
    max_positions?: number;
    trade_delays?: number[];
  };
  backtest_settings?: {
    initial_equity?: number;
    position_size?: string;
    position_size_type?: string;
    max_positions?: number;
    commission?: number;
    trade_delays?: [number, number, number, number];
    margin_requirement?: number;
  };
  conversation_id?: string;
  answers?: Record<string, string>;
  uploaded_file_ids?: string[];
}

export interface AFLCode {
  id: string;
  code: string;
  title: string;
  description: string;
  explanation?: string;
  strategy_type: string;
  stats?: {
    quality_score?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  filename: string;
  title?: string;
  category: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  document_id: string;
  content: string;
  relevance_score: number;
  filename: string;
}

export interface BacktestResult {
  id: string;
  strategy_id?: string;
  metrics: BacktestMetrics;
  analysis?: string;
  recommendations?: BacktestRecommendation[];
  total_return?: number;
  win_rate?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  created_at: string;
}

export interface BacktestMetrics {
  cagr?: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
  win_rate?: number;
  profit_factor?: number;
  total_trades?: number;
}

export interface BacktestRecommendation {
  priority: number;
  recommendation: string;
  expected_impact?: string;
  implementation?: string;
}

export interface Strategy {
  id: string;
  strategy_id?: string;      // Backend strategy ID (with underscore)
  conversation_id?: string;  // Backend conversation ID (with underscore)
  user_id?: string;
  query?: string;
  phase?: string;
  name?: string;
  description?: string;
  clarification_questions?: string;
  synthesis?: string;
  schematic?: any;
  code?: string;
  response?: string;  // Backend response message
  created_at: string;
  updated_at: string;
}

export interface BrainStats {
  total_documents: number;
  total_size: number;
  categories: Record<string, number>;
}

// ==================== TRAINING TYPES ====================

export type TrainingType = 'example' | 'rule' | 'pattern' | 'anti_pattern' | 'correction' | 'terminology';
export type TrainingCategory = 'afl' | 'general' | 'trading' | 'backtesting';

export interface TrainingData {
  id: string;
  training_type: TrainingType;
  title: string;
  input_prompt?: string;
  expected_output?: string;
  explanation?: string;
  category: TrainingCategory;
  tags?: string[];
  priority: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

export interface TrainingCreateRequest {
  training_type: TrainingType;
  title: string;
  input_prompt?: string;
  expected_output?: string;
  explanation?: string;
  category?: TrainingCategory;
  tags?: string[];
  priority?: number;
}

export interface QuickTrainRequest {
  what_to_learn: string;
  example_input?: string;
  example_output?: string;
  training_type?: TrainingType;
}

export interface CorrectionRequest {
  original_prompt: string;
  wrong_output: string;
  correct_output: string;
  feedback?: string;
}

export interface TrainingStats {
  total: number;
  active: number;
  by_type: Record<string, number>;
  by_category: Record<string, number>;
}

// ==================== FEEDBACK TYPES ====================

export type FeedbackType = 'correction' | 'improvement' | 'bug' | 'praise';
export type FeedbackStatus = 'pending_review' | 'reviewed' | 'implemented' | 'rejected';

export interface UserFeedback {
  id: string;
  user_id: string;
  code_id?: string;
  conversation_id?: string;
  original_prompt?: string;
  generated_code?: string;
  feedback_type: FeedbackType;
  feedback_text: string;
  correct_code?: string;
  rating?: number;
  status: FeedbackStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface FeedbackCreateRequest {
  code_id?: string;
  conversation_id?: string;
  original_prompt?: string;
  generated_code?: string;
  feedback_type: FeedbackType;
  feedback_text: string;
  correct_code?: string;
  rating?: number;
}

export interface FeedbackReviewRequest {
  status: FeedbackStatus;
  admin_notes?: string;
  create_training?: boolean;
}

// ==================== TRAINING SUGGESTION TYPES ====================

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'implemented';

export interface TrainingSuggestion {
  id: string;
  user_id: string;
  feedback_id?: string;
  title: string;
  description?: string;
  example_input?: string;
  example_output?: string;
  reason?: string;
  status: SuggestionStatus;
  admin_notes?: string;
  priority?: number;
  training_data_id?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface SuggestionCreateRequest {
  title: string;
  description?: string;
  example_input?: string;
  example_output?: string;
  reason?: string;
}

export interface SuggestionReviewRequest {
  status: SuggestionStatus;
  admin_notes?: string;
  priority?: number;
}

// ==================== ANALYTICS TYPES ====================

export interface AnalyticsOverview {
  users: {
    total: number;
    new_today?: number;
    active_today?: number;
  };
  code_generation: {
    total_codes: number;
    today?: number;
  };
  feedback: {
    total: number;
    average_rating?: number;
    corrections: number;
    praise: number;
    pending_review: number;
  };
  training: {
    total_examples: number;
    active_examples: number;
    pending_suggestions: number;
  };
}

export interface AnalyticsTrends {
  period: string;
  data: {
    date: string;
    users?: number;
    codes?: number;
    feedback?: number;
  }[];
}

export interface LearningCurve {
  period: string;
  data: {
    date: string;
    quality_score?: number;
    corrections?: number;
    codes_generated?: number;
  }[];
}

export interface PopularPattern {
  id: string;
  title: string;
  training_type: TrainingType;
  usage_count: number;
  category: TrainingCategory;
}

// ==================== ADMIN TYPES ====================

export interface AdminStatus {
  status: string;
  admin_id: string;
  stats: {
    total_users: number;
    total_documents: number;
    training: TrainingStats;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  codes_generated?: number;
  feedback_submitted?: number;
}

export interface AdminConfig {
  admin_emails: string[];
  features: Record<string, boolean>;
}

// ==================== TRAINING TEST TYPES ====================

export interface TrainingTestRequest {
  prompt: string;
  category?: TrainingCategory;
  include_training?: boolean;
}

export interface TrainingTestResult {
  without_training: {
    code: string;
    explanation?: string;
  };
  with_training: {
    code: string;
    explanation?: string;
  };
  training_context_used?: string;
  differences_detected: boolean;
}

export interface TrainingEffectiveness {
  total_corrections: number;
  correction_rate: number;
  quality_improvement: number;
  most_effective_rules: TrainingData[];
}

// ==================== KNOWLEDGE BASE TYPES ====================

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  training_type: TrainingType;
  category: TrainingCategory;
  relevance_score: number;
  excerpt?: string;
}

export interface KnowledgeCategory {
  name: string;
  count: number;
  description?: string;
}

export interface TrainingTypeInfo {
  type: TrainingType;
  description: string;
  count: number;
}

// ==================== STREAMING TYPES ====================

// ADDED: Types specific to streaming functionality
export interface StreamChunk {
  type: 'text' | 'data' | 'tool_call' | 'tool_result' | 'error' | 'finish';
  data: any;
}

export interface StreamTextChunk {
  type: 'text';
  data: string;
}

export interface StreamDataChunk {
  type: 'data';
  data: Artifact | Artifact[];
}

export interface StreamToolCallChunk {
  type: 'tool_call';
  data: {
    toolCallId: string;
    toolName: string;
    args: any;
  };
}

export interface StreamToolResultChunk {
  type: 'tool_result';
  data: {
    toolCallId: string;
    result: any;
  };
}

export interface StreamFinishChunk {
  type: 'finish';
  data: {
    finishReason: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
    };
  };
}

export interface StreamErrorChunk {
  type: 'error';
  data: string;
}

export type StreamMessage = 
  | StreamTextChunk 
  | StreamDataChunk 
  | StreamToolCallChunk 
  | StreamToolResultChunk 
  | StreamFinishChunk 
  | StreamErrorChunk;

// ==================== GENERAL API TYPES ====================

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

// ==================== HELPER TYPE GUARDS ====================

export function isReactArtifact(artifact: Artifact): boolean {
  return ['react', 'jsx', 'tsx'].includes(artifact.type);
}

export function isHtmlArtifact(artifact: Artifact): boolean {
  return artifact.type === 'html';
}

export function isSvgArtifact(artifact: Artifact): boolean {
  return artifact.type === 'svg';
}

export function isMermaidArtifact(artifact: Artifact): boolean {
  return artifact.type === 'mermaid';
}

export function isMarkdownArtifact(artifact: Artifact): boolean {
  return artifact.type === 'markdown';
}

export function isCodeArtifact(artifact: Artifact): boolean {
  const codeTypes = ['code', 'javascript', 'typescript', 'python', 'js', 'ts'];
  return codeTypes.includes(artifact.type);
}

export function isRenderableArtifact(artifact: Artifact): boolean {
  return isReactArtifact(artifact) || 
         isHtmlArtifact(artifact) || 
         isSvgArtifact(artifact) || 
         isMermaidArtifact(artifact);
}

// ==================== ARTIFACT UTILITIES ====================

export function createEmptyArtifact(type: ArtifactType = 'code'): Artifact {
  return {
    id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    language: type,
    code: '',
    complete: false,
  };
}

export function mergeArtifacts(existing: Artifact[], incoming: Artifact[]): Artifact[] {
  const artifactMap = new Map<string, Artifact>();
  
  // Add existing artifacts
  existing.forEach(artifact => {
    artifactMap.set(artifact.id, artifact);
  });
  
  // Merge or add incoming artifacts
  incoming.forEach(artifact => {
    artifactMap.set(artifact.id, artifact);
  });
  
  return Array.from(artifactMap.values());
}

export function isArtifactComplete(artifact: Artifact): boolean {
  return artifact.complete === true && artifact.code.length > 0;
}