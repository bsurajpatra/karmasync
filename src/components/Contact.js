import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import emailjs from "@emailjs/browser";
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../api/authApi';
import { Link } from 'react-router-dom';
import "react-toastify/dist/ReactToastify.css";
import '../styles/ProjectOverview.css';
import '../styles/ContactCompact.css';
import '../styles/Dashboard.css';
import LogoutModal from './LogoutModal';
import Footer from './Footer';

const Contact = () => {
    const { logout, user } = useAuth();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const navigate = useNavigate();
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await getCurrentUser();
                setUserDetails(response.data);
            } catch (error) {
                console.error("Error fetching user details:", error);
                toast.error("Failed to load user details");
            }
        };
        fetchUserDetails();
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!message) {
            return toast.error("Please enter your message");
        }

        setLoading(true);
        try {
            const templateParams = {
                from_name: userDetails?.fullName || user?.fullName,
                from_email: userDetails?.email || user?.email,
                message: message
            };

            await emailjs.send(
                process.env.REACT_APP_EMAILJS_SERVICE_ID,
                process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
                templateParams,
                process.env.REACT_APP_EMAILJS_PUBLIC_API
            );

            setMessage("");
            toast.success("Message sent successfully!");
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="projects-wrapper">
            <header className="po-header">
                <div className="po-header-content">
                    <Link to="/dashboard" className="po-logo-container">
                        <img src="/logo.png" alt="KarmaSync" className="po-logo" />
                    </Link>
                    <div className="po-divider"></div>
                    <div className="po-titles">
                        <span className="po-page-label">Support</span>
                        <div className="po-project-title-wrapper">
                            <h1 className="po-project-name">Contact Us</h1>
                        </div>
                    </div>
                    <button className="logout-button" onClick={() => setShowLogoutModal(true)}>
                        <i className="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </header>

            <div className="projects-body">
                <div className="projects-sidebar">
                    <nav className="sidebar-nav">
                        <Link to="/projects" className="sidebar-link">
                            <i className="fas fa-project-diagram"></i>
                            <span>Projects</span>
                        </Link>
                        <Link to="/todos" className="sidebar-link">
                            <i className="fas fa-tasks"></i>
                            <span>My To-dos</span>
                        </Link>
                        <Link to="/profile" className="sidebar-link">
                            <i className="fas fa-user"></i>
                            <span>Profile</span>
                        </Link>
                        <Link to="/contact" className="sidebar-link active" style={{ background: 'linear-gradient(135deg, #4a90e2 0%, #70a1ff 100%)', color: 'white', boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)' }}>
                            <i className="fas fa-envelope" style={{ color: 'white' }}></i>
                            <span>Contact Us</span>
                        </Link>
                    </nav>
                </div>

                <div className="project-overview-container">
                    <div className="ct-container">
                        <div className="ct-info-section">
                            <div className="ct-header">
                                <h2>Get in Touch</h2>
                                <p className="ct-subtitle">We'd love to hear from you</p>
                            </div>
                            <p className="ct-description">
                                Whether it's feedback, support, feature ideas, or collaboration — we're here for every sprint. Let's keep building better, together.
                            </p>

                            <div className="ct-details">
                                <div className="ct-item">
                                    <i className="fas fa-envelope"></i>
                                    <span>karmasync.official@gmail.com</span>
                                </div>
                                <div className="ct-item">
                                    <i className="fas fa-phone"></i>
                                    <span>+91 876 3232 589</span>
                                </div>
                            </div>
                        </div>

                        <div className="ct-form-section">
                            <form onSubmit={submitHandler} className="ct-form">
                                <div className="ct-form-group">
                                    <label className="ct-label">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="ct-textarea"
                                        placeholder="Write your message here..."
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="ct-btn"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane"></i> Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer position="bottom-right" theme="light" />
            <Footer />
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={async () => {
                    try {
                        await logout();
                        navigate('/');
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                }}
            />
        </div>
    );
};

export default Contact; 