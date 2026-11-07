import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';

const CreatorProfileContext = createContext({
  profile: { name: 'Creator', imageUrl: '', introduction: '', publicAge: null, facebookPage: null },
});

export function CreatorProfileProvider({ children }) {
  const [profile, setProfile] = useState({ name: 'Creator', imageUrl: '', introduction: '', publicAge: null, facebookPage: null });
  const [error, setError] = useState('');

  const refreshProfile = useCallback(async () => {
    try {
      const result = await apiRequest('/profile');
      if (result.profile) setProfile((current) => ({ ...current, ...result.profile }));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    document.title = profile.name === 'Creator'
      ? 'Creator Community'
      : `${profile.name} | Creator Community`;
  }, [profile.name]);

  return (
    <CreatorProfileContext.Provider value={{ profile, refreshProfile }}>
      {error && <div className="notice notice-error creator-profile-error" role="alert">Creator profile could not be loaded: {error}</div>}
      {children}
    </CreatorProfileContext.Provider>
  );
}

export function useCreatorProfile() {
  return useContext(CreatorProfileContext);
}
