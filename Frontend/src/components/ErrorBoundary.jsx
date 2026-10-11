import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('UI rendering error:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <main role="alert" style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', padding: 24, textAlign: 'center' }}>
                    <h1>Something went wrong</h1>
                    <p>The page could not be displayed. Try refreshing the application.</p>
                    <button type="button" onClick={() => window.location.reload()}>Refresh page</button>
                </main>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
