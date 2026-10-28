import { Link } from 'react-router'
import CryptoAIChat from '../components/CryptoAIChat'
import Icon from '../components/Icon'
import { useWorkspace } from '../hooks/useWorkspace'

export default function CryptoAIPage() {
  const { base, isDemo } = useWorkspace()
  return (
    <div className="studio-page page-enter">
      <div className="page-heading compact-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            THINK A LITTLE DEEPER
          </div>
          <h1>
            Meet your <em>second mind.</em>
          </h1>
          <p>A research companion for the questions behind the chart.</p>
        </div>
        <span className="outlined-label">
          <span className="status-dot" />
          {isDemo ? 'DEMO PREVIEW' : 'PRIVATE WORKSPACE'}
        </span>
      </div>
      <div className="studio-grid">
        <CryptoAIChat />
        <aside className="studio-aside">
          <div className="studio-aside-heading">
            <span className="eyebrow">BUILT FOR PERSPECTIVE</span>
            <h2>
              One question.
              <br />
              Connected evidence.
            </h2>
            <p>Your assistant chooses the tools that fit your question.</p>
          </div>
          <div className="capability">
            <span className="capability-number">01</span>
            <div>
              <Icon name="globe" />
              <h3>Market intelligence</h3>
              <p>
                Latest available prices for Bitcoin, Ethereum, and Solana, with source timestamps.
              </p>
            </div>
          </div>
          <div className="capability">
            <span className="capability-number">02</span>
            <div>
              <Icon name="overview" />
              <h3>Technical perspective</h3>
              <p>Daily RSI and MACD, calculated from completed market candles.</p>
            </div>
          </div>
          <div className="capability">
            <span className="capability-number">03</span>
            <div>
              <Icon name="library" />
              <h3>Your research, recalled</h3>
              <p>Answers grounded in your uploaded documents, with supporting excerpts.</p>
              <Link className="inline-link" to={`${base}/research`}>
                Open research library
                <Icon name="up" size={14} />
              </Link>
            </div>
          </div>
          <div className="studio-footnote">
            <Icon name="info" size={17} />
            <p>AI can make mistakes. Check sources and timestamps before acting on an analysis.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
