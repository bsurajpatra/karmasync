import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTaskById, updateTask, deleteTask, addTaskComment, updateTaskStatus } from '../api/taskApi';
import { getProjectById } from '../api/projectApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/TaskOverview.css';
import '../styles/ProjectOverview.css';
import '../styles/TaskOverviewCompact.css';
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
    assignee: ''
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDangerModal, setShowDangerModal] = useState(false);

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
        assignee: taskData.assignee?._id || ''
      });

      const projectId = taskData.projectId._id || taskData.projectId;
      const projectData = await getProjectById(projectId);
      setProject(projectData);
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
        assignee: formData.assignee || task.assignee?._id || task.assignee
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
      setError('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    }
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
    <div className="modal-overlay">
      <div className="modal-content error-modal">
        <div className="modal-header">
          <h2>Access Denied</h2>
          <button
            className="modal-close"
            onClick={() => {
              setShowErrorModal(false);
              setErrorMessage('');
            }}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <p className="error-message">{errorMessage}</p>
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
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
        <div className="to-modal-overlay">
          <div className="to-modal-content">
            <div className="to-modal-header">
              <h2>Edit Issue</h2>
              <button
                className="to-modal-close"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    title: task.title,
                    description: task.description,
                    type: task.type,
                    status: task.status,
                    deadline: task.deadline,
                    assignee: task.assignee?._id || ''
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="to-modal-body">
                <div className="to-form-row">
                  <div className="to-form-group">
                    <label htmlFor="title">Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="to-input"
                      required
                    />
                  </div>
                </div>

                <div className="to-form-row">
                  <div className="to-form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="to-input"
                      rows="2"
                    />
                  </div>
                </div>

                <div className="form-row-compact">
                  <div className="form-group-compact">
                    <label htmlFor="type">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={showCustomType ? 'custom' : formData.type}
                      onChange={handleInputChange}
                      className="to-input"
                      required
                    >
                      <option value="tech">Technical</option>
                      <option value="review">Review</option>
                      <option value="bug">Bug</option>
                      <option value="feature">Feature</option>
                      <option value="documentation">Documentation</option>
                      <option value="custom">Custom Type</option>
                    </select>
                    {showCustomType && (
                      <input
                        type="text"
                        name="customType"
                        value={formData.customType}
                        onChange={handleInputChange}
                        className="to-input"
                        placeholder="Enter custom issue type"
                        required
                      />
                    )}
                  </div>
                  <div className="form-group-compact">
                    <label htmlFor="deadline">Deadline</label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="to-input"
                    />
                  </div>
                </div>

                {project?.projectType === 'collaborative' && (
                  <div className="form-row-compact">
                    <div className="form-group-compact">
                      <label htmlFor="assignee">Assignee</label>
                      <select
                        id="assignee"
                        name="assignee"
                        value={formData.assignee}
                        onChange={handleInputChange}
                        className="to-input"
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
              </div>
              <div className="to-modal-actions">
                <button type="submit" className="to-btn-primary">Save Changes</button>
                <button
                  type="button"
                  className="to-btn-secondary"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      title: task.title,
                      description: task.description,
                      type: task.type,
                      status: task.status,
                      deadline: task.deadline,
                      assignee: task.assignee?._id || ''
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danger Zone Modal */}
      {showDangerModal && (
        <div className="to-modal-overlay">
          <div className="to-modal-content to-modal-danger">
            <div className="to-modal-header">
              <h2>Danger Zone</h2>
              <button className="to-modal-close" onClick={() => setShowDangerModal(false)}>
                ×
              </button>
            </div>
            <div className="to-modal-body">
              <div className="to-danger-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <h3>Delete this issue</h3>
                <p>Once you delete this issue, there is no going back. Please be certain.</p>
              </div>
            </div>
            <div className="to-modal-actions">
              <button
                className="to-btn-danger"
                onClick={() => {
                  setShowDangerModal(false);
                  setShowDeleteConfirm(true);
                }}
              >
                <i className="fas fa-trash"></i> Delete Issue
              </button>
              <button
                className="to-btn-secondary"
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
                      <span className="to-meta-value">{new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {project.projectType === 'collaborative' && task.assignee && (
                    <div className="to-meta-item">
                      <span className="to-meta-label">Assigned to</span>
                      <span className="to-meta-value">{task.assignee.username || task.assignee.fullName || 'Unassigned'}</span>
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
                  <p className="to-comment-text">{comment.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleCommentSubmit} className="to-comment-form">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
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



      {showDeleteConfirm && (
        <div className="dc-overlay">
          <div className="dc-modal">
            <div className="dc-header">
              <div className="dc-icon-wrapper">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="dc-title">Delete Issue</h2>
            </div>
            <div className="dc-body">
              <p className="dc-message">Are you sure you want to permanently delete this issue?</p>
              <div className="dc-item-preview">
                <span className="dc-label">Selected:</span>
                <span className="dc-value">"{task.title}"</span>
              </div>
              <p className="dc-warning">This action cannot be undone.</p>
            </div>
            <div className="dc-actions">
              <button
                className="dc-btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="dc-btn-delete"
                onClick={handleDelete}
              >
                Delete Issue
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TaskOverview; 