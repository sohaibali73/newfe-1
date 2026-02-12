'use client';

/**
 * InlineReactPreview - Detects React/JSX code blocks in assistant messages
 * and renders them as live previews using the ReactArtifact iframe sandbox.
 */

import React, { useState, useMemo } from 'react';
import { Eye, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { ArtifactRenderer } from '@/components/artifacts';
import type { Artifact } from '@/types/api';

interface InlineReactPreviewProps {
  text: string;
  isDark: boolean;
}

interface DetectedCodeBlock {
  code: string;
  language: string;
  title: string;
  isReactComponent: boolean;
}

/**
 * Heuristic: determine if a code block is a renderable React component.
 * Must have:
 * - JSX syntax (<Component />, <div>, etc.)
 * - A function or const starting with capital letter (component convention)
 * - More than 3 lines (not just a snippet)
 */
function isRenderableReact(code: string, language: string): boolean {
  // Languages that can contain React
  const reactLanguages = ['jsx', 'tsx', 'react', 'javascript', 'js'];
  if (!reactLanguages.includes(language.toLowerCase())) return false;

  const lines = code.trim().split('\n');
  if (lines.length < 3) return false;

  // Must contain JSX patterns
  const hasJSX = /<[A-Z][a-zA-Z]*[\s/>]/.test(code) || 
                 /<\/[A-Z]/.test(code) || 
                 /<div|<span|<button|<input|<form|<section|<main|<header|<p |<h[1-6]|<ul|<li|<table|<img/.test(code);
  
  if (!hasJSX) return false;

  // Must have a component definition (function or const with capital letter)
  const hasComponent = /(?:function|const|let|var|class)\s+[A-Z][a-zA-Z]*/.test(code) ||
                       /export\s+default\s+function\s+[A-Z]/.test(code) ||
                       /export\s+default\s+function\s*\(/.test(code);
  
  if (!hasComponent) return false;

  // Must have a return with JSX
  const hasReturn = /return\s*\(/.test(code) || /return\s*</.test(code);
  
  return hasReturn;
}

/**
 * Extract the likely component name from code for use as a title
 */
function extractComponentName(code: string): string {
  const match = code.match(/(?:export\s+default\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z]*)/);
  return match ? match[1] : 'Component';
}

/**
 * Parse markdown text and extract code blocks that look like React components
 */
function extractReactCodeBlocks(text: string): DetectedCodeBlock[] {
  const codeBlockRegex = /```(jsx|tsx|react|javascript|js)\s*\n([\s\S]*?)```/g;
  const blocks: DetectedCodeBlock[] = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1];
    const code = match[2].trim();
    const renderable = isRenderableReact(code, language);

    if (renderable) {
      blocks.push({
        code,
        language,
        title: extractComponentName(code),
        isReactComponent: true,
      });
    }
  }

  return blocks;
}

function PreviewCard({ block, isDark, index }: { block: DetectedCodeBlock; isDark: boolean; index: number }) {
  const [expanded, setExpanded] = useState(true);

  const artifact: Artifact = useMemo(() => ({
    id: `inline-react-${index}-${Date.now()}`,
    type: 'react',
    language: block.language,
    code: block.code,
    title: block.title,
    complete: true,
  }), [block, index]);

  const colors = {
    bg: isDark ? '#1a1a2e' : '#f8fafc',
    border: isDark ? '#2d2d4a' : '#e2e8f0',
    accent: '#FEC00F',
    text: isDark ? '#e2e8f0' : '#1e293b',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    headerBg: isDark ? '#151528' : '#f1f5f9',
  };

  return (
    <div style={{
      marginTop: '12px',
      marginBottom: '4px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
      backgroundColor: colors.bg,
    }}>
      {/* Compact toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '10px 14px',
          backgroundColor: colors.headerBg,
          border: 'none',
          borderBottom: expanded ? `1px solid ${colors.border}` : 'none',
          cursor: 'pointer',
          color: colors.text,
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'left',
          transition: 'background-color 0.15s ease',
        }}
      >
        <Eye size={14} style={{ color: colors.accent, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          Live Preview — {block.title}
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: colors.accent,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '2px 6px',
          backgroundColor: `${colors.accent}15`,
          borderRadius: '4px',
        }}>
          {block.language.toUpperCase()}
        </span>
        {expanded ? (
          <ChevronDown size={14} style={{ color: colors.textMuted, flexShrink: 0 }} />
        ) : (
          <ChevronRight size={14} style={{ color: colors.textMuted, flexShrink: 0 }} />
        )}
      </button>

      {/* Artifact renderer with full preview/code/download/fullscreen controls */}
      {expanded && (
        <div style={{ minHeight: '320px' }}>
          <ArtifactRenderer artifact={artifact} />
        </div>
      )}
    </div>
  );
}

export function InlineReactPreview({ text, isDark }: InlineReactPreviewProps) {
  const blocks = useMemo(() => extractReactCodeBlocks(text), [text]);

  if (blocks.length === 0) return null;

  return (
    <div style={{ width: '100%' }}>
      {blocks.map((block, idx) => (
        <PreviewCard key={`${block.title}-${idx}`} block={block} isDark={isDark} index={idx} />
      ))}
    </div>
  );
}

export default InlineReactPreview;
