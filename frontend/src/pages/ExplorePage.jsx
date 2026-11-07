import { Bookmark, Compass, Sparkles, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ContentGrid from '../components/ContentGrid.jsx';
import CreatorAvatar from '../components/CreatorAvatar.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';
import { apiRequest } from '../services/api.js';

export default function ExplorePage() {
  const { profile } = useCreatorProfile();
  const viewer = JSON.parse(localStorage.getItem('ethera-user') || 'null');
  const [contents, setContents] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [recentCommentsError, setRecentCommentsError] = useState('');
  const [searchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const [category, setCategory] = useState('All');
  const [feedType, setFeedType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiRequest('/contents')
      .then((result) => {
        if (active) setContents(result.contents || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadAttempt]);

  useEffect(() => {
    let active = true;
    apiRequest('/comments/recent')
      .then((result) => {
        if (active) setRecentComments(result.comments || []);
      })
      .catch((requestError) => {
        if (active) setRecentCommentsError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ['All', ...new Set(contents.map((content) => content.category).filter(Boolean))], [contents]);
  const filtered = contents.filter((content) => {
    const text = `${content.title} ${content.description} ${content.category}`.toLowerCase();
    const typeMatches = feedType === 'All'
      || (feedType === 'Videos' ? content.type === 'Video' : content.type !== 'Video');
    return typeMatches
      && (category === 'All' || content.category === category)
      && text.includes(search.trim().toLowerCase());
  });

  return (
    <main className="explore-page social-explore-page">
      <div className="social-explore-heading">
        <div><span className="eyebrow">CREATOR COMMUNITY</span><h1>Your feed</h1><p>Videos and posts from {profile.name}, all in one place.</p></div>
        <span className="social-heading-mark"><Sparkles size={22} /></span>
      </div>
      <div className="social-explore-layout">
        <aside className="social-feed-sidebar">
          <div className="social-sidebar-card">
            <CreatorAvatar profile={profile} className="social-sidebar-avatar" />
            <strong>{profile.name}</strong>
            <span>{profile.introduction || 'Videos and ideas shared here.'}</span>
          </div>
          <button type="button" className={feedType === 'All' ? 'social-sidebar-link active' : 'social-sidebar-link'} onClick={() => { setFeedType('All'); setCategory('All'); }}><Compass size={18} /> For you</button>
          <button type="button" className={feedType === 'Videos' ? 'social-sidebar-link active' : 'social-sidebar-link'} onClick={() => setFeedType('Videos')}><Video size={18} /> Videos</button>
          <button type="button" className={feedType === 'Posts' ? 'social-sidebar-link active' : 'social-sidebar-link'} onClick={() => setFeedType('Posts')}><Bookmark size={18} /> Posts</button>
          <div className="social-sidebar-categories"><span>EXPLORE TOPICS</span>{categories.filter((item) => item !== 'All').map((item) => <button type="button" key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        </aside>
        <section className="social-feed-main" aria-label="Public content feed">
          <div className="social-feed-toolbar">
            <span className="result-count">{filtered.length} {filtered.length === 1 ? 'post' : 'posts'}</span>
          </div>
          <div className="social-feed-tabs" aria-label="Filter feed">
            {['All', 'Videos', 'Posts'].map((item) => <button type="button" key={item} className={feedType === item ? 'active' : ''} onClick={() => setFeedType(item)}>{item}</button>)}
          </div>
          <div className="category-list" aria-label="Filter by category">{categories.map((item) => <button key={item} className={category === item ? 'category-chip active' : 'category-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div>
          {error && <div className="notice notice-error" role="alert">{error}<button className="feed-retry" type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Reconnect</button></div>}
          {loading ? <LoadingState /> : <ContentGrid contents={filtered} variant="feed" creatorProfile={profile} />}
          {!localStorage.getItem('ethera-token') && <div className="social-join-note">Join the conversation: <a href="/login">sign in or create a viewer account</a>.</div>}
        </section>
        <aside className="social-feed-right">
          <div className="social-sidebar-card social-viewer-profile">
            <span className="eyebrow">YOUR PROFILE</span>
            <CreatorAvatar profile={viewer} className="social-viewer-avatar" />
            <strong>{viewer?.name || 'Your account'}</strong>
            {viewer?.email && <span className="social-viewer-email">{viewer.email}</span>}
            <div className="social-viewer-divider" />
            <span className="social-viewer-label">Following creator</span>
            <Link className="social-viewer-creator" to="/creator"><CreatorAvatar profile={profile} className="social-viewer-creator-avatar" /><span><strong>{profile.name}</strong><small>Creator profile</small></span></Link>
          </div>
          <section className="social-sidebar-card social-recent-comments" aria-label="Latest comments and replies">
            <div className="social-recent-heading"><span className="eyebrow">COMMUNITY</span><strong>Latest conversations</strong></div>
            {recentComments.length ? <div className="social-recent-list">
              {recentComments.map((comment) => (
                <Link className="social-recent-comment" key={comment._id} to={`/content/${comment.content._id}#comments`}>
                  <span className="social-recent-avatar">{comment.displayName?.charAt(0).toUpperCase() || 'V'}</span>
                  <span className="social-recent-copy">
                    <span><strong>{comment.displayName}</strong>{comment.parentComment ? ` replied to ${comment.parentComment.displayName}` : ' commented'}</span>
                    <span className="social-recent-message">{comment.message}</span>
                    <small>{comment.content.title}</small>
                  </span>
                </Link>
              ))}
            </div> : recentCommentsError
              ? <p className="social-recent-empty" role="alert">{recentCommentsError}</p>
              : <p className="social-recent-empty">New comments and replies will appear here.</p>}
          </section>
        </aside>
      </div>
    </main>
  );
}
