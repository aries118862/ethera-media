import { Copy, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '../services/api.js';

function SocialIcon({ platform }) {
  if (platform === 'whatsapp') {
    return <svg className="share-brand-icon" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#25D366" />
      <path fill="#fff" d="M23.1 18.9c-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2-.2.4-.9 1.1-1.1 1.3-.2.2-.4.3-.8.1-.4-.2-1.5-.6-2.9-1.8-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.4-.6.1-.2 0-.5 0-.7s-.8-1.9-1.1-2.6c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.7.1-1 .5-.3.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.8c.2.2 2.6 4 6.3 5.6.9.4 1.6.6 2.1.7.9.3 1.8.2 2.4.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.2-.3-.3-.7-.5Z" />
      <path fill="#fff" d="M16 3.5A12.4 12.4 0 0 0 5.3 22.2L3.7 28l6-1.6A12.5 12.5 0 1 0 16 3.5Zm0 22.6c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.5.9.9-3.4-.2-.4A10.2 10.2 0 1 1 16 26.1Z" />
    </svg>;
  }
  if (platform === 'facebook') {
    return <svg className="share-brand-icon" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#1877F2" />
      <path fill="#fff" d="M18.1 27V17.4h3.2l.5-3.8h-3.7v-2.4c0-1.1.3-1.8 1.8-1.8H22V6c-.4-.1-1.6-.2-3-.2-3 0-5.1 1.8-5.1 5.3v2.5h-3.4v3.8h3.4V27h4.2Z" />
    </svg>;
  }
  return <svg className="share-brand-icon" viewBox="0 0 32 32" aria-hidden="true">
    <defs><linearGradient id="instagram-share-gradient" x1="0" x2="1" y1="1" y2="0"><stop stopColor="#FFDC80" /><stop offset=".45" stopColor="#F56040" /><stop offset="1" stopColor="#833AB4" /></linearGradient></defs>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#instagram-share-gradient)" />
    <rect x="7" y="7" width="18" height="18" rx="5" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="16" cy="16" r="4" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="22" cy="10" r="1.3" fill="#fff" />
  </svg>;
}

export default function ShareMenu({ content, className = 'social-action' }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState({ left: 8, top: 8, below: false });
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const url = `${window.location.origin}/content/${content._id}`;
  const shareText = `${content.title}\n${url}`;

  useEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(188, window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
      const below = rect.top < 190;
      setPosition({ left, top: below ? rect.bottom + 8 : rect.top - 8, below });
    };
    const closeOnOutsideClick = (event) => {
      if (!triggerRef.current?.contains(event.target) && !popupRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function openExternal(urlToOpen) {
    const anchor = document.createElement('a');
    anchor.href = urlToOpen;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function share(method) {
    setBusy(true);
    setMessage('');
    let actionCompleted = false;
    let linkCopied = false;
    try {
      if (method === 'copy') {
        await navigator.clipboard.writeText(url);
        actionCompleted = true;
        linkCopied = true;
      } else if (method === 'instagram') {
        openExternal('https://www.instagram.com/');
        actionCompleted = true;
        await navigator.clipboard.writeText(url);
        linkCopied = true;
      } else {
        const target = method === 'whatsapp'
          ? `https://wa.me/?text=${encodeURIComponent(shareText)}`
          : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        openExternal(target);
        actionCompleted = true;
      }

      await apiRequest(`/contents/${content._id}/share`, {
        method: 'POST',
        body: JSON.stringify({ method }),
      });
      setMessage(method === 'copy'
        ? 'Link copied.'
        : method === 'instagram'
          ? 'Link copied. Paste it into Instagram.'
          : `${method === 'whatsapp' ? 'WhatsApp' : 'Facebook'} share opened.`);
      setOpen(false);
    } catch (error) {
      setMessage(actionCompleted
        ? method === 'instagram' && !linkCopied
          ? `Instagram opened, but the link could not be copied: ${error.message}`
          : method === 'copy'
            ? `Link copied, but its notification could not be saved: ${error.message}`
            : `Share started, but its notification could not be saved: ${error.message}`
        : `Could not complete the share: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="share-menu">
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
      >
        <Share2 size={18} /><span>Share</span>
      </button>
      {open && createPortal(
        <div
          ref={popupRef}
          className={`share-menu-popover${position.below ? ' is-below' : ''}`}
          role="group"
          aria-label="Share options"
          style={{ left: position.left, top: position.top }}
        >
          <button type="button" onClick={() => share('whatsapp')} disabled={busy}><SocialIcon platform="whatsapp" /> WhatsApp</button>
          <button type="button" onClick={() => share('facebook')} disabled={busy}><SocialIcon platform="facebook" /> Facebook</button>
          <button type="button" onClick={() => share('instagram')} disabled={busy}><SocialIcon platform="instagram" /> Instagram</button>
          <button type="button" onClick={() => share('copy')} disabled={busy}><Copy size={17} /> Copy link</button>
        </div>,
        document.body,
      )}
      {message && <span className="share-menu-message" role="status">{message}</span>}
    </div>
  );
}
