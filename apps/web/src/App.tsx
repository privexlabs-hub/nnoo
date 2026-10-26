import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ApiError } from './api/client.ts';
import { isSignedIn, onSessionChange, refresh } from './auth/session.ts';
import { I18nProvider, useT } from './i18n.tsx';
import { makeRouter } from './router.tsx';
import { SignIn } from './routes/SignIn.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 4xx will not get better by retrying; a signed-out state is handled by the session.
      retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2,
    },
  },
});
const router = makeRouter();

type State = 'checking' | 'signedIn' | 'signedOut';

function Gate() {
  const t = useT();
  const [state, setState] = useState<State>(isSignedIn() ? 'signedIn' : 'checking');
  useEffect(() => {
    const off = onSessionChange((on) => {
      if (!on) queryClient.clear();
      setState(on ? 'signedIn' : 'signedOut');
    });
    if (!isSignedIn()) {
      refresh()
        .then((ok) => setState(ok ? 'signedIn' : 'signedOut'))
        .catch(() => setState('signedOut'));
    }
    return off;
  }, []);
  if (state === 'checking') return <p className="boot muted">{t('loading')}</p>;
  if (state === 'signedOut') return <SignIn onSignedIn={() => setState('signedIn')} />;
  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <Gate />
      </QueryClientProvider>
    </I18nProvider>
  );
}
