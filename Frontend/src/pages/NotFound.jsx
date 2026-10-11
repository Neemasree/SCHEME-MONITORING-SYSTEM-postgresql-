import { Link } from 'react-router-dom';

const NotFound = () => (
    <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.12em' }}>ERROR 404</p>
        <h1>We couldn’t find that page</h1>
        <p>The link may be outdated, or the address may be incorrect.</p>
        <Link to="/">Return to CivicTrack</Link>
    </main>
);

export default NotFound;
