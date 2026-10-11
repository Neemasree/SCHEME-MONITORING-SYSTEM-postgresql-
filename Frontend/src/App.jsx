import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Schemes from './pages/Schemes/Schemes';
import Applications from './pages/Applications/Applications';
import Districts from './pages/Districts/Districts';
import Reports from './pages/Reports/Reports';
import Register from './pages/Register/Register';
import Notifications from './pages/Notifications/Notifications';
import { useAuth } from './context/AuthContext';
import './index.css';


const homePathForRole = (role) => {
  if (role === 'district_officer') return '/district/dashboard';
  if (role === 'field_officer') return '/field/dashboard';
  if (role === 'beneficiary') return '/beneficiary/applications';
  return '/admin/dashboard';
};

const RequireRole = ({ user, allowedRoles, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return children;
};

// Protective Layout Wrapper
const PortalLayout = ({ user, logout, onSearchItem, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize backend roles to UI roles for navigation if necessary
  const uiRole = user.role === 'district_officer' ? 'district' :
    user.role === 'field_officer' ? 'field' :
    user.role === 'beneficiary' ? 'beneficiary' : 'admin';

  return (
    <div className="app-container">
      <Sidebar role={uiRole} onLogout={logout} />
      <main className="main-content">
        <Navbar role={uiRole} username={user.name} onSearchItem={onSearchItem} />
        <div className="page-content" id="scrollable-content">
          {children}
        </div>
      </main>
    </div>
  );
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = document.getElementById('scrollable-content');
    if (el) el.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  const { user, logout, loading } = useAuth();
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading) {
    return <div className="loading-screen">Authenticating Session...</div>;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={

          user ? <Navigate to={homePathForRole(user.role)} replace /> : <Login />
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <RequireRole user={user} allowedRoles={['admin']}>
          <PortalLayout user={user} logout={logout} onSearchItem={setGlobalSearch}>
            <Routes>
              <Route path="dashboard" element={<Dashboard role="admin" username={user?.name} />} />
              <Route path="schemes" element={<Schemes role="admin" searchTerm={globalSearch} />} />
              <Route path="applications" element={<Applications role="admin" searchTerm={globalSearch} />} />
              <Route path="districts" element={<Districts role="admin" />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </PortalLayout>
          </RequireRole>
        } />

        {/* District Officer Routes */}
        <Route path="/district/*" element={
          <RequireRole user={user} allowedRoles={['district_officer']}>
          <PortalLayout user={user} logout={logout} onSearchItem={setGlobalSearch}>
            <Routes>
              <Route path="dashboard" element={<Dashboard role="district" username={user?.name} />} />
              <Route path="schemes" element={<Schemes role="district" searchTerm={globalSearch} />} />
              <Route path="applications" element={<Applications role="district" searchTerm={globalSearch} />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </PortalLayout>
          </RequireRole>
        } />

        {/* Field Officer Routes */}
        <Route path="/field/*" element={
          <RequireRole user={user} allowedRoles={['field_officer']}>
          <PortalLayout user={user} logout={logout} onSearchItem={setGlobalSearch}>
            <Routes>
              <Route path="dashboard" element={<Dashboard role="field" username={user?.name} />} />
              <Route path="schemes" element={<Schemes role="field" searchTerm={globalSearch} />} />
              <Route path="applications" element={<Applications role="field" searchTerm={globalSearch} />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </PortalLayout>
          </RequireRole>
        } />

        {/* Root Redirect Catch-all */}
        <Route path="/" element={
          <Navigate to={user ? homePathForRole(user.role) : "/login"} replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
