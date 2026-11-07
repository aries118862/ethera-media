import { Eye, FileText, Heart, MessageCircle, Plus, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from './StatCard.jsx';
import { apiRequest } from '../services/api.js';

export default function DashboardOverview() {
  const [data, setData] = useState({ stats: {}, popular: [] });
  const [error, setError] = useState('');
  const creator = JSON.parse(localStorage.getItem('ethera-user') || '{"name":"Creator"}');

  useEffect(() => {
    apiRequest('/dashboard/stats')
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="overview-page">
      <div className="dashboard-title-row"><div><span className="eyebrow">YOUR CREATOR STUDIO</span><h1>Good to see you, {creator.name?.split(' ')[0]}.</h1><p>Here’s what’s happening with your stories.</p></div><Link to="/dashboard/content/new" className="button button-dark"><Plus size={16} /> New story</Link></div>
      {error && <div className="notice notice-error">{error}</div>}
      <div className="stats-grid">
        <StatCard label="Total stories" value={data.stats.total} note="Across your library" icon={FileText} />
        <StatCard label="Published" value={data.stats.published} note="Live for your audience" icon={TrendingUp} />
        <StatCard label="Total views" value={data.stats.views} note="People who stopped by" icon={Eye} />
        <StatCard label="Community" value={data.stats.comments} note={`${data.stats.likes || 0} appreciations`} icon={MessageCircle} />
      </div>
      <div className="overview-panels">
        <section className="panel popular-panel">
          <div className="panel-heading"><div><span className="eyebrow">THE AUDIENCE LOVES</span><h2>Most-read stories</h2></div><TrendingUp size={18} /></div>
          {data.popular?.length ? data.popular.map((item, index) => <div className="popular-row" key={item._id}><span className="popular-rank">0{index + 1}</span><strong>{item.title}</strong><span><Eye size={14} /> {item.views || 0}</span></div>) : <div className="panel-empty">Your popular stories will appear here as people discover them.</div>}
        </section>
        <section className="panel quick-panel">
          <div className="panel-heading"><div><span className="eyebrow">A QUICK PULSE</span><h2>Your library</h2></div><Heart size={18} /></div>
          <div className="library-stat"><span>Ideas in draft</span><strong>{data.stats.drafts || 0}</strong></div>
          <div className="library-stat"><span>On the calendar</span><strong>{data.stats.scheduled || 0}</strong></div>
          <div className="library-stat"><span>Likes received</span><strong>{data.stats.likes || 0}</strong></div>
          <Link className="panel-link" to="/dashboard/content">Manage your stories <Plus size={15} /></Link>
        </section>
      </div>
      <div className="dashboard-tip"><span>✳</span><p><strong>A small reminder:</strong> Your next great story doesn't need to be perfect. It just needs to be shared.</p></div>
    </div>
  );
}
