import { ArrowUpRight, Facebook, FileText, Pencil, Plus, RefreshCw, Trash2, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest, mediaImage } from '../services/api.js';

const sources = [
  { id: 'All', label: 'All content' },
  { id: 'Ethera', label: 'Ethera' },
  { id: 'YouTube', label: 'YouTube' },
  { id: 'Facebook', label: 'Facebook' },
];

const types = [
  { id: 'All', label: 'All types' },
  { id: 'Video', label: 'Videos' },
  { id: 'Article', label: 'Articles & posts' },
  { id: 'Image', label: 'Images' },
  { id: 'Podcast', label: 'Podcasts' },
];

export default function ContentLibrary() {
  const [contents, setContents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSource = sources.some((source) => source.id === searchParams.get('platform'))
    ? searchParams.get('platform')
    : 'All';
  const selectedType = types.some((type) => type.id === searchParams.get('type'))
    ? searchParams.get('type')
    : 'All';

  async function loadContents(source = selectedSource, type = selectedType) {
    setError('');
    try {
      const query = source === 'All' ? '' : `&platform=${encodeURIComponent(source)}`;
      const typeQuery = type === 'All' ? '' : `&type=${encodeURIComponent(type)}`;
      const result = await apiRequest(`/contents?all=true${query}${typeQuery}`);
      setContents(result.contents || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContents();
    apiRequest('/social/accounts')
      .then((result) => setAccounts(result.accounts || []))
      .catch((requestError) => setError(`Could not load connected channels: ${requestError.message}`));
  }, [selectedSource, selectedType]);

  async function syncProvider(provider) {
    const account = accounts.find((item) => item.provider === provider);
    if (!account) {
      setSearchParams({ platform: provider === 'google' ? 'YouTube' : 'Facebook' });
      return;
    }
    setBusy(provider);
    setError('');
    setNotice('');
    try {
      const result = await apiRequest(`/social/sync/${provider}`, { method: 'POST', body: '{}' });
      setNotice(result.message);
      await loadContents();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  }

  async function removeContent(content) {
    if (!window.confirm(`Delete "${content.title}" from Ethera? This also removes its Ethera comments and likes.`)) return;
    try {
      await apiRequest(`/contents/${content._id}`, { method: 'DELETE' });
      setContents((current) => current.filter((item) => item._id !== content._id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const connectedCount = accounts.filter((account) => ['google', 'facebook'].includes(account.provider)).length;
  const SourceIcon = ({ source }) => source === 'YouTube' ? <Youtube size={13} /> : source === 'Facebook' ? <Facebook size={13} /> : <FileText size={13} />;

  return (
    <div className="library-page">
      <div className="dashboard-title-row">
        <div><span className="eyebrow">THE STORY ARCHIVE</span><h1>Your content</h1><p>Your Ethera stories and official social posts, together in one library.</p></div>
        <Link to="/dashboard/content/new" className="button button-dark"><Plus size={16} /> Create a story</Link>
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      {notice && <div className="notice notice-success">{notice}</div>}
      <section className="library-channel-tools" aria-label="Connected channel sync">
        <div><strong>Channel library</strong><span>{connectedCount ? `${connectedCount} connected ${connectedCount === 1 ? 'channel' : 'channels'}` : 'Link YouTube or Facebook to import official posts.'}</span></div>
        <div className="library-channel-actions">
          <button type="button" className="button button-outline" disabled={Boolean(busy)} onClick={() => syncProvider('google')}>
            <RefreshCw size={14} className={busy === 'google' ? 'spin-icon' : ''} /> {busy === 'google' ? 'Syncing...' : 'Sync YouTube'}
          </button>
          <button type="button" className="button button-outline" disabled={Boolean(busy)} onClick={() => syncProvider('facebook')}>
            <RefreshCw size={14} className={busy === 'facebook' ? 'spin-icon' : ''} /> {busy === 'facebook' ? 'Syncing...' : 'Sync Facebook'}
          </button>
          <Link to="/dashboard/social" className="library-channel-link">Channel settings <ArrowUpRight size={14} /></Link>
        </div>
      </section>
      <div className="library-source-tabs" role="tablist" aria-label="Filter content by source">
        {sources.map((source) => (
          <button
            type="button"
            role="tab"
            aria-selected={selectedSource === source.id}
            className={selectedSource === source.id ? 'active' : ''}
            key={source.id}
            onClick={() => setSearchParams(source.id === 'All' ? {} : { platform: source.id })}
          >
            <SourceIcon source={source.id} />{source.label}
          </button>
        ))}
      </div>
      <div className="library-type-tabs" role="tablist" aria-label="Filter content by type">
        {types.map((type) => (
          <button
            type="button"
            role="tab"
            aria-selected={selectedType === type.id}
            className={selectedType === type.id ? 'active' : ''}
            key={type.id}
            onClick={() => {
              const next = {};
              if (selectedSource !== 'All') next.platform = selectedSource;
              if (type.id !== 'All') next.type = type.id;
              setSearchParams(next);
            }}
          >
            {type.label}
          </button>
        ))}
      </div>
      <div className="library-filters"><span>{contents.length} {contents.length === 1 ? 'item' : 'items'}</span><span className="library-filter-note"><FileText size={14} /> Drafts, scheduled & published</span></div>
      {loading ? <div className="loading-state"><span className="loader" /> Loading your library...</div> : contents.length ? (
        <div className="content-table-wrap"><table className="content-table"><thead><tr><th>CONTENT</th><th>SOURCE</th><th>STATUS</th><th>DATE</th><th>ENGAGEMENT</th><th>ACTIONS</th></tr></thead><tbody>
          {contents.map((content) => (
            <tr key={content._id}>
              <td><div className="table-story"><img src={mediaImage(content.thumbnailUrl)} alt="" /><span><strong>{content.title}</strong><small>{content.category} · {content.type}</small></span></div></td>
              <td><span className={`source-pill source-${content.platform?.toLowerCase()}`}><SourceIcon source={content.platform} />{content.platform || 'Ethera'}</span></td>
              <td><span className={`status-pill status-${content.status?.toLowerCase()}`}>{content.status}</span></td>
              <td>{new Date(content.publishedAt || content.updatedAt || content.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td><span className="engagement-cell">{content.views || 0} views · {content.likesCount || 0} likes</span></td>
              <td><div className="table-actions">{content.platformUrl && <a href={content.platformUrl} target="_blank" rel="noreferrer" title={`Open original ${content.platform || 'content'}`} aria-label={`Open original ${content.platform || 'content'}`}><ArrowUpRight size={16} /></a>}{content.status === 'Published' && <Link to={`/content/${content._id}`} title="View in Ethera" aria-label="View in Ethera"><FileText size={15} /></Link>}<Link to={`/dashboard/content/${content._id}`} title="Edit Ethera item" aria-label="Edit Ethera item"><Pencil size={15} /></Link><button onClick={() => removeContent(content)} title="Remove from Ethera" aria-label="Remove from Ethera"><Trash2 size={15} /></button></div></td>
            </tr>
          ))}
        </tbody></table></div>
      ) : (
        <div className="empty-state dashboard-empty">
          <span className="empty-sparkle">✳</span>
          <h3>{selectedSource === 'All' ? 'Your library is ready.' : `No ${selectedSource} posts synced yet.`}</h3>
          <p>{selectedSource === 'All'
            ? 'Connect a social channel to import official posts, or create your first Ethera story.'
            : `Link your ${selectedSource} account and sync to bring official posts into the library.`}</p>
          <div className="empty-state-actions">
            {selectedSource === 'All'
              ? <Link to="/dashboard/content/new" className="button button-dark"><Plus size={16} /> Create your first story</Link>
              : <Link to="/dashboard/social" className="button button-dark">Link social channels <ArrowUpRight size={15} /></Link>}
            <Link to="/dashboard/social" className="empty-link">Manage social channels</Link>
          </div>
        </div>
      )}
    </div>
  );
}
