import { useEffect, useId, useRef } from 'react';

export default function UnsavedChangesDialog({ onStay, onLeave }) {
  const dialogRef = useRef(null);
  const stayRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    stayRef.current?.focus();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      className="unsaved-dialog"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onStay();
      }}
    >
      <header className="titlebar">
        <h2 id={titleId}>Leave without saving?</h2>
      </header>
      <div className="window-body">
        <p id={descriptionId}>You have unsaved changes. Your progress will be lost if you leave.</p>
        <div className="entry-form-actions">
          <button type="button" ref={stayRef} onClick={onStay}>
            Stay
          </button>
          <button type="button" className="danger-button" onClick={onLeave}>
            Leave without saving
          </button>
        </div>
      </div>
    </dialog>
  );
}
