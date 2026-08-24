import React, { Component, ErrorInfo, ReactNode } from "react";
import ErrorPage from "@/Pages/ErrorPage";
import { router } from "@inertiajs/react";

interface Props {
    children: ReactNode;
}
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    private unsubscribe: (() => void) | null = null;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    componentDidMount() {
        // Reset error state on every Inertia navigation
        this.unsubscribe = router.on('start', () => {
            if (this.state.hasError) {
                this.setState({ hasError: false, error: null, errorInfo: null });
            }
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe) this.unsubscribe();
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorPage
                    statusCode={500}
                    message={this.state.error?.message ?? "An unexpected error occurred."}
                    componentStack={this.state.errorInfo?.componentStack ?? undefined}
                />
            );
        }
        return this.props.children;
    }
}
