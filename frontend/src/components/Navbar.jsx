const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <h2 className="logo">JobLithic</h2>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/jobs">Browse Jobs</a>
          <a href="/login">Login</a>
          <button className="primary-btn">Get Started</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
