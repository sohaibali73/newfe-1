'use client'

import React, { useState, useEffect, ReactNode } from 'react';
import {
  BarChart3,
  Settings,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Plus,
  Search,
  Loader,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useTabContext } from '@/contexts/TabContext';
import { apiClient } from '@/lib/api';
import { AdminStatus, AdminUser, TrainingData, UserFeedback, TrainingSuggestion, AnalyticsOverview } from '@/types/api';


const styles = {
  page: {
    minHeight: '100vh',
    fontFamily: "'Quicksand', sans-serif",
  },
  header: {
    borderBottom: '1px solid #424242',
    padding: '32px',
    transition: 'background-color 0.3s ease',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: '14px',
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: 500,
  },
  content: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#1E1E1E',
    border: '1px solid #424242',
    borderRadius: '12px',
    padding: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statItem: {
    backgroundColor: '#2A2A2A',
    border: '1px solid #424242',
    borderRadius: '8px',
    padding: '16px',
  },
  statValue: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '28px',
    fontWeight: 700,
    color: '#FEC00F',
    marginBottom: '4px',
  },
  statLabel: {
    color: '#9E9E9E',
    fontSize: '12px',
    fontWeight: 600,
  },
  sectionTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableHeader: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    padding: '12px',
    textAlign: 'left' as const,
    fontSize: '13px',
    fontWeight: 600,
    borderBottom: '1px solid #424242',
  },
  tableCell: {
    padding: '12px',
    borderBottom: '1px solid #424242',
    color: '#E0E0E0',
    fontSize: '13px',
  },
  tableRow: {
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s',
  },
};

// Local Tab Components with proper TypeScript types
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

interface TabsListProps {
  children: ReactNode;
  style?: React.CSSProperties;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  style?: React.CSSProperties;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  activeTab?: string;
}

interface AlertProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children }) => {
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && (child.type === TabsList || child.type === TabsContent)) {
          return React.cloneElement(child as React.ReactElement<TabsListProps | TabsContentProps>, { 
            activeTab: value, 
            onTabChange: onValueChange 
          });
        }
        return child;
      })}
    </>
  );
};

const TabsList: React.FC<TabsListProps> = ({ children, style, activeTab, onTabChange }) => (
  <div style={style}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<TabsTriggerProps>, { activeTab, onTabChange });
      }
      return child;
    })}
  </div>
);

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, style, activeTab, onTabChange }) => (
  <button onClick={() => onTabChange?.(value)} style={style}>
    {children}
  </button>
);

const TabsContent: React.FC<TabsContentProps> = ({ value, children, activeTab }) => 
  activeTab === value ? <div>{children}</div> : null;

const Alert: React.FC<AlertProps> = ({ children, style }) => (
  <div style={style}>{children}</div>
);

const AlertDescription: React.FC<AlertProps> = ({ children, style }) => (
  <div style={style}>{children}</div>
);

export function AdminPage() {
  const { user } = useAuth();
  const { getActiveTab, setActiveTab } = useTabContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trainingList, setTrainingList] = useState<TrainingData[]>([]);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [suggestions, setSuggestions] = useState<TrainingSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

  // Get saved tab state for this page
  const savedTab = getActiveTab('admin');
  const [activeTab, setActiveTabState] = useState(savedTab || 'overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (user && !user.is_admin) {
      setError('Access denied. Admin privileges required.');
      setIsLoading(false);
    }
  }, [user]);

  // Load data for specific tabs on demand to preserve work
  const loadTabData = async (tab: string) => {
    try {
      switch (tab) {
        case 'users':
          const usersList = await apiClient.getUsers();
          setUsers(usersList);
          break;
        case 'content':
          const training = await apiClient.getTrainingList({ limit: 100 });
          setTrainingList(training);
          break;
        case 'settings':
          const [feedbackList, suggestionsList] = await Promise.all([
            apiClient.getAllFeedback({ limit: 100 }),
            apiClient.getAllSuggestions(),
          ]);
          setFeedback(feedbackList);
          setSuggestions(suggestionsList);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${tab} data`);
    }
  };

  const handleTabChange = (newTab: string) => {
    setActiveTabState(newTab);
    setActiveTab('admin', newTab);
    // Load data for the new tab if needed
    if (newTab !== 'overview') {
      loadTabData(newTab);
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [status, usersList, training, feedbackList, suggestionsList, analyticsData] = await Promise.all([
        apiClient.getAdminStatus(),
        apiClient.getUsers(),
        apiClient.getTrainingList({ limit: 100 }),
        apiClient.getAllFeedback({ limit: 100 }),
        apiClient.getAllSuggestions(),
        apiClient.getAnalyticsOverview(),
      ]);
      
      setAdminStatus(status);
      setUsers(usersList);
      setTrainingList(training);
      setFeedback(feedbackList);
      setSuggestions(suggestionsList);
      setAnalytics(analyticsData);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ ...styles.page, backgroundColor: '#121212' }}>
        <div style={{ ...styles.header, backgroundColor: '#1E1E1E', borderColor: '#424242' }}>
          <div style={styles.headerContent}>
            <h1 style={{ ...styles.title, color: '#FFFFFF' }}>Admin Panel</h1>
            <p style={{ ...styles.subtitle, color: '#9E9E9E' }}>Manage system, users, and content</p>
          </div>
        </div>
        <div style={{ ...styles.content, backgroundColor: '#121212' }}>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9E9E9E' }}>
            <Loader style={{ width: '32px', height: '32px', marginBottom: '16px', display: 'inline-block' }} />
            <p>Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.page, backgroundColor: '#121212' }}>
      <div style={{ ...styles.header, backgroundColor: '#1E1E1E', borderColor: '#424242' }}>
        <div style={styles.headerContent}>
          <h1 style={{ ...styles.title, color: '#FFFFFF' }}>Admin Panel</h1>
          <p style={{ ...styles.subtitle, color: '#9E9E9E' }}>Manage system, users, and content</p>
        </div>
      </div>

      <div style={{ ...styles.content, backgroundColor: '#121212' }}>
        {error && (
          <Alert style={{ marginBottom: '20px', backgroundColor: '#F4444422', border: '1px solid #F4444444' }}>
            <AlertCircle style={{ color: '#F44444' }} />
            <AlertDescription style={{ color: '#F44444' }}>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList style={{ backgroundColor: 'transparent', borderBottom: '2px solid #424242', marginBottom: '24px', padding: '0', height: 'auto', display: 'flex', gap: '0' }}>
            <TabsTrigger value="overview" style={{ color: activeTab === 'overview' ? '#FEC00F' : '#9E9E9E', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'overview' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', cursor: 'pointer', textTransform: 'uppercase' }}>
              <BarChart3 style={{ marginRight: '8px', width: '16px', height: '16px' }} />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" style={{ color: activeTab === 'users' ? '#FEC00F' : '#9E9E9E', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'users' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', cursor: 'pointer', textTransform: 'uppercase' }}>
              <Users style={{ marginRight: '8px', width: '16px', height: '16px' }} />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" style={{ color: activeTab === 'content' ? '#FEC00F' : '#9E9E9E', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'content' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', cursor: 'pointer', textTransform: 'uppercase' }}>
              <FileText style={{ marginRight: '8px', width: '16px', height: '16px' }} />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" style={{ color: activeTab === 'settings' ? '#FEC00F' : '#9E9E9E', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'settings' ? '3px solid #FEC00F' : 'none', borderRadius: '0', padding: '12px 20px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s ease', cursor: 'pointer', textTransform: 'uppercase' }}>
              <Settings style={{ marginRight: '8px', width: '16px', height: '16px' }} />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div style={{ display: 'grid', gap: '24px' }}>
              {adminStatus && (
                <div style={styles.card}>
                  <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>System Statistics</h2>
                  <div style={styles.statsGrid}>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{adminStatus.stats.total_users}</div>
                      <div style={styles.statLabel}>Total Users</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{adminStatus.stats.training.total}</div>
                      <div style={styles.statLabel}>Training Examples</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{adminStatus.stats.training.active}</div>
                      <div style={styles.statLabel}>Active Training</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{adminStatus.stats.total_documents}</div>
                      <div style={styles.statLabel}>Documents</div>
                    </div>
                  </div>
                </div>
              )}
              
              {analytics && (
                <>
                  <div style={styles.card}>
                    <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>Feedback Analytics</h2>
                    <div style={styles.statsGrid}>
                      <div style={styles.statItem}>
                        <div style={styles.statValue}>{analytics.feedback.total}</div>
                        <div style={styles.statLabel}>Total Feedback</div>
                      </div>
                      <div style={styles.statItem}>
                        <div style={styles.statValue}>{analytics.feedback.average_rating?.toFixed(1) || 'N/A'}</div>
                        <div style={styles.statLabel}>Avg Rating</div>
                      </div>
                      <div style={styles.statItem}>
                        <div style={styles.statValue}>{analytics.feedback.corrections}</div>
                        <div style={styles.statLabel}>Corrections</div>
                      </div>
                      <div style={styles.statItem}>
                        <div style={styles.statValue}>{analytics.feedback.pending_review}</div>
                        <div style={styles.statLabel}>Pending Review</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.card}>
                    <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>Code Generation</h2>
                    <div style={styles.statsGrid}>
                      <div style={styles.statItem}>
                        <div style={styles.statValue}>{analytics.code_generation.total_codes}</div>
                        <div style={styles.statLabel}>Codes Generated</div>
                      </div>
                      <div style={styles.statItem}>
                        <div style={styles.statValue}>{analytics.training.total_examples}</div>
                        <div style={styles.statLabel}>Training Examples</div>
                      </div>
                      <div style={styles.statItem}>
                        <div style={styles.statValue}>{analytics.training.pending_suggestions}</div>
                        <div style={styles.statLabel}>Pending Suggestions</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div style={styles.card}>
              <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>User Management</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ backgroundColor: '#2A2A2A' }}>
                      <th style={styles.tableHeader}>Username</th>
                      <th style={styles.tableHeader}>Email</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Codes Generated</th>
                      <th style={styles.tableHeader}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.id} style={styles.tableRow}>
                          <td style={styles.tableCell}>{u.name || 'N/A'}</td>
                          <td style={styles.tableCell}>{u.email}</td>
                          <td style={styles.tableCell}>
                            <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 600 }}>Active</span>
                          </td>
                          <td style={styles.tableCell}>{u.codes_generated || 0}</td>
                          <td style={styles.tableCell}>{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ ...styles.tableCell, textAlign: 'center', color: '#9E9E9E' }}>
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div style={styles.card}>
              <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>Training Management</h2>
              <p style={{ color: '#9E9E9E', marginBottom: '20px', fontSize: '14px' }}>Active training examples ({trainingList.length} total)</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ backgroundColor: '#2A2A2A' }}>
                      <th style={styles.tableHeader}>Title</th>
                      <th style={styles.tableHeader}>Type</th>
                      <th style={styles.tableHeader}>Category</th>
                      <th style={styles.tableHeader}>Priority</th>
                      <th style={styles.tableHeader}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingList.length > 0 ? (
                      trainingList.slice(0, 10).map((training) => (
                        <tr key={training.id} style={styles.tableRow}>
                          <td style={styles.tableCell}>{training.title}</td>
                          <td style={styles.tableCell}>{training.training_type}</td>
                          <td style={styles.tableCell}>{training.category}</td>
                          <td style={styles.tableCell}>{training.priority || 'N/A'}</td>
                          <td style={styles.tableCell}>
                            <span style={{ color: training.is_active ? '#4CAF50' : '#FF9800', fontSize: '12px', fontWeight: 600 }}>
                              {training.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ ...styles.tableCell, textAlign: 'center', color: '#9E9E9E' }}>
                          No training examples found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={styles.card}>
                <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>Pending Reviews</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ ...styles.statItem, textAlign: 'center' }}>
                    <div style={styles.statValue}>{feedback.filter((f) => f.status === 'pending_review').length}</div>
                    <div style={styles.statLabel}>Pending Feedback</div>
                  </div>
                  <div style={{ ...styles.statItem, textAlign: 'center' }}>
                    <div style={styles.statValue}>{suggestions.filter((s) => s.status === 'pending').length}</div>
                    <div style={styles.statLabel}>Pending Suggestions</div>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>Recent Feedback</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {feedback.slice(0, 5).map((f) => (
                    <div key={f.id} style={{ padding: '12px', backgroundColor: '#2A2A2A', borderRadius: '8px', borderLeft: '3px solid #FEC00F' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>{f.feedback_type}</span>
                        <span style={{ color: f.rating ? '#FEC00F' : '#9E9E9E', fontSize: '12px' }}>
                          {f.rating ? `${f.rating}/5 â­` : 'No rating'}
                        </span>
                      </div>
                      <p style={{ color: '#9E9E9E', fontSize: '12px', margin: '0 0 8px', lineHeight: '1.4' }}>
                        {f.feedback_text?.substring(0, 100)}...
                      </p>
                      <span style={{ color: f.status === 'pending_review' ? '#FF9800' : '#4CAF50', fontSize: '11px', fontWeight: 600 }}>
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF' }}>Recent Suggestions</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {suggestions.slice(0, 5).map((s) => (
                    <div key={s.id} style={{ padding: '12px', backgroundColor: '#2A2A2A', borderRadius: '8px', borderLeft: '3px solid #2196F3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>{s.title}</span>
                        <span style={{
                          color: s.status === 'pending' ? '#FEC00F' : s.status === 'approved' ? '#4CAF50' : '#F44444',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: s.status === 'pending' ? '#FEC00F22' : s.status === 'approved' ? '#4CAF5022' : '#F4444422'
                        }}>
                          {s.status}
                        </span>
                      </div>
                      <p style={{ color: '#9E9E9E', fontSize: '12px', margin: 0 }}>
                        Priority: {s.priority || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminPage;

