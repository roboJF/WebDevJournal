import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function EntryMenu({ entry }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const editRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    editRef.current?.focus();
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
      setOpen(true);
      editRef.current?.focus();
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
        onClick={() => setOpen((current) => !current)}
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
        </div>
      )}
    </div>
  );
}
