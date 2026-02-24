import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getTeacherByUser } from '../services/managementService';
import { useAuth } from './AuthContext';

const TeacherContext = createContext(null);

/**
 * Resolves the logged-in teacher's profile once at dash-level
 * and exposes `teacherId` + `teacherProfile` to all child pages.
 */
export const TeacherProvider = ({ children }) => {
  const { user } = useAuth();
  const [teacherId,      setTeacherId]      = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const resolve = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const profile = await getTeacherByUser(user.id);
      setTeacherProfile(profile);
      setTeacherId(profile?.id ?? null);
      if (!profile?.id) {
        console.error('[TeacherContext] getTeacherByUser returned no id:', profile);
      }
    } catch (e) {
      console.error('[TeacherContext] Failed to resolve teacher:', e);
      setError('Could not load teacher profile.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { resolve(); }, [resolve]);

  return (
    <TeacherContext.Provider value={{ teacherId, teacherProfile, loading, error }}>
      {children}
    </TeacherContext.Provider>
  );
};

export const useTeacher = () => useContext(TeacherContext);
