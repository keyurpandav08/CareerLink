import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu, User, X, LogOut } from 'lucide-react';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForUser, getRoleName } from '../utils/role';
import logo from '../assets/logo/joblithic-logo.png';
import './Layout.css';

const guestNav = [
  { to: '/', label: 'Home' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/career-advice', label: 'Career Advice' },
  { to: '/contact', label: 'Contact' }
];

const applicantNav = [
  { to: '/jobs', label: 'Find Jobs' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/applications', label: 'Applications' },
  { to: '/saved-jobs', label: 'Saved Jobs' },
  { to: '/resume-builder', label: 'Resume AI' }
];

const employerNav = [
  { to: '/employer-dashboard', label: 'Dashboard' },
  { to: '/post-job', label: 'Post Job' },
  { to: '/applications', label: 'Applicants' },
  { to: '/settings', label: 'Settings' },
  { to: '/contact', label: 'Support' }
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const roleName = getRoleName(user);
  const isAuthenticated = Boolean(user);

  const navItems = useMemo(() => {
    if (!isAuthenticated) return guestNav;
    return roleName === 'EMPLOYER' ? employerNav : applicantNav;
  }, [isAuthenticated, roleName]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate('/');
  };

  const dashboardPath = getDashboardPathForUser(user);
  const profilePath = roleName === 'EMPLOYER' ? '/settings' : '/edit-profile';

  return (
    <div className="app-layout-root">
      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/" className="brand-link" onClick={() => setShowMobileMenu(false)}>
            <img src={logo} alt="JobLithic" className="brand-logo" />
          </Link>

          <nav className="desktop-nav">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="nav-item">
                {item.label}
              </Link>
            ))}

            {!isAuthenticated ? (
              <div className="auth-actions">
                <Link to="/login" className="nav-item">Login</Link>
                <Link to="/register" className="btn-cta">Create Account</Link>
              </div>
            ) : (
              <div className="user-menu-wrap" ref={userMenuRef}>
                <button type="button" className="user-trigger" onClick={() => setShowUserMenu((prev) => !prev)}>
                  <User size={15} />
                  <span>{user?.fullName || user?.username || 'Account'}</span>
                </button>

                {showUserMenu && (
                  <div className="user-menu">
                    <Link to={dashboardPath} onClick={() => setShowUserMenu(false)}>Dashboard</Link>
                    <Link to="/applications" onClick={() => setShowUserMenu(false)}>Applications</Link>
                    <Link to={profilePath} onClick={() => setShowUserMenu(false)}>
                      {roleName === 'EMPLOYER' ? 'Settings' : 'Edit Profile'}
                    </Link>
                    <button type="button" onClick={handleLogout} className="danger-item">
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setShowMobileMenu((prev) => !prev)}
          >
            {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {showMobileMenu && (
          <div className="container mobile-nav-panel">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setShowMobileMenu(false)} className="mobile-nav-item">
                {item.label}
              </Link>
            ))}

            {!isAuthenticated ? (
              <div className="mobile-auth-actions">
                <Link to="/login" onClick={() => setShowMobileMenu(false)} className="mobile-nav-item">Login</Link>
                <Link to="/register" onClick={() => setShowMobileMenu(false)} className="btn-cta">Create Account</Link>
              </div>
            ) : (
              <button type="button" className="mobile-nav-item mobile-logout" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>
        )}
      </header>

      <main className="site-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
