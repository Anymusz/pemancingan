import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import PropTypes from "prop-types";

// ── Animation variants (inspired by TableReference) ──────────────
const containerVariants = {
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 400, damping: 25, mass: 0.7 },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const expandVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
  },
  exit: { height: 0, opacity: 0, transition: { duration: 0.15 } },
};

// ── Vertical three-dot icon (SVG) ────────────────────────────────
function DotsVerticalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="3" r="1.5" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ── Action dropdown (per-row, controlled) ────────────────────────
function ActionDropdown({ actions, row, isOpen, onToggle, onClose }) {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({
    top: 0,
    left: 0,
    openUpward: false,
    ready: false,
  });

  // Compute position from trigger rect, then measure actual dropdown height to decide flip
  useLayoutEffect(() => {
    if (!isOpen) return;

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const DROPDOWN_WIDTH = 160; // w-40 = 10rem
    const left = Math.max(4, rect.right - DROPDOWN_WIDTH);

    // First render hidden at bottom position so dropdownRef mounts and can be measured
    setPos({ top: rect.bottom + 4, left, openUpward: false, ready: false });

    // Measure actual rendered height on next frame, then finalize position
    requestAnimationFrame(() => {
      const dropdownHeight = dropdownRef.current?.offsetHeight ?? 160;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow < dropdownHeight + 8) {
        setPos({
          top: rect.top - dropdownHeight - 4,
          left,
          openUpward: true,
          ready: true,
        });
      } else {
        setPos({ top: rect.bottom + 4, left, openUpward: false, ready: true });
      }
    });

    return () => setPos({ top: 0, left: 0, openUpward: false, ready: false });
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  // Close on scroll or resize — position becomes stale after either event
  useEffect(() => {
    if (!isOpen) return;
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen, onClose]);

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: pos.openUpward ? 4 : -4 }}
            animate={{ opacity: pos.ready ? 1 : 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: pos.openUpward ? 4 : -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: 160,
            }}
            className="bg-background border border-border/50 shadow-lg rounded-md z-[9999] py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.onClick(row);
                  onClose();
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 ${
                  action.variant === "danger"
                    ? "text-red-500 hover:text-red-600"
                    : "text-foreground"
                }`}
              >
                {action.icon && <span className="w-4 h-4">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className="relative flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        onClick={onToggle}
        className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-1 rounded-md hover:bg-muted/40"
      >
        <DotsVerticalIcon />
      </button>

      {typeof document !== "undefined"
        ? ReactDOM.createPortal(dropdownContent, document.body)
        : null}
    </div>
  );
}

// ── Main DataTable component ─────────────────────────────────────
export function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = "Belum ada data",
  expandable,
  getRowActions,
  pagination,
  className = "",
  rowClassName,
}) {
  const [expandedRows, setExpandedRows] = useState({});
  const [openActionId, setOpenActionId] = useState(null);

  const closeAction = useCallback(() => setOpenActionId(null), []);

  // Build gridTemplateColumns dynamically
  const gridTemplate = useMemo(() => {
    const parts = [];
    if (expandable) parts.push("40px");
    columns.forEach((col) => parts.push(col.width || "1fr"));
    if (getRowActions) parts.push("48px");
    return parts.join(" ");
  }, [columns, expandable, getRowActions]);

  const totalVisualCols =
    columns.length + (expandable ? 1 : 0) + (getRowActions ? 1 : 0);
  const minTableWidth =
    columns.length * 150 + (expandable ? 40 : 0) + (getRowActions ? 48 : 0);

  const toggleExpand = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-background border border-border/50 overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${minTableWidth}px` }}>
              {/* Skeleton header */}
              <div
                className="px-2 sm:px-3 py-3 bg-muted/60 border-b border-border/50"
                style={{
                  display: "grid",
                  gridTemplateColumns: gridTemplate,
                  columnGap: 0,
                }}
              >
                {Array.from({ length: totalVisualCols }).map((_, i) => (
                  <div key={i} className="px-2 sm:px-3">
                    <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Skeleton rows */}
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="px-2 sm:px-3 py-3 sm:py-3.5 border-b border-border/20"
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridTemplate,
                    columnGap: 0,
                    alignItems: "center",
                  }}
                >
                  {Array.from({ length: totalVisualCols }).map((_, colIdx) => (
                    <div key={colIdx} className="px-2 sm:px-3">
                      <div
                        className="h-4 bg-muted/30 rounded animate-pulse"
                        style={{
                          width: `${55 + ((rowIdx + colIdx) % 4) * 12}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-background border border-border/50 overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${minTableWidth}px` }}>
              {/* Header */}
              <div
                className="px-2 sm:px-3 py-3 text-xs sm:text-sm font-semibold text-muted-foreground bg-muted/60 border-b border-border/50"
                style={{
                  display: "grid",
                  gridTemplateColumns: gridTemplate,
                  columnGap: 0,
                }}
              >
                {expandable && <div />}
                {columns.map((col) => (
                  <div key={col.key} className="px-2 sm:px-3 flex items-center">
                    {col.header}
                  </div>
                ))}
                {getRowActions && <div />}
              </div>

              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Populated table ────────────────────────────────────────────
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-background border border-border/50 overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${minTableWidth}px` }}>
            {/* Header row */}
            <div
              className="px-2 sm:px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-muted-foreground bg-muted/60 border-b border-border/50 text-left"
              style={{
                display: "grid",
                gridTemplateColumns: gridTemplate,
                columnGap: 0,
              }}
            >
              {expandable && (
                <div className="flex items-center justify-center border-r border-border/20 pr-2 sm:pr-3" />
              )}
              {columns.map((col, i) => (
                <div
                  key={col.key}
                  className={`flex items-center px-2 sm:px-3 ${
                    i < columns.length - 1 ? "border-r border-border/20" : ""
                  }`}
                >
                  {col.header}
                </div>
              ))}
              {getRowActions && <div />}
            </div>

            {/* Data rows */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pagination ? `page-${pagination.currentPage}` : "all"}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {data.map((row, rowIndex) => (
                  <motion.div key={row.id ?? rowIndex} variants={rowVariants}>
                    {/* Main row */}
                    <div
                      className={`px-2 sm:px-3 py-2.5 sm:py-3.5 group relative transition-all duration-150 border-b border-border/20 bg-card hover:bg-muted/30 ${
                        expandable ? "cursor-pointer select-none" : ""
                      } ${rowClassName ? rowClassName(row) : ""}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: gridTemplate,
                        columnGap: 0,
                        alignItems: "center",
                      }}
                      onClick={
                        expandable ? () => toggleExpand(rowIndex) : undefined
                      }
                    >
                      {/* Chevron column */}
                      {expandable && (
                        <div className="flex items-center justify-center border-r border-border/20 pr-2 sm:pr-3">
                          <ChevronRight
                            size={16}
                            className={`text-muted-foreground/50 transition-transform duration-200 ${
                              expandedRows[rowIndex] ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      )}

                      {/* Data columns */}
                      {columns.map((col, colIdx) => (
                        <div
                          key={col.key}
                          className={`flex items-center min-w-0 px-2 sm:px-3 text-xs sm:text-sm md:text-sm ${
                            colIdx < columns.length - 1
                              ? "border-r border-border/20"
                              : ""
                          }`}
                        >
                          {col.render ? (
                            col.render(row)
                          ) : (
                            <span className="text-foreground truncate">
                              {row[col.key]}
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Action column */}
                      {getRowActions &&
                        (() => {
                          const rowActions = getRowActions(row);
                          return (
                            <div className="flex items-center justify-center px-1">
                              {rowActions.length > 0 && (
                                <ActionDropdown
                                  actions={rowActions}
                                  row={row}
                                  isOpen={openActionId === (row.id ?? rowIndex)}
                                  onToggle={() =>
                                    setOpenActionId((prev) =>
                                      prev === (row.id ?? rowIndex)
                                        ? null
                                        : (row.id ?? rowIndex),
                                    )
                                  }
                                  onClose={closeAction}
                                />
                              )}
                            </div>
                          );
                        })()}
                    </div>

                    {/* Expandable detail row */}
                    {expandable && typeof expandable.render === "function" && (
                      <AnimatePresence>
                        {expandedRows[rowIndex] && (
                          <motion.div
                            variants={expandVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="overflow-hidden border-b border-border/20 bg-muted/10"
                          >
                            <div className="px-6 py-4">
                              {expandable.render(row)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 
        TODO: Pagination ini belum digunakan oleh halaman manapun.
        Rencananya akan dipindahkan ke komponen terpisah `common/Pagination.jsx`.
        Jangan hapus blok ini sebelum komponen Pagination selesai dibuat.
      */}
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground/70">
            Halaman {pagination.currentPage} dari {pagination.totalPages}
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() =>
                pagination.onPageChange(Math.max(1, pagination.currentPage - 1))
              }
              disabled={pagination.currentPage === 1}
              className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-md"
            >
              Sebelumnya
            </button>
            <button
              onClick={() =>
                pagination.onPageChange(
                  Math.min(pagination.totalPages, pagination.currentPage + 1),
                )
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-md"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.node.isRequired,
      width: PropTypes.string,
      render: PropTypes.func,
    }),
  ).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  expandable: PropTypes.shape({
    render: PropTypes.func.isRequired,
  }),
  getRowActions: PropTypes.func,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
  }),
  className: PropTypes.string,
  rowClassName: PropTypes.func,
};
