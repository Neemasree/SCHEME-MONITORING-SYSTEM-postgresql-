import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Map, CheckSquare } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const roles = [
        { id: 'admin', title: 'System Admin', icon: <Shield size={32} />, desc: 'Full system access & final approvals' },
        { id: 'district', title: 'District Officer', icon: <Map size={32} />, desc: 'Review & forward applications' },
        { id: 'field', title: 'Field Officer', icon: <CheckSquare size={32} />, desc: 'Verify on-ground applications' },
    ];

    const handleLogin = (e) => {
        e.preventDefault();
        if (!selectedRole) {
            alert("Please select a role to login.");
            return;
        }

        // Simulate login
        const userNameDisplay = username || `Demo ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`;
        onLogin(selectedRole, userNameDisplay);
        navigate(`/${selectedRole}/dashboard`);
    };

    return (
        <div className="login-container">
            <div className="login-card glass-card animate-fade-in">
                <div className="login-header">
                    <div className="login-logo">🏛️</div>
                    <h2>Scheme Monitoring System</h2>
                    <p>Login to access your dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="role-selection">
                        <p className="selection-label">Select Your Role</p>
                        <div className="role-grid">
                            {roles.map((role, idx) => (
                                <div
                                    key={role.id}
                                    className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedRole(role.id)}
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    <div className="role-icon">{role.icon}</div>
                                    <h3>{role.title}</h3>
                                    <p>{role.desc}</p>
                                    {selectedRole === role.id && <div className="selected-indicator"></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group slideUp" style={{ animationDelay: '0.4s' }}>
                        <label htmlFor="username">Username or ID</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="Enter your registered ID"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group slideUp" style={{ animationDelay: '0.5s' }}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-btn slideUp"
                        disabled={!selectedRole || !username || !password}
                        style={{ animationDelay: '0.6s' }}
                    >
                        Authenticate User
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
