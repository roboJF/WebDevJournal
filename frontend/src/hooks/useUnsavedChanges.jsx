import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import UnsavedChangesDialog from '../components/UnsavedChangesDialog.jsx';

export default function useUnsavedChanges() {
  const dirtyRef = useRef(false);
  const [dirty, setDirtyState] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  // Read the ref so successful saves can allow navigation immediately.
  const blocker = useBlocker(useCallback(() => dirtyRef.current, []));

  const setDirty = useCallback((value) => {
    dirtyRef.current = value;
    setDirtyState(value);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  function requestLeave(action) {
    // Actions such as logout must wait for confirmation before changing auth state.
    if (dirtyRef.current) setPendingAction(() => action);
    else action();
  }

  function stay() {
    if (blocker.state === 'blocked') blocker.reset();
    setPendingAction(null);
  }

  function leave() {
    setDirty(false);
    setPendingAction(null);
    if (pendingAction) pendingAction();
    else if (blocker.state === 'blocked') blocker.proceed();
  }

  return {
    setDirty,
    markClean: () => setDirty(false),
    requestLeave,
    confirmation:
      blocker.state === 'blocked' || pendingAction ? (
        <UnsavedChangesDialog onStay={stay} onLeave={leave} />
      ) : null,
  };
}
