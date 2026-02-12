'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Copy, Check, Download, Bug, Lightbulb, Zap, Loader2, MessageSquare, Paperclip, Upload, X, FileText, Maximize2, Minimize2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, DollarSign, Receipt, TrendingUp, Settings, ArrowUp, ArrowDown, BarChart3, GitBranch, Activity } from 'lucide-react';
import apiClient from '@/lib/api';
import FeedbackModal from '@/components/FeedbackModal';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import mermaid from 'mermaid';

export function AFLGeneratorPage() {
  const { resolvedTheme } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const isDark = resolvedTheme === 'dark';
  
  // Persist key state in localStorage
  const [prompt, setPrompt] = useState(() => {
    try { return localStorage.getItem('afl_prompt') || ''; } catch { return ''; }
  });
  const [strategyType, setStrategyType] = useState(() => {
    try { return localStorage.getItem('afl_strategy_type') || 'standalone'; } catch { return 'standalone'; }
  });
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(() => {
    try { return localStorage.getItem('afl_generated_code') || ''; } catch { return ''; }
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Persist prompt, strategy type, and generated code
  useEffect(() => { try { localStorage.setItem('afl_prompt', prompt); } catch {} }, [prompt]);
  useEffect(() => { try { localStorage.setItem('afl_strategy_type', strategyType); } catch {} }, [strategyType]);
  useEffect(() => { try { localStorage.setItem('afl_generated_code', generatedCode); } catch {} }, [generatedCode]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [codeId, setCodeId] = useState<string | undefined>(undefined);
  
  // Environment Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [backtestSettings, setBacktestSettings] = useState({
    initial_equity: 100000,
    position_size: "100",
    position_size_type: "spsPercentOfEquity",
    max_positions: 10,
    commission: 0.001,
    trade_delays: [0, 0, 0, 0] as [number, number, number, number],
    margin_requirement: 100,
  });
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Code editor state
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const editorRef = useRef<any>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{id: string, title: string, timestamp: Date, preview: string}>>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load real chat history from API on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const allConversations = await apiClient.getConversations();
      // Filter to only show AFL conversations
      const conversations = allConversations.filter((conv: any) => conv.conversation_type === 'afl');
      // Map API conversations to chat history format
      const history = conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title || 'Untitled Chat',
        timestamp: new Date(conv.updated_at || conv.created_at),
        preview: conv.title || '',
      }));
      setChatHistory(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Visual Artifacts state (AI SDK Generative UI style)
  const [strategyArtifact, setStrategyArtifact] = useState<{
    flowchart?: string;
    indicators?: Array<{name: string; type: string; params: Record<string, any>}>;
    signals?: Array<{type: 'buy' | 'sell' | 'short' | 'cover'; condition: string}>;
    riskManagement?: {stopLoss?: string; takeProfit?: string; positionSize?: string};
  } | null>(null);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });
  }, [isDark]);

  // Render mermaid flowchart when artifact changes
  useEffect(() => {
    if (strategyArtifact?.flowchart && mermaidRef.current) {
      const renderMermaid = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          const { svg } = await mermaid.render(`mermaid-${Date.now()}`, strategyArtifact.flowchart!);
          mermaidRef.current!.innerHTML = svg;
        } catch (err) {
          console.error('Mermaid render error:', err);
        }
      };
      renderMermaid();
    }
  }, [strategyArtifact?.flowchart]);

  // Helper to format error messages properly
  const formatErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'string') {
      return err;
    }
    if (err && typeof err === 'object') {
      // Handle various error object shapes
      const errorObj = err as Record<string, any>;
      if (errorObj.detail) {
        if (typeof errorObj.detail === 'string') {
          return errorObj.detail;
        }
        // Handle nested detail object
        return JSON.stringify(errorObj.detail);
      }
      if (errorObj.message) {
        return String(errorObj.message);
      }
      if (errorObj.error) {
        return String(errorObj.error);
      }
      // Last resort - stringify the object
      try {
        return JSON.stringify(err);
      } catch {
        return 'An unknown error occurred';
      }
    }
    return 'Failed to generate code';
  };

  // Parse AFL code to extract strategy components for visual artifacts
  const parseCodeForArtifacts = (code: string) => {
    const indicators: Array<{name: string; type: string; params: Record<string, any>}> = [];
    const signals: Array<{type: 'buy' | 'sell' | 'short' | 'cover'; condition: string}> = [];
    const riskManagement: {stopLoss?: string; takeProfit?: string; positionSize?: string} = {};

    // Extract indicator definitions
    const indicatorPatterns = [
      { regex: /(\w+)\s*=\s*MA\s*\(\s*(\w+)\s*,\s*(\d+)\s*\)/gi, type: 'MA' },
      { regex: /(\w+)\s*=\s*EMA\s*\(\s*(\w+)\s*,\s*(\d+)\s*\)/gi, type: 'EMA' },
      { regex: /(\w+)\s*=\s*RSI\s*\(\s*(\d+)\s*\)/gi, type: 'RSI' },
      { regex: /(\w+)\s*=\s*MACD\s*\(\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+))?\s*\)/gi, type: 'MACD' },
      { regex: /(\w+)\s*=\s*ATR\s*\(\s*(\d+)\s*\)/gi, type: 'ATR' },
      { regex: /(\w+)\s*=\s*ADX\s*\(\s*(\d+)\s*\)/gi, type: 'ADX' },
      { regex: /(\w+)\s*=\s*BBandTop\s*\(\s*(\w+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/gi, type: 'BBandTop' },
      { regex: /(\w+)\s*=\s*BBandBot\s*\(\s*(\w+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/gi, type: 'BBandBot' },
    ];

    indicatorPatterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(code)) !== null) {
        indicators.push({
          name: match[1],
          type,
          params: { period: match[3] || match[2] }
        });
      }
    });

    // Extract signals
    const buyMatch = code.match(/Buy\s*=\s*([^;]+)/i);
    const sellMatch = code.match(/Sell\s*=\s*([^;]+)/i);
    const shortMatch = code.match(/Short\s*=\s*([^;]+)/i);
    const coverMatch = code.match(/Cover\s*=\s*([^;]+)/i);

    if (buyMatch) signals.push({ type: 'buy', condition: buyMatch[1].trim() });
    if (sellMatch) signals.push({ type: 'sell', condition: sellMatch[1].trim() });
    if (shortMatch) signals.push({ type: 'short', condition: shortMatch[1].trim() });
    if (coverMatch) signals.push({ type: 'cover', condition: coverMatch[1].trim() });

    // Extract risk management
    const stopLossMatch = code.match(/ApplyStop\s*\([^)]*stoploss[^)]*,\s*([\d.]+)/i) || 
                          code.match(/StopLoss\s*=\s*([\d.%]+)/i);
    const takeProfitMatch = code.match(/ApplyStop\s*\([^)]*profit[^)]*,\s*([\d.]+)/i) ||
                            code.match(/TakeProfit\s*=\s*([\d.%]+)/i);
    const positionSizeMatch = code.match(/SetPositionSize\s*\(\s*([\d.]+)/i);

    if (stopLossMatch) riskManagement.stopLoss = stopLossMatch[1];
    if (takeProfitMatch) riskManagement.takeProfit = takeProfitMatch[1];
    if (positionSizeMatch) riskManagement.positionSize = positionSizeMatch[1];

    // Generate flowchart
    let flowchart = `flowchart TD
    subgraph INDICATORS["=Ê Indicators"]
`;
    indicators.forEach((ind, i) => {
      flowchart += `        IND${i}["${ind.name}<br/>${ind.type}(${ind.params.period})"]\n`;
    });
    flowchart += `    end
    
    subgraph SIGNALS["<¯ Trading Signals"]
`;
    signals.forEach((sig, i) => {
      const icon = sig.type === 'buy' ? '=â' : sig.type === 'sell' ? '=4' : sig.type === 'short' ? '=à' : '=5';
      flowchart += `        SIG${i}["${icon} ${sig.type.toUpperCase()}"]\n`;
    });
    flowchart += `    end
    
    subgraph RISK["  Risk Management"]
`;
    if (riskManagement.stopLoss) flowchart += `        STOP["Stop Loss: ${riskManagement.stopLoss}%"]\n`;
    if (riskManagement.takeProfit) flowchart += `        PROFIT["Take Profit: ${riskManagement.takeProfit}%"]\n`;
    if (riskManagement.positionSize) flowchart += `        SIZE["Position: ${riskManagement.positionSize}%"]\n`;
    flowchart += `    end
    
    INDICATORS --> SIGNALS
    SIGNALS --> RISK
    
    style INDICATORS fill:#1E3A5F,stroke:#FEC00F,color:#FFF
    style SIGNALS fill:#2D4A3E,stroke:#22C55E,color:#FFF
    style RISK fill:#4A2D2D,stroke:#DC2626,color:#FFF`;

    return {
      flowchart,
      indicators,
      signals,
      riskManagement: Object.keys(riskManagement).length > 0 ? riskManagement : undefined
    };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe your strategy');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const result = await apiClient.generateAFL({
        prompt: prompt,
        strategy_type: strategyType as any,
        backtest_settings: backtestSettings,
        uploaded_file_ids: selectedFileIds,
      });
      
      // FIXED: Use correct property name - 'code' instead of 'afl_code'
      // The AFLCode type has 'code' property, not 'afl_code'
      setGeneratedCode(result.code || '// Generated code will appear here');
      setCodeId(result.id);
      
      // Auto-format after generation
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run();
        }
      }, 100);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy_${Date.now()}.afl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleToggleFullscreen = () => {
    setIsEditorFullscreen(!isEditorFullscreen);
  };

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;
    
    monaco.languages.register({ id: 'afl' });
    
    monaco.languages.setMonarchTokensProvider('afl', {
      keywords: [
        'Buy', 'Sell', 'Short', 'Cover', 'Filter', 
        'if', 'else', 'for', 'while', 'function',
        'SetOption', 'SetTradeDelays', 'SetPositionSize',
        'Param', 'Optimize', 'Plot', 'PlotShapes',
        'ExRem', 'Flip', 'Cross', 'TimeFrameSet', 'TimeFrameRestore',
      ],
      
      builtinFunctions: [
        'MA', 'EMA', 'SMA', 'WMA', 'DEMA', 'TEMA',
        'RSI', 'MACD', 'ATR', 'ADX', 'CCI', 'MFI',
        'BBandTop', 'BBandBot', 'SAR', 'ROC',
        'HHV', 'LLV', 'Ref', 'Sum', 'Cum',
      ],
      
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@builtinFunctions': 'type.identifier',
              '@default': 'identifier'
            }
          }],
          [/".*?"/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/\d+/, 'number'],
        ],
        comment: [
          [/\*\//, 'comment', '@pop'],
          [/./, 'comment']
        ],
      },
    });
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB');
      return;
    }
    
    const allowedTypes = [
      'text/csv',
      'text/plain',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const isAllowed = allowedTypes.includes(file.type) || 
                      file.name.endsWith('.afl') || 
                      file.name.endsWith('.csv');
    
    if (!isAllowed) {
      alert('Unsupported file type. Please upload CSV, TXT, PDF, or AFL files.');
      return;
    }
    
    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // NOTE: This method might not exist in the API client
      // const result = await apiClient.uploadAflFile(formData);
      
      // Fallback: Show alert that file upload isn't implemented yet
      alert('File upload feature is not yet implemented in the backend');
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;
    
    try {
      // NOTE: This method might not exist in the API client
      // await apiClient.deleteAflFile(fileId);
      
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedFileIds(prev => prev.filter(id => id !== fileId));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete file');
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() && chatFiles.length === 0) return;

    // Build message with context about the current code
    let messageContent = chatInput;
    if (generatedCode && !chatInput.toLowerCase().includes('code')) {
      messageContent = `[Current AFL Code Context]\n\`\`\`afl\n${generatedCode}\n\`\`\`\n\nUser request: ${chatInput}`;
    }

    const newMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: chatInput, // Show only user's text in UI
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // FIXED: Use actual API call with conversation ID
      const response = await apiClient.sendMessage(messageContent, conversationId || undefined);
      
      // Track the conversation ID from the response
      if (response.conversation_id && !conversationId) {
        setConversationId(response.conversation_id);
        // Update the chat history with the actual message as title
        const shortTitle = chatInput.length > 50 ? chatInput.slice(0, 50) + '...' : chatInput;
        setChatHistory(prev => {
          // Update the "AFL Code Chat" entry with the real title
          const updated = prev.map(h => 
            h.id === activeChatId ? { ...h, title: shortTitle, preview: chatInput } : h
          );
          // If this is a brand new conversation not in history yet, add it
          if (!prev.some(h => h.id === response.conversation_id)) {
            updated.unshift({
              id: response.conversation_id,
              title: shortTitle,
              timestamp: new Date(),
              preview: chatInput,
            });
          }
          return updated;
        });
        setActiveChatId(response.conversation_id);
        // Also refresh from server to get accurate data
        loadChatHistory();
      }
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.response || 'No response received.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
      
      // If the response contains AFL code, update the generated code
      const codeMatch = (response.response || '').match(/```(?:afl)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        setGeneratedCode(codeMatch[1].trim());
      }
    } catch (err) {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Error: ${err instanceof Error ? err.message : 'Failed to get response. Please try again.'}`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } finally {
      setChatLoading(false);
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setChatFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeChatFile = (index: number) => {
    setChatFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#121212' : '#F5F5F5',
      display: 'flex',
      fontFamily: "'Quicksand', sans-serif",
    }}>
      {/* Chat History Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '0px' : '280px',
        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        borderRight: sidebarCollapsed ? 'none' : `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        transition: 'width 0.3s ease',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              color: isDark ? '#FFFFFF' : '#212121',
              letterSpacing: '1px',
              margin: 0,
            }}>
              CHAT HISTORY
            </h2>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#FEC00F',
                transition: 'transform 0.2s ease',
              }}
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <p style={{
            fontSize: '12px',
            color: '#757575',
            margin: 0,
          }}>
            Your previous conversations
          </p>
        </div>

        {/* Chat List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          transition: 'all 0.3s ease',
        }}>
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={async () => {
                  setActiveChatId(chat.id);
                  setConversationId(chat.id);
                  // Load messages for this conversation
                  try {
                    const messages = await apiClient.getMessages(chat.id);
                    setChatMessages(messages.map((m: any) => ({
                      id: m.id,
                      role: m.role as 'user' | 'assistant',
                      content: m.content,
                      timestamp: new Date(m.created_at),
                    })));
                  } catch (err) {
                    console.error('Failed to load messages:', err);
                    setChatMessages([]);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: activeChatId === chat.id ? 'rgba(254, 192, 15, 0.1)' : 'transparent',
                  border: `1px solid ${activeChatId === chat.id ? '#FEC00F' : (isDark ? '#424242' : '#E0E0E0')}`,
                  borderRadius: '8px',
                  color: isDark ? '#FFFFFF' : '#212121',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeChatId !== chat.id) {
                    e.currentTarget.style.backgroundColor = isDark ? '#2A2A2A' : '#F0F0F0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeChatId !== chat.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: activeChatId === chat.id ? '#FEC00F' : (isDark ? '#FFFFFF' : '#212121'),
                }}>
                  {chat.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#757575',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {chat.preview}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#757575',
                }}>
                  {new Date(chat.timestamp).toLocaleString()}
                </div>
              </button>
            ))}
        </div>

        {/* New Chat Button */}
        <div style={{
          padding: '16px',
          borderTop: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
        }}>
          <button
            onClick={async () => {
              try {
                // Create a real conversation via the API
                const newConv = await apiClient.createConversation('AFL Code Chat', 'afl');
                setConversationId(newConv.id);
                setActiveChatId(newConv.id);
                setChatMessages([]);
                // Add to chat history
                setChatHistory(prev => [{
                  id: newConv.id,
                  title: newConv.title || 'AFL Code Chat',
                  timestamp: new Date(newConv.created_at),
                  preview: 'New conversation',
                }, ...prev]);
              } catch (err) {
                console.error('Failed to create conversation:', err);
                // Fallback: just clear local state
                setActiveChatId(null);
                setConversationId(null);
                setChatMessages([]);
              }
            }}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: '#FEC00F',
              border: 'none',
              borderRadius: '8px',
              color: '#212121',
              fontSize: '13px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <MessageSquare size={16} />
            NEW CHAT
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
      }}>
        {/* Toggle Button (when sidebar is collapsed) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              zIndex: 1000,
              background: 'rgba(254, 192, 15, 0.3)',
              border: '1px solid rgba(254, 192, 15, 0.5)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(254, 192, 15, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(254, 192, 15, 0.3)';
            }}
          >
            <ChevronRight size={18} color="#FEC00F" />
          </button>
        )}
        
        {/* Top Content */}
        <div style={{
          flex: 1,
          padding: isMobile ? '16px' : (isTablet ? '24px' : '32px'),
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '32px',
              fontWeight: 700,
              color: isDark ? '#FFFFFF' : '#212121',
              letterSpacing: '2px',
              marginBottom: '8px',
            }}>
              AFL CODE GENERATOR
            </h1>
            <p style={{ color: isDark ? '#9E9E9E' : '#757575', fontSize: '15px', margin: 0 }}>
              Generate AmiBroker Formula Language code from natural language descriptions
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left Panel - Input */}
            <div style={{
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
              borderRadius: '12px',
              padding: '24px',
            }}>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                color: isDark ? '#FFFFFF' : '#212121',
                letterSpacing: '1px',
                marginBottom: '8px',
                marginTop: 0,
              }}>
                DESCRIBE YOUR STRATEGY
              </h2>
              <p style={{ color: '#757575', fontSize: '13px', marginBottom: '24px', marginTop: 0 }}>
                Write a detailed description of your trading strategy
              </p>

              {error && (
                <div style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid #DC2626',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                }}>
                  <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Strategy Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isDark ? '#FFFFFF' : '#212121',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}>
                  STRATEGY TYPE
                </label>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '6px',
                  backgroundColor: isDark ? '#2A2A2A' : '#f0f0f0',
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? '#424242' : '#e0e0e0'}`,
                }}>
                  <button
                    onClick={() => setStrategyType('standalone')}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      backgroundColor: strategyType === 'standalone' ? '#FEC00F' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      color: strategyType === 'standalone' ? '#212121' : (isDark ? '#9E9E9E' : '#757575'),
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                    }}
                    onMouseEnter={(e) => {
                      if (strategyType !== 'standalone') {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (strategyType !== 'standalone') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    Standalone
                  </button>
                  <button
                    onClick={() => setStrategyType('composite')}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      backgroundColor: strategyType === 'composite' ? '#FEC00F' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      color: strategyType === 'composite' ? '#212121' : (isDark ? '#9E9E9E' : '#757575'),
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                    }}
                    onMouseEnter={(e) => {
                      if (strategyType !== 'composite') {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (strategyType !== 'composite') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    Composite Model
                  </button>
                </div>
              </div>

              {/* Backtest Defaults Dropdown */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  style={{
                    width: '100%',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                    borderRadius: '8px',
                    color: isDark ? '#FFFFFF' : '#212121',
                    fontSize: '14px',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FEC00F';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? '#424242' : '#E0E0E0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={18} color="#FEC00F" />
                    BACKTEST DEFAULTS
                  </div>
                  {showSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* Settings Panel */}
                {showSettings && (
                  <div style={{
                    marginTop: '12px',
                    padding: '24px',
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                    borderRadius: '8px',
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '24px',
                      paddingBottom: '16px',
                      borderBottom: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                    }}>
                      <div>
                        <h3 style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '16px',
                          fontWeight: 700,
                          color: isDark ? '#FFFFFF' : '#212121',
                          letterSpacing: '1px',
                          margin: 0,
                          marginBottom: '4px',
                        }}>
                          BACKTEST SETTINGS
                        </h3>
                        <p style={{
                          fontSize: '12px',
                          color: '#9E9E9E',
                          margin: 0,
                        }}>
                          Configure your backtesting environment
                        </p>
                      </div>
                    </div>

                    {/* Capital & Position Sizing */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                      }}>
                        <DollarSign size={18} color="#FEC00F" />
                        <h4 style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          letterSpacing: '0.5px',
                          margin: 0,
                        }}>
                          CAPITAL & POSITION SIZING
                        </h4>
                      </div>

                      {/* Initial Equity */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          marginBottom: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          Initial Equity
                        </label>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{
                              position: 'absolute',
                              left: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#9E9E9E',
                              fontSize: '14px',
                            }}>
                              $
                            </span>
                            <input
                              type="number"
                              value={backtestSettings.initial_equity}
                              onChange={(e) => setBacktestSettings({
                                ...backtestSettings,
                                initial_equity: parseInt(e.target.value) || 0
                              })}
                              style={{
                                width: '100%',
                                height: '40px',
                                paddingLeft: '28px',
                                paddingRight: '12px',
                                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                                borderRadius: '6px',
                                color: isDark ? '#FFFFFF' : '#212121',
                                fontSize: '14px',
                                outline: 'none',
                                fontFamily: "'Quicksand', sans-serif",
                              }}
                            />
                          </div>
                        </div>
                        <p style={{
                          fontSize: '11px',
                          color: '#757575',
                          margin: '6px 0 0 0',
                        }}>
                          Starting capital for backtest
                        </p>
                      </div>

                      {/* Position Size */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          marginBottom: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          Position Size
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            value={backtestSettings.position_size}
                            onChange={(e) => setBacktestSettings({
                              ...backtestSettings,
                              position_size: e.target.value
                            })}
                            style={{
                              width: '100px',
                              height: '40px',
                              padding: '0 12px',
                              backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                              border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                              borderRadius: '6px',
                              color: isDark ? '#FFFFFF' : '#212121',
                              fontSize: '14px',
                              outline: 'none',
                              fontFamily: "'Quicksand', sans-serif",
                            }}
                          />
                          <select
                            value={backtestSettings.position_size_type}
                            onChange={(e) => setBacktestSettings({
                              ...backtestSettings,
                              position_size_type: e.target.value
                            })}
                            style={{
                              flex: 1,
                              height: '40px',
                              padding: '0 12px',
                              backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                              border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                              borderRadius: '6px',
                              color: isDark ? '#FFFFFF' : '#212121',
                              fontSize: '14px',
                              outline: 'none',
                              cursor: 'pointer',
                              fontFamily: "'Quicksand', sans-serif",
                            }}
                          >
                            <option value="spsPercentOfEquity">% of Equity</option>
                            <option value="spsPercentOfPosition">% of Position</option>
                            <option value="spsShares">Fixed Shares</option>
                            <option value="spsValue">Fixed Value</option>
                          </select>
                        </div>
                        <p style={{
                          fontSize: '11px',
                          color: '#757575',
                          margin: '6px 0 0 0',
                        }}>
                          Percentage of equity per position
                        </p>
                      </div>

                      {/* Max Open Positions */}
                      <div style={{ marginBottom: '0' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          marginBottom: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          Maximum Open Positions
                        </label>
                        <input
                          type="number"
                          value={backtestSettings.max_positions}
                          onChange={(e) => setBacktestSettings({
                            ...backtestSettings,
                            max_positions: parseInt(e.target.value) || 1
                          })}
                          min="1"
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 12px',
                            backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                            border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                            borderRadius: '6px',
                            color: isDark ? '#FFFFFF' : '#212121',
                            fontSize: '14px',
                            outline: 'none',
                            fontFamily: "'Quicksand', sans-serif",
                          }}
                        />
                        <p style={{
                          fontSize: '11px',
                          color: '#757575',
                          margin: '6px 0 0 0',
                        }}>
                          Limit concurrent trades
                        </p>
                      </div>
                    </div>

                    {/* Costs & Fees */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                      }}>
                        <Receipt size={18} color="#FEC00F" />
                        <h4 style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '14px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          letterSpacing: '0.5px',
                          margin: 0,
                        }}>
                          COSTS & FEES
                        </h4>
                      </div>

                      {/* Commission */}
                      <div style={{ marginBottom: '0' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          marginBottom: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          Commission Rate
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number"
                            value={backtestSettings.commission * 100}
                            onChange={(e) => setBacktestSettings({
                              ...backtestSettings,
                              commission: parseFloat(e.target.value) / 100 || 0
                            })}
                            step="0.01"
                            style={{
                              width: '100%',
                              height: '40px',
                              padding: '0 36px 0 12px',
                              backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                              border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                              borderRadius: '6px',
                              color: isDark ? '#FFFFFF' : '#212121',
                              fontSize: '14px',
                              outline: 'none',
                              fontFamily: "'Quicksand', sans-serif",
                            }}
                          />
                          <span style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9E9E9E',
                            fontSize: '14px',
                          }}>
                            %
                          </span>
                        </div>
                        <p style={{
                          fontSize: '11px',
                          color: '#757575',
                          margin: '6px 0 0 0',
                        }}>
                          Per trade commission (percentage)
                        </p>
                      </div>
                    </div>

                    {/* Margin & Leverage */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                      }}>
                        <TrendingUp size={18} color="#FEC00F" />
                        <h4 style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '14px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          letterSpacing: '0.5px',
                          margin: 0,
                        }}>
                          MARGIN & LEVERAGE
                        </h4>
                      </div>

                      {/* Margin Requirement */}
                      <div style={{ marginBottom: '0' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          marginBottom: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          Margin Requirement
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number"
                            value={backtestSettings.margin_requirement}
                            onChange={(e) => setBacktestSettings({
                              ...backtestSettings,
                              margin_requirement: parseInt(e.target.value) || 100
                            })}
                            min="1"
                            max="100"
                            style={{
                              width: '100%',
                              height: '40px',
                              padding: '0 36px 0 12px',
                              backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                              border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                              borderRadius: '6px',
                              color: isDark ? '#FFFFFF' : '#212121',
                              fontSize: '14px',
                              outline: 'none',
                              fontFamily: "'Quicksand', sans-serif",
                            }}
                          />
                          <span style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9E9E9E',
                            fontSize: '14px',
                          }}>
                            %
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '6px',
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 
                              backtestSettings.margin_requirement === 100 ? '#22C55E' :
                              backtestSettings.margin_requirement >= 50 ? '#FEC00F' : '#DC2626',
                          }} />
                          <p style={{
                            fontSize: '11px',
                            color: '#757575',
                            margin: 0,
                          }}>
                            {backtestSettings.margin_requirement === 100 ? 'Cash account' :
                             backtestSettings.margin_requirement >= 50 ? 'Moderate leverage' : 'High leverage'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trade Execution */}
                    <div style={{ marginBottom: '0' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                      }}>
                        <Zap size={18} color="#FEC00F" />
                        <h4 style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '14px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          letterSpacing: '0.5px',
                          margin: 0,
                        }}>
                          TRADE EXECUTION
                        </h4>
                      </div>

                      {/* Trade Delays */}
                      <div style={{ marginBottom: '0' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isDark ? '#FFFFFF' : '#212121',
                          marginBottom: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          Trade Execution Delays (bars)
                        </label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                        }}>
                          {/* Buy Delay */}
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px',
                            }}>
                              <ArrowUp size={14} color="#22C55E" />
                              <span style={{
                                fontSize: '12px',
                                color: '#9E9E9E',
                              }}>
                                Buy Delay
                              </span>
                            </div>
                            <input
                              type="number"
                              value={backtestSettings.trade_delays[0]}
                              onChange={(e) => {
                                const newDelays: [number, number, number, number] = [...backtestSettings.trade_delays];
                                newDelays[0] = parseInt(e.target.value) || 0;
                                setBacktestSettings({
                                  ...backtestSettings,
                                  trade_delays: newDelays
                                });
                              }}
                              min="0"
                              style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                                borderRadius: '6px',
                                color: isDark ? '#FFFFFF' : '#212121',
                                fontSize: '14px',
                                outline: 'none',
                                fontFamily: "'Quicksand', sans-serif",
                              }}
                            />
                          </div>

                          {/* Sell Delay */}
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px',
                            }}>
                              <ArrowDown size={14} color="#DC2626" />
                              <span style={{
                                fontSize: '12px',
                                color: '#9E9E9E',
                              }}>
                                Sell Delay
                              </span>
                            </div>
                            <input
                              type="number"
                              value={backtestSettings.trade_delays[1]}
                              onChange={(e) => {
                                const newDelays: [number, number, number, number] = [...backtestSettings.trade_delays];
                                newDelays[1] = parseInt(e.target.value) || 0;
                                setBacktestSettings({
                                  ...backtestSettings,
                                  trade_delays: newDelays
                                });
                              }}
                              min="0"
                              style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                                borderRadius: '6px',
                                color: isDark ? '#FFFFFF' : '#212121',
                                fontSize: '14px',
                                outline: 'none',
                                fontFamily: "'Quicksand', sans-serif",
                              }}
                            />
                          </div>

                          {/* Short Delay */}
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px',
                            }}>
                              <ArrowDown size={14} color="#FF9800" />
                              <span style={{
                                fontSize: '12px',
                                color: '#9E9E9E',
                              }}>
                                Short Delay
                              </span>
                            </div>
                            <input
                              type="number"
                              value={backtestSettings.trade_delays[2]}
                              onChange={(e) => {
                                const newDelays: [number, number, number, number] = [...backtestSettings.trade_delays];
                                newDelays[2] = parseInt(e.target.value) || 0;
                                setBacktestSettings({
                                  ...backtestSettings,
                                  trade_delays: newDelays
                                });
                              }}
                              min="0"
                              style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                                borderRadius: '6px',
                                color: isDark ? '#FFFFFF' : '#212121',
                                fontSize: '14px',
                                outline: 'none',
                                fontFamily: "'Quicksand', sans-serif",
                              }}
                            />
                          </div>

                          {/* Cover Delay */}
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px',
                            }}>
                              <ArrowUp size={14} color="#3B82F6" />
                              <span style={{
                                fontSize: '12px',
                                color: '#9E9E9E',
                              }}>
                                Cover Delay
                              </span>
                            </div>
                            <input
                              type="number"
                              value={backtestSettings.trade_delays[3]}
                              onChange={(e) => {
                                const newDelays: [number, number, number, number] = [...backtestSettings.trade_delays];
                                newDelays[3] = parseInt(e.target.value) || 0;
                                setBacktestSettings({
                                  ...backtestSettings,
                                  trade_delays: newDelays
                                });
                              }}
                              min="0"
                              style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                                borderRadius: '6px',
                                color: isDark ? '#FFFFFF' : '#212121',
                                fontSize: '14px',
                                outline: 'none',
                                fontFamily: "'Quicksand', sans-serif",
                              }}
                            />
                          </div>
                        </div>
                        <p style={{
                          fontSize: '11px',
                          color: '#757575',
                          margin: '6px 0 0 0',
                        }}>
                          Simulate real-world execution lag
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isDark ? '#FFFFFF' : '#212121',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}>
                  STRATEGY DESCRIPTION
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Create a moving average crossover strategy that goes long when the 20-day MA crosses above the 50-day MA and exits when it crosses below. Include risk management with 2% stop loss..."
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '16px',
                    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                    borderRadius: '8px',
                    color: isDark ? '#FFFFFF' : '#212121',
                    fontSize: '14px',
                    fontFamily: "'Quicksand', sans-serif",
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: loading || !prompt.trim() ? '#424242' : '#FEC00F',
                  border: 'none',
                  borderRadius: '8px',
                  color: loading || !prompt.trim() ? '#757575' : '#212121',
                  fontSize: '14px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    GENERATING...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    GENERATE AFL CODE
                  </>
                )}
              </button>

              {/* Tips */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                borderRadius: '8px',
              }}>
                <h3 style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isDark ? '#FFFFFF' : '#212121',
                  marginBottom: '12px',
                  marginTop: 0,
                }}>
                  TIPS FOR BETTER RESULTS:
                </h3>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: isDark ? '#9E9E9E' : '#757575',
                  fontSize: '13px',
                  lineHeight: 1.8,
                }}>
                  <li>Be specific about entry and exit conditions</li>
                  <li>Include stop loss and take profit levels</li>
                  <li>Mention any risk management rules</li>
                  <li>Specify any filters or market conditions</li>
                  <li>Include position sizing details</li>
                </ul>
              </div>
            </div>

            {/* Right Panel - Output */}
            <div style={{
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                borderBottom: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
              }}>
                <h2 style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isDark ? '#FFFFFF' : '#212121',
                  letterSpacing: '0.5px',
                  margin: 0,
                }}>
                  AFL CODE OUTPUT
                </h2>
                {generatedCode && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleCopy}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: copied ? '#2D7F3E' : 'transparent',
                        border: `1px solid ${copied ? '#2D7F3E' : '#424242'}`,
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'COPIED!' : 'COPY'}
                    </button>
                    <button
                      onClick={handleDownload}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #424242',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={14} />
                      DOWNLOAD
                    </button>
                  </div>
                )}
              </div>

              {/* Code Display */}
              <div style={{
                flex: 1,
                padding: '24px',
                backgroundColor: '#0D1117',
                overflow: 'auto',
                minHeight: '400px',
              }}>
                {loading ? (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#757575',
                  }}>
                    <Loader2 size={48} color="#FEC00F" style={{ marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>Generating your AFL code...</p>
                  </div>
                ) : generatedCode ? (
                  <pre style={{
                    margin: 0,
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                    fontSize: '13px',
                    lineHeight: 1.7,
                    color: '#E0E0E0',
                  }}>
                    {generatedCode.split('\n').map((line, i) => (
                      <div key={i} style={{ display: 'flex' }}>
                        <span style={{
                          width: '40px',
                          color: '#6E7681',
                          textAlign: 'right',
                          paddingRight: '16px',
                          userSelect: 'none',
                          borderRight: '1px solid #21262D',
                          marginRight: '16px',
                        }}>
                          {i + 1}
                        </span>
                        <span style={{
                          color: line.trim().startsWith('//') ? '#6A9955' :
                            line.includes('Buy') || line.includes('Sell') || line.includes('Short') || line.includes('Cover') ? '#FEC00F' :
                            line.includes('MA(') || line.includes('EMA(') || line.includes('Cross(') || line.includes('RSI(') ? '#DCDCAA' :
                            line.includes('Close') || line.includes('Open') || line.includes('High') || line.includes('Low') ? '#9CDCFE' :
                            /^\s*\d+/.test(line) ? '#B5CEA8' : '#E6EDF3'
                        }}>
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </pre>
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#757575',
                  }}>
                    <Zap size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>Generate code to see results here</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {generatedCode && !loading && (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px 24px',
                  borderTop: '1px solid #424242',
                  backgroundColor: '#1E1E1E',
                }}>
                  <button
                    style={{
                      flex: 1,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid #424242',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Zap size={16} />
                    OPTIMIZE
                  </button>
                  <button
                    style={{
                      flex: 1,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid #424242',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Bug size={16} />
                    DEBUG
                  </button>
                  <button
                    style={{
                      flex: 1,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid #424242',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Lightbulb size={16} />
                    EXPLAIN
                  </button>
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    style={{
                      flex: 1,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid #FEC00F',
                      borderRadius: '8px',
                      color: '#FEC00F',
                      fontSize: '13px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <MessageSquare size={16} />
                    FEEDBACK
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Conversation Panel */}
        <div style={{
          borderTop: '1px solid #424242',
          backgroundColor: '#1E1E1E',
          padding: '16px 32px',
        }}>
          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#121212',
              borderRadius: '8px',
              border: '1px solid #424242',
            }}>
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    backgroundColor: message.role === 'user' ? 'rgba(254, 192, 15, 0.2)' : '#2A2A2A',
                    borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    border: `1px solid ${message.role === 'user' ? '#FEC00F' : '#424242'}`,
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#FFFFFF',
                      lineHeight: 1.6,
                    }}>
                      {message.content}
                    </p>
                    <span style={{
                      fontSize: '10px',
                      color: '#757575',
                      marginTop: '6px',
                      display: 'block',
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatMessagesEndRef} />
            </div>
          )}

          {/* Chat Input Area */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
          }}>
            <div style={{ flex: 1 }}>
              {/* File Attachments Preview */}
              {chatFiles.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                }}>
                  {chatFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        backgroundColor: '#2A2A2A',
                        border: '1px solid #424242',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#FFFFFF',
                      }}
                    >
                      <FileText size={14} color="#FEC00F" />
                      <span>{file.name}</span>
                      <button
                        onClick={() => removeChatFile(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={14} color="#DC2626" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
                placeholder="Ask for code changes or improvements... (Shift+Enter for new line)"
                style={{
                  width: '100%',
                  minHeight: '56px',
                  maxHeight: '120px',
                  padding: '12px 16px',
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #424242',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontFamily: "'Quicksand', sans-serif",
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Attach File Button */}
            <button
              onClick={() => chatFileInputRef.current?.click()}
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#2A2A2A',
                border: '1px solid #424242',
                borderRadius: '8px',
                color: '#FEC00F',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FEC00F';
                e.currentTarget.style.backgroundColor = 'rgba(254, 192, 15, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#424242';
                e.currentTarget.style.backgroundColor = '#2A2A2A';
              }}
            >
              <Paperclip size={20} />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSendChatMessage}
              disabled={chatLoading || (!chatInput.trim() && chatFiles.length === 0)}
              style={{
                width: '120px',
                height: '48px',
                backgroundColor: chatLoading || (!chatInput.trim() && chatFiles.length === 0) ? '#424242' : '#FEC00F',
                border: 'none',
                borderRadius: '8px',
                color: chatLoading || (!chatInput.trim() && chatFiles.length === 0) ? '#757575' : '#212121',
                fontSize: '14px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: chatLoading || (!chatInput.trim() && chatFiles.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {chatLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  SENDING...
                </>
              ) : (
                <>
                  <MessageSquare size={16} />
                  SEND
                </>
              )}
            </button>

            {/* Hidden File Input */}
            <input
              ref={chatFileInputRef}
              type="file"
              multiple
              onChange={handleChatFileSelect}
              style={{ display: 'none' }}
              accept=".pdf,.txt,.csv,.afl,.doc,.docx"
            />
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />

        {/* CSS Animation for spinner */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default AFLGeneratorPage;