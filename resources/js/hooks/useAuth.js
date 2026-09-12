import { usePage } from "@inertiajs/react";

export default function useAuth() {
    const { props } = usePage();
    const user = props.auth?.user;

    const hasRole = (role) => user?.role_names?.includes(role);
    const can = (permission) => user?.permission_names?.includes(permission);

    return { user, hasRole, can };
}
