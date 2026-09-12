import React, { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Create({ permissions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        permissions: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("roles.store"));
    };

    const togglePermission = (id) => {
        setData(
            "permissions",
            data.permissions.includes(id)
                ? data.permissions.filter((p) => p !== id)
                : [...data.permissions, id]
        );
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
            <div className="max-w-xl p-6 mx-auto">
                <h1 className="mb-4 text-2xl font-bold">Create Role</h1>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-1">Role Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                        {errors.name && (
                            <div className="text-sm text-red-500">
                                {errors.name}
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 font-semibold">
                            Permissions
                        </label>
                        <div className="space-y-1">
                            {permissions.map((p) => (
                                <label key={p.id} className="block">
                                    <input
                                        type="checkbox"
                                        checked={data.permissions.includes(
                                            p.id
                                        )}
                                        onChange={() => togglePermission(p.id)}
                                        className="mr-2"
                                    />
                                    {p.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-white bg-blue-600 rounded"
                        >
                            Save
                        </button>
                        <Link
                            href={route("roles.index")}
                            className="px-4 py-2 text-gray-600"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
