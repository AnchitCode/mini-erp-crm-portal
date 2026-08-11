import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../api/auth';

/** SVG icon components for the sidebar */
const Icons = {
  dashboard: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  customers: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  products: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  challans: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  logout: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

/** Navigation items with role-based visibility */
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: User['role'][];
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: Icons.dashboard,
    roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'],
    section: 'Overview',
  },
  {
    to: '/customers',
    label: 'Customers',
    icon: Icons.customers,
    roles: ['Admin', 'Sales'],
    section: 'CRM',
  },
  {
    to: '/products',
    label: 'Products & Stock',
    icon: Icons.products,
    roles: ['Admin', 'Warehouse'],
    section: 'Inventory',
  },
  {
    to: '/challans',
    label: 'Sales Challans',
    icon: Icons.challans,
    roles: ['Admin', 'Sales', 'Accounts'],
    section: 'Sales',
  },
];

/** Page titles based on current route */
function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/customers')) return 'Customers';
  if (pathname.startsWith('/products')) return 'Products & Inventory';
  if (pathname.startsWith('/challans')) return 'Sales Challans';
  return 'Dashboard';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Filter nav items to only show ones the user's role can access
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  // Group by section
  const sections: { title: string; items: NavItem[] }[] = [];
  visibleItems.forEach((item) => {
    const sectionTitle = item.section || 'General';
    const existing = sections.find((s) => s.title === sectionTitle);
    if (existing) {
      existing.items.push(item);
    } else {
      sections.push({ title: sectionTitle, items: [item] });
    }
  });

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Mini ERP</h1>
          <span>Operations Portal</span>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' active' : ''}`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          </div>
          <button className="sidebar-link" onClick={logout} style={{ marginTop: '8px' }}>
            {Icons.logout}
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <h2>{getPageTitle(location.pathname)}</h2>
          <div className="badge badge-primary">{user.role}</div>
        </header>
        <main className="main-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
