import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';

/** Shown when a route's loader, action, or render throws. */
function RouteErrorBoundary() {
  useRouteError();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <p role="alert" className="text-center text-sm text-red-600">
        Something went wrong. Please refresh the page.
      </p>
    </main>
  );
}

const router = createBrowserRouter([
  {
    lazy: async () => {
      const { AppLayout } = await import('../components/layout/AppLayout');
      return { Component: AppLayout };
    },
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { InboxPage } = await import('./InboxPage');
          return { Component: InboxPage };
        },
      },
      {
        path: 'library',
        lazy: async () => {
          const { LibraryPage } = await import('./LibraryPage');
          return { Component: LibraryPage };
        },
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
