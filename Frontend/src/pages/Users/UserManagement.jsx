import { useCallback, useEffect, useState } from 'react';
import { UserPlus, ShieldCheck, UserX, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import './UserManagement.css';

const emptyForm = { name: '', email: '', password: '', role: 'field_officer', district: '' };

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/auth/users');
            setUsers(Array.isArray(data) ? data : []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const changeField = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const createUser = async (event) => {
        event.preventDefault();
        setError('');
        setNotice('');
        setSaving(true);
        try {
            await api.post('/auth/users', {
                ...form,
                district: ['district_officer', 'field_officer'].includes(form.role) ? form.district.trim() : null,
            });
            setForm(emptyForm);
            setNotice('User account created successfully.');
            await loadUsers();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to create user.');
        } finally {
            setSaving(false);
        }
    };

    const deactivateUser = async (user) => {
        if (!window.confirm(`Deactivate ${user.name}'s account? They will no longer be able to sign in.`)) return;
        setError('');
        setNotice('');
        try {
            await api.patch(`/auth/users/${user.id}/deactivate`);
            setNotice(`${user.name}'s account has been deactivated.`);
            await loadUsers();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to deactivate user.');
        }
    };

    return (
        <section className="user-management">
            <header className="user-management__header">
                <div>
                    <span className="user-management__eyebrow">ADMINISTRATION</span>
                    <h1 className="page-title">User management</h1>
                    <p className="page-subtitle">Provision staff accounts, assign district access, and manage account status.</p>
                </div>
                <div className="user-management__summary">
                    <span className="user-management__summary-icon"><ShieldCheck size={20} /></span>
                    <span><strong>{users.length}</strong><small>Registered accounts</small></span>
                </div>
            </header>

            {error && <p className="user-management__message user-management__message--error" role="alert">{error}</p>}
            {notice && <p className="user-management__message user-management__message--success" role="status">{notice}</p>}

            <section className="user-management__panel" aria-labelledby="create-user-title">
                <div className="user-management__panel-heading">
                    <span className="user-management__panel-icon"><UserPlus size={19} /></span>
                    <div><h2 id="create-user-title">Create an account</h2><p>Officer accounts must be assigned to a district.</p></div>
                </div>
                <form className="user-management__form" onSubmit={createUser}>
                    <label className="user-management__field">Full name
                        <input name="name" value={form.name} onChange={changeField} minLength={2} maxLength={100} autoComplete="name" placeholder="Enter full name" required />
                    </label>
                    <label className="user-management__field">Email address
                        <input name="email" type="email" value={form.email} onChange={changeField} maxLength={254} autoComplete="email" placeholder="name@example.com" required />
                    </label>
                    <label className="user-management__field">Temporary password
                        <input name="password" type="password" value={form.password} onChange={changeField} minLength={12} maxLength={128} autoComplete="new-password" placeholder="At least 12 characters" required />
                    </label>
                    <label className="user-management__field">Account role
                        <select name="role" value={form.role} onChange={changeField}>
                            <option value="field_officer">Field officer</option>
                            <option value="district_officer">District officer</option>
                            <option value="admin">Administrator</option>
                            <option value="beneficiary">Beneficiary</option>
                        </select>
                    </label>
                    <label className="user-management__field">Assigned district
                        <input name="district" value={form.district} onChange={changeField} placeholder="e.g. Salem" disabled={!['district_officer', 'field_officer'].includes(form.role)} required={['district_officer', 'field_officer'].includes(form.role)} />
                    </label>
                    <div className="user-management__form-action">
                        <button className="user-management__primary-button" type="submit" disabled={saving}>
                            <UserPlus size={17} />{saving ? 'Creating account…' : 'Create account'}
                        </button>
                    </div>
                </form>
                <p className="user-management__hint">Use a temporary password and share it securely with the account holder. Never reuse demo credentials.</p>
            </section>

            <section className="user-management__panel" aria-labelledby="registered-users-title">
                <div className="user-management__panel-heading user-management__panel-heading--between">
                    <div><h2 id="registered-users-title">Registered users</h2><p>Review account roles, district assignments and access status.</p></div>
                    <button className="user-management__secondary-button" type="button" onClick={loadUsers} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'user-management__spin' : ''} /> Refresh
                    </button>
                </div>
                {loading ? <div className="user-management__empty" role="status">Loading registered accounts…</div> : users.length === 0 ? (
                    <div className="user-management__empty"><ShieldCheck size={25} /><strong>No accounts found</strong><span>Create the first staff account using the form above.</span></div>
                ) : (
                    <div className="user-management__table-wrap">
                        <table className="user-management__table">
                            <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">District</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td><div className="user-management__identity"><span className="user-management__avatar">{user.name?.trim()?.charAt(0)?.toUpperCase() || '?'}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td>
                                        <td><span className="user-management__role">{user.role.replaceAll('_', ' ')}</span></td>
                                        <td>{user.district || '—'}</td>
                                        <td><span className={`user-management__status ${user.isActive ? 'is-active' : 'is-inactive'}`}>{user.isActive ? 'Active' : 'Deactivated'}</span></td>
                                        <td>{user.isActive ? <button className="user-management__deactivate" type="button" onClick={() => deactivateUser(user)}><UserX size={15} /> Deactivate</button> : <span className="user-management__muted">No action</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
};

export default UserManagement;
