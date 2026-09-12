import { usePage } from "@inertiajs/react";

export default function usePermission() {
    const { auth } = usePage().props;

    function can(permission) {
        return auth?.permissions?.includes(permission);
    }

    return { can };
}
