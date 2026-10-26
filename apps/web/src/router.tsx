import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

/*
 * Home is in the main bundle so the first visit is fast. Every other page is loaded on demand,
 * which keeps the main bundle small. While a page loads, the previous page stays on screen.
 * The admin page is a demo: it has no sign-in and is not protected.
 */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'explore',
        lazy: () => import('./pages/ExplorePage').then((m) => ({ Component: m.ExplorePage })),
      },
      {
        path: 'saved',
        lazy: () => import('./pages/SavedPage').then((m) => ({ Component: m.SavedPage })),
      },
      {
        path: 'places/:id',
        lazy: () =>
          import('./pages/PlaceDetailsPage').then((m) => ({ Component: m.PlaceDetailsPage })),
      },
      {
        path: 'add',
        lazy: () => import('./pages/AddSpotPage').then((m) => ({ Component: m.AddSpotPage })),
      },
      {
        path: 'profile',
        lazy: () => import('./pages/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
      },
      {
        path: 'admin',
        lazy: () => import('./pages/AdminPage').then((m) => ({ Component: m.AdminPage })),
      },
      {
        path: 'design-system',
        lazy: () =>
          import('./pages/DesignSystemPage').then((m) => ({ Component: m.DesignSystemPage })),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
