'use client';

/**
 * InlineReactPreview - Detects React/JSX code blocks in assistant messages
 * and renders them as live previews directly in the chat using a sandboxed iframe.
 * Uses the same approach as ReactArtifact (Babel + React CDN in an iframe).
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Eye, Code2, Copy, Check, Maximize2, Minimize2, ChevronDown, ChevronRight } from 'lucide-react';

interface InlineReactPreviewProps {
  text: string;
  isDark: boolean;
}

interface DetectedCodeBlock {
  code: string;
  language: string;
  title: string;
}

/**
 * Heuristic: determine if a code block is a renderable React component.
 */
function isRenderableReact(code: string, language: string): boolean {
  const reactLanguages = ['jsx', 'tsx', 'react', 'javascript', 'js'];
  if (!reactLanguages.includes(language.toLowerCase())) return false;

  const lines = code.trim().split('\n');
  if (lines.length < 3) return false;

  const hasJSX = /<[A-Z][a-zA-Z]*[\s/>]/.test(code) ||
    /<\/[A-Z]/.test(code) ||
    /<div|<span|<button|<input|<form|<section|<main|<header|<p[ >]|<h[1-6]|<ul|<li|<table|<img/.test(code);

  if (!hasJSX) return false;

  const hasComponent = /(?:function|const|let|var|class)\s+[A-Z][a-zA-Z]*/.test(code) ||
    /export\s+default\s+function\s+[A-Z]/.test(code) ||
    /export\s+default\s+function\s*\(/.test(code);

  if (!hasComponent) return false;

  const hasReturn = /return\s*\(/.test(code) || /return\s*</.test(code);
  return hasReturn;
}

function extractComponentName(code: string): string {
  const match = code.match(/(?:export\s+default\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z]*)/);
  return match ? match[1] : 'Component';
}

function extractReactCodeBlocks(text: string): DetectedCodeBlock[] {
  const codeBlockRegex = /```(jsx|tsx|react|javascript|js)\s*\n([\s\S]*?)```/g;
  const blocks: DetectedCodeBlock[] = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1];
    const code = match[2].trim();
    if (isRenderableReact(code, language)) {
      blocks.push({
        code,
        language,
        title: extractComponentName(code),
      });
    }
  }
  return blocks;
}

/**
 * Build the full iframe HTML document that compiles and runs React code
 * using Babel Standalone + React CDN.
 */
function buildIframeHtml(code: string, isDark: boolean, componentName: string): string {
  let cleanCode = code.trim();

  // Remove imports
  cleanCode = cleanCode.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  cleanCode = cleanCode.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
  cleanCode = cleanCode.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
  cleanCode = cleanCode.replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');

  // Remove export keywords
  cleanCode = cleanCode.replace(/^export\s+default\s+function\s+/gm, 'function ');
  cleanCode = cleanCode.replace(/^export\s+default\s+class\s+/gm, 'class ');
  cleanCode = cleanCode.replace(/^export\s+default\s+(?!function|class)/gm, '// exported: ');
  cleanCode = cleanCode.replace(/^export\s+/gm, '');

  // Convert const/let component declarations to var for function scope access
  cleanCode = cleanCode.replace(/^const\s+([A-Z]\w*)\s*=/gm, 'var $1 =');
  cleanCode = cleanCode.replace(/^let\s+([A-Z]\w*)\s*=/gm, 'var $1 =');

  cleanCode = cleanCode.replace(/^\s*\n/gm, '').trim();

  // Detect component name from cleaned code
  const nameMatch = cleanCode.match(/(?:var|function|class)\s+([A-Z]\w*)/);
  const detectedName = nameMatch ? nameMatch[1] : componentName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin></script>
  <script src="https://cdn.tailwindcss.com" crossorigin></script>
  <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js" crossorigin></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: ${isDark ? '#0f0f0f' : '#ffffff'};
      color: ${isDark ? '#e2e8f0' : '#1e293b'};
      padding: 16px;
      min-height: 100vh;
    }
    #root { width: 100%; min-height: calc(100vh - 32px); }
    .render-error {
      color: #f87171; padding: 16px; border: 1px solid #dc2626;
      border-radius: 8px; background: rgba(220,38,38,0.08);
      font-family: monospace; white-space: pre-wrap; word-break: break-word;
      font-size: 13px; line-height: 1.5;
    }
  </style>
</head>
<body class="${isDark ? 'dark' : ''}">
  <div id="root">
    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:${isDark ? '#555' : '#aaa'}">
      Loading...
    </div>
  </div>

  <script>
    // Expose recharts globally
    if (window.Recharts) {
      Object.keys(window.Recharts).forEach(function(k) { window[k] = window.Recharts[k]; });
    }
    // Expose React hooks globally
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var useMemo = React.useMemo;
    var useCallback = React.useCallback;
    var useContext = React.useContext;
    var useReducer = React.useReducer;
    var createContext = React.createContext;
    var Fragment = React.Fragment;
  </script>

  <script type="text/babel" data-presets="react">
    try {
      ${cleanCode}

      var _C = null;
      if (typeof ${detectedName} !== 'undefined') _C = ${detectedName};
      else if (typeof App !== 'undefined') _C = App;
      else if (typeof Main !== 'undefined') _C = Main;
      else if (typeof Dashboard !== 'undefined') _C = Dashboard;
      else if (typeof Page !== 'undefined') _C = Page;
      else if (typeof Component !== 'undefined') _C = Component;
      else if (typeof Home !== 'undefined') _C = Home;

      if (_C && typeof _C === 'function') {
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(_C));
        window.parent.postMessage({ type: 'INLINE_PREVIEW_LOADED' }, '*');
      } else {
        throw new Error('No renderable React component found.');
      }
    } catch (err) {
      console.error('Inline preview error:', err);
      document.getElementById('root').innerHTML =
        '<div class="render-error"><strong>Render Error</strong>\\n\\n' +
        (err.message || String(err)).replace(/</g, '&lt;') + '</div>';
      window.parent.postMessage({ type: 'INLINE_PREVIEW_ERROR', error: err.message || String(err) }, '*');
    }
  </script>
</body>
</html>`;
}

/**
 * Individual preview card that renders a single React code block
 * in an iframe sandbox with Preview/Code toggle, Copy, and Fullscreen.
 */
function PreviewCard({ block, isDark, index }: { block: DetectedCodeBlock; isDark: boolean; index: number }) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Stable HTML generation - only rebuild when code or theme changes
  const iframeHtml = useMemo(
    () => buildIframeHtml(block.code, isDark, block.title),
    [block.code, isDark, block.title]
  );

  // Set iframe src via blob URL
  useEffect(() => {
    if (!iframeRef.current) return;

    // Revoke old blob
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    setLoading(true);
    setError(null);

    const blob = new Blob([iframeHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    iframeRef.current.src = url;

    const timeout = setTimeout(() => setLoading(false), 6000);

    return () => {
      clearTimeout(timeout);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [iframeHtml]);

  // Listen for postMessage events from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'INLINE_PREVIEW_LOADED') {
        setLoading(false);
      } else if (e.data?.type === 'INLINE_PREVIEW_ERROR') {
        setLoading(false);
        setError(e.data.error);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }, [block.code]);

  const accent = '#FEC00F';
  const bg = isDark ? '#111118' : '#f9fafb';
  const headerBg = isDark ? '#0d0d14' : '#f1f5f9';
  const border = isDark ? '#23233a' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#1e293b';
  const muted = isDark ? '#64748b' : '#94a3b8';

  const containerStyle: React.CSSProperties = fullscreen
    ? {
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: bg, display: 'flex', flexDirection: 'column',
      }
    : {
        marginTop: 12, borderRadius: 10,
        border: `1px solid ${border}`, overflow: 'hidden',
        backgroundColor: bg,
      };

  return (
    <div style={containerStyle}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', backgroundColor: headerBg,
        borderBottom: collapsed ? 'none' : `1px solid ${border}`,
        minHeight: 40,
      }}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: muted, padding: 0, width: 20, height: 20,
          }}
          aria-label={collapsed ? 'Expand preview' : 'Collapse preview'}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <ChevronDown size={14} />
          }
        </button>

        {/* Language badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.5px', color: accent,
          padding: '2px 6px', borderRadius: 4,
          backgroundColor: `${accent}18`,
        }}>
          {block.language}
        </span>

        {/* Title */}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: text }}>
          {block.title}
        </span>

        {/* Preview / Code toggle */}
        {!collapsed && (
          <div style={{
            display: 'flex', borderRadius: 6, padding: 2,
            backgroundColor: isDark ? '#1a1a2e' : '#e2e8f0',
          }}>
            <button
              onClick={() => setViewMode('preview')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                backgroundColor: viewMode === 'preview' ? accent : 'transparent',
                color: viewMode === 'preview' ? '#000' : muted,
              }}
            >
              <Eye size={12} /> Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                backgroundColor: viewMode === 'code' ? accent : 'transparent',
                color: viewMode === 'code' ? '#000' : muted,
              }}
            >
              <Code2 size={12} /> Code
            </button>
          </div>
        )}

        {/* Copy */}
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
            border: `1px solid ${border}`, background: 'none',
          }}
          title="Copy code"
        >
          {copied
            ? <Check size={12} color="#22c55e" />
            : <Copy size={12} color={muted} />
          }
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => setFullscreen(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
            border: `1px solid ${border}`, background: 'none',
          }}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen
            ? <Minimize2 size={12} color={muted} />
            : <Maximize2 size={12} color={muted} />
          }
        </button>
      </div>

      {/* Content */}
      {!collapsed && (
        <div style={{
          position: 'relative',
          height: fullscreen ? 'calc(100vh - 48px)' : 420,
          overflow: 'hidden',
        }}>
          {/* Preview iframe */}
          {viewMode === 'preview' && (
            <>
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: bg,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: muted }}>
                    <div style={{
                      width: 24, height: 24,
                      border: `3px solid ${border}`, borderTopColor: accent,
                      borderRadius: '50%', animation: 'inlspin 0.8s linear infinite',
                    }} />
                    <span style={{ fontSize: 12 }}>Rendering component...</span>
                  </div>
                </div>
              )}
              {error && (
                <div style={{
                  position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 3,
                  padding: '8px 12px', borderRadius: 6,
                  backgroundColor: 'rgba(220,38,38,0.9)', color: '#fff',
                  fontSize: 11, fontFamily: 'monospace', maxHeight: 60, overflow: 'auto',
                }}>
                  {error}
                </div>
              )}
              <iframe
                ref={iframeRef}
                title={`Preview: ${block.title}`}
                sandbox="allow-scripts allow-same-origin"
                style={{
                  width: '100%', height: '100%', border: 'none', display: 'block',
                  backgroundColor: isDark ? '#0f0f0f' : '#fff',
                }}
              />
            </>
          )}

          {/* Code view */}
          {viewMode === 'code' && (
            <pre style={{
              width: '100%', height: '100%', overflow: 'auto',
              padding: 16, margin: 0, fontSize: 12, lineHeight: 1.6,
              fontFamily: "'Fira Code', 'Consolas', monospace",
              backgroundColor: isDark ? '#0a0a14' : '#f8fafc',
              color: isDark ? '#c9d1d9' : '#24292f',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              <code>{block.code}</code>
            </pre>
          )}
        </div>
      )}

      <style>{`@keyframes inlspin { to { transform: rotate(360deg); } }`}</style>
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
