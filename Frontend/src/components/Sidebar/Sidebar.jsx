import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, Users, TrendingUp, Settings, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ role, onLogout }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    // Navigation Links Base Configuration
    const navItems = [
        { path: `/${role}/dashboard`, name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'district', 'field'] },
        { path: `/${role}/schemes`, name: 'Schemes', icon: <FileText size={20} />, roles: ['admin', 'district', 'field'] },
        { path: `/${role}/applications`, name: 'Applications', icon: <CheckSquare size={20} />, roles: ['admin', 'district', 'field'] },
        { path: '/admin/districts', name: 'District Performance', icon: <TrendingUp size={20} />, roles: ['admin'] },
        { path: '/admin/reports', name: 'Reports & Analytics', icon: <Users size={20} />, roles: ['admin'] },
    ];

    const filteredLinks = navItems.filter(item => item.roles.includes(role));

    return (
        <aside className={`sidebar glass-card ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon">🏛️</div>
                    {!collapsed && <span className="logo-text">SMS Portal</span>}
                </div>
                <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {filteredLinks.map((link) => (
                        <li key={link.path}>
                            <NavLink
                                to={link.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                title={collapsed ? link.name : ''}
                            >
                                <div className="icon-wrapper">{link.icon}</div>
                                {!collapsed && <span className="link-text">{link.name}</span>}
                                {location.pathname === link.path && !collapsed && <div className="active-indicator"></div>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <ul>
                    <li>
                        <button className="nav-link logout-btn" onClick={onLogout} title={collapsed ? 'Logout' : ''}>
                            <div className="icon-wrapper"><LogOut size={20} /></div>
                            {!collapsed && <span className="link-text">Logout</span>}
                        </button>
                    </li>
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;
