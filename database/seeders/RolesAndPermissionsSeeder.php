<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Permission::findOrCreate('manage users');
        Permission::findOrCreate('view dashboard');

        $admin = Role::findOrCreate('admin');
        $admin->givePermissionTo(['manage users', 'view dashboard']);

        $user = Role::findOrCreate('user');
        $user->givePermissionTo(['view dashboard']);
    }
}
