import { ArrowUpRight, Facebook, RefreshCw, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';

const providers = [
  {
    id: 'google',
    name: 'YouTube',
    description: 'Bring your official channel videos into the studio library.',
    Icon: Youtube,
  },
  {
    id: 'facebook',
    name: 'Facebook Page',
    description: 'Link a Page you manage to import and organize its posts.',
    Icon: Facebook,
  },
];

export default function SocialConnections() {
  const [accounts, setAccounts] = useState([]);
  const [sameEmailLinked, setSameEmailLinked] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [publicAge, setPublicAge] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, refreshProfile } = useCreatorProfile();

  async function loadAccounts() {
    const result = await apiRequest('/social/accounts');
    setAccounts(result.accounts || []);
    setSameEmailLinked(result.sameEmailLinked);
  }

  useEffect(() => {
    const connected = searchParams.get('connected');
    const callbackError = searchParams.get('error');
    if (connected) {
      setNotice(searchParams.get('sync') === 'failed'
        ? `${connected === 'google' ? 'YouTube' : 'Facebook'} connected. The first sync did not finish; try syncing again.`
        : `${connected === 'google' ? 'YouTube' : 'Facebook'} connected and synced.`);
    }
    if (callbackError) setError(callbackError);
    if (connected || callbackError) setSearchParams({}, { replace: true });

    loadAccounts()
      .then(() => refreshProfile())
      .catch((requestError) => setError(requestError.message))
      .finally(() => setBusy(''));
  }, []);

  useEffect(() => {
    setPublicAge(profile.publicAge ? String(profile.publicAge) : '');
  }, [profile.publicAge]);

  async function connect(provider) {
    setError('');
    setNotice('');
    setBusy(provider);
    try {
      const { authorizationUrl } = await apiRequest(`/social/connect/${provider}`, { method: 'POST', body: '{}' });
      window.location.assign(authorizationUrl);
    } catch (requestError) {
      setError(requestError.message);
      setBusy('');
    }
  }

  async function sync(provider) {
    setBusy(provider);
    setError('');
    setNotice('');
    try {
      const result = await apiRequest(`/social/sync/${provider}`, { method: 'POST', body: '{}' });
      setNotice(result.message);
      await refreshProfile();
      await loadAccounts();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy('');
    }
  }

  async function savePublicProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({ publicAge: publicAge ? Number(publicAge) : null }),
      });
      await refreshProfile();
      setNotice('Public creator profile updated.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="social-connections-page">
      <div className="dashboard-title-row">
        <div>
          <span className="eyebrow">CHANNEL MANAGEMENT</span>
          <h1>Social channels</h1>
          <p>Bring your official YouTube videos and Facebook Page posts into one library.</p>
        </div>
        <Link to="/dashboard/content" className="button button-outline">
          Manage imported content <ArrowUpRight size={15} />
        </Link>
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      {notice && <div className="notice notice-success">{notice}</div>}
      <section className="public-profile-editor">
        <div>
          <span className="eyebrow">PUBLIC CREATOR PROFILE</span>
          <h2>Profile details</h2>
          <p>Facebook Page details are shown to visitors. Add an age only if you want it displayed publicly.</p>
        </div>
        <form onSubmit={savePublicProfile}>
          <label htmlFor="public-creator-age">Age (optional)</label>
          <input id="public-creator-age" type="number" min="13" max="120" step="1" value={publicAge} onChange={(event) => setPublicAge(event.target.value)} placeholder="Leave blank to hide" />
          <button type="submit" className="button button-dark" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save public profile'}</button>
        </form>
      </section>
      {sameEmailLinked && (
        <div className="linked-email-note">
          Your YouTube and Facebook accounts share the same email. Imported posts from both channels are shown together in your studio library.
        </div>
      )}
      <div className="social-provider-grid">
        {providers.map(({ id, name, description, Icon }) => {
          const account = accounts.find((item) => item.provider === id);
          const providerName = id === 'google' ? 'YouTube' : 'Facebook';
          const pageUrl = id === 'facebook' && account?.pageId
            ? `https://www.facebook.com/${account.pageId}`
            : '';
          return (
            <article className={`social-provider-card ${account ? 'is-connected' : ''}`} key={id}>
              <div className="social-card-heading">
                <span className={`social-provider-icon ${id}`}><Icon size={22} /></span>
                <span className={`channel-status ${account ? 'is-connected' : ''}`}>
                  <span />{account ? 'CONNECTED' : 'NOT LINKED'}
                </span>
              </div>
              <h2>{name}</h2>
              <p>{description}</p>
              {account ? (
                <>
                  <div className="connected-account">
                    <span className="connected-dot" />
                    <span>
                      <strong>{account.pageName || account.accountName}</strong>
                      <small>{account.email || 'Connected account'}{account.lastSyncedAt ? ` · Synced ${new Date(account.lastSyncedAt).toLocaleDateString()}` : ' · Not synced yet'}</small>
                    </span>
                  </div>
                  <div className="channel-actions">
                    <button className="button button-dark connection-action" type="button" disabled={Boolean(busy)} onClick={() => sync(id)}>
                      <RefreshCw size={15} className={busy === id ? 'spin-icon' : ''} />
                      {busy === id ? 'Syncing...' : `Sync ${providerName} posts`}
                    </button>
                    {pageUrl && <a className="channel-link" href={pageUrl} target="_blank" rel="noreferrer">Open Facebook Page <ArrowUpRight size={14} /></a>}
                    <Link className="channel-link" to={`/dashboard/content?platform=${providerName}`}>Manage imported posts <ArrowUpRight size={14} /></Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="channel-unlinked-note">
                    {id === 'google'
                      ? 'Connect the Google account that owns your YouTube channel.'
                      : 'Connect Facebook to choose a Page you manage; Facebook is not used to sign in.'}
                  </div>
                  <button className="button button-dark connection-action" type="button" disabled={Boolean(busy)} onClick={() => connect(id)}>
                    <Icon size={16} /> {busy === id ? 'Opening authorization...' : `Link ${providerName}`}
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
      <div className="social-privacy-note">
        <strong>Imported content stays under your control.</strong> Channel tokens are encrypted. Ethera imports your YouTube uploads and authorized Facebook Page posts into this library. Edit and organize the Ethera copies here; changes are not published back to the original social platforms.
      </div>
    </div>
  );
}
