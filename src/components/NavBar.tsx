import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: '오늘', icon: '✏️', end: true },
  { to: '/list', label: '목록', icon: '📖', end: false },
  { to: '/book', label: '책만들기', icon: '📕', end: false },
];

export function NavBar() {
  return (
    <nav className="nav-bar">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => 'nav-tab' + (isActive ? ' nav-tab-active' : '')}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
