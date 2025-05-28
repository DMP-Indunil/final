import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResearchProjectById, updateResearchProjectTimeline } from '../api';
import '../styles/TaskManager.css';

const TaskManager = ({ projectId, projectTitle }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(false);
  
  // Research project phases with durations in days
  const [phases, setPhases] = useState({
    projectPlanning: { 
      title: 'Project Planning', 
      duration: 14,  // default 14 days
      saved: false
    },
    researchPhase: { 
      title: 'Research Phase', 
      duration: 30,  // default 30 days
      saved: false
    },
    dataCollection: { 
      title: 'Data Collection', 
      duration: 45,  // default 45 days
      saved: false
    },
    analysisPhase: { 
      title: 'Analysis Phase', 
      duration: 30,  // default 30 days
      saved: false
    },
    finalReport: { 
      title: 'Final Report', 
      duration: 21,  // default 21 days
      saved: false
    }
  });
  
  const [projectTimeline, setProjectTimeline] = useState({
    totalDuration: 0,
    startDate: null,
    endDate: null,
    currentProgress: 0
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    } else {
      // Use current date as start date for new projects
      calculateTimeline(phases, new Date());
    }
  }, [projectId]);

  // Helper function to calculate phases based on project start and end dates
  const calculatePhasesFromDates = (startDate, endDate) => {
    // Calculate total duration in days
    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(totalDurationMs / (1000 * 60 * 60 * 24));
    
    // Default phase proportions (based on the original 140 days)
    // Planning: 14/140 = 10%, Research: 30/140 = 21.4%, Data Collection: 45/140 = 32.1%
    // Analysis: 30/140 = 21.4%, Final Report: 21/140 = 15%
    const phaseProportions = {
      projectPlanning: 0.10,    // 10%
      researchPhase: 0.214,     // 21.4%
      dataCollection: 0.321,    // 32.1%
      analysisPhase: 0.214,     // 21.4%
      finalReport: 0.151        // 15.1%
    };
    
    // Calculate phase durations based on proportions
    const calculatedPhases = {
      projectPlanning: {
        title: 'Project Planning',
        duration: Math.max(1, Math.round(totalDays * phaseProportions.projectPlanning)),
        saved: false
      },
      researchPhase: {
        title: 'Research Phase',
        duration: Math.max(1, Math.round(totalDays * phaseProportions.researchPhase)),
        saved: false
      },
      dataCollection: {
        title: 'Data Collection',
        duration: Math.max(1, Math.round(totalDays * phaseProportions.dataCollection)),
        saved: false
      },
      analysisPhase: {
        title: 'Analysis Phase',
        duration: Math.max(1, Math.round(totalDays * phaseProportions.analysisPhase)),
        saved: false
      },
      finalReport: {
        title: 'Final Report',
        duration: Math.max(1, Math.round(totalDays * phaseProportions.finalReport)),
        saved: false
      }
    };
    
    // Adjust durations to match exact total (handle rounding differences)
    const calculatedTotal = Object.values(calculatedPhases).reduce((sum, phase) => sum + phase.duration, 0);
    if (calculatedTotal !== totalDays) {    const difference = totalDays - calculatedTotal;
      // Add/subtract the difference to the largest phase (data collection)
      calculatedPhases.dataCollection.duration += difference;
      calculatedPhases.dataCollection.duration = Math.max(1, calculatedPhases.dataCollection.duration);
    }
    
    return calculatedPhases;
  };

  // Calculate the timeline based on phases
  const calculateTimeline = (currentPhases, startDate) => {
    // Calculate total duration
    const totalDays = Object.values(currentPhases).reduce(
      (total, phase) => total + phase.duration, 0
    );
    
    // Calculate end date by adding the total duration to start date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    
    // Calculate current progress percentage based on today's date
    // Using May 25, 2025 as the current date for consistent results
    const today = new Date(2025, 4, 25); // May 25, 2025
    let currentProgress = 0;
    
    if (today < startDate) {
      // Project hasn't started yet
      currentProgress = 0;
    } else if (today > endDate) {
      // Project should be complete
      currentProgress = 100;
    } else {
      // Project is in progress
      const totalDuration = endDate - startDate;
      const elapsed = today - startDate;
      currentProgress = Math.round((elapsed / totalDuration) * 100);
    }
    
    // Calculate each phase's timeline position
    let cumulativeDays = 0;
    const phaseTimeline = Object.entries(currentPhases).reduce((acc, [key, phase]) => {
      const phaseStart = new Date(startDate);
      phaseStart.setDate(phaseStart.getDate() + cumulativeDays);
      
      const phaseEnd = new Date(phaseStart);
      phaseEnd.setDate(phaseStart.getDate() + phase.duration);
      
      // Calculate phase progress
      let phaseProgress = 0;
      if (today < phaseStart) {
        phaseProgress = 0;
      } else if (today > phaseEnd) {
        phaseProgress = 100;
      } else {
        const phaseDuration = phaseEnd - phaseStart;
        const phaseElapsed = today - phaseStart;
        phaseProgress = Math.round((phaseElapsed / phaseDuration) * 100);
      }
      
      acc[key] = {
        ...phase,
        startDate: phaseStart,
        endDate: phaseEnd,
        progress: phaseProgress
      };
      
      cumulativeDays += phase.duration;
      return acc;
    }, {});
    
    setProjectTimeline({
      totalDuration: totalDays,
      startDate: startDate,
      endDate: endDate,
      currentProgress: currentProgress,
      phaseTimeline: phaseTimeline
    });
  };  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const response = await getResearchProjectById(projectId);
      const data = response.data;
      
      if (data) {
        // Use project start date or today if not set
        const projectStartDate = data.startDate ? new Date(data.startDate) : new Date();
        const projectEndDate = data.endDate ? new Date(data.endDate) : null;
          // If project has saved timeline data, use it
        if (data.timeline && data.timeline.phases) {
          setPhases(data.timeline.phases);
          calculateTimeline(data.timeline.phases, projectStartDate);
        } else if (projectStartDate && projectEndDate) {
          // Calculate timeline based on project start and end dates
          const calculatedPhases = calculatePhasesFromDates(projectStartDate, projectEndDate);
          setPhases(calculatedPhases);
          calculateTimeline(calculatedPhases, projectStartDate);
        } else {
          // Initialize with default phases
          calculateTimeline(phases, projectStartDate);
        }
      } else {
        console.warn('Project data not found or incomplete');
        setError('Error: Project data incomplete');
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Error fetching project data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDurationChange = (phaseKey, days) => {
    // Validate input
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum <= 0) {
      return;
    }
    
    const updatedPhases = {
      ...phases,
      [phaseKey]: {
        ...phases[phaseKey],
        duration: daysNum,
        saved: false
      }
    };
    
    setPhases(updatedPhases);
    calculateTimeline(updatedPhases, projectTimeline.startDate || new Date());
  };  const handleSaveTimeline = async () => {
    if (!projectId) {
      setError('Cannot save timeline: Project ID is missing');
      return;
    }
    
    try {
      setLoading(true);
      
      // Mark all phases as saved
      const savedPhases = Object.entries(phases).reduce((acc, [key, phase]) => {
        acc[key] = { ...phase, saved: true };
        return acc;
      }, {});
      
      // Include phase timeline data if available
      const phaseTimeline = projectTimeline.phaseTimeline || {};
      
      const timelineData = {
        phases: savedPhases,
        totalDuration: projectTimeline.totalDuration,
        startDate: projectTimeline.startDate,
        endDate: projectTimeline.endDate,
        phaseTimeline: phaseTimeline
      };
        // Make the API call to update the timeline
      const response = await updateResearchProjectTimeline(projectId, timelineData);
      
      setPhases(savedPhases);
      setUpdated(true);
      setTimeout(() => setUpdated(false), 3000);
    } catch (err) {
      console.error('Error saving timeline data:', err);
      setError('Error saving timeline data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  return (
    <div className="task-manager">
      <h2>Research Timeline for {projectTitle}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {updated && <div className="success-message">Timeline updated successfully!</div>}
      
      <div className="timeline-summary">
        <div className="summary-card">
          <h3>Project Timeline Overview</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="label">Total Duration:</span>
              <span className="value">{projectTimeline.totalDuration} days</span>
            </div>
            <div className="stat">
              <span className="label">Start Date:</span>
              <span className="value">{formatDate(projectTimeline.startDate)}</span>
            </div>
            <div className="stat">
              <span className="label">Expected End Date:</span>
              <span className="value">{formatDate(projectTimeline.endDate)}</span>
            </div>
          </div>
            <div className="progress-overview">
            <h4>Current Progress: {projectTimeline.currentProgress}%</h4>
            <div className="progress-container">
              <div className="progress-bar">                <div 
                  className="progress-fill" 
                  style={{ width: `${projectTimeline.currentProgress}%` }}
                ></div>
                
                {/* Current date marker */}
                <div 
                  className="current-date-marker" 
                  title="Today: May 25, 2025"
                  style={{ "--current-progress": `${projectTimeline.currentProgress}%` }}
                >
                  <div className="marker-line"></div>
                  <div className="marker-dot"></div>
                </div>
              </div>
              
              <div className="progress-labels">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="timeline-dates">
              <div className="timeline-date start">
                <span className="date-label">Start:</span>
                <span className="date-value">{formatDate(projectTimeline.startDate)}</span>
              </div>
              <div className="current-date-indicator">
                <span>Today: May 25, 2025</span>
              </div>
              <div className="timeline-date end">
                <span className="date-label">End:</span>
                <span className="date-value">{formatDate(projectTimeline.endDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
        <div className="phases-editor">
        <h3>Research Phases Duration</h3>
        <p className="helper-text">
          Set the expected duration in days for each research phase. 
          The system will calculate the overall timeline and track progress automatically.
        </p>
          <div className="phases-grid">
          {Object.entries(phases).map(([key, phase]) => {
            // Calculate the proportion of the entire project timeline this phase represents
            const phaseProportion = Math.round((phase.duration / projectTimeline.totalDuration) * 100);
            
            // Get phase timeline data if available
            const phaseTimelineData = projectTimeline.phaseTimeline && projectTimeline.phaseTimeline[key];
            const phaseStartDate = phaseTimelineData?.startDate;
            const phaseEndDate = phaseTimelineData?.endDate;
            const phaseProgress = phaseTimelineData?.progress || 0;
            
            return (
              <div key={key} className="phase-card">
                <div className="phase-header">
                  <h4>{phase.title}</h4>
                  <div className="phase-proportion">{phaseProportion}% of project</div>
                </div>
                
                {phaseTimelineData && (
                  <div className="phase-dates">
                    <div className="date-range">
                      <span>{formatDate(phaseStartDate)} - {formatDate(phaseEndDate)}</span>
                    </div>
                    <div className="phase-progress">
                      <div className="progress-label">Progress: {phaseProgress}%</div>
                      <div className="phase-progress-indicator">
                        <div 
                          className="phase-progress-indicator-fill" 
                          style={{ width: `${phaseProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="phase-progress-bar">
                  <div 
                    className="phase-progress-fill" 
                    style={{ width: `${phaseProportion}%` }}
                  ></div>
                </div>
                
                <div className="duration-input">
                  <label htmlFor={`duration-${key}`}>Duration (days):</label>
                  <input 
                    id={`duration-${key}`}
                    type="number" 
                    min="1"
                    value={phase.duration}
                    onChange={(e) => handleDurationChange(key, e.target.value)}
                  />
                </div>
                <div className="phase-status">
                  {phase.saved ? (
                    <span className="saved-indicator">✓ Saved</span>
                  ) : (
                    <span className="unsaved-indicator">Unsaved changes</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>          <div className="actions">
            <button 
              className="btn-primary save-timeline"
              onClick={handleSaveTimeline}
              disabled={loading}
            >
              {loading ? 'Saving Timeline...' : 'Save Project Timeline'}
            </button>
            
            <div className="save-note">
              <p>
                <strong>Note:</strong> Save your timeline to update the project's expected completion date and track progress across all research phases. Any changes to phase durations will update the overall project schedule.
              </p>
              {Object.values(phases).some(phase => !phase.saved) && (
                <p className="unsaved-warning">
                  <strong>Warning:</strong> You have unsaved changes to your research timeline.
                </p>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default TaskManager;
