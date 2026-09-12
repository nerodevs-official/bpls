// resources/js/Pages/Orders/ExecutiveOrder/Show.jsx
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Calendar,
    Paperclip,
    Download,
    FileText,
    Pencil,
    X,
    Eye,
    Briefcase,
    Building2,
    CheckCircle2,
    User,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// Define the status progression
const STATUS_STEPS = [
    "Not Started",
    "Drafted",
    "For Review",
    "Approved",
    "Printed",
    "Disseminated",
    "Signed",
    "Filed",
    "Archived",
];

// Rejection is a terminal state, usually handled separately or invalidating the flow
// For linear visualization, we might just check if it's rejected.

export default function Show({ eo }) {
    const { role } = usePage().props;

    // preview modal
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewFilename, setPreviewFilename] = useState("");

    const isPdf = (url) =>
        typeof url === "string" && url.toLowerCase().endsWith(".pdf");

    const isImage = (url) =>
        typeof url === "string" && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(url);

    const openFilePreview = (url) => {
        if (!url) return;
        setPreviewUrl(url);
        // Extract filename from URL or default
        let filename = "document";
        try {
           const urlObj = new URL(url);
           filename = urlObj.pathname.split("/").pop();
        } catch (e) {
           // fallback if partial path
           filename = String(url).split("/").pop();
        }
        setPreviewFilename(filename);
    };

    const closePreview = () => {
        setPreviewUrl(null);
        setPreviewFilename("");
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") closePreview();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Derived State
    const currentStepIndex = STATUS_STEPS.indexOf(eo.status);
    const isRejected = eo.status === "Rejected";
    
    // Permission checks
    const canEdit = role === "admin" || role === "super-admin"; // Adjust based on specific role names from backend
    const isArchivist = role === "archivist";

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col items-start w-full gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">
                                Executive Order
                            </h2>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {eo.eo_no || "No EO#"}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            View details and current status
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("executive-order.index")}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                        {canEdit && (
                            <Link
                                href={route("executive-order.edit", eo.id)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`EO ${eo.eo_no} - ${eo.title}`} />

            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={closePreview}>
                    <div
                        className="relative w-full max-w-5xl overflow-hidden bg-white shadow-2xl rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                            <div>
                                <h3 className="font-semibold text-gray-900 line-clamp-1">{previewFilename}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-200 hover:text-gray-700"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                                <button
                                    onClick={closePreview}
                                    className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-red-100 hover:text-red-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="h-[80vh] bg-gray-100">
                             {isPdf(previewUrl) ? (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full"
                                    title="Preview" 
                                />
                            ) : isImage(previewUrl) ? (
                                <div className="flex items-center justify-center w-full h-full p-4">
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        className="object-contain max-w-full max-h-full rounded shadow-sm"
                                    />
                                </div>
                            ) : (
                                <iframe
                                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                                        previewUrl
                                    )}`}
                                    title="DOC Preview"
                                    className="w-full h-full bg-white border-0"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="py-8 bg-gray-50/50">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
                        
                        {/* LEFT COLUMN: Main Info */}
                        <div className="space-y-6 lg:col-span-2 lg:sticky lg:top-24">
                            
                            {/* Title Card */}
                            <div className="overflow-hidden bg-white shadow-sm rounded-xl border border-gray-100">
                                <div className="p-6 sm:p-8">
                                    <div className="mb-6">
                                        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                                            {eo.title}
                                        </h1>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-gray-100">
                                        <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>Issued: {eo.date_issued || "N/A"}</span>
                                        </div>
                                         <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span>{eo.originating_department || "Unknown Dept"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            {eo.remarks && (
                                <div className="bg-white shadow-sm rounded-xl border border-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h3 className="text-base font-semibold text-gray-900">Remarks</h3>
                                    </div>
                                    <div className="p-6 text-gray-600 whitespace-pre-wrap">
                                        {eo.remarks}
                                    </div>
                                </div>
                            )}

                             {/* Assigned To */}
                             <div className="bg-white shadow-sm rounded-xl border border-gray-100">
                                <div className="flex items-center gap-4 p-6">
                                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-full">
                                        <User className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Current Assignee</p>
                                        <p className="text-base font-semibold text-gray-900">
                                            {eo.assigned_to || "Unassigned"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Sidebar (File & Status) */}
                        <div className="space-y-6">
                            
                            {/* File Card */}
                            <div className="bg-white shadow-sm rounded-xl border border-gray-100">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-base font-semibold text-gray-900">Attachment</h3>
                                </div>
                                <div className="p-6">
                                    {eo.file_path ? (
                                        <div className="group">
                                            <div className="flex items-center gap-4 p-4 mb-4 transition-colors border border-gray-200 rounded-lg bg-gray-50 group-hover:border-blue-200 group-hover:bg-blue-50/30">
                                                <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                    <Paperclip className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        View Document
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Click view to preview
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                 <button
                                                    onClick={() => openFilePreview(eo.file_path)}
                                                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                                <a
                                                    href={eo.file_path}
                                                    download 
                                                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all bg-gray-900 border border-transparent rounded-lg shadow-sm hover:bg-gray-800 focus:ring-2 focus:ring-offset-1 focus:ring-gray-900"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Get
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                            <FileText className="w-8 h-8 mb-2 text-gray-300" />
                                            <p className="text-sm text-gray-500">No file attached</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="bg-white shadow-sm rounded-xl border border-gray-100">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-base font-semibold text-gray-900">Status History</h3>
                                </div>
                                <div className="p-6">
                                    {isRejected ? (
                                        <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700">
                                            <div className="flex items-center gap-2 mb-1">
                                                <X className="w-5 h-5" />
                                                <span className="font-bold">Rejected</span>
                                            </div>
                                            <p className="text-sm">This Executive Order has been rejected.</p>
                                        </div>
                                    ) : (
                                        <div className="relative pl-2 space-y-0">
                                             {/* Vertical Line */}
                                             <div 
                                                className="absolute left-[27px] top-2 bottom-4 w-0.5 bg-gray-200" 
                                                aria-hidden="true"
                                            />
                                            
                                            {STATUS_STEPS.map((step, index) => {
                                                const isCompleted = index <= currentStepIndex;
                                                const isCurrent = index === currentStepIndex;
                                                
                                                return (
                                                    <div key={step} className="relative flex items-start pb-6 last:pb-0 group">
                                                         
                                                        <span className={`
                                                            relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 transition-colors
                                                            ${isCompleted 
                                                                ? "bg-white border-blue-500" 
                                                                : "bg-white border-gray-200"
                                                            }
                                                        `}>
                                                            <span className={`
                                                                w-2.5 h-2.5 rounded-full
                                                                ${isCompleted ? "bg-blue-600" : "bg-gray-300"}
                                                            `} />
                                                        </span>
                                                        
                                                        <div className="ml-4 pt-2">
                                                            <p className={`text-sm font-medium ${isCurrent ? "text-blue-700 font-bold" : isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                                                                {step}
                                                            </p>
                                                            {isCurrent && (
                                                                <p className="text-xs text-blue-500 animate-pulse">Current Status</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
