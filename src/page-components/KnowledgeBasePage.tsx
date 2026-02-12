'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Trash2, FileText, Database, Loader2, X, FolderOpen } from 'lucide-react';
import apiClient from '@/lib/api';
import { Document, SearchResult, BrainStats } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

export function KnowledgeBasePage() {
  const { resolvedTheme } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const isDark = resolvedTheme === 'dark';
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<BrainStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{total: number; completed: number; failed: number}>({ total: 0, completed: 0, failed: 0 });
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme-aware colors
  const colors = {
    background: isDark ? '#121212' : '#F5F5F5',
    cardBg: isDark ? '#1E1E1E' : '#F9F9F9',
    inputBg: isDark ? '#2A2A2A' : '#FFFFFF',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    hoverBg: isDark ? '#2A2A2A' : '#f0f0f0',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsData, statsData] = await Promise.all([
        apiClient.getDocuments(),
        apiClient.getBrainStats(),
      ]);
      setDocuments(docsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploading(true);
    setError('');
    setUploadProgress({ total: fileArray.length, completed: 0, failed: 0 });

    const uploadedDocs: Document[] = [];
    let failedCount = 0;
    const failedFiles: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const doc = await apiClient.uploadDocument(file);
        uploadedDocs.push(doc);
        setUploadProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
      } catch (err) {
        failedCount++;
        failedFiles.push(file.name);
        setUploadProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
    }

    // Add all successfully uploaded documents to the list
    if (uploadedDocs.length > 0) {
      setDocuments(prev => [...uploadedDocs, ...prev]);
      // Refresh stats after batch upload
      try {
        const statsData = await apiClient.getBrainStats();
        setStats(statsData);
      } catch (err) {
        // Silently fail stats refresh
      }
    }

    // Show error for failed uploads
    if (failedFiles.length > 0) {
      setError(`Failed to upload ${failedCount} file(s): ${failedFiles.join(', ')}`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await apiClient.searchKnowledge(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await apiClient.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      padding: isMobile ? '20px' : (isTablet ? '28px' : '32px'),
      fontFamily: "'Quicksand', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: 700,
          color: colors.text,
          letterSpacing: '2px',
          marginBottom: '8px',
        }}>
          KNOWLEDGE BASE
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '15px' }}>
          Upload and manage your trading documents and knowledge resources
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid #DC2626',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{error}</p>
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '32px',
        }}>
          {[
            { label: 'Total Documents', value: stats.total_documents },
            { label: 'Total Size', value: formatFileSize(stats.total_size) },
            { label: 'Categories', value: Object.keys(stats.categories).length },
          ].map((stat) => (
            <div key={stat.label} style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
            }}>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
              <p style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '36px',
                fontWeight: 700,
                color: colors.text,
                margin: 0,
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '24px' }}>
        {/* Upload Section */}
        <div style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: colors.text,
            letterSpacing: '1px',
            marginBottom: '8px',
          }}>
            UPLOAD DOCUMENT
          </h2>
          <p style={{ color: '#757575', fontSize: '13px', marginBottom: '20px' }}>
            Add files to your knowledge base
          </p>

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${colors.border}`,
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '16px',
            }}
            onMouseEnter={(e) => {
              if (!uploading) e.currentTarget.style.borderColor = '#FEC00F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
            }}
          >
            {uploading ? (
              <Loader2 size={32} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload size={32} color="#757575" />
            )}
            <p style={{ color: colors.text, fontSize: '14px', fontWeight: 500, marginTop: '12px' }}>
              {uploading ? `Uploading ${uploadProgress.completed + uploadProgress.failed}/${uploadProgress.total}...` : 'Click to upload files'}
            </p>
            <p style={{ color: '#757575', fontSize: '12px', marginTop: '4px' }}>
              {uploading ? '' : 'PDF, TXT, DOC - Select multiple files'}
            </p>
          </div>

          {/* Upload Progress Bar */}
          {uploading && uploadProgress.total > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <span style={{ color: '#9E9E9E', fontSize: '12px' }}>
                  Progress: {uploadProgress.completed} of {uploadProgress.total} files
                </span>
                {uploadProgress.failed > 0 && (
                  <span style={{ color: '#DC2626', fontSize: '12px' }}>
                    {uploadProgress.failed} failed
                  </span>
                )}
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#2A2A2A',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${((uploadProgress.completed + uploadProgress.failed) / uploadProgress.total) * 100}%`,
                  height: '100%',
                  backgroundColor: uploadProgress.failed > 0 ? '#FEC00F' : '#FEC00F',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            accept=".pdf,.txt,.doc,.docx"
            multiple
            style={{ display: 'none' }}
          />
        </div>

        {/* Search Section */}
        <div style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: colors.text,
            letterSpacing: '1px',
            marginBottom: '8px',
          }}>
            SEARCH KNOWLEDGE
          </h2>
          <p style={{ color: '#757575', fontSize: '13px', marginBottom: '20px' }}>
            Find relevant information in your documents
          </p>

          <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} color="#757575" style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                    borderRadius: '8px',
                    color: isDark ? '#FFFFFF' : '#212121',
                    fontSize: '14px',
                    fontFamily: "'Quicksand', sans-serif",
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FEC00F'}
                  onBlur={(e) => e.target.style.borderColor = isDark ? '#424242' : '#E0E0E0'}
                />
              </div>
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: searching || !searchQuery.trim() ? '#424242' : '#FEC00F',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: searching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {searching ? (
                  <Loader2 size={18} color="#757575" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Search size={18} color={!searchQuery.trim() ? '#757575' : '#212121'} />
                )}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{ maxHeight: '250px', overflow: 'auto' }}>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    border: `1px solid ${isDark ? '#424242' : '#E0E0E0'}`,
                  }}
                >
                  <p style={{ color: '#9E9E9E', fontSize: '12px', marginBottom: '6px' }}>
                    {result.filename}
                  </p>
                  <p style={{
                    color: isDark ? '#FFFFFF' : '#212121',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {result.content}
                  </p>
                  <p style={{ color: '#757575', fontSize: '11px', marginTop: '8px' }}>
                    Relevance: {(result.relevance_score * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div style={{
        marginTop: '24px',
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: colors.text,
            letterSpacing: '1px',
            margin: 0,
          }}>
            DOCUMENTS
          </h2>
          <p style={{ color: '#757575', fontSize: '13px', marginTop: '4px' }}>
            {documents.length} documents in your knowledge base
          </p>
        </div>

        {loading ? (
          <div style={{
            padding: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Loader2 size={32} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : documents.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
          }}>
            <Database size={48} color="#757575" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ color: '#757575', fontSize: '14px' }}>
              No documents yet. Upload one to get started!
            </p>
          </div>
        ) : (
          <div>
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: idx < documents.length - 1 ? `1px solid ${colors.border}` : 'none',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FileText size={20} color="#FEC00F" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: colors.text,
                      fontSize: '14px',
                      fontWeight: 500,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {doc.filename}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      marginTop: '4px',
                    }}>
                      <span style={{ color: '#757575', fontSize: '12px' }}>{doc.category}</span>
                      <span style={{ color: '#757575', fontSize: '12px' }}>{formatFileSize(doc.size)}</span>
                      <span style={{ color: '#757575', fontSize: '12px' }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#757575',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.color = '#757575';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


export default KnowledgeBasePage;
