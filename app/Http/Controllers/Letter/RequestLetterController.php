<?php

namespace App\Http\Controllers\Letter;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\RequestLetter;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class RequestLetterController extends Controller
{
  public function index(Request $request)
{
    $search = $request->input('search', '');
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

    $query = RequestLetter::query();

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
    $allowedSortFields = ['subject', 'title', 'status', 'time', 'start_date', 'due_date', 'assigned_to', 'file_path', 'created_at'];
    $validSortField = in_array($sortField, $allowedSortFields) ? $sortField : 'created_at';
    $validSortDirection = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'desc';

    $paginated = $query->orderBy($validSortField, $validSortDirection)
        ->paginate($perPage)
        ->appends($request->only(['search', 'status', 'per_page', 'sort_field', 'sort_direction']));

    $tasks = $paginated->getCollection()->map(function ($reply) {
        $fileUrl = '';
        if ($reply->file_path) {
            $baseUrl = Storage::disk('r2')->url($reply->file_path);
            // Add cache-busting parameter using file hash
            $fileHash = md5($reply->file_path . $reply->updated_at->timestamp);
            $fileUrl = $baseUrl . '?v=' . $fileHash;
        }

        return [
            'id' => $reply->id,
            'values' => [
                ['requestletter_header_id' => 1, 'value' => $reply->subject ?? ''],
                ['requestletter_header_id' => 2, 'value' => $reply->title ?? ''],
                ['requestletter_header_id' => 3, 'value' => $reply->status ?? ''],
                ['requestletter_header_id' => 4, 'value' => $reply->time ?? ''],
                ['requestletter_header_id' => 5, 'value' => $reply->start_date ?? ''],
                ['requestletter_header_id' => 6, 'value' => $reply->due_date ?? ''],
                ['requestletter_header_id' => 7, 'value' => $reply->assigned_to ?? ''],
                ['requestletter_header_id' => 8, 'value' => $fileUrl],
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

    $requestletter = [
        'id' => 1,
        'name' => 'Request Letter',
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

    return Inertia::render('Letters/Request/Index', [
        'requestletter' => $requestletter,
        'filters' => [
            'search' => $search,
            'status' => $statusFilter,
            'per_page' => $perPage,
            'sort_field' => $validSortField,
            'sort_direction' => $validSortDirection,
        ],
        'permissions' => $permissions,
        'role' => $role,
    ]);
}


    public function create()
    {
        $users = User::select('id', 'name')->get();

        return Inertia::render('Letters/Request/Create', [
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
            'assigned_to'  => ['nullable', 'exists:users,id'],
        ]);

        $filePath = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $requestSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['subject']));
            $requestSlug = trim($requestSlug, '-');

            $filename = 'request-' . $requestSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG are allowed.']);
            }

            $disk = app()->environment('production') ? 'r2' : 'r2';

            try {
                $filePath = $file->storeAs('request_files', $filename, $disk);
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

        RequestLetter::create(array_merge($validated, ['file_path' => $filePath]));

        return redirect()->route('requestletter.index')
            ->with('success', 'Request Letter created successfully!');
    }

    public function show($id)
    {
        $requestletter = RequestLetter::findOrFail($id);
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();


        return Inertia::render('Letters/Request/Show', [
            'requestletter' => [
                'id'         => $requestletter->id,
                'subject'    => $requestletter->subject,
                'title'      => $requestletter->title,
                'status'     => $requestletter->status,
                'time'       => $requestletter->time,
                'start_date' => $requestletter->start_date,
                'due_date'   => $requestletter->due_date,
                'assigned_to' => $requestletter->assigned_to,
                'file_path' => $requestletter->file_path
                    ? Storage::disk('r2')->url($requestletter->file_path) . '?v=' . md5($requestletter->file_path . $requestletter->updated_at->timestamp)
                    : null,
            ],
            'role' => $role,
        ]);
    }


    public function edit(string $id)
    {
        $requestletter = RequestLetter::findOrFail($id);
        $users = User::select('id', 'name')->get();
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        return Inertia::render('Letters/Request/Edit', [
            'requestletter' => $requestletter,
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

        $requestletter = RequestLetter::findOrFail($id);

        $requestletter->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status updated successfully.');
    }

    public function update(Request $request, string $id)
    {
        $requestletter = RequestLetter::findOrFail($id);

        $validated = $request->validate([
            'subject'     => ['required', 'string'],
            'title'       => ['required', 'string', 'max:255'],
            'status'      => ['required', Rule::in(['Not Started', 'Drafted', 'For Review', 'Approved', 'Rejected', 'Printed', 'Disseminated', 'Signed', 'Filed', 'Archived'])],
            'time'        => ['nullable', 'string'],
            'start_date'  => ['required', 'date'],
            'due_date'    => ['required', 'date', 'after_or_equal:start_date'],
            'file'        => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
            'assigned_to' => ['nullable', 'string', 'max:255'],
        ]);

        $filePath = $requestletter->file_path; // Keep existing file by default

        // Only process file if a new file is uploaded
        if ($request->hasFile('file')) {
            \Log::info('Processing file upload for Executive Order', [
                'id' => $id,
                'file_name' => $request->file('file')->getClientOriginalName(),
                'file_size' => $request->file('file')->getSize()
            ]);

            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $requestletterSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['subject']));
            $requestletterSlug = trim($requestletterSlug, '-');
            $filename = 'requestletter-' . $requestletterSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type.']);
            }

            $disk = 'r2';
            try {
                // Delete old file if exists
                if ($requestletter->file_path && Storage::disk('r2')->exists($requestletter->file_path)) {
                    Storage::disk('r2')->delete($requestletter->file_path);
                }

                $filePath = $file->storeAs('request_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File update to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload new file.']);
            }
        }

        // Update the record with validated data and file path
        $updateData = $validated;
        $updateData['file_path'] = $filePath;


        // ✅ Update including assigned_to name
        $requestletter->update($updateData);

        return redirect()->route('requestletter.index')
            ->with('success', 'Request Letter updated successfully!');
    }

    public function deleteFile($id)
    {
        $requestletter = RequestLetter::findOrFail($id);

        // Delete file from R2 if exists
        if ($requestletter->file_path) {
            try {
                Storage::disk('r2')->delete($requestletter->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $requestletter->update(['file_path' => null]);

        return back()->with('success', 'File deleted successfully.');
    }

    public function destroy(string $id)
    {
        $requestletter = RequestLetter::findOrFail($id);

        // Delete file from R2 if exists
        if ($requestletter->file_path) {
            try {
                Storage::disk('r2')->delete($requestletter->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $requestletter->delete();

        return redirect()->route('requestletter.index')
            ->with('success', 'Request Letter deleted successfully!');
    }
}
