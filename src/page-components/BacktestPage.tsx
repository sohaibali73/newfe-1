'use client'

import React, { useState, useRef } from 'react';
import { Upload, TrendingUp, TrendingDown, BarChart3, Loader2, AlertTriangle, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import apiClient from '@/lib/api';
import { BacktestResult } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';

export function BacktestPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  // Load backtests from localStorage on mount
  const [backtests, setBacktests] = useState<BacktestResult[]>(() => {
    try {
      const saved = localStorage.getItem('backtest_results');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist backtests to localStorage whenever they change
  React.useEffect(() => {
    try {
      // Keep max 20 backtests in localStorage
      const toSave = backtests.slice(0, 20);
      localStorage.setItem('backtest_results', JSON.stringify(toSave));
    } catch { /* Silently fail */ }
  }, [backtests]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const result = await apiClient.uploadBacktest(file);
      setBacktests(prev => [result, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze backtest');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBacktest = (index: number) => {
    setBacktests(prev => prev.filter((_, i) => i !== index));
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number) => value.toFixed(2);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#121212' : '#F5F5F5',
      padding: '32px',
      fontFamily: "'Quicksand', sans-serif",
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
          BACKTEST ANALYSIS
        </h1>
        <p style={{ color: isDark ? '#9E9E9E' : '#757575', fontSize: '15px' }}>
          Upload and analyze your strategy backtest results with AI insights
        </p>
      </div>

      {/* Upload Card */}
      <div style={{
        backgroundColor: isDark ? '#1E1E1E' : '#F9F9F9',
        border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h2 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          color: isDark ? '#FFFFFF' : '#212121',
          letterSpacing: '1px',
          marginBottom: '8px',
        }}>
          UPLOAD BACKTEST RESULTS
        </h2>
        <p style={{ color: '#757575', fontSize: '13px', marginBottom: '20px' }}>
          Upload your backtest CSV or JSON files for analysis
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid #DC2626',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertTriangle size={18} color="#DC2626" />
            <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: '2px dashed #424242',
            borderRadius: '12px',
            padding: '60px 40px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!uploading) e.currentTarget.style.borderColor = '#FEC00F';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#424242';
          }}
        >
          {uploading ? (
            <Loader2 size={40} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={40} color="#757575" />
          )}
          <p style={{ color: isDark ? '#FFFFFF' : '#212121', fontSize: '16px', fontWeight: 500, marginTop: '16px' }}>
            {uploading ? 'Analyzing backtest...' : 'Click to upload backtest file'}
          </p>
          <p style={{ color: '#757575', fontSize: '13px', marginTop: '8px' }}>
            CSV, JSON - Max 100MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          accept=".csv,.json"
          style={{ display: 'none' }}
        />
      </div>

      {/* Results */}
      {backtests.length > 0 ? (
        <div>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '20px',
            fontWeight: 600,
            color: isDark ? '#FFFFFF' : '#212121',
            letterSpacing: '1px',
            marginBottom: '20px',
          }}>
            RECENT BACKTESTS
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {backtests.map((backtest, index) => (
              <div
                key={backtest.id || `backtest-${index}`}
                style={{
                  backgroundColor: isDark ? '#1E1E1E' : '#F9F9F9',
                  border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <h3 style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '16px',
                      fontWeight: 600,
                      color: isDark ? '#FFFFFF' : '#212121',
                      margin: 0,
                    }}>
                      Strategy {backtest.strategy_id?.slice(0, 8) || 'Unknown'}
                    </h3>
                    <p style={{ color: '#757575', fontSize: '12px', marginTop: '4px' }}>
                      {new Date(backtest.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <BarChart3 size={24} color="#3B82F6" />
                </div>

                {/* Metrics */}
                <div style={{ padding: '24px' }}>
                  {/* Total Return */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}>
                      <span style={{ color: '#9E9E9E', fontSize: '14px' }}>Total Return</span>
                      <span style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: (backtest.total_return ?? 0) >= 0 ? '#2D7F3E' : '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {(backtest.total_return ?? 0) >= 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                        {formatPercent(backtest.total_return ?? 0)}
                      </span>
                    </div>
                    <div style={{
                      height: '6px',
                      backgroundColor: '#2A2A2A',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(Math.abs((backtest.total_return ?? 0)) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: (backtest.total_return ?? 0) >= 0 ? '#2D7F3E' : '#DC2626',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}>
                      <span style={{ color: '#9E9E9E', fontSize: '14px' }}>Win Rate</span>
                      <span style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#3B82F6',
                      }}>
                        {formatPercent(backtest.win_rate ?? 0)}
                      </span>
                    </div>
                    <div style={{
                      height: '6px',
                      backgroundColor: '#2A2A2A',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(backtest.win_rate ?? 0) * 100}%`,
                        height: '100%',
                        backgroundColor: '#3B82F6',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                  }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#2A2A2A',
                      borderRadius: '8px',
                    }}>
                      <p style={{ color: '#757575', fontSize: '12px', marginBottom: '4px' }}>Max Drawdown</p>
                      <p style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#DC2626',
                        margin: 0,
                      }}>
                        {formatPercent(Math.abs(backtest.max_drawdown ?? 0))}
                      </p>
                    </div>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#2A2A2A',
                      borderRadius: '8px',
                    }}>
                      <p style={{ color: '#757575', fontSize: '12px', marginBottom: '4px' }}>Sharpe Ratio</p>
                      <p style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#FEC00F',
                        margin: 0,
                      }}>
                        {formatNumber(backtest.sharpe_ratio ?? 0)}
                      </p>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: '#2A2A2A',
                    borderRadius: '8px',
                    border: '1px solid #424242',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    }}>
                      <Zap size={16} color="#FEC00F" />
                      <span style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                      }}>
                        AI INSIGHTS
                      </span>
                    </div>
                    <p style={{
                      color: '#E0E0E0',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {(backtest.total_return ?? 0) > 0 
                        ? `Strong performance with ${formatPercent(backtest.total_return ?? 0)} return. Consider optimizing to reduce the ${formatPercent(Math.abs(backtest.max_drawdown ?? 0))} max drawdown.`
                        : `Negative return detected. Review entry/exit conditions and consider adding filters.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: isDark ? '#1E1E1E' : '#F9F9F9',
          border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
          borderRadius: '12px',
          padding: '80px 40px',
          textAlign: 'center',
        }}>
          <TrendingUp size={64} color="#757575" style={{ marginBottom: '20px', opacity: 0.3 }} />
          <p style={{ color: '#757575', fontSize: '16px' }}>
            No backtests yet. Upload one to get started!
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default BacktestPage;