import React from "react";
import { Link, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Index() {
    const { roles, flash } = usePage().props;

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this role?")) {
            router.delete(route("roles.destroy", id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Roles
                </h2>
            }
        >
            <Head title="Dashboard" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Roles</h1>

                {flash?.success && (
                    <div className="p-2 mb-4 text-green-700 bg-green-100 rounded">
                        {flash.success}
                    </div>
                )}

                <Link
                    href={route("roles.create")}
                    className="px-4 py-2 text-white bg-blue-600 rounded"
                >
                    + Add Role
                </Link>

                <table className="w-full mt-4 border">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Permissions</th>
                            <th className="p-2 border">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role) => (
                            <tr key={role.id}>
                                <td className="p-2 border">{role.name}</td>
                                <td className="p-2 border">
                                    {role.permissions
                                        .map((p) => p.name)
                                        .join(", ")}
                                </td>
                                <td className="p-2 space-x-2 border">
                                    <Link
                                        href={route("roles.edit", role.id)}
                                        className="text-blue-600"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        className="text-red-600"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
