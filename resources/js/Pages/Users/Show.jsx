import React from "react";
import { Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Show({ user, roles, permissions }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Roles
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="max-w-3xl p-6 mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">User Details</h1>
                    <Link
                        href={route("users.index")}
                        className="px-3 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
                    >
                        ← Back to Users
                    </Link>
                </div>

                {flash?.success && (
                    <div className="p-3 mb-4 text-green-800 bg-green-100 rounded">
                        {flash.success}
                    </div>
                )}

                <div className="p-6 space-y-4 bg-white rounded-lg shadow">
                    {/* Basic Info */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            User Information
                        </h2>
                        <p className="mt-1 text-gray-700">
                            <strong>Name:</strong> {user.name}
                        </p>
                        <p className="text-gray-700">
                            <strong>Email:</strong> {user.email}
                        </p>
                    </div>

                    {/* Roles */}
                    <div className="pt-4 border-t">
                        <h2 className="mb-2 text-lg font-semibold text-gray-800">
                            Roles
                        </h2>
                        {roles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {roles.map((role) => (
                                    <span
                                        key={role}
                                        className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full"
                                    >
                                        {role}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="italic text-gray-600">
                                No roles assigned.
                            </p>
                        )}
                    </div>

                    {/* Permissions */}
                    <div className="pt-4 border-t">
                        <h2 className="mb-2 text-lg font-semibold text-gray-800">
                            Permissions
                        </h2>
                        {permissions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {permissions.map((perm) => (
                                    <span
                                        key={perm}
                                        className="px-3 py-1 text-sm text-green-800 bg-green-100 rounded-full"
                                    >
                                        {perm}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="italic text-gray-600">
                                No permissions assigned.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
