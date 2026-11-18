import React, { useEffect, useRef, useState } from "react";
import { FaEllipsisV, FaSearch, FaTimes } from "react-icons/fa";

export const Skeleton = ({ className = "", rows = 3 }) => (
  <div className={`admin-skeleton ${className}`} aria-label="Loading">
    {Array.from({ length: rows }).map((_, index) => (
      <span key={index} />
    ))}
  </div>
);

export const EmptyState = ({ icon, title = "No records found", description, action }) => (
  <div className="admin-empty-state">
    {icon && <div className="admin-empty-icon">{icon}</div>}
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div className="admin-empty-action">{action}</div>}
  </div>
);

export const TableToolbar = ({ search, onSearch, searchPlaceholder = "Search...", filters, action }) => (
  <div className="admin-table-toolbar">
    <label className="admin-search-box">
      <FaSearch aria-hidden="true" />
      <input
        type="search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
      />
      {search && (
        <button type="button" onClick={() => onSearch("")} aria-label="Clear search">
          <FaTimes />
        </button>
      )}
    </label>
    {filters && <div className="admin-toolbar-filters">{filters}</div>}
    {action && <div className="admin-toolbar-action">{action}</div>}
  </div>
);

export const Pagination = ({ page, totalPages = 1, onPageChange, from, to, total }) => {
  if (totalPages <= 1 && total == null) return null;
  return (
    <div className="admin-pagination">
      <p>{total != null ? `Showing ${from ?? 0}-${to ?? 0} of ${total}` : `Page ${page} of ${totalPages}`}</p>
      <div>
        <button type="button" className="admin-page-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const number = start + index;
          if (number > totalPages) return null;
          return (
            <button
              type="button"
              key={number}
              className={`admin-page-button ${number === page ? "active" : ""}`}
              onClick={() => onPageChange(number)}
            >
              {number}
            </button>
          );
        })}
        <button type="button" className="admin-page-button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export const ActionMenu = ({ items = [], label = "Actions" }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="admin-action-menu" ref={menuRef}>
      <button type="button" className="admin-action-trigger" onClick={() => setOpen((value) => !value)} aria-label={label} aria-expanded={open}>
        <FaEllipsisV />
      </button>
      {open && (
        <div className="admin-action-dropdown">
          {items.map((item, index) => (
            <button
              type="button"
              key={`${item.label}-${index}`}
              className={item.danger ? "danger" : ""}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              disabled={item.disabled}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ConfirmDialog = ({ open, title = "Confirm action", description, confirmLabel = "Confirm", danger = false, onCancel, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        {description && <p>{description}</p>}
        <div className="admin-confirm-actions">
          <button type="button" className="admin-button-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className={danger ? "admin-button-danger" : "admin-button-primary"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
