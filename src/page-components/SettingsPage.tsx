'use client'

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Key,
  Palette,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  Sun,
  Moon,
  Monitor,
  Trash2,
  LogOut,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useResponsive } from '@/hooks/useResponsive';

interface SettingsData {
  profile: {
    name: string;
    email: string;
    nickname: string;
  };
  apiKeys: {
    claudeApiKey: string;
    tavilyApiKey: string;
  };
  appearance: {
    theme: string;
    accentColor: string;
    fontSize: string;
  };
  notifications: {
    emailNotifications: boolean;
    codeGenComplete: boolean;
    backtestComplete: boolean;
    weeklyDigest: boolean;
  };
}

const sections = [
  { id: 'profile', label: 'PROFILE', icon: User },
  { id: 'api-keys', label: 'API KEYS', icon: Key },
  { id: 'appearance', label: 'APPEARANCE', icon: Palette },
  { id: 'notifications', label: 'NOTIFICATIONS', icon: Bell },
  { id: 'security', label: 'SECURITY', icon: Shield },
];

export function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme, accentColor, setAccentColor } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { isMobile, isTablet } = useResponsive();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showTavilyKey, setShowTavilyKey] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: '',
      email: '',
      nickname: '',
    },
    apiKeys: {
      claudeApiKey: '',
      tavilyApiKey: '',
    },
    appearance: {
      theme: 'dark',
      accentColor: '#FEC00F',
      fontSize: 'medium',
    },
    notifications: {
      emailNotifications: true,
      codeGenComplete: true,
      backtestComplete: true,
      weeklyDigest: false,
    },
  });

  // Load settings from localStorage on mount and sync theme from context
  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }

    // Load user info from token/API
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setSettings(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            name: user.name || '',
            email: user.email || '',
          },
        }));
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }
  }, []);

  // Sync theme from context to settings state
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, theme },
    }));
  }, [theme]);

  // Theme-aware colors
  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    cardBg: isDark ? '#1E1E1E' : '#f5f5f5',
    inputBg: isDark ? '#2A2A2A' : '#ffffff',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    textSecondary: isDark ? '#757575' : '#9E9E9E',
    hoverBg: isDark ? '#2A2A2A' : '#e8e8e8',
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    // Apply theme using the context
    setTheme(settings.appearance.theme as 'light' | 'dark' | 'system');
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      localStorage.clear();
      router.push('/login');
    }
  };

  const updateProfile = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  const updateApiKeys = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [field]: value },
    }));
  };

  const updateAppearance = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value },
    }));
    
    // Apply accent color immediately if it's being changed
    if (field === 'accentColor') {
      setAccentColor(value);
    }
    
    // Apply font size immediately if it's being changed
    if (field === 'fontSize') {
      setFontSize(value as 'small' | 'medium' | 'large');
    }
  };

  const updateNotifications = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Clean, bright interface' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Match system preference' },
  ];

  const accentColors = [
    { value: '#FEC00F', label: 'Potomac Yellow' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#22C55E', label: 'Green' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F97316', label: 'Orange' },
    { value: '#EC4899', label: 'Pink' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '48px',
    padding: '0 16px',
    backgroundColor: colors.inputBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    fontSize: '14px',
    fontFamily: "'Quicksand', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: colors.text,
    letterSpacing: '1px',
    marginBottom: '8px',
    transition: 'color 0.3s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      padding: isMobile ? '20px' : (isTablet ? '32px' : '48px'),
      fontFamily: "'Quicksand', sans-serif",
      transition: 'background-color 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: 700,
          color: colors.text,
          letterSpacing: '1.5px',
          marginBottom: '12px',
          transition: 'color 0.3s ease',
          lineHeight: 1.2,
        }}>
          SETTINGS
        </h1>
        <p style={{ 
          color: colors.textMuted, 
          fontSize: isMobile ? '15px' : '16px', 
          margin: 0,
          lineHeight: 1.6,
        }}>
          Manage your account settings and preferences
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '240px 1fr' : '280px 1fr'), 
        gap: isMobile ? '20px' : '24px' 
      }}>
        {/* Sidebar */}
        <div style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '16px',
          height: 'fit-content',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  marginBottom: '4px',
                  backgroundColor: isActive ? '#FEC00F' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <Icon size={20} color={isActive ? '#212121' : colors.textMuted} />
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isActive ? '#212121' : colors.text,
                  letterSpacing: '0.5px',
                }}>
                  {section.label}
                </span>
              </button>
            );
          })}

          <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: '16px', paddingTop: '16px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #DC2626',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <LogOut size={20} color="#DC2626" />
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: '#DC2626',
              }}>
                LOGOUT
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '32px',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}>
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '8px',
                marginTop: 0,
              }}>
                PROFILE SETTINGS
              </h2>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '32px' }}>
                Update your personal information
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FEC00F 0%, #FFD740 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#212121',
                  }}>
                    {settings.profile.name.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>FULL NAME</label>
                  <input
                    type="text"
                    value={settings.profile.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>NICKNAME</label>
                  <input
                    type="text"
                    value={settings.profile.nickname}
                    onChange={(e) => updateProfile('nickname', e.target.value)}
                    placeholder="What should we call you?"
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* API Keys Section */}
          {activeSection === 'api-keys' && (
            <div>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '8px',
                marginTop: 0,
              }}>
                API KEYS
              </h2>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '32px' }}>
                Manage your API keys for AI services
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'rgba(254, 192, 15, 0.1)',
                border: '1px solid #FEC00F',
                borderRadius: '8px',
                marginBottom: '32px',
              }}>
                <Shield size={20} color="#FEC00F" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ color: '#E0E0E0', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  Your API keys are encrypted and stored securely.
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  CLAUDE API KEY
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#2D7F3E',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#FFFFFF',
                  }}>
                    REQUIRED
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showClaudeKey ? 'text' : 'password'}
                    value={settings.apiKeys.claudeApiKey}
                    onChange={(e) => updateApiKeys('claudeApiKey', e.target.value)}
                    placeholder="sk-ant-..."
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#757575',
                    }}
                  >
                    {showClaudeKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p style={{ color: '#757575', fontSize: '12px', marginTop: '8px' }}>
                  Get your key from{' '}
                  <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#FEC00F', textDecoration: 'none' }}>
                    console.anthropic.com <ExternalLink size={12} style={{ display: 'inline' }} />
                  </a>
                </p>
              </div>

              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  TAVILY API KEY
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#424242',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#9E9E9E',
                  }}>
                    OPTIONAL
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showTavilyKey ? 'text' : 'password'}
                    value={settings.apiKeys.tavilyApiKey}
                    onChange={(e) => updateApiKeys('tavilyApiKey', e.target.value)}
                    placeholder="tvly-..."
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTavilyKey(!showTavilyKey)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#757575',
                    }}
                  >
                    {showTavilyKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '8px',
                marginTop: 0,
              }}>
                APPEARANCE
              </h2>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '32px' }}>
                Customize the look and feel
              </p>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ ...labelStyle, marginBottom: '16px' }}>THEME</label>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                  {themeOptions.map((themeOption) => {
                    const Icon = themeOption.icon;
                    const isSelected = settings.appearance.theme === themeOption.value;
                    return (
                      <button
                        key={themeOption.value}
                        onClick={() => updateAppearance('theme', themeOption.value)}
                        style={{
                          padding: '24px 16px',
                          backgroundColor: isSelected ? 'rgba(254, 192, 15, 0.1)' : colors.inputBg,
                          border: `2px solid ${isSelected ? '#FEC00F' : colors.border}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'background-color 0.3s ease, border-color 0.3s ease',
                        }}
                      >
                        <Icon size={32} color={isSelected ? '#FEC00F' : colors.textMuted} style={{ marginBottom: '12px' }} />
                        <p style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '14px',
                          fontWeight: 600,
                          color: isSelected ? colors.text : colors.textMuted,
                          marginBottom: '4px',
                        }}>
                          {themeOption.label.toUpperCase()}
                        </p>
                        <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>
                          {themeOption.desc}
                        </p>
                        {isSelected && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#FEC00F',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '12px auto 0',
                          }}>
                            <Check size={14} color="#212121" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ ...labelStyle, marginBottom: '16px' }}>ACCENT COLOR</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {accentColors.map((color) => {
                    const isSelected = settings.appearance.accentColor === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => updateAppearance('accentColor', color.value)}
                        title={color.label}
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: color.value,
                          border: `3px solid ${isSelected ? '#FFFFFF' : 'transparent'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && <Check size={20} color="#212121" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ ...labelStyle, marginBottom: '16px' }}>FONT SIZE</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['small', 'medium', 'large'].map((size) => {
                    const isSelected = settings.appearance.fontSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => updateAppearance('fontSize', size)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: isSelected ? '#FEC00F' : colors.inputBg,
                          border: `1px solid ${isSelected ? '#FEC00F' : colors.border}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isSelected ? '#212121' : colors.text,
                          transition: 'background-color 0.3s ease, border-color 0.3s ease',
                        }}
                      >
                        {size.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '8px',
                marginTop: 0,
              }}>
                NOTIFICATIONS
              </h2>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '32px' }}>
                Configure how you receive notifications
              </p>

              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'codeGenComplete', label: 'Code Generation Complete', desc: 'Notify when AFL code generation finishes' },
                { key: 'backtestComplete', label: 'Backtest Analysis Complete', desc: 'Notify when backtest analysis finishes' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary' },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px',
                    backgroundColor: colors.inputBg,
                    borderRadius: '8px',
                    marginBottom: '12px',
                    transition: 'background-color 0.3s ease',
                  }}
                >
                  <div>
                    <p style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text,
                      marginBottom: '4px',
                    }}>
                      {item.label.toUpperCase()}
                    </p>
                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => updateNotifications(item.key, !settings.notifications[item.key as keyof typeof settings.notifications])}
                    style={{
                      width: '52px',
                      height: '28px',
                      backgroundColor: settings.notifications[item.key as keyof typeof settings.notifications] ? '#FEC00F' : '#424242',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '3px',
                      left: settings.notifications[item.key as keyof typeof settings.notifications] ? '27px' : '3px',
                      transition: 'all 0.2s',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '8px',
                marginTop: 0,
              }}>
                SECURITY
              </h2>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '32px' }}>
                Manage your security settings
              </p>

              <div style={{
                padding: '24px',
                backgroundColor: colors.inputBg,
                borderRadius: '12px',
                marginBottom: '24px',
                transition: 'background-color 0.3s ease',
              }}>
                <h3 style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  marginBottom: '16px',
                  marginTop: 0,
                }}>
                  CHANGE PASSWORD
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <input type="password" placeholder="Current password" style={inputStyle} />
                  <input type="password" placeholder="New password" style={inputStyle} />
                  <input type="password" placeholder="Confirm new password" style={inputStyle} />
                  <button style={{
                    width: 'fit-content',
                    padding: '12px 24px',
                    backgroundColor: '#FEC00F',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#212121',
                    fontSize: '13px',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                    UPDATE PASSWORD
                  </button>
                </div>
              </div>

              <div style={{
                padding: '24px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid #DC2626',
                borderRadius: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <AlertTriangle size={24} color="#DC2626" />
                  <h3 style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#DC2626',
                    margin: 0,
                  }}>
                    DANGER ZONE
                  </h3>
                </div>
                <p style={{ color: '#E0E0E0', fontSize: '13px', marginBottom: '16px' }}>
                  Once you delete your account, there is no going back.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    border: '1px solid #DC2626',
                    borderRadius: '8px',
                    color: '#DC2626',
                    fontSize: '13px',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Trash2 size={16} />
                  DELETE ACCOUNT
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={handleSave}
              style={{
                padding: '14px 32px',
                backgroundColor: saved ? '#2D7F3E' : '#FEC00F',
                border: 'none',
                borderRadius: '8px',
                color: saved ? '#FFFFFF' : '#212121',
                fontSize: '14px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {saved ? <Check size={18} /> : <Save size={18} />}
              {saved ? 'SAVED!' : 'SAVE CHANGES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default SettingsPage;
