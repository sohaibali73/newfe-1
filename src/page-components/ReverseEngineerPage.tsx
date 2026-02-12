'use client'

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Search,
  GitBranch,
  Code,
  Check,
  Send,
  Loader2,
  ArrowRight,
  Clock,
  RefreshCw,
  Copy,
  Zap,
  Download,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trash2,
  Paperclip,
  X,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Shield,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
// FIXED: Use public directory path instead of src/assets import
const logo = '/yellowlogo.png';
import Editor from '@monaco-editor/react';
import mermaid from 'mermaid';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;                 // Local UI session ID
  strategyId?: string;        // Backend strategy_id (UUID from database)
  conversationId?: string;    // Backend conversation_id (UUID from database)
  title: string;
  created_at: string;
  messages: ChatMessage[];
  schematic?: string;
  code?: string;
}

export function ReverseEngineerPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  // Load sessions from localStorage on component mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('reverse_engineer_sessions');
      if (savedSessions) {
        const parsedSessions: Session[] = JSON.parse(savedSessions);
        // Convert timestamp strings back to Date objects
        const sessionsWithDates = parsedSessions.map(session => ({
          ...session,
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setSessions(sessionsWithDates);
      }
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
    }
    // FIXED: Mark sessions as loaded to prevent save effect from overwriting with []
    setSessionsLoaded(true);
  }, []);

  // Save sessions to localStorage whenever sessions change
  // FIXED: Only save AFTER initial load is complete to prevent overwriting with []
  useEffect(() => {
    if (!sessionsLoaded) return; // Don't save until initial load is done
    try {
      localStorage.setItem('reverse_engineer_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  }, [sessions, sessionsLoaded]);

  // Save selected session to localStorage
  useEffect(() => {
    try {
      if (selectedSession) {
        localStorage.setItem('reverse_engineer_selected_session', selectedSession.id);
      } else {
        localStorage.removeItem('reverse_engineer_selected_session');
      }
    } catch (error) {
      console.error('Failed to save selected session:', error);
    }
  }, [selectedSession]);

  // Restore selected session on component mount
  useEffect(() => {
    try {
      const savedSelectedSessionId = localStorage.getItem('reverse_engineer_selected_session');
      if (savedSelectedSessionId && sessions.length > 0) {
        const foundSession = sessions.find(s => s.id === savedSelectedSessionId);
        if (foundSession) {
          setSelectedSession(foundSession);
          // Restore the active step based on session state
          setActiveStep(foundSession.code ? 4 : foundSession.schematic ? 3 : foundSession.messages.length > 0 ? 2 : 0);
        }
      }
    } catch (error) {
      console.error('Failed to restore selected session:', error);
    }
  }, [sessions]);
  const [description, setDescription] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [copiedSchematic, setCopiedSchematic] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [schematicCollapsed, setSchematicCollapsed] = useState(false);
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Theme-aware colors
  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    sidebar: isDark ? '#1E1E1E' : '#f8f9fa',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    inputBg: isDark ? '#2A2A2A' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    codeBg: isDark ? '#0D1117' : '#f5f5f5',
  };

  const steps = [
    { icon: FileText, label: 'DESCRIBE', desc: 'Describe the strategy' },
    { icon: Search, label: 'RESEARCH', desc: 'AI researches components' },
    { icon: GitBranch, label: 'SCHEMATIC', desc: 'Generate architecture' },
    { icon: Code, label: 'CODE', desc: 'Generate AFL code' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

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

  // Parse schematic text into structured data
  const parseSchematic = (schematicText: string): {
    strategy_name?: string;
    strategy_type?: string;
    timeframe?: string;
    indicators?: string[];
    entry_logic?: string;
    exit_logic?: string;
    mermaid_diagram?: string;
    risk_management?: Record<string, any>;
    raw?: string;
    isParsed: boolean;
  } => {
    if (!schematicText) return { isParsed: false };
    try {
      // Try parsing as JSON (the backend may return JSON-formatted schematic)
      const parsed = JSON.parse(schematicText);
      return { ...parsed, isParsed: true };
    } catch {
      // Try to find JSON within the text (e.g. surrounded by other text)
      const jsonMatch = schematicText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return { ...parsed, isParsed: true };
        } catch {
          // not JSON
        }
      }
      // Return raw text as fallback
      return { raw: schematicText, isParsed: false };
    }
  };

  // Render mermaid diagram when schematic changes
  useEffect(() => {
    const schematicData = selectedSession?.schematic ? parseSchematic(selectedSession.schematic) : null;
    if (schematicData?.mermaid_diagram && mermaidRef.current) {
      const renderMermaid = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          const id = `mermaid-${Date.now()}`;
          const { svg } = await mermaid.render(id, schematicData.mermaid_diagram!);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (err) {
          console.error('Mermaid render error:', err);
          // Show raw mermaid code as fallback
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<pre style="color: ${colors.textMuted}; font-size: 11px; white-space: pre-wrap;">${schematicData.mermaid_diagram}</pre>`;
          }
        }
      };
      renderMermaid();
    }
  }, [selectedSession?.schematic, isDark]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '80px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [description]);

  const cleanText = (text: unknown): string => {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\*/g, '');
    cleaned = cleaned.replace(/#{1,6}\s*/g, '');
    cleaned = cleaned.replace(/`/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNewSession = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: 'New Strategy Session',
      created_at: new Date().toISOString(),
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession);
    setDescription('');
    setActiveStep(0);
    setError('');
    setAttachedFile(null);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
      setDescription('');
      setActiveStep(0);
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStart = async () => {
    if (!description.trim()) {
      setError('Please describe your strategy');
      return;
    }
    
    setLoading(true);
    setError('');
    setActiveStep(1);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: description,
      timestamp: new Date(),
    };

    const updatedMessages = [...(selectedSession?.messages || []), userMsg];

    try {
      const data = await apiClient.startReverseEngineering(description);
      
      // Extract response text from the API response
      const researchText = cleanText(data.response || data.description || 'Strategy analysis started.');
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: researchText,
        timestamp: new Date(),
      };

      const newMessages = [...updatedMessages, assistantMsg];
      
      // CRITICAL: Store conversation_id from backend
      const sessionData = {
        messages: newMessages,
        title: description.slice(0, 50),
        conversationId: data.conversation_id,  // Backend conversation ID
        strategyId: data.strategy_id,  // Backend strategy ID (with underscore)
        ...(data.schematic && { 
          schematic: typeof data.schematic === 'string' 
            ? data.schematic 
            : JSON.stringify(data.schematic, null, 2)
        }),
        ...(data.code && { code: cleanText(data.code) }),
      };
      
      if (selectedSession) {
        const updatedSession = {
          ...selectedSession,
          ...sessionData,
        };
        setSelectedSession(updatedSession);
        setSessions(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s));
      } else {
        const newSession: Session = {
          id: `session-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...sessionData,
        };
        setSessions(prev => [newSession, ...prev]);
        setSelectedSession(newSession);
      }
      
      // Set appropriate step
      if (data.code) {
        setActiveStep(4);
      } else if (data.schematic) {
        setActiveStep(3);
      } else {
        setActiveStep(2);
      }
    } catch (err) {
      console.error('Start error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setActiveStep(0);
    } finally {
      setLoading(false);
      setDescription('');
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || loading || !selectedSession) return;
    
    // FIXED: Use strategyId first (backend looks up strategies table, not conversations)
    const backendId = selectedSession?.strategyId || selectedSession?.conversationId;
    
    if (!backendId) {
      setError('No session ID available for chat. Please start a new session.');
      console.error('Session state:', selectedSession);
      return;
    }
    
    const userMessage = chatInput;
    setChatInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...selectedSession.messages, userMsg];
    const tempSession = { ...selectedSession, messages: updatedMessages };
    setSelectedSession(tempSession);
    setSessions(prev => prev.map(s => s.id === selectedSession.id ? tempSession : s));

    try {
      const data = await apiClient.continueReverseEngineering(backendId, userMessage);
      
      const responseText = cleanText(data.response || data.description || 'Response received.');
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      const finalSession = { 
        ...selectedSession, 
        messages: finalMessages,
        // Update schematic/code if returned - preserve JSON for visual rendering
        ...(data.schematic && { 
          schematic: typeof data.schematic === 'string' 
            ? data.schematic 
            : JSON.stringify(data.schematic, null, 2)
        }),
        ...(data.code && { code: cleanText(data.code) }),
      };
      
      setSelectedSession(finalSession);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? finalSession : s));
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setSelectedSession(selectedSession);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? selectedSession : s));
    } finally {
      setLoading(false);
    }
  };

  const handleSchematic = async () => {
    // FIXED: Must use strategyId - backend /schematic/{strategy_id} looks up strategies table
    const backendId = selectedSession?.strategyId || selectedSession?.conversationId;
    
    if (!backendId) {
      setError('No session ID available. Please start a new session.');
      console.error('Session state:', selectedSession);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await apiClient.generateStrategySchematic(backendId);
      
      // Preserve JSON structure for visual rendering - don't apply cleanText
      const schematicText = typeof data.schematic === 'string' 
        ? data.schematic 
        : JSON.stringify(data.schematic, null, 2);
      
      const responseText = data.response || 'Strategy schematic generated successfully.';
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: cleanText(responseText),
        timestamp: new Date(),
      };
      
      const updatedSession = {
        ...selectedSession!,
        messages: [...selectedSession!.messages, assistantMsg],
        schematic: schematicText,
      };
      
      setSelectedSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === selectedSession!.id ? updatedSession : s));
      setActiveStep(3);
    } catch (err) {
      console.error('Schematic generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate schematic');
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async () => {
    // FIXED: Must use strategyId - backend /generate-code/{strategy_id} looks up strategies table
    const backendId = selectedSession?.strategyId || selectedSession?.conversationId;
    
    if (!backendId) {
      setError('No session ID available. Please start a new session.');
      console.error('Session state:', selectedSession);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await apiClient.generateStrategyCode(backendId);
      
      const codeText = cleanText(data.code || '');
      const responseText = data.response || 'AFL code generated successfully.';
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: cleanText(responseText),
        timestamp: new Date(),
      };
      
      const updatedSession = {
        ...selectedSession!,
        messages: [...selectedSession!.messages, assistantMsg],
        code: codeText,
      };
      
      setSelectedSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === selectedSession!.id ? updatedSession : s));
      setActiveStep(4);
    } catch (err) {
      console.error('Code generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySchematic = () => {
    if (selectedSession?.schematic) {
      navigator.clipboard.writeText(selectedSession.schematic);
      setCopiedSchematic(true);
      setTimeout(() => setCopiedSchematic(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (selectedSession?.code) {
      navigator.clipboard.writeText(selectedSession.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    if (!selectedSession?.code) return;
    
    const blob = new Blob([selectedSession.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy_${Date.now()}.afl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  return (
    <div style={{
      height: '100vh',
      backgroundColor: colors.background,
      display: 'flex',
      fontFamily: "'Quicksand', sans-serif",
      transition: 'background-color 0.3s ease',
      position: 'relative',
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".txt,.pdf,.doc,.docx,.csv"
      />

      {/* Re-open button when sidebar is collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1001,
            background: 'rgba(254, 192, 15, 0.3)',
            border: '1px solid rgba(254, 192, 15, 0.5)',
            borderRadius: '8px',
            padding: '10px',
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
          <ChevronRight size={20} color="#FEC00F" />
        </button>
      )}

      {/* Sessions Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '0px' : '320px',
        backgroundColor: colors.sidebar,
        borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease, border 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GitBranch size={24} color="#FEC00F" />
            <div>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '1px',
                margin: 0,
                textTransform: 'uppercase',
              }}>
                SESSIONS
              </h2>
              <p style={{
                fontSize: '11px',
                color: colors.textMuted,
                margin: 0,
              }}>
                Reverse Engineer
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarCollapsed(true)}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.inputBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>

        {/* New Session Button */}
        <div style={{ padding: '16px 20px' }}>
          <button
            onClick={handleNewSession}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#FEC00F',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#212121',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 8px rgba(254,192,15,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(254,192,15,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(254,192,15,0.3)';
            }}
          >
            <GitBranch size={18} />
            New Session
          </button>
        </div>

        {/* Sessions List */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '0 12px 12px',
        }}>
          {sessions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
            }}>
              <GitBranch size={40} color={colors.textMuted} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ 
                color: colors.textMuted, 
                fontSize: '13px', 
                margin: 0,
                lineHeight: 1.6,
              }}>
                No sessions yet.<br />Start a new one!
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  position: 'relative',
                  marginBottom: '6px',
                }}
              >
                <button
                  onClick={() => {
                    setSelectedSession(session);
                    setActiveStep(session.code ? 4 : session.schematic ? 3 : session.messages.length > 0 ? 2 : 0);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 14px',
                    backgroundColor: selectedSession?.id === session.id 
                      ? (isDark ? 'rgba(254,192,15,0.15)' : 'rgba(254,192,15,0.2)')
                      : 'transparent',
                    border: selectedSession?.id === session.id 
                      ? '1px solid rgba(254,192,15,0.4)' 
                      : '1px solid transparent',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSession?.id !== session.id) {
                      e.currentTarget.style.backgroundColor = colors.inputBg;
                      e.currentTarget.style.borderColor = colors.border;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSession?.id !== session.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GitBranch size={14} color={selectedSession?.id === session.id ? '#FEC00F' : colors.textMuted} />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: selectedSession?.id === session.id ? 600 : 400,
                      color: selectedSession?.id === session.id ? colors.text : colors.textMuted,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {session.title || 'New Strategy Session'}
                    </span>
                  </div>
                </button>
                
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '26px',
                    height: '26px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: 0.5,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '0.5';
                  }}
                >
                  <Trash2 size={13} color="#EF4444" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background,
        minWidth: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            color: colors.text,
            letterSpacing: '2px',
            marginBottom: '8px',
            margin: 0,
          }}>
            REVERSE ENGINEER
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>
            Transform strategy descriptions into working AFL code
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '900px',
          }}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isComplete = index < activeStep;

              return (
                <React.Fragment key={step.label}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      backgroundColor: isComplete ? '#2D7F3E' : isActive ? '#FEC00F' : colors.inputBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      transition: 'all 0.3s',
                      border: `1px solid ${colors.border}`,
                    }}>
                      {isComplete ? (
                        <Check size={24} color="#FFFFFF" />
                      ) : (
                        <Icon size={24} color={isActive ? '#212121' : colors.textMuted} />
                      )}
                    </div>
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isComplete || isActive ? colors.text : colors.textMuted,
                      letterSpacing: '0.5px',
                    }}>
                      {step.label}
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: '11px', marginTop: '4px' }}>
                      {step.desc}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: index < activeStep ? '#2D7F3E' : colors.border,
                      margin: '0 16px',
                      marginBottom: '40px',
                      transition: 'background-color 0.3s',
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            margin: '24px 32px 0',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid #DC2626',
            borderRadius: '8px',
            padding: '12px 16px',
          }}>
            <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: schematicCollapsed && codeCollapsed 
            ? '1fr' 
            : schematicCollapsed 
            ? '400px 1fr' 
            : codeCollapsed 
            ? '400px 1fr' 
            : '400px 1fr 1fr',
          gap: '24px',
          padding: '24px 32px',
          overflow: 'hidden',
          minHeight: 0,
          transition: 'grid-template-columns 0.3s ease',
        }}>
          {/* Chat Panel */}
          <div style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {!selectedSession || activeStep === 0 ? (
              // Initial Description Input
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  letterSpacing: '1px',
                  marginBottom: '20px',
                  marginTop: 0,
                }}>
                  STRATEGY DESCRIPTION
                </h2>
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the trading strategy you want to reverse engineer..."
                  style={{
                    flex: 1,
                    padding: '16px',
                    backgroundColor: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.text,
                    fontSize: '14px',
                    fontFamily: "'Quicksand', sans-serif",
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.6,
                  }}
                />
                
                {/* Attached File Display */}
                {attachedFile && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <Paperclip size={14} color={colors.textMuted} />
                      <span style={{
                        fontSize: '13px',
                        color: colors.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {attachedFile.name}
                      </span>
                    </div>
                    <button
                      onClick={removeAttachment}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <X size={14} color="#EF4444" />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={handleFileAttach}
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.inputBg;
                      e.currentTarget.style.borderColor = '#FEC00F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = colors.border;
                    }}
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    onClick={handleStart}
                    disabled={!description.trim() || loading}
                    style={{
                      flex: 1,
                      height: '48px',
                      backgroundColor: !description.trim() || loading ? colors.border : '#FEC00F',
                      border: 'none',
                      borderRadius: '8px',
                      color: !description.trim() || loading ? colors.textMuted : '#212121',
                      fontSize: '14px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: !description.trim() || loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'START ANALYSIS'}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </div>
              </div>
            ) : (
              // Chat Interface
              <>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={logo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text,
                      margin: 0,
                    }}>
                      RESEARCH CHAT
                    </h2>
                    <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>
                      Discuss your strategy with AI
                    </p>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                  {selectedSession.messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '16px',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={logo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      )}
                      <div style={{ maxWidth: '80%' }}>
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: msg.role === 'user' ? '#FEC00F' : colors.inputBg,
                          color: msg.role === 'user' ? '#212121' : colors.text,
                          fontSize: '13px',
                          lineHeight: 1.6,
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', color: colors.textMuted }}>
                          <Clock size={10} />
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={logo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: colors.inputBg }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              backgroundColor: '#FEC00F',
                              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                      placeholder="Ask follow-up questions..."
                      style={{
                        flex: 1,
                        height: '40px',
                        padding: '0 12px',
                        backgroundColor: colors.inputBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || loading}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: chatInput.trim() && !loading ? '#FEC00F' : colors.border,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: chatInput.trim() && !loading ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Send size={16} color={chatInput.trim() && !loading ? '#212121' : colors.textMuted} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {activeStep === 2 && (
                      <button
                        onClick={handleSchematic}
                        disabled={loading}
                        style={{
                          flex: 1,
                          height: '36px',
                          backgroundColor: loading ? colors.border : '#FEC00F',
                          border: 'none',
                          borderRadius: '8px',
                          color: loading ? colors.textMuted : '#212121',
                          fontSize: '12px',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 600,
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        GENERATE SCHEMATIC
                      </button>
                    )}
                    {activeStep === 3 && (
                      <button
                        onClick={handleCode}
                        disabled={loading}
                        style={{
                          flex: 1,
                          height: '36px',
                          backgroundColor: loading ? colors.border : '#FEC00F',
                          border: 'none',
                          borderRadius: '8px',
                          color: loading ? colors.textMuted : '#212121',
                          fontSize: '12px',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 600,
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        GENERATE CODE
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Schematic Panel */}
          {!schematicCollapsed && (
          <div style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}>
                STRATEGY SCHEMATIC
              </h2>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {selectedSession?.schematic && (
                  <button
                    onClick={handleCopySchematic}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: copiedSchematic ? '#2D7F3E' : 'transparent',
                      border: `1px solid ${copiedSchematic ? '#2D7F3E' : colors.border}`,
                      borderRadius: '6px',
                      color: copiedSchematic ? '#fff' : colors.text,
                      fontSize: '12px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copiedSchematic ? <Check size={14} /> : <Copy size={14} />}
                    {copiedSchematic ? 'COPIED!' : 'COPY'}
                  </button>
                )}
                <button
                  onClick={() => setSchematicCollapsed(true)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.inputBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronRight size={16} color={colors.textMuted} />
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              backgroundColor: colors.codeBg,
              overflow: 'auto',
              padding: '20px',
            }}>
              {selectedSession?.schematic ? (() => {
                const schematicData = parseSchematic(selectedSession.schematic!);
                
                if (schematicData.isParsed) {
                  // Render as visual UI schematic
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Strategy Header Card */}
                      {(schematicData.strategy_name || schematicData.strategy_type || schematicData.timeframe) && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '10px',
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(254,192,15,0.15) 0%, rgba(254,192,15,0.05) 100%)' 
                            : 'linear-gradient(135deg, rgba(254,192,15,0.2) 0%, rgba(254,192,15,0.08) 100%)',
                          border: '1px solid rgba(254,192,15,0.3)',
                        }}>
                          {schematicData.strategy_name && (
                            <h3 style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '18px',
                              fontWeight: 700,
                              color: '#FEC00F',
                              margin: '0 0 8px 0',
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase',
                            }}>
                              {schematicData.strategy_name}
                            </h3>
                          )}
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {schematicData.strategy_type && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 600,
                                fontFamily: "'Rajdhani', sans-serif",
                                letterSpacing: '0.5px',
                                backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)',
                                color: '#A78BFA',
                                border: '1px solid rgba(139,92,246,0.3)',
                                textTransform: 'uppercase',
                              }}>
                                <Activity size={12} />
                                {schematicData.strategy_type.replace(/_/g, ' ')}
                              </span>
                            )}
                            {schematicData.timeframe && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 600,
                                fontFamily: "'Rajdhani', sans-serif",
                                letterSpacing: '0.5px',
                                backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)',
                                color: '#60A5FA',
                                border: '1px solid rgba(59,130,246,0.3)',
                                textTransform: 'uppercase',
                              }}>
                                <Clock size={12} />
                                {schematicData.timeframe}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Indicators Section */}
                      {schematicData.indicators && schematicData.indicators.length > 0 && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '10px',
                          backgroundColor: isDark ? 'rgba(30,58,95,0.4)' : 'rgba(219,234,254,0.6)',
                          border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`,
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                          }}>
                            <BarChart3 size={16} color="#60A5FA" />
                            <span style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#60A5FA',
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                            }}>
                              Indicators
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {schematicData.indicators.map((indicator: string, idx: number) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
                                border: `1px solid ${isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.2)'}`,
                                fontSize: '12px',
                                fontWeight: 500,
                                color: colors.text,
                              }}>
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#60A5FA',
                                }} />
                                {typeof indicator === 'string' 
                                  ? indicator.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                                  : String(indicator)
                                }
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Entry Logic */}
                      {schematicData.entry_logic && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '10px',
                          backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)',
                          border: `1px solid ${isDark ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.2)'}`,
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '10px',
                          }}>
                            <ArrowUpCircle size={16} color="#22C55E" />
                            <span style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#22C55E',
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                            }}>
                              Entry Logic
                            </span>
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: '13px',
                            lineHeight: 1.6,
                            color: colors.text,
                          }}>
                            {schematicData.entry_logic}
                          </p>
                        </div>
                      )}

                      {/* Exit Logic */}
                      {schematicData.exit_logic && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '10px',
                          backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
                          border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '10px',
                          }}>
                            <ArrowDownCircle size={16} color="#EF4444" />
                            <span style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#EF4444',
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                            }}>
                              Exit Logic
                            </span>
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: '13px',
                            lineHeight: 1.6,
                            color: colors.text,
                          }}>
                            {schematicData.exit_logic}
                          </p>
                        </div>
                      )}

                      {/* Risk Management */}
                      {schematicData.risk_management && Object.keys(schematicData.risk_management).length > 0 && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '10px',
                          backgroundColor: isDark ? 'rgba(251,146,60,0.08)' : 'rgba(251,146,60,0.06)',
                          border: `1px solid ${isDark ? 'rgba(251,146,60,0.25)' : 'rgba(251,146,60,0.2)'}`,
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                          }}>
                            <Shield size={16} color="#FB923C" />
                            <span style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#FB923C',
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                            }}>
                              Risk Management
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(schematicData.risk_management).map(([key, value]) => (
                              <div key={key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                backgroundColor: isDark ? 'rgba(251,146,60,0.1)' : 'rgba(251,146,60,0.08)',
                              }}>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: colors.textMuted,
                                  textTransform: 'capitalize',
                                }}>
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: colors.text,
                                }}>
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mermaid Flowchart Diagram */}
                      {schematicData.mermaid_diagram && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '10px',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${colors.border}`,
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                          }}>
                            <GitBranch size={16} color="#FEC00F" />
                            <span style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#FEC00F',
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                            }}>
                              Strategy Flow
                            </span>
                          </div>
                          <div 
                            ref={mermaidRef} 
                            style={{ 
                              width: '100%', 
                              overflow: 'auto',
                              display: 'flex',
                              justifyContent: 'center',
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Fallback: render raw text for non-JSON schematic
                  return (
                    <pre style={{
                      margin: 0,
                      fontFamily: "'Fira Code', monospace",
                      fontSize: '13px',
                      lineHeight: 1.7,
                      color: colors.text,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {selectedSession.schematic}
                    </pre>
                  );
                }
              })() : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textMuted,
                }}>
                  <GitBranch size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '14px', margin: 0, textAlign: 'center' }}>
                    {activeStep === 0 
                      ? 'Describe a strategy to begin' 
                      : activeStep < 3
                      ? 'Continue chatting, then generate schematic'
                      : 'Click "Generate Schematic"'}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Code Output Panel */}
          {!codeCollapsed && (
          <div style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: isDark ? '#252540' : '#e8e8e8',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.text,
                  fontFamily: "'Rajdhani', sans-serif",
                }}>
                  GENERATED CODE
                </span>
                {selectedSession?.code && (
                  <span style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    backgroundColor: colors.inputBg,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {selectedSession.code.split('\n').length} lines
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
              }}>
                <button
                  onClick={handleCopyCode}
                  disabled={!selectedSession?.code}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: copiedCode ? '#22C55E' : 'transparent',
                    border: `1px solid ${copiedCode ? '#22C55E' : colors.border}`,
                    borderRadius: '6px',
                    color: copiedCode ? '#fff' : colors.text,
                    fontSize: '12px',
                    cursor: selectedSession?.code ? 'pointer' : 'not-allowed',
                    opacity: selectedSession?.code ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copiedCode ? (
                    <>
                      <Check size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadCode}
                  disabled={!selectedSession?.code}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedSession?.code ? '#FEC00F' : colors.inputBg,
                    border: 'none',
                    borderRadius: '6px',
                    color: selectedSession?.code ? '#212121' : colors.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: selectedSession?.code ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSession?.code) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(254,192,15,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflow: 'hidden',
            }}>
              {selectedSession?.code ? (
                <Editor
                  height="100%"
                  defaultLanguage="afl"
                  value={selectedSession.code}
                  onChange={(value) => {
                    if (selectedSession && value !== undefined) {
                      const updatedSession = { ...selectedSession, code: value };
                      setSelectedSession(updatedSession);
                      setSessions(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s));
                    }
                  }}
                  theme={isDark ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    fontFamily: "'Fira Code', 'Monaco', monospace",
                  }}
                  onMount={handleEditorDidMount}
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textMuted,
                  padding: '20px',
                  backgroundColor: colors.codeBg,
                }}>
                  <Code size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '14px', margin: 0, textAlign: 'center' }}>
                    {activeStep === 0 
                      ? 'Describe a strategy to begin' 
                      : activeStep < 4
                      ? 'Complete previous steps, then generate code'
                      : 'Click "Generate Code"'}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Collapsed Panel Expand Buttons */}
      {(schematicCollapsed || codeCollapsed) && (
        <div style={{
          position: 'fixed',
          right: '32px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 100,
        }}>
          {schematicCollapsed && (
            <button
              onClick={() => setSchematicCollapsed(false)}
              style={{
                width: '48px',
                height: '120px',
                background: 'rgba(254, 192, 15, 0.3)',
                border: '1px solid rgba(254, 192, 15, 0.5)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
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
              <ChevronLeft size={20} color="#FEC00F" />
              <span style={{
                writingMode: 'vertical-rl',
                fontSize: '11px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                color: '#FEC00F',
                letterSpacing: '1px',
              }}>
                SCHEMATIC
              </span>
              <GitBranch size={16} color="#FEC00F" />
            </button>
          )}
          {codeCollapsed && (
            <button
              onClick={() => setCodeCollapsed(false)}
              style={{
                width: '48px',
                height: '120px',
                background: 'rgba(254, 192, 15, 0.3)',
                border: '1px solid rgba(254, 192, 15, 0.5)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
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
              <ChevronLeft size={20} color="#FEC00F" />
              <span style={{
                writingMode: 'vertical-rl',
                fontSize: '11px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                color: '#FEC00F',
                letterSpacing: '1px',
              }}>
                CODE
              </span>
              <Code size={16} color="#FEC00F" />
            </button>
          )}
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}


export default ReverseEngineerPage;