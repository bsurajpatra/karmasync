import React from "react";
// import { Link } from "react-router-dom"; // Unused

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="footer-content-centered">
        <span>&copy; {year} KarmaSync | Effortless Agile Management</span>
        <span className="footer-divider-bs"> | </span>
        <a
          href="https://github.com/bsurajpatra/KarmaSync_Info/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link-modern"
        >
          MIT License
        </a>
      </div>
    </footer>
  );
};

export default Footer;
