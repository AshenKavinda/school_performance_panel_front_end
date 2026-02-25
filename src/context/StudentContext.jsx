import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getStudentGlobalByUser, getStudentByGlobal } from '../services/managementService';
import { getStudentEnrollment } from '../services/enrollmentService';
import { useAuth } from './AuthContext';

const StudentContext = createContext(null);

/**
 * Resolves the logged-in student's global + school-scoped profile once
 * at dashboard-level and exposes everything needed by child pages.
 *
 * Resolution chain: User → StudentGlobal → Student (school-scoped)
 */
export const StudentProvider = ({ children }) => {
  const { user } = useAuth();

  const [studentGlobal,  setStudentGlobal]  = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);   // school-scoped
  const [enrollment,     setEnrollment]     = useState(null);   // full enrollment details
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const resolve = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      // Step 1: Get global student record from userId
      const global = await getStudentGlobalByUser(user.id);
      setStudentGlobal(global);

      if (!global?.id) {
        console.error('[StudentContext] getStudentGlobalByUser returned no id:', global);
        setLoading(false);
        return;
      }

      // Step 2: Get school-scoped student record from globalId
      let schoolStudent = null;
      try {
        schoolStudent = await getStudentByGlobal(global.id);
        setStudentProfile(schoolStudent);
      } catch {
        // Student may not be linked to any school yet
        console.warn('[StudentContext] No school-scoped student found for global:', global.id);
      }

      // Step 3: Get enrollment details if school student exists
      if (schoolStudent?.id) {
        try {
          const enrollData = await getStudentEnrollment(schoolStudent.id);
          setEnrollment(enrollData);
        } catch {
          console.warn('[StudentContext] Could not load enrollment');
        }
      }
    } catch (e) {
      console.error('[StudentContext] Failed to resolve student:', e);
      setError('Could not load student profile.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { resolve(); }, [resolve]);

  // Refresh enrollment data (e.g., after navigating)
  const refreshEnrollment = useCallback(async () => {
    if (!studentProfile?.id) return;
    try {
      const enrollData = await getStudentEnrollment(studentProfile.id);
      setEnrollment(enrollData);
    } catch {
      console.warn('[StudentContext] Could not refresh enrollment');
    }
  }, [studentProfile?.id]);

  return (
    <StudentContext.Provider value={{
      studentGlobal,
      studentProfile,
      studentId: studentProfile?.id ?? null,
      studentGlobalId: studentGlobal?.id ?? null,
      enrollment,
      loading,
      error,
      refreshEnrollment,
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);
