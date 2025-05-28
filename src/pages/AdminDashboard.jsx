import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  FaTachometerAlt,
  FaUsers, 
  FaUserShield, 
  FaChartLine, 
  FaFileAlt, 
  FaClipboardList,
  FaBell,
  FaUserPlus,
  FaUserMinus,
  FaUserEdit,
  FaCheck,
  FaTimes,
  FaSearch,
  FaAngleLeft,
  FaAngleRight
} from 'react-icons/fa';
import { AuthContext } from '../AuthContext';
import { 
  getPlatformStats, 
  getAdminUsers, 
  updateUserRole, 
  toggleUserStatus, 
  broadcastNotification 
} from '../api';
import DashboardNav from '../components/DashboardNav';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [usersFilter, setUsersFilter] = useState({
    role: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    targetRole: 'all'
  });
  const [notificationSent, setNotificationSent] = useState(false);  const [editingUser, setEditingUser] = useState(null);
  
  // Redirect if not admin
  if (user && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getPlatformStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      setError('Failed to load platform statistics');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {
        page: usersPagination.page,
        limit: usersPagination.limit,
        role: usersFilter.role === 'all' ? undefined : usersFilter.role,
        search: usersFilter.search || undefined,
        sortBy: usersFilter.sortBy,
        sortOrder: usersFilter.sortOrder
      };
      
      const response = await getAdminUsers(params);
      setUsers(response.data.users);
      setUsersPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const response = await updateUserRole(userId, newRole);
      setUsers(users.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
      ));
      setEditingUser(null);
      // Show success message
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };
  
  const handleToggleUserStatus = async (userId, newStatus) => {
    try {
      const response = await toggleUserStatus(userId, newStatus);
      setUsers(users.map(u => 
        u._id === userId ? { ...u, active: newStatus } : u
      ));
      // Show success message
      alert(`User account ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };
  
  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await broadcastNotification(notification);
      setNotificationSent(true);
      setNotification({
        title: '',
        message: '',
        targetRole: 'all'
      });
      setTimeout(() => setNotificationSent(false), 5000);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchUsers = (e) => {
    e.preventDefault();
    setUsersPagination({
      ...usersPagination,
      page: 1 // Reset to first page on new search
    });
  };
  
  const renderDashboardTab = () => {
    if (isLoading) {
      return <div className="loading">Loading dashboard data...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!stats) {
      return null;
    }
    
    return (
      <div className="admin-dashboard-stats">
        <h2>Platform Overview</h2>
        
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-card-header">
              <h3>Users</h3>
              <FaUsers className="stats-icon" />
            </div>
            <div className="stats-numbers">
              <div className="stat-item">
                <span className="stat-value">{stats.users.total}</span>
                <span className="stat-label">Total Users</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.users.researchers}</span>
                <span className="stat-label">Researchers</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.users.participants}</span>
                <span className="stat-label">Participants</span>
              </div>
            </div>
            <div className="stats-highlight">
              <FaUserPlus /> <span>{stats.users.newLastWeek} new users this week</span>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-card-header">
              <h3>Research Papers</h3>
              <FaFileAlt className="stats-icon" />
            </div>
            <div className="stats-numbers">
              <div className="stat-item wider">
                <span className="stat-value">{stats.projects.total}</span>
                <span className="stat-label">Total Papers</span>
              </div>
              <div className="stat-item wider">
                <span className="stat-value">{stats.projects.newLastWeek}</span>
                <span className="stat-label">New This Week</span>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-card-header">
              <h3>Surveys</h3>
              <FaClipboardList className="stats-icon" />
            </div>
            <div className="stats-numbers">
              <div className="stat-item">
                <span className="stat-value">{stats.surveys.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.surveys.active}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.surveys.totalResponses}</span>
                <span className="stat-label">Responses</span>
              </div>
            </div>
            <div className="stats-highlight">
              <FaChartLine /> <span>{stats.surveys.newLastWeek} new surveys this week</span>
            </div>
          </div>
        </div>
        
        <div className="admin-section">
          <h2>Send System Notification</h2>
          <div className="notification-form-container">
            <form onSubmit={handleSendNotification} className="notification-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={notification.title}
                  onChange={(e) => setNotification({...notification, title: e.target.value})}
                  required
                  placeholder="Notification title"
                />
              </div>
              
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={notification.message}
                  onChange={(e) => setNotification({...notification, message: e.target.value})}
                  required
                  placeholder="Notification message"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Target Users</label>
                <select 
                  value={notification.targetRole}
                  onChange={(e) => setNotification({...notification, targetRole: e.target.value})}
                >
                  <option value="all">All Users</option>
                  <option value="researcher">Researchers Only</option>
                  <option value="user">Participants Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="notification-send-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Notification'}
              </button>
              
              {notificationSent && (
                <div className="notification-success">
                  <FaCheck /> Notification sent successfully!
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  };
  
  const renderUsersTab = () => {
    return (
      <div className="admin-users">
        <h2>User Management</h2>
        
        <div className="users-controls">
          <form onSubmit={handleSearchUsers} className="users-search">
            <div className="search-input-group">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name or email"
                value={usersFilter.search}
                onChange={(e) => setUsersFilter({...usersFilter, search: e.target.value})}
              />
            </div>
            <button type="submit" className="search-btn">Search</button>
          </form>
          
          <div className="users-filters">
            <div className="filter-group">
              <label>Filter by Role:</label>
              <select 
                value={usersFilter.role}
                onChange={(e) => {
                  setUsersFilter({...usersFilter, role: e.target.value});
                  setUsersPagination({...usersPagination, page: 1});
                }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="researcher">Researcher</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading">Loading users...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : users.length === 0 ? (
          <div className="empty-list">No users found matching your criteria</div>
        ) : (
          <>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>
                        {editingUser === user._id ? (
                          <select 
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                            className="role-select"
                          >
                            <option value="admin">Admin</option>
                            <option value="researcher">Researcher</option>
                            <option value="user">User</option>
                          </select>
                        ) : (
                          <span className={`role-badge ${user.role}`}>{user.role}</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="user-actions">
                          {editingUser === user._id ? (
                            <button 
                              onClick={() => setEditingUser(null)} 
                              className="cancel-btn"
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button 
                              onClick={() => setEditingUser(user._id)} 
                              className="edit-btn"
                              title="Edit role"
                            >
                              <FaUserEdit />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleToggleUserStatus(user._id, !user.active)}
                            className={user.active ? 'deactivate-btn' : 'activate-btn'}
                            title={user.active ? 'Deactivate account' : 'Activate account'}
                          >
                            {user.active ? <FaUserMinus /> : <FaUserPlus />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {usersPagination.pages > 1 && (
              <div className="admin-pagination">
                <button
                  disabled={usersPagination.page === 1}
                  onClick={() => setUsersPagination({...usersPagination, page: usersPagination.page - 1})}
                  className="pagination-btn"
                >
                  <FaAngleLeft /> Previous
                </button>
                
                <span className="pagination-info">
                  Page {usersPagination.page} of {usersPagination.pages}
                </span>
                
                <button
                  disabled={usersPagination.page === usersPagination.pages}
                  onClick={() => setUsersPagination({...usersPagination, page: usersPagination.page + 1})}
                  className="pagination-btn"
                >
                  Next <FaAngleRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  const renderContentTab = () => {
    return (
      <div className="admin-content">
        <h2>Content Management</h2>
        <div className="coming-soon">
          <p>Advanced content management features coming soon!</p>
          <p>This section will allow administrators to moderate research papers and surveys.</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="admin-dashboard-container">
      <DashboardNav />
      <div className="admin-dashboard-content">
        <h1>Admin Dashboard</h1>
        
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaTachometerAlt /> Overview
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> Users
          </button>
          <button 
            className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <FaFileAlt /> Content
          </button>
        </div>
        
        <div className="admin-tab-content">
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'content' && renderContentTab()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
