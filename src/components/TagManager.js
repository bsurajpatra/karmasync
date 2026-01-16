import React, { useState } from 'react';
import { addProjectTag, deleteProjectTag } from '../api/projectApi';
import '../styles/Tags.css';

const TAG_COLORS = ['blue', 'purple', 'green', 'yellow', 'orange', 'red', 'gray', 'black'];

const TagManager = ({ projectId, projectTags, onTagsChange }) => {
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        setLoading(true);
        setError('');
        try {
            const addedTag = await addProjectTag(projectId, {
                name: newTagName,
                color: selectedColor
            });
            onTagsChange([...projectTags, addedTag]);
            setNewTagName('');
            setSelectedColor(TAG_COLORS[0]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add tag');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTag = async (tagId) => {
        if (!window.confirm('Are you sure you want to delete this tag? It will be removed from all tasks.')) return;

        try {
            await deleteProjectTag(projectId, tagId);
            onTagsChange(projectTags.filter(t => t._id !== tagId));
        } catch (err) {
            alert('Failed to delete tag');
        }
    };

    return (
        <div className="tag-manager-container settings-group">
            <div className="section-header settings-header-left" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Project Tags</h2>
            </div>

            <div className="tag-list" style={{ marginBottom: '2rem' }}>
                {projectTags.length > 0 ? (
                    projectTags.map(tag => (
                        <div key={tag._id} className="tag-item">
                            <div className={`tag-color-dot ${tag.color}`}></div>
                            <span className="tag-name">{tag.name}</span>
                            <button
                                className="btn-delete-tag"
                                onClick={() => handleDeleteTag(tag._id)}
                                title="Delete Tag"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>No custom tags defined. Standard tags are available.</p>
                )}
            </div>

            <form className="add-tag-form settings-form" onSubmit={handleAddTag} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <div className="form-group">
                    <label>Add New Tag</label>
                    <input
                        type="text"
                        className="po-edit-input"
                        placeholder="e.g. documentation"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                    />
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label>Select Tag Color</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="color-palette" style={{ padding: '8px 0' }}>
                            {TAG_COLORS.map(color => (
                                <div
                                    key={color}
                                    className={`color-option ${color} ${selectedColor === color ? 'selected' : ''}`}
                                    onClick={() => setSelectedColor(color)}
                                    title={color}
                                    style={{ width: '30px', height: '30px' }}
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            className="settings-submit-btn"
                            disabled={loading || !newTagName.trim()}
                            style={{ margin: 0, height: '42px', whiteSpace: 'nowrap' }}
                        >
                            {loading ? 'Adding...' : 'Add Tag'}
                        </button>
                    </div>
                </div>
            </form>
            {error && <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '12px' }}>{error}</p>}
        </div>
    );
};

export default TagManager;
