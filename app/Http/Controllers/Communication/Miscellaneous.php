<?php

namespace App\Http\Controllers\Communication;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use App\Models\CommunicationMiscellaneous;

class Miscellaneous extends Controller
{
   public function index(Request $request)
{
    $search = $request->input('search', '');
    $statusFilter = $request->input('status', '');
    $perPage = $request->input('per_page', 15);
    $sort = $request->input('sort_field', 'created_at'); // Changed from 'sort' to 'sort_field'
    $direction = $request->input('sort_direction', 'desc'); // Changed from 'direction' to 'sort_direction'
    
    // 🔐 Get user permissions
    $user = auth()->user();
    $permissions = $user->getAllPermissions()->pluck('name')->toArray();
    $role = $user->roles->pluck('name')->first();
    
    // Map permissions → allowed statuses
    $permissionMap = [
        "view Not Started status" => "Not Started",
        "view Drafted status" => "Drafted",
        "view For Review status" => "For Review",
        "view Approved status" => "Approved",
        "view Rejected status" => "Rejected",
        "view Printed status" => "Printed",
        "view Disseminated status" => "Disseminated",
        "view Signed status" => "Signed",
        "view Filed status" => "Filed",
        "view Archived status" => "Archived",
    ];

    $allowedStatuses = collect($permissions)
        ->map(fn($p) => $permissionMap[$p] ?? null)
        ->filter()
        ->values()
        ->toArray();

    $query = CommunicationMiscellaneous::query();

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('subject', 'like', "%{$search}%")
                ->orWhere('title', 'like', "%{$search}%");
        });
    }

    if ($statusFilter) {
        $query->where('status', $statusFilter);
    }

    // 🔐 Apply permission-based filtering
    if (!empty($allowedStatuses)) {
        $query->whereIn('status', $allowedStatuses);
    } else {
        // Optional: restrict to none if user has no viewing permissions
        $query->whereRaw('1 = 0');
    }

    // Validate and apply sorting
    $validSortFields = ['subject', 'title', 'status', 'time', 'start_date', 'due_date', 'assigned_to', 'created_at', 'file_path'];
    $validDirections = ['asc', 'desc'];
    
    $sortField = in_array($sort, $validSortFields) ? $sort : 'created_at';
    $sortDirection = in_array($direction, $validDirections) ? $direction : 'desc';
    
    $query->orderBy($sortField, $sortDirection);

    $paginated = $query->paginate($perPage)
        ->appends($request->only(['search', 'status', 'per_page', 'sort_field', 'sort_direction']));

    $tasks = $paginated->getCollection()->map(function ($miscellaneous) {
        $fileUrl = '';
        if ($miscellaneous->file_path) {
            $baseUrl = Storage::disk('r2')->url($miscellaneous->file_path);
            // Add cache-busting parameter using file hash
            $fileHash = md5($miscellaneous->file_path . $miscellaneous->updated_at->timestamp);
            $fileUrl = $baseUrl . '?v=' . $fileHash;
        }
        return [
            'id' => $miscellaneous->id,
            'values' => [
                ['miscellaneous_header_id' => 1, 'value' => $miscellaneous->subject ?? ''],
                ['miscellaneous_header_id' => 2, 'value' => $miscellaneous->title ?? ''],
                ['miscellaneous_header_id' => 3, 'value' => $miscellaneous->status ?? ''],
                ['miscellaneous_header_id' => 4, 'value' => $miscellaneous->time ?? ''],
                ['miscellaneous_header_id' => 5, 'value' => $miscellaneous->start_date ?? ''],
                ['miscellaneous_header_id' => 6, 'value' => $miscellaneous->due_date ?? ''],
                ['miscellaneous_header_id' => 7, 'value' => $miscellaneous->assigned_to ?? ''],
                ['miscellaneous_header_id' => 8, 'value' => $fileUrl],
            ],
        ];
    })->values()->toArray();

    $headers = [
        ['id' => 1, 'name' => 'SUBJECT', 'field_type' => 'text'],
        ['id' => 2, 'name' => 'TITLE', 'field_type' => 'text'],
        ['id' => 3, 'name' => 'STATUS', 'field_type' => 'text'],
        ['id' => 4, 'name' => 'TIME', 'field_type' => 'time'],
        ['id' => 5, 'name' => 'START DATE', 'field_type' => 'date'],
        ['id' => 6, 'name' => 'DUE ON', 'field_type' => 'date'],
        ['id' => 7, 'name' => 'ASSIGNED TO', 'field_type' => 'text'],
        ['id' => 8, 'name' => 'LINK/PDF FILE', 'field_type' => 'file'],
    ];

    $miscellaneous = [
        'id' => 1,
        'name' => 'Miscellaneous',
        'headers' => $headers,
        'tasks' => $tasks,
        'pagination' => [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'from' => $paginated->firstItem() ?? 0,
            'to' => $paginated->lastItem() ?? 0,
        ],
    ];

    return Inertia::render('Communication/Miscellaneous/Index', [
        'miscellaneous' => $miscellaneous,
        'filters' => [
            'search' => $search,
            'status' => $statusFilter,
            'per_page' => $perPage,
            'sort_field' => $sort,
            'sort_direction' => $direction,
        ],
        'permissions' => $permissions,
        'role' => $role,
    ]);
}

    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status' => ['nullable', 'string', Rule::in([
                'Not Started',
                'Drafted',
                'For Review',
                'Approved',
                'Rejected',
                'Printed',
                'Disseminated',
                'Signed',
                'Filed',
                'Archived'
            ])]
        ]);

        $miscellaneous = CommunicationMiscellaneous::findOrFail($id);

        $miscellaneous->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status updated successfully.');
    }

    public function create()
    {
        $users = User::select('id', 'name')->get();
        return Inertia::render('Communication/Miscellaneous/Create', [
            'users' => $users,
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject'      => ['required', 'string'],
            'title'        => ['required', 'string', 'max:255'],
            'status'       => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed', 'Archived'])],
            'time'         => ['nullable', 'string'],
            'start_date'   => ['required', 'date'],
            'due_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'file'         => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'], // 10MB
            'assigned_to'  => ['nullable', 'exists:users,id'], // still validate by id
        ]);

        $filePath = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $miscellaneousSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['subject']));
            $miscellaneousSlug = trim($miscellaneousSlug, '-');

            $filename = 'miscellaneous-' . $miscellaneousSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG are allowed.']);
            }

            $disk = app()->environment('production') ? 'r2' : 'r2';

            try {
                $filePath = $file->storeAs('miscellaneous_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File upload to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload file. Please try again.']);
            }
        }



        // ✅ Convert user ID to name before saving
        if ($request->filled('assigned_to')) {
            $user = User::find($request->assigned_to);
            $validated['assigned_to'] = $user ? $user->name : null;
        }

        CommunicationMiscellaneous::create(array_merge($validated, ['file_path' => $filePath]));

        return redirect()->route('miscellaneous.index')
            ->with('success', 'Miscellaneous created successfully!');
    }

    public function show($id)
    {
        $miscellaneous = CommunicationMiscellaneous::findOrFail($id);
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        return Inertia::render('Communication/Miscellaneous/Show', [
            'miscellaneous' => [
                'id'         => $miscellaneous->id,
                'subject'    => $miscellaneous->subject,
                'title'      => $miscellaneous->title,
                'status'     => $miscellaneous->status,
                'time'       => $miscellaneous->time,
                'start_date' => $miscellaneous->start_date,
                'due_date'   => $miscellaneous->due_date,
                'assigned_to' => $miscellaneous->assigned_to,
                'file_path' => $miscellaneous->file_path
                    ? Storage::disk('r2')->url($miscellaneous->file_path) . '?v=' . md5($miscellaneous->file_path . $miscellaneous->updated_at->timestamp)
                    : null,

            ],
            'role' => $role,
        ]);
    }


    public function edit(string $id)
    {
        $miscellaneous = CommunicationMiscellaneous::findOrFail($id);
        $users = User::select('id', 'name')->get();
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        return Inertia::render('Communication/Miscellaneous/Edit', [
            'miscellaneous' => $miscellaneous,
            'role' => $role,
            'users' => $users,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $miscellaneous = CommunicationMiscellaneous::findOrFail($id);

        $validated = $request->validate([
            'subject'     => ['required', 'string'],
            'title'       => ['required', 'string', 'max:255'],
            'status'      => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed', 'Archived'])],
            'time'        => ['nullable', 'string'],
            'start_date'  => ['required', 'date'],
            'due_date'    => ['required', 'date', 'after_or_equal:start_date'],
            'file'        => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
            'assigned_to' => ['nullable', 'string', 'max:255'], // ✅ added field
        ]);

        $filePath = $miscellaneous->file_path; // Keep existing file by default

        // Only process file if a new file is uploaded
        if ($request->hasFile('file')) {
            \Log::info('Processing file upload for Executive Order', [
                'id' => $id,
                'file_name' => $request->file('file')->getClientOriginalName(),
                'file_size' => $request->file('file')->getSize()
            ]);

            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $miscellaneousSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['subject']));
            $miscellaneousSlug = trim($miscellaneousSlug, '-');
            $filename = 'miscellaneous-' . $miscellaneousSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type.']);
            }

            $disk = 'r2';
            try {
                // Delete old file if exists
                if ($miscellaneous->file_path && Storage::disk('r2')->exists($miscellaneous->file_path)) {
                    Storage::disk('r2')->delete($miscellaneous->file_path);
                }

                $filePath = $file->storeAs('miscellaneous_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File update to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload new file.']);
            }
        }

        $updateData = $validated;
        $updateData['file_path'] = $filePath;


        // ✅ Update including assigned_to name
        $miscellaneous->update($updateData);



        return redirect()->route('miscellaneous.index')
            ->with('success', 'miscellaneous Letter updated successfully!');
    }

    public function deleteFile($id)
    {
        $miscellaneous = CommunicationMiscellaneous::findOrFail($id);

        // Delete file from R2 if exists
        if ($miscellaneous->file_path) {
            try {
                Storage::disk('r2')->delete($miscellaneous->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $miscellaneous->update(['file_path' => null]);

        return back()->with('success', 'File deleted successfully.');
    }

    public function destroy(string $id)
    {
        $miscellaneous = CommunicationMiscellaneous::findOrFail($id);

        // Delete file from R2 if exists
        if ($miscellaneous->file_path) {
            try {
                Storage::disk('r2')->delete($miscellaneous->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $miscellaneous->delete();

        return redirect()->route('miscellaneous.index')
            ->with('success', 'Miscellaneous Letter deleted successfully!');
    }
}
