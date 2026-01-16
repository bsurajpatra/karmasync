import React, { useState, useRef, useEffect } from 'react';
import '../styles/Tags.css';

// const TAG_COLORS = ['blue', 'purple', 'green', 'yellow', 'orange', 'red', 'gray', 'black']; // Unused

const TagSelector = ({ projectTags, selectedTagIds, onChange, label = "Tags", placeholder = "Select tags...", compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTag = (tagId) => {
        const newSelection = selectedTagIds.includes(tagId)
            ? selectedTagIds.filter(id => id !== tagId)
            : [...selectedTagIds, tagId];
        onChange(newSelection);
    };

    const removeTag = (e, tagId) => {
        e.stopPropagation();
        onChange(selectedTagIds.filter(id => id !== tagId));
    };

    const selectedTags = projectTags.filter(tag => selectedTagIds.includes(tag._id));

    return (
        <div className={`tag-selector-container ${compact ? 'tag-selector--compact' : ''}`} ref={containerRef}>
            {label && <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2d3748', marginBottom: '8px', display: 'block' }}>{label}</label>}
            <div
                className="tag-selector-input-wrapper"
                onClick={() => setIsOpen(!isOpen)}
                style={compact ? { minHeight: '36px', padding: '4px 10px' } : {}}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
                    {selectedTags.length > 0 ? (
                        selectedTags.map(tag => (
                            <span key={tag._id} className={`selected-tag-item ${tag.color}`} style={compact ? { fontSize: '0.7rem', padding: '2px 6px' } : {}}>
                                {tag.name}
                                <span className="selected-tag-remove" onClick={(e) => removeTag(e, tag._id)}>&times;</span>
                            </span>
                        ))
                    ) : (
                        <span style={{ color: '#a0aec0', fontSize: compact ? '0.85rem' : '0.95rem', padding: '2px 0' }}>{placeholder}</span>
                    )}
                </div>
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ marginLeft: '8px', alignSelf: 'center', fontSize: '0.8rem', color: '#a0aec0' }}></i>
            </div>

            {isOpen && (
                <div className="tag-dropdown">
                    {projectTags.length > 0 ? (
                        projectTags.map(tag => (
                            <div
                                key={tag._id}
                                className={`tag-option ${selectedTagIds.includes(tag._id) ? 'selected' : ''}`}
                                onClick={() => toggleTag(tag._id)}
                            >
                                <div className={`tag-color-dot ${tag.color}`}></div>
                                {tag.name}
                                {selectedTagIds.includes(tag._id) && <i className="fas fa-check" style={{ marginLeft: 'auto' }}></i>}
                            </div>
                        ))
                    ) : (
                        <div className="no-tags-msg">No tags defined in project</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TagSelector;
