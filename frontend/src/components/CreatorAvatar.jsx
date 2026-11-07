import { useState } from 'react';

export default function CreatorAvatar({ profile, className }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = profile?.name?.trim().charAt(0).toUpperCase() || 'e.';

  return (
    <span className={className} aria-label={`${profile?.name || 'Creator'} profile`}>
      {profile?.imageUrl && !imageFailed
        ? <img src={profile.imageUrl} alt="" onError={() => setImageFailed(true)} />
        : initial}
    </span>
  );
}
