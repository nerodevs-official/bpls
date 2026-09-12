<?php

namespace App\Http\Controllers\Order;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\ExecutiveOrder;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;


class ExecutiveOrderController extends Controller
{

   public function index(Request $request)
{
    // Get filter inputs
    $search = $request->input('search', '');
    $departmentFilter = $request->input('department', '');
    $statusFilter = $request->input('status', '');
    $perPage = $request->input('per_page', 15);
    $sortField = $request->input('sort_field', 'created_at');
    $sortDirection = $request->input('sort_direction', 'desc');

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

    // Base query
    $query = ExecutiveOrder::query();

    // Apply search (on multiple fields)
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('originating_department', 'like', "%{$search}%")
                ->orWhere('eo_no', 'like', "%{$search}%")
                ->orWhere('title', 'like', "%{$search}%");
        });
    }

    // Filter by department
    if ($departmentFilter) {
        $query->where('originating_department', $departmentFilter);
    }

    // Filter by status
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
    $allowedSortFields = ['originating_department', 'eo_no', 'title', 'date_issued', 'status', 'assigned_to', 'file_path', 'created_at'];
    $validSortField = in_array($sortField, $allowedSortFields) ? $sortField : 'created_at';
    $validSortDirection = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'desc';

    // Get unique departments for filter dropdown
    $allDepartments = ExecutiveOrder::distinct()
        ->pluck('originating_department')
        ->filter()
        ->values();

    // Paginate results
    $paginated = $query->orderBy($validSortField, $validSortDirection)
        ->paginate($perPage)
        ->appends($request->only(['search', 'department', 'status', 'per_page', 'sort_field', 'sort_direction']));

    // Transform to expected format
    $tasks = $paginated->getCollection()->map(function ($eo) {
        $fileUrl = '';
        if ($eo->file_path) {
            $baseUrl = Storage::disk('r2')->url($eo->file_path);
            // Add cache-busting parameter using file hash
            $fileHash = md5($eo->file_path . $eo->updated_at->timestamp);
            $fileUrl = $baseUrl . '?v=' . $fileHash;
        }

        return [
            'id' => $eo->id,
            'values' => [
                ['eo_header_id' => 1, 'value' => $eo->originating_department],
                ['eo_header_id' => 2, 'value' => $eo->eo_no],
                ['eo_header_id' => 4, 'value' => $eo->title],
                ['eo_header_id' => 6, 'value' => $eo->date_issued ? $eo->date_issued->format('Y-m-d') : ''],
                ['eo_header_id' => 7, 'value' => $eo->status],
                ['eo_header_id' => 8, 'value' => $eo->assigned_to ?? ''],
                ['eo_header_id' => 9, 'value' => $fileUrl],
            ],
        ];
    })->all();

    $headers = [
        ['id' => 1, 'name' => 'ORIGINATING DEPARTMENT', 'field_type' => 'text'],
        ['id' => 2, 'name' => 'EO NO.', 'field_type' => 'text'],
        ['id' => 4, 'name' => 'TITLE', 'field_type' => 'text'],
        ['id' => 6, 'name' => 'DATE ISSUED', 'field_type' => 'date'],
        ['id' => 7, 'name' => 'STATUS', 'field_type' => 'text'],
        ['id' => 8, 'name' => 'ASSIGNED TO', 'field_type' => 'text'],
        ['id' => 9, 'name' => 'LINK/PDF FILE', 'field_type' => 'file'],
    ];

    $eo = [
        'id' => 1,
        'name' => 'Executive Order',
        'headers' => $headers,
        'tasks' => $tasks,
        'pagination' => [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'from' => $paginated->firstItem(),
            'to' => $paginated->lastItem(),
        ],
    ];

    return Inertia::render('Orders/ExecutiveOrder/Index', [
        'eo' => $eo,
        'filters' => [
            'search' => $search,
            'department' => $departmentFilter,
            'status' => $statusFilter,
            'per_page' => $perPage,
            'sort_field' => $validSortField,
            'sort_direction' => $validSortDirection,
        ],
        'departments' => $allDepartments,
        'permissions' => $permissions,
        'role' => $role,
    ]);
}

    
    /**
     * Show the form for creating a new reeource.
     */
    public function create()
    {
        $users = User::select('id', 'name')->get();

        return Inertia::render('Orders/ExecutiveOrder/Create', [
            'users' => $users,
        ]);
    }

    public function deleteFile($id)
    {
        $eo = ExecutiveOrder::findOrFail($id);

        if ($eo->file_path) {
            try {
                Storage::disk('r2')->delete($eo->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $eo->update(['file_path' => null]);

        return back()->with('success', 'File deleted successfully.');
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

        $eo = ExecutiveOrder::findOrFail($id);

        $eo->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status updated successfully.');
    }
    /**
     * Store a newly created reeource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'originating_department' => ['required', 'string', 'max:255'],
            'eo_no'                  => ['required', 'string', 'max:100'],
            'title'                  => ['required', 'string'],
            'date_issued'            => ['required', 'date'],
            'status'                 => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed',  'Archived'])],
            'remarks'                => ['nullable', 'string'],
            'file'                   => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'], // 10MB
            'assigned_to'            => ['nullable', 'exists:users,id'],
        ]);

        $filePath = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $eoSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['eo_no']));
            $eoSlug = trim($eoSlug, '-');

            $filename = 'eo-' . $eoSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG are allowed.']);
            }

            $disk = app()->environment('production') ? 'r2' : 'r2';

            try {
                $filePath = $file->storeAs('eo_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File upload to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload file. Please try again.']);
            }
        }

        if ($request->filled('assigned_to')) {
            $user = User::find($request->assigned_to);
            $validated['assigned_to'] = $user ? $user->name : null;
        }

        ExecutiveOrder::create(array_merge($validated, ['file_path' => $filePath]));

        return redirect()->route('executive-order.index')
            ->with('success', 'Executive Order created successfully!');
    }

    public function show($id)
    {
        $eo = ExecutiveOrder::findOrFail($id);
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        $headers = [
            ['id' => 1, 'name' => 'ORIGINATING DEPARTMENT'],
            ['id' => 2, 'name' => 'EO NO.'],
        ];

        return Inertia::render('Orders/ExecutiveOrder/Show', [
            'eo' => [
                'id' => $eo->id,
                'eo_no' => $eo->eo_no,
                'originating_department' => $eo->originating_department,
                'title' => $eo->title,
                'date_issued' => $eo->date_issued?->format('Y-m-d'),
                'status' => $eo->status,
                'remarks' => $eo->remarks,
                'assigned_to' => $eo->assigned_to,
                'file_path' => $eo->file_path
                    ? Storage::disk('r2')->url($eo->file_path) . '?v=' . md5($eo->file_path . $eo->updated_at->timestamp)
                    : null,
                // Optional: include values array for compatibility
                'headers' => $headers,
                'values' => [
                    ['order_header_id' => 1, 'value' => $eo->originating_department],
                    // ... other values
                ],
            ],
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified reeource.
     */
    public function edit(string $id)
    {
        $eo = ExecutiveOrder::findOrFail($id);
        $users = User::select('id', 'name')->get();
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        return Inertia::render('Orders/ExecutiveOrder/Edit', [
            'eo' => $eo,
            'role' => $role,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified reeource in storage.
     */
    public function update(Request $request, string $id)
    {
        $eo = ExecutiveOrder::findOrFail($id);

        // Debug logging
        \Log::info('Executive Order Update Request', [
            'id' => $id,
            'has_file' => $request->hasFile('file'),
            'file_name' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : null,
            'all_input' => $request->all(),
            'files' => $request->allFiles()
        ]);

        $validated = $request->validate([
            'originating_department' => ['required', 'string', 'max:255'],
            'eo_no'                  => ['required', 'string', 'max:100'],
            'title'                  => ['required', 'string'],
            'date_issued'            => ['required', 'date'],
            'status'                 => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed', 'Archived'])],
            'remarks'                => ['nullable', 'string'],
            'file'                   => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
            'assigned_to'            => ['nullable', 'string', 'max:255'],
        ]);

        $filePath = $eo->file_path; // Keep existing file by default

        // Only process file if a new file is uploaded
        if ($request->hasFile('file')) {
            \Log::info('Processing file upload for Executive Order', [
                'id' => $id,
                'file_name' => $request->file('file')->getClientOriginalName(),
                'file_size' => $request->file('file')->getSize()
            ]);

            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $eoSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['eo_no']));
            $eoSlug = trim($eoSlug, '-');
            $filename = 'eo-' . $eoSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type.']);
            }

            $disk = 'r2';
            try {
                // Delete old file if exists
                if ($eo->file_path && Storage::disk('r2')->exists($eo->file_path)) {
                    Storage::disk('r2')->delete($eo->file_path);
                }

                $filePath = $file->storeAs('eo_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File update to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload new file.']);
            }
        }

        // Update the record with validated data and file path
        $updateData = $validated;
        $updateData['file_path'] = $filePath;

        $eo->update($updateData);

        return redirect()->route('executive-order.index')
            ->with('success', 'Executive Order updated successfully!');
    }

    public function previewFile(string $id)
    {
        $eo = ExecutiveOrder::findOrFail($id);

        if (!$eo->file_path) {
            abort(404);
        }

        if (!Storage::disk('r2')->exists($eo->file_path)) {
            abort(404);
        }

        $file = Storage::disk('r2')->get($eo->file_path);
        $mimeType = Storage::disk('r2')->mimeType($eo->file_path);
        $filename = basename($eo->file_path);

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline; filename="' . $filename . '"');
    }


    /**
     * Remove the specified reeource from storage.
     */
    public function destroy(string $id)
    {
        $eo = ExecutiveOrder::findOrFail($id);

        // Delete file from R2 if exists
        if ($eo->file_path) {
            try {
                Storage::disk('r2')->delete($eo->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $eo->delete();

        return redirect()->route('executive-order.index')
            ->with('success', 'Executive Order deleted successfully!');
    }
}
