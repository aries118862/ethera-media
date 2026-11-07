import { ArrowUpRight, Heart, MessageCircle, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { apiRequest, mediaImage } from '../services/api.js';
import { facebookVideoEmbedUrl } from '../services/facebook.js';
import CreatorAvatar from './CreatorAvatar.jsx';
import InlineComments from './InlineComments.jsx';
import ShareMenu from './ShareMenu.jsx';
import { youtubeVideoId } from '../services/youtube.js';

export default function ContentCard({ content, featured = false, variant, creatorProfile }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(content.likesCount || 0);
  const [actionError, setActionError] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(content.commentsCount || 0);
  const [playing, setPlaying] = useState(false);
  const isFeedPost = variant === 'feed';
  const isFacebookPost = content.platform === 'Facebook';
  const isFacebookTextPost = isFacebookPost && !content.thumbnailUrl && content.type !== 'Video';
  const facebookVideoUrl = content.platformUrl || content.mediaUrl;
  const videoId = content.type === 'Video'
    ? youtubeVideoId(content.mediaUrl || content.platformUrl)
    : null;

  async function toggleLike() {
    if (!localStorage.getItem('ethera-token')) {
      navigate('/login');
      return;
    }
    try {
      const result = await apiRequest(`/contents/${content._id}/like`, {
        method: 'POST',
        body: '{}',
      });
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (error) {
      setActionError(error.message);
    }
  }

  function renderVideo() {
    if (content.platform === 'Facebook' && content.type === 'Video' && facebookVideoUrl) {
      return <div className="card-image-wrap card-video-frame facebook-video-frame">
        <iframe
          src={facebookVideoEmbedUrl(facebookVideoUrl)}
          title={content.title}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          loading="lazy"
          allowFullScreen
        />
      </div>;
    }
    if (playing && videoId) {
      return <div className="card-image-wrap card-video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1`}
          title={content.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>;
    }
    if (isFeedPost && videoId) {
      return <button type="button" className="card-image-wrap card-video-launch" onClick={() => setPlaying(true)} aria-label={`Play ${content.title}`}>
        <img src={mediaImage(content.thumbnailUrl)} alt="" className="card-image" loading="lazy" />
        <span className="play-indicator"><Play size={16} fill="currentColor" /></span>
      </button>;
    }
    if (isFeedPost && isFacebookTextPost) {
      return <div className="facebook-text-post">
        <span className="facebook-text-post-content">{content.description}</span>
      </div>;
    }
    return <Link className="card-image-wrap" to={`/content/${content._id}`}>
      <img src={mediaImage(content.thumbnailUrl)} alt="" className="card-image" loading="lazy" />
      {!isFeedPost && <span className="card-type">{content.platform || content.type || 'Story'}</span>}
      {content.type === 'Video' && <span className="play-indicator"><Play size={16} fill="currentColor" /></span>}
    </Link>;
  }

  const publishedDate = content.publishedAt
    ? new Date(content.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently shared';

  return (
    <article className={`${isFeedPost ? 'social-post' : 'content-card'}${featured ? ' content-card-featured' : ''}`}>
      {isFeedPost && <header className="social-post-header">
        <Link to="/creator" className="social-post-creator-link">
          <CreatorAvatar profile={creatorProfile} className="social-avatar" />
          <span><strong>{creatorProfile?.name || 'Creator'}</strong><small>{content.platform || 'Ethera'} · {publishedDate}</small></span>
        </Link>
        <span className="social-post-category">{content.category}</span>
      </header>}
      {renderVideo()}
      <div className="card-copy">
        {!isFeedPost && <div className="card-meta"><span>{content.category}</span><span>{publishedDate}</span></div>}
        {!isFacebookTextPost && <><h3><Link to={`/content/${content._id}`}>{content.title}</Link></h3>
          <p>{content.description}</p></>}
        {isFeedPost ? <div className="social-post-actions">
          <button type="button" className={liked ? 'social-action is-liked' : 'social-action'} onClick={toggleLike} aria-pressed={liked}>
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} /> <span>{likesCount || 'Like'}</span>
          </button>
          <button type="button" className="social-action" aria-expanded={commentsOpen} aria-controls={`comments-${content._id}`} onClick={() => setCommentsOpen((open) => !open)}><MessageCircle size={18} /> {commentsOpen ? 'Hide comments' : 'Comment'}</button>
          <ShareMenu content={content} />
        </div> : <div className="card-bottom"><span><Heart size={14} /> {likesCount}</span><Link to={`/content/${content._id}`} aria-label={`Read ${content.title}`}><ArrowUpRight size={17} /></Link></div>}
        {isFeedPost && commentsCount > 0 && <button
          type="button"
          className="social-post-comment-count"
          aria-expanded={commentsOpen}
          aria-controls={`comments-${content._id}`}
          onClick={() => setCommentsOpen((open) => !open)}
        >
          {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
        </button>}
        {actionError && <p className="social-post-feedback" role="alert">{actionError}</p>}
      </div>
      {isFeedPost && commentsOpen && <div id={`comments-${content._id}`}><InlineComments contentId={content._id} onCountChange={setCommentsCount} /></div>}
    </article>
  );
}
