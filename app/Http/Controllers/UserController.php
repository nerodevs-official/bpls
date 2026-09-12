<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    // 🧩 Display all users
    public function index()
    {
        $users = User::with('roles')->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }

    // 🧩 Show create form
    public function create()
    {
        $roles = Role::with('permissions')->get();

        return Inertia::render('Users/Create', [
            'roles' => $roles,
        ]);
    }


    public function show(User $user)
    {
        $roles = $user->getRoleNames(); // Returns a collection of role names
        $permissions = $user->getAllPermissions()->pluck('name'); // Includes role-based and direct permissions

        return Inertia::render('Users/Show', [
            'user' => $user,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }
    // 🧩 Store new user
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'array',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        // 🧠 Assign roles
        if (!empty($validated['roles'])) {
            $user->syncRoles($validated['roles']);

            // 🧩 Also sync permissions from the assigned roles
            $permissions = Permission::whereHas('roles', function ($query) use ($validated) {
                $query->whereIn('name', $validated['roles']);
            })->pluck('id')->toArray();

            $user->syncPermissions($permissions);
        }

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }


    // 🧩 Show edit form
    public function edit(User $user)
    {
        $roles = Role::with('permissions')->get();
        $userRoles = $user->roles->pluck('name')->toArray();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'userRoles' => $userRoles,
        ]);
    }

    // 🧩 Update user
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'array',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => !empty($validated['password'])
                ? bcrypt($validated['password'])
                : $user->password,
        ]);

        // 🧠 Sync roles
        $user->syncRoles($validated['roles'] ?? []);

        // 🧩 Then sync role permissions into model_has_permissions
        if (!empty($validated['roles'])) {
            $permissions = Permission::whereHas('roles', function ($query) use ($validated) {
                $query->whereIn('name', $validated['roles']);
            })->pluck('id')->toArray();

            $user->syncPermissions($permissions);
        } else {
            // Remove all direct permissions if no roles
            $user->syncPermissions([]);
        }

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    // 🧩 Delete user
    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
}
