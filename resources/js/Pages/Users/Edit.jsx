import React from "react";
import { useForm, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Edit({ user, roles, userRoles }) {
    const { data, setData, put, errors } = useForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
        password_confirmation: "",
        roles: userRoles || [],
    });

    const handleCheckbox = (roleName) => {
        setData(
            "roles",
            data.roles.includes(roleName)
                ? data.roles.filter((r) => r !== roleName)
                : [...data.roles, roleName]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("users.update", user.id));
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

            <div className="max-w-3xl p-6 mx-auto">
                <h1 className="mb-4 text-2xl font-bold">Edit User</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block font-medium">Name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block font-medium">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border rounded"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Optional Password Update */}
                    <div className="pt-4 border-t">
                        <label className="block mb-1 font-medium">
                            New Password (optional)
                        </label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border rounded"
                            placeholder="Leave blank to keep current password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        />
                        {errors.password && (
                            <p className="text-sm text-red-600">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border rounded"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                        />
                    </div>

                    {/* Roles */}
                    <div className="pt-4 border-t">
                        <label className="block mb-2 font-medium">Roles</label>
                        <div className="flex flex-wrap gap-3">
                            {roles.map((role) => (
                                <label
                                    key={role.id}
                                    className="flex items-center"
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.roles.includes(role.name)}
                                        onChange={() =>
                                            handleCheckbox(role.name)
                                        }
                                        className="mr-2"
                                    />
                                    {role.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <Link
                            href={route("users.index")}
                            className="text-gray-600 hover:underline"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                            Update User
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
