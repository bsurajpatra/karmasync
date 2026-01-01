import React, { useState, useEffect, useCallback } from 'react';
import * as storyApi from '../api/userStoryApi';
import { getSprintsByProject } from '../api/sprintApi';
import { getTasks } from '../api/taskApi';
import '../styles/StoryManager.css';

const StoryManager = ({ projectId, currentUserRole }) => {
    const [stories, setStories] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedStory, setSelectedStory] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Draft',
        sprintId: '',
        taskIds: []
    });

    const isManager = currentUserRole === 'manager';

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [storiesData, sprintsData, tasksData] = await Promise.all([
                storyApi.getStoriesByProject(projectId),
                getSprintsByProject(projectId),
                getTasks(projectId)
            ]);
            setStories(storiesData);
            setSprints(sprintsData);
            setTasks(tasksData);
            setError(null);
        } catch (err) {
            setError('Failed to load project stories');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (story = null) => {
        if (story) {
            setSelectedStory(story);
            setFormData({
                title: story.title,
                description: story.description || '',
                status: story.status || 'Draft',
                sprintId: story.sprintId?._id || story.sprintId || '',
                taskIds: tasks.filter(t => (t.storyId?._id || t.storyId) === story._id).map(t => t._id)
            });
        } else {
            setSelectedStory(null);
            setFormData({
                title: '',
                description: '',
                status: 'Draft',
                sprintId: '',
                taskIds: []
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedStory(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedStory) {
                await storyApi.updateStory(selectedStory._id, formData);
            } else {
                await storyApi.createStory({ ...formData, projectId });
            }
            await fetchData();
            handleCloseModal();
        } catch (err) {
            setError(err.message || 'Failed to save story');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this story? Tasks will be unlinked.')) {
            try {
                await storyApi.deleteStory(id);
                await fetchData();
            } catch (err) {
                setError('Failed to delete story');
            }
        }
    };

    if (loading && stories.length === 0) return (
        <div className="loading-story-state">
            <i className="fas fa-circle-notch fa-spin"></i>
            <span style={{ marginLeft: '10px' }}>Loading stories...</span>
        </div>
    );

    return (
        <div className="stories-container">
            <div className="stories-header">
                <div className="stories-header-info">
                    <h2>User Stories</h2>
                    <p>Organize related tasks into meaningful user-focused goals</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {isManager && (
                        <button className="btn-premium btn-premium-primary" onClick={() => handleOpenModal()}>
                            <i className="fas fa-plus"></i> New Story
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-message" style={{ margin: '1rem 0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                        {error}
                    </div>
                    <button onClick={() => fetchData()} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}>Retry</button>
                </div>
            )}

            <div className="stories-grid">
                {stories.map(story => (
                    <div key={story._id} className={`story-card status-${(story.status || 'Draft').replace(' ', '-')}`}>
                        <span className={`story-status-badge status-badge-${(story.status || 'Draft').replace(' ', '-')}`}>
                            {story.status || 'Draft'}
                        </span>

                        <div className="story-info">
                            <h3>{story.title}</h3>
                            <p className="story-description">{story.description}</p>
                        </div>

                        <div className="story-progress-section">
                            <div className="progress-header">
                                <span>COMPLETION</span>
                                <span>{story.progress || 0}%</span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className="progress-thumb"
                                    style={{ width: `${story.progress || 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="story-footer-meta">
                            <div className="meta-pill">
                                <i className="fas fa-tasks"></i>
                                <span>{tasks.filter(t => (t.storyId?._id || t.storyId) === (story._id || story)).length} Tasks</span>
                            </div>
                            {story.sprintId && (
                                <div className="meta-pill">
                                    <i className="fas fa-running"></i>
                                    <span>{story.sprintId.name || 'Active Sprint'}</span>
                                </div>
                            )}
                        </div>

                        <div className="story-card-actions">
                            <button className="btn-premium btn-premium-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => handleOpenModal(story)}>
                                <i className="fas fa-eye"></i> View Details
                            </button>
                            {isManager && (
                                <button className="btn-premium btn-premium-text btn-premium-danger" onClick={() => handleDelete(story._id)} title="Delete Story">
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {stories.length === 0 && !error && !loading && (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: '#f8fafc',
                        borderRadius: '20px',
                        border: '2px dashed #e2e8f0',
                        color: '#94a3b8'
                    }}>
                        <i className="fas fa-book-open" style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.5 }}></i>
                        <h3>No User Stories yet</h3>
                        <p>Create stories to group your issues and track progress at a higher level.</p>
                        {isManager && (
                            <button className="btn-premium btn-premium-primary" style={{ margin: '1.5rem auto' }} onClick={() => handleOpenModal()}>
                                <i className="fas fa-plus"></i> Create First Story
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="story-modal-overlay">
                    <div className="story-modal-box">
                        <div className="story-modal-head">
                            <h2>{selectedStory ? 'Story Details' : 'Create New User Story'}</h2>
                            <button className="modal-close-button" onClick={handleCloseModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="story-modal-scroll">
                                <div className="story-form-layout">
                                    <div className="form-item">
                                        <label>TITLE</label>
                                        <input
                                            className="form-input-styled"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            required
                                            placeholder="e.g., User can manage their profile settings"
                                            disabled={!isManager}
                                        />
                                    </div>
                                    <div className="form-item">
                                        <label>DESCRIPTION</label>
                                        <textarea
                                            className="form-input-styled"
                                            rows="4"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Provide context and acceptance criteria..."
                                            disabled={!isManager}
                                        />
                                    </div>
                                    <div className="form-item">
                                        <label>STATUS</label>
                                        <select
                                            className="form-input-styled"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            disabled={!isManager}
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Ready">Ready</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </div>
                                    <div className="form-item">
                                        <label>ASSIGN TO SPRINT</label>
                                        <select
                                            className="form-input-styled"
                                            value={formData.sprintId}
                                            onChange={e => setFormData({ ...formData, sprintId: e.target.value })}
                                            disabled={!isManager}
                                        >
                                            <option value="">Backlog (No specific sprint)</option>
                                            {sprints.map(s => (
                                                <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="tasks-selection-section">
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block' }}>
                                            ASSOCIATE TASKS
                                        </label>
                                        <div className="tasks-preview-list" style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #f1f5f9', borderRadius: '12px', background: '#fcfcfc' }}>
                                            {tasks.map(task => {
                                                const isLinkedToThisStory = task.storyId && (task.storyId?._id || task.storyId) === selectedStory?._id;
                                                const isLinkedToAnotherStory = task.storyId && (task.storyId?._id || task.storyId) !== selectedStory?._id;

                                                if (isLinkedToAnotherStory) return null;

                                                const isChecked = formData.taskIds.includes(task._id);

                                                return (
                                                    <div
                                                        key={task._id}
                                                        className={`preview-task-card ${isChecked ? 'selected' : ''}`}
                                                        style={{
                                                            cursor: isManager ? 'pointer' : 'default',
                                                            opacity: isManager ? 1 : 0.8,
                                                            marginBottom: '0.5rem',
                                                            borderLeft: isChecked ? '4px solid #4a90e2' : '1px solid #f1f5f9'
                                                        }}
                                                        onClick={() => {
                                                            if (!isManager) return;
                                                            const newIds = isChecked
                                                                ? formData.taskIds.filter(id => id !== task._id)
                                                                : [...formData.taskIds, task._id];
                                                            setFormData({ ...formData, taskIds: newIds });
                                                        }}
                                                    >
                                                        <div className={`task-dot task-dot-${task.status}`}></div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{task.title}</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>#{task.serialNumber} • {task.status}</div>
                                                        </div>
                                                        {isManager && (
                                                            <div style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '4px',
                                                                border: '2px solid #e2e8f0',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: isChecked ? '#4a90e2' : 'white',
                                                                borderColor: isChecked ? '#4a90e2' : '#e2e8f0'
                                                            }}>
                                                                {isChecked && <i className="fas fa-check" style={{ color: 'white', fontSize: '0.65rem' }}></i>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {tasks.filter(task => !(task.storyId && (task.storyId?._id || task.storyId) !== (selectedStory?._id || selectedStory))).length === 0 && (
                                                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No available tasks to link.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="story-modal-actions">
                                <button type="button" className="btn-premium btn-premium-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                {isManager && (
                                    <button type="submit" className="btn-premium btn-premium-primary">
                                        {selectedStory ? 'Update Story' : 'Create Story'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryManager;
