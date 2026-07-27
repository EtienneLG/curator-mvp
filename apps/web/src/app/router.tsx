import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';

/**
 * Route-level error boundary (see AGENTS.md → Error Handling: "Error
 * Boundaries at route and feature level"). Shown when a route's loader,
 * action, or render throws.
 */
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
    path: '/',
    lazy: async () => {
      const { InboxPage } = await import('./InboxPage');
      return { Component: InboxPage };
    },
    errorElement: <RouteErrorBoundary />,
  },
]);

/**
 * Root router. Add feature routes here (lazily loaded) as pages are built —
 * see AGENTS.md → Routing Strategy.
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
