import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import api from '../api/axios';
import {
  Folder,
  BookOpen,
  Bell,
  UserCircle,
  Users,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Share2,
  Megaphone,
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ role }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingMirrorCount, setPendingMirrorCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const drawerRef = useRef(null);

  // Teachers get a small badge on "Share Material" when section admins are
  // waiting on them to approve/reject a mirror request. Poll lightly rather
  // than requiring a page visit to notice it.
  useEffect(() => {
    let cancelled = false;
    const loadBadges = async () => {
      try {
        const { data: notifications } = await api.get('/notifications');
        if (!cancelled) setUnreadNotifications(notifications.filter(n => !n.read).length);
        
        if (role === 'teacher') {
          const { data } = await api.get('/teacher-materials/mirror-requests');
          if (!cancelled) setPendingMirrorCount(data.length);
        }
      } catch (_) { /* ignore */ }
    };
    loadBadges();
    const interval = setInterval(loadBadges, 30000);
    
    window.addEventListener('refreshBadges', loadBadges);
    
    return () => { 
      cancelled = true; 
      clearInterval(interval); 
      window.removeEventListener('refreshBadges', loadBadges);
    };
  }, [role, location.pathname]);

  // Close the drawer automatically whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Move focus into the drawer when it opens, and back to the
  // hamburger button when it closes, so keyboard users aren't stranded.
  useEffect(() => {
    if (mobileOpen) {
      closeBtnRef.current?.focus();
    } else {
      menuBtnRef.current?.focus();
    }
  }, [mobileOpen]);

  // Let Escape close the drawer, same as clicking the backdrop, and
  // trap Tab/Shift+Tab so keyboard focus can't leave the drawer while open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const studentLinks = [
    { to: '/student/personal', icon: <Folder size={19} />, label: 'Personal Storage' },
    { to: '/student/materials', icon: <BookOpen size={19} />, label: 'Class Material' },
    { to: '/student/notices', icon: <Megaphone size={19} />, label: 'Notices' },
    { to: '/student/sections', icon: <Users size={19} />, label: 'My Sections' },
    { to: '/student/notifications', icon: <Bell size={19} />, label: 'Notifications', badge: unreadNotifications },
    { to: '/student/profile', icon: <UserCircle size={19} />, label: 'Profile' },
  ];

  const teacherLinks = [
    { to: '/teacher/personal', icon: <Folder size={19} />, label: 'Personal Storage' },
    { to: '/teacher/share-material', icon: <Share2 size={19} />, label: 'Share Material', badge: pendingMirrorCount },
    { to: '/teacher/notices', icon: <Megaphone size={19} />, label: 'Notices' },
    { to: '/teacher/sections', icon: <Users size={19} />, label: 'My Sections' },
    { to: '/teacher/notifications', icon: <Bell size={19} />, label: 'Notifications', badge: unreadNotifications },
    { to: '/teacher/profile', icon: <UserCircle size={19} />, label: 'Profile' },
  ];

  const links = role === 'student' ? studentLinks : teacherLinks;

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <div className="logo-container">
          <span className="logo-mark"><GraduationCap size={20} /></span>
          <span className="logo-text">Pocket University</span>
        </div>
        <button
          ref={closeBtnRef}
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-user">
        <div className="avatar">
          <span className="avatar-placeholder">{user?.name?.charAt(0).toUpperCase() || '?'}</span>
        </div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
            {!!link.badge && <span className="nav-badge">{link.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle />
        <button onClick={logout} className="nav-link logout-btn">
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — visible only under the breakpoint (see Sidebar.css) */}
      <header className="mobile-topbar">
        <button
          ref={menuBtnRef}
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-haspopup="true"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
        <div className="mobile-topbar-brand">
          <span className="logo-mark"><GraduationCap size={17} /></span>
          <span className="logo-text">Pocket University</span>
        </div>
        <ThemeToggle compact />
      </header>

      {/* Backdrop for the mobile drawer */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        ref={drawerRef}
        className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}
        aria-hidden={!mobileOpen && undefined}
        role="navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
