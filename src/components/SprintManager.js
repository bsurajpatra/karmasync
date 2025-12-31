import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getSprintsByProject,
    createSprint,
    updateSprint,
    updateSprintStatus,
    assignTasksToSprint,
    removeTasksFromSprint
} from '../api/sprintApi';
import { getTasks } from '../api/taskApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/SprintManager.css';

const SprintManager = ({ projectId, currentUserRole }) => {
    const navigate = useNavigate();
    const [sprints, setSprints] = useState([]);
    const [backlog, setBacklog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedSprint, setSelectedSprint] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [sprintTasks, setSprintTasks] = useState([]);
    const [assignmentMode, setAssignmentMode] = useState('assign'); // 'assign' or 'remove'
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        goal: '',
        startDate: '',
        endDate: ''
    });
    const [warnings, setWarnings] = useState([]);
    const [sprintSearchTerm, setSprintSearchTerm] = useState('');
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningTasks, setWarningTasks] = useState([]);
    const isManager = currentUserRole === 'manager';

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [sprintsData, tasksData] = await Promise.all([
                getSprintsByProject(projectId),
                getTasks(projectId)
            ]);
            setSprints(sprintsData);
            setBacklog(tasksData.filter(t => !t.sprintId));
        } catch (error) {
            console.error('Error fetching sprint data:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateClick = () => {
        setSelectedSprint(null);
        setFormData({
            name: '',
            description: '',
            goal: '',
            startDate: '',
            endDate: ''
        });
        setShowModal(true);
    };

    const handleEditClick = (sprint) => {
        setSelectedSprint(sprint);
        setFormData({
            name: sprint.name,
            description: sprint.description || '',
            goal: sprint.goal || '',
            startDate: sprint.startDate.split('T')[0],
            endDate: sprint.endDate.split('T')[0]
        });
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedSprint) {
                const result = await updateSprint(selectedSprint._id, formData);
                if (result.warnings) setWarnings(result.warnings);
            } else {
                await createSprint({ ...formData, projectId });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert(error.message || 'Error saving sprint');
        }
    };

    const handleStatusChange = async (sprintId, newStatus) => {
        try {
            await updateSprintStatus(sprintId, newStatus);
            fetchData();
        } catch (error) {
            alert(error.message || 'Error updating status');
        }
    };

    const handleAssignClick = async (sprint, mode = 'assign') => {
        setSelectedSprint(sprint);
        setSelectedTasks([]);
        setAssignmentMode(mode);

        try {
            const response = await getTasks(projectId);
            if (mode === 'remove' || ['completed', 'cancelled'].includes(sprint.status)) {
                // Fetch tasks currently in this sprint
                setSprintTasks(response.filter(t => t.sprintId === sprint._id || (t.sprintId && t.sprintId._id === sprint._id)));
            } else {
                // Backlog is handled by fetchData/effect, but we can ensure it's fresh
                setBacklog(response.filter(t => !t.sprintId));
            }
        } catch (error) {
            console.error('Error fetching tasks for assignment:', error);
        }

        setShowAssignModal(true);
    };

    const toggleTaskSelection = (taskId) => {
        setSelectedTasks(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleAssignSubmit = async () => {
        try {
            if (assignmentMode === 'remove' || ['completed', 'cancelled'].includes(selectedSprint.status)) {
                await removeTasksFromSprint(selectedSprint._id, selectedTasks);
                setShowAssignModal(false);
                fetchData();
            } else {
                // Check for deadline warnings before assigning
                const issuesWithWarnings = backlog.filter(t =>
                    selectedTasks.includes(t._id) &&
                    t.deadline &&
                    new Date(t.deadline) > new Date(selectedSprint.endDate)
                );

                if (issuesWithWarnings.length > 0) {
                    setWarningTasks(issuesWithWarnings);
                    setShowWarningModal(true);
                } else {
                    await proceedWithAssignment();
                }
            }
        } catch (error) {
            alert(error.message || 'Error saving task assignments');
        }
    };

    const proceedWithAssignment = async () => {
        try {
            const result = await assignTasksToSprint(selectedSprint._id, selectedTasks);
            setShowAssignModal(false);
            setShowWarningModal(false);
            fetchData();
        } catch (error) {
            alert(error.message || 'Error assigning tasks');
        }
    };

    const filteredSprints = sprints.filter(s =>
        s.name.toLowerCase().includes(sprintSearchTerm.toLowerCase()) ||
        (s.goal && s.goal.toLowerCase().includes(sprintSearchTerm.toLowerCase()))
    );

    if (loading) return <LoadingAnimation message="Loading sprints..." />;

    return (
        <div className="sprints-container">
            <div className="sprints-header">
                <div className="sprints-header-left">
                    <h2>Sprints</h2>
                    <div className="sprint-search-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search sprints..."
                            value={sprintSearchTerm}
                            onChange={(e) => setSprintSearchTerm(e.target.value)}
                            className="sprint-search-input"
                        />
                    </div>
                </div>
                {isManager && (
                    <button className="btn btn-primary" onClick={handleCreateClick}>
                        <i className="fas fa-plus"></i> Create Sprint
                    </button>
                )}
            </div>

            {filteredSprints.length === 0 ? (
                <div className="no-sprints">
                    <i className="fas fa-running"></i>
                    <p>{sprintSearchTerm ? 'No sprints match your search.' : 'No sprints planned yet.'}</p>
                </div>
            ) : (
                <div className="sprints-grid">
                    {filteredSprints.map(sprint => (
                        <div key={sprint._id} className={`sprint-card ${sprint.status}`}>
                            <span className={`sprint-status-badge ${sprint.status}`}>{sprint.status}</span>
                            <div className="sprint-info">
                                <h3>{sprint.name}</h3>
                                {sprint.goal && <p className="sprint-goal">"{sprint.goal}"</p>}
                                <div className="sprint-dates">
                                    <i className="far fa-calendar-alt"></i>
                                    <span>{new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="sprint-actions">
                                {isManager && (
                                    <>
                                        <button className="sprint-btn-sm" onClick={() => handleEditClick(sprint)}>
                                            <i className="fas fa-edit"></i> Edit
                                        </button>
                                        <div className="status-dropdown">
                                            <button className="sprint-btn-sm">
                                                <i className="fas fa-sync-alt"></i> Status
                                            </button>
                                            <div className="status-menu">
                                                {['planned', 'active', 'completed', 'cancelled'].filter(s => s !== sprint.status).map(status => (
                                                    <button
                                                        key={status}
                                                        className="status-option"
                                                        onClick={() => handleStatusChange(sprint._id, status)}
                                                    >
                                                        Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                                {['planned', 'active'].includes(sprint.status) && (
                                    <div className="sprint-assign-actions">
                                        <button className="sprint-btn-sm sprint-btn-primary" onClick={() => handleAssignClick(sprint, 'assign')}>
                                            <i className="fas fa-plus"></i> Assign
                                        </button>
                                        <button className="sprint-btn-sm" onClick={() => handleAssignClick(sprint, 'remove')}>
                                            <i className="fas fa-minus"></i> Remove
                                        </button>
                                    </div>
                                )}
                                <button
                                    className="sprint-btn-sm"
                                    onClick={() => navigate(`/project/${projectId}/tasks?sprint=${sprint._id}`)}
                                    title="View tasks assigned to this sprint"
                                >
                                    <i className="fas fa-external-link-alt"></i> Issues
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="sprint-modal-overlay">
                    <div className="sprint-modal-content">
                        <div className="sprint-modal-header">
                            <h2>{selectedSprint ? 'Edit Sprint' : 'Create New Sprint'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="sprint-modal-body">
                                <div className="sprint-form">
                                    <div className="sprint-form-group">
                                        <label>Sprint Name</label>
                                        <input
                                            type="text"
                                            className="sprint-input"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="sprint-form-group">
                                        <label>Sprint Goal</label>
                                        <input
                                            type="text"
                                            className="sprint-input"
                                            placeholder="What is the main objective?"
                                            value={formData.goal}
                                            onChange={e => setFormData({ ...formData, goal: e.target.value })}
                                        />
                                    </div>
                                    <div className="sprint-row">
                                        <div className="sprint-form-group">
                                            <label>Start Date</label>
                                            <input
                                                type="date"
                                                className="sprint-input"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="sprint-form-group">
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                className="sprint-input"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="sprint-form-group">
                                        <label>Description</label>
                                        <textarea
                                            className="sprint-input"
                                            rows="3"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="sprint-modal-footer">
                                <button type="button" className="sprint-btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="sprint-btn-sm sprint-btn-primary">
                                    {selectedSprint ? 'Update Sprint' : 'Create Sprint'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Assignment Modal */}
            {showAssignModal && (
                <div className="sprint-modal-overlay">
                    <div className="sprint-modal-content task-assignment-modal">
                        <div className="sprint-modal-header">
                            <h2>{assignmentMode === 'assign' ? `Assign Tasks to ${selectedSprint.name}` : `Remove Tasks from ${selectedSprint.name}`}</h2>
                            <button className="modal-close" onClick={() => setShowAssignModal(false)}>&times;</button>
                        </div>
                        <div className="sprint-modal-body">
                            {assignmentMode === 'assign' ? (
                                <>
                                    <p className="sprint-goal">Select tasks from the backlog to add to this sprint.</p>
                                    <div className="backlog-list">
                                        {backlog.length === 0 ? (
                                            <p>No tasks available in backlog.</p>
                                        ) : (
                                            backlog.map(task => {
                                                const isDelayed = task.deadline && new Date(task.deadline) > new Date(selectedSprint.endDate);
                                                return (
                                                    <div
                                                        key={task._id}
                                                        className={`backlog-item ${selectedTasks.includes(task._id) ? 'selected' : ''}`}
                                                        onClick={() => toggleTaskSelection(task._id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="backlog-checkbox"
                                                            checked={selectedTasks.includes(task._id)}
                                                            readOnly
                                                        />
                                                        <div className="backlog-item-info">
                                                            <div className="backlog-item-title">{task.title}</div>
                                                            <div className="backlog-item-meta">
                                                                <span>Status: {task.status}</span>
                                                                {task.deadline && (
                                                                    <span className={isDelayed ? 'deadline-warning' : ''}>
                                                                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isDelayed && (
                                                            <div className="deadline-warning" title="Deadline exceeds sprint end date">
                                                                <i className="fas fa-exclamation-triangle"></i> Warning
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="sprint-goal">Select tasks to remove from this sprint and return to the backlog.</p>
                                    <div className="backlog-list">
                                        {sprintTasks.length === 0 ? (
                                            <p>No tasks found in this sprint.</p>
                                        ) : (
                                            sprintTasks.map(task => (
                                                <div
                                                    key={task._id}
                                                    className={`backlog-item ${selectedTasks.includes(task._id) ? 'selected' : ''}`}
                                                    onClick={() => toggleTaskSelection(task._id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="backlog-checkbox"
                                                        checked={selectedTasks.includes(task._id)}
                                                        readOnly
                                                    />
                                                    <div className="backlog-item-info">
                                                        <div className="backlog-item-title">{task.title}</div>
                                                        <div className="backlog-item-meta">
                                                            <span>Status: {task.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        {((assignmentMode === 'assign' && backlog.length > 0) ||
                            (assignmentMode === 'remove' && sprintTasks.length > 0)) && (
                                <div className="sprint-modal-footer">
                                    <button className="sprint-btn-sm" onClick={() => setShowAssignModal(false)}>Cancel</button>
                                    <button
                                        className="sprint-btn-sm sprint-btn-primary"
                                        onClick={handleAssignSubmit}
                                        disabled={selectedTasks.length === 0}
                                    >
                                        {assignmentMode === 'remove' ? 'Remove Selected Tasks' : 'Assign Selected Tasks'}
                                    </button>
                                </div>
                            )}
                    </div>
                </div>
            )}

            {/* Warning Modal */}
            {showWarningModal && (
                <div className="sprint-modal-overlay">
                    <div className="sprint-modal-content warning-modal">
                        <div className="sprint-modal-header warning">
                            <h2><i className="fas fa-exclamation-triangle"></i> Deadline Warnings</h2>
                            <button className="modal-close" onClick={() => setShowWarningModal(false)}>&times;</button>
                        </div>
                        <div className="sprint-modal-body">
                            <p>The following tasks have deadlines that exceed the sprint end date ({new Date(selectedSprint.endDate).toLocaleDateString()}):</p>
                            <div className="warning-tasks-list">
                                {warningTasks.map(task => (
                                    <div key={task._id} className="warning-task-item">
                                        <span className="warning-task-title">{task.title}</span>
                                        <span className="warning-task-date">Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="warning-confirmation-text">Do you still want to assign these tasks to the sprint?</p>
                        </div>
                        <div className="sprint-modal-footer">
                            <button className="sprint-btn-sm" onClick={() => setShowWarningModal(false)}>Cancel</button>
                            <button className="sprint-btn-sm sprint-btn-primary" onClick={proceedWithAssignment}>
                                Yes, Assign Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SprintManager;
