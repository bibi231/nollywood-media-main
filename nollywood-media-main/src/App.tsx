import { useState, lazy, Suspense, Component, ErrorInfo, ReactNode } from "react";
import { CatalogProvider } from "./context/CatalogProvider";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toast";
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
const StudioLayout = lazy(() => import("./pages/studio/StudioLayout").then(m => ({ default: m.StudioLayout })));
const StudioDashboard = lazy(() => import("./pages/studio/Dashboard").then(m => ({ default: m.StudioDashboard })));
const StudioContent = lazy(() => import("./pages/studio/Content").then(m => ({ default: m.StudioContent })));
const StudioAnalytics = lazy(() => import("./pages/studio/Analytics").then(m => ({ default: m.StudioAnalytics })));
const StudioSubscribers = lazy(() => import("./pages/studio/Subscribers").then(m => ({ default: m.StudioSubscribers })));
const StudioComments = lazy(() => import("./pages/studio/Comments").then(m => ({ default: m.StudioComments })));
const StudioEarn = lazy(() => import("./pages/studio/Earn").then(m => ({ default: m.StudioEarn })));
const StudioSettings = lazy(() => import("./pages/studio/Settings").then(m => ({ default: m.StudioSettings })));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboardNested = lazy(() => import("./pages/admin/Dashboard").then(m => ({ default: m.AdminDashboard })));
const AdminFilms = lazy(() => import("./pages/admin/Films").then(m => ({ default: m.AdminFilms })));
const AdminFilmEditor = lazy(() => import("./pages/admin/FilmEditor").then(m => ({ default: m.FilmEditor })));
const AdminAddFilm = lazy(() => import("./pages/admin/AddFilm").then(m => ({ default: m.AddFilm })));
const AdminUsers = lazy(() => import("./pages/admin/Users").then(m => ({ default: m.AdminUsers })));
const AdminModeration = lazy(() => import("./pages/admin/Moderation").then(m => ({ default: m.AdminModeration })));
const AdminCompliance = lazy(() => import("./pages/admin/Compliance").then(m => ({ default: m.AdminCompliance })));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics").then(m => ({ default: m.AdminAnalytics })));
const AdminSettings = lazy(() => import("./pages/admin/Settings").then(m => ({ default: m.AdminSettings })));
const AdminUpload = lazy(() => import("./pages/admin/Upload").then(m => ({ default: m.AdminUpload })));
const AdminUserUploads = lazy(() => import("./pages/admin/UserUploads").then(m => ({ default: m.UserUploads })));
const Press = lazy(() => import("./pages/Press"));
const Blog = lazy(() => import("./pages/Blog"));
const Forums = lazy(() => import("./pages/Forums"));
const Contributors = lazy(() => import("./pages/Contributors"));
const Partners = lazy(() => import("./pages/Partners"));
const Advertise = lazy(() => import("./pages/Advertise"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));
const AccountSettings = lazy(() => import("./pages/account/Settings").then(m => ({ default: m.Settings })));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const Community = lazy(() => import("./pages/Community"));
const AccountPlaylists = lazy(() => import("./pages/account/Playlists").then(m => ({ default: m.Playlists })));

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
        <ToastProvider>
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
                  <Route path="/creator/:id" element={<CreatorProfile />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/creator-discover" element={<CreatorDiscover />} />
                  <Route path="/studio" element={
                    <ProtectedRoute>
                      <StudioLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<StudioDashboard />} />
                    <Route path="content" element={<StudioContent />} />
                    <Route path="analytics" element={<StudioAnalytics />} />
                    <Route path="subscribers" element={<StudioSubscribers />} />
                    <Route path="comments" element={<StudioComments />} />
                    <Route path="earn" element={<StudioEarn />} />
                    <Route path="settings" element={<StudioSettings />} />
                  </Route>

                  <Route path="/admin/cms" element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<AdminDashboardNested />} />
                    <Route path="films" element={<AdminFilms />} />
                    <Route path="films/new" element={<AdminAddFilm />} />
                    <Route path="films/edit/:id" element={<AdminFilmEditor />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="moderation" element={<AdminModeration />} />
                    <Route path="compliance" element={<AdminCompliance />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="upload" element={<AdminUpload />} />
                    <Route path="user-uploads" element={<AdminUserUploads />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                  <Route path="/press" element={<Press />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/forums" element={<Forums />} />
                  <Route path="/contributors" element={<Contributors />} />
                  <Route path="/partners" element={<Partners />} />
                  <Route path="/advertise" element={<Advertise />} />
                  <Route path="/cookies" element={<CookiesPage />} />
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
                    <Route path="settings" element={<AccountSettings />} />
                    <Route path="playlists" element={<AccountPlaylists />} />
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
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
