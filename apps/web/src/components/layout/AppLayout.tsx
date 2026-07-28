import { Outlet } from 'react-router-dom';

import { BottomNav } from './BottomNav';

/**
 * Root app shell shared by every page: renders the active route via
 * `<Outlet />` and a persistent `BottomNav` fixed to the bottom of the
 * screen. Bottom padding on the content wrapper keeps the fixed nav from
 * overlapping the last item of a scrollable page (see AGENTS.md → #1 Rule —
 * this component is composition-only, no logic).
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 pb-16">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
