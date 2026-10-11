import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await api.post('/auth/register', formData);
            navigate('/login', {
                state: { message: 'Account created. Please sign in with your new credentials.' },
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card glass-card animate-fade-in">
                <Link to="/login" className="back-link">
                    <ArrowLeft size={18} /> Back to Login
                </Link>

                <div className="register-header">
                    <div className="register-logo">🏛️</div>
                    <h2>Create Beneficiary Account</h2>
                    <p>Register to access scheme application services</p>
                </div>

                {error && <div className="register-error-alert slideUp" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="name"><User size={16} /> Full Name</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                placeholder="Your full name"
                                value={formData.name}
                                onChange={handleChange}
                                minLength={2}
                                maxLength={100}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email"><Mail size={16} /> Email Address</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                maxLength={254}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password"><Lock size={16} /> Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="At least 8 characters"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                minLength={12}
                                maxLength={128}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="register-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="register-footer">
                    Officer accounts are provisioned by an administrator.
                </p>
            </div>
        </div>
    );
};

export default Register;
