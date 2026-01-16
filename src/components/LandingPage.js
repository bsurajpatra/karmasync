import React from 'react';
import { Link } from 'react-router-dom';
import { FaTasks, FaUsers, FaChartLine, FaCheckCircle, FaArrowRight, FaBrain, FaClipboardList, FaRunning, FaBookOpen, FaComments, FaHistory, FaCalendarCheck, FaLock, FaUserCircle } from 'react-icons/fa';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-bg-blob blob-1"></div>
      <div className="landing-bg-blob blob-2"></div>

      <section className="landing-hero">
        <div className="hero-text-content">
          <h1 className="hero-title">
            Agile Project Management <span className="gradient-text">Redefined.</span>
          </h1>
          <p className="hero-tagline">
            KarmaSync helps teams plan, track, and sync their workflow with effortless precision.
            Built for speed, simplicity, and results.
          </p>
          <div className="hero-cta-group">
            <Link to="/signup" className="btn-premium btn-primary-premium">
              Get Started Free <FaArrowRight size={14} />
            </Link>
            <Link to="/login" className="btn-premium" style={{ color: '#4a90e2', border: '2px solid #4a90e2' }}>
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/hero-agile.png" alt="KarmaSync Agile Dashboard" className="hero-main-img" />
        </div>
      </section>

      <section className="landing-features">
        <div className="section-header">
          <h2 className="section-title">Everything you need for Agile success</h2>
          <p>Streamline your process with tools designed for modern development teams.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaBrain />
            </div>
            <h3>Personal & Team Projects</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaUserCircle />
            </div>
            <h3>Role-Based Access Control</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaClipboardList />
            </div>
            <h3>Kanban Task Workflow</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaRunning />
            </div>
            <h3>Sprint Planning & Tracking</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaBookOpen />
            </div>
            <h3>User Stories with Progress</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaTasks />
            </div>
            <h3>Smart Task Management</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaComments />
            </div>
            <h3>Comments & @Mentions</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaHistory />
            </div>
            <h3>Project Activity Timeline</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaCalendarCheck />
            </div>
            <h3>Personal Daily To-Dos</h3>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper">
              <FaLock />
            </div>
            <h3>Secure Authentication</h3>
          </div>
        </div>
      </section>

      <section className="landing-agile">
        <div className="agile-content">
          <h2 className="section-title">Built by Agilists, for Agilists</h2>
          <p style={{ fontSize: '1.2rem', color: '#4a5568', marginBottom: '2rem' }}>
            We understand the friction in project management. KarmaSync is designed to disappear into your workflow,
            letting you focus on what matters: shipping great products.
          </p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Lightweight & Fast', 'Modern & Responsive', 'Collaborative First', 'User-Centric Design'].map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                <FaCheckCircle color="#4a90e2" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="agile-visual">
          <div className="agile-mock-card card-1">
            <FaTasks size={20} color="#4a90e2" />
            <div>
              <div style={{ fontWeight: 600 }}>Design landing page</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>In Progress • Assigned to Suraj</div>
            </div>
          </div>
          <div className="agile-mock-card card-2">
            <FaUsers size={20} color="#70a1ff" />
            <div>
              <div style={{ fontWeight: 600 }}>Sync with team members</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>Done • Collaboration</div>
            </div>
          </div>
          <div className="agile-mock-card card-3">
            <FaChartLine size={20} color="#2c3e50" />
            <div>
              <div style={{ fontWeight: 600 }}>Analyze sprint results</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>To Do • Analytics</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-team-modern">
        <div className="section-header">
          <h2 className="section-title">Our Dedicated Team</h2>
          <p>The visionaries behind KarmaSync.</p>
        </div>
        <div className="team-grid-modern">
          {[
            { name: "B Suraj Patra", init: "SP" },
            { name: "G Sri Krishna Sudhindra", init: "KS" },
            { name: "Alimilla Abhinandan", init: "AA" },
            { name: "P Bhavya Varsha", init: "BV" }
          ].map((member, i) => (
            <div className="team-card-modern" key={i}>
              <div className="member-avatar">{member.init}</div>
              <h4 style={{ margin: 0 }}>{member.name}</h4>
              <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>Engineer / Designer</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta-finale" style={{ padding: '8rem 5%', textAlign: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Ready to sync your team?</h2>
        <p style={{ marginBottom: '2.5rem', color: '#4a5568' }}>Join hundreds of teams managing projects better today.</p>
        <Link to="/signup" className="btn-premium btn-primary-premium btn-finale">
          Get Started For Free <FaArrowRight size={14} />
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;