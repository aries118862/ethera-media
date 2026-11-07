import { ArrowLeft, ArrowUpRight, Clock3, Eye, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import LoadingState from '../components/LoadingState.jsx';
import CreatorAvatar from '../components/CreatorAvatar.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ShareMenu from '../components/ShareMenu.jsx';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';
import { apiRequest, mediaImage } from '../services/api.js';
import { facebookVideoEmbedUrl } from '../services/facebook.js';
import { youtubeVideoId } from '../services/youtube.js';

export default function ContentDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { profile } = useCreatorProfile();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [actionError, setActionError] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiRequest(`/contents/${id}`)
      .then((contentResult) => {
        if (active) setContent(contentResult.content);
        return apiRequest(`/contents/${id}/view`, { method: 'POST', body: '{}' });
      })
      .then((result) => {
        if (active) setContent((current) => current ? { ...current, views: result.views } : current);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id, loadAttempt]);

  useEffect(() => {
    if (!loading && location.hash === '#comments') {
      window.requestAnimationFrame(() => {
        document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [loading, location.hash]);

  async function toggleLike() {
    try {
      const result = await apiRequest(`/contents/${id}/like`, { method: 'POST', body: '{}' });
      setLiked(result.liked);
      setContent((current) => ({ ...current, likesCount: result.likesCount }));
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  if (loading) return <main className="detail-page"><LoadingState label="Opening story" /></main>;
  if (error || !content) return <main className="detail-page section-wrap"><div className="notice notice-error">{error || 'Content not found.'}</div><button className="button button-dark detail-retry" type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</button><Link className="underlined-link" to="/explore"><ArrowLeft size={15} /> Back to stories</Link></main>;

  const videoId = content.platform === 'YouTube' && content.type === 'Video'
    ? youtubeVideoId(content.mediaUrl || content.platformUrl)
    : null;
  const isFacebookVideo = content.platform === 'Facebook' && content.type === 'Video';
  const isFacebookTextPost = content.platform === 'Facebook' && !content.thumbnailUrl && !isFacebookVideo;
  const facebookVideoUrl = content.platformUrl || content.mediaUrl;

  return (
    <main className="detail-page">
      <div className="detail-topline section-wrap"><Link to="/explore" className="back-link"><ArrowLeft size={15} /> All stories</Link><span className="eyebrow">{content.category} / {content.type}</span></div>
      <article className="detail-article">
        <header className="detail-header section-wrap">
          <span className="eyebrow">A story from {profile.name}</span>
          <h1>{content.title}</h1>
          <p className="detail-deck">{content.description}</p>
          <div className="detail-byline"><CreatorAvatar profile={profile} className="creator-avatar" /><span>{profile.name}</span><span className="byline-dot">·</span><span>{content.publishedAt ? new Date(content.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'New story'}</span><span className="byline-dot">·</span><span><Clock3 size={14} /> 4 min read</span></div>
        </header>
        {videoId ? (
          <div className="detail-video"><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`} title={content.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
        ) : isFacebookVideo && facebookVideoUrl ? (
          <div className="detail-video"><iframe src={facebookVideoEmbedUrl(facebookVideoUrl)} title={content.title} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" loading="lazy" allowFullScreen /></div>
        ) : isFacebookTextPost ? (
          <div className="detail-facebook-text-post"><span className="facebook-text-post-content">{content.description}</span></div>
        ) : content.thumbnailUrl ? (
          <div className="detail-cover"><img src={mediaImage(content.thumbnailUrl)} alt="" /></div>
        ) : null}
        <div className="detail-body">
          <aside className="detail-actions"><button onClick={toggleLike} className={liked ? 'is-liked' : ''} aria-label="Like this story"><Heart size={19} fill={liked ? 'currentColor' : 'none'} /><span>{content.likesCount || 0}</span></button><span><Eye size={18} /> {content.views || 0}</span><ShareMenu content={content} className="detail-share-action" />{actionError && <p className="detail-action-error" role="alert">{actionError}</p>}</aside>
          <div className="detail-prose">{content.articleContent ? <div className="article-content">{content.articleContent.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : !isFacebookTextPost && <p>{content.description}</p>}{content.mediaUrl && !videoId && !isFacebookVideo && <a className="media-link" href={content.mediaUrl} target="_blank" rel="noreferrer">Open {content.type.toLowerCase()} <ArrowUpRight size={16} /></a>}</div>
        </div>
      </article>
      <section className="comments-section" id="comments">
        <div className="comments-inner">
          <div className="comments-heading"><span className="eyebrow">The conversation</span><h2>Leave a little note.</h2><p>Good conversations make good stories even better.</p></div>
          <CommentThread contentId={id} />
        </div>
      </section>
    </main>
  );
}
