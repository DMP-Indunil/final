import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResearchProjectById, updateResearchProject } from '../api';
import TaskManager from '../components/TaskManager';
import BudgetManager from '../components/BudgetManager';
import '../styles/ManageResearch.css';

const ManageResearch = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);  const [formData, setFormData] = useState({});

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getResearchProjectById(projectId);
      setProject(response.data);
      setFormData(response.data);
    } catch (err) {
      console.error('Error fetching project:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Research project not found');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch project details');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);
    // Reset to overview tab when project changes
  useEffect(() => {
    setActiveTab('overview');
  }, [projectId]);
  
  const handleTabChange = (tab) => {
    // If switching away from edit mode, prompt to save changes
    if (editMode && tab !== 'overview') {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to switch tabs?');
      if (confirmed) {
        setEditMode(false);
        setFormData(project); // Reset form data to current project
      } else {
        return;
      }    }
    setTabLoading(true);
    setActiveTab(tab);
    
    // Brief loading state for smoother transitions
    // Use a slightly longer timeout for the phases tab since it may need more time to render
    const timeout = tab === 'phases' ? 500 : 300;
    
    setTimeout(() => {
      setTabLoading(false);    }, timeout);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (index, value, field) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayField = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (index, field) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSave = async () => {
    try {
      setLoading(true);      const updateData = {
        ...formData,
        objectives: formData.objectives?.filter(obj => obj.trim() !== '') || [],
        keywords: formData.keywords?.filter(kw => kw.trim() !== '') || [],
        collaborators: formData.collaborators?.filter(collab => collab.trim() !== '') || []
      };
      
      await updateResearchProject(projectId, updateData);
      setProject(updateData);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return '#f59e0b';
      case 'active': return '#10b981';
      case 'on-hold': return '#ef4444';
      case 'completed': return '#6366f1';
      default: return '#6b7280';
    }
  };  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="manage-research-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-research-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/researcher-dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-research-page">
      <div className="manage-research-container">
        {/* Header */}
        <div className="project-header">
          <div className="header-content">
            <div className="project-info">
              <h1 className="project-title">{project.title}</h1>
              <p className="project-description">{project.description}</p>
            </div>
            <div className="header-actions">
              <div className="project-meta">
                <span 
                  className="project-status" 
                  style={{ backgroundColor: getStatusColor(project.status) }}
                >
                  {project.status || 'Planning'}
                </span>
              </div>
              <button 
                onClick={() => setEditMode(!editMode)}
                className="edit-btn"
                disabled={loading}
              >
                {editMode ? 'Cancel' : 'Edit Project'}
              </button>
              {editMode && (
                <button 
                  onClick={handleSave}
                  className="save-btn"
                  disabled={loading}
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>        {/* Tab Navigation */}        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'phases' ? 'active' : ''}`}
            onClick={() => handleTabChange('phases')}
          >
            Research Phases
          </button>
          <button 
            className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => handleTabChange('budget')}
          >
            Budget
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {tabLoading && (
            <div className="tab-loading-overlay">
              <div className="tab-loading-spinner"></div>
            </div>
          )}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {editMode ? (
                <div className="edit-form">
                  <div className="form-section">
                    <h3>Basic Information</h3>
                    
                    <div className="form-group">
                      <label>Project Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title || ''}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        className="form-input textarea"
                        rows="4"
                      />
                    </div>

                    <div className="form-group">
                      <label>Methodology</label>
                      <textarea
                        name="methodology"
                        value={formData.methodology || ''}
                        onChange={handleChange}
                        className="form-input textarea"
                        rows="3"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Start Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>End Date</label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>
                    </div>                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        value={formData.status || 'planning'}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Estimated Budget ($)</label>
                      <input
                        type="number"
                        name="estimatedBudget"
                        value={formData.estimatedBudget || ''}
                        onChange={handleChange}
                        className="form-input"
                        min="0"
                        step="0.01"
                        placeholder="Enter estimated budget"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Objectives</h3>
                    <div className="dynamic-list">
                      {(formData.objectives || []).map((objective, index) => (
                        <div key={index} className="dynamic-item">
                          <input
                            type="text"
                            placeholder={`Objective ${index + 1}`}
                            className="form-input"
                            value={objective}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'objectives')}
                          />
                          {(formData.objectives || []).length > 1 && (
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => removeArrayField(index, 'objectives')}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="add-btn"
                        onClick={() => addArrayField('objectives')}
                      >
                        + Add Objective
                      </button>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Keywords</h3>
                    <div className="dynamic-list">
                      {(formData.keywords || []).map((keyword, index) => (
                        <div key={index} className="dynamic-item">
                          <input
                            type="text"
                            placeholder={`Keyword ${index + 1}`}
                            className="form-input"
                            value={keyword}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'keywords')}
                          />
                          {(formData.keywords || []).length > 1 && (
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => removeArrayField(index, 'keywords')}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="add-btn"
                        onClick={() => addArrayField('keywords')}
                      >
                        + Add Keyword
                      </button>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Collaborators</h3>
                    <div className="dynamic-list">
                      {(formData.collaborators || []).map((collaborator, index) => (
                        <div key={index} className="dynamic-item">
                          <input
                            type="text"
                            placeholder={`Collaborator ${index + 1}`}
                            className="form-input"
                            value={collaborator}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'collaborators')}
                          />
                          {(formData.collaborators || []).length > 1 && (
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => removeArrayField(index, 'collaborators')}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="add-btn"
                        onClick={() => addArrayField('collaborators')}
                      >
                        + Add Collaborator
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overview-content">
                  <div className="info-section">
                    <h3>Project Details</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Research Field</label>
                        <span>{project.researchField || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Duration</label>
                        <span>{project.expectedDuration || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Start Date</label>
                        <span>{formatDate(project.startDate)}</span>
                      </div>                      <div className="info-item">
                        <label>End Date</label>
                        <span>{formatDate(project.endDate)}</span>                      </div>
                      <div className="info-item">
                        <label>Estimated Budget</label>
                        <span>{project.estimatedBudget ? `$${project.estimatedBudget.toLocaleString()}` : 'Not set'}</span>
                      </div>
                      <div className="info-item">
                        <label>Created</label>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {project.methodology && (
                    <div className="info-section">
                      <h3>Methodology</h3>
                      <p>{project.methodology}</p>
                    </div>
                  )}

                  {project.objectives && project.objectives.length > 0 && (
                    <div className="info-section">
                      <h3>Objectives</h3>
                      <ul className="list">
                        {project.objectives.map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {project.keywords && project.keywords.length > 0 && (
                    <div className="info-section">
                      <h3>Keywords</h3>
                      <div className="keyword-tags">
                        {project.keywords.map((keyword, index) => (
                          <span key={index} className="keyword-tag">{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.collaborators && project.collaborators.length > 0 && (
                    <div className="info-section">
                      <h3>Collaborators</h3>
                      <ul className="list">
                        {project.collaborators.map((collaborator, index) => (
                          <li key={index}>{collaborator}</li>
                        ))}
                      </ul>
                    </div>
                  )}                </div>
              )}
            </div>
          )}          {activeTab === 'phases' && (
            <div className="phases-tab">
              <TaskManager projectId={projectId} projectTitle={project.title} />
            </div>
          )}
          {activeTab === 'budget' && (
            <div className="budget-tab">
              <BudgetManager 
                projectId={projectId} 
                estimatedBudget={project.estimatedBudget || 0} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageResearch;
