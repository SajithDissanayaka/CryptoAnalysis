import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { deleteDocument, getDocuments, type ResearchDocument } from '../api/cryptoAI'
import CryptoDocumentUpload from '../components/CryptoDocumentUpload'
import Icon from '../components/Icon'
import { useWorkspace } from '../hooks/useWorkspace'

export default function ResearchPage() {
  const { isDemo, base } = useWorkspace()
  const [documents, setDocuments] = useState<ResearchDocument[]>([])
  const [loading, setLoading] = useState(!isDemo)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [remove, setRemove] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => {
    setLoading(true)
    setVersion((v) => v + 1)
  }, [])
  useEffect(() => {
    if (isDemo) return
    const abort = new AbortController()
    getDocuments(abort.signal)
      .then((data) => {
        if (!abort.signal.aborted) {
          setDocuments(data.documents)
          setError('')
        }
      })
      .catch((err) => {
        if (!abort.signal.aborted)
          setError(err instanceof Error ? err.message : 'Could not load research.')
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })
    return () => abort.abort()
  }, [isDemo, version])
  const handleDelete = async (id: number) => {
    setDeleting(true)
    setError('')
    try {
      await deleteDocument(id)
      setDocuments((current) => current.filter((doc) => doc.document_id !== id))
      setRemove(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete document.')
    } finally {
      setDeleting(false)
    }
  }
  const filtered = documents.filter((doc) => doc.title.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="research-page page-enter">
      <div className="page-heading compact-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            MAKE KNOWLEDGE YOUR ADVANTAGE
          </div>
          <h1>
            Your research.
            <br />
            <span className="heading-soft">
              A more connected <em>perspective.</em>
            </span>
          </h1>
          <p>A home for the ideas that inform your thinking.</p>
        </div>
        <Link className="button button-outline" to={`${base}/ai`}>
          <Icon name="sparkles" size={16} />
          Ask your research
          <Icon name="up" size={16} />
        </Link>
      </div>
      <div className="research-grid">
        <section className="panel library-panel">
          <div className="panel-top">
            <div className="panel-title">
              <span className="mini-square" />
              <h2>Research library</h2>
              <span className="count-badge">{documents.length}</span>
            </div>
            <button
              className="icon-button"
              aria-label="Refresh documents"
              disabled={loading || isDemo}
              onClick={reload}
            >
              <Icon name="refresh" size={16} className={loading ? 'spin' : ''} />
            </button>
          </div>
          <div className="library-toolbar">
            <label className="asset-search">
              <Icon name="search" size={16} />
              <span className="sr-only">Search research documents</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a document…"
              />
            </label>
            <span className="tiny-label">PRIVATE LIBRARY</span>
          </div>
          {error && (
            <div className="error-message library-error" role="alert">
              {error}
              <button className="text-button" onClick={reload}>
                Retry
                <Icon name="refresh" size={14} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="library-empty" role="status">
              <Icon name="refresh" className="spin" size={30} />
              <p>Opening your research library…</p>
            </div>
          ) : !filtered.length ? (
            <div className="library-empty">
              <div className="empty-library-art" aria-hidden="true">
                <span className="paper paper-one" />
                <span className="paper paper-two" />
                <span className="paper paper-three">
                  <Icon name="library" size={30} />
                </span>
              </div>
              <span className="eyebrow">
                {query ? 'NOT IN THIS CHAPTER' : 'EVERY PERSPECTIVE STARTS SOMEWHERE'}
              </span>
              <h2>{query ? 'No matching documents.' : 'Good ideas deserve a home.'}</h2>
              <p>
                {query
                  ? 'Try another title to find what you need.'
                  : 'Add your first document, then let CryptoMind help you connect the dots.'}
              </p>
              {query && (
                <button className="text-button" onClick={() => setQuery('')}>
                  Clear search
                  <Icon name="arrow" size={15} />
                </button>
              )}
            </div>
          ) : (
            <div className="document-list">
              {filtered.map((doc) => (
                <article className="document-row" key={doc.document_id}>
                  <span className="document-icon">
                    <Icon name="file" size={22} />
                  </span>
                  <div className="document-info">
                    <h3>{doc.title}</h3>
                    <p>
                      {doc.chunks_saved} excerpts · Added{' '}
                      {new Date(
                        doc.created_at.endsWith('Z') || /[+-]\d\d:\d\d$/.test(doc.created_at)
                          ? doc.created_at
                          : `${doc.created_at}Z`,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  {remove === doc.document_id ? (
                    <div className="delete-confirm">
                      <span>Remove this document?</span>
                      <button
                        className="text-button danger"
                        disabled={deleting}
                        onClick={() => {
                          void handleDelete(doc.document_id)
                        }}
                      >
                        {deleting ? 'Removing…' : 'Remove'}
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Cancel removal"
                        disabled={deleting}
                        onClick={() => setRemove(null)}
                      >
                        <Icon name="close" size={15} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="indexed-badge">
                        <span className="status-dot" />
                        Indexed
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${doc.title}`}
                        onClick={() => setRemove(doc.document_id)}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="table-bottom">
            <span>
              {documents.length} document{documents.length === 1 ? '' : 's'} in your library
            </span>
            <span>
              <Icon name="library" size={13} />
              Only accessible to you
            </span>
          </div>
        </section>
        <CryptoDocumentUpload onUploaded={reload} />
      </div>
      <div className="research-how">
        <span className="eyebrow">FROM INFORMATION TO INSIGHT</span>
        <div>
          <span>01</span>
          <p>
            <strong>Bring your research</strong>Upload a PDF or text document.
          </p>
          <Icon name="arrow" size={20} />
          <span>02</span>
          <p>
            <strong>Make connections</strong>We index the ideas inside it.
          </p>
          <Icon name="arrow" size={20} />
          <span>03</span>
          <p>
            <strong>Ask better questions</strong>Find answers with supporting evidence.
          </p>
        </div>
      </div>
    </div>
  )
}
