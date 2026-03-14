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
import './index.css';

// Protective Layout Wrapper
const PortalLayout = ({ role, username, onLogout, onSearchItem, children }) => {
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar role={role} onLogout={onLogout} />
      <main className="main-content">
        <Navbar role={role} username={username} onSearchItem={onSearchItem} />
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
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  const handleLogin = (selectedRole, name) => {
    setRole(selectedRole);
    setUsername(name);
  };

  const handleLogout = () => {
    setRole(null);
    setUsername('');
    setGlobalSearch('');
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={
          role ? <Navigate to={`/${role}/dashboard`} replace /> : <Login onLogin={handleLogin} />
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <PortalLayout role={role} username={username} onLogout={handleLogout} onSearchItem={setGlobalSearch}>
            <Routes>
              <Route path="dashboard" element={<Dashboard role="admin" username={username} />} />
              <Route path="schemes" element={<Schemes role="admin" searchTerm={globalSearch} />} />
              <Route path="applications" element={<Applications role="admin" searchTerm={globalSearch} />} />
              <Route path="districts" element={<Districts role="admin" />} />
              <Route path="reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </PortalLayout>
        } />

        {/* District Officer Routes */}
        <Route path="/district/*" element={
          <PortalLayout role={role} username={username} onLogout={handleLogout} onSearchItem={setGlobalSearch}>
            <Routes>
              <Route path="dashboard" element={<Dashboard role="district" username={username} />} />
              <Route path="schemes" element={<Schemes role="district" searchTerm={globalSearch} />} />
              <Route path="applications" element={<Applications role="district" searchTerm={globalSearch} />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </PortalLayout>
        } />

        {/* Field Officer Routes */}
        <Route path="/field/*" element={
          <PortalLayout role={role} username={username} onLogout={handleLogout} onSearchItem={setGlobalSearch}>
            <Routes>
              <Route path="dashboard" element={<Dashboard role="field" username={username} />} />
              <Route path="schemes" element={<Schemes role="field" searchTerm={globalSearch} />} />
              <Route path="applications" element={<Applications role="field" searchTerm={globalSearch} />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </PortalLayout>
        } />

        {/* Root Redirect Catch-all */}
        <Route path="/" element={<Navigate to={role ? `/${role}/dashboard` : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
