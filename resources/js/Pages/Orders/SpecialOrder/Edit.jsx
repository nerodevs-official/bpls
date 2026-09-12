// resources/js/Pages/Order/soOrder/MoEdit.jsx

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link, usePage } from "@inertiajs/react";
import { Save, ArrowLeft } from "lucide-react";
import React, { useRef, useState } from "react";
import ConfirmModal from "@/Components/ConfirmModal";
import { router } from "@inertiajs/react";

const Field = ({ label, error, children }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-medium tracking-wide uppercase text-slate-600">
            {label}
        </label>
        {children}
        {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
);

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

export default function MoEdit({ so }) {
    const { role, users } = usePage().props;
    const fileRef = useRef(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    const { data, setData, post, progress, errors, processing } = useForm({
        originating_department: so.originating_department || "",
        so_no: so.so_no || "",
        recipients: so.recipients || "",
        subject: so.subject || "",
        amount: so.amount || "",
        date_issued: so.date_issued
            ? new Date(so.date_issued).toISOString().split("T")[0]
            : "",
        status: so.status || "Not Started",
        assigned_to: so.assigned_to || "",
        remarks: so.remarks || "",
        file: null,
        _method: "PUT", // 👈 important for Laravel resource route
    });

    // Role-based allowed statuses
    const allowedStatuses = (() => {
        switch (role) {
            case "Drafter":
                return ["Drafted", "For Review"];
            case "Reviewer":
                return ["Approved", "Rejected"];
            case "Messenger":
                return ["Printed", "Disseminated", "Signed", "Filed"];
            case "Admin":
                return STATUS_OPTIONS;
            default:
                return [];
        }
    })();

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("special-order.update", so.id), {
            preserveState: true,
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (fileRef.current) fileRef.current.value = "";
                setData("file", null);
            },
        });
    };

    const handleFileDelete = () => {
        if (!confirm("Are you sure you want to delete the attached file?"))
            return;

        router.delete(route("special-order.delete-file", so.id), {
            preserveScroll: true,
            onSuccess: () => {
                setData("file", null);
                so.file_path = null;
            },
        });
    };

    const handleDelete = () => {
        router.delete(route("special-order.destroy", so.id), {
            preserveScroll: true,
        });
    };

    const inputCls =
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

    const currentFile = so.file_path || null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <Link
                        href={route("special-order.index")}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Special Order
                    </h2>
                </div>
            }
        >
            <Head title="Edit Special Order" />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Delete Special Order?"
                message="Are you sure you want to delete this Special Order? This action cannot be undone."
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    handleDelete();
                    setDeleteModalOpen(false);
                }}
            />

            <form
                onSubmit={handleSubmit}
                encType="multipart/form-data"
                className="p-4"
            >
                <div className="mx-auto overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
                    <div className="px-5 py-3 bg-white border-b-2 border-amber-500">
                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-900">
                            Special Order Worksheet
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                        {/* Originating Department */}
                        <Field
                            label="Originating Department"
                            error={errors.originating_department}
                        >
                            <input
                                type="text"
                                className={inputCls}
                                value={data.originating_department}
                                onChange={(e) =>
                                    setData(
                                        "originating_department",
                                        e.target.value
                                    )
                                }
                            />
                        </Field>

                        {/* SO No. */}
                        <Field label="SO No." error={errors.so_no}>
                            <input
                                type="text"
                                className={inputCls}
                                value={data.so_no}
                                onChange={(e) =>
                                    setData("so_no", e.target.value)
                                }
                            />
                        </Field>

                        {/* Recipients */}
                        <div className="sm:col-span-2">
                            <Field label="Recipients" error={errors.recipients}>
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={data.recipients}
                                    onChange={(e) =>
                                        setData("recipients", e.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        {/* Subject */}
                        <div className="sm:col-span-2">
                            <Field label="Subject" error={errors.subject}>
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={data.subject}
                                    onChange={(e) =>
                                        setData("subject", e.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        {/* Amount */}
                        <Field label="Amount" error={errors.amount}>
                            <input
                                type="number"
                                className={inputCls}
                                value={data.amount}
                                onChange={(e) =>
                                    setData("amount", e.target.value)
                                }
                            />
                        </Field>

                        {/* Date Issued */}
                        <Field label="Date Issued" error={errors.date_issued}>
                            <input
                                type="date"
                                className={inputCls}
                                value={data.date_issued}
                                onChange={(e) =>
                                    setData("date_issued", e.target.value)
                                }
                            />
                        </Field>

                        {/* Status */}
                        <Field label="Status" error={errors.status}>
                            <select
                                className={inputCls}
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                            >
                                {allowedStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* Assigned To */}
                        <Field label="Assigned To" error={errors.assigned_to}>
                            <select
                                className={inputCls}
                                value={data.assigned_to}
                                onChange={(e) =>
                                    setData("assigned_to", e.target.value)
                                }
                            >
                                <option value="">Select User</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.name}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* Remarks */}
                        <Field label="Remarks" error={errors.remarks}>
                            <input
                                type="text"
                                className={inputCls}
                                value={data.remarks}
                                onChange={(e) =>
                                    setData("remarks", e.target.value)
                                }
                            />
                        </Field>

                        {/* File Upload */}
                        <div className="sm:col-span-2">
                            <Field label="File" error={errors.file}>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    onChange={(e) =>
                                        setData("file", e.target.files[0])
                                    }
                                    className="block w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                                />
                                {currentFile && (
                                    <div className="flex items-center justify-between p-2 mt-2 text-xs border rounded-md text-slate-600 bg-slate-50">
                                        <div>
                                            <span className="font-medium text-slate-800">
                                                {String(currentFile)
                                                    .split("/")
                                                    .pop()}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleFileDelete}
                                            className="font-semibold text-rose-600 hover:underline"
                                        >
                                            Delete File
                                        </button>
                                    </div>
                                )}

                                {progress && (
                                    <progress
                                        value={progress.percentage}
                                        max="100"
                                        className="w-full mt-1"
                                    >
                                        {progress.percentage}%
                                    </progress>
                                )}
                            </Field>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
                        <Link
                            href={route("special-order.index")}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium bg-white border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Link>

                        {/* Delete Button (opens modal) */}
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(true)}
                            className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-lg bg-rose-600 hover:bg-rose-700"
                        >
                            Delete
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? "Saving..." : "Update Special Order"}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
