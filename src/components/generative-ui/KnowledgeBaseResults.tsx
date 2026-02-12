'use client';

import React from 'react';
import { Database, FileText, Tag, Clock, Search } from 'lucide-react';

interface KBDocument {
  id: string;
  title: string;
  category?: string;
  summary?: string;
  tags?: string[];
  content_snippet?: string;
}

interface KnowledgeBaseResultsProps {
  success?: boolean;
  query?: string;
  category_filter?: string;
  results_count?: number;
  search_time_ms?: number;
  results?: KBDocument[];
  error?: string;
  _tool_time_ms?: number;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  afl: { bg: 'rgba(254, 192, 15, 0.15)', text: '#FEC00F' },
  strategy: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  indicator: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
  general: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' },
  documentation: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
};

export function KnowledgeBaseResults(props: KnowledgeBaseResultsProps) {
  if (!props.success && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>
        <strong>Knowledge Base Error:</strong> {props.error}
      </div>
    );
  }

  const results = props.results || [];

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.3)', maxWidth: '600px', marginTop: '8px' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} color="#3b82f6" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#3b82f6' }}>Knowledge Base Results</span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
            {props.results_count || results.length} found
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          {props.search_time_ms && <span><Clock size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {props.search_time_ms}ms</span>}
        </div>
      </div>

      {/* Query */}
      {props.query && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          <Search size={12} /> "{props.query}"
          {props.category_filter && <span style={{ ...getCategoryStyle(props.category_filter), padding: '2px 8px', borderRadius: '8px', fontSize: '11px' }}>{props.category_filter}</span>}
        </div>
      )}

      {/* Results */}
      <div style={{ backgroundColor: '#0d1117' }}>
        {results.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            No documents found matching your query.
          </div>
        ) : (
          results.map((doc, i) => (
            <div key={doc.id || i} style={{ padding: '14px 16px', borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <FileText size={14} color="rgba(255,255,255,0.5)" />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#e6edf3' }}>{doc.title}</span>
                {doc.category && (
                  <span style={{ ...getCategoryStyle(doc.category), padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>
                    {doc.category}
                  </span>
                )}
              </div>
              {doc.summary && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: '0 0 6px 22px' }}>
                  {doc.summary}
                </p>
              )}
              {doc.content_snippet && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, margin: '0 0 6px 22px', fontStyle: 'italic', borderLeft: '2px solid rgba(59, 130, 246, 0.3)', paddingLeft: '8px' }}>
                  {doc.content_snippet}
                </div>
              )}
              {doc.tags && doc.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginLeft: '22px' }}>
                  {doc.tags.map((tag, j) => (
                    <span key={j} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                      <Tag size={8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getCategoryStyle(category: string): React.CSSProperties {
  const colors = categoryColors[category] || categoryColors.general;
  return { backgroundColor: colors.bg, color: colors.text };
}

export default KnowledgeBaseResults;
