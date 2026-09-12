// resources/js/Pages/Order/MemoOrder/MoCreate.jsx
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link, usePage } from "@inertiajs/react";
import { Save, ArrowLeft } from "lucide-react";
import React, { useRef } from "react";

// ✅ Move Field OUTSIDE the main component
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

export default function MoCreate() {
    const { users } = usePage().props;

    const fileRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        originating_department: "",
        memo_no: "",
        recipients: "",
        subject: "",
        date_of_effectivity: "",
        date_issued: "",
        status: "Not Started",
        remarks: "",
        file: null,
        assigned_to: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("memo-order.store"), {
            forceFormData: true,
            onSuccess: () => reset("file"),
        });
    };

    const inputCls =
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <Link
                        href={route("memo-order.index")}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Create Memo Order
                    </h2>
                </div>
            }
        >
            <Head title="Create Memo Order" />
            <form onSubmit={submit} className="p-4">
                <div className="mx-auto overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
                    <div className="px-5 py-3 bg-white border-b-2 border-amber-500">
                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-900">
                            Memorandum Order Worksheet
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                        <Field
                            label="Originating Department"
                            error={errors.originating_department}
                        >
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="e.g., HR Department"
                                value={data.originating_department}
                                onChange={(e) =>
                                    setData(
                                        "originating_department",
                                        e.target.value
                                    )
                                }
                            />
                        </Field>

                        <Field label="Memo No." error={errors.memo_no}>
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="e.g., 59"
                                value={data.memo_no}
                                onChange={(e) =>
                                    setData("memo_no", e.target.value)
                                }
                            />
                        </Field>

                        <div className="sm:col-span-2">
                            <Field label="Recipients" error={errors.recipients}>
                                <input
                                    type="text"
                                    className={inputCls}
                                    placeholder="e.g., All Provincial Government Employees"
                                    value={data.recipients}
                                    onChange={(e) =>
                                        setData("recipients", e.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <div className="sm:col-span-2">
                            <Field label="Subject" error={errors.subject}>
                                <input
                                    type="text"
                                    className={inputCls}
                                    placeholder="Enter memo subject"
                                    value={data.subject}
                                    onChange={(e) =>
                                        setData("subject", e.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <Field
                            label="Date of Effectivity"
                            error={errors.date_of_effectivity}
                        >
                            <input
                                type="date"
                                className={inputCls}
                                value={data.date_of_effectivity}
                                onChange={(e) =>
                                    setData(
                                        "date_of_effectivity",
                                        e.target.value
                                    )
                                }
                            />
                        </Field>

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

                        <Field label="Status" error={errors.status}>
                            <select
                                className={inputCls}
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </Field>

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
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Remarks" error={errors.remarks}>
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="Optional"
                                value={data.remarks}
                                onChange={(e) =>
                                    setData("remarks", e.target.value)
                                }
                            />
                        </Field>

                        <div className="sm:col-span-2">
                            <Field label="Link/PDF File" error={errors.file}>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    onChange={(e) =>
                                        setData(
                                            "file",
                                            e.target.files?.[0] ?? null
                                        )
                                    }
                                    className="block w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
                        <Link
                            href={route("memo-order.index")}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium bg-white border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? "Saving..." : "Save Memo"}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
