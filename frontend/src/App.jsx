import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SiteHeader from './components/SiteHeader.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import ContentDetailPage from './pages/ContentDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreatorProfilePage from './pages/CreatorProfilePage.jsx';
import { isCreatorUser } from './services/api.js';
import { CreatorProfileProvider } from './context/CreatorProfileContext.jsx';

function CreatorRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('ethera-user') || 'null');
  if (!localStorage.getItem('ethera-token')) return <Navigate to="/login" replace />;
  if (!isCreatorUser(user)) return <Navigate to="/" replace />;
  return children;
}

function FeedRoute({ children }) {
  if (!localStorage.getItem('ethera-token')) return <Navigate to="/" replace />;
  return children;
}

function LandingRoute() {
  const user = JSON.parse(localStorage.getItem('ethera-user') || 'null');
  if (localStorage.getItem('ethera-token')) {
    return <Navigate to={isCreatorUser(user) ? '/dashboard' : '/explore'} replace />;
  }
  return <LoginPage />;
}

function Layout() {
  const { pathname } = useLocation();
  const dashboard = pathname.startsWith('/dashboard');
  const authentication = pathname === '/' || pathname === '/login';
  return (
    <div className="app-shell">
      {!dashboard && !authentication && <SiteHeader />}
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/explore" element={<FeedRoute><ExplorePage /></FeedRoute>} />
        <Route path="/creator" element={<CreatorProfilePage />} />
        <Route path="/content/:id" element={<FeedRoute><ContentDetailPage /></FeedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/*" element={<CreatorRoute><DashboardPage /></CreatorRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!dashboard && !authentication && <SiteFooter />}
    </div>
  );
}

export default function App() {
  return (
    <CreatorProfileProvider>
      <Layout />
    </CreatorProfileProvider>
  );
}
