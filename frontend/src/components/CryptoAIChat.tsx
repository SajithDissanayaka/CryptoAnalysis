import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { askCryptoAgent, type AgentResult } from '../api/cryptoAI'
import { useWorkspace } from '../hooks/useWorkspace'
import Icon, { Brand } from './Icon'

interface Message {
  id: number
  question: string
  result?: AgentResult
  error?: string
}
function Answer({ text }: { text: string }) {
  return (
    <div className="answer-text">
      {text.split('\n').map((line, i) => {
        const parts = line.replace(/^#{1,4}\s*/, '').split(/(\*\*[^*]+\*\*)/g)
        return (
          <p key={i} className={/^#{1,4}\s/.test(line) ? 'answer-subheading' : ''}>
            {parts.map((part, j) =>
              part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part,
            )}
            {!line && <br />}
          </p>
        )
      })}
    </div>
  )
}

export default function CryptoAIChat() {
  const { isDemo, selected } = useWorkspace()
  const [params] = useSearchParams()
  const [question, setQuestion] = useState(params.get('q')?.slice(0, 1000) || '')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const controller = useRef<AbortController | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const prompts = [
    {
      title: 'Read the momentum',
      question: `Analyze ${selected} using RSI and MACD. Explain the evidence and risks.`,
      icon: 'overview' as const,
    },
    {
      title: 'Get a price check',
      question: 'What is the latest ETH price? Include the source and timestamp.',
      icon: 'globe' as const,
    },
    {
      title: 'Connect your research',
      question: 'What do my uploaded documents say about Bitcoin?',
      icon: 'library' as const,
    },
  ]
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (messages.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])
  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (loading || !question.trim()) return
    if (isDemo) {
      setNotice(
        'Sign in to ask the AI agent and search your private research. Demo mode does not generate answers.',
      )
      return
    }
    const text = question.trim()
    const id = Date.now()
    const abort = new AbortController()
    controller.current = abort
    setMessages((current) => [...current, { id, question: text }])
    setQuestion('')
    setLoading(true)
    setNotice('')
    try {
      const result = await askCryptoAgent(text, abort.signal)
      if (!abort.signal.aborted)
        setMessages((current) => current.map((m) => (m.id === id ? { ...m, result } : m)))
    } catch (err) {
      if (!abort.signal.aborted)
        setMessages((current) =>
          current.map((m) =>
            m.id === id
              ? {
                  ...m,
                  error: err instanceof Error ? err.message : 'Analysis failed. Please retry.',
                }
              : m,
          ),
        )
    } finally {
      if (!abort.signal.aborted) {
        setLoading(false)
        input.current?.focus()
      }
    }
  }
  return (
    <section className="studio-chat panel">
      <div className="panel-top">
        <div className="panel-title">
          <Icon name="sparkles" size={18} />
          <h2>Your thinking partner</h2>
        </div>
        <button
          className="text-button"
          disabled={!messages.length || loading}
          onClick={() => {
            setMessages([])
            setNotice('')
          }}
        >
          <Icon name="plus" size={15} />
          New session
        </button>
      </div>
      <div
        className="chat-thread"
        role="log"
        aria-label="Research conversation"
        aria-live="polite"
        aria-busy={loading}
      >
        {!messages.length && (
          <div className="chat-welcome">
            <div className="welcome-signal">
              <Icon name="sparkles" size={32} />
            </div>
            <span className="eyebrow">CURIOSITY IS YOUR EDGE</span>
            <h2>
              Start with a<br />
              <em>better question.</em>
            </h2>
            <p>
              Explore market momentum, unpack technical signals,
              <br className="desktop-break" /> or find the evidence in your research.
            </p>
            <div className="prompt-grid">
              {prompts.map((prompt) => (
                <button
                  key={prompt.title}
                  onClick={() => {
                    setQuestion(prompt.question)
                    setNotice('')
                    input.current?.focus()
                  }}
                >
                  <Icon name={prompt.icon} size={18} />
                  <span>{prompt.title}</span>
                  <Icon name="up" size={15} />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div className="conversation-turn" key={message.id}>
            <div className="user-message">
              <span className="message-label">YOU</span>
              <p>{message.question}</p>
            </div>
            {message.result && (
              <div className="assistant-message">
                <div className="assistant-name">
                  <Brand compact />
                  <strong>CryptoMind</strong>
                  <span className="tiny-label">AI</span>
                </div>
                <Answer text={message.result.answer} />
                {message.result.tools_used.length > 0 && (
                  <div className="tool-tags">
                    {message.result.tools_used.map((tool) => (
                      <span className="tool-tag" key={tool}>
                        <Icon name="check" size={12} />
                        {tool.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {message.result.sources.length > 0 && (
                  <div className="source-list">
                    <span className="eyebrow">SUPPORTING DOCUMENTS</span>
                    {message.result.sources.map((source) => (
                      <div className="source-item" key={`${source.document_id}-${source.chunk_id}`}>
                        <Icon name="file" size={16} />
                        <div>
                          <strong>{source.title}</strong>
                          <small>
                            Document {source.document_id} · Excerpt {source.chunk_id}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {message.error && (
              <div className="error-message" role="alert">
                <p>{message.error}</p>
                <button
                  className="text-button"
                  onClick={() => {
                    setQuestion(message.question)
                    input.current?.focus()
                  }}
                >
                  Try this question again
                  <Icon name="arrow" size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="thinking-message">
            <span className="thinking-dots">
              <i />
              <i />
              <i />
            </span>
            <span>
              Following the evidence…
              <small>Checking relevant tools and sources. This can take a moment.</small>
            </span>
            <button
              className="text-button"
              onClick={() => {
                controller.current?.abort()
                setLoading(false)
                setMessages((current) =>
                  current.map((m, i) =>
                    i === current.length - 1
                      ? { ...m, error: 'Analysis canceled. You can retry this question.' }
                      : m,
                  ),
                )
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="composer-wrap">
        {notice && (
          <div className="info-message" role="status">
            {notice}
            <Link to="/login">
              Open your workspace <Icon name="arrow" size={14} />
            </Link>
          </div>
        )}
        <form className="chat-composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="crypto-question">
            Ask CryptoMind a question
          </label>
          <textarea
            ref={input}
            id="crypto-question"
            placeholder="Ask a question. Find a different perspective…"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={1000}
            rows={2}
            disabled={loading}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                void submit()
              }
            }}
          />
          <div className="composer-bottom">
            <span>
              <Icon name="sparkles" size={13} />
              {isDemo ? 'Demo · sign in to generate answers' : 'Evidence before opinion'}
            </span>
            <span className="character-count">{question.length}/1000</span>
            <button
              type="submit"
              className="send-button"
              aria-label="Send question"
              disabled={loading || !question.trim()}
            >
              <Icon name={loading ? 'refresh' : 'up'} className={loading ? 'spin' : ''} size={19} />
            </button>
          </div>
        </form>
        <p className="composer-hint">
          Enter to send · Shift + Enter for a new line. Each question starts a fresh analysis.
        </p>
      </div>
    </section>
  )
}
