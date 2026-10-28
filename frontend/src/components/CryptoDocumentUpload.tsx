import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router'
import { uploadCryptoDocument } from '../api/cryptoAI'
import { useWorkspace } from '../hooks/useWorkspace'
import Icon from './Icon'

export default function CryptoDocumentUpload({ onUploaded }: { onUploaded?: () => void }) {
  const { isDemo } = useWorkspace()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const controller = useRef<AbortController | null>(null)
  const id = useId()
  useEffect(() => () => controller.current?.abort(), [])
  const choose = (candidate: File | null) => {
    if (loading) return
    setError('')
    setSuccess('')
    setFile(null)
    if (!candidate) return
    if (!/\.(pdf|txt)$/i.test(candidate.name)) {
      setError('Choose a PDF or UTF-8 TXT document.')
      return
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setError('Maximum file size is 5 MB.')
      return
    }
    if (!candidate.size) {
      setError('This file is empty. Please choose another document.')
      return
    }
    setFile(candidate)
  }
  const upload = async () => {
    if (!file || loading || isDemo) return
    setLoading(true)
    setError('')
    setSuccess('')
    const abort = new AbortController()
    controller.current = abort
    try {
      const result = await uploadCryptoDocument(file, abort.signal)
      if (abort.signal.aborted) return
      setSuccess(
        result.message ||
          `${result.title} is ready. ${result.chunks_saved ?? 0} research excerpts indexed.`,
      )
      setFile(null)
      if (input.current) input.current.value = ''
      onUploaded?.()
    } catch (err) {
      if (!abort.signal.aborted)
        setError(err instanceof Error ? err.message : 'Upload failed. Please retry.')
    } finally {
      if (!abort.signal.aborted) setLoading(false)
    }
  }
  const drop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    choose(event.dataTransfer.files[0] || null)
  }
  return (
    <section className="panel upload-panel">
      <div className="panel-top">
        <div className="panel-title">
          <Icon name="plus" size={18} />
          <h2>Add to your perspective</h2>
        </div>
      </div>
      <div className="upload-body">
        <p>
          A whitepaper, a thesis, an idea worth keeping.
          <br />
          Make it part of your next conversation.
        </p>
        <label
          htmlFor={id}
          className={`upload-area ${dragging ? 'is-dragging' : ''} ${loading ? 'is-uploading' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            if (!loading) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
        >
          <span className="upload-icon">
            <Icon name={file ? 'file' : 'upload'} size={26} />
          </span>
          <strong>{file ? file.name : 'Drop a little knowledge here'}</strong>
          <span>
            {file ? (
              `${(file.size / 1024).toFixed(1)} KB · Ready to add`
            ) : (
              <>
                or <u>browse your files</u>
              </>
            )}
          </span>
          <small>PDF or TXT · Up to 5 MB</small>
          <input
            ref={input}
            id={id}
            type="file"
            accept=".pdf,.txt"
            disabled={loading}
            onChange={(e) => choose(e.target.files?.[0] || null)}
          />
        </label>
        {isDemo ? (
          <div className="info-message">
            Your library is private to your account.
            <Link to="/login">
              Sign in to upload research <Icon name="arrow" size={14} />
            </Link>
          </div>
        ) : (
          <button
            className="button button-mint upload-button"
            disabled={!file || loading}
            onClick={() => {
              void upload()
            }}
          >
            <Icon name={loading ? 'refresh' : 'plus'} className={loading ? 'spin' : ''} size={17} />
            {loading ? 'Reading and indexing…' : 'Add to research library'}
            {!loading && <Icon name="up" size={17} />}
          </button>
        )}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="success-message" role="status">
            <Icon name="check" size={17} />
            {success}
          </div>
        )}
        <div className="upload-limits">
          <Icon name="info" size={15} />
          <p>Up to 30 PDF pages and 40,000 extracted characters. Text-based documents work best.</p>
        </div>
      </div>
    </section>
  )
}
