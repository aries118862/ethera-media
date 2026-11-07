import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreatorAvatar from './CreatorAvatar.jsx';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';

export default function SiteFooter() {
  const { profile } = useCreatorProfile();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link className="brand footer-brand" to="/explore">
          <CreatorAvatar profile={profile} className="brand-mark" /><span>{profile.name}</span>
        </Link>
        <p>{profile.introduction || 'Videos, ideas, and updates shared by the creator.'}</p>
        <Link to="/explore">Explore the journal <ArrowUpRight size={14} /></Link>
        <span className="footer-copy">© {new Date().getFullYear()} {profile.name}</span>
      </div>
    </footer>
  );
}
