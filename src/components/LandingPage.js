import React from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <section className="landing-header">
        <div className="header-logo">
          <img src="/logo.png" alt="KarmaSync Logo" className="app-logo" />
        </div>
        <div className="header-text">
          <h1 className="app-title">KarmaSync</h1>
          <p className="app-tagline">Agile Project Management Made Simple</p>
          <div className="header-cta">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-about">
        <div className="about-content">
          <h2>About KarmaSync</h2>
          <p>
          Karma Sync is a lightweight project and task management tool for individuals and teams. Plan projects, track progress, and collaborate effortlessly. It also includes a personal to-do manager to organize daily tasks, prioritize goals, and boost productivity — all from one clean dashboard.
                   </p>
        </div>
      </section>

      <section className="landing-team">
        <h2>Our Team</h2>
        <div className="team-members">
          <div className="team-member">
            <p>B Suraj Patra</p>
          </div>
          <div className="team-member">
            <p>G Sri Krishna Sudhindra</p>
          </div>
          <div className="team-member">
            <p>Alimilla Abhinandan</p>
          </div>
          <div className="team-member">
            <p>P Bhavya Varsha</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LandingPage; 