'use client'

import React, { useState, useEffect } from 'react';
import {
  Search,
  Lightbulb,
  MessageCircle,
  BookOpen,
  Play,
  Loader,
  AlertCircle,
  ThumbsUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import apiClient from '@/lib/api';
import {
  LearningCurve,
  PopularPattern,
  KnowledgeSearchResult,
  TrainingStats,
  UserFeedback,
  TrainingSuggestion,
  TrainingCategory,
} from '@/types/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const styles = {
  page: {
    minHeight: '100vh',
    fontFamily: "'Quicksand', sans-serif",
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,
  header: {
    borderBottom: '1px solid #424242',
    padding: '24px 16px',
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
  } as React.CSSProperties,
  title: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '14px',
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: 500,
  } as React.CSSProperties,
  content: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,
  statValue: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '28px',
    fontWeight: 700,
    color: '#FEC00F',
    marginBottom: '4px',
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,
  badgePending: {
    backgroundColor: '#FEC00F22',
    color: '#FEC00F',
    border: '1px solid #FEC00F44',
  } as React.CSSProperties,
  badgeApproved: {
    backgroundColor: '#4CAF5022',
    color: '#4CAF50',
    border: '1px solid #4CAF5044',
  } as React.CSSProperties,
  badgeImplemented: {
    backgroundColor: '#2196F322',
    color: '#2196F3',
    border: '1px solid #2196F344',
  } as React.CSSProperties,
  badgeRejected: {
    backgroundColor: '#F4444422',
    color: '#F44444',
    border: '1px solid #F4444444',
  } as React.CSSProperties,
};

interface TabData {
  learningCurve: LearningCurve | null;
  popularPatterns: PopularPattern[];
  stats: TrainingStats | null;
  feedback: UserFeedback[];
  suggestions: TrainingSuggestion[];
  knowledgeResults: KnowledgeSearchResult[];
}

export default function TrainingPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const isDark = resolvedTheme === 'dark';
  
  // Theme-aware colors
  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    sidebar: isDark ? '#1E1E1E' : '#f8f9fa',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    inputBg: isDark ? '#2A2A2A' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    codeBg: isDark ? '#1a1a2e' : '#f5f5f5',
    userBubble: '#FEC00F',
    assistantBubble: isDark ? '#2A2A2A' : '#f0f0f0',
  };
  
  // Dynamic styles that depend on theme
  const dynamicStyles = {
    card: {
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '20px',
    } as React.CSSProperties,
    statItem: {
      backgroundColor: colors.inputBg,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '16px',
    } as React.CSSProperties,
    statLabel: {
      color: colors.textMuted,
      fontSize: '12px',
      fontWeight: 600,
    } as React.CSSProperties,
    knowledgeCard: {
      backgroundColor: colors.inputBg,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '16px',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    inputField: {
      backgroundColor: colors.inputBg,
      border: `1px solid ${colors.border}`,
      color: colors.text,
      borderRadius: '6px',
      padding: '8px 12px',
      fontFamily: "'Quicksand', sans-serif",
      fontSize: '13px',
    } as React.CSSProperties,
  };
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<TabData>({
    learningCurve: null,
    popularPatterns: [],
    stats: null,
    feedback: [],
    suggestions: [],
    knowledgeResults: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    title: '',
    description: '',
    example_input: '',
    example_output: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    code_id: '',
    feedback_type: 'correction' as any,
    feedback_text: '',
    correct_code: '',
    rating: 5,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [curve, patterns, stats, feedback, suggestions] = await Promise.all([
        apiClient.getLearningCurve().catch(() => null),
        apiClient.getPopularPatterns(),
        apiClient.getTrainStats(),
        apiClient.getMyFeedback(),
        apiClient.getMySuggestions(),
      ]);

      setData({
        learningCurve: curve,
        popularPatterns: patterns || [],
        stats: stats || null,
        feedback: feedback || [],
        suggestions: suggestions || [],
        knowledgeResults: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load training data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      setError(null);
      const results = await apiClient.searchTrainingKnowledge(searchQuery, undefined, 20);
      setData((prev) => ({ ...prev, knowledgeResults: results }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTestTraining = async () => {
    if (!testPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    try {
      setIsTesting(true);
      setError(null);
      const result = await apiClient.testTraining({
        prompt: testPrompt,
        category: 'afl',
        include_training: true,
      });
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestForm.title.trim() || !suggestForm.example_output.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.suggestTraining(suggestForm);
      setShowSuggestDialog(false);
      setSuggestForm({ title: '', description: '', example_input: '', example_output: '', reason: '' });
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.feedback_text.trim()) {
      setError('Please enter feedback');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.submitFeedback(feedbackForm);
      setShowFeedbackDialog(false);
      setFeedbackForm({ code_id: '', feedback_type: 'correction', feedback_text: '', correct_code: '', rating: 5 });
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackIcon = (type: string) => {
    const iconStyle = { width: '16px', height: '16px', marginRight: '6px' };
    switch (type) {
      case 'praise':
        return <ThumbsUp style={{ ...iconStyle, color: '#4CAF50' }} />;
      case 'correction':
        return <AlertTriangle style={{ ...iconStyle, color: '#2196F3' }} />;
      case 'improvement':
        return <Zap style={{ ...iconStyle, color: '#FF9800' }} />;
      case 'bug':
        return <AlertCircle style={{ ...iconStyle, color: '#F44444' }} />;
      default:
        return null;
    }
  };

  const getSuggestionBadgeStyle = (status: string) => {
    const baseStyle = { display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 };
    switch (status) {
      case 'pending':
        return { ...baseStyle, ...styles.badgePending };
      case 'approved':
        return { ...baseStyle, ...styles.badgeApproved };
      case 'implemented':
        return { ...baseStyle, ...styles.badgeImplemented };
      case 'rejected':
        return { ...baseStyle, ...styles.badgeRejected };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={{ ...styles.page, backgroundColor: colors.background }}>
      {/* Header */}
      <div style={{ ...styles.header, backgroundColor: colors.cardBg, borderColor: colors.border, padding: isMobile ? '24px 16px' : (isTablet ? '28px 24px' : '32px') }}>
        <div style={styles.headerContent}>
          <h1 style={{ ...styles.title, color: colors.text }}>Training & Learning</h1>
          <p style={{ ...styles.subtitle, color: colors.textMuted }}>Improve code generation, test training effectiveness, and share insights</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ ...styles.content, backgroundColor: colors.background, padding: isMobile ? '16px' : (isTablet ? '24px' : '32px') }}>
        {error && (
          <Alert style={{ marginBottom: '20px', backgroundColor: '#F4444422', border: '1px solid #F4444444', color: '#F44444' }}>
            <AlertCircle style={{ color: '#F44444' }} />
            <AlertDescription style={{ color: '#F44444' }}>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
            <Loader style={{ width: '32px', height: '32px', animation: 'spin 2s linear infinite', marginBottom: '16px', display: 'inline-block' }} />
            <p>Loading your training data...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList style={{ backgroundColor: 'transparent', borderBottom: `2px solid ${colors.border}`, marginBottom: '24px', padding: '0', height: 'auto', display: 'flex', gap: '0' }}>
              <TabsTrigger value="overview" style={{ color: activeTab === 'overview' ? '#FEC00F' : colors.textMuted, backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'overview' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', position: 'relative', cursor: 'pointer', textTransform: 'uppercase' }}>
                <BarChart3 style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="test" style={{ color: activeTab === 'test' ? '#FEC00F' : colors.textMuted, backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'test' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', position: 'relative', cursor: 'pointer', textTransform: 'uppercase' }}>
                <Play style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                Test Training
              </TabsTrigger>
              <TabsTrigger value="knowledge" style={{ color: activeTab === 'knowledge' ? '#FEC00F' : colors.textMuted, backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'knowledge' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', position: 'relative', cursor: 'pointer', textTransform: 'uppercase' }}>
                <BookOpen style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="suggestions" style={{ color: activeTab === 'suggestions' ? '#FEC00F' : colors.textMuted, backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'suggestions' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', position: 'relative', cursor: 'pointer', textTransform: 'uppercase' }}>
                <Lightbulb style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                Suggestions
              </TabsTrigger>
              <TabsTrigger value="feedback" style={{ color: activeTab === 'feedback' ? '#FEC00F' : colors.textMuted, backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'feedback' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', position: 'relative', cursor: 'pointer', textTransform: 'uppercase' }}>
                <MessageCircle style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                Feedback
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div style={{ display: 'grid', gap: '24px' }}>
                {data.stats && (
                  <div style={dynamicStyles.card}>
                    <h2 style={{ ...styles.sectionTitle, color: colors.text }}>Your Training Statistics</h2>
                    <div style={styles.statsGrid}>
                      <div style={dynamicStyles.statItem}>
                        <div style={styles.statValue}>{data.stats.total}</div>
                        <div style={dynamicStyles.statLabel}>Total Examples</div>
                      </div>
                      <div style={dynamicStyles.statItem}>
                        <div style={styles.statValue}>{data.stats.active}</div>
                        <div style={dynamicStyles.statLabel}>Active Examples</div>
                      </div>
                      <div style={dynamicStyles.statItem}>
                        <div style={styles.statValue}>{data.feedback.length}</div>
                        <div style={dynamicStyles.statLabel}>Feedback Submitted</div>
                      </div>
                      <div style={dynamicStyles.statItem}>
                        <div style={styles.statValue}>{data.suggestions.length}</div>
                        <div style={dynamicStyles.statLabel}>Suggestions Made</div>
                      </div>
                    </div>
                  </div>
                )}

                {data.learningCurve && (
                  <div style={dynamicStyles.card}>
                    <h2 style={{ ...styles.sectionTitle, color: colors.text }}>Your Learning Progress</h2>
                    <div style={{ backgroundColor: colors.inputBg, borderRadius: '8px', padding: '20px', textAlign: 'center', color: colors.textMuted, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p>Learning curve chart will display your code quality improvements over time</p>
                    </div>
                  </div>
                )}

                {data.popularPatterns.length > 0 && (
                  <div style={dynamicStyles.card}>
                    <h2 style={{ ...styles.sectionTitle, color: colors.text }}>Popular Training Patterns</h2>
                    <div style={styles.grid}>
                      {data.popularPatterns.slice(0, 6).map((pattern) => (
                        <div key={pattern.id} style={dynamicStyles.knowledgeCard} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FEC00F'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; }}>
                          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 600, color: '#FEC00F', fontSize: '12px' }}>{pattern.training_type}</div>
                            <div style={{ fontSize: '12px', color: colors.textMuted }}>{pattern.usage_count}x used</div>
                          </div>
                          <h3 style={{ color: colors.text, fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{pattern.title}</h3>
                          <p style={{ color: colors.textMuted, fontSize: '12px' }}>Category: {pattern.category}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <button onClick={() => setShowTestDialog(true)} style={{ backgroundColor: '#FEC00F', color: '#212121', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: "'Rajdhani', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                    <Play style={{ width: '16px', height: '16px' }} />
                    Test Training
                  </button>
                  <button onClick={() => setShowSuggestDialog(true)} style={{ backgroundColor: colors.inputBg, color: colors.text, padding: '12px 24px', borderRadius: '8px', border: `1px solid ${colors.border}`, cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: "'Rajdhani', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.5px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FEC00F'; e.currentTarget.style.color = '#FEC00F'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.text; }}>
                    <Lightbulb style={{ width: '16px', height: '16px' }} />
                    Suggest Training
                  </button>
                  <button onClick={() => setShowFeedbackDialog(true)} style={{ backgroundColor: colors.inputBg, color: colors.text, padding: '12px 24px', borderRadius: '8px', border: `1px solid ${colors.border}`, cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: "'Rajdhani', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.5px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FEC00F'; e.currentTarget.style.color = '#FEC00F'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.text; }}>
                    <MessageCircle style={{ width: '16px', height: '16px' }} />
                    Submit Feedback
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* Test Training Tab */}
            <TabsContent value="test">
              <div style={dynamicStyles.card}>
                <h2 style={{ ...styles.sectionTitle, color: colors.text }}>Test Training Effectiveness</h2>
                <p style={{ color: colors.textMuted, marginBottom: '16px', fontSize: '14px', fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}>Generate code with and without training to see how training improves output quality</p>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Prompt</label>
                  <Textarea value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} placeholder="e.g., Create a moving average crossover strategy" style={{ ...dynamicStyles.inputField, minHeight: '80px' }} />
                </div>
                <button onClick={handleTestTraining} disabled={isTesting} style={{ backgroundColor: isTesting ? colors.border : '#FEC00F', color: isTesting ? colors.textMuted : '#212121', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: isTesting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px', opacity: isTesting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                  {isTesting ? <><Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />Testing...</> : <><Play style={{ width: '16px', height: '16px' }} />Run Test</>}
                </button>
                {testResult && (
                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Test Results</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ ...dynamicStyles.card, backgroundColor: colors.inputBg }}>
                        <div style={{ fontSize: '12px', color: colors.textMuted, fontWeight: 600, marginBottom: '8px' }}>WITHOUT TRAINING</div>
                        <div style={{ backgroundColor: colors.codeBg, borderRadius: '6px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: colors.text, maxHeight: '200px', overflowY: 'auto' }}>
                          {testResult.without_training?.code || 'No code generated'}
                        </div>
                      </div>
                      <div style={{ ...dynamicStyles.card, backgroundColor: colors.inputBg }}>
                        <div style={{ fontSize: '12px', color: '#FEC00F', fontWeight: 600, marginBottom: '8px' }}>WITH TRAINING</div>
                        <div style={{ backgroundColor: colors.codeBg, borderRadius: '6px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#4CAF50', maxHeight: '200px', overflowY: 'auto' }}>
                          {testResult.with_training?.code || 'No code generated'}
                        </div>
                      </div>
                    </div>
                    {testResult.differences_detected && (
                      <Alert style={{ backgroundColor: '#4CAF5022', border: '1px solid #4CAF5044' }}>
                        <CheckCircle style={{ color: '#4CAF50' }} />
                        <AlertDescription style={{ color: '#4CAF50' }}>Training made a difference! The AI generated better code with training context.</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge">
              <div style={dynamicStyles.card}>
                <h2 style={{ ...styles.sectionTitle, color: colors.text }}>Knowledge Base Search</h2>
                <p style={{ color: colors.textMuted, marginBottom: '16px', fontSize: '14px' }}>Search training examples, rules, and patterns</p>
                <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search training examples, patterns, rules..." style={{ ...dynamicStyles.inputField }} />
                  <button onClick={handleSearch} disabled={isSearching} style={{ backgroundColor: isSearching ? colors.border : '#FEC00F', color: isSearching ? colors.textMuted : '#212121', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: isSearching ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px', letterSpacing: '0.5px', opacity: isSearching ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isSearching ? <><Loader style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />Searching...</> : <><Search style={{ width: '14px', height: '14px' }} />Search</>}
                  </button>
                </div>
                {data.knowledgeResults.length > 0 && (
                  <div style={styles.grid}>
                    {data.knowledgeResults.map((result) => (
                      <div key={result.id} style={dynamicStyles.knowledgeCard} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#3A3A3A' : '#f0f0f0'; e.currentTarget.style.borderColor = '#FEC00F'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? colors.inputBg : colors.inputBg; e.currentTarget.style.borderColor = colors.border; }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#FEC00F' }}>{result.training_type}</span>
                          <span style={{ fontSize: '11px', color: colors.textMuted }}>Relevance: {(result.relevance_score * 100).toFixed(0)}%</span>
                        </div>
                        <h3 style={{ color: colors.text, fontSize: '13px', fontWeight: 600, marginBottom: '8px', wordBreak: 'break-word' }}>{result.title}</h3>
                        {result.excerpt && <p style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '8px', lineHeight: '1.4' }}>{result.excerpt.substring(0, 150)}...</p>}
                        <p style={{ color: colors.textMuted, fontSize: '11px' }}>Category: {result.category}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!isSearching && data.knowledgeResults.length === 0 && searchQuery && (
                  <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted }}>
                    <Search style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.5, display: 'inline-block' }} />
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
                {!searchQuery && (
                  <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted }}>
                    <BookOpen style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.5, display: 'inline-block' }} />
                    <p>Enter a search query to explore the knowledge base</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions">
              <div style={dynamicStyles.card}>
                <h2 style={{ ...styles.sectionTitle, color: colors.text }}>Your Training Suggestions</h2>
                <p style={{ color: colors.textMuted, marginBottom: '16px', fontSize: '14px', fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}>{data.suggestions.length} suggestion{data.suggestions.length !== 1 ? 's' : ''} made</p>
                {data.suggestions.length > 0 ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {data.suggestions.map((suggestion) => (
                      <div key={suggestion.id} style={{ ...dynamicStyles.knowledgeCard, backgroundColor: colors.inputBg, cursor: 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h3 style={{ color: colors.text, fontSize: '14px', fontWeight: 600, flex: 1 }}>{suggestion.title}</h3>
                          <span style={getSuggestionBadgeStyle(suggestion.status)}>{suggestion.status}</span>
                        </div>
                        {suggestion.description && <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '8px' }}>{suggestion.description}</p>}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          {suggestion.example_input && <div style={{ fontSize: '11px', color: colors.textMuted }}><span style={{ color: colors.textMuted, fontWeight: 600 }}>Input:</span> {suggestion.example_input.substring(0, 50)}</div>}
                          {suggestion.example_output && <div style={{ fontSize: '11px', color: colors.textMuted }}><span style={{ color: colors.textMuted, fontWeight: 600 }}>Output:</span> {suggestion.example_output.substring(0, 50)}</div>}
                        </div>
                        <p style={{ fontSize: '11px', color: colors.textMuted }}>Created: {new Date(suggestion.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted }}>
                    <Lightbulb style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.5, display: 'inline-block' }} />
                    <p>No suggestions yet. Help improve the training by suggesting examples!</p>
                    <button onClick={() => setShowSuggestDialog(true)} style={{ marginTop: '16px', backgroundColor: '#FEC00F', color: '#212121', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px' }}>
                      Create First Suggestion
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback">
              <div style={dynamicStyles.card}>
                <h2 style={{ ...styles.sectionTitle, color: colors.text }}>Your Feedback</h2>
                <p style={{ color: colors.textMuted, marginBottom: '16px', fontSize: '14px', fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}>{data.feedback.length} feedback submission{data.feedback.length !== 1 ? 's' : ''}</p>
                {data.feedback.length > 0 ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {data.feedback.map((fb) => (
                      <div key={fb.id} style={{ ...dynamicStyles.knowledgeCard, backgroundColor: colors.inputBg, cursor: 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          {getFeedbackIcon(fb.feedback_type)}
                          <span style={{ color: colors.textMuted, fontSize: '12px', fontWeight: 600 }}>{fb.feedback_type}</span>
                          {fb.rating && <span style={{ marginLeft: 'auto', color: '#FEC00F', fontSize: '12px' }}>{'â­'.repeat(fb.rating)}</span>}
                        </div>
                        <p style={{ color: colors.text, fontSize: '13px', marginBottom: '8px', wordBreak: 'break-word' }}>{fb.feedback_text}</p>
                        {fb.correct_code && <div style={{ backgroundColor: colors.codeBg, borderRadius: '6px', padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#4CAF50', marginBottom: '8px', maxHeight: '100px', overflowY: 'auto' }}>{fb.correct_code}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.textMuted }}>
                          <span>Status: {fb.status}</span>
                          <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted }}>
                    <MessageCircle style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.5, display: 'inline-block' }} />
                    <p>No feedback submitted yet. Share your thoughts about generated code!</p>
                    <button onClick={() => setShowFeedbackDialog(true)} style={{ marginTop: '16px', backgroundColor: '#FEC00F', color: '#212121', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px' }}>
                      Submit Feedback
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.text, fontFamily: "'Rajdhani', sans-serif" }}>Test Training</DialogTitle>
              <DialogDescription style={{ color: colors.textMuted }}>Generate code with and without training to compare quality</DialogDescription>
            </DialogHeader>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Prompt</label>
                <Textarea value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} placeholder="e.g., Create a moving average crossover strategy" style={{ ...dynamicStyles.inputField, minHeight: '80px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowTestDialog(false)} style={{ backgroundColor: colors.border, color: colors.text, padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.5px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#3A3A3A' : '#e0e0e0'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.border; }}>
                  Cancel
                </button>
                <button onClick={handleTestTraining} disabled={isTesting} style={{ backgroundColor: isTesting ? colors.border : '#FEC00F', color: isTesting ? colors.textMuted : '#212121', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: isTesting ? 'not-allowed' : 'pointer', opacity: isTesting ? 0.6 : 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.5px', transition: 'all 0.2s' }}>
                  Run Test
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSuggestDialog} onOpenChange={setShowSuggestDialog}>
          <DialogContent style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.text, fontFamily: "'Rajdhani', sans-serif" }}>Suggest Training</DialogTitle>
              <DialogDescription style={{ color: colors.textMuted }}>Help improve the AI by suggesting training examples</DialogDescription>
            </DialogHeader>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Title *</label>
                <Input value={suggestForm.title} onChange={(e) => setSuggestForm({ ...suggestForm, title: e.target.value })} placeholder="What should be learned?" style={dynamicStyles.inputField} />
              </div>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Description</label>
                <Textarea value={suggestForm.description} onChange={(e) => setSuggestForm({ ...suggestForm, description: e.target.value })} placeholder="Explain what this training should teach" style={{ ...dynamicStyles.inputField, minHeight: '60px' }} />
              </div>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Example Input</label>
                <Textarea value={suggestForm.example_input} onChange={(e) => setSuggestForm({ ...suggestForm, example_input: e.target.value })} placeholder="Example input/prompt" style={{ ...dynamicStyles.inputField, minHeight: '60px' }} />
              </div>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Expected Output *</label>
                <Textarea value={suggestForm.example_output} onChange={(e) => setSuggestForm({ ...suggestForm, example_output: e.target.value })} placeholder="Correct/desired output" style={{ ...dynamicStyles.inputField, minHeight: '80px' }} />
              </div>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Why is this important?</label>
                <Textarea value={suggestForm.reason} onChange={(e) => setSuggestForm({ ...suggestForm, reason: e.target.value })} placeholder="Explain why the AI needs to learn this" style={{ ...dynamicStyles.inputField, minHeight: '60px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSuggestDialog(false)} style={{ backgroundColor: colors.border, color: colors.text, padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.5px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#3A3A3A' : '#e0e0e0'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.border; }}>
                  Cancel
                </button>
                <button onClick={handleSubmitSuggestion} disabled={isSubmitting} style={{ backgroundColor: isSubmitting ? colors.border : '#FEC00F', color: isSubmitting ? colors.textMuted : '#212121', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.5px', transition: 'all 0.2s' }}>
                  Submit
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.text, fontFamily: "'Rajdhani', sans-serif" }}>Submit Feedback</DialogTitle>
              <DialogDescription style={{ color: colors.textMuted }}>Help improve code generation with your feedback</DialogDescription>
            </DialogHeader>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Feedback Type *</label>
                <select value={feedbackForm.feedback_type} onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_type: e.target.value })} style={{ ...dynamicStyles.inputField, width: '100%' }}>
                  <option value="correction">Correction (Code was wrong)</option>
                  <option value="improvement">Improvement (Better approach)</option>
                  <option value="bug">Bug (Found a bug)</option>
                  <option value="praise">Praise (Excellent code)</option>
                </select>
              </div>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Your Feedback *</label>
                <Textarea value={feedbackForm.feedback_text} onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_text: e.target.value })} placeholder="What feedback do you have?" style={{ ...dynamicStyles.inputField, minHeight: '80px' }} />
              </div>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Correct Code (if applicable)</label>
                <Textarea value={feedbackForm.correct_code} onChange={(e) => setFeedbackForm({ ...feedbackForm, correct_code: e.target.value })} placeholder="Provide the correct version if this is a correction" style={{ ...dynamicStyles.inputField, minHeight: '60px', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ color: colors.text, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Rating (1-5)</label>
                <select value={feedbackForm.rating} onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: parseInt(e.target.value) })} style={{ ...dynamicStyles.inputField, width: '100%' }}>
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Very Poor</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowFeedbackDialog(false)} style={{ backgroundColor: colors.border, color: colors.text, padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.5px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#3A3A3A' : '#e0e0e0'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.border; }}>
                  Cancel
                </button>
                <button onClick={handleSubmitFeedback} disabled={isSubmitting} style={{ backgroundColor: isSubmitting ? colors.border : '#FEC00F', color: isSubmitting ? colors.textMuted : '#212121', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.5px', transition: 'all 0.2s' }}>
                  Submit
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

