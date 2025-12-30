import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getProjectById, updateProject, deleteProject, removeCollaborator, addCollaborator, leaveProject, updateCollaboratorRole } from '../api/projectApi';
import { getTasks, createTask } from '../api/taskApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import LoadingAnimation from './LoadingAnimation';
import '../styles/ProjectOverview.css';
import '../styles/ProjectSettings.css';
import '../styles/Dashboard.css';
import Footer from './Footer';
import { searchUsers } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ROLE_TYPES = {
  MANAGER: 'manager',
  DEVELOPER: 'developer'
};



const ProjectOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingGithub, setEditingGithub] = useState(false);
  const [githubLink, setGithubLink] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [boardStats, setBoardStats] = useState([]);
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
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
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useAuth();
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removingCollaborator, setRemovingCollaborator] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSelfRemoveModal, setShowSelfRemoveModal] = useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // 'overview' or 'settings'

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const action = searchParams.get('action');
    const view = searchParams.get('view');

    if (view === 'settings') {
      setActiveView('settings');
    } else if (view === 'overview') {
      setActiveView('overview');
    }

    if (action === 'manageCollaborators') {
      // Ensure user is manager before showing
      if (project && project.currentUserRole === 'manager') {
        setShowAddCollaborator(true);
      } else if (project) {
        // If project is loaded but user is not manager, we wait or show error? 
        // Better to check inside the modal or rely on project load.
        // Since project might be null initially, we should add this check in a separate useEffect depending on [project, location.search]
      }
    }
  }, [location.search, project]);


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

  const fetchProject = useCallback(async () => {
    try {
      console.log('Fetching project details:', id);
      const data = await getProjectById(id);
      console.log('Project details:', data);
      setProject(data);
      setGithubLink(data.githubLink || '');
      setTitle(data.title || '');
      setDescription(data.description || '');
      setError('');
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.message || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTaskCount = useCallback(async () => {
    try {
      console.log('Fetching tasks for project:', id);
      const tasksData = await getTasks(id);
      console.log('Tasks received:', tasksData);
      setTasks(tasksData);
      setTaskCount(tasksData.length);

      const boardCounts = {
        todo: { name: 'To Do', value: 0 },
        doing: { name: 'Doing', value: 0 },
        done: { name: 'Done', value: 0 }
      };

      tasksData.forEach(task => {
        if (boardCounts[task.status]) {
          boardCounts[task.status].value++;
        } else {
          boardCounts[task.status] = {
            name: task.status.charAt(0).toUpperCase() + task.status.slice(1),
            value: 1
          };
        }
      });

      const stats = Object.values(boardCounts).filter(board => board.value > 0);
      setBoardStats(stats);
    } catch (err) {
      console.error('Error fetching task count:', err);
    }
  }, [id]);

  const debouncedSearch = useCallback(
    async (term) => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        console.log('Searching for users with term:', term);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/search`, {
          params: {
            searchTerm: term
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const filteredResults = response.data.filter(user =>
          !project.collaborators.some(collab => collab.userId._id === user._id)
        );
        console.log('Filtered results:', filteredResults);
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        setError('Failed to search users');
      } finally {
        setSearchLoading(false);
      }
    },
    [project]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        debouncedSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleAddCollaborator = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleRoleSelect = async (role) => {
    if (!selectedUser) return;

    try {
      setIsAddingCollaborator(true);

      if (isUpdatingRole) {
        await updateCollaboratorRole(id, selectedUser._id, role);
      } else {
        const collaboratorData = {
          userId: selectedUser._id,
          role: role
        };
        await addCollaborator(id, collaboratorData);
      }

      await fetchProject();
      setShowRoleModal(false);
      setShowAddCollaborator(false);
      setSelectedUser(null);
      setIsUpdatingRole(false);
      setError('');
    } catch (error) {
      console.error('Error managing collaborator:', error);
      setError(error.message || 'Failed to manage collaborator');
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!removingCollaborator) return;

    try {
      const response = await removeCollaborator(id, removingCollaborator.userId._id);

      setProject(response.project);

      setShowRemoveModal(false);
      setShowAddCollaborator(false);
      setRemovingCollaborator(null);

      await fetchProject();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      setError('Failed to remove collaborator');
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTaskCount();
  }, [fetchProject, fetchTaskCount]);

  const handleGithubSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await updateProject(id, { githubLink });
      setProject(updatedProject);
      setEditingGithub(false);
      setError('');
    } catch (err) {
      console.error('Error updating GitHub link:', err);
      setError(err.message || 'Failed to update GitHub link');
    }
  };

  const handleTitleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await updateProject(id, { title });
      setProject(updatedProject);
      setEditingTitle(false);
      setError('');
    } catch (err) {
      console.error('Error updating title:', err);
      setError(err.message || 'Failed to update title');
    }
  };

  const handleDescriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await updateProject(id, { description });
      setProject(updatedProject);
      setEditingDescription(false);
      setError('');
    } catch (err) {
      console.error('Error updating description:', err);
      setError(err.message || 'Failed to update description');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project');
    }
  };

  const handleIssueFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      if (value === 'custom') {
        setShowCustomType(true);
        setIssueFormData(prev => ({
          ...prev,
          [name]: prev.customType || ''
        }));
      } else {
        setShowCustomType(false);
        setIssueFormData(prev => ({
          ...prev,
          [name]: value,
          customType: ''
        }));
      }
    } else if (name === 'customType') {
      const validatedValue = value.replace(/[^a-zA-Z0-9-_]/g, '');
      setIssueFormData(prev => ({
        ...prev,
        type: validatedValue,
        customType: validatedValue
      }));
    } else {
      setIssueFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleIssueFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...issueFormData,
        projectId: id
      };

      const newIssue = await createTask(taskData);

      setTasks(prev => [...prev, newIssue]);
      setTaskCount(prev => prev + 1);

      setBoardStats(prev => {
        const newStats = [...prev];
        const boardIndex = newStats.findIndex(board => board.name === issueFormData.status);
        if (boardIndex >= 0) {
          newStats[boardIndex].value++;
        } else {
          newStats.push({
            name: issueFormData.status,
            value: 1
          });
        }
        return newStats;
      });

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
      setError('');
    } catch (err) {
      console.error('Error creating issue:', err);
      setError(err.message || 'Failed to create issue');
    }
  };

  const DeleteConfirmationModal = () => (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-content">
        <div className="confirmation-header">
          <h2>Delete Project</h2>
        </div>
        <div className="confirmation-body">
          <p>Are you sure you want to delete this project?</p>
          <p className="confirmation-warning-text">This action cannot be undone. All project data, including tasks and boards, will be permanently deleted.</p>
          <div className="confirmation-project-info">
            <strong>Project to delete:</strong> {project?.title}
          </div>
        </div>
        <div className="confirmation-actions">
          <button
            className="btn-confirmation-cancel"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </button>
          <button
            className="btn-confirmation-delete"
            onClick={handleDeleteProject}
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );

  const SelfRemoveModal = () => (
    <div className="settings-dialog-overlay z-top">
      <div className="settings-dialog-content">
        <div className="settings-dialog-header">
          <h2>Cannot Remove Yourself</h2>
          <button
            className="settings-dialog-close"
            onClick={() => setShowSelfRemoveModal(false)}
          >
            ×
          </button>
        </div>
        <div className="settings-dialog-body">
          <p>You cannot remove yourself from the project.</p>
          <p>If you wish to leave the project, please use the "Leave Project" option in the project settings.</p>
        </div>
        <div className="settings-dialog-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowSelfRemoveModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const getSortedCollaborators = () => {
    if (!project?.collaborators) {
      console.log('No collaborators data available');
      return [];
    }

    if (!user?._id) {
      console.log('User data not loaded yet, returning unsorted list');
      return project.collaborators;
    }

    console.log('Current user:', user);
    console.log('All collaborators:', project.collaborators);

    const sorted = [...project.collaborators].sort((a, b) => {
      if (a.userId._id.toString() === user._id.toString()) return -1;
      if (b.userId._id.toString() === user._id.toString()) return 1;

      if (a.role === 'manager' && b.role !== 'manager') return -1;
      if (a.role !== 'manager' && b.role === 'manager') return 1;

      return (a.userId.fullName || a.userId.username).localeCompare(b.userId.fullName || b.userId.username);
    });

    console.log('Sorted result:', sorted);
    return sorted;
  };

  const canRemoveCollaborator = (collaborator) => {
    if (!project?.collaborators || !user?._id) {
      console.log('No project or user data available');
      return false;
    }

    if (collaborator.userId._id.toString() === user._id.toString()) {
      console.log('Cannot remove self');
      return false;
    }

    const currentUserRole = project.collaborators.find(
      c => c.userId._id.toString() === user._id.toString()
    )?.role;

    console.log('Current user role:', currentUserRole);
    return currentUserRole === 'manager';
  };

  const ErrorModal = () => (
    <div className="access-denied-modal-overlay">
      <div className="access-denied-modal-content">
        <div className="access-denied-header">
          <h2>Access Denied</h2>
          <button
            className="access-denied-close"
            onClick={() => setShowErrorModal(false)}
          >
            ×
          </button>
        </div>
        <div className="access-denied-body">
          <div className="access-denied-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p className="access-denied-message">{errorMessage}</p>
        </div>
        <div className="access-denied-actions">
          <button
            className="btn-access-denied-close"
            onClick={() => setShowErrorModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const handleEditClick = (action) => {
    if (project.projectType === 'personal') {
      return true;
    }

    if (project.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can edit project details');
      setShowErrorModal(true);
      return false;
    }
    return true;
  };

  const handleDeleteClick = () => {
    if (project.projectType === 'personal') {
      setShowDeleteConfirm(true);
      return;
    }

    if (project.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can delete the project');
      setShowErrorModal(true);
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleCollaboratorClick = () => {
    if (project.projectType === 'personal') {
      setErrorMessage('Personal projects do not have collaborators');
      setShowErrorModal(true);
      return;
    }

    if (project.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can manage collaborators');
      setShowErrorModal(true);
      return;
    }
    setShowAddCollaborator(true);
  };

  const handleLeaveProject = async () => {
    try {
      await leaveProject(id);
      navigate('/projects');
    } catch (err) {
      console.error('Error leaving project:', err);
      setShowLeaveConfirm(false);
      setErrorMessage(err.message || 'Failed to leave project');
      setShowErrorModal(true);
    }
  };



  const LeaveConfirmationModal = () => (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-content">
        <div className="confirmation-header">
          <h2>Leave Project</h2>
        </div>
        <div className="confirmation-body">
          <p>Are you sure you want to leave this project?</p>
          <p className="confirmation-warning-text">You will no longer have access to this project. You can only rejoin if invited by a project manager.</p>
          <div className="confirmation-project-info">
            <strong>Project:</strong> {project?.title}
          </div>
        </div>
        <div className="confirmation-actions">
          <button
            className="btn-confirmation-cancel"
            onClick={() => setShowLeaveConfirm(false)}
          >
            Cancel
          </button>
          <button
            className="btn-confirmation-leave"
            onClick={handleLeaveProject}
          >
            Leave Project
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingAnimation message="Loading project details..." />;

  if (error) return <div className="error-message">{error}</div>;

  if (!project) return <div className="error-message">Project not found</div>;

  console.log('Project data:', project);
  console.log('Collaborators:', project.collaborators);

  return (
    <div className="projects-wrapper">

      {showErrorModal && <ErrorModal />}

      {showDeleteConfirm && <DeleteConfirmationModal />}
      {showSelfRemoveModal && <SelfRemoveModal />}
      {showLeaveConfirm && <LeaveConfirmationModal />}

      <header className="po-header">
        <div className="po-header-content">
          <Link to="/dashboard" className="po-logo-container">
            <img src="/logo.png" alt="KarmaSync" className="po-logo" />
          </Link>

          <div className="po-divider"></div>

          <div className="po-titles">
            <span className="po-page-label">
              {activeView === 'overview' ? 'Project Overview' : 'Project Settings'}
            </span>
            <div className="po-project-title-wrapper">
              <h1 className="po-project-name">{project.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="projects-body">
        <div className="projects-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`sidebar-link ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <i className="fas fa-home"></i>
              <span>Overview</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${project._id}/kanban`)}>
              <i className="fas fa-columns"></i>
              <span>Kanban Board</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${id}/tasks`)}>
              <i className="fas fa-list-ul"></i>
              <span>View Issues</span>
            </button>
            {project.projectType === 'collaborative' && (
              <button className="sidebar-link" onClick={handleCollaboratorClick}>
                <i className="fas fa-users-cog"></i>
                <span>Manage Collaborators</span>
              </button>
            )}
            <button
              className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveView('settings')}
            >
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
          {activeView === 'overview' ? (
            <>
              <div className="project-overview-section project-info-section">
                <div className="project-meta-pills">
                  <div className="meta-item">
                    <span className="meta-label">ID:</span>
                    <span className="meta-value">{project.shortId}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Created on:</span>
                    <span className="meta-value">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {project.projectType && (
                    <div className="meta-item">
                      <span className="meta-label">Type:</span>
                      <span className={`project-type-badge ${project.projectType}`}>
                        {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)}
                      </span>
                    </div>
                  )}
                  {project.status && (
                    <div className="meta-item">
                      <span className="meta-label">Status:</span>
                      <span className={`status-badge ${project.status}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>
                  )}
                  {project.projectType === 'collaborative' && project.currentUserRole && (
                    <div className="meta-item">
                      <span className="meta-label">Your Role:</span>
                      <span className={`role-badge ${project.currentUserRole}`}>
                        {project.currentUserRole === 'manager' ? 'Project Manager' : 'Developer'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="project-overview-section">
                <div className="section-header">
                  <h2>Description</h2>
                </div>
                <p>{project.description || 'No description provided'}</p>
              </div>

              {project.githubLink && (
                <div className="project-overview-section">
                  <div className="section-header">
                    <h2>GitHub Repository</h2>
                  </div>
                  <div className="github-display">
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-link"
                    >
                      <i className="fab fa-github"></i> {project.githubLink.replace('https://github.com/', '')}
                    </a>
                  </div>
                </div>
              )}

              {project && project.projectType === 'collaborative' && (
                <div className="project-overview-section">
                  <div className="section-header">
                    <h2>Collaborators</h2>
                  </div>
                  <div className="collaborators-list">
                    <table className="collaborators-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.collaborators && project.collaborators.map((collab) => (
                          <tr key={collab.userId._id}>
                            <td>{collab.userId.fullName || 'N/A'}</td>
                            <td>{collab.userId.username}</td>
                            <td>{collab.userId.email}</td>
                            <td>
                              <span className={`collab-role ${collab.role}`}>
                                {collab.role === 'manager' ? 'Project Manager' : 'Developer'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="project-overview-section issues-overview-section">
                <div className="issues-overview-header">
                  <h2>Issues Overview</h2>
                </div>
                <div className="issues-overview">
                  <div className="issues-stats">
                    <div className="total-issues">
                      <span className="issues-count">{taskCount}</span>
                      <span className="issues-label">Total Issues</span>
                    </div>
                  </div>
                  <div className="chart-container">
                    {boardStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={boardStats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {boardStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} issues`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data-chart">0 Issues Found</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="settings-view">
              <div className="project-overview-section">
                <div className="section-header">
                  <h2>Project Settings</h2>
                </div>

                <div className="settings-group">
                  <form onSubmit={handleTitleSubmit} className="po-edit-form settings-form">
                    <div className="form-group">
                      <label>Project Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="po-edit-input"
                        required
                      />
                    </div>
                    <button type="submit" className="settings-submit-btn">Update Title</button>
                  </form>
                </div>

                <div className="settings-group">
                  <form onSubmit={handleDescriptionSubmit} className="edit-form settings-form">
                    <div className="form-group">
                      <label>Project Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="edit-textarea"
                        rows="4"
                        required
                      />
                    </div>
                    <button type="submit" className="settings-submit-btn">Update Description</button>
                  </form>
                </div>

                <div className="settings-group">
                  <form onSubmit={handleGithubSubmit} className="github-form settings-form">
                    <div className="form-group">
                      <label>Repository URL</label>
                      <input
                        type="url"
                        value={githubLink}
                        onChange={(e) => setGithubLink(e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="github-input"
                      />
                    </div>
                    <button type="submit" className="settings-submit-btn">Update Repository</button>
                  </form>
                </div>
              </div>

              <div className="project-overview-section settings-danger-zone">
                <h2>Danger Zone</h2>
                <div className="settings-danger-content">
                  <div className="settings-danger-actions">
                    {project?.projectType === 'collaborative' && project?.currentUserRole && (
                      <div className="settings-danger-row leave-action">
                        <div className="settings-danger-info">
                          <h3>Leave this project</h3>
                          <p>You will no longer have access to this project.</p>
                        </div>
                        <button
                          className="settings-danger-btn warning"
                          onClick={() => setShowLeaveConfirm(true)}
                        >
                          Leave Project
                        </button>
                      </div>
                    )}
                    <div className="settings-danger-row delete-action">
                      <div className="settings-danger-info">
                        <h3>Delete this project</h3>
                        <p>Once you delete a project, there is no going back. Please be certain.</p>
                      </div>
                      <button className="settings-danger-btn danger" onClick={handleDeleteClick}>
                        Delete Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Footer />
        </div>
      </div>

      {showAddIssueModal && (
        <div className="modal-overlay issue-modal-overlay">
          <div className="modal-content issue-modal issue-modal--overview">
            <div className="modal-header issue-modal__header">
              <h2 className="issue-modal__title">Add New Issue</h2>
            </div>
            <div className="modal-body issue-modal__body">
              <form onSubmit={handleIssueFormSubmit} className="issue-form issue-form--overview">
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
                      placeholder="Enter issue title"
                    />
                  </div>
                  <div className="form-group issue-form__group">
                    <label htmlFor="type">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={showCustomType ? 'custom' : issueFormData.type}
                      onChange={handleIssueFormChange}
                      className="form-control"
                    >
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
                    <textarea
                      id="description"
                      name="description"
                      value={issueFormData.description}
                      onChange={handleIssueFormChange}
                      className="form-control"
                      rows="2"
                      placeholder="Enter issue description"
                    />
                  </div>
                </div>

                <div className="form-row issue-form__row">
                  <div className="form-group issue-form__group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={issueFormData.status}
                      onChange={handleIssueFormChange}
                      className="form-control"
                    >
                      <option value="todo">To Do</option>
                      <option value="doing">Doing</option>
                      <option value="done">Done</option>
                      {project?.customBoards?.map(board => (
                        <option key={board.id} value={board.id}>
                          {board.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group issue-form__group">
                    <label htmlFor="deadline">Deadline</label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={issueFormData.deadline}
                      onChange={handleIssueFormChange}
                      className="form-control"
                    />
                  </div>
                </div>

                {project.projectType === 'collaborative' && (
                  <div className="form-row issue-form__row">
                    <div className="form-group issue-form__group">
                      <label htmlFor="assignee">Assignee</label>
                      <select
                        id="assignee"
                        name="assignee"
                        value={issueFormData.assignee}
                        onChange={handleIssueFormChange}
                        className="form-control"
                      >
                        <option value="">Select Assignee</option>
                        {project.collaborators.map((collab) => (
                          <option key={collab.userId._id} value={collab.userId._id}>
                            {collab.userId.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {showCustomType && (
                  <div className="form-row issue-form__row">
                    <div className="form-group issue-form__group">
                      <label htmlFor="customType">Custom Type</label>
                      <input
                        type="text"
                        name="customType"
                        value={issueFormData.customType}
                        onChange={handleIssueFormChange}
                        className="form-control custom-type-input"
                        placeholder="Enter custom issue type"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="modal-actions issue-modal__actions">
                  <button type="submit" className="btn btn-primary issue-modal__primary-btn">
                    Create Issue
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary issue-modal__secondary-btn"
                    onClick={() => {
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
                    }}
                  >
                    Cancel
                  </button>
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
                }}
              >
                ×
              </button>
            </div>
            <div className="settings-dialog-body">
              {error && <div className="error-message">{error}</div>}
              <div className="collab-tabs">
                <button
                  className={`collab-tab ${!selectedUser ? 'active' : ''}`}
                  onClick={() => setSelectedUser(null)}
                >
                  <i className="fas fa-plus"></i> Add Collaborator
                </button>
                <button
                  className={`collab-tab ${selectedUser ? 'active' : ''}`}
                  onClick={() => setSelectedUser(project.collaborators[0]?.userId)}
                >
                  <i className="fas fa-users-cog"></i> Manage Team
                </button>
              </div>

              {selectedUser ? (
                <div className="collab-manage-wrapper">
                  <div className="collab-list">
                    {project.collaborators && project.collaborators.map((collab) => (
                      <div key={collab.userId._id} className="collab-manage-item">
                        <div className="collab-user-info">
                          <span className="collab-name">{collab.userId.fullName || 'N/A'}</span>
                          <span className="collab-username">{collab.userId.username}</span>
                          <span className="collab-email">{collab.userId.email}</span>
                          <span className={`collab-role ${collab.role}`}>
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
                              if (!user || !user._id) {
                                setErrorMessage('Please wait while we load your user information');
                                setShowErrorModal(true);
                                return;
                              }

                              const isCreator = project.createdBy._id === user._id;
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
                    placeholder="Search users by username or email"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="collab-search-field"
                  />
                  {searchResults.length > 0 && (
                    <div className="collab-search-results">
                      {searchResults.map(user => (
                        <div
                          key={user._id}
                          className="collab-search-item"
                          onClick={() => handleAddCollaborator(user)}
                        >
                          <div className="collab-user-info">
                            <span className="collab-username">{user.username}</span>
                            <span className="collab-email">{user.email}</span>
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


      {showRemoveModal && removingCollaborator && (
        <div className="settings-dialog-overlay z-top">
          <div className="settings-dialog-content">
            <div className="settings-dialog-header">
              <h2>Remove Collaborator</h2>
              <button
                className="settings-dialog-close"
                onClick={() => {
                  setShowRemoveModal(false);
                  setRemovingCollaborator(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="settings-dialog-body">
              <p>Are you sure you want to remove this collaborator?</p>
              <div className="collab-to-remove">
                <strong>User:</strong> {removingCollaborator.userId.username}
                <br />
                <strong>Email:</strong> {removingCollaborator.userId.email}
                <br />
                <strong>Role:</strong> {removingCollaborator.role === 'manager' ? 'Project Manager' : 'Developer'}
              </div>
            </div>
            <div className="settings-dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowRemoveModal(false);
                  setRemovingCollaborator(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (!user || !user._id) {
                    setErrorMessage('Please wait while we load your user information');
                    setShowErrorModal(true);
                    return;
                  }

                  const isCreator = project.createdBy._id === user._id;
                  const isManager = project.currentUserRole === 'manager';

                  if (!isCreator && !isManager) {
                    setErrorMessage('Only Project Managers can remove collaborators');
                    setShowErrorModal(true);
                    return;
                  }

                  if (removingCollaborator.userId._id === user._id) {
                    setShowSelfRemoveModal(true);
                    return;
                  }

                  handleRemoveCollaborator();
                }}
              >
                Remove Collaborator
              </button>
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
                <div className="loading-container">
                  <LoadingAnimation message={isUpdatingRole ? "Updating role..." : "Adding collaborator..."} />
                </div>
              ) : (
                <div className="role-options">
                  <button
                    className="role-option manager"
                    onClick={() => handleRoleSelect('manager')}
                  >
                    <h4>Project Manager</h4>
                    <p>Full access to project management</p>
                    <ul>
                      <li>Create, edit, and delete tasks</li>
                      <li>Manage project details</li>
                      <li>Manage collaborators</li>
                      <li>Full commenting access</li>
                    </ul>
                  </button>
                  <button
                    className="role-option developer"
                    onClick={() => handleRoleSelect('developer')}
                  >
                    <h4>Developer</h4>
                    <p>Task execution and updates</p>
                    <ul>
                      <li>View and update task status</li>
                      <li>Full commenting access</li>
                      <li>Limited project access</li>
                    </ul>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectOverview; 