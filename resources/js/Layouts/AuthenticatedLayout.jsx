import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import SideGroup from "@/Components/SideNav/SideGroup";
import SideItem from "@/Components/SideNav/SideItem";
import { Link, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";

import {
    LayoutDashboard,
    FileText,
    ChevronLeft,
    ChevronRight,
    UserCog,
    Users,
    Mails,
    MessageSquareText,
    Boxes,
    MessageSquareReply,
    House,
    GitPullRequestArrow,
    FileBadge,
    StickyNote,
} from "lucide-react";

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function SideNavLink({
    href,
    active = false,
    icon: Icon,
    children,
    collapsed = false,
}) {
    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center gap-3 rounded-xl text-sm transition-colors",
                collapsed ? "px-2 py-2 justify-center" : "px-3 py-2",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50",
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
                        "h-5 w-5 shrink-0",
                        active
                            ? "text-white"
                            : "text-slate-500 group-hover:text-slate-900"
                    )}
                />
            ) : null}
            {!collapsed && <span className="truncate">{children}</span>}
        </Link>
    );
}

export default function AuthenticatedLayout({
    header,
    children,
    firebaseUser,
}) {
    useEffect(() => {
        if (firebaseUser?.customToken) {
            signInWithCustomToken(auth, firebaseUser.customToken).catch(
                console.error
            );
        }
    }, [firebaseUser]);

    const { auth } = usePage().props;
    const user = auth?.user;
    const roles = auth?.user?.roles || []; // array of roles
    const role = roles[0] || null; // first role if single-role system

    useEffect(() => {
        console.log("Roles:", roles);
        console.log("Primary Role:", role);
    }, [roles]);

    const userPermissions = user?.permissions || [];
    const hasPermission = (permissionName) => {
        return userPermissions.includes(permissionName);
    };
    const isAdmin = roles.includes("Admin");
    const isArchivePerson = roles.includes("Archive Person");

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("ui.sidebarCollapsed") === "true";
        }
        return false;
    });

    useEffect(() => {
        try {
            localStorage.setItem(
                "ui.sidebarCollapsed",
                String(sidebarCollapsed)
            );
        } catch (e) {
            console.warn("Could not persist sidebar state", e);
        }
    }, [sidebarCollapsed]);

    const [ordersOpen, setOrdersOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("ui.ordersOpen") !== "false";
        }
        return true;
    });

    useEffect(() => {
        try {
            localStorage.setItem("ui.ordersOpen", String(ordersOpen));
        } catch (e) {
            console.warn("Could not persist orders state", e);
        }
    }, [ordersOpen]);

    const [lettersOpen, setlettersOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("ui.lettersOpen") !== "false";
        }
        return true;
    });

    useEffect(() => {
        try {
            localStorage.setItem("ui.lettersOpen", String(lettersOpen));
        } catch (e) {
            console.warn("Could not persist letters state", e);
        }
    }, [lettersOpen]);

    const [communicationOpen, setcommunicationOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("ui.communicationOpen") !== "false";
        }
        return true;
    });

    useEffect(() => {
        try {
            localStorage.setItem(
                "ui.communicationOpen",
                String(communicationOpen)
            );
        } catch (e) {
            console.warn("Could not persist communication state", e);
        }
    }, [communicationOpen]);

    const initials = useMemo(() => {
        if (!user?.name) return "U";
        return user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, [user?.name]);

    // ---- Active route checks ----
    const activeDashboard = route().current("dashboard");
    const activeRoles = route().current("roles*");
    const activeArchive = route().current("archive*");
    const activeUsers = route().current("users*");

    const activeOrdersAny =
        route().current("memo-order.*") ||
        route().current("special-order.*") ||
        route().current("executive-order.*");

    const activeLettersAny =
        route().current("requestletter.*") || route().current("replyletter.*");

    const activeCommunicationAny =
        route().current("miscellaneous.*") || route().current("titlehousing.*");

    const activeMemo = route().current("memo-order.*");
    const activereply = route().current("replyletter.*");
    const activerequest = route().current("requestletter.*");
    const activemiscellaneous = route().current("miscellaneous.*");
    const activetitlehousing = route().current("titlehousing.*");
    const activeSpecial = route().current("special-order.*");
    const activeExecutive = route().current("executive-order.*");

    const sidebarW = sidebarCollapsed ? "w-16" : "w-72";
    const contentML = sidebarCollapsed ? "sm:ml-16" : "sm:ml-72";

    // 🔒 Only show admin section if user has explicit permission
    const canManageUsers = hasPermission("manage users");

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sm:hidden">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="inline-flex items-center justify-center p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                    aria-label="Open sidebar"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>

                <Link href="/" className="flex items-center gap-2">
                    <ApplicationLogo className="block w-auto text-gray-800 fill-current" />
                </Link>

                <Dropdown>
                    <Dropdown.Trigger>
                        <span className="inline-flex rounded-md">
                            <button
                                type="button"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-600 bg-white border border-transparent rounded-md hover:text-gray-800 focus:outline-none"
                            >
                                {user?.name}
                                <svg
                                    className="-me-0.5 ms-2 h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </span>
                    </Dropdown.Trigger>
                    <Dropdown.Content>
                        <Dropdown.Link href={route("profile.edit")}>
                            Profile
                        </Dropdown.Link>
                        <Dropdown.Link
                            href={route("logout")}
                            method="post"
                            as="button"
                        >
                            Log Out
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>

            <div className="flex">
                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] sm:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed z-40 flex h-full flex-col border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white transition-transform duration-200",
                        sidebarW,
                        "sm:translate-x-0",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    aria-label="Sidebar"
                >
                    <div
                        className={cn(
                            "flex h-16 items-center justify-between px-4",
                            sidebarCollapsed && "px-2"
                        )}
                    >
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-3",
                                sidebarCollapsed && "justify-center w-full"
                            )}
                        >
                            <img
                                className="w-10 h-10"
                                src="/kanatoinilogo.png"
                                alt="Logo"
                            />
                            {!sidebarCollapsed && (
                                <span className="text-sm font-semibold text-slate-900">
                                    {user?.name}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => setSidebarCollapsed((v) => !v)}
                            className={cn(
                                "ml-2 hidden sm:inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none",
                                sidebarCollapsed && "mx-auto"
                            )}
                            aria-label={
                                sidebarCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                            title={sidebarCollapsed ? "Expand" : "Collapse"}
                        >
                            {sidebarCollapsed ? (
                                <ChevronRight className="w-5 h-5" />
                            ) : (
                                <ChevronLeft className="w-5 h-5" />
                            )}
                        </button>

                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-700 focus:outline-none sm:hidden"
                            aria-label="Close sidebar"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {!sidebarCollapsed && (
                        <div className="px-4 pt-1">
                            <div className="text-xs font-semibold tracking-wide uppercase text-slate-500">
                                Navigation
                            </div>
                        </div>
                    )}

                    <nav
                        className={cn(
                            "mt-2 flex-1 space-y-1 pb-4",
                            sidebarCollapsed ? "px-2" : "px-3"
                        )}
                    >
                        <SideNavLink
                            href={route("dashboard")}
                            active={activeDashboard}
                            icon={LayoutDashboard}
                            collapsed={sidebarCollapsed}
                        >
                            Dashboard
                        </SideNavLink>

                        {isAdmin && (
                            <>
                                <SideNavLink
                                    href={route("roles.index")}
                                    active={activeRoles}
                                    icon={UserCog}
                                    collapsed={sidebarCollapsed}
                                >
                                    Roles
                                </SideNavLink>

                                <SideNavLink
                                    href={route("users.index")}
                                    active={activeUsers}
                                    icon={Users}
                                    collapsed={sidebarCollapsed}
                                >
                                    User Management
                                </SideNavLink>
                            </>
                        )}

                        {/* Orders */}
                        <SideGroup
                            icon={FileText}
                            label="Orders"
                            active={activeOrdersAny}
                            open={ordersOpen}
                            onOpenChange={setOrdersOpen}
                            collapsed={sidebarCollapsed}
                        >
                            <SideItem
                                href={route("executive-order.index")}
                                active={activeExecutive}
                                icon={FileText}
                                collapsed={sidebarCollapsed}
                            >
                                Executive Orders
                            </SideItem>
                            <SideItem
                                href={route("memo-order.index")}
                                active={activeMemo}
                                icon={StickyNote}
                                collapsed={sidebarCollapsed}
                            >
                                Memo Order
                            </SideItem>
                            <SideItem
                                href={route("special-order.index")}
                                active={activeSpecial}
                                icon={FileBadge}
                                collapsed={sidebarCollapsed}
                            >
                                Special Order
                            </SideItem>
                        </SideGroup>

                        {/* Letters */}
                        <SideGroup
                            icon={Mails}
                            label="Letters"
                            active={activeLettersAny}
                            open={lettersOpen}
                            onOpenChange={setlettersOpen}
                            collapsed={sidebarCollapsed}
                        >
                            <SideItem
                                href={route("requestletter.index")}
                                active={activerequest}
                                icon={GitPullRequestArrow}
                                collapsed={sidebarCollapsed}
                            >
                                Request Letter
                            </SideItem>
                            <SideItem
                                href={route("replyletter.index")}
                                active={activereply}
                                icon={MessageSquareReply}
                                collapsed={sidebarCollapsed}
                            >
                                Reply Letter
                            </SideItem>
                        </SideGroup>

                        {/* Communications */}
                        <SideGroup
                            icon={MessageSquareText}
                            label="Communication"
                            active={activeCommunicationAny}
                            open={communicationOpen}
                            onOpenChange={setcommunicationOpen}
                            collapsed={sidebarCollapsed}
                        >
                            <SideItem
                                href={route("miscellaneous.index")}
                                active={activemiscellaneous}
                                icon={Boxes}
                                collapsed={sidebarCollapsed}
                            >
                                Miscellaneous
                            </SideItem>
                            <SideItem
                                href={route("titlehousing.index")}
                                active={activetitlehousing}
                                icon={House}
                                collapsed={sidebarCollapsed}
                            >
                                Title Housing
                            </SideItem>
                        </SideGroup>

                        {(isAdmin || isArchivePerson) && (
                            <SideNavLink
                                href={route("archive.index")}
                                active={activeArchive}
                                icon={UserCog}
                                collapsed={sidebarCollapsed}
                            >
                                Archives
                            </SideNavLink>
                        )}
                    </nav>

                    {!sidebarCollapsed && user && (
                        <div className="p-3 mx-3 mb-3 border shadow-sm rounded-xl border-slate-200 bg-white/70">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white rounded-full bg-slate-900">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate text-slate-900">
                                        {user.name}
                                    </div>
                                    <div className="text-xs truncate text-slate-500">
                                        {user.email}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Link
                                    href={route("profile.edit")}
                                    className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Profile
                                </Link>
                                <Link
                                    method="post"
                                    href={route("logout")}
                                    as="button"
                                    className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                                >
                                    Log Out
                                </Link>
                            </div>
                        </div>
                    )}

                    {!sidebarCollapsed && (
                        <div className="mt-auto border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
                            <div>
                                © {new Date().getFullYear()} Davao Oriental
                                Capitol
                            </div>
                            <div className="opacity-80">v1.0.0</div>
                        </div>
                    )}
                </aside>

                {/* Main content */}
                <div
                    className={cn(
                        "flex min-h-screen w-full flex-col",
                        contentML
                    )}
                >
                    {header && (
                        <header className="border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                            <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                                {header}
                            </div>
                        </header>
                    )}
                    <main className="w-full  mx-auto">{children}</main>
                </div>
            </div>
        </div>
    );
}
