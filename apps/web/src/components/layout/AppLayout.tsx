import { Outlet } from 'react-router-dom';

import { BottomNav } from './BottomNav';

/** Bottom padding on the content wrapper keeps the fixed nav from overlapping the last item. */
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
