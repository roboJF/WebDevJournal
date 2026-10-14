import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function EntryMenu({ entry, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const editRef = useRef(null);
  const deleteRef = useRef(null);
  const initialFocusRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    [editRef.current, deleteRef.current][initialFocusRef.current]?.focus();
    const closeOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
    };
  }, [open]);

  function onKeyDown(event) {
    if (open && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        initialFocusRef.current = event.key === 'ArrowUp' ? 1 : 0;
        setOpen(true);
      } else {
        const items = [editRef.current, deleteRef.current];
        const index = items.indexOf(document.activeElement);
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        items[(index + direction + items.length) % items.length]?.focus();
      }
    } else if (open && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      (event.key === 'Home' ? editRef : deleteRef).current?.focus();
    }
  }

  return (
    <div className={`entry-menu${open ? ' is-open' : ''}`} ref={containerRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        className="entry-menu-toggle"
        ref={buttonRef}
        aria-label={`Actions for ${entry.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          initialFocusRef.current = 0;
          setOpen((current) => !current);
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="entry-menu-dropdown" role="menu" id={menuId} aria-label="Entry actions">
          <Link
            role="menuitem"
            tabIndex={-1}
            ref={editRef}
            to={`/entries/${entry.id}/edit`}
            onClick={() => setOpen(false)}
          >
            Edit
          </Link>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            ref={deleteRef}
            className="danger-text"
            onClick={() => {
              setOpen(false);
              onDelete(entry, buttonRef.current);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
