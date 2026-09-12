import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { X, File, Download, RotateCcw } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Index({
    executive_orders,
    memo,
    special_order,
    request_letter,
    reply_letter,
    miscellaneous,
    titlehousing,
}) {
    // === Tabs ===
    const tabs = [
        {
            id: "executive_orders",
            label: "Executive Orders",
            data: executive_orders,
        },
        { id: "memo", label: "Memos", data: memo },
        { id: "special_order", label: "Special Orders", data: special_order },
        {
            id: "request_letter",
            label: "Request Letters",
            data: request_letter,
        },
        { id: "reply_letter", label: "Reply Letters", data: reply_letter },
        { id: "miscellaneous", label: "Miscellaneous", data: miscellaneous },
        { id: "titlehousing", label: "Title Housing", data: titlehousing },
    ];

    const [activeTab, setActiveTab] = useState("executive_orders");
    const [activeData, setActiveData] = useState(
        tabs.find((t) => t.id === activeTab)?.data || [],
    );

    const [loadingId, setLoadingId] = useState(null); // track which item is updating
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewFilename, setPreviewFilename] = useState("");

    // === Handlers ===
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setActiveData(tabs.find((t) => t.id === tabId)?.data || []);
    };

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

    // === File Helpers ===
    const getFileExtension = (url) => {
        if (!url) return "";
        const cleanUrl = url.split("?")[0].split("#")[0];
        return cleanUrl.split(".").pop().toLowerCase();
    };

    const isPdf = (url) => getFileExtension(url) === "pdf";
    const isImage = (url) =>
        ["png", "jpg", "jpeg"].includes(getFileExtension(url));
    const isDoc = (url) => ["doc", "docx"].includes(getFileExtension(url));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Archived Documents
                </h2>
            }
        >
            <Head title="Archived Documents" />

            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Archived Documents
                </h1>

                {/* === Tabs Navigation === */}
                <div className="flex flex-wrap gap-3 pb-3 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                                    : "text-gray-500 hover:text-blue-600"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* === Data Table === */}
                <div className="px-3 pb-2 -mx-3 overflow-x-auto sm:mx-0 sm:px-0 sm:pb-0">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-[11px]">
                                            {activeData[0]?.title
                                                ? "Title"
                                                : activeData[0]?.subject
                                                  ? "Subject"
                                                  : "N/A"}
                                        </th>
                                        <th className="px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-[11px]">
                                            Status
                                        </th>
                                        <th className="px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-[11px]">
                                            File
                                        </th>
                                        <th className="px-2.5 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-gray-600 sm:px-3 sm:py-3 sm:text-[11px] sm:w-[8rem]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {activeData.length > 0 ? (
                                        activeData.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-gray-100 hover:bg-amber-50"
                                            >
                                                {/* Title */}
                                                <td className="px-2.5 py-2.5 sm:px-3 sm:py-3">
                                                    <div className="line-clamp-2 break-words text-[13px] text-gray-800 sm:text-sm">
                                                        {item.title ||
                                                            item.subject ||
                                                            "—"}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-2.5 py-2.5 sm:px-3 sm:py-3">
                                                    <span className="px-2 py-1 rounded text-[12px] bg-gray-100 text-gray-700">
                                                        {item.status || "—"}
                                                    </span>
                                                </td>

                                                {/* File */}
                                                <td className="px-2.5 py-2.5 sm:px-3 sm:py-3">
                                                    {item.file_url ? (
                                                        <button
                                                            onClick={() =>
                                                                openFilePreview(
                                                                    item.file_url,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 sm:px-2 sm:py-1 sm:text-xs"
                                                        >
                                                            View
                                                        </button>
                                                    ) : (
                                                        <span className="text-[13px] text-gray-400 sm:text-sm">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                <td
                                                    className="px-2.5 py-2.5 sm:px-3 sm:py-3"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {(() => {
                                                        const isFiled =
                                                            item.status ===
                                                            "Filed";

                                                        return (
                                                            <button
                                                                disabled={
                                                                    isFiled ||
                                                                    loadingId ===
                                                                        item.id
                                                                }
                                                                onClick={async () => {
                                                                    if (isFiled)
                                                                        return;

                                                                    setLoadingId(
                                                                        item.id,
                                                                    );

                                                                    const response =
                                                                        await axios.put(
                                                                            route(
                                                                                "archive.update-status",
                                                                                {
                                                                                    id: item.id,
                                                                                },
                                                                            ),
                                                                            {
                                                                                model: activeTab,
                                                                                status: "Filed",
                                                                            },
                                                                        );

                                                                    if (
                                                                        response
                                                                            .data
                                                                            .success
                                                                    ) {
                                                                        // ✅ Remove from current table
                                                                        setActiveData(
                                                                            (
                                                                                prevData,
                                                                            ) =>
                                                                                prevData.filter(
                                                                                    (
                                                                                        record,
                                                                                    ) =>
                                                                                        record.id !==
                                                                                        item.id,
                                                                                ),
                                                                        );

                                                                        // ✅ Sync with tab data
                                                                        setTabs(
                                                                            (
                                                                                prevTabs,
                                                                            ) =>
                                                                                prevTabs.map(
                                                                                    (
                                                                                        tab,
                                                                                    ) =>
                                                                                        tab.id ===
                                                                                        activeTab
                                                                                            ? {
                                                                                                  ...tab,
                                                                                                  data: tab.data.filter(
                                                                                                      (
                                                                                                          record,
                                                                                                      ) =>
                                                                                                          record.id !==
                                                                                                          item.id,
                                                                                                  ),
                                                                                              }
                                                                                            : tab,
                                                                                ),
                                                                        );

                                                                        console.log(
                                                                            response
                                                                                .data
                                                                                .message,
                                                                        );
                                                                    } else {
                                                                        alert(
                                                                            "Something went wrong. Please try again.",
                                                                        );
                                                                    }

                                                                    setLoadingId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className={`w-full rounded px-2 py-1 text-[12px] font-medium sm:text-sm ${
                                                                    isFiled
                                                                        ? "bg-green-300 text-green-800 cursor-default"
                                                                        : loadingId ===
                                                                            item.id
                                                                          ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                                                                          : "bg-slate-900 text-white hover:bg-slate-800"
                                                                }`}
                                                            >
                                                                {loadingId ===
                                                                item.id
                                                                    ? "Filing..."
                                                                    : isFiled
                                                                      ? "Filed"
                                                                      : "Unarchive"}
                                                            </button>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-2.5 py-6 text-center text-[13px] text-gray-500 sm:px-3 sm:py-8 sm:text-sm"
                                            >
                                                No archived records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* === File Preview Modal === */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-75 sm:p-4">
                    <div className="relative max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-3 py-1 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-800 truncate">
                                {previewFilename}
                            </h3>
                            <button
                                onClick={closePreview}
                                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
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
                                />
                            ) : isImage(previewUrl) ? (
                                <img
                                    src={previewUrl}
                                    alt={previewFilename}
                                    className="max-h-[90vh] max-w-full object-contain bg-white"
                                />
                            ) : isDoc(previewUrl) ? (
                                <iframe
                                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                                        previewUrl,
                                    )}`}
                                    title="DOC Preview"
                                    className="w-full h-full bg-white border-0"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center sm:p-6">
                                    <File className="w-10 h-10 text-gray-400 sm:h-12 sm:w-12" />
                                    <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                                        This file type cannot be previewed.
                                    </p>
                                    <a
                                        href={previewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm"
                                    >
                                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{" "}
                                        Download File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
