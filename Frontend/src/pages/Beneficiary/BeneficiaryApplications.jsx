import { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';

const BeneficiaryApplications = ({ username }) => {
    const [schemes, setSchemes] = useState([]);
    const [applications, setApplications] = useState([]);
    const [schemeId, setSchemeId] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadPortalData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [schemeResponse, applicationResponse] = await Promise.all([
                api.get('/schemes', { params: { limit: 100, status: 'Active' } }),
                api.get('/applications'),
            ]);
            const availableSchemes = Array.isArray(schemeResponse.data)
                ? schemeResponse.data
                : (schemeResponse.data.data || []);
            setSchemes(availableSchemes.filter((scheme) => scheme.status === 'Active' && scheme.district));
            setApplications(Array.isArray(applicationResponse.data) ? applicationResponse.data : []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load your beneficiary portal.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPortalData();
    }, [loadPortalData]);

    const submitApplication = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        if (!schemeId) {
            setError('Choose a scheme before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/applications', { schemeId: Number(schemeId) });
            setMessage('Application submitted. You can track its status below.');
            setSchemeId('');
            await loadPortalData();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to submit your application.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
            <header style={{ marginBottom: 24 }}>
                <h1>My Scheme Applications</h1>
                <p>Welcome {username || 'beneficiary'}. Apply for an active scheme and track every decision.</p>
            </header>

            <section style={{ padding: 20, border: '1px solid #d9e1ec', borderRadius: 12, marginBottom: 24 }}>
                <h2>Apply for a scheme</h2>
                <form onSubmit={submitApplication} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <label htmlFor="schemeId" style={{ display: 'grid', gap: 6, flex: '1 1 280px' }}>
                        Active scheme
                        <select id="schemeId" value={schemeId} onChange={(event) => setSchemeId(event.target.value)} required>
                            <option value="">Select a scheme</option>
                            {schemes.map((scheme) => (
                                <option key={scheme.id} value={scheme.id}>
                                    {scheme.schemeName} — {scheme.district}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" disabled={submitting || loading || schemes.length === 0}>
                        {submitting ? 'Submitting…' : 'Submit application'}
                    </button>
                </form>
                {schemes.length === 0 && !loading && <p>No active schemes are currently available.</p>}
            </section>

            {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
            {message && <p role="status" style={{ color: '#067647' }}>{message}</p>}

            <section>
                <h2>Application history</h2>
                {loading ? <p>Loading your applications…</p> : applications.length === 0 ? (
                    <p>You haven’t submitted an application yet. Choose an active scheme above to get started.</p>
                ) : (
                    <div style={{ display: 'grid', gap: 14 }}>
                        {applications.map((application) => (
                            <article key={application.id} style={{ padding: 18, border: '1px solid #d9e1ec', borderRadius: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    <h3>{application.scheme || application.schemeId?.schemeName || 'Scheme application'}</h3>
                                    <strong>{application.status}</strong>
                                </div>
                                <p>District: {application.district || '—'} · Applied: {application.dateApplied || application.appliedDate || '—'}</p>
                                <h4>Remarks and decisions</h4>
                                {Array.isArray(application.remarks) && application.remarks.length > 0 ? (
                                    <ul>
                                        {application.remarks.map((remark, index) => (
                                            <li key={`${application.id}-remark-${index}`}>
                                                <strong>{remark.role || 'Officer'}</strong>
                                                {remark.text ? `: ${remark.text}` : ': No remark provided'}
                                                {remark.date ? <span> ({new Date(remark.date).toLocaleString()})</span> : null}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p>No review remarks have been added yet.</p>}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
};

export default BeneficiaryApplications;
