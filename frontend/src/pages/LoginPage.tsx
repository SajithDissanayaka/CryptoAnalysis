import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { getCurrentUser, login, register } from '../api/auth'
import { saveAccessToken, removeAccessToken } from '../utils/token'
import { useAuth } from '../hooks/useAuth'
import Icon, { Brand } from '../components/Icon'

export default function LoginPage() {
  const { user, loading: restoring, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  if (user) return <Navigate to="/dashboard" replace />
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'register') {
        await register({ email: email.trim(), username: username.trim(), password })
        setMode('login')
        setNotice('Your account is ready. Signing you in…')
      }
      const result = await login({ email: email.trim(), password })
      saveAccessToken(result.access_token)
      try {
        setUser(await getCurrentUser())
      } catch (err) {
        removeAccessToken()
        throw err
      }
      const from: unknown = location.state?.from
      navigate(typeof from === 'string' && from.startsWith('/dashboard') ? from : '/dashboard', {
        replace: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please retry.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link to="/explore" className="brand-link">
          <Brand />
        </Link>
        <div className="auth-story-content">
          <span className="eyebrow">
            <span className="eyebrow-line" />
            FOR THE CURIOUS. FOR THE CONSIDERED.
          </span>
          <h1>
            A clearer view
            <br />
            of a restless
            <br />
            <em>market.</em>
          </h1>
          <p>
            Your market intelligence, research, and a second mind.
            <br />
            Finally, a little more perspective.
          </p>
          <div className="auth-orbit" aria-hidden="true">
            <div className="auth-orbit-ring orbit-a" />
            <div className="auth-orbit-ring orbit-b" />
            <div className="auth-orbit-ring orbit-c" />
            <span className="auth-orbit-center">
              <Icon name="sparkles" size={46} />
            </span>
            <span className="orbit-label label-btc">
              ₿ <small>BITCOIN</small>
            </span>
            <span className="orbit-label label-eth">
              Ξ <small>ETHEREUM</small>
            </span>
            <span className="orbit-label label-sol">
              ≋ <small>SOLANA</small>
            </span>
            <span className="auth-cross cross-one">+</span>
            <span className="auth-cross cross-two">+</span>
          </div>
        </div>
        <div className="auth-story-footer">
          <span>INTELLIGENCE MEETS INTUITION.</span>
          <span>CRYPTOMIND / 01</span>
        </div>
      </section>
      <section className="auth-form-side">
        <Link className="auth-explore" to="/explore">
          Just looking around? Explore the demo
          <Icon name="up" size={16} />
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {mode === 'login' ? 'YOUR NEXT PERSPECTIVE STARTS HERE' : 'A SPACE FOR YOUR CURIOSITY'}
          </span>
          <h2>{mode === 'login' ? 'Welcome back.' : 'Make room for insight.'}</h2>
          <p>
            {mode === 'login'
              ? 'Pick up where your curiosity left off.'
              : 'Create your personal research workspace.'}
          </p>
          <div className="auth-tabs">
            <button
              className={mode === 'login' ? 'active' : ''}
              disabled={loading}
              onClick={() => {
                setMode('login')
                setError('')
                setNotice('')
              }}
            >
              Sign in
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              disabled={loading}
              onClick={() => {
                setMode('register')
                setError('')
                setNotice('')
              }}
            >
              Create account
            </button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <div className="form-field">
                <label htmlFor="username">Your username</label>
                <input
                  id="username"
                  autoComplete="username"
                  placeholder="curiousmind"
                  minLength={2}
                  maxLength={100}
                  pattern="[\w.\-]+"
                  title="Use letters, numbers, underscores, periods, or hyphens."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">
                Password{mode === 'register' && <span>At least 8 characters</span>}
              </label>
              <div className="password-field">
                <input
                  id="password"
                  type={visible ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder={
                    mode === 'register' ? 'Create a strong password' : 'Enter your password'
                  }
                  minLength={mode === 'register' ? 8 : 1}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  aria-label={visible ? 'Hide password' : 'Show password'}
                >
                  <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>
            {notice && (
              <div className="success-message" role="status">
                {notice}
              </div>
            )}
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            <button
              className="button button-mint auth-submit"
              type="submit"
              disabled={loading || restoring}
            >
              {loading || restoring ? (
                <>
                  <Icon name="refresh" className="spin" size={17} />
                  {restoring ? 'Restoring session…' : 'Opening your workspace…'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Step into your workspace' : 'Create my workspace'}
                  <Icon name="arrow" size={18} />
                </>
              )}
            </button>
          </form>
          <div className="auth-footnote">
            <Icon name="library" size={15} />
            <p>
              Your research stays in your account.
              <br />
              Your perspective is yours to build.
            </p>
          </div>
        </div>
        <footer className="auth-legal">
          <span>Thoughtful research starts with you.</span>
          <Link to="/explore">
            Back to overview
            <Icon name="arrow" size={14} />
          </Link>
        </footer>
      </section>
    </main>
  )
}
