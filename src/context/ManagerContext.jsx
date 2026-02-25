import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getManagerByUser } from '../services/managementService';
import { useAuth } from './AuthContext';

const ManagerContext = createContext(null);

/**
 * Resolves the logged-in manager's profile once at dash-level
 * and exposes `managerId` + `managerProfile` to all child pages.
 */
export const ManagerProvider = ({ children }) => {
  const { user } = useAuth();
  const [managerId,      setManagerId]      = useState(null);
  const [managerProfile, setManagerProfile] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const resolve = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const profile = await getManagerByUser(user.id);
      setManagerProfile(profile);
      setManagerId(profile?.id ?? null);
      if (!profile?.id) {
        console.error('[ManagerContext] getManagerByUser returned no id:', profile);
      }
    } catch (e) {
      console.error('[ManagerContext] Failed to resolve manager:', e);
      setError('Could not load manager profile.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { resolve(); }, [resolve]);

  return (
    <ManagerContext.Provider value={{ managerId, managerProfile, loading, error }}>
      {children}
    </ManagerContext.Provider>
  );
};

export const useManager = () => useContext(ManagerContext);
