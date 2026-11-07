import { Heart, MessageCircle, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api.js';

function updateComment(comments, id, update) {
  return comments.map((comment) => comment._id === id
    ? update(comment)
    : { ...comment, replies: updateComment(comment.replies || [], id, update) });
}

function addReply(comments, parentId, reply) {
  return comments.map((comment) => comment._id === parentId
    ? { ...comment, replies: [reply, ...(comment.replies || [])] }
    : { ...comment, replies: addReply(comment.replies || [], parentId, reply) });
}

function countComments(comments) {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies || []), 0);
}

export default function CommentThread({ contentId, inline = false, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const viewer = JSON.parse(localStorage.getItem('ethera-user') || 'null');
  const signedIn = Boolean(localStorage.getItem('ethera-token'));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    apiRequest(`/comments/${contentId}`)
      .then((result) => {
        if (active) {
          const nextComments = result.comments || [];
          setComments(nextComments);
        }
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [contentId, loadAttempt]);

  useEffect(() => {
    if (!loading && !loadError) onCountChange?.(countComments(comments));
  }, [comments, loadError, loading, onCountChange]);

  async function submitComment(event, parentId = null) {
    event.preventDefault();
    const text = parentId ? replyMessage : message;
    if (!text.trim()) return;
    setActionError('');
    setFeedback('');
    setSubmitting(true);
    try {
      const result = await apiRequest(
        parentId ? `/comments/${parentId}/replies` : '/comments',
        {
          method: 'POST',
          body: JSON.stringify(parentId
            ? { message: text, displayName: viewer?.name }
            : { contentId, message: text, displayName: viewer?.name }),
        },
      );
      const created = { ...result.comment, replies: [], likesCount: 0, likedByViewer: false };
      if (created.status === 'Approved') {
        setComments((current) => parentId ? addReply(current, parentId, created) : [created, ...current]);
        setFeedback(parentId ? 'Reply posted.' : 'Comment posted.');
      } else {
        setFeedback('Your comment was submitted for review.');
      }
      if (parentId) {
        setReplyMessage('');
        setReplyingTo('');
      } else {
        setMessage('');
      }
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleCommentLike(comment) {
    setActionError('');
    try {
      const result = await apiRequest(`/comments/${comment._id}/like`, { method: 'POST', body: '{}' });
      setComments((current) => updateComment(current, comment._id, (item) => ({
        ...item,
        likedByViewer: result.liked,
        likesCount: result.likesCount,
      })));
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  function renderComment(comment, depth = 0) {
    return (
      <article className="thread-comment" key={comment._id} style={{ '--reply-depth': Math.min(depth, 3) }}>
        <span className="comment-avatar">{comment.displayName?.charAt(0).toUpperCase() || 'V'}</span>
        <div className="thread-comment-content">
          <div className="thread-comment-bubble">
            <div className="thread-comment-meta"><strong>{comment.displayName}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></div>
            <p>{comment.message}</p>
          </div>
          <div className="thread-comment-actions">
            <button type="button" className={comment.likedByViewer ? 'is-liked' : ''} disabled={!signedIn} aria-pressed={Boolean(comment.likedByViewer)} onClick={() => toggleCommentLike(comment)}>
              <Heart size={14} fill={comment.likedByViewer ? 'currentColor' : 'none'} /> Like{comment.likesCount ? ` · ${comment.likesCount}` : ''}
            </button>
            <button type="button" disabled={!signedIn} aria-expanded={replyingTo === comment._id} onClick={() => { setReplyingTo(replyingTo === comment._id ? '' : comment._id); setReplyMessage(''); }}>
              <MessageCircle size={14} /> Reply
            </button>
          </div>
          {replyingTo === comment._id && <form className="thread-reply-form" onSubmit={(event) => submitComment(event, comment._id)}>
            <textarea aria-label={`Reply to ${comment.displayName}`} placeholder={`Reply to ${comment.displayName}…`} rows="2" maxLength="1000" value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} required />
            <button type="submit" className="button button-dark" disabled={submitting}><Send size={13} /> {submitting ? 'Posting…' : 'Reply'}</button>
          </form>}
          {(comment.replies || []).map((reply) => renderComment(reply, depth + 1))}
        </div>
      </article>
    );
  }

  return (
    <div className={inline ? 'inline-comments' : 'comment-thread'}>
      {loading ? <p className="inline-comments-note">Loading comments…</p> : loadError
        ? <p className="inline-comments-error" role="alert">{loadError}<button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</button></p>
        : comments.length
          ? <div className="thread-comment-list">{comments.map((comment) => renderComment(comment))}</div>
          : <p className="inline-comments-note">No comments yet. Start the conversation.</p>}
      {signedIn
        ? <form className={inline ? 'inline-comment-form' : 'comment-form'} onSubmit={submitComment}>
          <textarea aria-label="Write a comment" placeholder="Write a comment…" maxLength="1000" rows={inline ? 2 : 3} value={message} onChange={(event) => setMessage(event.target.value)} required />
          <button type="submit" className="button button-dark" disabled={submitting}><Send size={14} /> {submitting ? 'Posting…' : 'Post comment'}</button>
        </form>
        : <p className="comment-signin">Sign in to like or reply to comments. <Link className="underlined-link" to="/login">Sign in</Link></p>}
      {actionError && <p className="inline-comments-submit-error" role="alert">{actionError}</p>}
      {feedback && <p className="inline-comments-feedback" role="status">{feedback}</p>}
    </div>
  );
}
