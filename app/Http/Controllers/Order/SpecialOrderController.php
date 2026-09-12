<?php

namespace App\Http\Controllers\Order;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Str;
use App\Models\SpecialOrder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class SpecialOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */

   
// Inside your Controller class, e.g., SpecialOrderController
public function index(Request $request)
{
    // Get filter inputs
    $search = $request->input('search', '');
    $departmentFilter = $request->input('department', '');
    $statusFilter = $request->input('status', '');
    $perPage = $request->input('per_page', 15); // default 15 per page
    // Get sorting inputs
    $sortField = $request->input('sort_field', 'created_at'); // Default sort field
    $sortDirection = $request->input('sort_direction', 'desc'); // Default sort direction

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
    $query = SpecialOrder::query();

    // Apply search (on multiple fields)
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('originating_department', 'like', "%{$search}%")
                ->orWhere('so_no', 'like', "%{$search}%")
                ->orWhere('subject', 'like', "%{$search}%");
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
    // Define allowed sort fields based on your SpecialOrder model's columns
    $allowedSortFields = [
        'originating_department',
        'so_no',
        'subject',
        'date_issued',
        'status',
        'assigned_to',
        'file_path', // Assuming this maps to a column name like 'file_path' or similar
        'created_at' // Default sort field
    ];

    // Validate sort field and direction
    $validSortField = in_array($sortField, $allowedSortFields) ? $sortField : 'created_at';
    $validSortDirection = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'desc';

    // Get unique departments for filter dropdown
    $allDepartments = SpecialOrder::distinct()
        ->pluck('originating_department')
        ->filter()
        ->values();

    // Apply sorting and paginate results
    $paginated = $query->orderBy($validSortField, $validSortDirection)
        ->paginate($perPage)
        ->appends($request->only(['search', 'department', 'status', 'per_page', 'sort_field', 'sort_direction'])); // Include sort params in pagination links

    // Transform to expected format
    $tasks = $paginated->getCollection()->map(function ($so) {
        $fileUrl = $so->file_path
            ? Storage::disk('r2')->url($so->file_path)
            : '';

        return [
            'id' => $so->id,
            'values' => [
                ['so_header_id' => 1, 'value' => $so->originating_department],
                ['so_header_id' => 2, 'value' => $so->so_no],
                ['so_header_id' => 4, 'value' => $so->subject],
                ['so_header_id' => 6, 'value' => $so->date_issued ? $so->date_issued->format('Y-m-d') : ''], // Format date
                ['so_header_id' => 7, 'value' => $so->status],
                ['so_header_id' => 8, 'value' => $so->assigned_to],
                ['so_header_id' => 9, 'value' => $fileUrl],
            ],
        ];
    })->all();

    $headers = [
        ['id' => 1, 'name' => 'ORIGINATING DEPARTMENT', 'field_type' => 'text'],
        ['id' => 2, 'name' => 'SO NO.', 'field_type' => 'text'],
        ['id' => 4, 'name' => 'SUBJECT', 'field_type' => 'text'],
        ['id' => 6, 'name' => 'DATE ISSUED', 'field_type' => 'date'],
        ['id' => 7, 'name' => 'STATUS', 'field_type' => 'text'],
        ['id' => 8, 'name' => 'ASSIGNED TO', 'field_type' => 'text'],
        ['id' => 9, 'name' => 'LINK/PDF FILE', 'field_type' => 'file'],
    ];

    $so = [
        'id' => 1,
        'name' => 'Special Order',
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

    return Inertia::render('Orders/SpecialOrder/Index', [
        'so' => $so,
        'filters' => [
            'search' => $search,
            'department' => $departmentFilter,
            'status' => $statusFilter,
            'per_page' => $perPage,
            'sort_field' => $validSortField, // Pass back the validated sort field
            'sort_direction' => $validSortDirection, // Pass back the validated sort direction
        ],
        'departments' => $allDepartments,
        'permissions' => $permissions,
        'role' => $role,
    ]);
}
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $users = User::select('id', 'name')->get();

        return Inertia::render('Orders/SpecialOrder/Create', [
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'originating_department' => ['required', 'string', 'max:255'],
            'so_no'                => ['required', 'string', 'max:100'],
            'recipients'             => ['required', 'string'],
            'subject'                => ['required', 'string'],
            'amount'                 => ['required'],
            'date_issued'            => ['required', 'date'],
            'status'                 => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed', 'Archived'])],
            'remarks'                => ['nullable', 'string'],
            'file'                   => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'], // 10MB
            'assigned_to'  => ['nullable', 'exists:users,id'],
        ]);

        $filePath = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $soSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['so_no']));
            $soSlug = trim($soSlug, '-');

            $filename = 'so-' . $soSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG are allowed.']);
            }

            $disk = app()->environment('production') ? 'r2' : 'r2';

            try {
                $filePath = $file->storeAs('so_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File upload to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload file. Please try again.']);
            }
        }

        if ($request->filled('assigned_to')) {
            $user = User::find($request->assigned_to);
            $validated['assigned_to'] = $user ? $user->name : null;
        }

        SpecialOrder::create(array_merge($validated, ['file_path' => $filePath]));

        return redirect()->route('special-order.index')
            ->with('success', 'Special Order created successfully!');
    }

    public function show($id)
    {
        $so = SpecialOrder::findOrFail($id);
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        $headers = [
            ['id' => 1, 'name' => 'ORIGINATING DEPARTMENT'],
            ['id' => 2, 'name' => 'SO NO.'],
        ];

        return Inertia::render('Orders/SpecialOrder/Show', [
            'so' => [
                'id' => $so->id,
                'so_no' => $so->so_no,
                'originating_department' => $so->originating_department,
                'recipients' => $so->recipients,
                'subject' => $so->subject,
                'amount' => $so->amount,
                'date_issued' => $so->date_issued?->format('Y-m-d'),
                'status' => $so->status,
                'remarks' => $so->remarks,
                'assigned_to' => $so->assigned_to,
                'file_path' => $so->file_path
                    ? Storage::disk('r2')->url($so->file_path) . '?v=' . md5($so->file_path . $so->updated_at->timestamp)
                    : null,
                // Optional: include values array for compatibility
                'headers' => $headers,
                'values' => [
                    ['order_header_id' => 1, 'value' => $so->originating_department],
                    // ... other values
                ],

            ],
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $so = SpecialOrder::findOrFail($id);
        $user = auth()->user();
        $users = User::select('id', 'name')->get();
        $role = $user->roles->pluck('name')->first();

        return Inertia::render('Orders/SpecialOrder/Edit', [
            'so' => $so,
            'role' => $role,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $so = SpecialOrder::findOrFail($id);

        $validated = $request->validate([
            'originating_department' => ['required', 'string', 'max:255'],
            'so_no'                  => ['required', 'string', 'max:100'],
            'recipients'             => ['required', 'string'],
            'subject'                => ['required', 'string'],
            'amount'                 => ['required'],
            'date_issued'            => ['required', 'date'],
            'status'                 => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed', 'Archived'])],
            'remarks'                => ['nullable', 'string'],
            'file'                   => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
            'assigned_to'            => ['nullable', 'string', 'max:255'],
        ]);

        $filePath = $so->file_path; // Keep existing file by default

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $soSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['so_no']));
            $soSlug = trim($soSlug, '-');
            $filename = 'so-' . $soSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type.']);
            }

            $disk = 'r2';
            try {
                // Delete old file if exists
                if ($so->file_path && Storage::disk('r2')->exists($so->file_path)) {
                    Storage::disk('r2')->delete($so->file_path);
                }

                $filePath = $file->storeAs('so_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File update to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload new file.']);
            }
        }

        $so->update(array_merge($validated, ['file_path' => $filePath]));

        return redirect()->route('special-order.index')
            ->with('success', 'Special Order updated successfully!');
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

        $so = SpecialOrder::findOrFail($id);

        $so->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status updated successfully.');
    }

    public function deleteFile($id)
    {
        $so = SpecialOrder::findOrFail($id);

        if ($so->file_path) {
            try {
                Storage::disk('r2')->delete($so->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $so->update(['file_path' => null]);

        return back()->with('success', 'File deleted successfully.');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $so = SpecialOrder::findOrFail($id);

        // Delete file from R2 if exists
        if ($so->file_path) {
            try {
                Storage::disk('r2')->delete($so->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $so->delete();

        return redirect()->route('special-order.index')
            ->with('success', 'Special Order deleted successfully!');
    }
}
