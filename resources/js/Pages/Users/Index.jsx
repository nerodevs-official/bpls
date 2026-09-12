import React from "react";
import { Link, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Index() {
    const { users, flash } = usePage().props;

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this user?")) {
            router.delete(route("users.destroy", id));
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

            <div className="max-w-5xl p-6 mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <Link
                        href={route("users.create")}
                        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        + New User
                    </Link>
                </div>

                {flash?.success && (
                    <div className="p-3 mb-4 text-green-800 bg-green-100 rounded">
                        {flash.success}
                    </div>
                )}

                <table className="w-full text-left border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 border-b">Name</th>
                            <th className="p-3 border-b">Email</th>
                            <th className="p-3 border-b">Roles</th>
                            <th className="p-3 text-center border-b">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-3 border-b">{user.name}</td>
                                <td className="p-3 border-b">{user.email}</td>
                                <td className="p-3 border-b">
                                    {user.roles.map((r) => (
                                        <span
                                            key={r.id}
                                            className="px-2 py-1 mr-2 text-sm text-blue-800 bg-blue-100 rounded"
                                        >
                                            {r.name}
                                        </span>
                                    ))}
                                </td>
                                <td className="p-3 text-center border-b">
                                    <Link
                                        href={route("users.show", user.id)}
                                        className="px-3 py-1 mr-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
                                    >
                                        View
                                    </Link>
                                    <Link
                                        href={route("users.edit", user.id)}
                                        className="px-3 py-1 mr-2 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
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
