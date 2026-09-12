import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage, router } from "@inertiajs/react";
import {
    Plus,
    Download,
    Search,
    Calendar,
    FileText,
    Layers3,
    Building2,
    Paperclip,
    X,
    File,
    MoreVertical,
    Eye,
    Pencil,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";

const STATUS_OPTIONS = [
    "Not Started",
    "Drafted",
    "For Review",
    "Approved",
    "Rejected",
    "Printed",
    "Disseminated",
    "Signed",
    "Filed",
    "Archived",
];

// Map frontend field names to backend database columns
const SORT_FIELD_MAP = {
    'ORIGINATING DEPARTMENT': 'originating_department',
    'SO NO.': 'so_no',
    'SUBJECT': 'subject',
    'DATE ISSUED': 'date_issued',
    'STATUS': 'status',
    'ASSIGNED TO': 'assigned_to',
    'LINK/PDF FILE': 'file_path'
};

export default function Index() {
    const { so, filters, departments, role } = usePage().props;
    const headers = so?.headers ?? [];
    const tasks = so?.tasks ?? [];
    const pagination = so?.pagination ?? {};

    const { auth } = usePage().props;
    const permissions = auth?.user?.permissions || [];
    const allowedStatuses = [];
    if (permissions.includes("view Not Started status"))
        allowedStatuses.push("Not Started");
    if (permissions.includes("view Drafted status"))
        allowedStatuses.push("Drafted");
    if (permissions.includes("view For Review status"))
        allowedStatuses.push("For Review");
    if (permissions.includes("view Approved status"))
        allowedStatuses.push("Approved");
    if (permissions.includes("view Rejected status"))
        allowedStatuses.push("Rejected");
    if (permissions.includes("view Printed status"))
        allowedStatuses.push("Printed");
    if (permissions.includes("view Disseminated status"))
        allowedStatuses.push("Disseminated");
    if (permissions.includes("view Signed status"))
        allowedStatuses.push("Signed");
    if (permissions.includes("view Filed status"))
        allowedStatuses.push("Filed");
    if (permissions.includes("view Archived status"))
        allowedStatuses.push("Archived");

    const headerIdByName = (name) => headers.find((h) => h.name === name)?.id;
    const H = {
        dept: headerIdByName("ORIGINATING DEPARTMENT"),
        subject: headerIdByName("SUBJECT"),
        dateIssued: headerIdByName("DATE ISSUED"),
        status: headerIdByName("STATUS"),
        file: headerIdByName("LINK/PDF FILE"),
        assignedto: headerIdByName("ASSIGNED TO"),
    };

    const getVal = (task, headerId) =>
        task?.values?.find((v) => v.so_header_id === headerId)?.value ?? "";

    // === FILTER & SORT HANDLING ===
    const [search, setSearch] = useState(filters?.search || "");
    const [department, setDepartment] = useState(filters?.department || "");
    const [status, setStatus] = useState(filters?.status || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 15);
    const [sortField, setSortField] = useState(filters?.sort_field || "");
    const [sortDirection, setSortDirection] = useState(filters?.sort_direction || "asc");

    useEffect(() => {
        const debounce = setTimeout(() => {
            router.get(
                route("special-order.index"),
                {
                    search: search || undefined,
                    department: department || undefined,
                    status: status || undefined,
                    per_page: perPage || undefined,
                    sort_field: sortField || undefined,
                    sort_direction: sortDirection || undefined,
                },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(debounce);
    }, [search, department, status, perPage, sortField, sortDirection]);

    const handleSort = (fieldName) => {
        const backendField = SORT_FIELD_MAP[fieldName];
        if (!backendField) return;

        if (sortField === backendField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(backendField);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (fieldName) => {
        const backendField = SORT_FIELD_MAP[fieldName];
        if (sortField !== backendField) {
            return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
        }
        return sortDirection === "asc" ? 
            <ChevronUp className="w-3 h-3 ml-1" /> : 
            <ChevronDown className="w-3 h-3 ml-1" />;
    };

    const stats = useMemo(() => {
        const total = pagination.total || tasks.length;
        const statusCounts = {};
        const deptSet = new Set();
        let withFiles = 0;

        tasks.forEach((t) => {
            const s = getVal(t, H.status) || "—";
            statusCounts[s] = (statusCounts[s] || 0) + 1;

            const d = getVal(t, H.dept);
            if (d) deptSet.add(d);

            const f = getVal(t, H.file);
            if (f && String(f).trim() !== "") withFiles += 1;
        });

        const orderedStatuses = ["—", ...STATUS_OPTIONS].concat(
            Object.keys(statusCounts).filter(
                (k) => !["—", ...STATUS_OPTIONS].includes(k)
            )
        );

        return {
            total,
            statusCounts,
            orderedStatuses,
            departments: deptSet.size,
            withFiles,
        };
    }, [tasks, H.status, H.dept, H.file, pagination.total]);

    const headerMeta = useMemo(() => {
        let keep = [
            "SUBJECT",
            "ORIGINATING DEPARTMENT",
            "DATE ISSUED",
            "STATUS",
            "LINK/PDF FILE",
            "ASSIGNED TO",
        ];

        if (role === "Messenger") {
            keep = ["SUBJECT", "STATUS", "LINK/PDF FILE"];
        }

        return headers
            .filter((h) => keep.includes(h.name))
            .map((h) => {
                if (h.name === "LINK/PDF FILE") {
                    return { ...h, width: "min-w-[8rem]" };
                }
                return {
                    ...h,
                    width:
                        h.name === "SUBJECT"
                            ? "min-w-[20rem]"
                            : h.name === "ORIGINATING DEPARTMENT"
                            ? "min-w-[12rem]"
                            : h.name === "DATE ISSUED"
                            ? "min-w-[10rem]"
                            : h.name === "ASSIGNED TO"
                            ? "min-w-[8rem]"
                            : h.name === "STATUS"
                            ? "min-w-[6rem]"
                            : "min-w-[6rem]",
                };
            });
    }, [headers, role]);

    const statusBadge = (status) => {
        const c =
            {
                "Not Started": "bg-gray-100 text-gray-700",
                Drafted: "bg-slate-100 text-slate-700",
                "For Review": "bg-blue-50 text-blue-700",
                Approved: "bg-green-50 text-green-700",
                Rejected: "bg-red-50 text-red-700",
                Printed: "bg-yellow-50 text-yellow-700",
                Disseminated: "bg-teal-50 text-teal-700",
                Signed: "bg-indigo-50 text-indigo-700",
                Filed: "bg-amber-50 text-amber-700",
                Archived: "bg-purple-50 text-purple-700",
                "—": "bg-gray-50 text-gray-500",
            }[status] || "bg-gray-50 text-gray-600";

        return (
            <span
                className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${c}`}
            >
                {status}
            </span>
        );
    };

    // === Modal State ===
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewFilename, setPreviewFilename] = useState("");

    // === Helpers ===
    const openFilePreview = (url) => {
        if (!url) return;
        const encodedUrl = encodeURI(url);
        setPreviewUrl(encodedUrl);
        const filename = url.split("/").pop()?.split("?")[0] || "document";
        setPreviewFilename(filename);
    };

    const closePreview = () => {
        setPreviewUrl(null);
        setPreviewFilename("");
    };

    const getFileExtension = (url) => {
        if (!url) return "";
        const cleanUrl = url.split("?")[0].split("#")[0];
        return cleanUrl.split(".").pop().toLowerCase();
    };

    const isPdf = (url) => getFileExtension(url) === "pdf";
    const isImage = (url) =>
        ["png", "jpg", "jpeg"].includes(getFileExtension(url));
    const isDoc = (url) => ["doc", "docx"].includes(getFileExtension(url));

    // === Dropdown State ===
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRefs = useRef({});

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!openDropdownId) return;
            const el = dropdownRefs.current[openDropdownId];
            if (el && !el.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdownId]);

    const makeHref = (name, params) => {
        try {
            return route(name, params);
        } catch (err) {
            if (name === "special-order.show")
                return `/special-order/${params?.[0] ?? params}`;
            if (name === "special-order.edit")
                return `/special-order/${params?.[0] ?? params}/edit`;
            return "#";
        }
    };

    const clearFilters = () => {
        setSearch("");
        setDepartment("");
        setStatus("");
        setSortField("");
        setSortDirection("asc");
    };

    // Pagination helpers
    const goToPage = (page) => {
        router.get(
            route("special-order.index"),
            {
                page,
                search: search || undefined,
                department: department || undefined,
                status: status || undefined,
                per_page: perPage || undefined,
                sort_field: sortField || undefined,
                sort_direction: sortDirection || undefined,
            },
            {
                preserveState: true,
                replace: false,
            }
        );
    };

    const changePerPage = (e) => {
        const newPerPage = parseInt(e.target.value);
        setPerPage(newPerPage);
    };

    return (
        <AuthenticatedLayout
        >
            <Head title={so?.name || "Special Order"} />

            {/* === File Preview Modal === */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-75 sm:p-4">
                    <div className="relative max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-3 py-1 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-800 truncate">
                                {previewFilename}
                            </h3>
                            <button
                                onClick={closePreview}
                                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="w-full h-[90vh] bg-gray-100 overflow-hidden flex items-center justify-center">
                            {isPdf(previewUrl) ? (
                                <iframe
                                    src={previewUrl}
                                    title="PDF Preview"
                                    className="w-full h-full bg-white border-0"
                                    onError={(e) => {
                                        console.error(
                                            "Failed to load PDF:",
                                            previewUrl
                                        );
                                        e.target.style.display = "none";
                                    }}
                                />
                            ) : isImage(previewUrl) ? (
                                <img
                                    src={previewUrl}
                                    alt={previewFilename}
                                    className="max-h-[90vh] max-w-full object-contain bg-white"
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                    }}
                                />
                            ) : isDoc(previewUrl) ? (
                                <iframe
                                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                                        previewUrl
                                    )}`}
                                    title="DOC Preview"
                                    className="w-full h-full bg-white border-0"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center">
                                    <File className="w-12 h-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-600">
                                        This file type cannot be previewed.
                                    </p>
                                    <a
                                        href={previewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="p-3 space-y-3">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl uppercase font-bold text-gray-900">
                            Special Orders
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage and track all special orders in one place.
                        </p>
                    </div>
                    <Link
                        href={route("special-order.create")}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Special Order
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Layers3 className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Departments</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.departments}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">With Files</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.withFiles}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
                            <div className="flex-1">

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        id="search"
                                        placeholder="Search special orders..."
                                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="sm:w-48">

                                <select
                                    id="status"
                                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:w-32">

                                <select
                                    id="perPage"
                                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                    value={perPage}
                                    onChange={changePerPage}
                                >
                                    <option value="10">10</option>
                                    <option value="15">15</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                        </div>

                        {(search || department || status || sortField) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {headerMeta.map((h) => (
                                        <th
                                            key={h.id}
                                            className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${h.width}`}
                                        >
                                            <button
                                                onClick={() => handleSort(h.name)}
                                                className="flex items-center gap-1 hover:text-yellow-500"
                                            >
                                                {h.name}
                                                {getSortIcon(h.name)}
                                            </button>
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(() => {
                                    const visibleTasks =
                                        allowedStatuses.length > 0
                                            ? tasks.filter((task) => {
                                                  const taskStatus = getVal(
                                                      task,
                                                      H.status
                                                  );
                                                  return allowedStatuses.includes(
                                                      taskStatus
                                                  );
                                              })
                                            : tasks;

                                    return visibleTasks.length > 0 ? (
                                        visibleTasks.map((task) => {
                                            const fileUrl = getVal(
                                                task,
                                                H.file
                                            );
                                            const showHref = makeHref(
                                                "special-order.show",
                                                [task.id]
                                            );
                                            const editHref = makeHref(
                                                "special-order.edit",
                                                [task.id]
                                            );

                                            return (
                                                <tr
                                                    key={task.id}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={(e) => {
                                                        const target = e.target;
                                                        const isInteractive =
                                                            target.closest("button") ||
                                                            target.closest("a") ||
                                                            target.closest(".file-preview-btn") ||
                                                            (openDropdownId === task.id &&
                                                                target.closest(".dropdown-menu"));

                                                        if (isInteractive) return;

                                                        router.visit(showHref);
                                                        setOpenDropdownId(null);
                                                    }}
                                                >
                                                    {headerMeta.map((h) => {
                                                        const val = getVal(task, h.id);

                                                        if (h.name === "SUBJECT") {
                                                            return (
                                                                <td key={h.id} className="px-3 py-1">
                                                                    <div className="text-sm text-gray-900 line-clamp-2">
                                                                        {val || "—"}
                                                                    </div>
                                                                </td>
                                                            );
                                                        }

                                                        if (h.name === "DATE ISSUED") {
                                                            const formatDate = (dateStr) => {
                                                                if (!dateStr) return "—";
                                                                const d = new Date(dateStr);
                                                                if (isNaN(d.getTime())) return "—";
                                                                return d.toLocaleDateString("en-US", {
                                                                    year: "numeric",
                                                                    month: "short",
                                                                    day: "numeric",
                                                                });
                                                            };
                                                            return (
                                                                <td key={h.id} className="px-3 py-1">
                                                                    {val ? (
                                                                        <div className="flex items-center gap-2 text-sm text-gray-900">
                                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                                            {formatDate(val)}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-sm text-gray-400">—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        }

                                                        if (h.name === "STATUS") {
                                                            const currentStatus = val || "—";
                                                            
                                                            // ✅ Messenger role logic
                                                            if (role === "Messenger") {
                                                                const isFiled = currentStatus === "Filed";
                                                                return (
                                                                    <td key={h.id} className="px-3 py-1">
                                                                        <button
                                                                            disabled={isFiled}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (!isFiled) {
                                                                                    router.put(
                                                                                        route("special-order.update-status", {
                                                                                            id: task.id,
                                                                                        }),
                                                                                        {
                                                                                            status: "Filed",
                                                                                        },
                                                                                        {
                                                                                            preserveState: true,
                                                                                        }
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className={`w-full rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                                                                                isFiled
                                                                                    ? "bg-green-100 text-green-800 cursor-default"
                                                                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                                            }`}
                                                                        >
                                                                            {isFiled ? "Filed" : "Mark as Filed"}
                                                                        </button>
                                                                    </td>
                                                                );
                                                            }

                                                            // ✅ Editable dropdown for roles that can change status
                                                            const allowedStatusesForRole = (() => {
                                                                switch (role) {
                                                                    case "Drafter":
                                                                        return ["Drafted", "For Review"];
                                                                    case "Reviewer":
                                                                        return ["Approved", "Rejected"];
                                                                    case "Messenger":
                                                                        return ["Printed", "Disseminated", "Signed", "Filed"];
                                                                    case "Archive Person":
                                                                        return ["Archived"];
                                                                    case "Admin":
                                                                        return STATUS_OPTIONS;
                                                                    default:
                                                                        return [];
                                                                }
                                                            })();

                                                            // If user can edit status, show dropdown
                                                            if (allowedStatusesForRole.length > 0) {
                                                                const bgColor =
                                                                    {
                                                                        "Not Started": "bg-gray-100",
                                                                        Drafted: "bg-slate-100",
                                                                        "For Review": "bg-blue-100",
                                                                        Approved: "bg-green-100",
                                                                        Rejected: "bg-rose-200",
                                                                        Printed: "bg-yellow-100",
                                                                        Disseminated: "bg-teal-100",
                                                                        Signed: "bg-indigo-100",
                                                                        Filed: "bg-green-300",
                                                                        Archived: "bg-red-300",
                                                                        "—": "bg-gray-100",
                                                                    }[currentStatus] || "bg-gray-100";

                                                                return (
                                                                    <td key={h.id} className="px-3 py-1">
                                                                        <select
                                                                            value={val || ""}
                                                                            onChange={(e) => {
                                                                                e.stopPropagation();
                                                                                const newStatus = e.target.value;
                                                                                if (allowedStatusesForRole.includes(newStatus)) {
                                                                                    router.put(
                                                                                        route("special-order.update-status", {
                                                                                            id: task.id,
                                                                                        }),
                                                                                        {
                                                                                            status: newStatus,
                                                                                        },
                                                                                        {
                                                                                            preserveState: true,
                                                                                        }
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className={`block w-auto rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 ${bgColor}`}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <option value="">—</option>
                                                                            {STATUS_OPTIONS.map((opt) => (
                                                                                <option
                                                                                    key={opt}
                                                                                    value={opt}
                                                                                    disabled={!allowedStatusesForRole.includes(opt)}
                                                                                    className={
                                                                                        allowedStatusesForRole.includes(opt)
                                                                                            ? "text-gray-900"
                                                                                            : "text-gray-400"
                                                                                    }
                                                                                >
                                                                                    {opt}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </td>
                                                                );
                                                            }

                                                            // ✅ For roles that cannot edit, show status badge
                                                            return (
                                                                <td key={h.id} className="px-3 py-1">
                                                                    {statusBadge(currentStatus)}
                                                                </td>
                                                            );
                                                        }

                                                        if (h.name === "LINK/PDF FILE") {
                                                            return (
                                                                <td key={h.id} className="px-3 py-1">
                                                                    {fileUrl && fileUrl.trim() !== "" ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openFilePreview(fileUrl)}
                                                                            className="file-preview-btn inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            <Paperclip className="h-4 w-4" />
                                                                            View
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-sm text-gray-400">—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        }

                                                        return (
                                                            <td key={h.id} className="px-3 py-1">
                                                                <span className="text-sm text-gray-900">
                                                                    {val || "—"}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}

                                                    <td className="px-3 py-1 text-right">
                                                        <div className="flex justify-end">
                                                            <div
                                                                ref={(el) => (dropdownRefs.current[task.id] = el)}
                                                                className="relative"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenDropdownId(
                                                                            openDropdownId === task.id ? null : task.id
                                                                        );
                                                                    }}
                                                                    className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </button>

                                                                {openDropdownId === task.id && (
                                                                    <div
                                                                        className="absolute right-0 z-10 w-32 mt-1 bg-white rounded-md shadow-lg border border-gray-200 dropdown-menu"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <div className="py-1">
                                                                            <Link
                                                                                href={showHref}
                                                                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                                onClick={() => setOpenDropdownId(null)}
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                                View
                                                                            </Link>
                                                                            {(() => {
                                                                                const canEdit = role === "Admin";
                                                                                if (role === "Archivist") return null;

                                                                                return canEdit ? (
                                                                                    <Link
                                                                                        href={editHref}
                                                                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                                        onClick={() => setOpenDropdownId(null)}
                                                                                    >
                                                                                        <Pencil className="h-4 w-4" />
                                                                                        Edit
                                                                                    </Link>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
                                                                                        <Pencil className="h-4 w-4" />
                                                                                        Edit
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={headerMeta.length + 1} className="px-4 py-8 text-center">
                                                <div className="text-sm text-gray-500">
                                                    No special orders found based on your permissions or filters.
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 border-t border-gray-200 sm:flex-row">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{pagination.from}</span> to{" "}
                                <span className="font-medium">{pagination.to}</span> of{" "}
                                <span className="font-medium">{pagination.total}</span> results
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToPage(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className={`inline-flex items-center justify-center rounded-md p-2 ${
                                        pagination.current_page === 1
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-gray-700 hover:bg-gray-100 transition-colors"
                                    }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {(() => {
                                    const pages = [];
                                    const totalPages = pagination.last_page;
                                    const currentPage = pagination.current_page;

                                    pages.push(1);

                                    if (currentPage > 3) pages.push("ellipsis1");

                                    for (
                                        let i = Math.max(2, currentPage - 1);
                                        i <= Math.min(totalPages - 1, currentPage + 1);
                                        i++
                                    ) {
                                        pages.push(i);
                                    }

                                    if (currentPage < totalPages - 2) pages.push("ellipsis2");

                                    if (totalPages > 1) pages.push(totalPages);

                                    return pages.map((page, idx) => {
                                        if (page === "ellipsis1" || page === "ellipsis2") {
                                            return (
                                                <span key={idx} className="px-2 py-1 text-gray-500">
                                                    ...
                                                </span>
                                            );
                                        }
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => goToPage(page)}
                                                className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md text-sm transition-colors ${
                                                    currentPage === page
                                                        ? "bg-gray-900 text-white"
                                                        : "text-gray-700 hover:bg-gray-100"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    });
                                })()}

                                <button
                                    onClick={() => goToPage(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className={`inline-flex items-center justify-center rounded-md p-2 ${
                                        pagination.current_page === pagination.last_page
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-gray-700 hover:bg-gray-100 transition-colors"
                                    }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}