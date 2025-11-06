import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import EventsPage from '@/pages/EventsPage';
import GalleryPage from '@/pages/GalleryPage';
import AboutPage from '@/pages/AboutPage';
import ProfilePage from '@/pages/ProfilePage';
import PublicProfilePage from '@/pages/PublicProfilePage';
import MessagesPage from '@/pages/MessagesPage';
import AdminPage from '@/pages/AdminPage';
import ContactPage from '@/pages/ContactPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.isAdmin ? <>{children}</> : <Navigate to="/" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/profile/:username" element={<PublicProfilePage />} />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
