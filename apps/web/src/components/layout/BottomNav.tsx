import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inbox' },
  { to: '/vault', label: 'Vault' },
];

/**
 * Horizontal navbar fixed to the bottom of the screen for switching between
 * the Inbox and Vault pages (mobile-first — see docs/PROJECT.md → Primary
 * surface). Rendered once by `AppLayout` so it persists across route
 * navigation.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 flex border-t border-gray-200 bg-white"
    >
      {NAV_ITEMS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 py-3 text-center text-sm font-medium ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
