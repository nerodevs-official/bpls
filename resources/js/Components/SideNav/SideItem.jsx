// resources/js/Components/SideNav/SideItem.jsx
import { Link } from "@inertiajs/react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function SideItem({ href, active = false, icon: Icon, children, collapsed = false }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg text-sm transition-colors",
        collapsed ? "px-2 py-2" : "px-3 py-2",
        active
          ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
      title={collapsed ? String(children) : undefined}
      aria-label={collapsed ? String(children) : undefined}
    >
      {Icon ? (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-white" : "text-slate-500 group-hover:text-slate-900"
          )}
        />
      ) : null}
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  );
}
