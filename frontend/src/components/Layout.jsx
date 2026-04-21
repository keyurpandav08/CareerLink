import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Footer from './Footer';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { getProfilePhoto } from '../utils/candidatePortal';
import { getDashboardPathForUser, getRoleName } from '../utils/role';
import './Layout.css';

const guestNav = [
  { to: '/', label: 'Home' },
  { to: '/jobs', label: 'Browse Jobs' },
  { to: '/career-advice', label: 'Career Advice' },
  { to: '/contact', label: 'Contact' }
];

const applicantNav = [
  { to: '/', label: 'Home' },
  { to: '/jobs', label: 'Browse Jobs' },
  { to: '/applications', label: 'Applications' },
  { to: '/saved-jobs', label: 'Saved Jobs' },
  { to: '/dashboard', label: 'Dashboard' }
];

const employerNav = [
  { to: '/', label: 'Home' },
  { to: '/employer-dashboard', label: 'Dashboard' },
  { to: '/employer-dashboard/jobs', label: 'Post Job' },
  { to: '/employer-dashboard/candidates', label: 'Applicants' },
  { to: '/contact', label: 'Support' }
];

const adminNav = [
  { to: '/admin/dashboard', label: 'Admin Panel' },
  { to: '/', label: 'Public Site' }
];

const createInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JL';

const Layout = () => {
  const { user, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const roleName = getRoleName(user);
  const isAuthenticated = Boolean(user);
  const displayName = user?.fullName || user?.username || 'Account';
  const profilePhoto = useMemo(() => getProfilePhoto(user), [user]);

  const navItems = useMemo(() => {
    if (!isAuthenticated) return guestNav;
    if (roleName === 'ADMIN') return adminNav;
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowMobileMenu(false);
      setShowUserMenu(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate('/');
  };

  const dashboardPath = getDashboardPathForUser(user);
  const profilePath = roleName === 'EMPLOYER'
    ? '/employer-dashboard?panel=settings'
    : roleName === 'ADMIN'
      ? '/admin/dashboard'
      : '/profile';
  const candidateImmersiveRoutes = new Set(['/dashboard', '/profile', '/edit-profile', '/resume-builder']);
  const candidateConditionalRoutes = new Set(['/applications', '/settings']);
  const employerImmersiveRoutes = roleName === 'EMPLOYER'
    && (location.pathname === '/employer-dashboard'
      || location.pathname === '/post-job'
      || location.pathname === '/applications'
      || location.pathname === '/employer-dashboard/jobs'
      || location.pathname === '/employer-dashboard/candidates'
      || location.pathname.startsWith('/employer-dashboard/'));
  const useImmersiveShell = candidateImmersiveRoutes.has(location.pathname)
    || (roleName === 'APPLICANT' && candidateConditionalRoutes.has(location.pathname))
    || employerImmersiveRoutes;
  const isNavActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  if (useImmersiveShell) {
    return (
      <div className="app-layout-root app-layout-root-immersive">
        <main className="site-content site-content-immersive">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout-root">
      <header className="site-header">
          <div className="container site-header-frame">
            <div className="site-header-shell">
              <Link to="/" className="brand-link" onClick={() => setShowMobileMenu(false)} aria-label="CareerLink home">
                <BrandLogo variant="full" className="site-brand-logo" alt="CareerLink" />
              </Link>

            <nav className="desktop-nav">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-item ${isNavActive(item.to) ? 'nav-item-active' : ''}`.trim()}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="site-header-actions">
              {!isAuthenticated ? (
                <div className="auth-actions">
                  <button
                    type="button"
                    className="header-text-action"
                    onClick={() => openAuthModal('login')}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    className="btn-cta"
                    onClick={() => openAuthModal('register')}
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="user-menu-wrap" ref={userMenuRef}>
                  <button type="button" className="user-trigger" onClick={() => setShowUserMenu((prev) => !prev)}>
                    <div className="user-trigger-avatar">
                      {profilePhoto
                        ? <img src={profilePhoto} alt={displayName} />
                        : <span>{createInitials(displayName)}</span>}
                    </div>
                    <div className="user-trigger-copy">
                      <strong>{displayName}</strong>
                      <span>{roleName === 'EMPLOYER' ? 'Employer workspace' : roleName === 'ADMIN' ? 'Admin access' : 'Candidate profile'}</span>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="user-menu">
                      <Link to={dashboardPath} onClick={() => setShowUserMenu(false)}>Dashboard</Link>
                      {roleName !== 'ADMIN' && (
                        <Link
                          to={roleName === 'EMPLOYER' ? '/employer-dashboard/candidates' : '/applications'}
                          onClick={() => setShowUserMenu(false)}
                        >
                          {roleName === 'EMPLOYER' ? 'Candidates' : 'Applications'}
                        </Link>
                      )}
                      <Link to={profilePath} onClick={() => setShowUserMenu(false)}>
                        {roleName === 'EMPLOYER' ? 'Settings' : roleName === 'ADMIN' ? 'Admin Panel' : 'Profile'}
                      </Link>
                      <button type="button" onClick={handleLogout} className="danger-item">
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setShowMobileMenu((prev) => !prev)}
              aria-label={showMobileMenu ? 'Close navigation' : 'Open navigation'}
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="container">
            <div className="mobile-nav-panel">
              <div className="mobile-nav-links">
                {navItems.map((item) => (
                  <Link key={item.to} to={item.to} className="mobile-nav-item">
                    {item.label}
                  </Link>
                ))}
              </div>

              {!isAuthenticated ? (
                <div className="mobile-auth-actions">
                  <button type="button" className="mobile-nav-item" onClick={() => openAuthModal('login')}>
                    Log in
                  </button>
                  <button type="button" className="btn-cta" onClick={() => openAuthModal('register')}>
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="mobile-user-actions">
                  <Link to={dashboardPath} className="mobile-nav-item">Dashboard</Link>
                  <Link to={profilePath} className="mobile-nav-item">
                    {roleName === 'EMPLOYER' ? 'Settings' : roleName === 'ADMIN' ? 'Admin Panel' : 'Profile'}
                  </Link>
                  <button type="button" className="mobile-nav-item mobile-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="site-content">
        <Outlet />
      </main>

      <Footer />
      <AuthModal />
    </div>
  );
};

export default Layout;
