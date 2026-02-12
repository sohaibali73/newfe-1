// API Client for communicating with the backend
// FULLY CORRECTED VERSION - All streaming fixes applied

import {
  User,
  AuthResponse,
  Message,
  Conversation,
  AFLGenerateRequest,
  AFLCode,
  Document,
  SearchResult,
  BacktestResult,
  Strategy,
  BrainStats,
  TrainingData,
  TrainingCreateRequest,
  QuickTrainRequest,
  CorrectionRequest,
  TrainingStats,
  TrainingCategory,
  TrainingType,
  UserFeedback,
  FeedbackCreateRequest,
  FeedbackReviewRequest,
  FeedbackStatus,
  TrainingSuggestion,
  SuggestionCreateRequest,
  SuggestionReviewRequest,
  SuggestionStatus,
  AnalyticsOverview,
  AnalyticsTrends,
  LearningCurve,
  PopularPattern,
  TrainingEffectiveness,
  AdminStatus,
  AdminUser,
  AdminConfig,
  TrainingTestRequest,
  TrainingTestResult,
  KnowledgeSearchResult,
  KnowledgeCategory,
  TrainingTypeInfo,
} from '@/types/api';

// FIXED: Correct production URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://potomac-analyst-workbench-production.up.railway.app');

class APIClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem('auth_token');
    } catch (e) {
      this.token = null;
    }
  }

  private setToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem('auth_token', token);
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  private getToken() {
    try {
      return localStorage.getItem('auth_token');
    } catch (e) {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    isFormData: boolean = false
  ): Promise<T> {
    const headers: HeadersInit = {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers,
      mode: 'cors',
      credentials: 'omit',
    };

    if (body) {
      if (isFormData) {
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`API Request: ${method} ${url}`);
      
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: `Request failed with status ${response.status}` 
        }));
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - API server may be unavailable:', API_BASE_URL);
        throw new Error(`Cannot connect to API server at ${API_BASE_URL}. Please check your internet connection or try again later.`);
      }
      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  async register(email: string, password: string, name: string, claudeApiKey: string, tavilyApiKey?: string) {
    const response = await this.request<AuthResponse>('/auth/register', 'POST', {
      email,
      password,
      name,
      claude_api_key: claudeApiKey,
      tavily_api_key: tavilyApiKey,
    });
    this.setToken(response.access_token);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<AuthResponse>('/auth/login', 'POST', {
      email,
      password,
    });
    this.setToken(response.access_token);
    return response;
  }

  async getCurrentUser() {
    return this.request<User>('/auth/me');
  }

  logout() {
    this.token = null;
    try {
      localStorage.removeItem('auth_token');
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  // ==================== AFL ENDPOINTS ====================

  async generateAFL(request: AFLGenerateRequest) {
    return this.request<AFLCode>('/afl/generate', 'POST', request);
  }

  async optimizeAFL(code: string) {
    return this.request<AFLCode>('/afl/optimize', 'POST', { code });
  }

  async debugAFL(code: string, errorMessage?: string) {
    return this.request<AFLCode>('/afl/debug', 'POST', {
      code,
      error_message: errorMessage,
    });
  }

  async explainAFL(code: string) {
    return this.request<{ explanation: string }>('/afl/explain', 'POST', { code });
  }

  async validateAFL(code: string) {
    return this.request<{ valid: boolean; errors?: string[] }>('/afl/validate', 'POST', { code });
  }

  async getAFLCodes() {
    return this.request<AFLCode[]>('/afl/codes');
  }

  async getAFLCode(codeId: string) {
    return this.request<AFLCode>(`/afl/codes/${codeId}`);
  }

  async deleteAFLCode(codeId: string) {
    return this.request<{ success: boolean }>(`/afl/codes/${codeId}`, 'DELETE');
  }

  // FIXED: Added missing AFL file upload endpoints
  async uploadAflFile(file: File, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);

    return this.request<{
      id: string;
      filename: string;
      description?: string;
      size: number;
      content_type: string;
      uploaded_at: string;
    }>('/afl/upload', 'POST', formData, true);
  }

  async getAflFiles() {
    return this.request<{
      id: string;
      filename: string;
      description?: string;
      size: number;
      content_type: string;
      uploaded_at: string;
    }[]>('/afl/files');
  }

  async getAflFile(fileId: string) {
    return this.request<{
      id: string;
      filename: string;
      description?: string;
      size: number;
      content_type: string;
      uploaded_at: string;
      content?: string;
    }>(`/afl/files/${fileId}`);
  }

  async deleteAflFile(fileId: string) {
    return this.request<{ success: boolean }>(`/afl/files/${fileId}`, 'DELETE');
  }

  // FIXED: Added missing AFL settings presets endpoints
  async saveSettingsPreset(preset: {
    name: string;
    description?: string;
    settings: any;
    is_default?: boolean;
  }) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }>('/afl/settings/presets', 'POST', preset);
  }

  async getSettingsPresets() {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }[]>('/afl/settings/presets');
  }

  async getSettingsPreset(presetId: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }>(`/afl/settings/presets/${presetId}`);
  }

  async updateSettingsPreset(presetId: string, updates: {
    name?: string;
    description?: string;
    settings?: any;
  }) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }>(`/afl/settings/presets/${presetId}`, 'PUT', updates);
  }

  async deleteSettingsPreset(presetId: string) {
    return this.request<{ success: boolean }>(`/afl/settings/presets/${presetId}`, 'DELETE');
  }

  async setDefaultPreset(presetId: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      settings: any;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    }>(`/afl/settings/presets/${presetId}/set-default`, 'POST');
  }

  // FIXED: Added missing AFL history endpoints
  async saveAflHistory(entry: {
    prompt: string;
    strategy_type?: string;
    settings?: any;
    generated_code: string;
    success: boolean;
    error_message?: string;
  }) {
    return this.request<{
      id: string;
      prompt: string;
      strategy_type?: string;
      settings?: any;
      generated_code: string;
      success: boolean;
      error_message?: string;
      created_at: string;
    }>('/afl/history', 'POST', entry);
  }

  async getAflHistory(limit: number = 50) {
    return this.request<{
      id: string;
      prompt: string;
      strategy_type?: string;
      settings?: any;
      generated_code: string;
      success: boolean;
      error_message?: string;
      created_at: string;
    }[]>(`/afl/history?limit=${limit}`);
  }

  async deleteAflHistory(historyId: string) {
    return this.request<{ success: boolean }>(`/afl/history/${historyId}`, 'DELETE');
  }

  // ==================== CHAT ENDPOINTS ====================

  async getConversations() {
    return this.request<Conversation[]>('/chat/conversations');
  }

  // FIXED: Added title and conversationType parameters to match backend
  async createConversation(title?: string, conversationType: string = 'agent') {
    return this.request<Conversation>('/chat/conversations', 'POST', {
      title: title || "New Conversation",
      conversation_type: conversationType
    });
  }

  async getMessages(conversationId: string) {
    return this.request<Message[]>(`/chat/conversations/${conversationId}/messages`);
  }

  async renameConversation(conversationId: string, title: string) {
    return this.request<any>(`/chat/conversations/${conversationId}`, 'PATCH', { title });
  }

  async deleteConversation(conversationId: string) {
    return this.request<{ success: boolean }>(`/chat/conversations/${conversationId}`, 'DELETE');
  }

  // FIXED: Correct return type matching backend response
  async sendMessage(content: string, conversationId?: string) {
    return this.request<{
      conversation_id: string;
      response: string;
      parts?: any[];
      tools_used?: any[];
      all_artifacts?: any[];
    }>('/chat/message', 'POST', {
      content,
      conversation_id: conversationId,
    });
  }

  /**
   * Send a message with streaming response using Vercel AI SDK Data Stream Protocol.
   * 
   * FULLY CORRECTED VERSION with proper endpoint and protocol parsing
   */
  async sendMessageStream(
    content: string,
    conversationId?: string,
    options?: {
      signal?: AbortSignal;
      onText?: (text: string) => void;
      onToolCall?: (toolCallId: string, toolName: string, args: any) => void;
      onToolResult?: (toolCallId: string, result: any) => void;
      onData?: (data: any) => void;
      onError?: (error: string) => void;
      onFinish?: (finishReason: string, usage: any) => void;
    }
  ): Promise<{ conversationId: string }> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // CRITICAL FIX: Use correct streaming endpoint
      const url = `${API_BASE_URL}/chat/stream`;
      console.log(`Streaming Request: POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        signal: options?.signal,
        body: JSON.stringify({
          content,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: `Request failed with status ${response.status}` 
        }));
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      // FIXED: Extract conversation ID from response headers
      const newConversationId = response.headers.get('X-Conversation-Id') || conversationId || '';

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines from buffer
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            // FIXED: Proper Vercel AI SDK protocol parsing
            // Format is "TYPE:JSON_DATA" where TYPE is a single character
            const typeCode = line[0];
            const content = line.substring(2); // Skip "TYPE:" prefix

            if (!content) continue;

            try {
              const parsed = JSON.parse(content);
              
              // FIXED: Route based on Vercel AI SDK protocol type codes
              switch (typeCode) {
                case '0': // Text Part
                  if (typeof parsed === 'string') {
                    options?.onText?.(parsed);
                  } else if (parsed.text) {
                    options?.onText?.(parsed.text);
                  }
                  break;

                case '2': // Data Part (Artifacts) - THIS IS THE KEY ONE
                  options?.onData?.(parsed);
                  break;

                case '3': // Error Part
                  console.error('Stream error:', parsed);
                  options?.onError?.(typeof parsed === 'string' ? parsed : parsed.message || 'Unknown error');
                  break;

                case '9': // Tool Call Part
                  if (parsed.toolCallId && parsed.toolName) {
                    options?.onToolCall?.(parsed.toolCallId, parsed.toolName, parsed.args || {});
                  }
                  break;

                case 'a': // Tool Result Part
                  if (parsed.toolCallId) {
                    options?.onToolResult?.(parsed.toolCallId, parsed.result);
                  }
                  break;

                case 'd': // Finish Message Part
                  if (parsed.finishReason) {
                    options?.onFinish?.(parsed.finishReason, parsed.usage || {});
                  }
                  break;

                case 'e': // Finish Step Part (currently unused)
                  break;

                default:
                  console.warn('Unknown stream type code:', typeCode, 'Content:', content.substring(0, 100));
              }
            } catch (parseError) {
              console.warn('Failed to parse protocol content:', content.substring(0, 100), parseError);
            }
          } catch (error) {
            console.error('Error processing line:', error);
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const typeCode = buffer[0];
          const content = buffer.substring(2);
          
          if (content) {
            const parsed = JSON.parse(content);
            
            if (typeCode === 'd' && parsed.finishReason) {
              options?.onFinish?.(parsed.finishReason, parsed.usage || {});
            } else if (typeCode === '2') {
              options?.onData?.(parsed);
            }
          }
        } catch (error) {
          console.error('Error processing final buffer:', error);
        }
      }

      // FIXED: Return conversation ID
      return { conversationId: newConversationId };

    } catch (error) {
      console.error('Stream error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      options?.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Upload file to conversation
   */
  async uploadFile(conversationId: string, formData: FormData) {
    const token = this.getToken();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/chat/conversations/${conversationId}/upload`,
      {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: 'Upload failed' 
      }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get the streaming endpoint URL for direct use
   */
  getStreamEndpoint(): string {
    return `${API_BASE_URL}/chat/stream`;
  }

  /**
   * Get the direct AI SDK v6 streaming endpoint URL
   */
  getStreamV6Endpoint(): string {
    return `${API_BASE_URL}/chat/v6`;
  }

  /**
   * Send a message using direct AI SDK Data Stream Protocol (v6 endpoint).
   * Bypasses the protocol translation wrapper for cleaner integration.
   */
  async sendMessageStreamV6(
    content: string,
    conversationId?: string,
    options?: {
      signal?: AbortSignal;
      onText?: (text: string) => void;
      onToolCall?: (toolCallId: string, toolName: string, args: any) => void;
      onToolResult?: (toolCallId: string, result: any) => void;
      onData?: (data: any) => void;
      onError?: (error: string) => void;
      onFinish?: (finishReason: string, usage: any) => void;
    }
  ): Promise<{ conversationId: string }> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Use direct v6 endpoint (bypasses protocol translation)
      const url = `${API_BASE_URL}/chat/v6`;
      console.log(`Direct V6 Streaming Request: POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        signal: options?.signal,
        body: JSON.stringify({
          content,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: `Request failed with status ${response.status}` 
        }));
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      // Extract conversation ID from response headers
      const newConversationId = response.headers.get('X-Conversation-Id') || conversationId || '';

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines from buffer
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            // Direct AI SDK Data Stream Protocol parsing
            // Format is "TYPE:JSON_DATA" where TYPE is a single character
            const typeCode = line[0];
            const content = line.substring(2); // Skip "TYPE:" prefix

            if (!content) continue;

            try {
              const parsed = JSON.parse(content);
              
              // Route based on AI SDK Data Stream Protocol type codes
              switch (typeCode) {
                case '0': // Text Part
                  if (typeof parsed === 'string') {
                    options?.onText?.(parsed);
                  } else if (parsed.text) {
                    options?.onText?.(parsed.text);
                  }
                  break;

                case '2': // Data Part (Artifacts)
                  options?.onData?.(parsed);
                  break;

                case '3': // Error Part
                  console.error('Stream error:', parsed);
                  options?.onError?.(typeof parsed === 'string' ? parsed : parsed.message || 'Unknown error');
                  break;

                case '9': // Tool Call Part
                  if (parsed.toolCallId && parsed.toolName) {
                    options?.onToolCall?.(parsed.toolCallId, parsed.toolName, parsed.args || {});
                  }
                  break;

                case 'a': // Tool Result Part
                  if (parsed.toolCallId) {
                    options?.onToolResult?.(parsed.toolCallId, parsed.result);
                  }
                  break;

                case 'd': // Finish Message Part
                  if (parsed.finishReason) {
                    options?.onFinish?.(parsed.finishReason, parsed.usage || {});
                  }
                  break;

                case 'e': // Finish Step Part (currently unused)
                  break;

                default:
                  console.warn('Unknown stream type code:', typeCode, 'Content:', content.substring(0, 100));
              }
            } catch (parseError) {
              console.warn('Failed to parse protocol content:', content.substring(0, 100), parseError);
            }
          } catch (error) {
            console.error('Error processing line:', error);
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const typeCode = buffer[0];
          const content = buffer.substring(2);
          
          if (content) {
            const parsed = JSON.parse(content);
            
            if (typeCode === 'd' && parsed.finishReason) {
              options?.onFinish?.(parsed.finishReason, parsed.usage || {});
            } else if (typeCode === '2') {
              options?.onData?.(parsed);
            }
          }
        } catch (error) {
          console.error('Error processing final buffer:', error);
        }
      }

      return { conversationId: newConversationId };

    } catch (error) {
      console.error('V6 Stream error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      options?.onError?.(errorMsg);
      throw error;
    }
  }

  async getChatTools() {
    return this.request<{ tools: any[]; count: number }>('/chat/tools');
  }

  // ==================== BRAIN/KNOWLEDGE BASE ENDPOINTS ====================

  async uploadDocument(file: File, title?: string, category: string = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    formData.append('category', category);

    return this.request<Document>('/brain/upload', 'POST', formData, true);
  }

  async uploadDocumentsBatch(files: File[], category: string = 'general') {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('category', category);

    return this.request<Document[]>('/brain/upload-batch', 'POST', formData, true);
  }

  async uploadText(text: string, title?: string, category: string = 'general') {
    return this.request<Document>('/brain/upload-text', 'POST', {
      text,
      title,
      category,
    });
  }

  async searchKnowledge(query: string, category?: string, limit: number = 10) {
    return this.request<SearchResult[]>('/brain/search', 'POST', {
      query,
      category,
      limit,
    });
  }

  async getDocuments() {
    return this.request<Document[]>('/brain/documents');
  }

  async getBrainStats() {
    return this.request<BrainStats>('/brain/stats');
  }

  async deleteDocument(documentId: string) {
    return this.request<{ success: boolean }>(`/brain/documents/${documentId}`, 'DELETE');
  }

  // ==================== BACKTEST ENDPOINTS ====================

  async uploadBacktest(file: File, strategyId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (strategyId) formData.append('strategy_id', strategyId);

    return this.request<BacktestResult>('/backtest/upload', 'POST', formData, true);
  }

  async getBacktest(backtestId: string) {
    return this.request<BacktestResult>(`/backtest/${backtestId}`);
  }

  async getStrategyBacktests(strategyId: string) {
    return this.request<BacktestResult[]>(`/backtest/strategy/${strategyId}`);
  }

  // ==================== RESEARCHER ENDPOINTS ====================
  // FIXED: Added missing researcher endpoints with correct /api prefix

  async getCompanyResearch(symbol: string) {
    return this.request<{
      symbol: string;
      name: string;
      sector: string;
      industry: string;
      market_cap: number;
      price: number;
      data: any;
    }>(`/api/researcher/company/${symbol}`);
  }

  async getCompanyNews(symbol: string) {
    return this.request<{
      symbol: string;
      news: any[];
    }>(`/api/researcher/news/${symbol}`);
  }

  async analyzeStrategyFit(
    symbol: string,
    strategy_type: string,
    timeframe: string,
    additional_context?: string
  ) {
    return this.request<{
      symbol: string;
      strategy_type: string;
      timeframe: string;
      analysis: string;
      recommendations: any[];
    }>('/api/researcher/strategy-analysis', 'POST', {
      symbol,
      strategy_type,
      timeframe,
      additional_context,
    });
  }

  async getPeerComparison(symbol: string, peers?: string[], sector?: string) {
    return this.request<{
      symbol: string;
      peers: string[];
      comparison: any;
      analysis: string;
    }>('/api/researcher/comparison', 'POST', {
      symbol,
      peers,
      sector,
    });
  }

  async getMacroContext() {
    return this.request<{
      market_overview: any;
      economic_indicators: any;
      sector_performance: any;
      analysis: string;
    }>('/api/researcher/macro-context');
  }

  async getSecFilings(symbol: string) {
    return this.request<{
      symbol: string;
      filings: any[];
    }>(`/api/researcher/sec-filings/${symbol}`);
  }

  async generateResearchReport(
    symbol: string,
    include_peers: boolean = true,
    include_technicals: boolean = true,
    include_fundamentals: boolean = true
  ) {
    return this.request<{
      symbol: string;
      report: string;
      sections: any;
    }>('/api/researcher/generate-report', 'POST', {
      symbol,
      include_peers,
      include_technicals,
      include_fundamentals,
    });
  }

  async getTrendingResearch() {
    return this.request<{
      trending_stocks: any[];
      sector_trends: any[];
      market_movers: any[];
    }>('/api/researcher/trending');
  }

  // ==================== REVERSE ENGINEER ENDPOINTS ====================

  async startReverseEngineering(query: string) {
    return this.request<Strategy>('/reverse-engineer/start', 'POST', { query });
  }

  async continueReverseEngineering(strategyId: string, message: string) {
    return this.request<Strategy>('/reverse-engineer/continue', 'POST', {
      strategy_id: strategyId,
      message,
    });
  }

  async researchStrategy(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/research/${strategyId}`, 'POST', {});
  }

  async generateStrategySchematic(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/schematic/${strategyId}`, 'POST', {});
  }

  async generateStrategyCode(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/generate-code/${strategyId}`, 'POST', {});
  }

  async getStrategy(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/strategy/${strategyId}`);
  }

  // FIXED: Added missing reverse engineer history endpoints
  async saveReverseEngineerHistory(entry: {
    strategy_id: string;
    query: string;
    phase: string;
    result: any;
  }) {
    return this.request<{ id: string; success: boolean }>('/reverse-engineer/history', 'POST', entry);
  }

  async getReverseEngineerHistory(limit: number = 50) {
    return this.request<{
      id: string;
      strategy_id: string;
      query: string;
      phase: string;
      result: any;
      created_at: string;
    }[]>(`/reverse-engineer/history?limit=${limit}`);
  }

  async deleteReverseEngineerHistory(historyId: string) {
    return this.request<{ success: boolean }>(`/reverse-engineer/history/${historyId}`, 'DELETE');
  }

  // ==================== TRAIN ENDPOINTS ====================

  async submitFeedback(feedback: FeedbackCreateRequest) {
    return this.request<UserFeedback>('/train/feedback', 'POST', feedback);
  }

  async getMyFeedback() {
    return this.request<UserFeedback[]>('/train/feedback/my');
  }

  async getFeedback(feedbackId: string) {
    return this.request<UserFeedback>(`/train/feedback/${feedbackId}`);
  }

  async testTraining(request: TrainingTestRequest) {
    return this.request<TrainingTestResult>('/train/test', 'POST', request);
  }

  async getTrainingEffectiveness() {
    return this.request<TrainingEffectiveness>('/train/effectiveness');
  }

  async suggestTraining(suggestion: SuggestionCreateRequest) {
    return this.request<TrainingSuggestion>('/train/suggest', 'POST', suggestion);
  }

  async getMySuggestions() {
    return this.request<TrainingSuggestion[]>('/train/suggestions/my');
  }

  async getLearningCurve() {
    return this.request<LearningCurve>('/train/analytics/learning-curve');
  }

  async getPopularPatterns() {
    return this.request<PopularPattern[]>('/train/analytics/popular-patterns');
  }

  async searchTrainingKnowledge(query: string, category?: TrainingCategory, limit: number = 10) {
    const params = new URLSearchParams({ query, limit: limit.toString() });
    if (category) params.append('category', category);
    return this.request<KnowledgeSearchResult[]>(`/train/knowledge/search?${params}`);
  }

  async getKnowledgeCategories() {
    return this.request<KnowledgeCategory[]>('/train/knowledge/categories');
  }

  async getTrainingTypes() {
    return this.request<TrainingTypeInfo[]>('/train/knowledge/types');
  }

  async quickLearn(code: string, explanation: string) {
    return this.request<{ success: boolean; message: string }>('/train/quick-learn', 'POST', {
      code,
      explanation,
    });
  }

  async getTrainStats() {
    return this.request<TrainingStats>('/train/stats');
  }

  // ==================== ADMIN ENDPOINTS ====================

  async getAdminStatus() {
    return this.request<AdminStatus>('/admin/status');
  }

  async makeAdmin(userId: string) {
    return this.request<{ success: boolean }>(`/admin/make-admin/${userId}`, 'POST');
  }

  async revokeAdmin(userId: string) {
    return this.request<{ success: boolean }>(`/admin/revoke-admin/${userId}`, 'POST');
  }

  async addTraining(training: TrainingCreateRequest) {
    return this.request<TrainingData>('/admin/train', 'POST', training);
  }

  async quickTrain(request: QuickTrainRequest) {
    return this.request<TrainingData>('/admin/train/quick', 'POST', request);
  }

  async addCorrection(correction: CorrectionRequest) {
    return this.request<TrainingData>('/admin/train/correction', 'POST', correction);
  }

  async batchImportTraining(items: TrainingCreateRequest[]) {
    return this.request<{ imported: number; failed: number }>('/admin/train/batch', 'POST', { items });
  }

  async getTrainingList(params?: {
    training_type?: TrainingType;
    category?: TrainingCategory;
    is_active?: boolean;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.training_type) searchParams.append('training_type', params.training_type);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return this.request<TrainingData[]>(`/admin/training${query ? `?${query}` : ''}`);
  }

  async getTraining(trainingId: string) {
    return this.request<TrainingData>(`/admin/training/${trainingId}`);
  }

  async updateTraining(trainingId: string, updates: Partial<TrainingCreateRequest & { is_active: boolean }>) {
    return this.request<TrainingData>(`/admin/training/${trainingId}`, 'PUT', updates);
  }

  async deleteTraining(trainingId: string) {
    return this.request<{ success: boolean }>(`/admin/training/${trainingId}`, 'DELETE');
  }

  async toggleTraining(trainingId: string) {
    return this.request<TrainingData>(`/admin/training/${trainingId}/toggle`, 'POST');
  }

  async getTrainingStatsOverview() {
    return this.request<TrainingStats>('/admin/training/stats/overview');
  }

  async exportTraining(params?: { training_type?: TrainingType; category?: TrainingCategory }) {
    const searchParams = new URLSearchParams();
    if (params?.training_type) searchParams.append('training_type', params.training_type);
    if (params?.category) searchParams.append('category', params.category);
    
    const query = searchParams.toString();
    return this.request<TrainingData[]>(`/admin/training/export/all${query ? `?${query}` : ''}`);
  }

  async previewTrainingContext(category?: TrainingCategory) {
    const params = category ? `?category=${category}` : '';
    return this.request<{ context: string }>(`/admin/training/context/preview${params}`);
  }

  async getUsers() {
    return this.request<AdminUser[]>('/admin/users');
  }

  async getUser(userId: string) {
    return this.request<AdminUser>(`/admin/users/${userId}`);
  }

  async deleteUser(userId: string) {
    return this.request<{ success: boolean }>(`/admin/users/${userId}`, 'DELETE');
  }

  async getAllFeedback(params?: { status?: FeedbackStatus; feedback_type?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.feedback_type) searchParams.append('feedback_type', params.feedback_type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return this.request<UserFeedback[]>(`/admin/feedback${query ? `?${query}` : ''}`);
  }

  async getAdminFeedback(feedbackId: string) {
    return this.request<UserFeedback>(`/admin/feedback/${feedbackId}`);
  }

  async reviewFeedback(feedbackId: string, review: FeedbackReviewRequest) {
    return this.request<UserFeedback>(`/admin/feedback/${feedbackId}/review`, 'POST', review);
  }

  async getAllSuggestions(status?: SuggestionStatus) {
    const params = status ? `?status=${status}` : '';
    return this.request<TrainingSuggestion[]>(`/admin/suggestions${params}`);
  }

  async getSuggestion(suggestionId: string) {
    return this.request<TrainingSuggestion>(`/admin/suggestions/${suggestionId}`);
  }

  async reviewSuggestion(suggestionId: string, review: SuggestionReviewRequest) {
    return this.request<TrainingSuggestion>(`/admin/suggestions/${suggestionId}/review`, 'POST', review);
  }

  async approveSuggestion(suggestionId: string, priority?: number) {
    return this.request<TrainingSuggestion>(`/admin/suggestions/${suggestionId}/approve`, 'POST', { priority });
  }

  async rejectSuggestion(suggestionId: string, reason?: string) {
    return this.request<TrainingSuggestion>(`/admin/suggestions/${suggestionId}/reject`, 'POST', { reason });
  }

  async getAnalyticsOverview() {
    return this.request<AnalyticsOverview>('/admin/analytics/overview');
  }

  async getAnalyticsTrends() {
    return this.request<AnalyticsTrends>('/admin/analytics/trends');
  }

  async getAdminConfig() {
    return this.request<AdminConfig>('/admin/config');
  }

  async addAdminEmail(email: string) {
    return this.request<{ success: boolean }>(`/admin/config/add-admin-email?email=${encodeURIComponent(email)}`, 'POST');
  }

  // ==================== UTILITY ENDPOINTS ====================

  async checkHealth() {
    return this.request<{ status: string }>('/health');
  }

  async getRoutes() {
    return this.request<string[]>('/routes');
  }
}

export const apiClient = new APIClient();
export default apiClient;

export const api = {
  auth: {
    login: (email: string, password: string) => apiClient.login(email, password),
    register: (data: any) => apiClient.register(data.email, data.password, data.name, data.claude_api_key, data.tavily_api_key),
    getMe: () => apiClient.getCurrentUser(),
  },
  afl: {
    generate: (prompt: string, strategyType?: string, settings?: any) =>
      apiClient.generateAFL({ prompt, strategy_type: strategyType as any, settings }),
    optimize: (code: string) => apiClient.optimizeAFL(code),
    debug: (code: string, errorMessage?: string) => apiClient.debugAFL(code, errorMessage),
    explain: (code: string) => apiClient.explainAFL(code),
    validate: (code: string) => apiClient.validateAFL(code),
    getCodes: () => apiClient.getAFLCodes(),
    getCode: (codeId: string) => apiClient.getAFLCode(codeId),
    deleteCode: (codeId: string) => apiClient.deleteAFLCode(codeId),
    // FIXED: Added missing AFL file upload methods
    uploadFile: (file: File, description?: string) => apiClient.uploadAflFile(file, description),
    getFiles: () => apiClient.getAflFiles(),
    getFile: (fileId: string) => apiClient.getAflFile(fileId),
    deleteFile: (fileId: string) => apiClient.deleteAflFile(fileId),
    // FIXED: Added missing AFL settings preset methods
    savePreset: (preset: any) => apiClient.saveSettingsPreset(preset),
    getPresets: () => apiClient.getSettingsPresets(),
    getPreset: (presetId: string) => apiClient.getSettingsPreset(presetId),
    updatePreset: (presetId: string, updates: any) => apiClient.updateSettingsPreset(presetId, updates),
    deletePreset: (presetId: string) => apiClient.deleteSettingsPreset(presetId),
    setDefaultPreset: (presetId: string) => apiClient.setDefaultPreset(presetId),
    // FIXED: Added missing AFL history methods
    saveHistory: (entry: any) => apiClient.saveAflHistory(entry),
    getHistory: (limit?: number) => apiClient.getAflHistory(limit),
    deleteHistory: (historyId: string) => apiClient.deleteAflHistory(historyId),
  },
  chat: {
    getConversations: () => apiClient.getConversations(),
    createConversation: (title?: string) => apiClient.createConversation(title),
    getMessages: (conversationId: string) => apiClient.getMessages(conversationId),
    deleteConversation: (conversationId: string) => apiClient.deleteConversation(conversationId),
    sendMessage: (content: string, conversationId?: string) => apiClient.sendMessage(content, conversationId),
    sendMessageStream: (content: string, conversationId?: string, options?: any) => apiClient.sendMessageStream(content, conversationId, options),
    sendMessageStreamV6: (content: string, conversationId?: string, options?: any) => apiClient.sendMessageStreamV6(content, conversationId, options),
    uploadFile: (conversationId: string, formData: FormData) => apiClient.uploadFile(conversationId, formData),
    getStreamEndpoint: () => apiClient.getStreamEndpoint(),
    getStreamV6Endpoint: () => apiClient.getStreamV6Endpoint(),
    getTools: () => apiClient.getChatTools(),
  },
  brain: {
    uploadDocument: (file: File, category?: string) => apiClient.uploadDocument(file, undefined, category),
    search: (query: string, category?: string, limit?: number) => apiClient.searchKnowledge(query, category, limit),
    getDocuments: () => apiClient.getDocuments(),
    getStats: () => apiClient.getBrainStats(),
    deleteDocument: (documentId: string) => apiClient.deleteDocument(documentId),
  },
  backtest: {
    upload: (file: File, strategyId?: string) => apiClient.uploadBacktest(file, strategyId),
    getBacktest: (backtestId: string) => apiClient.getBacktest(backtestId),
    getStrategyBacktests: (strategyId: string) => apiClient.getStrategyBacktests(strategyId),
  },
  // FIXED: Added missing researcher endpoints
  researcher: {
    getCompanyResearch: (symbol: string) => apiClient.getCompanyResearch(symbol),
    getCompanyNews: (symbol: string) => apiClient.getCompanyNews(symbol),
    analyzeStrategyFit: (symbol: string, strategy_type: string, timeframe: string, additional_context?: string) =>
      apiClient.analyzeStrategyFit(symbol, strategy_type, timeframe, additional_context),
    getPeerComparison: (symbol: string, peers?: string[], sector?: string) =>
      apiClient.getPeerComparison(symbol, peers, sector),
    getMacroContext: () => apiClient.getMacroContext(),
    getSecFilings: (symbol: string) => apiClient.getSecFilings(symbol),
    generateReport: (symbol: string, include_peers?: boolean, include_technicals?: boolean, include_fundamentals?: boolean) =>
      apiClient.generateResearchReport(symbol, include_peers, include_technicals, include_fundamentals),
    getTrending: () => apiClient.getTrendingResearch(),
  },
  reverseEngineer: {
    startSession: (query: string) => apiClient.startReverseEngineering(query),
    continue: (strategyId: string, message: string) => apiClient.continueReverseEngineering(strategyId, message),
    research: (strategyId: string) => apiClient.researchStrategy(strategyId),
    generateSchematic: (strategyId: string) => apiClient.generateStrategySchematic(strategyId),
    generateCode: (strategyId: string) => apiClient.generateStrategyCode(strategyId),
    getStrategy: (strategyId: string) => apiClient.getStrategy(strategyId),
    // FIXED: Added missing reverse engineer history methods
    saveHistory: (entry: any) => apiClient.saveReverseEngineerHistory(entry),
    getHistory: (limit?: number) => apiClient.getReverseEngineerHistory(limit),
    deleteHistory: (historyId: string) => apiClient.deleteReverseEngineerHistory(historyId),
  },
  train: {
    submitFeedback: (feedback: FeedbackCreateRequest) => apiClient.submitFeedback(feedback),
    getMyFeedback: () => apiClient.getMyFeedback(),
    getFeedback: (feedbackId: string) => apiClient.getFeedback(feedbackId),
    testTraining: (request: TrainingTestRequest) => apiClient.testTraining(request),
    getEffectiveness: () => apiClient.getTrainingEffectiveness(),
    suggest: (suggestion: SuggestionCreateRequest) => apiClient.suggestTraining(suggestion),
    getMySuggestions: () => apiClient.getMySuggestions(),
    getLearningCurve: () => apiClient.getLearningCurve(),
    getPopularPatterns: () => apiClient.getPopularPatterns(),
    searchKnowledge: (query: string, category?: TrainingCategory, limit?: number) =>
      apiClient.searchTrainingKnowledge(query, category, limit),
    getCategories: () => apiClient.getKnowledgeCategories(),
    getTypes: () => apiClient.getTrainingTypes(),
    quickLearn: (code: string, explanation: string) => apiClient.quickLearn(code, explanation),
    getStats: () => apiClient.getTrainStats(),
  },
  admin: {
    getStatus: () => apiClient.getAdminStatus(),
    makeAdmin: (userId: string) => apiClient.makeAdmin(userId),
    revokeAdmin: (userId: string) => apiClient.revokeAdmin(userId),
    addTraining: (training: TrainingCreateRequest) => apiClient.addTraining(training),
    quickTrain: (request: QuickTrainRequest) => apiClient.quickTrain(request),
    addCorrection: (correction: CorrectionRequest) => apiClient.addCorrection(correction),
    batchImport: (items: TrainingCreateRequest[]) => apiClient.batchImportTraining(items),
    getTrainingList: (params?: any) => apiClient.getTrainingList(params),
    getTraining: (id: string) => apiClient.getTraining(id),
    updateTraining: (id: string, updates: any) => apiClient.updateTraining(id, updates),
    deleteTraining: (id: string) => apiClient.deleteTraining(id),
    toggleTraining: (id: string) => apiClient.toggleTraining(id),
    getTrainingStats: () => apiClient.getTrainingStatsOverview(),
    exportTraining: (params?: any) => apiClient.exportTraining(params),
    previewContext: (category?: TrainingCategory) => apiClient.previewTrainingContext(category),
    getUsers: () => apiClient.getUsers(),
    getUser: (id: string) => apiClient.getUser(id),
    deleteUser: (id: string) => apiClient.deleteUser(id),
    getAllFeedback: (params?: any) => apiClient.getAllFeedback(params),
    getFeedback: (id: string) => apiClient.getAdminFeedback(id),
    reviewFeedback: (id: string, review: FeedbackReviewRequest) => apiClient.reviewFeedback(id, review),
    getAllSuggestions: (status?: SuggestionStatus) => apiClient.getAllSuggestions(status),
    getSuggestion: (id: string) => apiClient.getSuggestion(id),
    reviewSuggestion: (id: string, review: SuggestionReviewRequest) => apiClient.reviewSuggestion(id, review),
    approveSuggestion: (id: string, priority?: number) => apiClient.approveSuggestion(id, priority),
    rejectSuggestion: (id: string, reason?: string) => apiClient.rejectSuggestion(id, reason),
    getAnalytics: () => apiClient.getAnalyticsOverview(),
    getTrends: () => apiClient.getAnalyticsTrends(),
    getConfig: () => apiClient.getAdminConfig(),
    addAdminEmail: (email: string) => apiClient.addAdminEmail(email),
  },
};