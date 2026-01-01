import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="dashboard-footer" style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
      &copy; {year} KarmaSync |{" "}
      <a
        href="https://github.com/bsurajpatra/KarmaSync_Info/blob/main/LICENSE"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        MIT License
      </a>
    </footer>
  );
};

export default Footer;
