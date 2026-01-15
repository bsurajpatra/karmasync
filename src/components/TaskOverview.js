import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTaskById, updateTask, deleteTask, addTaskComment, updateTaskStatus } from '../api/taskApi';
import { getProjectById } from '../api/projectApi';
import { getSprintsByProject } from '../api/sprintApi';
import TagSelector from './TagSelector';
import * as storyApi from '../api/userStoryApi';
import '../styles/Tags.css';
import LoadingAnimation from './LoadingAnimation';

import '../styles/ProjectOverview.css';
import '../styles/TaskOverviewCompact.css';
import '../styles/IssueModal.css';
import Footer from './Footer';

const TaskOverview = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [comment, setComment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    status: '',
    deadline: '',
    customType: '',
    assignee: '',
    sprintId: '',
    storyId: '',
    tags: []
  });
  const [stories, setStories] = useState([]);
  const [showCustomType, setShowCustomType] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchTaskAndProject();
  }, [taskId]);

  const fetchTaskAndProject = async () => {
    try {
      const taskData = await getTaskById(taskId);
      setTask(taskData);
      setFormData({
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        status: taskData.status,
        deadline: taskData.deadline,
        assignee: taskData.assignee?._id || '',
        sprintId: taskData.sprintId?._id || '',
        storyId: taskData.storyId?._id || taskData.storyId || '',
        tags: taskData.tags || []
      });

      const projectId = taskData.projectId._id || taskData.projectId;
      const projectData = await getProjectById(projectId);
      setProject(projectData);

      const sprintsData = await getSprintsByProject(projectId);
      setSprints(sprintsData);

      const storiesData = await storyApi.getStoriesByProject(projectId);
      setStories(storiesData);

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      if (value === 'custom') {
        setShowCustomType(true);
        setFormData(prev => ({
          ...prev,
          [name]: prev.customType || ''
        }));
      } else {
        setShowCustomType(false);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customType: ''
        }));
      }
    } else if (name === 'customType') {
      const validatedValue = value.replace(/[^a-zA-Z0-9-_]/g, '');
      setFormData(prev => ({
        ...prev,
        type: validatedValue,
        customType: validatedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedTask = await updateTask(taskId, {
        ...formData,
        assignee: formData.assignee || task.assignee?._id || task.assignee,
        sprintId: formData.sprintId || null
      });

      const refreshedTask = await getTaskById(taskId);
      setTask(refreshedTask);
      setEditing(false);
      setError('');
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(taskId);
      navigate(`/project/${project._id}/tasks`);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const updatedTask = await addTaskComment(taskId, comment);
      setTask(updatedTask);
      setComment('');
      setShowMentions(false);
      setError('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setComment(value);

    // Check for @mention
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      const charBeforeAt = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : '';
      // Only trigger if @ is at start of line or following a space
      if (lastAtIdx === 0 || charBeforeAt === ' ' || charBeforeAt === '\n') {
        const query = textBeforeCursor.substring(lastAtIdx + 1);
        // Only trigger if query doesn't have spaces (we are still typing the username)
        if (!query.includes(' ')) {
          setMentionQuery(query);
          setShowMentions(true);
          setMentionIndex(0);
          return;
        }
      }
    }
    setShowMentions(false);
  };

  const handleCommentKeyDown = (e) => {
    if (showMentions) {
      const filteredMembers = getFilteredProjectMembers();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMembers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredMembers.length > 0) {
          e.preventDefault();
          insertMention(filteredMembers[mentionIndex].userId.username);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const getFilteredProjectMembers = () => {
    if (!project) return [];

    // Include creator and collaborators
    const members = [];
    if (project.createdBy) {
      members.push({
        userId: {
          _id: project.createdBy._id || project.createdBy,
          username: project.createdBy.username,
          fullName: project.createdBy.fullName
        }
      });
    }

    if (project.collaborators) {
      project.collaborators.forEach(c => {
        // Avoid duplicate if creator is also in collaborators (though unlikely in this model)
        if (members.every(m => m.userId._id.toString() !== c.userId._id.toString())) {
          members.push(c);
        }
      });
    }

    return members.filter(m =>
      m.userId.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      m.userId.fullName.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  };

  const insertMention = (username) => {
    const selectionStart = textareaRef.current.selectionStart;
    const textBeforeCursor = comment.substring(0, selectionStart);
    const textAfterCursor = comment.substring(selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    const newText = textBeforeCursor.substring(0, lastAtIdx) + '@' + username + ' ' + textAfterCursor;
    setComment(newText);
    setShowMentions(false);

    // Set focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = lastAtIdx + username.length + 2; // +1 for @, +1 for space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const renderCommentText = (text) => {
    if (!text) return null;
    // Split by mention pattern while keeping the pattern in results
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="highlighted-mention">{part}</span>;
      }
      return part;
    });
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log('Starting status change to:', newStatus);
      setLoading(true);
      setError('');

      console.log('Calling updateTaskStatus API...');
      const updatedTask = await updateTaskStatus(taskId, newStatus);
      console.log('API Response:', updatedTask);

      if (!updatedTask) {
        throw new Error('No response received from server');
      }

      setTask(prevTask => ({
        ...prevTask,
        ...updatedTask
      }));

      setIsEditingStatus(false);
      console.log('Status change completed successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      setError(err.response?.data?.message || err.message || 'Failed to update status');

      setNewStatus(task.status);
    } finally {
      setLoading(false);
      console.log('Status change operation finished');
    }
  };

  const ErrorModal = () => (
    <div className="ni-mod-overlay">
      <div className="ni-mod-content" style={{ maxWidth: '400px' }}>
        <div className="ni-mod-header" style={{ background: '#fff5f5' }}>
          <h2 className="ni-mod-title" style={{ color: '#c53030' }}>Access Denied</h2>
          <button
            className="ni-mod-close"
            onClick={() => {
              setShowErrorModal(false);
              setErrorMessage('');
            }}
          >
            &times;
          </button>
        </div>
        <div className="ni-mod-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div className="error-icon" style={{ fontSize: '3rem', color: '#f56565', marginBottom: '1rem' }}>
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <p className="error-message" style={{ color: '#4a5568', fontWeight: '500' }}>{errorMessage}</p>
        </div>
        <div className="ni-mod-actions">
          <button
            className="ni-mod-btn-secondary"
            onClick={() => {
              setShowErrorModal(false);
              setErrorMessage('');
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const handleEditClick = () => {
    if (project?.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can edit issue details');
      setShowErrorModal(true);
      return;
    }
    setEditing(true);
  };

  if (loading) return <LoadingAnimation message="Loading task details..." />;

  if (error) return <div className="error-message">{error}</div>;
  if (!task) return <div className="error-message">Task not found</div>;

  return (
    <div className="projects-wrapper">
      {showErrorModal && <ErrorModal />}

      {/* Edit Modal */}
      {editing && (
        <div className="ni-mod-overlay">
          <div className="ni-mod-content">
            <div className="ni-mod-header">
              <h2 className="ni-mod-title">Edit Issue</h2>
              <button
                className="ni-mod-close"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    title: task.title,
                    description: task.description,
                    type: task.type,
                    status: task.status,
                    deadline: task.deadline,
                    assignee: task.assignee?._id || '',
                    sprintId: task.sprintId?._id || '',
                    storyId: task.storyId?._id || task.storyId || '',
                    tags: task.tags || []
                  });
                }}
              >
                &times;
              </button>
            </div>
            <div className="ni-mod-body">
              <form onSubmit={handleSubmit} className="ni-mod-form">
                <div className="ni-mod-form-row">
                  <div className="ni-mod-form-group">
                    <label htmlFor="title">Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="ni-mod-input"
                      required
                    />
                  </div>
                  <div className="ni-mod-form-group">
                    <label htmlFor="type">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={showCustomType ? 'custom' : formData.type}
                      onChange={handleInputChange}
                      className="ni-mod-select"
                      required
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

                {showCustomType && (
                  <div className="ni-mod-form-group">
                    <label htmlFor="customType">Custom Type</label>
                    <input
                      type="text"
                      name="customType"
                      value={formData.customType}
                      onChange={handleInputChange}
                      className="ni-mod-input"
                      placeholder="Enter custom issue type"
                      required
                    />
                  </div>
                )}

                <div className="ni-mod-form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="ni-mod-textarea"
                    rows="2"
                    placeholder="Issue description"
                  />
                </div>

                <div className="ni-mod-form-row">
                  <div className="ni-mod-form-group">
                    <label htmlFor="deadline">Deadline</label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="ni-mod-input"
                    />
                  </div>
                </div>
                <div className="ni-mod-form-row">
                  <div className="ni-mod-form-group">
                    <label htmlFor="sprintId">Sprint</label>
                    <select id="sprintId" name="sprintId" value={formData.sprintId} onChange={handleInputChange} className="ni-mod-select">
                      <option value="">No Sprint (Backlog)</option>
                      {sprints.map((s) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ni-mod-form-row">
                  <div className="ni-mod-form-group">
                    <label htmlFor="storyId">User Story</label>
                    <select
                      id="storyId"
                      name="storyId"
                      value={formData.storyId}
                      onChange={handleInputChange}
                      className="ni-mod-select"
                    >
                      <option value="">No Story (Independent Task)</option>
                      {stories.map((s) => (
                        <option key={s._id} value={s._id}>{s.title} ({s.status})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ni-mod-form-row">
                  {project?.projectType === 'collaborative' && (
                    <div className="ni-mod-form-group">
                      <label htmlFor="assignee">Assignee</label>
                      <select
                        id="assignee"
                        name="assignee"
                        value={formData.assignee}
                        onChange={handleInputChange}
                        className="ni-mod-select"
                      >
                        <option value="">Select Assignee</option>
                        {project.collaborators.map((collab) => (
                          <option key={collab.userId._id} value={collab.userId._id}>
                            {collab.userId.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="ni-mod-form-group">
                    <TagSelector
                      projectTags={project.tags || []}
                      selectedTagIds={formData.tags}
                      onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                    />
                  </div>
                </div>

                <div className="ni-mod-actions">
                  <button type="submit" className="ni-mod-btn-primary">Save Changes</button>
                  <button
                    type="button"
                    className="ni-mod-btn-secondary"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        title: task.title,
                        description: task.description,
                        type: task.type,
                        status: task.status,
                        deadline: task.deadline,
                        assignee: task.assignee?._id || '',
                        sprintId: task.sprintId?._id || '',
                        storyId: task.storyId?._id || task.storyId || '',
                        tags: task.tags || []
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

      {/* Danger Zone Modal */}
      {showDangerModal && (
        <div className="ni-mod-overlay">
          <div className="ni-mod-content ni-mod-danger" style={{ maxWidth: '450px' }}>
            <div className="ni-mod-header" style={{ background: '#fff5f5' }}>
              <h2 className="ni-mod-title" style={{ color: '#c53030' }}>Danger Zone</h2>
              <button className="ni-mod-close" onClick={() => setShowDangerModal(false)}>
                &times;
              </button>
            </div>
            <div className="ni-mod-body">
              <div className="to-danger-warning" style={{ textAlign: 'center', padding: '1rem' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#f56565', marginBottom: '1rem' }}></i>
                <h3 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>Delete this issue</h3>
                <p style={{ color: '#718096' }}>Once you delete this issue, there is no going back. Please be certain.</p>
              </div>
            </div>
            <div className="ni-mod-actions" style={{ background: '#f8fafc' }}>
              <button
                className="ni-mod-btn-primary"
                style={{ background: '#e53e3e' }}
                onClick={() => {
                  setShowDangerModal(false);
                  setShowDeleteConfirm(true);
                }}
              >
                <i className="fas fa-trash"></i> Delete Issue
              </button>
              <button
                className="ni-mod-btn-secondary"
                onClick={() => setShowDangerModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="po-header">
        <div className="po-header-content">
          <Link to="/dashboard" className="po-logo-container">
            <img src="/logo.png" alt="KarmaSync" className="po-logo" />
          </Link>

          <div className="po-divider"></div>

          <div className="po-titles">
            <span className="po-page-label">Issue Details</span>
            <div className="po-project-title-wrapper">
              <h1 className="po-project-name">{task.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="projects-body">
        <div className="projects-sidebar">
          <nav className="sidebar-nav">
            <button className="sidebar-link" onClick={() => navigate(`/project/${project._id}/overview`)}>
              <i className="fas fa-home"></i>
              <span>Overview</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${project._id}/kanban`)}>
              <i className="fas fa-columns"></i>
              <span>Kanban Board</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${project._id}/tasks`)}>
              <i className="fas fa-list-ul"></i>
              <span>View Issues</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${project._id}/overview?view=sprints`)}>
              <i className="fas fa-running"></i>
              <span>Sprints</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${project._id}/overview?view=stories`)}>
              <i className="fas fa-book"></i>
              <span>User Stories</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${project._id}/overview?view=settings`)}>
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </button>
            <div className="sidebar-divider"></div>
            <button className="sidebar-link" onClick={handleEditClick}>
              <i className="fas fa-edit"></i>
              <span>Edit Issue</span>
            </button>
            <button className="sidebar-link" onClick={() => setShowDangerModal(true)}>
              <i className="fas fa-exclamation-triangle"></i>
              <span>Danger Zone</span>
            </button>
            <div className="sidebar-divider"></div>
            <button className="sidebar-link" onClick={() => navigate(`/project/${project._id}/tasks`)}>
              <i className="fas fa-arrow-left"></i>
              <span>Back to Issues List</span>
            </button>
          </nav>
        </div>

        <div className="project-overview-container">
          <div className="to-section">
            <div className="to-section-header">
              <h2>Issue Information</h2>
            </div>

            {editing ? (
              // This block is now handled by the Edit Modal above, so it's empty here.
              // The original content of the inline edit form was moved to the Edit Modal.
              null
            ) : (
              <div className="to-details">
                <h3 className="to-title">{task.title}</h3>
                <div className="to-meta-grid">
                  <div className="to-meta-item">
                    <span className="to-meta-label">Project</span>
                    <span className="to-meta-value">{project.title}</span>
                  </div>
                  <div className="to-meta-item">
                    <span className="to-meta-label">Issue ID</span>
                    <span className="to-meta-value">#{task.serialNumber}</span>
                  </div>
                  <div className="to-meta-item">
                    <span className="to-meta-label">Sprint</span>
                    <span className="to-meta-value">
                      {task.sprintId ? task.sprintId.name : 'Backlog'}
                    </span>
                  </div>
                  <div className="to-meta-item">
                    <span className="to-meta-label">Type</span>
                    <span className={`to-badge to-badge-${task.type}`}>
                      {task.type === 'tech' ? 'Technical' :
                        task.type === 'review' ? 'Review' :
                          task.type === 'bug' ? 'Bug' :
                            task.type === 'feature' ? 'Feature' :
                              task.type === 'documentation' ? 'Documentation' :
                                task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                    </span>
                  </div>
                  <div className="to-meta-item">
                    <span className="to-meta-label">User Story</span>
                    <span className="to-meta-value">
                      {task.storyId ? (stories.find(s => s._id === (task.storyId?._id || task.storyId))?.title || 'Story') : 'None'}
                    </span>
                  </div>
                  <div className="to-meta-item">
                    <span className="to-meta-label">Status</span>
                    {isEditingStatus ? (
                      <div className="to-status-edit">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="to-select">

                          <option value="todo">To Do</option>
                          <option value="doing">Doing</option>
                          <option value="done">Done</option>
                          {project?.customBoards?.map(board => (
                            <option key={board.id} value={board.id}>
                              {board.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="to-btn-icon to-btn-success"
                          onClick={() => handleStatusChange(newStatus)}
                          disabled={loading}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          className="to-btn-icon to-btn-cancel"
                          onClick={() => {
                            setIsEditingStatus(false);
                            setNewStatus(task.status);
                            setError('');
                          }}
                          disabled={loading}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="to-status-display">
                        <span className={`to-badge to-badge-${task.status}`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                        <button
                          className="to-btn-link"
                          onClick={() => {
                            setIsEditingStatus(true);
                            setNewStatus(task.status);
                            setError('');
                          }}
                          disabled={loading}
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                  {task.deadline && (
                    <div className="to-meta-item">
                      <span className="to-meta-label">Deadline</span>
                      <span className={`to-meta-value ${task.sprintId && task.sprintId.endDate && new Date(task.deadline) > new Date(task.sprintId.endDate) ? 'deadline-warning-text' : ''}`}>
                        {new Date(task.deadline).toLocaleDateString()}
                        {task.sprintId && task.sprintId.endDate && new Date(task.deadline) > new Date(task.sprintId.endDate) && (
                          <span className="deadline-warning-badge" style={{
                            marginLeft: '10px',
                            fontSize: '0.7rem',
                            background: '#fff5f5',
                            color: '#e53e3e',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #feb2b2',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fas fa-exclamation-triangle"></i> Exceeds Sprint
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {project.projectType === 'collaborative' && task.assignee && (
                    <div className="to-meta-item">
                      <span className="to-meta-label">Assigned to</span>
                      <span className="to-meta-value">{task.assignee.username || task.assignee.fullName || 'Unassigned'}</span>
                    </div>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    <div className="to-meta-item">
                      <span className="to-meta-label">Tags</span>
                      <div className="to-meta-value" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {task.tags.map(tagId => {
                          const tag = project.tags?.find(t => t._id === tagId);
                          return tag ? (
                            <span key={tagId} className={`tag-chip ${tag.color}`}>
                              {tag.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="to-description">
                  <h4>Description</h4>
                  <p>{task.description || 'No description provided'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="to-section">
            <div className="to-section-header">
              <h2>Comments</h2>
            </div>
            <div className="to-comments-list">
              {task.comments?.map(comment => (
                <div key={comment._id} className="to-comment">
                  <div className="to-comment-header">
                    {project.projectType === 'collaborative' && (
                      <span className="to-comment-author">
                        {comment.user?.username || 'Unknown User'}
                      </span>
                    )}
                    <span className="to-comment-date">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="to-comment-text">{renderCommentText(comment.text)}</p>
                </div>
              ))}
            </div>
            <div className="to-comment-form-wrapper">
              {showMentions && (
                <div className="mentions-dropdown">
                  {getFilteredProjectMembers().map((member, idx) => (
                    <div
                      key={member.userId._id}
                      className={`mention-item ${idx === mentionIndex ? 'selected' : ''}`}
                      onClick={() => insertMention(member.userId.username)}
                    >
                      <span className="mention-item-username">@{member.userId.username}</span>
                      <span className="mention-item-name">{member.userId.fullName}</span>
                    </div>
                  ))}
                  {getFilteredProjectMembers().length === 0 && (
                    <div className="mention-item no-results">No members found</div>
                  )}
                </div>
              )}
              <form onSubmit={handleCommentSubmit} className="to-comment-form">
                <textarea
                  ref={textareaRef}
                  value={comment}
                  onChange={handleCommentChange}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Add a comment... (Type @ to mention)"
                  className="to-textarea"
                  rows="2"
                />
                <button type="submit" className="to-btn-primary to-comment-btn">
                  <i className="fas fa-comment"></i> Add Comment
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>



      {showDeleteConfirm && (
        <div className="ni-mod-overlay">
          <div className="ni-mod-content" style={{ maxWidth: '400px' }}>
            <div className="ni-mod-header">
              <h2 className="ni-mod-title">Final Confirmation</h2>
              <button className="ni-mod-close" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="ni-mod-body">
              <p style={{ color: '#4a5568', marginBottom: '1rem' }}>Are you sure you want to permanently delete this issue?</p>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#718096', display: 'block' }}>Selected:</span>
                <span style={{ fontWeight: '600', color: '#2d3748' }}>"{task.title}"</span>
              </div>
              <p style={{ color: '#e53e3e', fontSize: '0.85rem', fontWeight: '500' }}>This action cannot be undone.</p>
            </div>
            <div className="ni-mod-actions">
              <button className="ni-mod-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="ni-mod-btn-primary" style={{ background: '#e53e3e' }} onClick={handleDelete}>Delete Issue</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TaskOverview; 