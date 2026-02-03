import { useState, lazy, Suspense, Component, ErrorInfo, ReactNode } from "react";
import { CatalogProvider } from "./context/CatalogProvider";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-slate-300 mb-4">{this.state.error?.message}</p>
            <p className="text-slate-400 text-sm">Check the console for more details</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const GenrePage = lazy(() => import("./pages/GenrePage"));
const RegionPage = lazy(() => import("./pages/RegionPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const WatchPage = lazy(() => import("./pages/WatchPage"));
const ContentTypePage = lazy(() => import("./pages/ContentTypePage"));
const Catalog = lazy(() => import("./components/Catalog"));
const AdminLogin = lazy(() => import("./pages/AdminLogin").then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ModerationPortal = lazy(() => import("./pages/admin/ModerationPortal"));
const AnalyticsPortal = lazy(() => import("./pages/admin/AnalyticsPortal"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout").then(m => ({ default: m.AccountLayout })));
const Profile = lazy(() => import("./pages/account/Profile").then(m => ({ default: m.Profile })));
const WatchHistory = lazy(() => import("./pages/account/WatchHistory").then(m => ({ default: m.WatchHistory })));
const Watchlist = lazy(() => import("./pages/account/Watchlist").then(m => ({ default: m.Watchlist })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then(m => ({ default: m.ResetPassword })));
const Terms = lazy(() => import("./pages/Terms").then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import("./pages/Privacy").then(m => ({ default: m.Privacy })));
const Upload = lazy(() => import("./pages/account/Upload").then(m => ({ default: m.Upload })));
const MyUploads = lazy(() => import("./pages/account/MyUploads").then(m => ({ default: m.MyUploads })));
const Notifications = lazy(() => import("./pages/account/Notifications").then(m => ({ default: m.Notifications })));
const Subscription = lazy(() => import("./pages/account/Subscription").then(m => ({ default: m.Subscription })));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Explore = lazy(() => import("./pages/Explore"));
const Trending = lazy(() => import("./pages/Trending"));
const ContinueWatching = lazy(() => import("./pages/ContinueWatching"));
const CreatorDiscover = lazy(() => import("./pages/CreatorDiscover"));
const StudioLayout = lazy(() => import("./pages/studio/StudioLayout"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
      <p className="text-slate-400">Loading...</p>
    </div>
  </div>
);

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CatalogProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/analytics" element={
              <ProtectedRoute requireAdmin>
                <AnalyticsPortal />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/moderation" element={
              <ProtectedRoute requireAdmin>
                <ModerationPortal />
              </ProtectedRoute>
            } />

            <Route path="/about" element={<AboutUs />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/creator-discover" element={<CreatorDiscover />} />
            <Route path="/studio/*" element={<StudioLayout />} />
            <Route path="/continue-watching" element={
              <ProtectedRoute>
                <ContinueWatching />
              </ProtectedRoute>
            } />

            <Route path="/account" element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }>
              <Route path="profile" element={<Profile />} />
              <Route path="history" element={<WatchHistory />} />
              <Route path="watchlist" element={<Watchlist />} />
              <Route path="upload" element={<Upload />} />
              <Route path="my-uploads" element={<MyUploads />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="subscription" element={<Subscription />} />
            </Route>

            <Route path="*" element={
              <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/genre/:genre" element={<GenrePage />} />
                    <Route path="/region/:name" element={<RegionPage />} />
                    <Route path="/content/:type" element={<ContentTypePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/watch/:id" element={<WatchPage />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                  </Routes>
                </div>
                <Footer />
              </div>
            } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CatalogProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
