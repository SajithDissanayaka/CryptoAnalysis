import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { WorkspaceProvider } from '../context/WorkspaceContext'
import { useWorkspace } from '../hooks/useWorkspace'
import { useAuth } from '../hooks/useAuth'
import Icon, { Brand, CoinMark, type IconName } from './Icon'

function SearchDialog({ close }: { close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const { base, snapshot, select } = useWorkspace()
  const navigate = useNavigate()
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  const destinations = [
    { title: 'Market overview', path: base, icon: 'overview' as IconName },
    { title: 'AI studio', path: `${base}/ai`, icon: 'sparkles' as IconName },
    { title: 'Research library', path: `${base}/research`, icon: 'library' as IconName },
  ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
  const assets = (snapshot?.assets || []).filter((item) =>
    `${item.name} ${item.symbol}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <dialog
      className="search-dialog"
      ref={ref}
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      aria-labelledby="search-title"
    >
      <div className="search-dialog-inner">
        <div className="search-dialog-input">
          <Icon name="search" />
          <label className="sr-only" id="search-title" htmlFor="workspace-search">
            Search your workspace
          </label>
          <input
            id="workspace-search"
            autoFocus
            placeholder="Search assets or jump to a page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="icon-button" onClick={close} aria-label="Close search">
            <Icon name="close" />
          </button>
        </div>
        <div className="search-results">
          <span className="eyebrow">QUICK NAVIGATION</span>
          {destinations.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                close()
              }}
            >
              <Icon name={item.icon} />
              <span>{item.title}</span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
          {assets.length > 0 && <span className="eyebrow">ASSETS</span>}
          {assets.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => {
                select(asset.symbol)
                navigate(base)
                close()
              }}
            >
              <CoinMark symbol={asset.symbol} />
              <span>
                {asset.name} <small>{asset.symbol}</small>
              </span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
          {!destinations.length && !assets.length && (
            <p className="empty-text">No results. Try Bitcoin, AI studio, or research.</p>
          )}
        </div>
        <div className="search-hint">
          Navigate to a page or explore an asset <kbd>esc</kbd> to close
        </div>
      </div>
    </dialog>
  )
}

function Layout() {
  const { base, isDemo, snapshot, error } = useWorkspace()
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState(false)
  const [mobile, setMobile] = useState(false)
  const searchTrigger = useRef<HTMLButtonElement>(null)
  const closeSearch = () => {
    setSearch(false)
    window.requestAnimationFrame(() => searchTrigger.current?.focus({ preventScroll: true }))
  }
  const section = pathname.endsWith('/ai')
    ? 'AI studio'
    : pathname.endsWith('/research')
      ? 'Research library'
      : 'Overview'
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearch((value) => !value)
      }
      if (event.key === 'Escape') setMobile(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])
  useEffect(() => {
    document.title = `${section} · CryptoMind AI`
  }, [section])
  const nav = [
    { path: base, label: 'Overview', icon: 'overview' as IconName, end: true },
    { path: `${base}/ai`, label: 'AI studio', icon: 'sparkles' as IconName, end: false },
    {
      path: `${base}/research`,
      label: 'Research library',
      icon: 'library' as IconName,
      end: false,
    },
  ]
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
        <Link to={base} className="brand-link" aria-label="CryptoMind home">
          <Brand />
        </Link>
        <div className="workspace-label">
          <span className="workspace-avatar">C</span>
          <div>
            Personal workspace
            <small>{isDemo ? 'Explore the possibilities' : 'Your research, connected'}</small>
          </div>
          <span className="tiny-label">01</span>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobile(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.icon === 'sparkles' && <span className="nav-new">AI</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-icon">
            <Icon name="sparkles" size={23} />
          </span>
          <h3>A little more perspective.</h3>
          <p>Connect market movements with the research behind them.</p>
          <Link to={`${base}/ai`} onClick={() => setMobile(false)}>
            Start a conversation <Icon name="up" size={16} />
          </Link>
          <div className="note-orbit" aria-hidden="true" />
        </div>
        <div className="sidebar-bottom">
          <div className="connection-status">
            <span className={`status-dot ${isDemo ? 'demo-dot' : error ? 'warning-dot' : ''}`} />
            <div>
              {isDemo
                ? 'Demo workspace'
                : error
                  ? 'Connection needs attention'
                  : snapshot
                    ? 'Market feed connected'
                    : 'Connecting to market'}
              <small>
                {isDemo
                  ? 'Illustrative data · no live prices'
                  : snapshot?.source || 'Waiting for provider'}
              </small>
            </div>
          </div>
          {isDemo ? (
            <Link className="profile-row" to={user ? '/dashboard' : '/login'}>
              <span className="user-avatar">
                <Icon name="globe" size={18} />
              </span>
              <div>
                {user ? 'Open my workspace' : 'Make it your workspace'}
                <small>{user ? user.username : 'Sign in or create an account'}</small>
              </div>
              <Icon name="arrow" size={16} />
            </Link>
          ) : (
            <div className="profile-row">
              <span className="user-avatar">{user?.username.slice(0, 1).toUpperCase()}</span>
              <div>
                {user?.username}
                <small>Personal account</small>
              </div>
              <button
                className="icon-button"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                aria-label="Sign out"
              >
                <Icon name="logout" size={17} />
              </button>
            </div>
          )}
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={mobile}
              onClick={() => setMobile((value) => !value)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{section}</strong>
          </div>
          <div className="topbar-actions">
            <button ref={searchTrigger} className="search-trigger" onClick={() => setSearch(true)}>
              <Icon name="search" size={16} />
              <span>Quick search</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="topbar-divider" />
            {isDemo ? (
              <Link className="topbar-signin" to={user ? '/dashboard' : '/login'}>
                {user ? 'My workspace' : 'Sign in'}
                <Icon name="up" size={15} />
              </Link>
            ) : (
              <span className="topbar-user">{user?.username.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
        </header>
        {isDemo && (
          <div className="demo-banner">
            <span>
              <Icon name="info" size={14} />
              You're exploring a demo. Prices and charts are illustrative.
            </span>
            <Link to={user ? '/dashboard' : '/login'}>
              Connect your workspace <Icon name="arrow" size={14} />
            </Link>
          </div>
        )}
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>Made for curious minds.</span>
          <span>Research with perspective. Always verify sources.</span>
          <span className="footer-brand">CRYPTOMIND / AI</span>
        </footer>
      </div>
      {search && <SearchDialog close={closeSearch} />}
    </div>
  )
}
export default function WorkspaceLayout() {
  const demo = useLocation().pathname.startsWith('/explore')
  return (
    <WorkspaceProvider key={demo ? 'demo' : 'live'}>
      <Layout />
    </WorkspaceProvider>
  )
}
