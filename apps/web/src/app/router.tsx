import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './HomePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
]);

/**
 * Root router. Add feature routes here (lazily loaded) as pages are built —
 * see AGENTS.md → Routing Strategy.
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
