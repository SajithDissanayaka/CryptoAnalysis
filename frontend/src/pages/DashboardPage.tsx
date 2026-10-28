import { useState } from 'react'
import { Link } from 'react-router'
import { useWorkspace } from '../hooks/useWorkspace'
import { useAuth } from '../hooks/useAuth'
import Icon, { CoinMark } from '../components/Icon'
import MarketChart, { Sparkline } from '../components/MarketChart'
import { compactMoney, money, percent } from '../data/demo'

export default function DashboardPage() {
  const {
    snapshot,
    isDemo,
    base,
    loading,
    error,
    refresh,
    selected,
    select,
    watchlist,
    toggleWatch,
  } = useWorkspace()
  const { user } = useAuth()
  const [range, setRange] = useState<'24H' | '7D'>('7D')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const assets = snapshot?.assets || []
  const asset = assets.find((a) => a.symbol === selected) || assets[0]
  const filtered = assets.filter(
    (a) =>
      (filter === 'all' || watchlist.includes(a.symbol)) &&
      `${a.name} ${a.symbol}`.toLowerCase().includes(query.toLowerCase()),
  )
  const cap =
    assets.length && assets.every((a) => a.market_cap !== null)
      ? assets.reduce((n, a) => n + a.market_cap!, 0)
      : null
  const volume =
    assets.length && assets.every((a) => a.volume !== null)
      ? assets.reduce((n, a) => n + a.volume!, 0)
      : null
  const exportCSV = () => {
    const rows = [
      [
        'symbol',
        'name',
        'price_usd',
        'change_24h_percent',
        'market_cap_usd',
        'volume_24h_usd',
        'source',
        'updated_at',
      ],
      ...filtered.map((a) => [
        a.symbol,
        a.name,
        a.price,
        a.change,
        a.market_cap,
        a.volume,
        snapshot?.source,
        a.updated_at || 'demo',
      ]),
    ]
    const blob = new Blob(
      [
        rows
          .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
          .join('\n'),
      ],
      { type: 'text/csv;charset=utf-8' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cryptomind-${isDemo ? 'demo' : 'market'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="overview-page page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            YOUR DAILY PERSPECTIVE
          </div>
          <h1>
            Find the signal.
            <br />
            <span className="heading-soft">
              See beyond the <em>noise.</em>
            </span>
          </h1>
          <p>
            {user && !isDemo ? `Welcome back, ${user.username}. ` : ''}A clearer view of crypto. A
            little more conviction.
          </p>
        </div>
        <div className="heading-aside">
          <span className="date-label">
            <Icon name="globe" size={15} />
            {isDemo ? 'A glimpse of your workspace' : 'Markets never sleep'}
          </span>
          <Link className="button button-outline" to={`${base}/ai`}>
            <Icon name="sparkles" size={16} />
            Ask CryptoMind
            <Icon name="up" size={16} />
          </Link>
        </div>
      </div>
      {error && (
        <div className="error-message connection-error" role="alert">
          <Icon name="info" />
          <div>
            <strong>Market feed needs attention</strong>
            <p>
              {error}
              {snapshot ? ' The last received values remain visible below.' : ''}
            </p>
          </div>
          <button
            className="button button-outline button-small"
            onClick={refresh}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}
      <section className="metrics-grid" aria-label="Market summary">
        <div className="metric">
          <div className="metric-label">
            Tracked market cap
            <Icon name="globe" size={16} />
          </div>
          <div className="metric-value">
            {compactMoney(cap)}
            <span className="metric-unit">USD</span>
          </div>
          <div className="metric-bottom">
            <span className="metric-tick" />
            {assets.length || 3} assets in focus<span>01</span>
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">
            24h trading volume
            <Icon name="overview" size={16} />
          </div>
          <div className="metric-value">
            {compactMoney(volume)}
            <span className="metric-unit">USD</span>
          </div>
          <div className="metric-bottom">
            <span className="metric-tick" />
            Across tracked assets<span>02</span>
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">
            Your watchlist
            <Icon name="star" size={16} />
          </div>
          <div className="metric-value">
            {String(watchlist.length).padStart(2, '0')}
            <span className="metric-unit">ASSETS</span>
          </div>
          <div className="metric-bottom">
            <span className="status-dot" />
            Keep your perspective close<span>03</span>
          </div>
        </div>
        <Link className="metric metric-action" to={`${base}/research`}>
          <span className="metric-label">
            Your knowledge, connected
            <Icon name="up" size={18} />
          </span>
          <div className="knowledge-symbol" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="metric-bottom">
            Bring your own research
            <Icon name="arrow" size={16} />
          </div>
        </Link>
      </section>
      <div className="analysis-grid">
        <section className="panel chart-panel" aria-labelledby="chart-title">
          <div className="panel-top">
            <div className="panel-title">
              <span className="mini-square" />
              <h2 id="chart-title">Market overview</h2>
            </div>
            <div className="chart-controls">
              <div className="segmented-control" aria-label="Chart period">
                {(['24H', '7D'] as const).map((value) => (
                  <button
                    key={value}
                    className={range === value ? 'selected' : ''}
                    aria-pressed={range === value}
                    onClick={() => setRange(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <button
                className="icon-button"
                onClick={refresh}
                disabled={loading || isDemo}
                title={
                  isDemo
                    ? 'Demo prices are fixed. Sign in for market updates.'
                    : 'Refresh market data'
                }
                aria-label="Refresh market data"
              >
                <Icon name="refresh" size={16} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>
          <div className="chart-summary">
            <div>
              <div className="chart-asset">
                <CoinMark symbol={asset?.symbol || selected} />
                <label className="sr-only" htmlFor="chart-asset">
                  Chart asset
                </label>
                <select
                  id="chart-asset"
                  value={asset?.symbol || selected}
                  onChange={(e) => select(e.target.value)}
                >
                  {(assets.length
                    ? assets
                    : [
                        { symbol: 'BTC', name: 'Bitcoin' },
                        { symbol: 'ETH', name: 'Ethereum' },
                        { symbol: 'SOL', name: 'Solana' },
                      ]
                  ).map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <span>{asset?.symbol || selected} / USD</span>
              </div>
              <div className="chart-price">
                {money(asset?.price)}
                <span className={`change-badge ${(asset?.change ?? 0) < 0 ? 'negative' : ''}`}>
                  <Icon name={(asset?.change ?? 0) < 0 ? 'down' : 'up'} size={12} />
                  {percent(asset?.change ?? null)}
                </span>
              </div>
            </div>
            <div className="chart-annotation">
              <span className="status-dot" />
              {isDemo
                ? 'SAMPLE DATA'
                : loading
                  ? 'UPDATING'
                  : error
                    ? 'LAST RECEIVED'
                    : 'LATEST AVAILABLE'}
              <small>24h price change</small>
            </div>
          </div>
          {asset ? (
            <MarketChart
              values={asset.sparkline}
              range={range}
              name={asset.name}
              demo={isDemo}
              updatedAt={asset.updated_at}
            />
          ) : (
            <div className="chart-empty" aria-live="polite">
              <Icon name={loading ? 'refresh' : 'info'} className={loading ? 'spin' : ''} />
              <p>
                {loading
                  ? 'Gathering your market perspective…'
                  : 'Connect to the market feed to see price history.'}
              </p>
            </div>
          )}
          <div className="chart-footer">
            <span>
              <span className="chart-legend" />
              {isDemo ? 'Illustrative price history' : 'Hourly samples · UTC'}
            </span>
            <span>
              {isDemo
                ? 'Demo dataset · USD'
                : `${snapshot?.source || 'Market provider'} · ${snapshot?.updated_at ? new Date(snapshot.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Waiting for data'}`}
            </span>
          </div>
        </section>
        <aside className="perspective-column">
          <section className="ai-feature">
            <div className="ai-feature-top">
              <span>
                <Icon name="sparkles" size={14} />A DIFFERENT PERSPECTIVE
              </span>
              <span className="ai-chip">AI</span>
            </div>
            <div className="signal-art" aria-hidden="true">
              <div className="signal-ring ring-one" />
              <div className="signal-ring ring-two" />
              <div className="signal-ring ring-three" />
              <div className="signal-core">
                <Icon name="sparkles" size={33} />
              </div>
              <span className="orbit-point point-one" />
              <span className="orbit-point point-two" />
              <span className="art-coordinate">x: insight / y: clarity</span>
            </div>
            <h2>
              Less guessing.
              <br />
              More <em>understanding.</em>
            </h2>
            <p>Turn market data and your research into questions worth asking.</p>
            <Link className="button button-dark" to={`${base}/ai`}>
              Explore AI studio
              <Icon name="up" size={18} />
            </Link>
          </section>
          <div className="market-note">
            <span className="market-note-mark">↗</span>
            <p>
              The market moves fast.
              <br />
              <strong>Your perspective matters more.</strong>
            </p>
            <span className="note-number">/ 01</span>
          </div>
        </aside>
      </div>
      <section className="panel assets-panel" id="markets" aria-labelledby="assets-title">
        <div className="panel-top">
          <div className="panel-title">
            <span className="mini-square" />
            <h2 id="assets-title">On your radar</h2>
            <span className="count-badge">{assets.length}</span>
          </div>
          <button className="text-button" disabled={!filtered.length} onClick={exportCSV}>
            <Icon name="download" size={15} />
            Export data
          </button>
        </div>
        <div className="assets-toolbar">
          <div className="table-tabs">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
            >
              All assets
            </button>
            <button
              className={filter === 'watch' ? 'active' : ''}
              onClick={() => setFilter('watch')}
              aria-pressed={filter === 'watch'}
            >
              <Icon name="star" size={13} />
              Watchlist<span>{watchlist.length}</span>
            </button>
          </div>
          <label className="asset-search">
            <Icon name="search" size={15} />
            <span className="sr-only">Filter assets</span>
            <input
              placeholder="Find an asset…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="assets-table">
            <thead>
              <tr>
                <th className="star-cell">
                  <span className="sr-only">Watchlist</span>
                </th>
                <th>Asset</th>
                <th>Price</th>
                <th>24h change</th>
                <th>Market cap</th>
                <th>Volume (24h)</th>
                <th>Last 7 days</th>
                <th>
                  <span className="sr-only">View chart</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, index) => (
                <tr key={a.symbol} className={a.symbol === selected ? 'row-selected' : ''}>
                  <td className="star-cell">
                    <button
                      className={`watch-button ${watchlist.includes(a.symbol) ? 'watched' : ''}`}
                      onClick={() => toggleWatch(a.symbol)}
                      aria-label={`${watchlist.includes(a.symbol) ? 'Remove' : 'Add'} ${a.name} ${watchlist.includes(a.symbol) ? 'from' : 'to'} watchlist`}
                      aria-pressed={watchlist.includes(a.symbol)}
                    >
                      <Icon name="star" size={15} />
                    </button>
                  </td>
                  <td>
                    <button
                      className="asset-name"
                      onClick={() => {
                        select(a.symbol)
                        document
                          .getElementById('chart-title')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                    >
                      <span className="asset-index">{String(index + 1).padStart(2, '0')}</span>
                      <CoinMark symbol={a.symbol} />
                      <span>
                        {a.name}
                        <small>{a.symbol}</small>
                      </span>
                    </button>
                  </td>
                  <td className="numeric strong">{money(a.price)}</td>
                  <td className={`numeric change ${(a.change ?? 0) < 0 ? 'negative' : ''}`}>
                    {percent(a.change)}
                  </td>
                  <td className="numeric muted">{compactMoney(a.market_cap)}</td>
                  <td className="numeric muted">{compactMoney(a.volume)}</td>
                  <td>
                    <Sparkline values={a.sparkline} />
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Analyze ${a.name}`}
                      onClick={() => {
                        select(a.symbol)
                        window.location.hash = 'markets'
                        document
                          .getElementById('chart-title')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                    >
                      <Icon name="up" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <p className="empty-text">
            {loading
              ? 'Loading market data…'
              : assets.length
                ? 'No matching assets. Try another search or add a star to your watchlist.'
                : 'No market data available. Use Retry above to reconnect.'}
          </p>
        )}
        <div className="table-bottom">
          <span>
            Showing {filtered.length} of {assets.length} assets
          </span>
          <span>
            <span className="status-dot" />
            {isDemo ? 'Demo values · for exploration' : 'Refreshes every 60 seconds'}
          </span>
        </div>
      </section>
    </div>
  )
}
