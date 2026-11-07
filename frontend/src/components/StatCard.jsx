import { ArrowUpRight } from 'lucide-react';

export default function StatCard({ label, value, note, icon: Icon }) {
  return <article className="stat-card"><div className="stat-top"><span className="stat-icon"><Icon size={18} /></span><ArrowUpRight size={15} className="stat-arrow" /></div><strong>{Number(value || 0).toLocaleString()}</strong><span className="stat-label">{label}</span><small>{note}</small></article>;
}
