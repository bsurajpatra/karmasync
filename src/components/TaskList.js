import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getTasks, createTask } from '../api/taskApi';
import { getProjectById, addCollaborator, removeCollaborator } from '../api/projectApi';
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
    assignee: ''
  });
  const [showCustomType, setShowCustomType] = useState(false);

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

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const data = await getProjectById(projectId);
      setProject(data);
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
    setShowRoleModal(true);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleRoleSelect = async (role) => {
    if (!selectedUser) return;
    try {
      setIsAddingCollaborator(true);
      await addCollaborator(projectId, { userId: selectedUser._id, role });
      await fetchProject();
      setShowRoleModal(false);
      setShowAddCollaborator(false);
      setSelectedUser(null);
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
        assignee: ''
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
      assignee: ''
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
            <span className="po-page-label">Project Tasks</span>
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
            <button className="sidebar-link active" onClick={() => { }}>
              <i className="fas fa-list-ul"></i>
              <span>View Issues</span>
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
            <div className="tasks-header">
              <div className="tasks-header-content">
                <h2>Project Issues</h2>
                <div className="tasks-header-actions">
                  <button className="btn btn-primary" onClick={handleAddIssueClick}>
                    <i className="fas fa-plus"></i> Add Issue
                  </button>
                </div>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="no-tasks">
                <p>No issues found</p>
                <strong>Create your first issue to get started!</strong>
              </div>
            ) : (
              <div className="tasks-container-compact">
                {tasks.map(task => (
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
                      </div>
                    </div>
                    <div className="task-meta">
                      <span className="task-date-text">
                        Created: {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                      {task.deadline && (
                        <span className="task-deadline-text">
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
                ))}
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>

      {showAddIssueModal && (
        <div className="modal-overlay">
          <div className="modal-content issue-modal">
            <div className="modal-header">
              <h2>Add New Issue</h2>
              <button className="modal-close" onClick={handleModalClose}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleIssueFormSubmit} className="issue-form">
                {/* Form Inputs similar to original */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input type="text" id="title" name="title" value={issueFormData.title} onChange={handleIssueFormChange} required className="form-control" />
                  </div>
                  <div className="form-group">
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
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" name="description" value={issueFormData.description} onChange={handleIssueFormChange} className="form-control" rows="2" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
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
                {project?.projectType === 'collaborative' && (
                  <div className="form-row">
                    <div className="form-group">
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
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="customType">Custom Type</label>
                      <input type="text" name="customType" value={issueFormData.customType} onChange={handleIssueFormChange} className="form-control" required />
                    </div>
                  </div>
                )}
                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary">Create Issue</button>
                  <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Cancel</button>
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
              <button className="settings-dialog-close" onClick={() => { setShowAddCollaborator(false); setSelectedUser(null); setSearchTerm(''); setSearchResults([]); }}>×</button>
            </div>
            <div className="settings-dialog-body">
              <div className="collab-tabs">
                <button className={`collab-tab ${!selectedUser ? 'active' : ''}`} onClick={() => setSelectedUser(null)}>
                  <i className="fas fa-plus"></i> Add Collaborator
                </button>
                {project.collaborators.length > 0 && (
                  <button className={`collab-tab ${selectedUser ? 'active' : ''}`} onClick={() => setSelectedUser(project.collaborators[0]?.userId)}>
                    <i className="fas fa-user-cog"></i> Remove Collaborators
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
                          <span className="collab-role {collab.role}">{collab.role === 'manager' ? 'Project Manager' : 'Developer'}</span>
                        </div>
                        <div className="collab-actions">
                          <button className="btn btn-danger" onClick={() => {
                            if (project.currentUserRole !== 'manager') { setErrorMessage('Only Managers'); setShowErrorModal(true); return; }
                            if (collab.userId._id === user._id) { setShowSelfRemoveModal(true); return; }
                            setRemovingCollaborator(collab);
                            setShowRemoveModal(true);
                          }}>
                            <i className="fas fa-user-minus"></i> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="collab-search-wrapper">
                  <input type="text" placeholder="Search users" value={searchTerm} onChange={handleSearch} className="collab-search-field" />
                  {searchResults.length > 0 && (
                    <div className="collab-search-results">
                      {searchResults.map(u => (
                        <div key={u._id} className="collab-search-item" onClick={() => handleAddCollaborator(u)}>
                          <div className="collab-user-info"><span className="collab-username">{u.username}</span><span className="collab-email">{u.email}</span></div>
                          <i className="fas fa-chevron-right"></i>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchTerm.length >= 2 && !searchLoading && searchResults.length === 0 && <div className="collab-no-results">No users found</div>}
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
              <button className="settings-dialog-close" onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}>×</button>
            </div>
            <div className="settings-dialog-body">
              {isAddingCollaborator ? <LoadingAnimation message="Adding..." /> : (
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