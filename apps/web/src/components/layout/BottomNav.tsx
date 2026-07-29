import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inbox' },
  { to: '/library', label: 'Library' },
];

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
