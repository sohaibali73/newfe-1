'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  AlertCircle,
  Check,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Use logo from public directory (not src/assets which doesn't work in Next.js)
const logoSrc = '/yellowlogo.png';

export function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    claudeApiKey: '',
    tavilyApiKey: '',
    agreeToTerms: false,
  });

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

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.claudeApiKey.trim()) {
      setError('Claude API key is required');
      return false;
    }
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    try {
      // Use apiClient via AuthContext instead of direct fetch
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.claudeApiKey,
        formData.tavilyApiKey || ''
      );
      // AuthContext.register() handles token storage and navigation to /dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strengthColor = () => {
    const s = passwordStrength();
    if (s <= 1) return '#DC2626';
    if (s <= 2) return '#F97316';
    if (s <= 3) return '#FEC00F';
    return '#2D7F3E';
  };

  const strengthText = () => {
    const s = passwordStrength();
    if (s <= 1) return 'Weak';
    if (s <= 2) return 'Fair';
    if (s <= 3) return 'Good';
    return 'Strong';
  };

  const inputStyle: React.CSSProperties = {
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
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
    appearance: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: '#FFFFFF',
    letterSpacing: '1px',
    marginBottom: '8px',
  };

  const primaryButtonStyle: React.CSSProperties = {
    flex: 1,
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
    gap: '8px',
    boxShadow: loading ? 'none' : '0 4px 20px rgba(254, 192, 15, 0.3)',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    height: '52px',
    padding: '0 24px',
    backgroundColor: 'transparent',
    border: '1px solid #2A2A2A',
    borderRadius: '10px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    letterSpacing: '1px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#0A0A0B',
      display: 'flex',
      fontFamily: "'Quicksand', sans-serif",
      flexDirection: isMobile ? 'column' : 'row',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
    }}>
      {/* Left Side - Form */}
      <div style={{
        width: isMobile ? '100%' : '550px',
        backgroundColor: '#121212',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isSmallMobile ? '32px 24px' : '60px',
        borderRight: isMobile ? 'none' : '1px solid #2A2A2A',
        borderTop: isMobile ? '1px solid #2A2A2A' : 'none',
        overflowY: 'auto',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingBottom: isSmallMobile ? 'max(60px, env(safe-area-inset-bottom))' : '60px',
      }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img 
                src={logoSrc} 
                alt="Analyst Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }} 
              />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '20px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '2px',
                margin: 0,
              }}>
                ANALYST
              </h1>
              <p style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '10px',
                color: '#FEC00F',
                letterSpacing: '4px',
                margin: 0,
              }}>
                BY POTOMAC
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}>
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: step >= s ? '#FEC00F' : '#2A2A2A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {step > s ? (
                    <Check size={18} color="#0A0A0B" />
                  ) : (
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      color: step >= s ? '#0A0A0B' : '#757575',
                    }}>
                      {s}
                    </span>
                  )}
                </div>
                {s < 3 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: step > s ? '#FEC00F' : '#2A2A2A',
                    margin: '0 8px',
                    transition: 'all 0.3s',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Title */}
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '2px',
            marginBottom: '8px',
          }}>
            {step === 1 && 'CREATE ACCOUNT'}
            {step === 2 && 'SET PASSWORD'}
            {step === 3 && 'API CONFIGURATION'}
          </h2>
          <p style={{
            color: '#757575',
            fontSize: '14px',
            marginBottom: '32px',
          }}>
            {step === 1 && 'Enter your personal information'}
            {step === 2 && 'Create a secure password'}
            {step === 3 && 'Configure your AI services'}
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
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>FULL NAME</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="John Doe"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  style={{ ...primaryButtonStyle, width: '100%' }}
                >
                  CONTINUE
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      placeholder="Min. 8 characters"
                      style={{ ...inputStyle, paddingRight: '48px' }}
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
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {formData.password && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: i <= passwordStrength() ? strengthColor() : '#2A2A2A',
                              transition: 'all 0.2s',
                            }}
                          />
                        ))}
                      </div>
                      <p style={{ color: strengthColor(), fontSize: '12px', margin: 0 }}>
                        Password strength: {strengthText()}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>CONFIRM PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      style={{ ...inputStyle, paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p style={{ color: '#2D7F3E', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Passwords match
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={handleBack} style={secondaryButtonStyle}>
                    <ChevronLeft size={20} />
                    BACK
                  </button>
                  <button type="button" onClick={handleNext} style={primaryButtonStyle}>
                    CONTINUE
                    <ChevronRight size={20} />
                  </button>
                </div>
              </>
            )}

            {/* Step 3: API Keys */}
            {step === 3 && (
              <>
                {/* Info Box */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'rgba(254, 192, 15, 0.1)',
                  border: '1px solid rgba(254, 192, 15, 0.2)',
                  borderRadius: '10px',
                  marginBottom: '24px',
                }}>
                  <Info size={20} color="#FEC00F" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ color: '#E0E0E0', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                    Your API keys are encrypted and stored securely. They're only used to make AI requests on your behalf.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    CLAUDE API KEY
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#2D7F3E',
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: '#FFFFFF',
                    }}>
                      REQUIRED
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showClaudeKey ? 'text' : 'password'}
                      value={formData.claudeApiKey}
                      onChange={(e) => updateFormData('claudeApiKey', e.target.value)}
                      placeholder="sk-ant-..."
                      style={{ ...inputStyle, paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowClaudeKey(!showClaudeKey)}
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
                      }}
                    >
                      {showClaudeKey ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p style={{ color: '#757575', fontSize: '12px', marginTop: '8px' }}>
                    Get your key from{' '}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#FEC00F', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      console.anthropic.com <ExternalLink size={12} />
                    </a>
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    TAVILY API KEY
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#424242',
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: '#9E9E9E',
                    }}>
                      OPTIONAL
                    </span>
                  </label>
                  <input
                    type="password"
                    value={formData.tavilyApiKey}
                    onChange={(e) => updateFormData('tavilyApiKey', e.target.value)}
                    placeholder="tvly-..."
                    style={inputStyle}
                  />
                  <p style={{ color: '#757575', fontSize: '12px', marginTop: '8px' }}>
                    Used for web search features
                  </p>
                </div>

                {/* Terms Checkbox */}
                <div
                  onClick={() => updateFormData('agreeToTerms', !formData.agreeToTerms)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: `2px solid ${formData.agreeToTerms ? '#FEC00F' : '#2A2A2A'}`, 
                      backgroundColor: formData.agreeToTerms ? '#FEC00F' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      marginTop: '2px',
                    }}
                  >
                    {formData.agreeToTerms && <Check size={14} color="#0A0A0B" />}
                  </div>
                  <span style={{ color: '#9E9E9E', fontSize: '13px', lineHeight: 1.5 }}>
                    I agree to the{' '}
                    <span style={{ color: '#FEC00F' }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color: '#FEC00F' }}>Privacy Policy</span>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={handleBack} style={secondaryButtonStyle}>
                    <ChevronLeft size={20} />
                    BACK
                  </button>
                  <button type="submit" disabled={loading} style={primaryButtonStyle}>
                    {loading ? (
                      <>
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        CREATING...
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} />
                        CREATE ACCOUNT
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Sign In Link */}
          <p style={{
            textAlign: 'center',
            color: '#9E9E9E',
            fontSize: '14px',
            marginTop: '32px',
          }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#FEC00F', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div style={{
        flex: isMobile ? undefined : 1,
        background: 'linear-gradient(135deg, #1A1A1D 0%, #0A0A0B 50%, #1A1A1D 100%)',
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isSmallMobile ? '40px 24px' : '60px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: isMobile ? 'auto' : '100dvh',
        paddingTop: isMobile ? '40px' : '60px',
        paddingBottom: isSmallMobile ? 'max(60px, env(safe-area-inset-bottom))' : '60px',
      }}>
        {/* Background Effects */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 80% 50%, rgba(254, 192, 15, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(254, 192, 15, 0.05) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />

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
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 40px',
            overflow: 'hidden',
          }}>
            <img 
              src={logoSrc} 
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
            fontSize: '56px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '6px',
            marginBottom: '8px',
          }}>
            ANALYST
          </h1>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '18px',
            fontWeight: 500,
            color: '#FEC00F',
            letterSpacing: '10px',
            marginBottom: '40px',
          }}>
            BY POTOMAC
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {[ 
              { icon: Zap, text: 'AI-Powered AFL Code Generation' },
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

        <p style={{
          position: 'absolute',
          bottom: '32px',
          color: '#757575',
          fontSize: '12px',
        }}>
          © 2026 Potomac Fund Management. All rights reserved.
          Developed by Sohaib Ali.
        </p>
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


export default RegisterPage;
