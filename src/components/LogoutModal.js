import React from 'react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="v2-logout-wrapper">
            <div className="v2-logout-container">
                <div className="v2-logout-title-area">
                    <h2>Confirm Logout</h2>
                </div>
                <div className="v2-logout-main-content">
                    <p>Are you sure you want to log out?</p>
                    <div className="v2-logout-action-row">
                        <div className="v2-logout-btn-group">
                            <button className="cancel-button" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="logout-confirm-button" onClick={onConfirm}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
