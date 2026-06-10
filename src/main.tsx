import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import OverviewPage from './pages/overview';
import HistoryPage from './pages/history';
import CoachPage from './pages/coach';
import CalendarPage from './pages/calendar';
import ProfilePage from './pages/profile';
import DesignPreviewPage from './pages/design-preview';
import NotFound from './pages/404';
import '@/styles/index.css';

const routes = createBrowserRouter(
  [
    {
      path: '/',
      element: <Navigate to="/coach" replace />,
    },
    {
      path: '/overview',
      element: <OverviewPage />,
    },
    {
      path: '/history',
      element: <HistoryPage />,
    },
    {
      path: '/coach',
      element: <CoachPage />,
    },
    {
      path: '/calendar',
      element: <CalendarPage />,
    },
    {
      path: '/profile',
      element: <ProfilePage />,
    },
    {
      path: '/design-preview',
      element: <DesignPreviewPage />,
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={routes} />
    </HelmetProvider>
  </React.StrictMode>
);
