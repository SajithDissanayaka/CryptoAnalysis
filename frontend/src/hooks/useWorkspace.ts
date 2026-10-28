import { useContext } from 'react'
import { WorkspaceContext } from '../context/workspace'

export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('WorkspaceProvider is missing.')
  return value
}
