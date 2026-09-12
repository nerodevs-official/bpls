// resources/js/Components/SideNav/SideGroup.jsx
import React, { useEffect, useRef, useState, Children, isValidElement, cloneElement } from "react";
import { ChevronDown } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function SideGroup({
  icon: Icon,
  label,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  active = false,
  collapsed = false,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = typeof openProp === "boolean";
  const open = controlled ? openProp : internalOpen;

  useEffect(() => {
    if (!controlled && active) setInternalOpen(true);
  }, [active, controlled]);

  const toggleExpanded = () => {
    if (controlled) onOpenChange?.(!open);
    else setInternalOpen((v) => !v);
  };

  // ---------- Collapsed (icon rail) : CLICK to open popover ----------
  const [popOpen, setPopOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!collapsed) return;
    const onDocMouseDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setPopOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPopOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [collapsed]);

  if (collapsed) {
    // Force labels to show inside the popover
    const expandedChildren = Children.map(children, (child) =>
      isValidElement(child) ? cloneElement(child, { collapsed: false }) : child
    );

    return (
      <div ref={rootRef} className="relative">
        {/* Icon button toggles the popover on click */}
        <button
          type="button"
          onClick={() => setPopOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={popOpen}
          className={cn(
            "flex w-full items-center justify-center rounded-xl p-2",
            "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50",
            active && "bg-slate-900 text-white ring-1 ring-slate-900/10"
          )}
          title={label}
          aria-label={label}
        >
          {Icon ? (
            <Icon className={cn("h-5 w-5", active ? "text-white" : "text-slate-500")} />
          ) : null}
        </button>

        {/* Click-open popover with visible label + item texts */}
        {popOpen && (
          <div
            role="menu"
            aria-label={label}
            className={cn(
              "absolute left-full top-0 z-50 ml-2 w-64 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-xl"
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </div>
            <div className="space-y-1">{expandedChildren}</div>
          </div>
        )}
      </div>
    );
  }

  // ---------- Expanded (original) ----------
  return (
    <div className="select-none">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={open}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50",
          active
            ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "h-5 w-5 shrink-0",
              active ? "text-white" : "text-slate-500 group-hover:text-slate-900"
            )}
          />
        ) : null}
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 transition-transform",
            open ? "rotate-180" : "rotate-0",
            active ? "opacity-90" : "opacity-60 group-hover:opacity-90"
          )}
        />
      </button>

      <div
        className={cn(
          "mt-1 overflow-hidden pl-2",
          open ? "max-h-[500px]" : "max-h-0",
          "transition-[max-height] duration-200 ease-in-out"
        )}
      >
        <div className="space-y-1 border-l border-slate-200 pl-3">{children}</div>
      </div>
    </div>
  );
}
