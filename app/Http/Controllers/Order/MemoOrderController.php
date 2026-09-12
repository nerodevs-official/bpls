<?php

namespace App\Http\Controllers\Order;

use App\Models\User;
use Inertia\Inertia;
use App\Models\Memo_Model;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Redirect;

class MemoOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
  public function index(Request $request)
{
    // Get filter inputs
    $search = $request->input('search', '');
    $departmentFilter = $request->input('department', '');
    $statusFilter = $request->input('status', '');
    $perPage = $request->input('per_page', 15);
    $sortField = $request->input('sort_field', 'created_at');
    $sortDirection = $request->input('sort_direction', 'desc');

    // 🔐 Get user info
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
    $query = Memo_Model::query();

    // Apply search
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('originating_department', 'like', "%{$search}%")
                ->orWhere('memo_no', 'like', "%{$search}%")
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
    $allowedSortFields = ['originating_department', 'memo_no', 'subject', 'date_issued', 'status', 'assigned_to', 'file_path', 'created_at'];
    $validSortField = in_array($sortField, $allowedSortFields) ? $sortField : 'created_at';
    $validSortDirection = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'desc';

    // Get unique departments
    $allDepartments = Memo_Model::distinct()
        ->pluck('originating_department')
        ->filter()
        ->values();

    // Paginate results
    $paginated = $query->orderBy($validSortField, $validSortDirection)
        ->paginate($perPage)
        ->appends($request->only(['search', 'department', 'status', 'per_page', 'sort_field', 'sort_direction']));

    // Transform to expected format
    $tasks = $paginated->getCollection()->map(function ($memo) {
        $fileUrl = $memo->file_path
            ? Storage::disk('r2')->url($memo->file_path)
            : '';

        return [
            'id' => $memo->id,
            'values' => [
                ['order_header_id' => 1, 'value' => $memo->originating_department],
                ['order_header_id' => 2, 'value' => $memo->memo_no],
                ['order_header_id' => 4, 'value' => $memo->subject],
                ['order_header_id' => 6, 'value' => optional($memo->date_issued)->format('Y-m-d')],
                ['order_header_id' => 7, 'value' => $memo->status],
                ['order_header_id' => 8, 'value' => $memo->assigned_to],
                ['order_header_id' => 9, 'value' => $fileUrl],
            ],
        ];
    })->all();

    $headers = [
        ['id' => 1, 'name' => 'ORIGINATING DEPARTMENT', 'field_type' => 'text'],
        ['id' => 2, 'name' => 'MEMO NO.', 'field_type' => 'text'],
        ['id' => 4, 'name' => 'SUBJECT', 'field_type' => 'text'],
        ['id' => 6, 'name' => 'DATE ISSUED', 'field_type' => 'date'],
        ['id' => 7, 'name' => 'STATUS', 'field_type' => 'text'],
        ['id' => 8, 'name' => 'ASSIGNED TO', 'field_type' => 'text'],
        ['id' => 9, 'name' => 'LINK/PDF FILE', 'field_type' => 'file'],
    ];

    $order = [
        'id' => 1,
        'name' => 'Memo Order',
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

    return Inertia::render('Orders/MemoOrder/MoIndex', [
        'order' => $order,
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
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $users = User::select('id', 'name')->get();

        return Inertia::render('Orders/MemoOrder/MoCreate', [
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
            'memo_no'                => ['required', 'string', 'max:100'],
            'recipients'             => ['required', 'string'],
            'subject'                => ['required', 'string'],
            'date_of_effectivity'    => ['required', 'date'],
            'date_issued'            => ['required', 'date', 'after_or_equal:date_of_effectivity'],
            'status'                 => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed', 'Archived'])],
            'remarks'                => ['nullable', 'string'],
            'file'                   => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'], // 10MB
            'assigned_to'  => ['nullable', 'exists:users,id'],
        ]);

        $filePath = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $memoSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['memo_no']));
            $memoSlug = trim($memoSlug, '-');

            $filename = 'memo-' . $memoSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG are allowed.']);
            }

            $disk = app()->environment('production') ? 'r2' : 'r2';

            try {
                $filePath = $file->storeAs('memo_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File upload to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload file. Please try again.']);
            }
        }

        if ($request->filled('assigned_to')) {
            $user = User::find($request->assigned_to);
            $validated['assigned_to'] = $user ? $user->name : null;
        }

        Memo_Model::create(array_merge($validated, ['file_path' => $filePath]));

        return redirect()->route('memo-order.index')
            ->with('success', 'Memo Order created successfully!');
    }

    /**
     * Display the specified resource.
     */
    // In your controller's show() method
    public function show($id)
    {
        $memo = Memo_Model::findOrFail($id);
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();
        // Add headers if needed (for getValue fallback)
        $headers = [
            ['id' => 1, 'name' => 'ORIGINATING DEPARTMENT'],
            ['id' => 2, 'name' => 'MEMO NO.'],
            // ... other headers matching your index
        ];

        // Pass flat attributes + nested structure
        return Inertia::render('Orders/MemoOrder/MoShow', [
            'memo' => [
                'id' => $memo->id,
                'memo_no' => $memo->memo_no,
                'originating_department' => $memo->originating_department,
                'recipients' => $memo->recipients,
                'subject' => $memo->subject,
                'date_of_effectivity' => $memo->date_of_effectivity?->format('Y-m-d'),
                'date_issued' => $memo->date_issued?->format('Y-m-d'),
                'status' => $memo->status,
                'remarks' => $memo->remarks,
                'assigned_to' => $memo->assigned_to,
                'file_path' => $memo->file_path
                    ? Storage::disk('r2')->url($memo->file_path) . '?v=' . md5($memo->file_path . $memo->updated_at->timestamp)
                    : null,
                // Optional: include values array for compatibility
                'headers' => $headers,
                'values' => [
                    ['order_header_id' => 1, 'value' => $memo->originating_department],
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
        $memo = Memo_Model::findOrFail($id);
        $users = User::select('id', 'name')->get();
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        return Inertia::render('Orders/MemoOrder/MoEdit', [
            'memo' => $memo,
            'role' => $role,
            'users' => $users,
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

        $memo = Memo_Model::findOrFail($id);

        $memo->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status updated successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $memo = Memo_Model::findOrFail($id);

        $validated = $request->validate([
            'originating_department' => ['required', 'string', 'max:255'],
            'memo_no'                => ['required', 'string', 'max:100'],
            'recipients'             => ['required', 'string'],
            'subject'                => ['required', 'string'],
            'date_of_effectivity'    => ['required', 'date'],
            'date_issued'            => ['required', 'date', 'after_or_equal:date_of_effectivity'],
            'status'                 => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed', 'Archived'])],
            'remarks'                => ['nullable', 'string'],
            'file'                   => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
            'assigned_to'            => ['nullable', 'string', 'max:255'],
        ]);

        $filePath = $memo->file_path; // Keep existing file by default

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $memoSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['memo_no']));
            $memoSlug = trim($memoSlug, '-');
            $filename = 'memo-' . $memoSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type.']);
            }

            $disk = 'r2';
            try {
                // Delete old file if exists
                if ($memo->file_path && Storage::disk('r2')->exists($memo->file_path)) {
                    Storage::disk('r2')->delete($memo->file_path);
                }

                $filePath = $file->storeAs('memo_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File update to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload new file.']);
            }
        }

        $memo->update(array_merge($validated, ['file_path' => $filePath]));

        return redirect()->route('memo-order.index')
            ->with('success', 'Memo Order updated successfully!');
    }

    public function deleteFile($id)
    {
        $memo = Memo_Model::findOrFail($id);

        // Delete file from R2 if exists
        if ($memo->file_path) {
            try {
                Storage::disk('r2')->delete($memo->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $memo->update(['file_path' => null]);

        return back()->with('success', 'File deleted successfully.');
    }

    public function destroy(string $id)
    {
        $memo = Memo_Model::findOrFail($id);

        // Delete file from R2 if exists
        if ($memo->file_path) {
            try {
                Storage::disk('r2')->delete($memo->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $memo->delete();

        return redirect()->route('memo-order.index')
            ->with('success', 'Memo Order deleted successfully!');
    }
}
