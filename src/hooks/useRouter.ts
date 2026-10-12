import { useState, useEffect, useCallback } from 'react';

export function useRouter() {
  const [route, setRoute] = useState(getCurrentRoute());

  function getCurrentRoute(): string {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || '/';
  }

  useEffect(() => {
    const handler = () => setRoute(getCurrentRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
    window.scrollTo(0, 0);
  }, []);

  return { route, navigate };
}
