import React, { useState, useEffect } from 'react';
import { getProjectActivities } from '../api/projectApi';
import '../styles/ProjectActivityWidget.css';

const ProjectActivityWidget = ({ projectId, projectType }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const data = await getProjectActivities(projectId, { limit: 10 });
                setActivities(data.activities);
                setError(null);
            } catch (err) {
                console.error('Error fetching activities:', err);
                setError('Failed to load activities');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchActivities();
        }
    }, [projectId]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="activity-widget loading">
                <div className="activity-skeleton"></div>
                <div className="activity-skeleton"></div>
                <div className="activity-skeleton"></div>
            </div>
        );
    }

    if (error) {
        return <div className="activity-widget error">{error}</div>;
    }

    return (
        <div className="activity-widget">
            <div className="activity-list">
                {activities.length === 0 ? (
                    <div className="empty-state">No recent activity</div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="activity-row">
                            <div className="activity-content-wrapper">
                                <p className="activity-description">
                                    {projectType !== 'personal' && (
                                        <span className="actor-username">@{activity.actor.username}</span>
                                    )} {activity.description}
                                </p>
                                <span className="activity-time">
                                    {formatDateTime(activity.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProjectActivityWidget;
