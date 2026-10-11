import { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';

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
                district: ['district_officer', 'field_officer'].includes(form.role) ? form.district : null,
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
        if (!window.confirm(`Deactivate ${user.name}'s account?`)) return;
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
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
            <header style={{ marginBottom: 24 }}>
                <h1>User Management</h1>
                <p>Create officer accounts, assign districts, and deactivate accounts when needed.</p>
            </header>

            {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
            {notice && <p role="status" style={{ color: '#067647' }}>{notice}</p>}

            <form onSubmit={createUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, padding: 20, border: '1px solid #d9e1ec', borderRadius: 12, marginBottom: 28 }}>
                <label>Name<input name="name" value={form.name} onChange={changeField} minLength={2} maxLength={100} required /></label>
                <label>Email<input name="email" type="email" value={form.email} onChange={changeField} maxLength={254} required /></label>
                <label>Temporary password<input name="password" type="password" value={form.password} onChange={changeField} minLength={12} maxLength={128} required /></label>
                <label>Role
                    <select name="role" value={form.role} onChange={changeField}>
                        <option value="field_officer">Field officer</option>
                        <option value="district_officer">District officer</option>
                        <option value="admin">Admin</option>
                        <option value="beneficiary">Beneficiary</option>
                    </select>
                </label>
                <label>District
                    <input name="district" value={form.district} onChange={changeField} placeholder="Required for officers" disabled={!['district_officer', 'field_officer'].includes(form.role)} required={['district_officer', 'field_officer'].includes(form.role)} />
                </label>
                <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button>
                </div>
            </form>

            <h2>Registered users</h2>
            {loading ? <p>Loading users…</p> : users.length === 0 ? <p>No users found.</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th align="left">Name</th><th align="left">Email</th><th align="left">Role</th><th align="left">District</th><th align="left">Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role.replaceAll('_', ' ')}</td>
                                    <td>{user.district || '—'}</td>
                                    <td>{user.isActive ? 'Active' : 'Deactivated'}</td>
                                    <td align="center">
                                        {user.isActive ? <button type="button" onClick={() => deactivateUser(user)}>Deactivate</button> : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default UserManagement;
