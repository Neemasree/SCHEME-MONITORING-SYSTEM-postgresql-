import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Map, CheckSquare, Loader2, UserRound } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
        }
    }, [location]);

    const { login } = useAuth();

    const roles = [
        { id: 'admin', title: 'System Admin', icon: <Shield size={32} />, desc: 'Full system access & final approvals' },
        { id: 'district_officer', title: 'District Officer', icon: <Map size={32} />, desc: 'Review & forward applications' },
        { id: 'field_officer', title: 'Field Officer', icon: <CheckSquare size={32} />, desc: 'Verify on-ground applications' },
        { id: 'beneficiary', title: 'Beneficiary', icon: <UserRound size={32} />, desc: 'Apply for schemes and track decisions' },
    ];

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedRole) {
            setError("Please select a role to login.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });

            // Check if returned user role matches selected role
            if (data.role !== selectedRole) {
                setError(`The credentials provided are not for a ${selectedRole.replace('_', ' ')} account.`);
                setIsSubmitting(false);
                return;
            }

            login(data);
        } catch (err) {
            setError(err.response?.data?.message || "Authentication failed. Please check your credentials.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-card animate-fade-in">
                <div className="login-header">
                    <div className="login-logo">🏛️</div>
                    <h2>Scheme Monitoring System</h2>
                    <p>Login to access your dashboard</p>
                </div>

                {error && <div className="login-error-alert slideUp">{error}</div>}
                {successMessage && <div className="login-success-alert slideUp">{successMessage}</div>}


                <form onSubmit={handleLogin} className="login-form">
                    <div className="role-selection">
                        <p className="selection-label">Select Your Role</p>
                        <div className="role-grid">
                            {roles.map((role, idx) => (
                                <button
                                    type="button"
                                    key={role.id}
                                    className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedRole(role.id)}
                                    aria-pressed={selectedRole === role.id}
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    <div className="role-icon">{role.icon}</div>
                                    <h3>{role.title}</h3>
                                    <p>{role.desc}</p>
                                    {selectedRole === role.id && <div className="selected-indicator"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group slideUp" style={{ animationDelay: '0.4s' }}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="officer@govt.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        disabled={!selectedRole || !email || !password || isSubmitting}
                        style={{ animationDelay: '0.6s' }}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Authenticate User'}
                    </button>

                    <div className="login-footer slideUp" style={{ animationDelay: '0.7s' }}>
                        <p>New officer? <Link to="/register">Register here</Link></p>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default Login;
