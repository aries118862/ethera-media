import { Check, EyeOff, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';

export default function CommentModeration() {
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    apiRequest('/comments/manage/all')
      .then((result) => setComments(result.comments || []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function moderate(id, status) {
    try {
      const result = await apiRequest(`/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setComments((current) => current.map((item) => item._id === id ? result.comment : item));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function remove(id) {
    try {
      await apiRequest(`/comments/${id}`, { method: 'DELETE' });
      const result = await apiRequest('/comments/manage/all');
      setComments(result.comments || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitReply(event, commentId) {
    event.preventDefault();
    setError('');
    setReplying(true);
    try {
      await apiRequest(`/comments/${commentId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ message: replyMessage }),
      });
      setReplyingTo('');
      setReplyMessage('');
      const result = await apiRequest('/comments/manage/all');
      setComments(result.comments || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="community-page">
      <div className="dashboard-title-row"><div><span className="eyebrow">THE COMMUNITY</span><h1>Notes from your readers</h1><p>Keep the conversation warm, thoughtful, and kind.</p></div><span className="community-count"><MessageCircle size={16} /> {comments.length} notes</span></div>
      {error && <div className="notice notice-error">{error}</div>}
      {loading ? <div className="loading-state"><span className="loader" /> Gathering notes...</div> : comments.length ? <div className="moderation-list">{comments.map((comment) => <article className="moderation-item" key={comment._id}><span className="comment-avatar">{comment.displayName.charAt(0).toUpperCase()}</span><div className="moderation-copy"><div className="moderation-meta"><strong>{comment.displayName}</strong><span>{new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><span className={`status-pill status-${comment.status.toLowerCase()}`}>{comment.status}</span></div><p>{comment.message}</p><small>On: {comment.content?.title || 'Story'}</small>{comment.status === 'Approved' && <div className="moderation-reply">{replyingTo === comment._id ? <form onSubmit={(event) => submitReply(event, comment._id)}><textarea aria-label={`Reply to ${comment.displayName}`} placeholder={`Reply to ${comment.displayName}…`} rows="2" maxLength="1000" value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} required /><div><button type="submit" className="button button-dark" disabled={replying}><Send size={14} /> {replying ? 'Sending…' : 'Send reply'}</button><button type="button" className="moderation-cancel-reply" onClick={() => { setReplyingTo(''); setReplyMessage(''); }}>Cancel</button></div></form> : <button type="button" onClick={() => { setReplyingTo(comment._id); setReplyMessage(''); }}><MessageCircle size={14} /> Reply</button>}</div>}</div><div className="moderation-actions">{comment.status !== 'Approved' && <button onClick={() => moderate(comment._id, 'Approved')} aria-label="Approve comment" title="Approve"><Check size={16} /></button>}{comment.status !== 'Hidden' && <button onClick={() => moderate(comment._id, 'Hidden')} aria-label="Hide comment" title="Hide"><EyeOff size={16} /></button>}<button onClick={() => remove(comment._id)} aria-label="Delete comment" title="Delete"><Trash2 size={16} /></button></div></article>)}</div> : <div className="empty-state dashboard-empty"><span className="empty-sparkle">✳</span><h3>No notes yet.</h3><p>When readers join the conversation, you’ll find their notes here.</p></div>}
    </div>
  );
}
