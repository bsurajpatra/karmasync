import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getTasks, createTask } from '../api/taskApi';
import { getProjectById, addCollaborator, removeCollaborator, updateCollaboratorRole } from '../api/projectApi';
import { getSprintsByProject } from '../api/sprintApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/TaskList.css';
import '../styles/ProjectOverview.css';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

const TaskList = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  // Issue Modal State
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [issueFormData, setIssueFormData] = useState({
    title: '',
    description: '',
    type: 'tech',
    status: 'todo',
    deadline: '',
    customType: '',
    assignee: '',
    sprintId: ''
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [sprints, setSprints] = useState([]);

  // Collaborator Modal State
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removingCollaborator, setRemovingCollaborator] = useState(null);
  const [showSelfRemoveModal, setShowSelfRemoveModal] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const data = await getProjectById(projectId);
      setProject(data);
      const sprintsData = await getSprintsByProject(projectId);
      setSprints(sprintsData);
    } catch (err) {
      console.error('Error fetching project:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await getTasks(projectId);
      setTasks(data);
      setError('');
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setErrorMessage('Failed to load tasks');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Search Logic
  const debouncedSearch = useCallback(
    async (term) => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/search`, {
          params: { searchTerm: term },
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const filteredResults = response.data.filter(u =>
          !project.collaborators.some(collab => collab.userId._id === u._id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearchLoading(false);
      }
    },
    [project]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) debouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleAddCollaborator = (u) => {
    setSelectedUser(u);
    setIsUpdatingRole(false);
    setShowRoleModal(true);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleRoleSelect = async (role) => {
    if (!selectedUser) return;
    try {
      setIsAddingCollaborator(true);
      if (isUpdatingRole) {
        await updateCollaboratorRole(projectId, selectedUser._id, role);
      } else {
        await addCollaborator(projectId, { userId: selectedUser._id, role });
      }
      await fetchProject();
      setShowRoleModal(false);
      setShowAddCollaborator(false);
      setSelectedUser(null);
      setIsUpdatingRole(false);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to add collaborator');
      setShowErrorModal(true);
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!removingCollaborator) return;
    try {
      await removeCollaborator(projectId, removingCollaborator.userId._id);
      setShowRemoveModal(false);
      setShowAddCollaborator(false);
      setRemovingCollaborator(null);
      await fetchProject();
    } catch (error) {
      setErrorMessage('Failed to remove collaborator');
      setShowErrorModal(true);
    }
  };

  // Issue Form Logic
  const handleIssueFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type') {
      if (value === 'custom') {
        setShowCustomType(true);
        setIssueFormData(prev => ({ ...prev, [name]: prev.customType || '' }));
      } else {
        setShowCustomType(false);
        setIssueFormData(prev => ({ ...prev, [name]: value, customType: '' }));
      }
    } else if (name === 'customType') {
      const validatedValue = value.replace(/[^a-zA-Z0-9-_]/g, '');
      setIssueFormData(prev => ({ ...prev, type: validatedValue, customType: validatedValue }));
    } else if (name === 'assignee') {
      setIssueFormData(prev => ({ ...prev, assignee: value || null }));
    } else if (name === 'sprintId') {
      setIssueFormData(prev => ({ ...prev, sprintId: value || null }));
    } else {
      setIssueFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIssueFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...issueFormData,
        projectId: projectId,
        assignee: issueFormData.assignee || null
      };

      await createTask(taskData);
      const updatedTasks = await getTasks(projectId);
      setTasks(updatedTasks);

      setShowAddIssueModal(false);
      setShowCustomType(false);
      setIssueFormData({
        title: '',
        description: '',
        type: 'tech',
        status: 'todo',
        deadline: '',
        customType: '',
        assignee: '',
        sprintId: ''
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create issue');
      setShowErrorModal(true);
    }
  };

  const handleModalClose = () => {
    setShowAddIssueModal(false);
    setShowCustomType(false);
    setIssueFormData({
      title: '',
      description: '',
      type: 'tech',
      status: 'todo',
      deadline: '',
      customType: '',
      assignee: '',
      sprintId: ''
    });
  };

  const handleAddIssueClick = () => {
    if (project?.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can add issues');
      setShowErrorModal(true);
      return;
    }
    setShowAddIssueModal(true);
  };

  const ErrorModal = () => (
    <div className="modal-overlay">
      <div className="modal-content error-modal">
        <div className="modal-header">
          <h2>Notice</h2>
          <button className="modal-close" onClick={() => setShowErrorModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <p className="error-message">{errorMessage}</p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowErrorModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );

  const SelfRemoveModal = () => (
    <div className="settings-dialog-overlay z-top">
      <div className="settings-dialog-content">
        <div className="settings-dialog-header">
          <h2>Cannot Remove Yourself</h2>
          <button className="settings-dialog-close" onClick={() => setShowSelfRemoveModal(false)}>×</button>
        </div>
        <div className="settings-dialog-body">
          <p>You cannot remove yourself from the project. Please use 'Leave Project' instead.</p>
        </div>
        <div className="settings-dialog-actions">
          <button className="btn btn-secondary" onClick={() => setShowSelfRemoveModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingAnimation message="Loading your tasks..." />;
  if (!project) return <div className="error-message">Project not found</div>;

  return (
    <div className="projects-wrapper">
      {showErrorModal && <ErrorModal />}
      {showSelfRemoveModal && <SelfRemoveModal />}

      <header className="po-header">
        <div className="po-header-content">
          <Link to="/dashboard" className="po-logo-container">
            <img src="/logo.png" alt="KarmaSync" className="po-logo" />
          </Link>
          <div className="po-divider"></div>
          <div className="po-titles">
            <span className="po-page-label">Project Issues</span>
            <div className="po-project-title-wrapper">
              <h1 className="po-project-name">{project.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="projects-body">
        <div className="projects-sidebar">
          <nav className="sidebar-nav">
            <button className="sidebar-link" onClick={() => navigate(`/project/${projectId}/overview`)}>
              <i className="fas fa-home"></i>
              <span>Overview</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${projectId}/kanban`)}>
              <i className="fas fa-columns"></i>
              <span>Kanban Board</span>
            </button>
            <button className="sidebar-link active" onClick={() => navigate(`/project/${projectId}/tasks`)}>
              <i className="fas fa-list-ul"></i>
              <span>View Issues</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${projectId}/overview?view=sprints`)}>
              <i className="fas fa-running"></i>
              <span>Sprints</span>
            </button>
            {project.projectType === 'collaborative' && (
              <button
                className="sidebar-link"
                onClick={() => {
                  if (project.currentUserRole !== 'manager') {
                    setErrorMessage('Only Project Managers can manage collaborators');
                    setShowErrorModal(true);
                    return;
                  }
                  setShowAddCollaborator(true);
                  setSelectedUser(null);
                }}
              >
                <i className="fas fa-users-cog"></i>
                <span>Manage Collaborators</span>
              </button>
            )}
            <button className="sidebar-link" onClick={() => navigate(`/project/${projectId}/overview?view=settings`)}>
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </button>
            <div className="sidebar-divider"></div>
            <button className="sidebar-link" onClick={() => navigate('/projects')}>
              <i className="fas fa-arrow-left"></i>
              <span>Back to Projects</span>
            </button>
          </nav>
        </div>

        <div className="project-overview-container">
          <div className="tasks-list-content">
            {(() => {
              const urlParams = new URLSearchParams(window.location.search);
              const sprintFilter = urlParams.get('sprint');
              const activeSprint = sprints.find(s => s._id === sprintFilter);

              return (
                <div className="tasks-header" style={{ marginBottom: activeSprint ? '0.5rem' : '1.5rem' }}>
                  <div className="tasks-header-left">
                    <h2>Project Issues</h2>
                    <div className="sprint-search-wrapper">
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="Search issues..."
                        value={taskSearchTerm}
                        onChange={(e) => setTaskSearchTerm(e.target.value)}
                        className="sprint-search-input"
                      />
                    </div>
                  </div>
                  <div className="tasks-header-actions">
                    <button className="btn btn-primary" onClick={handleAddIssueClick}>
                      <i className="fas fa-plus"></i> Add Issue
                    </button>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const urlParams = new URLSearchParams(window.location.search);
              const sprintFilter = urlParams.get('sprint');
              const activeSprint = sprints.find(s => s._id === sprintFilter);

              if (activeSprint) {
                return (
                  <div className="active-filter-banner" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#ebf8ff',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    marginBottom: '1.5rem',
                    border: '1px solid #bee3f8',
                    fontSize: '0.9rem',
                    color: '#2b6cb0'
                  }}>
                    <i className="fas fa-filter"></i>
                    <span>Showing issues for sprint: <strong>{activeSprint.name}</strong></span>
                    <button
                      onClick={() => navigate(`/project/${projectId}/tasks`)}
                      style={{
                        marginLeft: 'auto',
                        background: '#3182ce',
                        color: 'white',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className="fas fa-times"></i> Clear Filter
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {(() => {
              const urlParams = new URLSearchParams(window.location.search);
              const sprintFilter = urlParams.get('sprint');

              const filteredTasks = tasks.filter(task => {
                const matchesSearch =
                  task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                  task.serialNumber.toString().includes(taskSearchTerm) ||
                  (task.description && task.description.toLowerCase().includes(taskSearchTerm.toLowerCase()));

                const matchesSprint = !sprintFilter || (task.sprintId && (task.sprintId._id === sprintFilter || task.sprintId === sprintFilter));

                return matchesSearch && matchesSprint;
              });

              if (filteredTasks.length === 0) {
                return (
                  <div className="no-tasks">
                    <p>{taskSearchTerm || sprintFilter ? 'No issues match your filters' : 'No issues found'}</p>
                    <strong>{(!taskSearchTerm && !sprintFilter) ? 'Create your first issue to get started!' : 'Try adjusting your search.'}</strong>
                  </div>
                );
              }

              return (
                <div className="tasks-container-compact">
                  {filteredTasks.map(task => {
                    const isDelayed = task.deadline && task.sprintId && task.sprintId.endDate &&
                      new Date(task.deadline) > new Date(task.sprintId.endDate);
                    return (
                      <div
                        key={task._id}
                        className="task-row-compact"
                        onClick={() => navigate(`/task/${task._id}`)}
                      >
                        <div className="task-item-header">
                          <h3>
                            <span className="task-id">#{task.serialNumber}</span>
                            {task.title}
                          </h3>
                          <div className="task-badges">
                            <span className={`task-status ${task.status}`}>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                            {task.sprintId && (
                              <span className={`task-status ${task.sprintId.status}`}>
                                {task.sprintId.name}
                              </span>
                            )}
                            {isDelayed && (
                              <span className="task-status cancelled" title="Deadline exceeds sprint timeline">
                                <i className="fas fa-exclamation-triangle"></i> Delayed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="task-meta">
                          <span className="task-date-text">
                            Created: {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                          {task.deadline && (
                            <span className={`task-deadline-text ${isDelayed ? 'deadline-warning-text' : ''}`}>
                              Deadline: {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                          {project?.projectType === 'collaborative' && task.assignee && (
                            <span className="task-assignee">
                              Assigned to: {task.assignee.username || task.assignee.fullName || 'Unassigned'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          <Footer />
        </div>
      </div>

      {showAddIssueModal && (
        <div className="modal-overlay issue-modal-overlay">
          <div className="modal-content issue-modal issue-modal--tasks">
            <div className="modal-header issue-modal__header">
              <h2 className="issue-modal__title">Add New Issue</h2>
              <button className="modal-close issue-modal__close-btn" onClick={handleModalClose}>&times;</button>
            </div>
            <div className="modal-body issue-modal__body">
              <form onSubmit={handleIssueFormSubmit} className="issue-form issue-form--tasks">
                {/* Form Inputs similar to original */}
                <div className="form-row issue-form__row">
                  <div className="form-group issue-form__group">
                    <label htmlFor="title">Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={issueFormData.title}
                      onChange={handleIssueFormChange}
                      required
                      className="form-control issue-input issue-input--title"
                    />
                  </div>
                  <div className="form-group issue-form__group">
                    <label htmlFor="type">Type</label>
                    <select id="type" name="type" value={showCustomType ? 'custom' : issueFormData.type} onChange={handleIssueFormChange} className="form-control">
                      <option value="tech">Technical</option>
                      <option value="review">Review</option>
                      <option value="bug">Bug</option>
                      <option value="feature">Feature</option>
                      <option value="documentation">Documentation</option>
                      <option value="custom">Custom Type</option>
                    </select>
                  </div>
                </div>
                <div className="form-row issue-form__row">
                  <div className="form-group issue-form__group">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" name="description" value={issueFormData.description} onChange={handleIssueFormChange} className="form-control" rows="2" />
                  </div>
                </div>
                <div className="form-row issue-form__row">
                  <div className="form-group issue-form__group">
                    <label htmlFor="status">Status</label>
                    <select id="status" name="status" value={issueFormData.status} onChange={handleIssueFormChange} className="form-control">
                      <option value="todo">To Do</option>
                      <option value="doing">Doing</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="deadline">Deadline</label>
                    <input type="date" id="deadline" name="deadline" value={issueFormData.deadline} onChange={handleIssueFormChange} className="form-control" />
                  </div>
                </div>
                <div className="form-row issue-form__row">
                  <div className="form-group issue-form__group">
                    <label htmlFor="sprintId">Sprint</label>
                    <select id="sprintId" name="sprintId" value={issueFormData.sprintId} onChange={handleIssueFormChange} className="form-control">
                      <option value="">No Sprint (Backlog)</option>
                      {sprints.map((s) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                      ))}
                    </select>
                  </div>
                </div>
                {project?.projectType === 'collaborative' && (
                  <div className="form-row issue-form__row">
                    <div className="form-group issue-form__group">
                      <label htmlFor="assignee">Assignee</label>
                      <select id="assignee" name="assignee" value={issueFormData.assignee} onChange={handleIssueFormChange} className="form-control">
                        <option value="">Select Assignee</option>
                        {project.collaborators.map((collab) => (
                          <option key={collab.userId._id} value={collab.userId._id}>{collab.userId.username}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {showCustomType && (
                  <div className="form-row issue-form__row">
                    <div className="form-group issue-form__group">
                      <label htmlFor="customType">Custom Type</label>
                      <input type="text" name="customType" value={issueFormData.customType} onChange={handleIssueFormChange} className="form-control" required />
                    </div>
                  </div>
                )}
                <div className="modal-actions issue-modal__actions">
                  <button type="submit" className="btn btn-primary issue-modal__primary-btn">Create Issue</button>
                  <button type="button" className="btn btn-secondary issue-modal__secondary-btn" onClick={handleModalClose}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddCollaborator && (
        <div className="settings-dialog-overlay">
          <div className="settings-dialog-content settings-dialog-wide">
            <div className="settings-dialog-header">
              <h3>Manage Collaborators</h3>
              <button
                className="settings-dialog-close"
                onClick={() => {
                  setShowAddCollaborator(false);
                  setSelectedUser(null);
                  setSearchTerm('');
                  setSearchResults([]);
                  setIsUpdatingRole(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="settings-dialog-body">
              <div className="collab-tabs">
                <button
                  className={`collab-tab ${!selectedUser ? 'active' : ''}`}
                  onClick={() => setSelectedUser(null)}
                >
                  <i className="fas fa-plus"></i> Add Collaborator
                </button>
                {project.collaborators.length > 0 && (
                  <button
                    className={`collab-tab ${selectedUser ? 'active' : ''}`}
                    onClick={() => setSelectedUser(project.collaborators[0]?.userId)}
                  >
                    <i className="fas fa-users-cog"></i> Manage Team
                  </button>
                )}
              </div>
              {selectedUser ? (
                <div className="collab-manage-wrapper">
                  <div className="collab-list">
                    {project.collaborators.map((collab) => (
                      <div key={collab.userId._id} className="collab-manage-item">
                        <div className="collab-user-info">
                          <span className="collab-name">{collab.userId.fullName || 'N/A'}</span>
                          <span className="collab-username">{collab.userId.username}</span>
                          <span className="collab-role {collab.role}">
                            {collab.role === 'manager' ? 'Project Manager' : 'Developer'}
                          </span>
                        </div>
                        <div className="collab-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              if (!user || !user._id) {
                                setErrorMessage('Please wait while we load your user information');
                                setShowErrorModal(true);
                                return;
                              }
                              if (project.currentUserRole !== 'manager') {
                                setErrorMessage('Only Project Managers can update roles');
                                setShowErrorModal(true);
                                return;
                              }
                              if (collab.userId._id === user._id) {
                                setErrorMessage('Self-role change is not allowed');
                                setShowErrorModal(true);
                                return;
                              }
                              setSelectedUser(collab.userId);
                              setIsUpdatingRole(true);
                              setShowRoleModal(true);
                            }}
                          >
                            <i className="fas fa-user-edit"></i> Update Role
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              const isCreator = project.createdBy && user && project.createdBy._id === user._id;
                              const isManager = project.currentUserRole === 'manager';
                              if (!isCreator && !isManager) {
                                setErrorMessage('Only Project Managers can remove collaborators');
                                setShowErrorModal(true);
                                return;
                              }
                              if (collab.userId._id === user._id) {
                                setShowSelfRemoveModal(true);
                                return;
                              }
                              setRemovingCollaborator(collab);
                              setShowRemoveModal(true);
                            }}
                          >
                            <i className="fas fa-user-minus"></i> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="collab-search-wrapper">
                  <input
                    type="text"
                    placeholder="Search users"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="collab-search-field"
                  />
                  {searchResults.length > 0 && (
                    <div className="collab-search-results">
                      {searchResults.map(u => (
                        <div
                          key={u._id}
                          className="collab-search-item"
                          onClick={() => handleAddCollaborator(u)}
                        >
                          <div className="collab-user-info">
                            <span className="collab-username">{u.username}</span>
                            <span className="collab-email">{u.email}</span>
                          </div>
                          <i className="fas fa-chevron-right"></i>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchTerm.length >= 2 && !searchLoading && searchResults.length === 0 && (
                    <div className="collab-no-results">No users found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="settings-dialog-overlay">
          <div className="settings-dialog-content">
            <div className="settings-dialog-header">
              <h2>Select Role for {selectedUser?.username}</h2>
              <button
                className="settings-dialog-close"
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setIsUpdatingRole(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="settings-dialog-body">
              {isAddingCollaborator ? (
                <LoadingAnimation message={isUpdatingRole ? 'Updating role...' : 'Adding...'} />
              ) : (
                <div className="role-options">
                  <button className="role-option manager" onClick={() => handleRoleSelect('manager')}>
                    <h4>Project Manager</h4><p>Full access</p>
                  </button>
                  <button className="role-option developer" onClick={() => handleRoleSelect('developer')}>
                    <h4>Developer</h4><p>Task execution</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && removingCollaborator && (
        <div className="settings-dialog-overlay z-top">
          <div className="settings-dialog-content">
            <div className="settings-dialog-header">
              <h2>Remove Collaborator</h2>
              <button className="settings-dialog-close" onClick={() => setShowRemoveModal(false)}>×</button>
            </div>
            <div className="settings-dialog-body">
              <p>Remove {removingCollaborator.userId.username}?</p>
            </div>
            <div className="settings-dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowRemoveModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleRemoveCollaborator}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;