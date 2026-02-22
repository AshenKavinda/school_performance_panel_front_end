import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getOperatorByUser } from '../services/managementService';
import { useAuth } from './AuthContext';

const OperatorContext = createContext(null);

/**
 * Resolves the logged-in operator's profile once at dash-level
 * and exposes `operatorId` + `operatorProfile` to all child pages.
 */
export const OperatorProvider = ({ children }) => {
  const { user } = useAuth();
  const [operatorId,      setOperatorId]      = useState(null);
  const [operatorProfile, setOperatorProfile] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  const resolve = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const profile = await getOperatorByUser(user.id);
      setOperatorProfile(profile);
      setOperatorId(profile?.id ?? null);
      if (!profile?.id) {
        console.error('[OperatorContext] getOperatorByUser returned no id:', profile);
      }
    } catch (e) {
      console.error('[OperatorContext] Failed to resolve operator:', e);
      setError('Could not load operator profile.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { resolve(); }, [resolve]);

  return (
    <OperatorContext.Provider value={{ operatorId, operatorProfile, loading, error }}>
      {children}
    </OperatorContext.Provider>
  );
};

export const useOperator = () => useContext(OperatorContext);
