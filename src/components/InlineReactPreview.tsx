'use client';

/**
 * InlineReactPreview - Detects React/JSX code blocks in assistant messages
 * and renders them as live previews in a sandboxed iframe.
 * Uses srcdoc with Babel.transform() called explicitly after Babel loads.
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Eye, Code2, Copy, Check, Maximize2, Minimize2, Play } from 'lucide-react';

interface InlineReactPreviewProps {
  text: string;
  isDark: boolean;
}

interface DetectedCodeBlock {
  code: string;
  language: string;
  title: string;
}

function isRenderableReact(code: string, language: string): boolean {
  const reactLanguages = ['jsx', 'tsx', 'react', 'javascript', 'js'];
  if (!reactLanguages.includes(language.toLowerCase())) return false;
  const lines = code.trim().split('\n');
  if (lines.length < 5) return false;

  const hasJSX = /<[A-Z][a-zA-Z]*[\s/>]/.test(code) ||
    /<\/[A-Z]/.test(code) ||
    /<div|<span|<button|<input|<form|<section|<main|<header|<p[ >]|<h[1-6]|<ul|<li|<table|<img/.test(code);
  if (!hasJSX) return false;

  const hasComponent = /(?:function|const|let|var|class)\s+[A-Z][a-zA-Z]*/.test(code) ||
    /export\s+default\s+function/.test(code);
  if (!hasComponent) return false;

  return /return\s*\(/.test(code) || /return\s*</.test(code);
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
      blocks.push({ code, language, title: extractComponentName(code) });
    }
  }
  return blocks;
}

function cleanCode(code: string): string {
  let cleaned = code.trim();
  // Remove all import statements
  cleaned = cleaned.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  cleaned = cleaned.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
  cleaned = cleaned.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
  cleaned = cleaned.replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  // Remove TypeScript type annotations for basic cases
  cleaned = cleaned.replace(/:\s*(string|number|boolean|any|void|never|null|undefined)(\[\])?\s*(,|\)|\s*=>)/g, '$3');
  cleaned = cleaned.replace(/<(string|number|boolean|any)\[\]>/g, '');
  cleaned = cleaned.replace(/interface\s+\w+\s*\{[^}]*\}\s*/g, '');
  cleaned = cleaned.replace(/type\s+\w+\s*=\s*[^;]+;\s*/g, '');
  // Remove export keywords but keep the declarations
  cleaned = cleaned.replace(/^export\s+default\s+function\s+/gm, 'function ');
  cleaned = cleaned.replace(/^export\s+default\s+class\s+/gm, 'class ');
  cleaned = cleaned.replace(/^export\s+default\s+(?!function|class)/gm, '');
  cleaned = cleaned.replace(/^export\s+/gm, '');
  return cleaned.replace(/^\s*\n/gm, '').trim();
}

function buildSrcdoc(code: string, isDark: boolean, componentName: string): string {
  const cleaned = cleanCode(code);
  // Detect the real component name after cleaning
  const nameMatch = cleaned.match(/(?:function|class)\s+([A-Z]\w*)/);
  const detectedName = nameMatch ? nameMatch[1] : componentName;

  // Escape for embedding in srcdoc HTML attribute or inline script
  const escapedCode = cleaned
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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
  .loading-msg {
    display: flex; align-items: center; justify-content: center;
    height: 200px; color: ${isDark ? '#555' : '#aaa'}; font-size: 14px;
  }
  .render-error {
    color: #f87171; padding: 16px; border: 1px solid #dc2626;
    border-radius: 8px; background: rgba(220,38,38,0.08);
    font-family: monospace; white-space: pre-wrap; word-break: break-word;
    font-size: 13px; line-height: 1.5;
  }
</style>
</head>
<body class="${isDark ? 'dark' : ''}">
<div id="root"><div class="loading-msg">Loading preview...</div></div>

<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"><\/script>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js"><\/script>

<script>
// Wait for all CDN scripts to load, then compile and render
(function() {
  function tryRender() {
    // Check dependencies
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof Babel === 'undefined') {
      setTimeout(tryRender, 100);
      return;
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

    // Expose recharts globally
    if (window.Recharts) {
      Object.keys(window.Recharts).forEach(function(k) { window[k] = window.Recharts[k]; });
    }

    var userCode = \`${escapedCode}\`;

    try {
      // Use Babel to transform JSX to JS
      var transformed = Babel.transform(userCode, {
        presets: ['react'],
        filename: 'component.jsx',
      }).code;

      // Evaluate the transformed code
      var evalFn = new Function('React', 'ReactDOM', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer', 'createContext', 'Fragment',
        'LineChart', 'Line', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer', 'BarChart', 'Bar', 'PieChart', 'Pie', 'Cell', 'Legend', 'Area', 'AreaChart', 'RadarChart', 'Radar', 'PolarGrid', 'PolarAngleAxis', 'PolarRadiusAxis', 'ComposedChart', 'Scatter', 'ScatterChart',
        transformed + ';\\nreturn typeof ${detectedName} !== "undefined" ? ${detectedName} : (typeof App !== "undefined" ? App : (typeof Dashboard !== "undefined" ? Dashboard : (typeof Main !== "undefined" ? Main : (typeof Page !== "undefined" ? Page : (typeof Component !== "undefined" ? Component : (typeof Home !== "undefined" ? Home : null))))))');

      var Comp = evalFn(
        React, ReactDOM,
        React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback, React.useContext, React.useReducer, React.createContext, React.Fragment,
        window.LineChart || function(){return null}, window.Line || function(){return null}, window.XAxis || function(){return null}, window.YAxis || function(){return null}, window.CartesianGrid || function(){return null}, window.Tooltip || function(){return null}, window.ResponsiveContainer || function(){return null}, window.BarChart || function(){return null}, window.Bar || function(){return null}, window.PieChart || function(){return null}, window.Pie || function(){return null}, window.Cell || function(){return null}, window.Legend || function(){return null}, window.Area || function(){return null}, window.AreaChart || function(){return null}, window.RadarChart || function(){return null}, window.Radar || function(){return null}, window.PolarGrid || function(){return null}, window.PolarAngleAxis || function(){return null}, window.PolarRadiusAxis || function(){return null}, window.ComposedChart || function(){return null}, window.Scatter || function(){return null}, window.ScatterChart || function(){return null}
      );

      if (Comp && typeof Comp === 'function') {
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Comp));
        window.parent.postMessage({ type: 'INLINE_PREVIEW_OK' }, '*');
      } else {
        throw new Error('No renderable component found. Got: ' + typeof Comp);
      }
    } catch (err) {
      console.error('Preview error:', err);
      document.getElementById('root').innerHTML =
        '<div class="render-error"><strong>Render Error<\/strong>\\n\\n' +
        (err.message || String(err)).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '<\/div>';
      window.parent.postMessage({ type: 'INLINE_PREVIEW_ERROR', error: err.message }, '*');
    }
  }

  // Start checking once DOM is ready
  if (document.readyState === 'complete') {
    setTimeout(tryRender, 200);
  } else {
    window.addEventListener('load', function() { setTimeout(tryRender, 200); });
  }
})();
<\/script>
</body>
</html>`;
}


function PreviewCard({ block, isDark }: { block: DetectedCodeBlock; isDark: boolean }) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcdoc = useMemo(() => buildSrcdoc(block.code, isDark, block.title), [block.code, isDark, block.title]);

  // Listen for messages from iframe
  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'INLINE_PREVIEW_OK') {
        setLoading(false);
        setHasError(false);
      } else if (e.data?.type === 'INLINE_PREVIEW_ERROR') {
        setLoading(false);
        setHasError(true);
      }
    };
    window.addEventListener('message', handler);

    // Fallback timeout
    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => {
      window.removeEventListener('message', handler);
      clearTimeout(timeout);
    };
  }, [srcdoc]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }, [block.code]);

  const accent = '#FEC00F';
  const bg = isDark ? '#111118' : '#f9fafb';
  const headerBg = isDark ? '#0d0d14' : '#f1f5f9';
  const border = isDark ? '#23233a' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#1e293b';
  const muted = isDark ? '#64748b' : '#94a3b8';

  const containerStyle: React.CSSProperties = fullscreen
    ? { position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: bg, display: 'flex', flexDirection: 'column' }
    : { marginTop: 12, borderRadius: 10, border: `1px solid ${border}`, overflow: 'hidden', backgroundColor: bg };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', backgroundColor: headerBg,
        borderBottom: `1px solid ${border}`, minHeight: 40,
      }}>
        <Play size={14} color={accent} fill={accent} />
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.5px', color: accent,
          padding: '2px 6px', borderRadius: 4, backgroundColor: `${accent}18`,
        }}>
          Live Preview
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: text }}>
          {block.title}
        </span>

        {/* Preview / Code toggle */}
        <div style={{
          display: 'flex', borderRadius: 6, padding: 2,
          backgroundColor: isDark ? '#1a1a2e' : '#e2e8f0',
        }}>
          <button onClick={() => setViewMode('preview')} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer',
            fontSize: 11, fontWeight: 600,
            backgroundColor: viewMode === 'preview' ? accent : 'transparent',
            color: viewMode === 'preview' ? '#000' : muted,
          }}>
            <Eye size={12} /> Preview
          </button>
          <button onClick={() => setViewMode('code')} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer',
            fontSize: 11, fontWeight: 600,
            backgroundColor: viewMode === 'code' ? accent : 'transparent',
            color: viewMode === 'code' ? '#000' : muted,
          }}>
            <Code2 size={12} /> Code
          </button>
        </div>

        <button onClick={handleCopy} title="Copy code" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
          border: `1px solid ${border}`, background: 'none',
        }}>
          {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} color={muted} />}
        </button>

        <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 5, cursor: 'pointer',
          border: `1px solid ${border}`, background: 'none',
        }}>
          {fullscreen ? <Minimize2 size={12} color={muted} /> : <Maximize2 size={12} color={muted} />}
        </button>
      </div>

      {/* Content area */}
      <div style={{
        position: 'relative',
        height: fullscreen ? 'calc(100vh - 48px)' : 450,
        overflow: 'hidden',
      }}>
        {/* Loading overlay */}
        {viewMode === 'preview' && loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: bg,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: muted }}>
              <div style={{
                width: 24, height: 24,
                border: `3px solid ${border}`, borderTopColor: accent,
                borderRadius: '50%', animation: 'prevspin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 12 }}>Compiling and rendering...</span>
            </div>
          </div>
        )}

        {/* Preview iframe */}
        {viewMode === 'preview' && (
          <iframe
            ref={iframeRef}
            title={`Preview: ${block.title}`}
            srcDoc={srcdoc}
            sandbox="allow-scripts"
            style={{
              width: '100%', height: '100%', border: 'none', display: 'block',
              backgroundColor: isDark ? '#0f0f0f' : '#fff',
            }}
          />
        )}

        {/* Code view */}
        {viewMode === 'code' && (
          <pre style={{
            width: '100%', height: '100%', overflow: 'auto',
            padding: 16, margin: 0, fontSize: 12, lineHeight: 1.6,
            fontFamily: "'Fira Code', 'Consolas', monospace",
            backgroundColor: isDark ? '#0a0a14' : '#f8fafc',
            color: isDark ? '#c9d1d9' : '#24292f',
            whiteSpace: 'pre', overflowX: 'auto',
          }}>
            <code>{block.code}</code>
          </pre>
        )}
      </div>

      <style>{`@keyframes prevspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function InlineReactPreview({ text, isDark }: InlineReactPreviewProps) {
  const blocks = useMemo(() => extractReactCodeBlocks(text), [text]);
  if (blocks.length === 0) return null;

  return (
    <div style={{ width: '100%' }}>
      {blocks.map((block, idx) => (
        <PreviewCard key={`${block.title}-${idx}`} block={block} isDark={isDark} />
      ))}
    </div>
  );
}

export default InlineReactPreview;
