import { useState, useEffect } from 'react';

export const useSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSession = async () => {
      try {
        // Check if reload was confirmed
        const reloadConfirmed = localStorage.getItem('arc_reload_confirmed');
        const storedSessionId = localStorage.getItem('arc_session_id');

        if (reloadConfirmed === 'true' || !storedSessionId) {
          console.log('Reload confirmed or no session_id, creating new session...');
          localStorage.removeItem('arc_reload_confirmed'); // Clear flag
          localStorage.removeItem('arc_session_id'); // Clear old session
          const response = await fetch('/api/session/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create session');
          }
          const data = await response.json();
          if (!data.session_id) {
            throw new Error('Invalid session response: No session_id');
          }
          console.log('New session created:', data.session_id);
          setSessionId(data.session_id);
          localStorage.setItem('arc_session_id', data.session_id);
        } else {
          console.log('Reusing stored session_id:', storedSessionId);
          setSessionId(storedSessionId);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    createSession();
  }, []);

  const updateSession = (newSessionId: string) => {
    console.log('Updating session_id:', newSessionId);
    setSessionId(newSessionId);
    localStorage.setItem('arc_session_id', newSessionId);
  };

  const clearSession = () => {
    console.log('Clearing session_id');
    setSessionId(null);
    localStorage.removeItem('arc_session_id');
    setError(null);
    // Create new session
    const createNewSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error('Failed to create new session');
        }
        const data = await response.json();
        if (!data.session_id) {
          throw new Error('Invalid session response: No session_id');
        }
        console.log('New session created:', data.session_id);
        setSessionId(data.session_id);
        localStorage.setItem('arc_session_id', data.session_id);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    createNewSession();
  };

  return { sessionId, isLoading, error, updateSession, clearSession };
};