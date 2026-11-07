import { ArrowUpRight, ChevronDown, LogOut, Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { isCreatorUser } from '../services/api.js';
import CreatorAvatar from './CreatorAvatar.jsx';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';
import NotificationCenter from './NotificationCenter.jsx';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('ethera-user') || 'null');
  const creator = isCreatorUser(user);
  const { profile } = useCreatorProfile();
  const accountName = creator ? profile.name : (user?.name || 'Viewer');
  const accountProfile = creator ? profile : user || { name: accountName };
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search).get('q') || '';
  function signOut() {
    localStorage.removeItem('ethera-token');
    localStorage.removeItem('ethera-user');
    window.location.assign('/');
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/explore" aria-label={`${profile.name} feed`}>
          <CreatorAvatar profile={profile} className="brand-mark" />
          <span>{profile.name}</span>
        </Link>
        <form className="header-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <Search size={18} />
          <input
            type="search"
            aria-label="Search creator content"
            placeholder="Search videos and posts"
            value={search}
            onChange={(event) => {
              const query = event.target.value;
              navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore', { replace: true });
            }}
          />
          {search && <button type="button" aria-label="Clear search" onClick={() => navigate('/explore', { replace: true })}><X size={16} /></button>}
        </form>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={open ? 'main-nav is-open' : 'main-nav'}>
          <NavLink to="/explore" onClick={() => setOpen(false)}>Feed</NavLink>
          {user && !creator && <NotificationCenter audience="viewer" />}
          {user ? (
            <div className="account-menu">
              <button type="button" className="account-menu-trigger" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}>
                <CreatorAvatar key={accountProfile.imageUrl || accountName} profile={accountProfile} className="account-menu-avatar" />
                <span>{accountName}</span><ChevronDown size={15} />
              </button>
              {accountOpen && <div className="account-menu-panel">
                <Link to={creator ? '/dashboard' : '/explore'} onClick={() => { setAccountOpen(false); setOpen(false); }}>
                  {creator ? 'Creator studio' : 'Your feed'} <ArrowUpRight size={15} />
                </Link>
                <button type="button" onClick={signOut}><LogOut size={15} /> Sign out</button>
              </div>}
            </div>
          ) : <Link className="nav-creator-link" to="/login" onClick={() => setOpen(false)}>Log in <ArrowUpRight size={15} /></Link>}
        </nav>
      </div>
    </header>
  );
}
