'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  Loader2, 
  AlertCircle,
  Zap,
  BarChart3,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
// Import removed - will use direct path

export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsSmallMobile(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Note: AuthContext.login() already handles navigation to /dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: resolvedTheme === 'dark' ? '#0A0A0B' : '#ffffff',
      display: 'flex',
      fontFamily: "'Quicksand', sans-serif",
      flexDirection: isMobile ? 'column' : 'row',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
    }}>
      {/* Left Side - Branding */}
      <div style={{
        flex: isMobile ? undefined : 1,
        background: resolvedTheme === 'dark' 
          ? 'linear-gradient(135deg, #1A1A1D 0%, #0A0A0B 50%, #1A1A1D 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isSmallMobile ? '40px 24px' : '60px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingTop: isMobile ? '20px' : '60px',
        paddingBottom: isMobile ? '30px' : '0',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(254, 192, 15, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(254, 192, 15, 0.05) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Grid Lines */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(254, 192, 15, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(254, 192, 15, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '500px' }}>
          {/* Logo */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            overflow: 'hidden',
          }}>
            <img 
              src="/yellowlogo.png" 
              alt="Analyst Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </div>

          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '48px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}>
            ANALYST
          </h1>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '16px',
            fontWeight: 500,
            color: '#FEC00F',
            letterSpacing: '8px',
            marginBottom: '24px',
          }}>
            BY POTOMAC
          </p>
          <p style={{
            color: '#9E9E9E',
            fontSize: '16px',
            lineHeight: 1.7,
            marginBottom: '48px',
          }}>
            Break the status quo<br />
            Generate, analyze, and optimize AFL code with ease.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: Zap, text: 'AI-Powered Code Generation' },
              { icon: BarChart3, text: 'Advanced Backtest Analysis' },
              { icon: Shield, text: 'Enterprise-Grade Security' },
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 24px',
                  backgroundColor: 'rgba(254, 192, 15, 0.05)',
                  border: '1px solid rgba(254, 192, 15, 0.1)',
                  borderRadius: '12px',
                }}
              >
                <feature.icon size={24} color="#FEC00F" />
                <span style={{ color: '#E0E0E0', fontSize: '14px', fontWeight: 500 }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Text */}
        <p style={{
          position: 'absolute',
          bottom: '32px',
          color: '#757575',
          fontSize: '12px',
        }}>
          © 2026 Potomac Fund Management. All rights reserved.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        width: isMobile ? '100%' : '500px',
        backgroundColor: '#121212',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isSmallMobile ? '32px 24px' : '60px',
        borderLeft: isMobile ? 'none' : '1px solid #2A2A2A',
        borderTop: isMobile ? '1px solid #2A2A2A' : 'none',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingBottom: isSmallMobile ? 'max(32px, env(safe-area-inset-bottom))' : '60px',
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '2px',
            marginBottom: '8px',
          }}>
            WELCOME BACK
          </h2>
          <p style={{
            color: '#757575',
            fontSize: '14px',
            marginBottom: '40px',
          }}>
            Sign in to continue to your dashboard
          </p>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '10px',
              marginBottom: '24px',
            }}>
              <AlertCircle size={20} color="#DC2626" />
              <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                color: '#FFFFFF',
                letterSpacing: '1px',
                marginBottom: '8px',
              }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #2A2A2A',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontFamily: "'Quicksand', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FEC00F';
                  e.target.style.boxShadow = '0 0 0 3px rgba(254, 192, 15, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2A2A2A';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <label style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '1px',
                }}>
                  PASSWORD
                </label>
                <Link
                  href="/forgot-password"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FEC00F',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'Quicksand', sans-serif",
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    height: '52px',
                    padding: '0 48px 0 16px',
                    backgroundColor: '#1E1E1E',
                    border: '1px solid #2A2A2A',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontFamily: "'Quicksand', sans-serif",
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FEC00F';
                    e.target.style.boxShadow = '0 0 0 3px rgba(254, 192, 15, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#2A2A2A';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#757575',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: loading ? '#424242' : '#FEC00F',
                border: 'none',
                borderRadius: '10px',
                color: loading ? '#757575' : '#0A0A0B',
                fontSize: '14px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(254, 192, 15, 0.3)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  SIGNING IN...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  SIGN IN
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '32px 0',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#2A2A2A' }} />
            <span style={{ padding: '0 16px', color: '#757575', fontSize: '12px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#2A2A2A' }} />
          </div>

          {/* Sign Up Link */}
          <p style={{
            textAlign: 'center',
            color: '#9E9E9E',
            fontSize: '14px',
            margin: 0,
          }}>
            Don't have an account?{' '}
            <Link
              href="/register"
              style={{
                color: '#FEC00F',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
