import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link } from "@inertiajs/react";

export default function NotFound() {
    return (
        <GuestLayout>
            <Head title="Page Not Found" />

            <div className="mb-4 text-sm text-gray-600">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">404</h1>
                <p className="text-center text-lg mb-4">
                    Oops! The page you are looking for does not exist.
                </p>
                <p className="text-center mb-6">
                    It might have been moved or deleted.
                </p>

                <div className="flex items-center justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
