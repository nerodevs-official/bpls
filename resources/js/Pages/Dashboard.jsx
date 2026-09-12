import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, Link } from "@inertiajs/react";
import GroupChat from "@/Components/GroupChat";
import { useState, useMemo, useEffect } from "react";

// Chart.js imports


import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from "react-chartjs-2";


// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

import {
  FileText,
  StickyNote,
  Sparkles,
  ClipboardList,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  FolderOpen,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  Target,
  Download,
  Crown,
  Eye,
  Loader,
  UserCog,
} from "lucide-react";

// Loading Spinner Component
const LoadingSpinner = ({ size = 8 }) => (
  <div className="flex items-center justify-center py-12">
    <Loader className={`w-${size} h-${size} text-yellow-500 animate-spin`} />
  </div>
);

// Skeleton Loader Components
const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="p-3 rounded-lg bg-gray-200">
        <div className="w-6 h-6"></div>
      </div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-48 bg-gray-100 rounded"></div>
  </div>
);

const RoleCard = ({ role, data }) => {
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);
  const avgTasks =
    data.count > 0 ? Math.round(data.assigned_tasks / data.count) : 0;

  return (
    <div className="flex flex-col sm:flex-row items-start gap-6 rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
      {/* Role Summary (Left Side) */}
      <div className="flex-1 text-center sm:text-left">
        <div className="text-3xl font-semibold text-gray-900">
          {data.count || 0}
        </div>
        <div className="text-sm text-gray-500 mb-2">{roleName} Users</div>

        <div className="text-lg font-medium text-blue-600">
          {data.assigned_tasks || 0}
        </div>
        <div className="text-xs text-gray-500">Assigned Tasks</div>

        {data.count > 0 && (
          <div className="text-xs text-green-600 mt-1">
            Avg: {avgTasks} / user
          </div>
        )}
      </div>

      {/* Divider (for large screens only) */}
      <div className="hidden sm:block w-px h-20 bg-gray-100"></div>

      {/* User List (Right Side) */}
      <div className="flex-[2] w-full">
        <UserList role={roleName} users={data.users} />
      </div>
    </div>
  );
};

const UserList = ({ role, users }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-700 mb-2">Users</h4>
    <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
      {users?.length > 0 ? (
        users.map((userName, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <span className="text-gray-700 truncate text-wrap">{userName}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
              {role}
            </span>
          </div>
        ))
      ) : (
        <div className="text-sm text-gray-400 text-center py-2">
          No users in this role
        </div>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const {
    auth,
    stats,
    recent,
    assigned_to_me,
    user_name,
    permissions,
    role,
    capabilities,
    role_distribution,
  } = usePage().props;

  const userPermissions = auth?.user?.permissions || permissions || [];
  const userCapabilities = capabilities || {};

  const [timeRange, setTimeRange] = useState("week");
  const [expandedSections, setExpandedSections] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [showOverdueDetails, setShowOverdueDetails] = useState(false);

  // Check if user is admin
  const isAdmin =
    role === "admin" ||
    userPermissions.includes("admin") ||
    userPermissions.includes("manage users");

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setChartsLoaded(true), 300);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Calculate real metrics from actual data
  const enhancedStats = useMemo(() => {
    // Calculate productivity metrics from real data
    const totalCompleted = Object.values(recent || {}).reduce(
      (total, items) => {
        return (
          total +
          (items?.filter(
            (item) =>
              item.status === "Approved" ||
              item.status === "Filed" ||
              item.status === "Disseminated",
          )?.length || 0)
        );
      },
      0,
    );

    const totalPending = Object.values(recent || {}).reduce((total, items) => {
      return (
        total +
        (items?.filter(
          (item) => item.status === "For Review" || item.status === "Drafted",
        )?.length || 0)
      );
    }, 0);

    // Calculate overdue tasks from assigned items
    const today = new Date();
    const overdueTasks = (assigned_to_me || []).filter((item) => {
      if (!item.date) return false;
      const dueDate = new Date(item.date);
      return (
        dueDate < today &&
        item.status !== "Approved" &&
        item.status !== "Filed" &&
        item.status !== "Completed"
      );
    });

    // Use role distribution from backend with task counts
    const roleDistribution = role_distribution || {
      admin: { count: 0, assigned_tasks: 0, users: [] },
      drafter: { count: 0, assigned_tasks: 0, users: [] },
      reviewer: { count: 0, assigned_tasks: 0, users: [] },
      messenger: { count: 0, assigned_tasks: 0, users: [] },
      archiver: { count: 0, assigned_tasks: 0, users: [] },
    };

    return {
      ...stats,
      timeRange,
      productivity: {
        completed: totalCompleted,
        pending: totalPending,
        overdue: overdueTasks.length,
        completionRate:
          totalCompleted > 0
            ? Math.round(
                (totalCompleted / (totalCompleted + totalPending)) * 100,
              )
            : 0,
      },
      roleDistribution,
      overdueTasks: overdueTasks.map((task) => ({
        id: task.id,
        title: task.title || task.subject,
        type: task.type,
        assignedTo: user_name,
        dueDate: task.date,
        daysOverdue: Math.floor(
          (today - new Date(task.date)) / (1000 * 60 * 60 * 24),
        ),
        priority: task.priority || "medium",
      })),
    };
  }, [stats, timeRange, recent, assigned_to_me, user_name, role_distribution]);

  // Chart.js configuration for Role Distribution with task counts
  const roleDistributionData = {
    labels: Object.keys(enhancedStats.roleDistribution || {}).map(
      (role) => role.charAt(0).toUpperCase() + role.slice(1),
    ),
    datasets: [
      {
        label: "Users",
        data: Object.values(enhancedStats.roleDistribution || {}).map(
          (role) => role.count || 0,
        ),
        backgroundColor: [
          "rgba(245, 158, 11, 0.8)", // Amber for Admin
          "rgba(59, 130, 246, 0.8)", // Blue for Drafter
          "rgba(16, 185, 129, 0.8)", // Green for Reviewer
          "rgba(156, 163, 175, 0.8)", // Gray for Messenger
          "rgba(139, 92, 246, 0.8)", // Purple for Archiver
        ],
        borderColor: [
          "rgba(245, 158, 11, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(156, 163, 175, 1)",
          "rgba(139, 92, 246, 1)",
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const roleDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#6b7280",
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1f2937",
        bodyColor: "#4b5563",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 6,
        callbacks: {
          label: function (context) {
            const roleKeys = Object.keys(enhancedStats.roleDistribution || {});
            const roleData =
              enhancedStats.roleDistribution[roleKeys[context.dataIndex]];
            const totalUsers = Object.values(
              enhancedStats.roleDistribution || {},
            ).reduce((sum, role) => sum + (role.count || 0), 0);
            const percentage =
              totalUsers > 0
                ? ((context.parsed / totalUsers) * 100).toFixed(1)
                : 0;
            return [
              `${context.label}: ${context.parsed} users (${percentage}%)`,
              `Assigned Tasks: ${roleData?.assigned_tasks || 0}`,
            ];
          },
        },
      },
    },
    animation: {
      duration: chartsLoaded ? 0 : 1000,
      easing: "easeOutQuart",
    },
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ✅ Check if user has at least one of the listed permissions
  const canViewDashboard =
    userPermissions.some((p) =>
      ["view dashboard", "manage users"].includes(p),
    ) ||
    userCapabilities.can_view_orders ||
    userCapabilities.can_view_letters ||
    userCapabilities.can_view_communications;

  if (!canViewDashboard) {
    return (
      <AuthenticatedLayout
        header={
          <h2 className="text-xl font-semibold leading-tight text-gray-800">
            Dashboard
          </h2>
        }>
        <Head title="Dashboard" />
        <div className="py-12">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
              <div className="p-6 text-gray-900">
                You do not have permission to view this page.
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const statusBadge = (status) => {
    const statusConfig = {
      "Not Started": "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
      Drafted: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      "For Review": "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
      Approved: "bg-green-50 text-green-700 ring-1 ring-green-200",
      Rejected: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      Printed: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
      Disseminated: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
      Signed: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
      Filed: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      Overdue: "bg-red-50 text-red-700 ring-1 ring-red-200",
    };
    const className =
      statusConfig[status] || "bg-gray-50 text-gray-600 ring-1 ring-gray-200";

    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}>
        {status}
      </span>
    );
  };

  const getRouteName = (type) => {
    const routeMap = {
      "Memo Order": "memo-order.show",
      "Special Order": "special-order.show",
      "Executive Order": "executive-order.show",
      "Request Letter": "requestletter.show",
      "Reply Letter": "replyletter.show",
      Miscellaneous: "miscellaneous.show",
      "Title Housing": "titlehousing.show",
    };
    return routeMap[type] || "#";
  };

  // 🔍 Helper: Check if user can view a specific item type
  const canViewItem = (type) => {
    switch (type) {
      case "Memo Order":
        return userCapabilities.can_view_memo_orders;
      case "Special Order":
        return userCapabilities.can_view_special_orders;
      case "Executive Order":
        return userCapabilities.can_view_executive_orders;
      case "Request Letter":
        return userCapabilities.can_view_request_letters;
      case "Reply Letter":
        return userCapabilities.can_view_reply_letters;
      case "Miscellaneous":
        return userCapabilities.can_view_miscellaneous;
      case "Title Housing":
        return userCapabilities.can_view_title_housing;
      default:
        return false;
    }
  };

  // 🔒 Filter assigned items the user is allowed to see
  const filteredAssignedToMe =
    assigned_to_me?.filter((item) => canViewItem(item.type)) || [];

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    href,
    trend,
    trendValue,
    onClick,
  }) => {
    const content = (
      <div
        className={`relative overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md ${
          href || onClick ? "cursor-pointer transform hover:-translate-y-1" : ""
        }`}
        onClick={onClick}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            )}
            {trend && (
              <div
                className={`flex items-center mt-2 text-xs ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                {trend === "up" ? "↗" : "↘"} {trendValue}% from last period
              </div>
            )}
          </div>
          <div
            className={`p-3 rounded-lg ${color} transition-transform duration-300 hover:scale-110`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );

    return href ? (
      <Link href={href} className="block">
        {content}
      </Link>
    ) : (
      content
    );
  };

  const MetricCard = ({
    title,
    children,
    action,
    adminOnly = false,
    className = "",
  }) => {
    if (adminOnly && !isAdmin) return null;

    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {adminOnly && <Crown className="w-4 h-4 text-yellow-500" />}
            {title}
          </h3>
          {action}
        </div>
        {children}
      </div>
    );
  };

  // Enhanced overview sections with expandable functionality
  const OverviewSection = ({
    title,
    icon: Icon,
    stats,
    type,
    capabilities,
  }) => {
    const isExpanded = expandedSections[type];
    const hasItems =
      stats &&
      Object.keys(stats)
        .filter((key) => key !== "total")
        .some((key) => stats[key] !== null);

    if (!hasItems) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon className="w-5 h-5" />
              {title}
              <span className="text-sm font-normal text-gray-500">
                ({stats.total || 0} total)
              </span>
            </h3>
            <button
              onClick={() => toggleSection(type)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
              <Eye className="w-4 h-4" />
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats).map(([key, data]) => {
              if (key === "total" || !data || typeof data !== "object")
                return null;

              const cardConfig = {
                memo_order: {
                  title: "Memo Orders",
                  icon: StickyNote,
                  color: "bg-indigo-500",
                  capability: "can_view_memo_orders",
                  route: "memo-order.index",
                },
                special_order: {
                  title: "Special Orders",
                  icon: Sparkles,
                  color: "bg-purple-500",
                  capability: "can_view_special_orders",
                  route: "special-order.index",
                },
                executive_order: {
                  title: "Executive Orders",
                  icon: CheckCircle2,
                  color: "bg-green-500",
                  capability: "can_view_executive_orders",
                  route: "executive-order.index",
                },
                request_letter: {
                  title: "Request Letters",
                  icon: Mail,
                  color: "bg-orange-500",
                  capability: "can_view_request_letters",
                  route: "requestletter.index",
                },
                reply_letter: {
                  title: "Reply Letters",
                  icon: MessageSquare,
                  color: "bg-pink-500",
                  capability: "can_view_reply_letters",
                  route: "replyletter.index",
                },
                miscellaneous: {
                  title: "Miscellaneous",
                  icon: FileText,
                  color: "bg-cyan-500",
                  capability: "can_view_miscellaneous",
                  route: "miscellaneous.index",
                },
                title_housing: {
                  title: "Title Housing",
                  icon: FolderOpen,
                  color: "bg-emerald-500",
                  capability: "can_view_title_housing",
                  route: "titlehousing.index",
                },
              };

              const config = cardConfig[key];
              if (!config || !capabilities[config.capability]) return null;

              return (
                <StatCard
                  key={key}
                  title={config.title}
                  value={data.total || 0}
                  subtitle={
                    data.for_review || data.assigned_to_me
                      ? `${data.for_review || 0} for review • ${
                          data.assigned_to_me || 0
                        } assigned to you`
                      : `${data.pending || 0} pending`
                  }
                  icon={config.icon}
                  color={config.color}
                  href={route(config.route)}
                />
              );
            })}
          </div>

          {/* Expanded view with additional metrics */}
          {isExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-200 animate-fadeIn">
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                Detailed Breakdown
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-gray-50 rounded-lg p-4 transition-all duration-300 hover:shadow-sm">
                  <div className="text-sm font-medium text-gray-600">
                    Total Items
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total || 0}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 transition-all duration-300 hover:shadow-sm">
                  <div className="text-sm font-medium text-blue-600">
                    For Review
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Object.values(stats).reduce(
                      (sum, item) =>
                        sum +
                        (item && typeof item === "object"
                          ? item.for_review || 0
                          : 0),
                      0,
                    )}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 transition-all duration-300 hover:shadow-sm">
                  <div className="text-sm font-medium text-green-600">
                    Assigned to You
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {Object.values(stats).reduce(
                      (sum, item) =>
                        sum +
                        (item && typeof item === "object"
                          ? item.assigned_to_me || 0
                          : 0),
                      0,
                    )}
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 transition-all duration-300 hover:shadow-sm">
                  <div className="text-sm font-medium text-amber-600">
                    Completion Rate
                  </div>
                  <div className="text-2xl font-bold text-amber-900">
                    {stats.total
                      ? Math.round(
                          (Object.values(stats).reduce(
                            (sum, item) =>
                              sum +
                              (item && typeof item === "object"
                                ? item.completed || 0
                                : 0),
                            0,
                          ) /
                            stats.total) *
                            100,
                        )
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout
        header={
          <h2 className="text-xl font-semibold leading-tight text-gray-800">
            Dashboard
          </h2>
        }>
        <Head title="Dashboard" />
        <div className="py-8 px-4">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Welcome Section Skeleton */}
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-lg shadow-lg p-6 text-white animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-8 bg-yellow-400 rounded w-64"></div>
                  <div className="h-4 bg-yellow-400 rounded w-96"></div>
                </div>
                <div className="h-8 bg-yellow-400 rounded w-32"></div>
              </div>
            </div>

            {/* Admin Metrics Skeleton */}
            {isAdmin && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Charts Skeleton */}
            {isAdmin && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <ChartSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Overview Sections Skeleton */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, j) => (
                      <StatCardSkeleton key={j} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Get role distribution data safely
  const roleDistribution = enhancedStats.roleDistribution || {};
  const totalUsers = Object.values(roleDistribution).reduce(
    (sum, role) => sum + (role.count || 0),
    0,
  );
  const totalTasks = Object.values(roleDistribution).reduce(
    (sum, role) => sum + (role.assigned_tasks || 0),
    0,
  );

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Dashboard
        </h2>
      }>
      <GroupChat />
      <Head title="Dashboard" />
      <div className="py-8 px-4">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white transform transition-all duration-500 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold animate-slideIn">
                  Welcome back, {user_name}! 👋
                </h1>
                <p className="mt-2 text-blue-100 animate-slideIn delay-100">
                  {isAdmin
                    ? "Here's your complete system overview with analytics."
                    : "Here's your personal workspace overview."}
                </p>
              </div>
              <div className="flex items-center gap-4 animate-slideIn delay-200">
                {role && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm font-medium bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      Role: {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                    {isAdmin && <Crown className="w-5 h-5 text-yellow-300" />}
                  </div>
                )}
                {isAdmin && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Calendar className="w-4 h-4" />
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="bg-transparent border-none text-white text-sm focus:ring-0">
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Only: Key Metrics Overview */}
          {isAdmin && (
            <MetricCard
              title="Advanced Analytics"
              adminOnly={true}
              className="animate-fadeIn delay-300">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Productivity Score"
                  value={`${enhancedStats.productivity.completionRate}%`}
                  subtitle="Completion rate"
                  icon={Activity}
                  color="bg-green-500"
                />
                <StatCard
                  title="Tasks Completed"
                  value={enhancedStats.productivity.completed}
                  subtitle={`${enhancedStats.productivity.pending} pending`}
                  icon={CheckCircle}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Overdue Items"
                  value={enhancedStats.productivity.overdue}
                  subtitle="Click to view details"
                  icon={AlertTriangle}
                  color="bg-amber-500"
                  onClick={() => setShowOverdueDetails(!showOverdueDetails)}
                />
                <StatCard
                  title="Active Projects"
                  value={filteredAssignedToMe.length}
                  subtitle="Assigned to you"
                  icon={Target}
                  color="bg-purple-500"
                  href="#assigned"
                />
              </div>
            </MetricCard>
          )}

          {/* Overdue Tasks Details */}
          {isAdmin &&
            showOverdueDetails &&
            enhancedStats.overdueTasks.length > 0 && (
              <MetricCard
                title="Overdue Tasks Details"
                adminOnly={true}
                className="animate-fadeIn">
                <div className="space-y-3">
                  {enhancedStats.overdueTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-red-700">
                            {task.type}
                          </span>
                          {statusBadge("Overdue")}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === "high"
                                ? "bg-red-200 text-red-800"
                                : "bg-orange-200 text-orange-800"
                            }`}>
                            {task.priority} priority
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                          <span>Assigned to: {task.assignedTo}</span>
                          <span>Due: {task.dueDate}</span>
                          <span className="text-red-600 font-semibold">
                            {task.daysOverdue} days overdue
                          </span>
                        </div>
                      </div>
                      <Link
                        href={route(getRouteName(task.type), task.id)}
                        className="ml-4 p-2 text-red-600 hover:text-red-800 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </MetricCard>
            )}

          {/* Admin Only: Role Distribution Chart */}
          {isAdmin && (
            <MetricCard
              title="User Roles & Tasks"
              adminOnly={true}
              action={
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <UserCog className="w-4 h-4" />
                  <span>System Overview</span>
                </div>
              }
              className="animate-fadeIn delay-400">
              {/* Chart Section */}
              <div className="h-64 mb-6">
                <Doughnut
                  data={roleDistributionData}
                  options={roleDistributionOptions}
                />
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(roleDistribution).map(([role, data]) => (
                  <RoleCard key={role} role={role} data={data} />
                ))}
              </div>

              {/* Summary Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Total Users: {totalUsers}
                  </span>
                  <span className="text-blue-600 font-semibold">
                    Total Tasks: {totalTasks}
                  </span>
                </div>
              </div>
            </MetricCard>
          )}

          {/* Clean Overview Sections */}
          <div className="space-y-6 animate-fadeIn delay-500">
            {/* Orders Overview */}
            {userCapabilities.can_view_orders && stats?.orders && (
              <OverviewSection
                title="Orders Overview"
                icon={ClipboardList}
                stats={stats.orders}
                type="orders"
                capabilities={userCapabilities}
              />
            )}

            {/* Letters Overview */}
            {userCapabilities.can_view_letters && stats?.letters && (
              <OverviewSection
                title="Letters Overview"
                icon={Mail}
                stats={stats.letters}
                type="letters"
                capabilities={userCapabilities}
              />
            )}

            {/* Communications Overview */}
            {userCapabilities.can_view_communications &&
              stats?.communications && (
                <OverviewSection
                  title="Communications Overview"
                  icon={FolderOpen}
                  stats={stats.communications}
                  type="communications"
                  capabilities={userCapabilities}
                />
              )}
          </div>

          {/* Side by side: Assigned to Me and Recent Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fadeIn delay-600">
            {/* Assigned to Me */}
            {filteredAssignedToMe.length > 0 && (
              <div
                id="assigned"
                className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    Assigned to Me
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                      {filteredAssignedToMe.length}
                    </span>
                  </h3>
                  {isAdmin && (
                    <Link
                      href="#"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors duration-200">
                      <Download className="w-4 h-4" />
                      Export
                    </Link>
                  )}
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredAssignedToMe.map((item, index) => (
                    <Link
                      key={index}
                      href={route(getRouteName(item.type), item.id)}
                      className="block px-6 py-4 hover:bg-gray-50 transition-all duration-200 transform hover:translate-x-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-blue-600">
                              {item.type}
                            </span>
                            {statusBadge(item.status)}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          {item.subject && (
                            <p className="mt-1 text-sm text-gray-500 truncate">
                              {item.subject}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>{item.date}</span>
                            {item.deadline && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {item.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  Recent Activity
                </h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {recent?.memo_orders?.length > 0 ||
                recent?.special_orders?.length > 0 ||
                recent?.executive_orders?.length > 0 ||
                recent?.request_letters?.length > 0 ||
                recent?.reply_letters?.length > 0 ||
                recent?.miscellaneous?.length > 0 ||
                recent?.title_housing?.length > 0 ? (
                  <>
                    {userCapabilities.can_view_memo_orders &&
                      recent?.memo_orders?.slice(0, 5).map((item) => (
                        <Link
                          key={item.id}
                          href={route("memo-order.show", item.id)}
                          className="block px-6 py-4 hover:bg-gray-50 transition-all duration-200 transform hover:translate-x-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <StickyNote className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  Memo Order
                                </span>
                                {statusBadge(item.status)}
                              </div>
                              <p className="text-sm text-gray-900 truncate">
                                {item.title}
                              </p>
                              {item.subject && (
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {item.subject}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 ml-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        </Link>
                      ))}
                    {userCapabilities.can_view_request_letters &&
                      recent?.request_letters?.slice(0, 3).map((item) => (
                        <Link
                          key={item.id}
                          href={route("requestletter.show", item.id)}
                          className="block px-6 py-4 hover:bg-gray-50 transition-all duration-200 transform hover:translate-x-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <Mail className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  Request Letter
                                </span>
                                {statusBadge(item.status)}
                              </div>
                              <p className="text-sm text-gray-900 truncate">
                                {item.title}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 ml-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        </Link>
                      ))}
                    {userCapabilities.can_view_special_orders &&
                      recent?.special_orders?.slice(0, 2).map((item) => (
                        <Link
                          key={item.id}
                          href={route("special-order.show", item.id)}
                          className="block px-6 py-4 hover:bg-gray-50 transition-all duration-200 transform hover:translate-x-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  Special Order
                                </span>
                                {statusBadge(item.status)}
                              </div>
                              <p className="text-sm text-gray-900 truncate">
                                {item.title}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 ml-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        </Link>
                      ))}
                  </>
                ) : (
                  <div className="px-6 py-8 text-center text-sm text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {(userCapabilities.can_create_memo_order ||
            userCapabilities.can_create_special_order ||
            userCapabilities.can_create_executive_order ||
            userCapabilities.can_create_request_letter ||
            userCapabilities.can_create_reply_letter ||
            userCapabilities.can_create_miscellaneous ||
            userCapabilities.can_create_title_housing) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md animate-fadeIn delay-700">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                {userCapabilities.can_create_memo_order && (
                  <Link
                    href={route("memo-order.create")}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-sm">
                    <StickyNote className="w-6 h-6 mb-2 text-indigo-600 transition-transform duration-300 hover:scale-110" />
                    New Memo
                  </Link>
                )}
                {userCapabilities.can_create_special_order && (
                  <Link
                    href={route("special-order.create")}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-sm">
                    <Sparkles className="w-6 h-6 mb-2 text-purple-600 transition-transform duration-300 hover:scale-110" />
                    New Special Order
                  </Link>
                )}
                {userCapabilities.can_create_executive_order && (
                  <Link
                    href={route("executive-order.create")}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-sm">
                    <CheckCircle2 className="w-6 h-6 mb-2 text-green-600 transition-transform duration-300 hover:scale-110" />
                    New Executive Order
                  </Link>
                )}
                {userCapabilities.can_create_request_letter && (
                  <Link
                    href={route("requestletter.create")}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-sm">
                    <Mail className="w-6 h-6 mb-2 text-orange-600 transition-transform duration-300 hover:scale-110" />
                    New Request
                  </Link>
                )}
                {userCapabilities.can_create_reply_letter && (
                  <Link
                    href={route("replyletter.create")}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-sm">
                    <MessageSquare className="w-6 h-6 mb-2 text-pink-600 transition-transform duration-300 hover:scale-110" />
                    New Reply
                  </Link>
                )}
                {userCapabilities.can_create_miscellaneous && (
                  <Link
                    href={route("miscellaneous.create")}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-sm">
                    <FileText className="w-6 h-6 mb-2 text-cyan-600 transition-transform duration-300 hover:scale-110" />
                    New Miscellaneous
                  </Link>
                )}
                {userCapabilities.can_create_title_housing && (
                  <Link
                    href={route("titlehousing.create")}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-sm">
                    <FolderOpen className="w-6 h-6 mb-2 text-emerald-600 transition-transform duration-300 hover:scale-110" />
                    New Title Housing
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
