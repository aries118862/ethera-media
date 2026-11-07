import { ChevronDown, ExternalLink, LogOut } from 'lucide-react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CommentModeration from '../components/CommentModeration.jsx';
import ContentEditor from '../components/ContentEditor.jsx';
import ContentLibrary from '../components/ContentLibrary.jsx';
import DashboardOverview from '../components/DashboardOverview.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import SocialConnections from '../components/SocialConnections.jsx';
import NotificationCenter from '../components/NotificationCenter.jsx';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const { profile } = useCreatorProfile();
  function signOut() {
    localStorage.removeItem('ethera-token');
    localStorage.removeItem('ethera-user');
    navigate('/login');
  }
  return (
    <div className="dashboard-shell">
      <DashboardSidebar />
      <main className="dashboard-main">
        <header className="dashboard-topbar"><div className="crumb">{profile.name}<span>/</span> {location.pathname.endsWith('/comments') ? 'Community' : location.pathname.includes('/social') ? 'Social channels' : location.pathname.includes('/content') ? 'Your content' : 'Overview'}</div><div className="topbar-right"><NotificationCenter /><div className="dashboard-account-menu"><button className="topbar-user" type="button" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}>{profile.name}<ChevronDown size={14} /></button>{accountOpen && <div className="dashboard-account-panel"><Link to="/explore" onClick={() => setAccountOpen(false)}><ExternalLink size={15} /> View creator feed</Link><button type="button" onClick={signOut}><LogOut size={15} /> Sign out</button></div>}</div></div></header>
        <div className="dashboard-content"><Routes><Route index element={<DashboardOverview />} /><Route path="content" element={<ContentLibrary />} /><Route path="content/new" element={<ContentEditor />} /><Route path="content/:id" element={<ContentEditor />} /><Route path="comments" element={<CommentModeration />} /><Route path="social" element={<SocialConnections />} /></Routes></div>
      </main>
    </div>
  );
}
