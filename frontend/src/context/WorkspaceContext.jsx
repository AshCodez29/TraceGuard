import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEMO_FINDINGS } from '../services/demoData.js';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [selectedFindingId, setSelectedFindingId] = useState(1);
  const [selectedTable, setSelectedTable] = useState('orders');
  const [findingStates, setFindingStates] = useState({});
  const [currentFindings, setCurrentFindings] = useState(DEMO_FINDINGS);
  const updateFindingState = useCallback((id, patch) => setFindingStates((current) => ({ ...current, [id]: { ...current[id], ...patch } })), []);
  const value = useMemo(() => ({ selectedFindingId, setSelectedFindingId, selectedTable, setSelectedTable, findingStates, updateFindingState, currentFindings, setCurrentFindings }), [selectedFindingId, selectedTable, findingStates, updateFindingState, currentFindings]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return value;
};
