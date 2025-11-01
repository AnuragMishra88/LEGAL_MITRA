import React, { useState, useEffect, useRef } from 'react';
import './AdminDashboard.css'; // Assuming this CSS file exists
import { useAuth } from '../../../context/AuthContext'; // Assuming you use this for logout/context

// const API_BASE_URL = `${API_BASE_URL}/api/api`; // Update this to your actual backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
    // --- State Management ---
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [recentUsers, setRecentUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // State for all users
    const [statsData, setStatsData] = useState({});
    const [analyticsData, setAnalyticsData] = useState({});
    const [error, setError] = useState(null);
    const [realTimeData, setRealTimeData] = useState({
        activeSessions: 0,
        liveUsers: [],
        systemLoad: 0
    });

    const { user, logout } = useAuth(); // Assuming useAuth provides user info and a logout function

    // --- Helper Functions ---
    const getHeaders = () => {
        // Retrieve token from localStorage (set during AdminLogin)
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // New function to fetch only stats (for reliability after actions)
     const fetchStats = async () => {
        try {
            const statsResponse = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: getHeaders()
            });
            if (!statsResponse.ok) throw new Error('Failed to fetch stats');
            const statsResult = await statsResponse.json();
            setStatsData(statsResult.stats);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching stats:', err);
        }
    };

    const fetchRealTimeData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/realtime`, {
                headers: getHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setRealTimeData(data);
            }
        } catch (error) {
            console.error('Error fetching real-time data:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch all data in parallel for better performance
            const [statsResponse, recentUsersResponse, allUsersResponse, verificationsResponse, analyticsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/admin/stats`, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/api/admin/users/recent`, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/api/admin/users`, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/api/admin/verifications/pending`, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/api/admin/analytics`, { headers: getHeaders() })
            ]);

            // Check all responses
            if (!statsResponse.ok) throw new Error('Failed to fetch stats');
            if (!recentUsersResponse.ok) throw new Error('Failed to fetch recent users');
            if (!allUsersResponse.ok) throw new Error('Failed to fetch all users');
            if (!verificationsResponse.ok) throw new Error('Failed to fetch verifications');
            if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics');

            // Parse all responses
            const [statsResult, recentUsersResult, allUsersResult, verificationsResult, analyticsResult] = await Promise.all([
                statsResponse.json(),
                recentUsersResponse.json(),
                allUsersResponse.json(),
                verificationsResponse.json(),
                analyticsResponse.json()
            ]);

            // Set state with real data
            setStatsData(statsResult.stats || {});
            setRecentUsers(recentUsersResult.users || []);
            setAllUsers(allUsersResult.users || []);
            setPendingVerifications(verificationsResult.verifications || []);
            setAnalyticsData(analyticsResult.analytics || {});

        } catch (err) {
            if (err.message.includes('401') || err.message.includes('403')) {
                setError('Session expired or not authorized. Please log in again.');
                logout();
            } else {
                setError(err.message);
            }
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

   useEffect(() => {
        fetchDashboardData();
        
        // Set up real-time data polling
        const realTimeInterval = setInterval(fetchRealTimeData, 30000); // Every 30 seconds
        const statsInterval = setInterval(fetchStats, 60000); // Every minute

        return () => {
            clearInterval(realTimeInterval);
            clearInterval(statsInterval);
        };
    }, []);

    // --- API Action Handlers ---
    const approveVerification = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/verifications/${id}/approve`, {
                method: 'PUT',
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to approve verification');

            // Optimistic UI update: remove from pending list
            setPendingVerifications(prev => prev.filter(v => v.id !== id));
            // Fetch new stats to accurately update counts
            await fetchStats();

        } catch (err) {
            setError(err.message);
        }
    };

    const rejectVerification = async (id) => {
  try {
    console.log('🔄 STARTING REJECTION - ID:', id);
    
    const reason = "Documents are unclear or incomplete. Please submit clear, valid documents for verification.";
    
    console.log('📤 Sending reject request to:', `${API_BASE_URL}/api/admin/verifications/${id}/reject`);
    console.log('📝 Reason:', reason);
    
    const token = localStorage.getItem('token');
    console.log('🔑 Token exists:', !!token);

    const response = await fetch(`${API_BASE_URL}/api/admin/verifications/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Reject success:', result);

    // Optimistic UI update
    setPendingVerifications(prev => prev.filter(v => v.id !== id));
    await fetchStats();

    alert('✅ Verification rejected successfully!');
    
  } catch (err) {
    console.error('❌ Reject error details:', err);
    setError(err.message);
    alert(`❌ Failed to reject: ${err.message}`);
  }
};
   const updateUserStatus = async (userId, newStatus) => {
    try {
        // Convert to lowercase for backend
        const backendStatus = newStatus.toLowerCase();
        
        console.log(`🔄 Updating user status: ${userId} from ${newStatus} to ${backendStatus}`);
        
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: backendStatus }) // Send lowercase to backend
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update user status');
        }

        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ User status updated successfully: ${result.user.name} to ${result.user.status}`);
            
            // Update both user lists - keep frontend display as title case
            const frontendStatus = backendStatus === 'active' ? 'Active' : 'Inactive';
            
            setAllUsers(prev => prev.map(user => 
                user._id === userId ? { 
                    ...user, 
                    status: frontendStatus, // Keep title case for display
                    isActive: backendStatus === 'active' 
                } : user
            ));
            
            setRecentUsers(prev => prev.map(user => 
                user._id === userId ? { 
                    ...user, 
                    status: frontendStatus, // Keep title case for display
                    isActive: backendStatus === 'active' 
                } : user
            ));

            alert(`✅ User status updated to ${frontendStatus}`);
        } else {
            throw new Error(result.error || 'Failed to update user status');
        }
    } catch (err) {
        console.error("❌ Error updating user status:", err);
        setError(err.message);
        alert(`❌ Failed to update user status: ${err.message}`);
    }
};

    // --- Navigation Data ---
     const sections = [
        { id: 'dashboard', title: 'Dashboard Overview', icon: '📊' },
        { id: 'users', title: 'User Management', icon: '👥' },
        { id: 'verification', title: 'Content & Verification', icon: '⚖️' },
        { id: 'analytics', title: 'Analytics & Settings', icon: '📈' }
    ];

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading Admin Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <h2>Error Loading Dashboard</h2>
                <p>{error}</p>
                <button onClick={fetchDashboardData} className="action-btn primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="simple-admin-dashboard">
            <div className="simple-admin-sidebar">
                <div className="sidebar-header">
                    <h3>Admin Panel</h3>
                    
                </div>
                <nav className="simple-sidebar-nav">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            className={`simple-nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <span className="nav-icon">{section.icon}</span>
                            <span>{section.title}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="simple-admin-content">
                {activeSection === 'dashboard' && (
                    <DashboardOverview 
                        statsData={statsData} 
                        recentUsers={recentUsers}
                        realTimeData={realTimeData}
                        onRefresh={fetchDashboardData}
                    />
                )}
                {activeSection === 'users' && (
                    <UserManagement 
                        users={allUsers}
                        onUpdateUserStatus={updateUserStatus}
                    />
                )}
                {activeSection === 'verification' && (
                    <VerificationManagement 
                        verifications={pendingVerifications}
                        onApprove={approveVerification}
                        onReject={rejectVerification}
                    />
                )}
                {activeSection === 'analytics' && (
                    <AnalyticsSettings 
                        analyticsData={analyticsData} 
                        statsData={statsData}
                    />
                )}
            </div>
        </div>
    );
};

// =======================================================
// Section 1: Dashboard Overview with Bulk Email & Export
// =======================================================
const DashboardOverview = ({ statsData, recentUsers }) => { 
    const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
      const [timeRange, setTimeRange] = useState('7d');
    const [chartData, setChartData] = useState(null);

     // Fetch real chart data from backend
    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/admin/analytics/charts?range=${timeRange}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    setChartData(result.analytics);
                }
            } catch (error) {
                console.error('Error fetching chart data:', error);
            }
        };

        fetchChartData();
    }, [timeRange]);


    // Format monetary value from backend
    const formatCurrency = (value) => {
        if (value === undefined || value === null) return 'N/A';
        return `₹${Number(value).toLocaleString('en-IN')}`;
    };

    const calculateGrowth = (current, previous) => {
        if (!previous || previous === 0) return 100;
        return ((current - previous) / previous * 100).toFixed(1);
    };

    // Bulk email handler
    const handleSendBulkEmail = async (emailData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/api/admin/send-bulk-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send bulk email');
            }

            return data;
        } catch (error) {
            console.error('Error sending bulk email:', error);
            throw error;
        }
    };

    // Export handler
    const handleExportData = async (exportSettings) => {
        try {
            const token = localStorage.getItem('token');
            
            // Build query parameters
            const params = new URLSearchParams({
                format: exportSettings.format,
                userType: exportSettings.userType,
                includeInactive: exportSettings.includeInactive
            });

            const response = await fetch(`http://localhost:5000/api/admin/export/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Get filename from content-disposition header or generate one
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `legalmitra_export_${new Date().toISOString().split('T')[0]}`;
            
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            alert(`✅ Data exported successfully! Downloaded: ${filename}`);

        } catch (error) {
            console.error('Export error:', error);
            alert(`❌ Export failed: ${error.message}`);
            throw error;
        }
    };

    return (
        <div className="section-content">
            <div className="section-header">
                <h1>Dashboard Overview</h1>
                <p>Welcome back, System Administrator</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>{statsData.totalUsers?.toLocaleString() || 0}</h3>
                        <p>Total Users</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⚖️</div>
                    <div className="stat-info">
                        <h3>{statsData.totalLawyers || 0}</h3>
                        <p>Total Lawyers</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                        <h3>{statsData.pendingVerificationsCount || 0}</h3>
                        <p>Pending Verifications</p>
                        <div className="stat-trend trend-down">⚠️ Requires attention</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3>{formatCurrency(statsData.monthlyRevenue || 0)}</h3>
                        <p>Monthly Revenue</p>
                    </div>
                </div>
            </div>

            <div className="content-grid">
                <div className="content-column">
                    <div className="content-card">
                        <div className="card-header">
                            <h3>Recent Users ({recentUsers.length})</h3>
                            <span className="view-all" onClick={() => window.location.hash = '#users'}>View All</span>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.slice(0, 5).map(user => (
                                        <tr key={user.id || user._id}> 
                                            <td>
                                                <div className="user-info">
                                                    <div className="user-avatar">
                                                        {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                                                    </div>
                                                    <span>{user.name}</span>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{user.role === 'lawyer' ? 'Lawyer' : 'Client'}</td>
                                            <td>
                                                <span className={`status-badge status-${(user.status || (user.isBlocked ? 'inactive' : 'active')).toLowerCase()}`}>
                                                    {user.status || (user.isBlocked ? 'Inactive' : 'Active')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="content-column">
                    <div className="content-card">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons">
                            <button 
                                className="action-btn primary"
                                onClick={() => setShowBulkEmailModal(true)}
                            >
                                📧 Send Bulk Email
                            </button>
                            <button 
                                className="action-btn secondary"
                                onClick={() => setShowExportModal(true)}
                            >
                                📥 Export User Data
                            </button>
                           
                            <button 
                                className="action-btn secondary"
                                onClick={() => setShowReportsModal(true)}
                            >
                                📋 Generate Reports
                            </button>
                        </div>
                    </div>

                    <div className="content-card">
                        <h3>System Status</h3>
                        <div className="system-status">
                            <div className="status-item">
                                <span className="status-indicator online"></span>
                                <span>Backend API</span>
                                <span className="status-text">Online</span>
                            </div>
                            <div className="status-item">
                                <span className="status-indicator online"></span>
                                <span>Database</span>
                                <span className="status-text">Connected</span>
                            </div>
                            <div className="status-item">
                                <span className="status-indicator online"></span>
                                <span>Payment Gateway</span>
                                <span className="status-text">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Email Modal */}
            {showBulkEmailModal && (
                <BulkEmailModal 
                    onClose={() => setShowBulkEmailModal(false)}
                    onSendBulkEmail={handleSendBulkEmail}
                />
            )}

            {/* Export Modal */}
            {showExportModal && (
                <ExportModal 
                    onClose={() => setShowExportModal(false)}
                    onExportData={handleExportData}
                />
            )}

            {/* Generate Reports Modal */}
            {showReportsModal && (
                <GenerateReportsModal 
                    onClose={() => setShowReportsModal(false)}
                />
            )}
        </div>
    );
};

// Generate Reports Modal Component
// Generate Reports Modal - Simplified Version
const GenerateReportsModal = ({ onClose }) => {
    const [selectedReport, setSelectedReport] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [reportHistory, setReportHistory] = useState([]);

    const reportTypes = [
        {
            id: 'user-growth',
            title: 'User Growth Report',
            icon: '📈',
            description: 'User registration and growth trends',
            availableFormats: ['Excel', 'CSV'],
            estimatedTime: '1 minute'
        },
        {
            id: 'revenue-monthly',
            title: 'Revenue Report',
            icon: '💰',
            description: 'Monthly revenue analysis',
            availableFormats: ['Excel', 'CSV'],
            estimatedTime: '2 minutes'
        },
        
        {
            id: 'user-activity',
            title: 'User Activity',
            icon: '👥',
            description: 'Platform engagement metrics',
            availableFormats: ['Excel', 'CSV'],
            estimatedTime: '1 minute'
        },
        
    ];

    const handleGenerateReport = async (reportType, format) => {
        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            console.log('Generating report:', { reportType, format });

            const response = await fetch(`${API_BASE_URL}/api/api/admin/reports/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportType,
                    format: format.toLowerCase(),
                    filters: {},
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            // Get filename from content-disposition or generate one
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `legalmitra_${reportType}_${new Date().toISOString().split('T')[0]}`;
            
            if (contentDisposition) {
                const matches = contentDisposition.match(/filename="?(.+)"?/);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            }

            // Add file extension if missing
            if (!filename.includes('.')) {
                const extensions = {
                    'excel': '.xlsx',
                    'csv': '.csv',
                    'xlsx': '.xlsx'
                };
                filename += extensions[format.toLowerCase()] || '.xlsx';
            }

            // Create and download blob
            const blob = await response.blob();
            
            if (blob.size === 0) {
                throw new Error('Received empty file from server');
            }

            // Download file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // Add to report history
            setReportHistory(prev => [{
                id: Date.now(),
                type: reportType,
                format: format,
                generatedAt: new Date().toISOString(),
                status: 'success'
            }, ...prev]);

            alert(`✅ Report "${reportType}" generated successfully!`);

        } catch (error) {
            console.error('Error generating report:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check if backend is running.';
            } else if (error.message.includes('401')) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Report generation endpoint not found.';
            }

            alert(`❌ Failed to generate report: ${errorMessage}`);
            
            // Add failed attempt to history
            setReportHistory(prev => [{
                id: Date.now(),
                type: reportType,
                format: format,
                generatedAt: new Date().toISOString(),
                status: 'failed',
                error: errorMessage
            }, ...prev]);
        } finally {
            setGenerating(false);
        }
    };

    return (    
        <div className="modal-overlay" onClick={onClose}>
            <div className="reports-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📊 Generate Reports</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* Quick Report Templates */}
                    <div className="reports-quick-actions">
                        <h3>Quick Reports</h3>
                        <div className="quick-reports-grid">
                            {reportTypes.slice(0, 3).map(report => (
                                <button 
                                    key={report.id}
                                    className="quick-report-card" 
                                    onClick={() => setSelectedReport(report.id)}
                                >
                                    <span className="report-icon">{report.icon}</span>
                                    <span className="report-title">{report.title}</span>
                                    <span className="report-desc">{report.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* All Available Reports */}
                    <div className="reports-categories">
                        <div className="report-category">
                            <h4>Available Reports</h4>
                            <div className="reports-grid">
                                {reportTypes.map(report => (
                                    <div key={report.id} className="report-card">
                                        <div className="report-header">
                                            <span className="report-icon">{report.icon}</span>
                                            <h5>{report.title}</h5>
                                        </div>
                                        <p className="report-description">{report.description}</p>
                                        
                                        <div className="report-meta">
                                            <span className="meta-item">
                                                <strong>Formats:</strong> {report.availableFormats.join(', ')}
                                            </span>
                                            <span className="meta-item">
                                                <strong>Est. Time:</strong> {report.estimatedTime}
                                            </span>
                                        </div>

                                        <div className="report-actions">
                                            <select 
                                                className="format-select" 
                                                defaultValue={report.availableFormats[0]}
                                                id={`format-${report.id}`}
                                            >
                                                {report.availableFormats.map(format => (
                                                    <option key={format} value={format}>{format}</option>
                                                ))}
                                            </select>
                                            <button 
                                                className="action-btn primary small"
                                                onClick={() => {
                                                    const formatSelect = document.getElementById(`format-${report.id}`);
                                                    const selectedFormat = formatSelect.value.toLowerCase();
                                                    handleGenerateReport(report.id, selectedFormat);
                                                }}
                                                disabled={generating}
                                            >
                                                {generating ? 'Generating...' : 'Generate'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Report History */}
                    <div className="report-history">
                        <h4>📋 Recent Reports</h4>
                        <div className="history-list">
                            {reportHistory.slice(0, 5).map(report => (
                                <div key={report.id} className="history-item">
                                    <div className="history-info">
                                        <span className="report-type">{report.type}</span>
                                        <span className="report-date">
                                            {new Date(report.generatedAt).toLocaleDateString()}
                                        </span>
                                        <span className="report-format">{report.format}</span>
                                        <span className={`report-status ${report.status}`}>
                                            {report.status === 'success' ? '✅' : '❌'}
                                        </span>
                                    </div>
                                    {report.status === 'success' && (
                                        <button className="action-btn secondary small">
                                            Download Again
                                        </button>
                                    )}
                                </div>
                            ))}
                            {reportHistory.length === 0 && (
                                <div className="no-history">
                                    No reports generated yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="action-btn secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// BulkEmailModal Component
// Fixed Bulk Email Modal Component
const BulkEmailModal = ({ onClose, onSendBulkEmail }) => {
    const [emailData, setEmailData] = useState({
        subject: '',
        message: '',
        userType: 'all',
        sendToActiveOnly: true
    });
    const [sending, setSending] = useState(false);
    const [userStats, setUserStats] = useState(null);
    const [preview, setPreview] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        fetchUserStatistics();
    }, []);

    const fetchUserStatistics = async () => {
        try {
            setLoadingStats(true);
            const token = localStorage.getItem('token');
            console.log('🔍 Fetching user statistics...');
            
            const response = await fetch(`${API_BASE_URL}/api/api/admin/user-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📊 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch user statistics`);
            }
            
            const data = await response.json();
            console.log('📈 User statistics response:', data);
            
            if (data.success && data.statistics) {
                setUserStats(data.statistics);
                console.log('✅ User statistics loaded:', data.statistics);
            } else {
                throw new Error(data.error || 'Invalid response format');
            }
        } catch (error) {
            console.error('❌ Error fetching user statistics:', error);
            // Fallback statistics if API fails
            setUserStats({
                totalUsers: 0,
                activeUsers: 0,
                lawyers: 0,
                clients: 0,
                students: 0
            });
        } finally {
            setLoadingStats(false);
        }
    };

    const getRecipientCount = () => {
        if (!userStats) return 0;
        
        console.log('📈 Calculating recipient count for:', emailData.userType);
        
        let count = 0;
        
        switch (emailData.userType) {
            case 'all':
                count = emailData.sendToActiveOnly ? userStats.activeUsers : userStats.totalUsers;
                break;
            case 'lawyer':
                count = userStats.lawyers || 0;
                // If lawyers count is 0, try to estimate from total
                if (count === 0 && userStats.totalUsers > 0) {
                    count = Math.floor(userStats.totalUsers * 0.3); // Estimate 30% lawyers
                }
                break;
            case 'client':
                count = userStats.clients || 0;
                // If clients count is 0, try to estimate from total
                if (count === 0 && userStats.totalUsers > 0) {
                    count = Math.floor(userStats.totalUsers * 0.6); // Estimate 60% clients
                }
                break;
            case 'student':
                count = userStats.students || 0;
                break;
            default:
                count = 0;
        }
        
        console.log('👥 Recipient count:', count);
        return count;
    };

    const handleSendBulkEmail = async () => {
        if (!emailData.subject.trim() || !emailData.message.trim()) {
            alert('Please fill in both subject and message');
            return;
        }

        const recipientCount = getRecipientCount();
        console.log('📨 Sending to recipients:', recipientCount);
        
        if (recipientCount === 0) {
            alert('No recipients found for the selected criteria. Please try different filters.');
            return;
        }

        if (!window.confirm(`Are you sure you want to send this email to ${recipientCount} users?\n\nThis action cannot be undone.`)) {
            return;
        }

        setSending(true);
        try {
            console.log('🔄 Starting bulk email send...');
            const result = await onSendBulkEmail(emailData);
            
            if (result.success) {
                alert(`✅ Bulk email sent successfully!\n\nResults:\n- ${result.results.successful} emails sent\n- ${result.results.failed} failed`);
                onClose();
            } else {
                throw new Error(result.error || 'Failed to send bulk email');
            }
        } catch (error) {
            console.error('❌ Error sending bulk email:', error);
            alert(`❌ Failed to send bulk email: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    const recipientCount = getRecipientCount();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="email-modal bulk-email-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📧 Send Bulk Email</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* Recipient Statistics */}
                    <div className="recipient-stats">
                        <h4>📊 Recipient Statistics</h4>
                        {loadingStats ? (
                            <div className="loading-state">
                                <div className="loading-spinner-small"></div>
                                Loading user statistics...
                            </div>
                        ) : userStats ? (
                            <div className="stats-grid-small">
                                <div className="stat-item">
                                    <span className="stat-label">Total Users:</span>
                                    <span className="stat-value">{userStats.totalUsers || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Active Users:</span>
                                    <span className="stat-value">{userStats.activeUsers || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Lawyers:</span>
                                    <span className="stat-value">{userStats.lawyers || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Clients:</span>
                                    <span className="stat-value">{userStats.clients || 0}</span>
                                </div>
                                {userStats.students !== undefined && (
                                    <div className="stat-item">
                                        <span className="stat-label">Students:</span>
                                        <span className="stat-value">{userStats.students || 0}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="error-state">
                                ❌ Failed to load statistics. Using default values.
                            </div>
                        )}
                    </div>

                    {/* Rest of the component remains the same */}
                    <div className="email-filters">
                        <div className="form-group">
                            <label>Send To:</label>
                            <select 
                                value={emailData.userType}
                                onChange={(e) => setEmailData(prev => ({ ...prev, userType: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="all">All Users</option>
                                <option value="lawyer">Lawyers Only</option>
                                <option value="client">Clients Only</option>
                              
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={emailData.sendToActiveOnly}
                                    onChange={(e) => setEmailData(prev => ({ ...prev, sendToActiveOnly: e.target.checked }))}
                                />
                                Send to active users only
                            </label>
                        </div>
                    </div>

                    {/* Recipient Summary */}
                    <div className="recipient-summary">
                        <strong>👥 Will be sent to: {recipientCount} users</strong>
                        {recipientCount === 0 && (
                            <span style={{color: '#ef4444', fontSize: '0.8rem', display: 'block', marginTop: '5px'}}>
                                No users match the selected criteria. Try changing filters.
                            </span>
                        )}
                    </div>

                    {/* Email Content */}
                    <div className="form-group">
                        <label>Subject *</label>
                        <input
                            type="text"
                            value={emailData.subject}
                            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter email subject..."
                            className="email-input"
                            disabled={sending}
                        />
                    </div>

                    <div className="form-group">
                        <label>Message *</label>
                        <textarea
                            value={emailData.message}
                            onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder={`Type your message here. Use {name} to personalize the email.

Example:
Hello {name},

We wanted to share some important updates with you...`}
                            rows="10"
                            className="email-textarea"
                            disabled={sending}
                        />
                    </div>

                    {/* Preview Toggle */}
                    <div className="preview-section">
                        <button
                            type="button"
                            className="action-btn secondary"
                            onClick={() => setPreview(!preview)}
                            disabled={sending}
                        >
                            {preview ? '📝 Edit' : '👁️ Preview'}
                        </button>
                    </div>

                    {/* Email Preview */}
                    {preview && (
                        <div className="email-preview">
                            <h4>Email Preview</h4>
                            <div className="preview-content">
                                <div className="preview-subject">
                                    <strong>Subject:</strong> {emailData.subject || '(No subject)'}
                                </div>
                                <div className="preview-message">
                                    <strong>Message:</strong>
                                    <div className="message-content">
                                        {emailData.message.split('\n').map((line, index) => (
                                            <div key={index}>{line || <br />}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Tips */}
                    <div className="email-tips">
                        <p>💡 <strong>Tips for effective bulk emails:</strong></p>
                        <ul>
                            <li>Personalize with <code>{'{name}'}</code> - it will be replaced with each user's name</li>
                            <li>Keep the subject line clear and engaging</li>
                            <li>Test with a small group first</li>
                            <li>Check spelling and grammar</li>
                            <li>Include a clear call-to-action</li>
                        </ul>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="action-btn secondary"
                        onClick={onClose}
                        disabled={sending}
                    >
                        Cancel
                    </button>
                    <button 
                        className="action-btn primary bulk-send-btn"
                        onClick={handleSendBulkEmail}
                        disabled={sending || recipientCount === 0 || !emailData.subject.trim() || !emailData.message.trim()}
                    >
                        {sending ? (
                            <>
                                <div className="loading-spinner-small"></div>
                                Sending to {recipientCount} users...
                            </>
                        ) : (
                            `📧 Send to ${recipientCount} Users`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
// ExportModal Component
const ExportModal = ({ onClose, onExportData }) => {
    const [exportSettings, setExportSettings] = useState({
        format: 'csv',
        userType: 'all',
        includeInactive: true,
        columns: {
            basic: true,
            contact: true,
            professional: true,
            activity: true
        }
    });
    const [exportStats, setExportStats] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchExportStatistics();
    }, []);

    const fetchExportStatistics = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/api/admin/export/statistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setExportStats(data.statistics);
            }
        } catch (error) {
            console.error('Error fetching export statistics:', error);
        }
    };

    const getEstimatedCount = () => {
        if (!exportStats) return 0;
        
        if (exportSettings.userType === 'all') {
            return exportSettings.includeInactive ? exportStats.totalUsers : exportStats.activeUsers;
        }
        
        const typeMap = {
            lawyer: exportStats.lawyers,
            client: exportStats.clients,
            student: exportStats.students
        };
        
        return typeMap[exportSettings.userType] || 0;
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await onExportData(exportSettings);
            onClose();
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setExporting(false);
        }
    };

    const estimatedCount = getEstimatedCount();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="export-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📊 Export User Data</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* Export Statistics */}
                    {exportStats && (
                        <div className="export-stats">
                            <h4>📈 Database Overview</h4>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Total Users:</span>
                                    <span className="stat-value">{exportStats.totalUsers}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Active Users:</span>
                                    <span className="stat-value">{exportStats.activeUsers}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Lawyers:</span>
                                    <span className="stat-value">{exportStats.lawyers}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Clients:</span>
                                    <span className="stat-value">{exportStats.clients}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Export Settings */}
                    <div className="export-settings">
                        <div className="setting-group">
                            <label>Export Format</label>
                            <div className="format-options">
                                {['csv', 'excel'].map(format => (
                                    <label key={format} className="format-option">
                                        <input
                                            type="radio"
                                            value={format}
                                            checked={exportSettings.format === format}
                                            onChange={(e) => setExportSettings(prev => ({
                                                ...prev,
                                                format: e.target.value
                                            }))}
                                        />
                                        <span className="format-label">
                                            {format.toUpperCase()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="setting-group">
                            <label>User Type</label>
                            <select
                                value={exportSettings.userType}
                                onChange={(e) => setExportSettings(prev => ({
                                    ...prev,
                                    userType: e.target.value
                                }))}
                                className="export-select"
                            >
                                <option value="all">All Users</option>
                                <option value="lawyer">Lawyers Only</option>
                                <option value="client">Clients Only</option>
                                
                            </select>
                        </div>

                        <div className="setting-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={exportSettings.includeInactive}
                                    onChange={(e) => setExportSettings(prev => ({
                                        ...prev,
                                        includeInactive: e.target.checked
                                    }))}
                                />
                                Include inactive users
                            </label>
                        </div>

                        {/* Column Selection */}
                        <div className="setting-group">
                            <label>Data Columns to Include</label>
                            <div className="column-options">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.columns.basic}
                                        onChange={(e) => setExportSettings(prev => ({
                                            ...prev,
                                            columns: {
                                                ...prev.columns,
                                                basic: e.target.checked
                                            }
                                        }))}
                                    />
                                    Basic Info (Name, Email, Role)
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.columns.contact}
                                        onChange={(e) => setExportSettings(prev => ({
                                            ...prev,
                                            columns: {
                                                ...prev.columns,
                                                contact: e.target.checked
                                            }
                                        }))}
                                    />
                                    Contact Details (Phone, Address)
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.columns.professional}
                                        onChange={(e) => setExportSettings(prev => ({
                                            ...prev,
                                            columns: {
                                                ...prev.columns,
                                                professional: e.target.checked
                                            }
                                        }))}
                                    />
                                    Professional Info (Specialization, Experience)
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.columns.activity}
                                        onChange={(e) => setExportSettings(prev => ({
                                            ...prev,
                                            columns: {
                                                ...prev.columns,
                                                activity: e.target.checked
                                            }
                                        }))}
                                    />
                                    Activity Data (Registration, Last Active)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Export Summary */}
                    <div className="export-summary">
                        <div className="summary-item">
                            <strong>Estimated Records:</strong> {estimatedCount} users
                        </div>
                        <div className="summary-item">
                            <strong>Format:</strong> {exportSettings.format.toUpperCase()}
                        </div>
                        <div className="summary-item">
                            <strong>File Size:</strong> Approximately {Math.round(estimatedCount * 0.5)} KB
                        </div>
                    </div>

                    {/* Format Tips */}
                    <div className="export-tips">
                        <p>💡 <strong>Format Recommendations:</strong></p>
                        <ul>
                            <li><strong>CSV</strong> - Best for data analysis in Excel/Google Sheets</li>
                            <li><strong>Excel</strong> - Pre-formatted with better compatibility</li>
                            <li><strong>PDF</strong> - Ideal for reports and presentations</li>
                        </ul>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="action-btn secondary"
                        onClick={onClose}
                        disabled={exporting}
                    >
                        Cancel
                    </button>
                    <button
                        className="action-btn primary export-btn"
                        onClick={handleExport}
                        disabled={exporting || estimatedCount === 0}
                    >
                        {exporting ? (
                            <>
                                <div className="loading-spinner-small"></div>
                                Exporting {estimatedCount} records...
                            </>
                        ) : (
                            `📥 Export ${estimatedCount} Records`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// User Profile Card with Delete Functionality
// User Profile Card with Fixed Payment Functionality
// Enhanced User Profile Card with Complete Registration Details
// Fixed Date Formatting for Your Backend Format
const UserProfileCard = ({ user, onClose, onDeleteUser, onSendEmail }) => {
    const [showEmailModal, setShowEmailModal] = useState(false);

    if (!user) return null;

    const handleDeleteUser = () => {
        if (typeof onDeleteUser !== 'function') {
            console.error('❌ onDeleteUser is not a function');
            alert('❌ Delete functionality is currently unavailable.');
            return;
        }

        if (window.confirm(`Are you sure you want to permanently delete ${user.name}?\n\nThis action cannot be undone!`)) {
            onDeleteUser(user.id || user._id);
            onClose();
        }
    };

    const handleSendEmail = () => {
        if (typeof onSendEmail !== 'function') {
            console.error('❌ onSendEmail is not a function');
            alert('❌ Email functionality is currently unavailable.');
            return;
        }
        setShowEmailModal(true);
    };

    // Fixed date formatting for your backend format: "2025-10-20T17:03:26.010+00:00"
    const formatBackendDate = (dateString) => {
        if (!dateString) return 'Not available';
        
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.log('Invalid date:', dateString);
                return 'Invalid date';
            }
            
            // Format: "20 October 2025, 5:03 PM"
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Date formatting error:', error, 'for date:', dateString);
            return 'Date error';
        }
    };

    // Get relative time (e.g., "2 hours ago")
    const getRelativeTime = (dateString) => {
        if (!dateString) return 'Never';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minutes ago`;
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return `${Math.floor(diffDays / 30)} months ago`;
        } catch (error) {
            return 'Time error';
        }
    };

    // Safe date display with fallback
    const safeDateDisplay = (dateString, fallback = 'Not available') => {
        if (!dateString) return fallback;
        
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? fallback : formatBackendDate(dateString);
        } catch (error) {
            return fallback;
        }
    };

    // Check if user is a lawyer to show professional details
    const isLawyer = user.role === 'lawyer';

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="user-profile-card enhanced-profile" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="card-header">
                        <div className="user-avatar-large">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="user-title">
                            <h3>{user.name || 'No Name'}</h3>
                            <p className="user-email">{user.email || 'No Email'}</p>
                            <div className="user-badges">
                                <span className={`role-tag ${user.role || 'user'}`}  style={{color:"black", backgroundColor:"white"}}>
                                    {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                                </span>
                                <span className={`status-tag ${user.status?.toLowerCase() || 'active'}`} style={{color:"white",backgroundColor:"green"}}>
                                    {user.status || 'Active'}
                                </span>
                                {user.isVerified && (
                                    <span className="verification-tag verified" style={{color:"black", backgroundColor:"white"}}>
                                        ✅ Verified
                                    </span>
                                )}
                            </div>
                        </div>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>

                    {/* Enhanced User Details Section */}
                    <div className="user-details-sections">
                        
                        {/* Basic Information Section */}
                        <div className="details-section">
                            <h4>📋 Basic Information</h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">User ID</span>
                                    <span className="detail-value">{user.id || user._id || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Full Name</span>
                                    <span className="detail-value">{user.name || 'Not provided'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email Address</span>
                                    <span className="detail-value">{user.email || 'Not provided'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Phone Number</span>
                                    <span className="detail-value">{user.phone || 'Not provided'}</span>
                                </div>
                                <div className="detail-item full-width">
                                    <span className="detail-label">Address</span>
                                    <span className="detail-value address">{user.address || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Account Information Section */}
                        <div className="details-section">
                            <h4>👤 Account Information</h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">User Role</span>
                                    <span className="detail-value role-badge">{user.role || 'Not specified'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Account Status</span>
                                    <span className={`detail-value status-badge ${user.status?.toLowerCase() || 'active'}`}>
                                        {user.status || 'Active'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Verification Status</span>
                                    <span className={`detail-value verification-badge ${user.isVerified ? 'verified' : 'pending'}`}>
                                        {user.isVerified ? '✅ Verified' : '⏳ Pending'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Payment Status</span>
                                    <span className={`detail-value payment-status ${user.hasPaid || user.joinTeamStatus === 'paid' ? 'paid' : 'unpaid'}`}>
                                        {user.hasPaid || user.joinTeamStatus === 'paid' ? '✅ Paid' : '❌ Unpaid'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Registration & Activity Section */}
                        <div className="details-section">
                            <h4>📅 Registration & Activity</h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Joined Date</span>
                                    <span className="detail-value">
                                        {safeDateDisplay(user.createdAt)}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Last Active</span>
                                    <span className="detail-value">
                                        {user.lastActive ? 
                                            `${safeDateDisplay(user.lastActive)} (${getRelativeTime(user.lastActive)})` 
                                            : 'Never logged in'
                                        }
                                    </span>
                                </div>
                                {user.paymentDate && (
                                    <div className="detail-item">
                                        <span className="detail-label">Payment Date</span>
                                        <span className="detail-value">
                                            {safeDateDisplay(user.paymentDate)}
                                        </span>
                                    </div>
                                )}
                                {user.updatedAt && (
                                    <div className="detail-item">
                                        <span className="detail-label">Last Updated</span>
                                        <span className="detail-value">
                                            {safeDateDisplay(user.updatedAt)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Professional Details Section (For Lawyers) */}
                        {isLawyer && (
                            <div className="details-section professional-details">
                                <h4>⚖️ Professional Information</h4>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Specialization</span>
                                        <span className="detail-value">{user.specialization || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Experience</span>
                                        <span className="detail-value">
                                            {user.experience ? `${user.experience} years` : 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Bar Council Number</span>
                                        <span className="detail-value">{user.barCouncilNumber || 'Not provided'}</span>
                                    </div>
                                    <div className="detail-item full-width">
                                        <span className="detail-label">Verification Status</span>
                                        <span className={`detail-value ${user.verificationStatus || 'not_submitted'}`}>
                                            {user.verificationStatus ? 
                                                user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1) 
                                                : 'Not Submitted'
                                            }
                                        </span>
                                    </div>
                                    {user.verificationRequestedAt && (
                                        <div className="detail-item">
                                            <span className="detail-label">Verification Requested</span>
                                            <span className="detail-value">
                                                {safeDateDisplay(user.verificationRequestedAt)}
                                            </span>
                                        </div>
                                    )}
                                    {user.verifiedAt && (
                                        <div className="detail-item">
                                            <span className="detail-label">Verified At</span>
                                            <span className="detail-value">
                                                {safeDateDisplay(user.verifiedAt)}
                                            </span>
                                        </div>
                                    )}
                                    {user.verificationDeadline && (
                                        <div className="detail-item">
                                            <span className="detail-label">Verification Deadline</span>
                                            <span className="detail-value">
                                                {safeDateDisplay(user.verificationDeadline)}
                                            </span>
                                        </div>
                                    )}
                                    {user.rejectionReason && (
                                        <div className="detail-item full-width">
                                            <span className="detail-label">Rejection Reason</span>
                                            <span className="detail-value rejection-reason">
                                                {user.rejectionReason}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Team Membership Section */}
                        <div className="details-section">
                            <h4>👥 Payment Information</h4>
                            <div className="details-grid">
                                
                                {user.razorpayPaymentId && (
                                    <div className="detail-item">
                                        <span className="detail-label">Payment ID</span>
                                        <span className="detail-value payment-id">{user.razorpayPaymentId}</span>
                                    </div>
                                )}
                                {user.razorpayOrderId && (
                                    <div className="detail-item">
                                        <span className="detail-label">Order ID</span>
                                        <span className="detail-value payment-id">{user.razorpayOrderId}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Documents Section */}
                        {user.documents && user.documents.length > 0 && (
                            <div className="details-section">
                                <h4>📄 Documents</h4>
                                <div className="details-grid">
                                    <div className="detail-item full-width">
                                        <span className="detail-label">Total Documents</span>
                                        <span className="detail-value">
                                            {user.documents.length} document(s) uploaded
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Quick Actions - FIXED: Ensure buttons are properly rendered */}
                    <div className="card-actions">
                        <button 
                            className="action-btn primary"
                            onClick={handleSendEmail}
                        >
                            📧 Send Message
                        </button>
                        
                        <button 
                            className="action-btn danger delete-btn"
                            onClick={handleDeleteUser}
                        >
                            🗑️ Delete User
                        </button>
                    </div>
                </div>
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <EmailModal 
                    user={user}
                    onClose={() => setShowEmailModal(false)}
                    onSendEmail={onSendEmail}
                />
            )}
        </>
    );
};



// Email Modal Component
const EmailModal = ({ user, onClose, onSendEmail }) => {
    const [emailData, setEmailData] = useState({
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);

    const handleSendEmail = async () => {
        if (!emailData.subject.trim() || !emailData.message.trim()) {
            alert('Please fill in both subject and message');
            return;
        }

        setSending(true);
        try {
            await onSendEmail(user.email, emailData.subject, emailData.message);
            onClose();
        } catch (error) {
            console.error('Error sending email:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="email-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📧 Send Email to {user.name}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="recipient-info">
                        <strong>To:</strong> {user.email}
                    </div>

                    <div className="form-group">
                        <label>Subject *</label>
                        <input
                            type="text"
                            value={emailData.subject}
                            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter email subject..."
                            className="email-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Message *</label>
                        <textarea
                            value={emailData.message}
                            onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Type your message here..."
                            rows="8"
                            className="email-textarea"
                        />
                    </div>

                    <div className="email-tips">
                        <p>💡 <strong>Tips:</strong></p>
                        <ul>
                            <li>Be professional and clear in your communication</li>
                            <li>Include all necessary information</li>
                            <li>Double-check the recipient email address</li>
                        </ul>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="action-btn secondary"
                        onClick={onClose}
                        disabled={sending}
                    >
                        Cancel
                    </button>
                    <button 
                        className="action-btn primary"
                        onClick={handleSendEmail}
                        disabled={sending}
                    >
                        {sending ? (
                            <>
                                <div className="loading-spinner-small"></div>
                                Sending...
                            </>
                        ) : (
                            'Send Email'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// =======================================================
// Section 2: User Management (Uses allUsers)
// =======================================================
const UserManagement = ({ users, onUpdateUserStatus }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserCard, setShowUserCard] = useState(false);
     const [updatingStatus, setUpdatingStatus] = useState(null); // Track which user is being updated


     const { user: currentAdmin } = useAuth(); // Get current admin user
     console.log('🔍 UserManagement - All users data:', users);
    // Debug: Check what props we're getting
    console.log('🔍 UserManagement props:', { users, onUpdateUserStatus });

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

   // Check if a user row is the current admin
    const isCurrentAdminRow = (user) => {
        return user.email === 'admin@lawconnect.com';
    };

    const toggleUserStatus = async (user) => {
        


    const userId = user.id || user._id;
    const currentStatus = user.status || (user.isActive ? 'Active' : 'Inactive');
    
    // Convert to lowercase for backend, but keep display as title case
    const newDisplayStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const newBackendStatus = newDisplayStatus.toLowerCase(); // Convert to lowercase for API
    
    console.log(`🔄 Toggling user status: ${user.name} from ${currentStatus} to ${newDisplayStatus} (sending: ${newBackendStatus})`);
    
    // Show loading state
    setUpdatingStatus(userId);
    
    try {
        await onUpdateUserStatus(userId, newDisplayStatus);
    } catch (error) {
        console.error('Error updating user status:', error);
    } finally {
        // Remove loading state
        setUpdatingStatus(null);
    }
};

    const handleViewUser = (user) => {
        console.log('👤 Opening user profile for:', user.name);
        setSelectedUser(user);
        setShowUserCard(true);
    };

    // Delete user function
    const handleDeleteUser = async (userId) => {
        console.log('🗑️ Deleting user with ID:', userId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('✅ Delete response:', data);

            if (data.success) {
                alert(`✅ User deleted successfully: ${data.deletedUser.name}`);
                window.location.reload();
            } else {
                alert(`❌ Failed to delete user: ${data.error}`);
            }
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            alert('❌ Error deleting user. Please try again.');
        }
    };

    // Send email function
    const handleSendEmail = async (to, subject, message) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/api/admin/send-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ to, subject, message })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Email sent successfully to ${to}`);
            } else {
                alert(`❌ Failed to send email: ${data.error}`);
            }
        } catch (error) {
            console.error('❌ Error sending email:', error);
            alert('❌ Error sending email. Please try again.');
        }
    };

    return (
        <div className="section-content">
            <div className="section-header">
                <h1>User Management</h1>
                <p>Manage all users and lawyers on the platform</p>
            </div>

            <div className="content-card">
                <div className="card-header">
                    <h3>All Users ({filteredUsers.length})</h3>
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                                
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => {
                                const status = user.status || (user.isActive ? 'Active' : 'Inactive');
                                const isUpdating = updatingStatus === (user.id || user._id);
                                 const isAdminRow = isCurrentAdminRow(user);
                                const buttonsDisabled = isAdminRow || isUpdating;
                                return (
                                    <tr key={user.id || user._id}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <span>{user.name}</span>
                                                 {isAdminRow && (
                                                    <span className="admin-badge">👑</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>{user.phone || 'Not provided'}</td>
                                        <td>
                                            <span className={`role-badge role-${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${status.toLowerCase()}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td>{user.joined}</td>
                                        <td>
                                            
                                            <div className="action-buttons-small">
                                                                                                <button 
                                                    className={`action-btn small ${status === 'Active' ? 'danger' : 'success'} ${buttonsDisabled ? 'disabled' : ''}`}
                                                    onClick={() => isAdminRow ? alert('❌ Cannot modify admin user status') : toggleUserStatus(user)}
                                                    disabled={buttonsDisabled}
                                                    title={isAdminRow ? "Cannot modify admin user" : ""}
                                                >
                                                    {isUpdating ? (
                                                        <>
                                                            <div className="loading-spinner-small"></div>
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        status === 'Active' ? 'Deactivate' : 'Activate'
                                                    )}
                                                </button>
                                                <button 
                                                    className={`action-btn small primary ${buttonsDisabled ? 'disabled' : ''}`}
                                                    onClick={() => isAdminRow ? alert('❌ Cannot view admin user profile') : handleViewUser(user)}
                                                    disabled={buttonsDisabled}
                                                    title={isAdminRow ? "Cannot view admin user profile" : ""}
                                                >
                                                    View
                                                </button>

                                            </div>
                                            
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Make sure onDeleteUser is passed */}
            {showUserCard && selectedUser && (
                <UserProfileCard 
                    user={selectedUser} 
                    onClose={() => {
                        console.log('🔴 Closing user profile');
                        setShowUserCard(false);
                        setSelectedUser(null);
                    }}
                    onDeleteUser={handleDeleteUser} // THIS MUST BE PASSED
                    onSendEmail={handleSendEmail} // Pass email function
                />
            )}
        </div>
    );
};

// =======================================================
// Section 3: Verification Management
// =======================================================
const VerificationManagement = ({ verifications, onApprove, onReject }) => {
  const handleReject = async (lawyer) => {
    console.log('🎯 Reject button clicked for:', lawyer.name, lawyer.id);
    
    if (window.confirm(`Are you sure you want to reject verification for ${lawyer.name}?`)) {
      try {
        await onReject(lawyer.id || lawyer._id);
      } catch (error) {
        console.error('❌ Reject failed in component:', error);
      }
    }
  };

  return (
    <div className="section-content">
      <div className="section-header">
        <h1>Content & Verification</h1>
        <p>Manage lawyer verifications and platform content</p>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h3>Pending Verifications ({verifications.length})</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lawyer</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map(lawyer => (
                <tr key={lawyer.id || lawyer._id}>
                  <td>
                    <strong>{lawyer.name}</strong>
                    <br />
                    <small>ID: {lawyer.id || lawyer._id}</small>
                  </td>
                  <td>{lawyer.email}</td>
                  <td>{lawyer.specialization || 'N/A'}</td>
                  <td>{lawyer.submitted}</td>
                  <td>
                    <div className="action-buttons-small">
                      <button 
                        className="action-btn small primary"
                        onClick={() => {
                          console.log('✅ Approve clicked:', lawyer);
                          if (window.confirm(`Approve ${lawyer.name}?`)) {
                            onApprove(lawyer.id || lawyer._id);
                          }
                        }}
                      >
                        Approve
                      </button>
                      <button 
                        className="action-btn small danger"
                        onClick={() => handleReject(lawyer)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
// =======================================================
// Section 4: Analytics & Settings (Enhanced with Real Graphs)
// =======================================================
const AnalyticsSettings = ({ analyticsData, statsData }) => {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        autoVerification: false,
        maintenanceMode: false,
        // twoFactorAuth: true
    });
    
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y
    const [chartData, setChartData] = useState(null);
    const [loadingCharts, setLoadingCharts] = useState(true);
    const [analyticsStats, setAnalyticsStats] = useState({});

    // Fetch real analytics data from backend
    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        try {
            setLoadingCharts(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/admin/analytics/charts?range=${timeRange}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch analytics data');
            
            const result = await response.json();
            if (result.success) {
                setChartData(result.analytics);
                setAnalyticsStats(result.analytics);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoadingCharts(false);
        }
    };

    const toggleSetting = async (settingName) => {
        const newValue = !settings[settingName];
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/admin/settings/${settingName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ value: newValue })
            });

            if (response.ok) {
                setSettings(prev => ({
                    ...prev,
                    [settingName]: newValue
                }));
            } else {
                throw new Error('Failed to update setting');
            }
        } catch (error) {
            console.error('Error updating setting:', error);
            alert('Failed to update setting. Please try again.');
        }
    };

    // Format currency for display
    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '₹0';
        return `₹${Number(value).toLocaleString('en-IN')}`;
    };

    return (
        <div className="section-content">
            <div className="section-header">
                <h1>Analytics & Settings</h1>
                <p>Platform analytics and system configuration</p>
                
                {/* Time Range Selector */}
                <div className="time-range-selector">
                    <label>Time Range:</label>
                    <select 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="range-select"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="1y">Last Year</option>
                    </select>
                </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">👥</div>
                    <div className="metric-info">
                        <h3>{analyticsStats?.totalUsers?.toLocaleString() || '0'}</h3>
                        <p>Total Users</p>
                        <span className="metric-trend trend-up">
                            +{analyticsStats?.userGrowthRate || '0'}% growth
                        </span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">💰</div>
                    <div className="metric-info">
                        <h3>{formatCurrency(analyticsStats?.revenue || 0)}</h3>
                        <p>Monthly Revenue</p>
                        <span className="metric-trend trend-up">
                            +{analyticsStats?.revenueGrowth || '0'}% vs last month
                        </span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">📈</div>
                    <div className="metric-info">
                        <h3>{analyticsStats?.activeUsers?.toLocaleString() || '0'}</h3>
                        <p>Active Users</p>
                        <span className="metric-trend trend-up">
                            {analyticsStats?.engagementRate || '0'}% engagement
                        </span>
                    </div>
                </div>

                
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <h3>Platform Analytics</h3>
                
                {loadingCharts ? (
                    <div className="charts-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading analytics data...</p>
                    </div>
                ) : (
                    <div className="charts-grid">
                        {/* User Growth Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h4>User Growth Over Time</h4>
                                <span className="chart-subtitle">New registrations and total users</span>
                            </div>
                            <div className="chart-container">
                                <UserGrowthChart 
                                    data={chartData?.userGrowth || []} 
                                    timeRange={timeRange}
                                />
                            </div>
                        </div>

                        {/* User Demographics */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h4>User Demographics</h4>
                                <span className="chart-subtitle">User types and distribution</span>
                            </div>
                            <div className="chart-container">
                                <DemographicsChart 
                                    data={chartData?.demographics || {}}
                                />
                            </div>
                        </div>

                        {/* Revenue Analytics Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h4>Revenue Analytics</h4>
                                <span className="chart-subtitle">Monthly revenue and trends</span>
                            </div>
                            <div className="chart-container">
                                <RevenueChart 
                                    data={chartData?.revenueData || []}
                                    timeRange={timeRange}
                                />
                            </div>
                        </div>

                        {/* User Engagement Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h4>User Engagement</h4>
                                <span className="chart-subtitle">Active users and session duration</span>
                            </div>
                            <div className="chart-container">
                                <EngagementChart 
                                    data={chartData?.engagementData || []}
                                    timeRange={timeRange}
                                />
                            </div>
                        </div>

                       
                        

                        

                        
                    </div>
                )}
            </div>

            {/* Settings Section */}
            <div className="settings-section">
                <div className="content-grid">
                    <div className="content-column">
                        <div className="content-card">
                            <h3>System Settings</h3>
                            <div className="settings-list">
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Email Notifications</span>
                                        <span className="setting-description">Send email alerts for important events</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={settings.emailNotifications}
                                            onChange={() => toggleSetting('emailNotifications')}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Auto Verification</span>
                                        <span className="setting-description">Automatically verify lawyers with complete profiles</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={settings.autoVerification}
                                            onChange={() => toggleSetting('autoVerification')}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span className="setting-label">Maintenance Mode</span>
                                        <span className="setting-description">Put platform under maintenance</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={settings.maintenanceMode}
                                            onChange={() => toggleSetting('maintenanceMode')}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                
                               
                            </div>
                        </div>
                    </div>

                    <div className="content-column">
                        <div className="content-card">
                            <h3>Platform Statistics</h3>
                            <div className="stats-list">
                                <div className="stat-item">
                                    <span className="stat-label">Total Users</span>
                                    <span className="stat-value">{statsData.totalUsers || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Total Lawyers</span>
                                    <span className="stat-value">{statsData.totalLawyers || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Pending Verifications</span>
                                    <span className="stat-value">{statsData.pendingVerificationsCount || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Active Cases</span>
                                    <span className="stat-value">{analyticsStats?.activeCases || 0}</span>
                                </div>
                                
                                <div className="stat-item">
                                    <span className="stat-label">User Satisfaction</span>
                                    <span className="stat-value">{analyticsStats?.satisfactionRate || '0'}%</span>
                                </div>
                            </div>
                        </div>

                        
                    </div>
                </div>
            </div>
        </div>
    );
};

// Chart Components
// Enhanced Chart Components with Real Data and Proper Axes
const UserGrowthChart = ({ data, timeRange }) => {
    const chartRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

    useEffect(() => {
        if (!chartRef.current || !data.length) return;

        const svg = chartRef.current;
        const width = svg.clientWidth;
        const height = 300;
        const padding = { top: 40, right: 40, bottom: 50, left: 60 };

        svg.innerHTML = '';
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        if (data.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#666');
            text.textContent = 'No user growth data available';
            svg.appendChild(text);
            return;
        }

        // Calculate scales with proper margins
        const xScale = (index) => padding.left + (index * (width - padding.left - padding.right)) / (data.length - 1);
        const maxUsers = Math.max(...data.map(d => Math.max(d.totalUsers || 0, d.newUsers || 0)));
        const yScale = (value) => height - padding.bottom - (value / maxUsers) * (height - padding.top - padding.bottom);

        // Create Y-axis grid lines with labels
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i * (height - padding.top - padding.bottom)) / 5;
            const value = Math.round((maxUsers * (5 - i)) / 5);
            
            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding.right);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#334155');
            line.setAttribute('stroke-dasharray', '2,2');
            svg.appendChild(line);

            // Y-axis label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', '#94a3b8');
            text.textContent = value.toLocaleString();
            svg.appendChild(text);
        }

        // X-axis line
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding.left);
        xAxis.setAttribute('y1', height - padding.bottom);
        xAxis.setAttribute('x2', width - padding.right);
        xAxis.setAttribute('y2', height - padding.bottom);
        xAxis.setAttribute('stroke', '#475569');
        xAxis.setAttribute('stroke-width', '1');
        svg.appendChild(xAxis);

        // Y-axis line
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding.left);
        yAxis.setAttribute('y1', padding.top);
        yAxis.setAttribute('x2', padding.left);
        yAxis.setAttribute('y2', height - padding.bottom);
        yAxis.setAttribute('stroke', '#475569');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);

        // Total Users line with smooth curve
        const totalUsersLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let totalUsersPath = `M ${xScale(0)} ${yScale(data[0].totalUsers)}`;
        data.forEach((point, index) => {
            if (index > 0) {
                totalUsersPath += ` L ${xScale(index)} ${yScale(point.totalUsers)}`;
            }
        });
        totalUsersLine.setAttribute('d', totalUsersPath);
        totalUsersLine.setAttribute('fill', 'none');
        totalUsersLine.setAttribute('stroke', '#3b82f6');
        totalUsersLine.setAttribute('stroke-width', '3');
        totalUsersLine.setAttribute('stroke-linecap', 'round');
        svg.appendChild(totalUsersLine);

        // New Users line (dashed)
        const newUsersLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let newUsersPath = `M ${xScale(0)} ${yScale(data[0].newUsers)}`;
        data.forEach((point, index) => {
            if (index > 0) {
                newUsersPath += ` L ${xScale(index)} ${yScale(point.newUsers)}`;
            }
        });
        newUsersLine.setAttribute('d', newUsersPath);
        newUsersLine.setAttribute('fill', 'none');
        newUsersLine.setAttribute('stroke', '#10b981');
        newUsersLine.setAttribute('stroke-width', '2');
        newUsersLine.setAttribute('stroke-dasharray', '4,2');
        svg.appendChild(newUsersLine);

        // Add interactive data points with cursor pointer
        data.forEach((point, index) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Total users point
            const totalCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            totalCircle.setAttribute('cx', xScale(index));
            totalCircle.setAttribute('cy', yScale(point.totalUsers));
            totalCircle.setAttribute('r', '4');
            totalCircle.setAttribute('fill', '#3b82f6');
            totalCircle.setAttribute('stroke', '#1e40af');
            totalCircle.setAttribute('stroke-width', '2');
            totalCircle.style.cursor = 'pointer';
            totalCircle.addEventListener('mouseenter', (e) => {
                const rect = svg.getBoundingClientRect();
                setTooltip({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    data: {
                        date: point.date,
                        totalUsers: point.totalUsers,
                        newUsers: point.newUsers
                    }
                });
            });
            totalCircle.addEventListener('mouseleave', () => setTooltip({ visible: false, x: 0, y: 0, data: null }));
            
            // New users point
            const newCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            newCircle.setAttribute('cx', xScale(index));
            newCircle.setAttribute('cy', yScale(point.newUsers));
            newCircle.setAttribute('r', '3');
            newCircle.setAttribute('fill', '#10b981');
            newCircle.setAttribute('stroke', '#047857');
            newCircle.setAttribute('stroke-width', '1');
            newCircle.style.cursor = 'pointer';
            
            group.appendChild(totalCircle);
            group.appendChild(newCircle);
            svg.appendChild(group);
        });

        // Add X-axis labels with rotation for better fit
        data.forEach((point, index) => {
            if (index % Math.ceil(data.length / 6) === 0) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xScale(index));
                text.setAttribute('y', height - 20);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '10');
                text.setAttribute('fill', '#94a3b8');
                text.textContent = point.date;
                svg.appendChild(text);
            }
        });

        // Add Y-axis label
        const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yAxisLabel.setAttribute('x', -height / 2);
        yAxisLabel.setAttribute('y', 15);
        yAxisLabel.setAttribute('transform', 'rotate(-90)');
        yAxisLabel.setAttribute('text-anchor', 'middle');
        yAxisLabel.setAttribute('font-size', '12');
        yAxisLabel.setAttribute('fill', '#94a3b8');
        yAxisLabel.textContent = 'Number of Users';
        svg.appendChild(yAxisLabel);

        // Add chart title
        const chartTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        chartTitle.setAttribute('x', width / 2);
        chartTitle.setAttribute('y', 20);
        chartTitle.setAttribute('text-anchor', 'middle');
        chartTitle.setAttribute('font-size', '14');
        chartTitle.setAttribute('fill', '#f8fafc');
        chartTitle.setAttribute('font-weight', '600');
        chartTitle.textContent = 'User Growth Over Time';
        svg.appendChild(chartTitle);

    }, [data, timeRange]);

    return (
        <>
            <div className="chart-wrapper-enhanced">
                <svg ref={chartRef} className="advanced-chart"></svg>
            </div>
            {tooltip.visible && (
                <div 
                    className="chart-tooltip-enhanced"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
                >
                    <div className="tooltip-header">{tooltip.data.date}</div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Total Users:</span>
                        <span className="tooltip-value">{tooltip.data.totalUsers?.toLocaleString()}</span>
                    </div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">New Users:</span>
                        <span className="tooltip-value success">{tooltip.data.newUsers?.toLocaleString()}</span>
                    </div>
                </div>
            )}
        </>
    );
};

// Enhanced Revenue Chart with Proper Axes
const RevenueChart = ({ data, timeRange }) => {
    const chartRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

    useEffect(() => {
        if (!chartRef.current) return;

        const svg = chartRef.current;
        const width = svg.clientWidth;
        const height = 300;
        const padding = { top: 40, right: 40, bottom: 50, left: 80 };

        svg.innerHTML = '';
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        if (!data || data.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#666');
            text.textContent = 'No revenue data available';
            svg.appendChild(text);
            return;
        }

        // Calculate scales
        const xScale = (index) => padding.left + (index * (width - padding.left - padding.right)) / (data.length - 1);
        const maxRevenue = Math.max(...data.map(d => Math.max(d.revenue || 0, d.target || 0)));
        const yScale = (value) => height - padding.bottom - (value / maxRevenue) * (height - padding.top - padding.bottom);

        // Create Y-axis grid and labels
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i * (height - padding.top - padding.bottom)) / 5;
            const value = Math.round((maxRevenue * (5 - i)) / 5);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding.right);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#334155');
            line.setAttribute('stroke-dasharray', '2,2');
            svg.appendChild(line);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('font-size', '11');
            text.setAttribute('fill', '#94a3b8');
            text.textContent = `₹${(value / 1000).toFixed(0)}k`;
            svg.appendChild(text);
        }

        // X and Y axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding.left+10);
        xAxis.setAttribute('y1', height - padding.bottom);
        xAxis.setAttribute('x2', width - padding.right);
        xAxis.setAttribute('y2', height - padding.bottom);
        xAxis.setAttribute('stroke', '#475569');
        xAxis.setAttribute('stroke-width', '0.1');    
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding.left);
        yAxis.setAttribute('y1', padding.top);
        yAxis.setAttribute('x2', padding.left);
        yAxis.setAttribute('y2', height - padding.bottom);
        yAxis.setAttribute('stroke', '#475569');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);

        // Create bars for actual revenue with hover effects
        data.forEach((point, index) => {
            const barWidth = (width - padding.left - padding.right) / data.length - 8;
            const barHeight = height - padding.bottom - yScale(point.revenue);
            const achievement = point.target ? (point.revenue / point.target) * 100 : 0;
            
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('x', xScale(index) - barWidth / 2);
            bar.setAttribute('y', yScale(point.revenue));
            bar.setAttribute('width', barWidth);
            bar.setAttribute('height', barHeight);
            bar.setAttribute('fill', achievement >= 100 ? '#10b981' : achievement >= 80 ? '#f59e0b' : '#ef4444');
            bar.setAttribute('rx', '4');
            bar.setAttribute('class', 'revenue-bar');
            bar.style.cursor = 'pointer';
            bar.style.transition = 'all 0.3s ease';
            
            bar.addEventListener('mouseenter', (e) => {
                bar.setAttribute('fill', achievement >= 100 ? '#34d399' : achievement >= 80 ? '#fbbf24' : '#f87171');
                const rect = svg.getBoundingClientRect();
                setTooltip({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    data: {
                        period: point.period,
                        revenue: point.revenue,
                        target: point.target,
                        achievement: achievement
                    }
                });
            });
            bar.addEventListener('mouseleave', () => {
                bar.setAttribute('fill', achievement >= 100 ? '#10b981' : achievement >= 80 ? '#f59e0b' : '#ef4444');
                setTooltip({ visible: false, x: 0, y: 0, data: null });
            });
            
            svg.appendChild(bar);

            // Add value labels on bars
            if (barHeight > 25) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xScale(index));
                text.setAttribute('y', yScale(point.revenue) - 5);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '9');
                text.setAttribute('fill', '#f8fafc');
                text.setAttribute('font-weight', '600');
                text.textContent = `₹${(point.revenue / 1000).toFixed(0)}k`;
                svg.appendChild(text);
            }

            // Add target line
            if (point.target) {
                const targetLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                targetLine.setAttribute('x1', xScale(index) - barWidth / 2);
                targetLine.setAttribute('y1', yScale(point.target));
                targetLine.setAttribute('x2', xScale(index) + barWidth / 2);
                targetLine.setAttribute('y2', yScale(point.target));
                targetLine.setAttribute('stroke', '#8b5cf6');
                targetLine.setAttribute('stroke-width', '2');
                targetLine.setAttribute('stroke-dasharray', '3,2');
                svg.appendChild(targetLine);
            }
        });

        // Add X-axis labels
        data.forEach((point, index) => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', xScale(index));
            text.setAttribute('y', height - 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', '#94a3b8');
            text.textContent = point.period;
            svg.appendChild(text);
        });

        // Add Y-axis label
        const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yAxisLabel.setAttribute('x', -height / 2);
        yAxisLabel.setAttribute('y', 20);
        yAxisLabel.setAttribute('transform', 'rotate(-90)');
        yAxisLabel.setAttribute('text-anchor', 'middle');
        yAxisLabel.setAttribute('font-size', '12');
        yAxisLabel.setAttribute('fill', '#94a3b8');
        yAxisLabel.textContent = 'Revenue (₹)';
        svg.appendChild(yAxisLabel);

        // Add chart title
        const chartTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        chartTitle.setAttribute('x', width / 2);
        chartTitle.setAttribute('y', 20);
        chartTitle.setAttribute('text-anchor', 'middle');
        chartTitle.setAttribute('font-size', '14');
        chartTitle.setAttribute('fill', '#f8fafc');
        chartTitle.setAttribute('font-weight', '600');
        chartTitle.textContent = 'Revenue Performance';
        svg.appendChild(chartTitle);

    }, [data, timeRange]);

    return (
        <>
            <div className="chart-wrapper-enhanced">
                <svg ref={chartRef} className="advanced-chart"></svg>
            </div>
            {tooltip.visible && tooltip.data && (
                <div 
                    className="chart-tooltip-enhanced"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
                >
                    <div className="tooltip-header">{tooltip.data.period}</div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Revenue:</span>
                        <span className="tooltip-value">₹{tooltip.data.revenue?.toLocaleString()}</span>
                    </div>
                    {tooltip.data.target && (
                        <>
                            <div className="tooltip-item">
                                <span className="tooltip-label">Target:</span>
                                <span className="tooltip-value">₹{tooltip.data.target?.toLocaleString()}</span>
                            </div>
                            <div className="tooltip-item">
                                <span className="tooltip-label">Achievement:</span>
                                <span className={`tooltip-value ${
                                    tooltip.data.achievement >= 100 ? 'success' : 
                                    tooltip.data.achievement >= 80 ? 'warning' : 'danger'
                                }`}>
                                    {tooltip.data.achievement.toFixed(1)}%
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

// Enhanced User Engagement Chart
const EngagementChart = ({ data, timeRange }) => {
    const chartRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

    useEffect(() => {
        if (!chartRef.current || !data.length) return;

        const svg = chartRef.current;
        const width = svg.clientWidth;
        const height = 300;
        const padding = { top: 40, right: 40, bottom: 50, left: 60 };

        svg.innerHTML = '';
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        if (data.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#666');
            text.textContent = 'No engagement data available';
            svg.appendChild(text);
            return;
        }

        // Calculate scales
        const xScale = (index) => padding.left + (index * (width - padding.left - padding.right)) / (data.length - 1);
        const maxActiveUsers = Math.max(...data.map(d => d.activeUsers || 0));
        const maxSessionDuration = Math.max(...data.map(d => d.avgSessionDuration || 0));
        
        const yScaleUsers = (value) => height - padding.bottom - (value / maxActiveUsers) * (height - padding.top - padding.bottom);
        const yScaleDuration = (value) => height - padding.bottom - (value / maxSessionDuration) * (height - padding.top - padding.bottom);

        // Create Y-axis grid lines for Active Users
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i * (height - padding.top - padding.bottom)) / 5;
            const value = Math.round((maxActiveUsers * (5 - i)) / 5);
            
            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding.right);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#334155');
            line.setAttribute('stroke-dasharray', '2,2');
            svg.appendChild(line);

            // Left Y-axis label (Active Users)
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', '#8b5cf6');
            text.textContent = value.toLocaleString();
            svg.appendChild(text);
        }

        // Create right Y-axis grid lines for Session Duration
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i * (height - padding.top - padding.bottom)) / 5;
            const value = Math.round((maxSessionDuration * (5 - i)) / 5);
            
            // Right Y-axis label (Session Duration)
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width - padding.right + 10);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'start');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', '#f59e0b');
            text.textContent = `${value}m`;
            svg.appendChild(text);
        }

        // X and Y axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding.left);
        xAxis.setAttribute('y1', height - padding.bottom);
        xAxis.setAttribute('x2', width - padding.right);
        xAxis.setAttribute('y2', height - padding.bottom);
        xAxis.setAttribute('stroke', '#475569');
        xAxis.setAttribute('stroke-width', '1');
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding.left);
        yAxis.setAttribute('y1', padding.top);
        yAxis.setAttribute('x2', padding.left);
        yAxis.setAttribute('y2', height - padding.bottom);
        yAxis.setAttribute('stroke', '#475569');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);

        // Active Users line (solid)
        const usersLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let usersPath = `M ${xScale(0)} ${yScaleUsers(data[0].activeUsers)}`;
        data.forEach((point, index) => {
            if (index > 0) {
                usersPath += ` L ${xScale(index)} ${yScaleUsers(point.activeUsers)}`;
            }
        });
        usersLine.setAttribute('d', usersPath);
        usersLine.setAttribute('fill', 'none');
        usersLine.setAttribute('stroke', '#8b5cf6');
        usersLine.setAttribute('stroke-width', '3');
        usersLine.setAttribute('stroke-linecap', 'round');
        svg.appendChild(usersLine);

        // Session Duration line (dashed)
        const durationLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let durationPath = `M ${xScale(0)} ${yScaleDuration(data[0].avgSessionDuration)}`;
        data.forEach((point, index) => {
            if (index > 0) {
                durationPath += ` L ${xScale(index)} ${yScaleDuration(point.avgSessionDuration)}`;
            }
        });
        durationLine.setAttribute('d', durationPath);
        durationLine.setAttribute('fill', 'none');
        durationLine.setAttribute('stroke', '#f59e0b');
        durationLine.setAttribute('stroke-width', '2');
        durationLine.setAttribute('stroke-dasharray', '4,2');
        svg.appendChild(durationLine);

        // Add interactive data points
        data.forEach((point, index) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Active Users point
            const usersCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            usersCircle.setAttribute('cx', xScale(index));
            usersCircle.setAttribute('cy', yScaleUsers(point.activeUsers));
            usersCircle.setAttribute('r', '4');
            usersCircle.setAttribute('fill', '#8b5cf6');
            usersCircle.setAttribute('stroke', '#7c3aed');
            usersCircle.setAttribute('stroke-width', '2');
            usersCircle.style.cursor = 'pointer';
            usersCircle.addEventListener('mouseenter', (e) => {
                const rect = svg.getBoundingClientRect();
                setTooltip({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    data: {
                        date: point.date,
                        activeUsers: point.activeUsers,
                        avgSessionDuration: point.avgSessionDuration,
                        engagementRate: point.engagementRate
                    }
                });
            });
            usersCircle.addEventListener('mouseleave', () => setTooltip({ visible: false, x: 0, y: 0, data: null }));
            
            // Session Duration point
            const durationCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            durationCircle.setAttribute('cx', xScale(index));
            durationCircle.setAttribute('cy', yScaleDuration(point.avgSessionDuration));
            durationCircle.setAttribute('r', '3');
            durationCircle.setAttribute('fill', '#f59e0b');
            durationCircle.setAttribute('stroke', '#d97706');
            durationCircle.setAttribute('stroke-width', '1');
            durationCircle.style.cursor = 'pointer';
            
            group.appendChild(usersCircle);
            group.appendChild(durationCircle);
            svg.appendChild(group);
        });

        // Add X-axis labels
        data.forEach((point, index) => {
            if (index % Math.ceil(data.length / 6) === 0) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xScale(index));
                text.setAttribute('y', height - 20);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '10');
                text.setAttribute('fill', '#94a3b8');
                text.textContent = point.date;
                svg.appendChild(text);
            }
        });

        // Add Y-axis labels
        const leftYAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        leftYAxisLabel.setAttribute('x', -height / 2);
        leftYAxisLabel.setAttribute('y', 15);
        leftYAxisLabel.setAttribute('transform', 'rotate(-90)');
        leftYAxisLabel.setAttribute('text-anchor', 'middle');
        leftYAxisLabel.setAttribute('font-size', '12');
        leftYAxisLabel.setAttribute('fill', '#8b5cf6');
        leftYAxisLabel.textContent = 'Active Users';
        svg.appendChild(leftYAxisLabel);

        const rightYAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        rightYAxisLabel.setAttribute('x', height / 2);
        rightYAxisLabel.setAttribute('y', width - 15);
        rightYAxisLabel.setAttribute('transform', 'rotate(90)');
        rightYAxisLabel.setAttribute('text-anchor', 'middle');
        rightYAxisLabel.setAttribute('font-size', '12');
        rightYAxisLabel.setAttribute('fill', '#f59e0b');
        rightYAxisLabel.textContent = 'Session Duration (min)';
        svg.appendChild(rightYAxisLabel);

        // Add chart title
        const chartTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        chartTitle.setAttribute('x', width / 2);
        chartTitle.setAttribute('y', 20);
        chartTitle.setAttribute('text-anchor', 'middle');
        chartTitle.setAttribute('font-size', '14');
        chartTitle.setAttribute('fill', '#f8fafc');
        chartTitle.setAttribute('font-weight', '600');
        chartTitle.textContent = 'User Engagement Analytics';
        svg.appendChild(chartTitle);

    }, [data, timeRange]);

    return (
        <>
            <div className="chart-wrapper-enhanced">
                <svg ref={chartRef} className="advanced-chart"></svg>
            </div>
            {tooltip.visible && (
                <div 
                    className="chart-tooltip-enhanced"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
                >
                    <div className="tooltip-header">{tooltip.data.date}</div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Active Users:</span>
                        <span className="tooltip-value" style={{color: '#8b5cf6'}}>
                            {tooltip.data.activeUsers?.toLocaleString()}
                        </span>
                    </div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Avg Session:</span>
                        <span className="tooltip-value" style={{color: '#f59e0b'}}>
                            {tooltip.data.avgSessionDuration} minutes
                        </span>
                    </div>
                    {tooltip.data.engagementRate && (
                        <div className="tooltip-item">
                            <span className="tooltip-label">Engagement Rate:</span>
                            <span className="tooltip-value success">
                                {tooltip.data.engagementRate}%
                            </span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

// Enhanced Case Statistics Chart
const CaseStatsChart = ({ data, timeRange }) => {
    const chartRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

    useEffect(() => {
        if (!chartRef.current || !data.length) return;

        const svg = chartRef.current;
        const width = svg.clientWidth;
        const height = 300;
        const padding = { top: 40, right: 40, bottom: 50, left: 60 };

        svg.innerHTML = '';
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        if (data.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#666');
            text.textContent = 'No case data available';
            svg.appendChild(text);
            return;
        }

        // Calculate scales
        const xScale = (index) => padding.left + (index * (width - padding.left - padding.right)) / (data.length - 1);
        const maxCases = Math.max(...data.map(d => Math.max(d.created || 0, d.resolved || 0)));
        const yScale = (value) => height - padding.bottom - (value / maxCases) * (height - padding.top - padding.bottom);

        // Create Y-axis grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i * (height - padding.top - padding.bottom)) / 5;
            const value = Math.round((maxCases * (5 - i)) / 5);
            
            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding.right);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#334155');
            line.setAttribute('stroke-dasharray', '2,2');
            svg.appendChild(line);

            // Y-axis label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', '#94a3b8');
            text.textContent = value.toLocaleString();
            svg.appendChild(text);
        }

        // X and Y axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding.left);
        xAxis.setAttribute('y1', height - padding.bottom);
        xAxis.setAttribute('x2', width - padding.right);
        xAxis.setAttribute('y2', height - padding.bottom);
        xAxis.setAttribute('stroke', '#475569');
        xAxis.setAttribute('stroke-width', '1');
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding.left);
        yAxis.setAttribute('y1', padding.top);
        yAxis.setAttribute('x2', padding.left);
        yAxis.setAttribute('y2', height - padding.bottom);
        yAxis.setAttribute('stroke', '#475569');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);

        // Created cases line (red)
        const createdLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let createdPath = `M ${xScale(0)} ${yScale(data[0].created)}`;
        data.forEach((point, index) => {
            if (index > 0) {
                createdPath += ` L ${xScale(index)} ${yScale(point.created)}`;
            }
        });
        createdLine.setAttribute('d', createdPath);
        createdLine.setAttribute('fill', 'none');
        createdLine.setAttribute('stroke', '#ef4444');
        createdLine.setAttribute('stroke-width', '3');
        createdLine.setAttribute('stroke-linecap', 'round');
        svg.appendChild(createdLine);

        // Resolved cases line (green)
        const resolvedLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let resolvedPath = `M ${xScale(0)} ${yScale(data[0].resolved)}`;
        data.forEach((point, index) => {
            if (index > 0) {
                resolvedPath += ` L ${xScale(index)} ${yScale(point.resolved)}`;
            }
        });
        resolvedLine.setAttribute('d', resolvedPath);
        resolvedLine.setAttribute('fill', 'none');
        resolvedLine.setAttribute('stroke', '#10b981');
        resolvedLine.setAttribute('stroke-width', '3');
        resolvedLine.setAttribute('stroke-linecap', 'round');
        svg.appendChild(resolvedLine);

        // Add area under resolved cases
        const resolvedArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let areaPath = `M ${xScale(0)} ${yScale(data[0].resolved)}`;
        data.forEach((point, index) => {
            if (index > 0) {
                areaPath += ` L ${xScale(index)} ${yScale(point.resolved)}`;
            }
        });
        areaPath += ` L ${xScale(data.length - 1)} ${height - padding.bottom}`;
        areaPath += ` L ${xScale(0)} ${height - padding.bottom} Z`;
        resolvedArea.setAttribute('d', areaPath);
        resolvedArea.setAttribute('fill', 'rgba(16, 185, 129, 0.1)');
        resolvedArea.setAttribute('stroke', 'none');
        svg.insertBefore(resolvedArea, createdLine); // Place area behind lines

        // Add interactive data points
        data.forEach((point, index) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Created cases point
            const createdCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            createdCircle.setAttribute('cx', xScale(index));
            createdCircle.setAttribute('cy', yScale(point.created));
            createdCircle.setAttribute('r', '4');
            createdCircle.setAttribute('fill', '#ef4444');
            createdCircle.setAttribute('stroke', '#dc2626');
            createdCircle.setAttribute('stroke-width', '2');
            createdCircle.style.cursor = 'pointer';
            createdCircle.addEventListener('mouseenter', (e) => {
                const rect = svg.getBoundingClientRect();
                const resolutionRate = point.resolved > 0 ? (point.resolved / point.created * 100).toFixed(1) : 0;
                setTooltip({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    data: {
                        date: point.date,
                        created: point.created,
                        resolved: point.resolved,
                        pending: point.created - point.resolved,
                        resolutionRate: resolutionRate
                    }
                });
            });
            createdCircle.addEventListener('mouseleave', () => setTooltip({ visible: false, x: 0, y: 0, data: null }));
            
            // Resolved cases point
            const resolvedCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            resolvedCircle.setAttribute('cx', xScale(index));
            resolvedCircle.setAttribute('cy', yScale(point.resolved));
            resolvedCircle.setAttribute('r', '4');
            resolvedCircle.setAttribute('fill', '#10b981');
            resolvedCircle.setAttribute('stroke', '#047857');
            resolvedCircle.setAttribute('stroke-width', '2');
            resolvedCircle.style.cursor = 'pointer';
            
            group.appendChild(createdCircle);
            group.appendChild(resolvedCircle);
            svg.appendChild(group);
        });

        // Add X-axis labels
        data.forEach((point, index) => {
            if (index % Math.ceil(data.length / 6) === 0) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xScale(index));
                text.setAttribute('y', height - 20);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '10');
                text.setAttribute('fill', '#94a3b8');
                text.textContent = point.date;
                svg.appendChild(text);
            }
        });

        // Add Y-axis label
        const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yAxisLabel.setAttribute('x', -height / 2);
        yAxisLabel.setAttribute('y', 15);
        yAxisLabel.setAttribute('transform', 'rotate(-90)');
        yAxisLabel.setAttribute('text-anchor', 'middle');
        yAxisLabel.setAttribute('font-size', '12');
        yAxisLabel.setAttribute('fill', '#94a3b8');
        yAxisLabel.textContent = 'Number of Cases';
        svg.appendChild(yAxisLabel);

        // Add chart title
        const chartTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        chartTitle.setAttribute('x', width / 2);
        chartTitle.setAttribute('y', 20);
        chartTitle.setAttribute('text-anchor', 'middle');
        chartTitle.setAttribute('font-size', '14');
        chartTitle.setAttribute('fill', '#f8fafc');
        chartTitle.setAttribute('font-weight', '600');
        chartTitle.textContent = 'Case Statistics Overview';
        svg.appendChild(chartTitle);

    }, [data, timeRange]);

    return (
        <>
            <div className="chart-wrapper-enhanced">
                <svg ref={chartRef} className="advanced-chart"></svg>
            </div>
            {tooltip.visible && (
                <div 
                    className="chart-tooltip-enhanced"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
                >
                    <div className="tooltip-header">{tooltip.data.date}</div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Cases Created:</span>
                        <span className="tooltip-value" style={{color: '#ef4444'}}>
                            {tooltip.data.created?.toLocaleString()}
                        </span>
                    </div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Cases Resolved:</span>
                        <span className="tooltip-value" style={{color: '#10b981'}}>
                            {tooltip.data.resolved?.toLocaleString()}
                        </span>
                    </div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Pending Cases:</span>
                        <span className="tooltip-value warning">
                            {tooltip.data.pending?.toLocaleString()}
                        </span>
                    </div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Resolution Rate:</span>
                        <span className={`tooltip-value ${
                            tooltip.data.resolutionRate >= 80 ? 'success' : 
                            tooltip.data.resolutionRate >= 60 ? 'warning' : 'danger'
                        }`}>
                            {tooltip.data.resolutionRate}%
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};

const DemographicsChart = ({ data }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !data) return;

        const svg = chartRef.current;
        const width = svg.clientWidth;
        const height = 300;
        const padding = 50;

        svg.innerHTML = '';
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const userTypes = [
            { label: 'Clients', value: data.clients || 0, color: '#3b82f6' },
            { label: 'Lawyers', value: data.lawyers || 0, color: '#10b981' },
            { label: 'Others', value: data.others || 0, color: '#ef4444' }
        ];

        const total = userTypes.reduce((sum, type) => sum + type.value, 0);
        if (total === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#666');
            text.textContent = 'No demographic data available';
            svg.appendChild(text);
            return;
        }

        // Create pie chart
        let startAngle = 0;
        const radius = Math.min(width, height) / 2 - padding;
        const centerX = width / 2;
        const centerY = height / 2;

        userTypes.forEach((type, index) => {
            const percentage = type.value / total;
            const endAngle = startAngle + percentage * 2 * Math.PI;

            // Create arc
            const startX = centerX + radius * Math.cos(startAngle);
            const startY = centerY + radius * Math.sin(startAngle);
            const endX = centerX + radius * Math.cos(endAngle);
            const endY = centerY + radius * Math.sin(endAngle);

            const largeArcFlag = percentage > 0.5 ? 1 : 0;

            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${startX} ${startY}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'Z'
            ].join(' ');

            const slice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            slice.setAttribute('d', pathData);
            slice.setAttribute('fill', type.color);
            slice.setAttribute('stroke', '#fff');
            slice.setAttribute('stroke-width', '2');
            svg.appendChild(slice);

            // Add label
            if (percentage > 0.05) { // Only show label for significant slices
                const labelAngle = startAngle + percentage * Math.PI;
                const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle);
                const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', labelX);
                text.setAttribute('y', labelY);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.setAttribute('fill', '#fff');
                text.textContent = `${Math.round(percentage * 100)}%`;
                svg.appendChild(text);
            }

            startAngle = endAngle;
        });

        // Add legend
        const legendY = height - 10;
        userTypes.forEach((type, index) => {
            const legendX = 10 + index * 80;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', legendX);
            rect.setAttribute('y', legendY - 10);
            rect.setAttribute('width', 8);
            rect.setAttribute('height', 9);
            rect.setAttribute('fill', type.color);
            svg.appendChild(rect);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', legendX + 15);
            text.setAttribute('y', legendY);
            text.setAttribute('font-size', '15');
            text.setAttribute('fill', '#666');
            text.textContent = type.label;
            svg.appendChild(text);
        });

    }, [data]);

    return (
        <div className="chart-wrapper">
            <svg ref={chartRef} className="custom-chart"></svg>
        </div>
    );
};

// Replace the PerformanceChart component with this fixed version:
// Enhanced Platform Performance Chart
const PerformanceChart = ({ data, timeRange }) => {
    const chartRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

    useEffect(() => {
        if (!chartRef.current) return;

        const svg = chartRef.current;
        const width = svg.clientWidth;
        const height = 300;
        const padding = { top: 40, right: 40, bottom: 50, left: 80 };

        svg.innerHTML = '';
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        if (!data || Object.keys(data).length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#666');
            text.textContent = 'No performance data available';
            svg.appendChild(text);
            return;
        }

        // Prepare performance metrics data
        const performanceData = [
            { 
                label: 'Response Time', 
                value: data.avgResponseTime || 0, 
                max: 10, 
                unit: 'hours',
                color: data.avgResponseTime <= 4 ? '#10b981' : data.avgResponseTime <= 6 ? '#f59e0b' : '#ef4444'
            },
            { 
                label: 'Success Rate', 
                value: data.successRate || 0, 
                max: 100, 
                unit: '%',
                color: data.successRate > 80 ? '#10b981' : data.successRate > 60 ? '#f59e0b' : '#ef4444'
            },
            { 
                label: 'Uptime', 
                value: data.uptime || 99.9, 
                max: 100, 
                unit: '%',
                color: data.uptime >= 99.9 ? '#10b981' : data.uptime >= 99.5 ? '#f59e0b' : '#ef4444'
            }
            
        ];

        // Calculate scales
        const barHeight = 20;
        const barSpacing = 15;
        const totalHeight = performanceData.length * (barHeight + barSpacing);
        const startY = (height - totalHeight) / 2;
        
        const xScale = (value, max) => padding.left + (value / max) * (width - padding.left - padding.right - 100);

        // Create Y-axis grid lines
        for (let i = 0; i <= 5; i++) {
            const x = padding.left + (i * (width - padding.left - padding.right - 100)) / 5;
            const value = Math.round((100 * i) / 5);
            
            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', padding.top);
            line.setAttribute('x2', x);
            line.setAttribute('y2', height - padding.bottom);
            line.setAttribute('stroke', '#334155');
            line.setAttribute('stroke-dasharray', '2,2');
            svg.appendChild(line);

            // X-axis label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', height - 25);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', '#94a3b8');
            text.textContent = `${value}%`;
            svg.appendChild(text);
        }

        // X and Y axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding.left);
        xAxis.setAttribute('y1', height - padding.bottom);
        xAxis.setAttribute('x2', width - padding.right);
        xAxis.setAttribute('y2', height - padding.bottom);
        xAxis.setAttribute('stroke', '#475569');
        xAxis.setAttribute('stroke-width', '1');
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding.left);
        yAxis.setAttribute('y1', padding.top);
        yAxis.setAttribute('x2', padding.left);
        yAxis.setAttribute('y2', height - padding.bottom);
        yAxis.setAttribute('stroke', '#475569');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);

        // Create performance bars
        performanceData.forEach((metric, index) => {
            const y = startY + index * (barHeight + barSpacing);
            const barWidth = xScale(metric.value, metric.max);
            const maxBarWidth = xScale(metric.max, metric.max);
            
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Background bar (max value)
            const bgBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgBar.setAttribute('x', padding.left);
            bgBar.setAttribute('y', y);
            bgBar.setAttribute('width', maxBarWidth - padding.left);
            bgBar.setAttribute('height', barHeight);
            bgBar.setAttribute('fill', 'rgba(30, 41, 59, 0.5)');
            bgBar.setAttribute('rx', '4');
            bgBar.setAttribute('ry', '4');
            group.appendChild(bgBar);
            
            // Value bar
            const valueBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            valueBar.setAttribute('x', padding.left);
            valueBar.setAttribute('y', y);
            valueBar.setAttribute('width', barWidth - padding.left);
            valueBar.setAttribute('height', barHeight);
            valueBar.setAttribute('fill', metric.color);
            valueBar.setAttribute('rx', '4');
            valueBar.setAttribute('ry', '4');
            valueBar.style.cursor = 'pointer';
            valueBar.style.transition = 'all 0.3s ease';
            
            valueBar.addEventListener('mouseenter', (e) => {
                valueBar.setAttribute('filter', 'brightness(1.2)');
                const rect = svg.getBoundingClientRect();
                setTooltip({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    data: {
                        label: metric.label,
                        value: metric.value,
                        max: metric.max,
                        unit: metric.unit,
                        color: metric.color,
                        status: getPerformanceStatus(metric.value, metric.max, metric.label)
                    }
                });
            });
            
            valueBar.addEventListener('mouseleave', () => {
                valueBar.removeAttribute('filter');
                setTooltip({ visible: false, x: 0, y: 0, data: null });
            });
            
            group.appendChild(valueBar);
            
            // Metric label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', padding.left - 10);
            label.setAttribute('y', y + barHeight / 2 + 4);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('font-size', '11');
            label.setAttribute('fill', '#cbd5e1');
            label.setAttribute('font-weight', '500');
            label.textContent = metric.label;
            group.appendChild(label);
            
            // Value text
            const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            valueText.setAttribute('x', barWidth + 10);
            valueText.setAttribute('y', y + barHeight / 2 + 4);
            valueText.setAttribute('text-anchor', 'start');
            valueText.setAttribute('font-size', '11');
            valueText.setAttribute('fill', '#f8fafc');
            valueText.setAttribute('font-weight', '600');
            valueText.textContent = `${metric.value}${metric.unit}`;
            group.appendChild(valueText);
            
            // Performance indicator dot
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            // dot.setAttribute('cx', padding.left - 15);
            // dot.setAttribute('cy', y + barHeight / 2);
            dot.setAttribute('r', '4');
            dot.setAttribute('fill', metric.color);
            // group.appendChild(dot);
            
            svg.appendChild(group);
        });

        // Add X-axis label
        const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xAxisLabel.setAttribute('x', width / 2);
        xAxisLabel.setAttribute('y', height - 5);
        xAxisLabel.setAttribute('text-anchor', 'middle');
        xAxisLabel.setAttribute('font-size', '12');
        xAxisLabel.setAttribute('fill', '#94a3b8');
        xAxisLabel.textContent = 'Performance Scale (%)';
        svg.appendChild(xAxisLabel);

        // Add chart title
        const chartTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        chartTitle.setAttribute('x', width / 2);
        chartTitle.setAttribute('y', 20);
        chartTitle.setAttribute('text-anchor', 'middle');
        chartTitle.setAttribute('font-size', '14');
        chartTitle.setAttribute('fill', '#f8fafc');
        chartTitle.setAttribute('font-weight', '600');
        chartTitle.textContent = 'Platform Performance Metrics';
        svg.appendChild(chartTitle);

        // Add overall status indicator
        const overallStatus = calculateOverallStatus(performanceData);
        const statusIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        statusIndicator.setAttribute('cx', width - 30);
        statusIndicator.setAttribute('cy', 25);
        statusIndicator.setAttribute('r', '6');
        statusIndicator.setAttribute('fill', overallStatus.color);
        svg.appendChild(statusIndicator);

        const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        statusText.setAttribute('x', width - 40);
        statusText.setAttribute('y', 40);
        statusText.setAttribute('text-anchor', 'end');
        statusText.setAttribute('font-size', '10');
        statusText.setAttribute('fill', overallStatus.color);
        statusText.setAttribute('font-weight', '600');
        statusText.textContent = overallStatus.text;
        svg.appendChild(statusText);

    }, [data, timeRange]);

    // Helper function to determine performance status
    const getPerformanceStatus = (value, max, label) => {
        const percentage = (value / max) * 100;
        
        if (label === 'Response Time') {
            // Lower is better for response time
            if (value <= 4) return 'Optimal';
            if (value <= 6) return 'Acceptable';
            return 'Needs Attention';
        }
        
        if (label === 'Error Rate') {
            // Lower is better for error rate
            if (value <= 1) return 'Excellent';
            if (value <= 2.5) return 'Good';
            return 'Needs Improvement';
        }
        
        // Higher is better for other metrics
        if (percentage >= 90) return 'Excellent';
        if (percentage >= 80) return 'Good';
        if (percentage >= 70) return 'Fair';
        return 'Poor';
    };

    // Helper function to calculate overall platform status
    const calculateOverallStatus = (metrics) => {
        const criticalMetrics = metrics.filter(metric => 
            ['Response Time', 'Success Rate', 'Uptime'].includes(metric.label)
        );
        
        const poorMetrics = criticalMetrics.filter(metric => 
            getPerformanceStatus(metric.value, metric.max, metric.label) === 'Poor' || 
            getPerformanceStatus(metric.value, metric.max, metric.label) === 'Needs Attention'
        );
        
        const fairMetrics = criticalMetrics.filter(metric => 
            getPerformanceStatus(metric.value, metric.max, metric.label) === 'Fair' || 
            getPerformanceStatus(metric.value, metric.max, metric.label) === 'Needs Improvement'
        );

        if (poorMetrics.length > 0) {
            return { color: '#ef4444', text: 'CRITICAL' };
        } else if (fairMetrics.length > 0) {
            return { color: '#f59e0b', text: 'STABLE' };
        } else {
            return { color: '#10b981', text: 'HEALTHY' };
        }
    };

    return (
        <>
            <div className="chart-wrapper-enhanced">
                <svg ref={chartRef} className="advanced-chart performance-chart"></svg>
            </div>
            {tooltip.visible && tooltip.data && (
                <div 
                    className="chart-tooltip-enhanced"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
                >
                    <div className="tooltip-header">{tooltip.data.label}</div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Current Value:</span>
                        <span className="tooltip-value" style={{color: tooltip.data.color}}>
                            {tooltip.data.value}{tooltip.data.unit}
                        </span>
                    </div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Maximum:</span>
                        <span className="tooltip-value">{tooltip.data.max}{tooltip.data.unit}</span>
                    </div>
                    <div className="tooltip-item">
                        <span className="tooltip-label">Status:</span>
                        <span className={`tooltip-value ${
                            tooltip.data.status === 'Excellent' || tooltip.data.status === 'Optimal' ? 'success' :
                            tooltip.data.status === 'Good' || tooltip.data.status === 'Acceptable' ? 'warning' : 'danger'
                        }`}>
                            {tooltip.data.status}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};

// Real-time Performance Metrics Component
const RealTimePerformanceMetrics = ({ data }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatUptime = (uptime) => {
        if (!uptime) return '99.9%';
        return `${uptime}%`;
    };

    const getStatusColor = (value, type) => {
        switch (type) {
            case 'responseTime':
                return value <= 4 ? '#10b981' : value <= 6 ? '#f59e0b' : '#ef4444';
            case 'successRate':
                return value > 95 ? '#10b981' : value > 85 ? '#f59e0b' : '#ef4444';
            case 'uptime':
                return value >= 99.9 ? '#10b981' : value >= 99.5 ? '#f59e0b' : '#ef4444';
            case 'cpu':
                return value <= 60 ? '#10b981' : value <= 80 ? '#f59e0b' : '#ef4444';
            case 'memory':
                return value <= 70 ? '#10b981' : value <= 85 ? '#f59e0b' : '#ef4444';
            default:
                return '#6b7280';
        }
    };

    return (
        <div className="performance-metrics-grid">
            <div className="metric-card realtime">
                <div className="metric-header">
                    <span className="metric-title">Response Time</span>
                    <span className="metric-time">{currentTime.toLocaleTimeString()}</span>
                </div>
                <div className="metric-value" style={{color: getStatusColor(data?.avgResponseTime, 'responseTime')}}>
                    {data?.avgResponseTime || 2.1} hours
                </div>
                <div className="metric-trend">
                    <span className="trend-indicator">↗</span>
                    <span>From 2.3h last hour</span>
                </div>
            </div>

            <div className="metric-card realtime">
                <div className="metric-header">
                    <span className="metric-title">Success Rate</span>
                    <span className="metric-time">Live</span>
                </div>
                <div className="metric-value" style={{color: getStatusColor(data?.successRate, 'successRate')}}>
                    {data?.successRate || 98.5}%
                </div>
                <div className="metric-trend">
                    <span className="trend-indicator">→</span>
                    <span>Stable</span>
                </div>
            </div>

            <div className="metric-card realtime">
                <div className="metric-header">
                    <span className="metric-title">Uptime</span>
                    <span className="metric-time">30 days</span>
                </div>
                <div className="metric-value" style={{color: getStatusColor(data?.uptime, 'uptime')}}>
                    {formatUptime(data?.uptime)}
                </div>
                <div className="metric-trend">
                    <span className="trend-indicator">✓</span>
                    <span>No downtime</span>
                </div>
            </div>

            <div className="metric-card realtime">
                <div className="metric-header">
                    <span className="metric-title">Active Users</span>
                    <span className="metric-time">Now</span>
                </div>
                <div className="metric-value" style={{color: '#3b82f6'}}>
                    {data?.activeUsers || 0}
                </div>
                <div className="metric-trend">
                    <span className="trend-indicator">↗</span>
                    <span>Peak hours</span>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;