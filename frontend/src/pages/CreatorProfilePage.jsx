import { ArrowLeft, ArrowUpRight, Facebook, Globe2, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreatorAvatar from '../components/CreatorAvatar.jsx';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';

function safeExternalUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export default function CreatorProfilePage() {
  const { profile } = useCreatorProfile();
  const page = profile.facebookPage;
  const websiteUrl = safeExternalUrl(page?.website);
  const pageUrl = safeExternalUrl(page?.url);

  return (
    <main className="creator-public-page">
      <div className="creator-public-inner">
        <Link className="back-link" to="/explore"><ArrowLeft size={15} /> Back to feed</Link>
        <article className="creator-public-card">
          <div className="creator-public-cover"><Facebook size={24} /></div>
          <CreatorAvatar profile={{ name: page?.name || profile.name, imageUrl: page?.imageUrl || profile.imageUrl }} className="creator-public-avatar" />
          <div className="creator-public-body">
            <span className="eyebrow">CREATOR PROFILE</span>
            <h1>{page?.name || profile.name}</h1>
            {page?.category && <span className="creator-public-category">{page.category}</span>}
            {profile.publicAge && <p className="creator-public-age"><UserRound size={16} /> {profile.publicAge} years old</p>}
            {page?.about && <p className="creator-public-about">{page.about}</p>}
            <div className="creator-public-links">
              {pageUrl && <a className="button button-dark" href={pageUrl} target="_blank" rel="noreferrer"><Facebook size={16} /> Facebook Page <ArrowUpRight size={14} /></a>}
              {websiteUrl && <a className="button button-outline" href={websiteUrl} target="_blank" rel="noreferrer"><Globe2 size={16} /> Website <ArrowUpRight size={14} /></a>}
            </div>
            {!page && <p className="creator-public-note">Connect a Facebook Page to show its public profile details here.</p>}
          </div>
        </article>
      </div>
    </main>
  );
}
