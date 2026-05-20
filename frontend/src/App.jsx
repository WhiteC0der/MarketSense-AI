import { lazy, Suspense, Component } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthPage from '@/components/auth/AuthPage';
import { Toaster } from '@/components/ui/Toaster';

// Lazy load the entire Dashboard (includes recharts, framer-motion, react-markdown)
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard'));

function LoadingScreen() {
  return (
    <div className="h-screen-safe w-full bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
          </svg>
        </div>
        <p className="text-zinc-500 text-sm">Loading MarketSense AI...</p>
      </div>
    </div>
  );
}

// Error boundary to catch lazy load failures (common on mobile with flaky connections)
class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen-safe w-full bg-zinc-950 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-zinc-400 text-sm max-w-xs">Something went wrong loading the dashboard. This can happen on slow connections.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 text-sm font-semibold rounded-xl transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Dashboard />
        <Toaster />
      </Suspense>
    </DashboardErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
