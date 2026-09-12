<?php

namespace App\Http\Controllers\Letter;

use App\Models\User;
use Inertia\Inertia;
use App\Models\ReplyLetter;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class ReplyLetterController extends Controller
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

    $query = ReplyLetter::query();

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
                ['replyletter_header_id' => 1, 'value' => $reply->subject ?? ''],
                ['replyletter_header_id' => 2, 'value' => $reply->title ?? ''],
                ['replyletter_header_id' => 3, 'value' => $reply->status ?? ''],
                ['replyletter_header_id' => 4, 'value' => $reply->time ?? ''],
                ['replyletter_header_id' => 5, 'value' => $reply->start_date ?? ''],
                ['replyletter_header_id' => 6, 'value' => $reply->due_date ?? ''],
                ['replyletter_header_id' => 7, 'value' => $reply->assigned_to ?? ''],
                ['replyletter_header_id' => 8, 'value' => $fileUrl],
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

    $replyletter = [
        'id' => 1,
        'name' => 'Reply Letter',
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

    return Inertia::render('Letters/Reply/Index', [
        'replyletter' => $replyletter,
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

        return Inertia::render('Letters/Reply/Create', [
            'users' => $users,
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject'      => ['required', 'string'],
            'title'        => ['required', 'string', 'max:255'],
            'status'       => [
                'required',
                Rule::in([
                    'Not Started',
                    'Drafted',
                    'For Review',
                    'Approved',
                    'Rejected',
                    'Printed',
                    'Disseminated',
                    'Signed',
                    'Filed',
                    'Archived',
                ]),
            ],
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

            $replySlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['subject']));
            $replySlug = trim($replySlug, '-');

            $filename = 'reply-' . $replySlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG are allowed.']);
            }

            $disk = app()->environment('production') ? 'r2' : 'r2';

            try {
                $filePath = $file->storeAs('reply_files', $filename, $disk);
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

        ReplyLetter::create(array_merge($validated, ['file_path' => $filePath]));

        return redirect()
            ->route('replyletter.index')
            ->with('success', 'Reply Letter created successfully!');
    }




    public function show($id)
    {
        $reply = ReplyLetter::findOrFail($id);
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        return Inertia::render('Letters/Reply/Show', [
            'reply' => [
                'id'         => $reply->id,
                'subject'    => $reply->subject,
                'title'      => $reply->title,
                'status'     => $reply->status,
                'time'       => $reply->time,
                'start_date' => $reply->start_date,
                'assigned_to' => $reply->assigned_to,
                'file_path' => $reply->file_path
                    ? Storage::disk('r2')->url($reply->file_path) . '?v=' . md5($reply->file_path . $reply->updated_at->timestamp)
                    : null,
                'due_date'   => $reply->due_date,
            ],
            'role' => $role,
        ]);
    }


    public function edit(string $id)
    {
        $replyletter = ReplyLetter::findOrFail($id);
        $users = User::select('id', 'name')->get();
        $user = auth()->user();
        $role = $user->roles->pluck('name')->first();

        return Inertia::render('Letters/Reply/Edit', [
            'replyletter' => $replyletter,
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
                'Archived',
            ])]
        ]);

        $replyletter = ReplyLetter::findOrFail($id);

        $replyletter->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status updated successfully.');
    }

    public function update(Request $request, string $id)
    {
        $replyletter = ReplyLetter::findOrFail($id);

        // Debug logging
        \Log::info('Reply Letter Update Request', [
            'id' => $id,
            'has_file' => $request->hasFile('file'),
            'file_name' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : null,
            'all_input' => $request->all(),
            'files' => $request->allFiles()
        ]);

        $validated = $request->validate([
            'subject'     => ['required', 'string'],
            'title'       => ['required', 'string', 'max:255'],
            'status'      => [
                'required',
                Rule::in([
                    'Not Started',
                    'Drafted',
                    'For Review',
                    'Approved',
                    'Rejected',
                    'Printed',
                    'Disseminated',
                    'Signed',
                    'Filed',
                    'Archived',
                ]),
            ],
            'time'        => ['nullable', 'string'],
            'start_date'  => ['required', 'date'],
            'due_date'    => ['required', 'date', 'after_or_equal:start_date'],
            'file'        => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
            'assigned_to' => ['nullable', 'string', 'max:255'], // ✅ added field
        ]);

        $filePath = $replyletter->file_path; // Keep existing file by default

        // Only process file if a new file is uploaded
        if ($request->hasFile('file')) {
            \Log::info('Processing file upload for Executive Order', [
                'id' => $id,
                'file_name' => $request->file('file')->getClientOriginalName(),
                'file_size' => $request->file('file')->getSize()
            ]);

            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            $replyletterSlug = preg_replace('/[^a-z0-9_-]+/i', '-', Str::slug($validated['subject']));
            $replyletterSlug = trim($replyletterSlug, '-');
            $filename = 'replyletter-' . $replyletterSlug . '-' . Str::random(12) . '.' . $extension;

            $allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['file' => 'Invalid file type.']);
            }

            $disk = 'r2';
            try {
                // Delete old file if exists
                if ($replyletter->file_path && Storage::disk('r2')->exists($replyletter->file_path)) {
                    Storage::disk('r2')->delete($replyletter->file_path);
                }

                $filePath = $file->storeAs('reply_files', $filename, $disk);
            } catch (\Exception $e) {
                \Log::error('File update to R2 failed: ' . $e->getMessage());
                return back()->withErrors(['file' => 'Failed to upload new file.']);
            }
        }

        // Update the record with validated data and file path
        $updateData = $validated;
        $updateData['file_path'] = $filePath;


        // ✅ Update including assigned_to name
        $replyletter->update($updateData);

        return redirect()
            ->route('replyletter.index')
            ->with('success', 'Reply Letter updated successfully!');
    }

    public function previewFile(string $id)
    {
        $replyletter = ReplyLetter::findOrFail($id);

        if (!$replyletter->file_path) {
            abort(404);
        }

        if (!Storage::disk('r2')->exists($replyletter->file_path)) {
            abort(404);
        }

        $file = Storage::disk('r2')->get($replyletter->file_path);
        $mimeType = Storage::disk('r2')->mimeType($replyletter->file_path);
        $filename = basename($replyletter->file_path);

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline; filename="' . $filename . '"');
    }

    public function deleteFile($id)
    {
        $reply = ReplyLetter::findOrFail($id);

        if ($reply->file_path) {
            try {
                Storage::disk('r2')->delete($reply->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $reply->update(['file_path' => null]);

        return back()->with('success', 'File deleted successfully.');
    }

    public function destroy(string $id)
    {
        $replyletter = ReplyLetter::findOrFail($id);

        // Delete file from R2 if exists
        if ($replyletter->file_path) {
            try {
                Storage::disk('r2')->delete($replyletter->file_path);
            } catch (\Exception $e) {
                \Log::warning('Failed to delete file from R2: ' . $e->getMessage());
                // Don't fail the whole delete if file is missing
            }
        }

        $replyletter->delete();

        return redirect()->route('replyletter.index')
            ->with('success', 'Reply Letter deleted successfully!');
    }
}
