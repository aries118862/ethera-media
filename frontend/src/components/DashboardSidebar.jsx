import { BarChart3, ExternalLink, FileText, Link2, MessageCircle, Plus, Settings2 } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import CreatorAvatar from './CreatorAvatar.jsx';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';

export default function DashboardSidebar() {
  const creator = JSON.parse(localStorage.getItem('ethera-user') || '{"name":"Creator"}');
  const { profile } = useCreatorProfile();
  return (
    <aside className="dashboard-sidebar">
      <Link to="/" className="brand dashboard-brand"><CreatorAvatar profile={profile} className="brand-mark" /><span>{profile.name}<span className="brand-light"> studio</span></span></Link>
      <div className="dashboard-menu-label">WORKSPACE</div>
      <nav className="dashboard-nav">
        <NavLink to="/dashboard" end><BarChart3 size={17} /> Overview</NavLink>
        <NavLink to="/dashboard/content"><FileText size={17} /> Your content</NavLink>
        <NavLink to="/dashboard/comments"><MessageCircle size={17} /> Community</NavLink>
        <NavLink to="/dashboard/social"><Link2 size={17} /> Social channels</NavLink>
      </nav>
      <Link to="/dashboard/content/new" className="sidebar-new"><Plus size={16} /> Create a story</Link>
      <div className="sidebar-bottom">
        <Link className="public-site-link" to="/explore"><ExternalLink size={16} /> View creator feed</Link>
        <div className="sidebar-profile"><CreatorAvatar profile={profile} className="profile-initial" /><span><strong>{profile.name || creator.name}</strong><small>Creator account</small></span></div>
        <div className="sidebar-version"><Settings2 size={14} /> Studio settings</div>
      </div>
    </aside>
  );
}
