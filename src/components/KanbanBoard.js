import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjectById, addCustomBoard, deleteCustomBoard, removeCollaborator, addCollaborator, updateCollaboratorRole } from '../api/projectApi';
import { getTasks, updateTaskStatus, createTask } from '../api/taskApi';
import { searchUsers } from '../api/userApi';
import axios from 'axios';
import BoardManager from './BoardManager';
import LoadingAnimation from './LoadingAnimation';
import '../styles/KanbanBoard.css';
import '../styles/ProjectOverview.css';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

const KanbanBoard = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [boards, setBoards] = useState({
    todo: { name: 'To Do', items: [], compressed: false },
    doing: { name: 'Doing', items: [], compressed: false },
    done: { name: 'Done', items: [], compressed: false }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [showBoardManager, setShowBoardManager] = useState(false);
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
  const [newBoardName, setNewBoardName] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Collaborator Management State
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removingCollaborator, setRemovingCollaborator] = useState(null);
  const [showSelfRemoveModal, setShowSelfRemoveModal] = useState(false);

  useEffect(() => {
    // Detect mobile device by screen width
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId]);

  /* Collaborator Management Logic */
  const debouncedSearch = React.useCallback(
    async (term) => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        return;
      }

      // Guard against project not being loaded yet
      if (!project || !project.collaborators) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/search`, {
          params: { searchTerm: term },
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const filteredResults = response.data.filter(user =>
          !project.collaborators.some(collab => collab.userId._id === user._id)
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

  const fetchProjectAndTasks = async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        getProjectById(projectId),
        getTasks(projectId)
      ]);

      setProject(projectData);

      const groupedTasks = {
        todo: {
          name: 'To Do',
          items: []
        },
        doing: {
          name: 'Doing',
          items: []
        },
        done: {
          name: 'Done',
          items: []
        }
      };

      if (projectData.customBoards) {
        projectData.customBoards.forEach(board => {
          groupedTasks[board.id] = {
            name: board.name,
            items: []
          };
        });
      }

      tasksData.forEach(task => {
        if (groupedTasks[task.status]) {
          groupedTasks[task.status].items.push(task);
        } else {
          groupedTasks.todo.items.push(task);
        }
      });

      setBoards(groupedTasks);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load board data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, taskId, sourceBoard) => {
    e.stopPropagation(); // Prevent event bubbling
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceBoard', sourceBoard);
    e.target.classList.add('dragging');
    setIsDragging(true);
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    e.target.classList.remove('dragging');
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) return;
    e.currentTarget.classList.add('dragging-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragging-over');
  };

  const handleDrop = async (e, targetBoard) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragging-over');

    if (!isDragging) return;
    setIsDragging(false);

    const taskId = e.dataTransfer.getData('taskId');
    const sourceBoard = e.dataTransfer.getData('sourceBoard');

    // Capture the necessary values from the event before state update
    const dropY = e.clientY;
    const taskListRect = e.currentTarget.getBoundingClientRect();
    const relativeY = dropY - taskListRect.top;

    // Store original state for potential rollback
    const originalBoards = boards;

    // Optimistic UI update - update frontend immediately
    const optimisticUpdate = () => {
      setBoards(prevBoards => {
        // Deep clone to avoid mutation issues
        const newBoards = JSON.parse(JSON.stringify(prevBoards));

        // Get current items
        const sourceItems = newBoards[sourceBoard]?.items || [];
        const targetItems = newBoards[targetBoard]?.items || [];

        // Find the task
        const taskIndex = sourceItems.findIndex(item => item._id === taskId);
        if (taskIndex === -1) {
          return prevBoards; // Task not found, return unchanged state
        }

        const task = sourceItems[taskIndex];

        // Remove from source
        sourceItems.splice(taskIndex, 1);

        // Calculate drop position using captured values
        const cardHeight = 120;
        const cardGap = 16;
        const totalCardHeight = cardHeight + cardGap;

        let dropIndex = Math.floor(relativeY / totalCardHeight);
        dropIndex = Math.max(0, Math.min(dropIndex, targetItems.length));

        // If same board, adjust for removed item
        if (sourceBoard === targetBoard && taskIndex < dropIndex) {
          dropIndex--;
        }

        // Add to target
        targetItems.splice(dropIndex, 0, { ...task, status: targetBoard });

        // Update boards
        newBoards[sourceBoard] = {
          ...newBoards[sourceBoard],
          items: sourceItems
        };
        newBoards[targetBoard] = {
          ...newBoards[targetBoard],
          items: targetItems
        };

        return newBoards;
      });
    };

    // Execute optimistic update
    optimisticUpdate();

    // Asynchronous backend update
    setTimeout(async () => {
      try {
        await updateTaskStatus(taskId, targetBoard);
        // Success - no need to do anything, optimistic update was correct
      } catch (err) {
        console.error('Failed to update task status:', err);
        setError('Failed to update task status. Reverting change.');

        // Rollback to original state on failure
        setBoards(originalBoards);

        // Optionally refresh from server to ensure consistency
        setTimeout(() => {
          fetchProjectAndTasks();
        }, 1000);
      }
    }, 0);
  };

  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
  };

  const handleAddIssue = () => {
    setShowAddIssueModal(true);
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
        title: issueFormData.title,
        description: issueFormData.description,
        type: issueFormData.type,
        status: issueFormData.status,
        deadline: issueFormData.deadline,
        projectId: projectId
      };

      console.log('Creating task with data:', taskData);

      const newIssue = await createTask(taskData);
      console.log('Created task:', newIssue);

      if (!newIssue) {
        throw new Error('Failed to create task - no response from server');
      }

      setBoards(prev => ({
        ...prev,
        [issueFormData.status]: {
          ...prev[issueFormData.status],
          items: [...prev[issueFormData.status].items, newIssue]
        }
      }));

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
      setError(err.message || 'Failed to create issue. Please try again.');
    }
  };

  const handleBoardAdd = async (e) => {
    e.preventDefault();
    try {
      const savedBoard = await addCustomBoard(projectId, { name: newBoardName });
      setBoards(prev => ({
        ...prev,
        [savedBoard.id]: {
          name: savedBoard.name,
          items: []
        }
      }));
      setShowBoardManager(false);
      setNewBoardName('');
    } catch (err) {
      console.error('Error adding board:', err);
      setError('Failed to add new board');
    }
  };

  const isDefaultBoard = (boardId) => {
    return ['todo', 'doing', 'done'].includes(boardId);
  };

  const canDeleteBoard = (boardId, board) => {
    return !isDefaultBoard(boardId) && board.items.length === 0;
  };

  const handleBoardDelete = async (boardId) => {
    if (!canDeleteBoard(boardId, boards[boardId])) {
      return;
    }

    try {
      await deleteCustomBoard(projectId, boardId);
      const { [boardId]: deletedBoard, ...remainingBoards } = boards;
      setBoards(remainingBoards);
    } catch (err) {
      console.error('Error deleting board:', err);
      setError('Failed to delete board');
    }
  };

  const toggleBoardCompress = (boardId) => {
    setBoards(prev => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        compressed: !prev[boardId].compressed
      }
    }));
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

  const handleManageBoardsClick = () => {
    if (project?.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can manage boards');
      setShowErrorModal(true);
      return;
    }
    setShowBoardManager(true);
  };

  const handleAddIssueClick = () => {
    if (project?.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can add issues');
      setShowErrorModal(true);
      return;
    }
    setShowAddIssueModal(true);
  };

  if (loading) return <LoadingAnimation message="Loading your board..." />;

  if (error) return <div className="error-message">{error}</div>;

  if (!project) return <div className="error-message">Project not found</div>;

  if (isMobile) {
    return (
      <div className="kanban-mobile-message" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        background: '#f7f8fa',
        color: '#222',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '1.2rem 1rem',
        margin: '3rem auto',
        maxWidth: '480px',
        textAlign: 'center',
        fontWeight: 500,
        fontSize: '1.08rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <i className="fas fa-ban" style={{ fontSize: '2.1rem', marginBottom: '0.7rem', color: '#888' }}></i>
        <div style={{ fontSize: '1.08rem', fontWeight: 600, marginBottom: '0.4rem' }}>Kanban Board Unavailable on Mobile</div>
        <div style={{ color: '#444', fontWeight: 400, fontSize: '0.98rem', marginBottom: '1.2rem' }}>
          Please use a desktop or tablet for full functionality.<br />
          For now, update issues manually in the project overview.
        </div>
        <button
          style={{
            background: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.7rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(74,144,226,0.10)',
            marginTop: '0.5rem',
            transition: 'background 0.2s',
            outline: 'none',
            display: 'inline-block'
          }}
          onClick={() => navigate(`/project/${projectId}/overview`)}
        >
          <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
          Back to Overview
        </button>
      </div>
    );
  }

  const handleManageCollaboratorsClick = () => {
    if (project?.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can manage collaborators');
      setShowErrorModal(true);
      return;
    }
    setShowAddCollaborator(true);
  };

  const handleRoleSelect = async (role) => {
    if (!selectedUser) return;
    try {
      setIsAddingCollaborator(true);
      if (isUpdatingRole) {
        await updateCollaboratorRole(projectId, selectedUser._id, role);
      } else {
        await addCollaborator(projectId, { userId: selectedUser._id, role: role });
      }
      const updatedProject = await getProjectById(projectId);
      setProject(updatedProject);
      setShowRoleModal(false);
      setShowAddCollaborator(false);
      setSelectedUser(null);
      setIsUpdatingRole(false);
    } catch (error) {
      setError(error.message || 'Failed to manage collaborator');
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!removingCollaborator) return;
    try {
      const response = await removeCollaborator(projectId, removingCollaborator.userId._id);
      setProject(response.project);
      setShowRemoveModal(false);
      setShowAddCollaborator(false);
      setRemovingCollaborator(null);
    } catch (error) {
      setError('Failed to remove collaborator');
    }
  };

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
          <p>If you wish to leave the project, please use the appropriate option in project settings.</p>
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

  const renderBoard = (boardId, board) => (
    <div
      key={boardId}
      className={`kbn-column ${board.compressed ? 'compressed' : ''}`}
    >
      <div className="kbn-column-header">
        <div className="kbn-column-header-left">
          <h3>{board.name}</h3>
          {!board.compressed && <span className="kbn-task-count">{board.items.length}</span>}
        </div>
        <button
          className="kbn-column-toggle-btn"
          onClick={() => toggleBoardCompress(boardId)}
          title={board.compressed ? "Expand" : "Compress"}
        >
          <i className={`fas fa-${board.compressed ? 'expand' : 'compress'}-alt`}></i>
        </button>
      </div>
      {!board.compressed && (
        <div
          className="kbn-task-list"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, boardId)}
        >
          {board.items.map(task => (
            <div
              key={task._id}
              className="kbn-issue-card"
              draggable
              onDragStart={(e) => handleDragStart(e, task._id, boardId)}
              onDragEnd={handleDragEnd}
              onClick={() => navigate(`/task/${task._id}`)}
            >
              <div className="kbn-issue-card__row kbn-issue-card__row--title">
                <span className="kbn-issue-card__id">#{task.serialNumber}</span>
                <h3>{task.title}</h3>
              </div>
              {project?.projectType === 'collaborative' && task.assignee && (
                <div className="kbn-issue-card__row kbn-issue-card__row--assignee">
                  <div className="kbn-issue-card__assignee">
                    <i className="fas fa-user"></i>
                    <span>{task.assignee?.username || task.assignee?.fullName}</span>
                  </div>
                </div>
              )}
              <div className="kbn-issue-card__row kbn-issue-card__row--meta">
                <span className={`kbn-issue-card__type ${task.type && ['tech', 'review', 'bug', 'feature', 'documentation'].includes(task.type) ? `kbn-issue-card__type--${task.type}` : ''}`}>
                  {task.type === 'tech' ? 'Technical' :
                    task.type === 'review' ? 'Review' :
                      task.type === 'bug' ? 'Bug' :
                        task.type === 'feature' ? 'Feature' :
                          task.type === 'documentation' ? 'Documentation' :
                            task.type ? task.type.charAt(0).toUpperCase() + task.type.slice(1) : 'Task'}
                </span>
                {task.deadline && (
                  <div className="kbn-issue-card__deadline">
                    <i className="far fa-clock"></i>
                    <span>{new Date(task.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
            <span className="po-page-label">Project - Kanban Board</span>
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
            <button className="sidebar-link active">
              <i className="fas fa-columns"></i>
              <span>Kanban Board</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate(`/project/${projectId}/tasks`)}>
              <i className="fas fa-list-ul"></i>
              <span>View Issues</span>
            </button>
            {project.projectType === 'collaborative' && (
              <button className="sidebar-link" onClick={handleManageCollaboratorsClick}>
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

        <div className="project-overview-container kb-main-container">
          <div className="kb-actions-header">
            <div className="kb-header-left">
              {/* Actions space */}
            </div>
            <div className="kb-header-right">
              <button
                className="btn kb-btn-manage"
                onClick={handleManageBoardsClick}
              >
                <i className="fas fa-columns"></i>
                <span>Manage Boards</span>
              </button>
              <button
                className="btn kb-btn-primary"
                onClick={handleAddIssueClick}
              >
                <i className="fas fa-plus"></i>
                <span>Add Issue</span>
              </button>
            </div>
          </div>

          <div className="kbn-board-container">
            {Object.entries(boards).map(([status, board]) => (
              renderBoard(status, board)
            ))}
          </div>

        </div>
      </div>

      {showBoardManager && (
        <div className="board-manager-modal">
          <div className="board-manager-content">
            <button
              className="modal-close-btn"
              onClick={() => setShowBoardManager(false)}
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="board-manager-header">
              <h2>Manage Boards</h2>
            </div>
            <div className="board-list">
              {Object.entries(boards).map(([id, board]) => (
                <div key={id} className="board-item">
                  <span className="board-item-name">{board.name}</span>
                  <div className="board-item-actions">
                    {canDeleteBoard(id, board) && (
                      <button
                        className="delete-board-btn"
                        onClick={() => handleBoardDelete(id)}
                        title="Delete Board"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                    {!canDeleteBoard(id, board) && (
                      <span className="board-status">
                        {isDefaultBoard(id) ? 'Default Board' : 'Has Issues'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form className="add-board-form" onSubmit={handleBoardAdd}>
              <input
                type="text"
                placeholder="New board name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                required
              />
              <button type="submit">Add Board</button>
            </form>
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
                              const isCreator = project.createdBy && project.createdBy._id === user._id;
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="collab-search-field"
                  />
                  {searchResults.length > 0 && (
                    <div className="collab-search-results">
                      {searchResults.map(user => (
                        <div
                          key={user._id}
                          className="collab-search-item"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
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

      {showAddIssueModal && (
        <div className="modal-overlay issue-modal-overlay">
          <div className="modal-content issue-modal issue-modal--kanban">
            <div className="modal-header issue-modal__header">
              <h2 className="issue-modal__title">Add New Issue</h2>
              <button
                className="modal-close issue-modal__close-btn"
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
                &times;
              </button>
            </div>
            <div className="modal-body issue-modal__body">
              <form onSubmit={handleIssueFormSubmit} className="issue-form issue-form--kanban">
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

                {showCustomType && (
                  <div className="form-group issue-form__group">
                    <label htmlFor="customType">Custom Type</label>
                    <input
                      type="text"
                      id="customType"
                      name="customType"
                      value={issueFormData.customType}
                      onChange={handleIssueFormChange}
                      className="form-control custom-type-input"
                      placeholder="Enter custom issue type"
                      required
                    />
                  </div>
                )}

                {project?.projectType === 'collaborative' && (
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

      {selectedIssue && (
        <div className="task-modal">
        </div>
      )}
      <Footer />
    </div>
  );
};

export default KanbanBoard; 