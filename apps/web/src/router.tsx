import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { Shell } from './layout/Shell.tsx';
import { Pending } from './routes/Pending.tsx';
import { Today } from './routes/Today.tsx';
import { You } from './routes/You.tsx';

const root = createRootRoute({ component: Outlet });
const shell = createRoute({ getParentRoute: () => root, id: 'shell', component: Shell });
const page = <P extends string>(path: P, component: () => React.ReactNode) =>
  createRoute({ getParentRoute: () => shell, path, component });

const routeTree = root.addChildren([
  shell.addChildren([
    page('/', Today),
    page('/lessons', () => <Pending title="nav.lessons" purpose="pending.lessons" />),
    page('/oba', () => <Pending title="nav.oba" purpose="pending.oba" />),
    page('/ikpe', () => <Pending title="nav.ikpe" purpose="pending.ikpe" />),
    page('/oha', () => <Pending title="nav.oha" purpose="pending.oha" />),
    page('/you', You),
  ]),
]);

export const makeRouter = () => createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof makeRouter>;
  }
}
