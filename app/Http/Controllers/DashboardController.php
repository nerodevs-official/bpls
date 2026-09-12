<?php


namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Memo_Model;
use App\Models\SpecialOrder;
use App\Models\ExecutiveOrder;
use App\Models\RequestLetter;
use App\Models\ReplyLetter;
use App\Models\CommunicationMiscellaneous;
use App\Models\CommunicationTitleHousing;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $userName = $user->name;
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        $role = $user->roles->pluck('name')->first();
        
        // Determine capabilities based on role and permissions
        $hasPermission = function($permission) use ($permissions) {
            return in_array($permission, $permissions);
        };
        
        // Check if user has any viewing permissions (to show sections)
        $hasAnyViewPermission = !empty($permissions);
        
        // Determine what the user can view/create based on permissions and role
        // Admin and Manager typically have full access, regular users have limited access
        $isAdmin = $role === 'admin';
        $isManager = $role === 'manager';

         // Get role distribution
     $roleDistribution = [
        'admin' => [
            'count' => User::whereHas('roles', function($q) { $q->where('name', 'admin'); })->count(),
            'assigned_tasks' => $this->getTasksAssignedToRole('admin'),
            'users' => User::whereHas('roles', function($q) { $q->where('name', 'admin'); })->pluck('name')->toArray(),
        ],
        'drafter' => [
            'count' => User::whereHas('roles', function($q) { $q->where('name', 'drafter'); })->count(),
            'assigned_tasks' => $this->getTasksAssignedToRole('drafter'),
            'users' => User::whereHas('roles', function($q) { $q->where('name', 'drafter'); })->pluck('name')->toArray(),
        ],
        'reviewer' => [
            'count' => User::whereHas('roles', function($q) { $q->where('name', 'reviewer'); })->count(),
            'assigned_tasks' => $this->getTasksAssignedToRole('reviewer'),
            'users' => User::whereHas('roles', function($q) { $q->where('name', 'reviewer'); })->pluck('name')->toArray(),
        ],
        'messenger' => [
            'count' => User::whereHas('roles', function($q) { $q->where('name', 'messenger'); })->count(),
            'assigned_tasks' => $this->getTasksAssignedToRole('messenger'),
            'users' => User::whereHas('roles', function($q) { $q->where('name', 'messenger'); })->pluck('name')->toArray(),
        ],
        'archiver' => [
            'count' => User::whereHas('roles', function($q) { $q->where('name', 'archiver'); })->count(),
            'assigned_tasks' => $this->getTasksAssignedToRole('archiver'),
            'users' => User::whereHas('roles', function($q) { $q->where('name', 'archiver'); })->pluck('name')->toArray(),
        ],
    ];
            
            // Capabilities - what sections/modules the user can access
            $capabilities = [
                'can_view_orders' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_memo_orders' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_special_orders' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_executive_orders' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_letters' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_request_letters' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_reply_letters' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_communications' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_miscellaneous' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_view_title_housing' => $isAdmin || $isManager || $hasAnyViewPermission,
                'can_manage_users' => $hasPermission('manage users'),
                'can_create_memo_order' => $isAdmin || $isManager,
                'can_create_special_order' => $isAdmin || $isManager,
                'can_create_executive_order' => $isAdmin || $isManager,
                'can_create_request_letter' => $isAdmin || $isManager,
                'can_create_reply_letter' => $isAdmin || $isManager,
                'can_create_miscellaneous' => $isAdmin || $isManager,
                'can_create_title_housing' => $isAdmin || $isManager,
            ];
            
            // Get permission-based status filter
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
                ];
            
            $allowedStatuses = collect($permissions)
                ->map(fn($p) => $permissionMap[$p] ?? null)
                ->filter()
                ->values()
                ->toArray();
            
            // Helper function to apply permission filtering
            $applyPermissionFilter = function($query) use ($allowedStatuses, $isAdmin, $isManager) {
                // Admin and Manager can see all, others are filtered by status permissions
                if ($isAdmin || $isManager) {
                    return $query;
                }
                if (!empty($allowedStatuses)) {
                    return $query->whereIn('status', $allowedStatuses);
                }
                return $query->whereRaw('1 = 0');
            };
            
            // Get statistics for Orders (only if user can view them)
            $memoOrderStats = $capabilities['can_view_memo_orders'] ? [
                'total' => $applyPermissionFilter(Memo_Model::query())->count(),
                'for_review' => $applyPermissionFilter(Memo_Model::query())->where('status', 'For Review')->count(),
                'assigned_to_me' => $applyPermissionFilter(Memo_Model::query())->where('assigned_to', $userName)->count(),
            ] : null;
            
            $specialOrderStats = $capabilities['can_view_special_orders'] ? [
                'total' => $applyPermissionFilter(SpecialOrder::query())->count(),
                'for_review' => $applyPermissionFilter(SpecialOrder::query())->where('status', 'For Review')->count(),
                'assigned_to_me' => $applyPermissionFilter(SpecialOrder::query())->where('assigned_to', $userName)->count(),
            ] : null;
            
            $executiveOrderStats = $capabilities['can_view_executive_orders'] ? [
                'total' => $applyPermissionFilter(ExecutiveOrder::query())->count(),
                'for_review' => $applyPermissionFilter(ExecutiveOrder::query())->where('status', 'For Review')->count(),
                'assigned_to_me' => $applyPermissionFilter(ExecutiveOrder::query())->where('assigned_to', $userName)->count(),
            ] : null;
            
            // Get statistics for Letters (only if user can view them)
            $requestLetterStats = $capabilities['can_view_request_letters'] ? [
                'total' => $applyPermissionFilter(RequestLetter::query())->count(),
                'for_review' => $applyPermissionFilter(RequestLetter::query())->where('status', 'For Review')->count(),
                'assigned_to_me' => $applyPermissionFilter(RequestLetter::query())->where('assigned_to', $userName)->count(),
            ] : null;
            
            $replyLetterStats = $capabilities['can_view_reply_letters'] ? [
                'total' => $applyPermissionFilter(ReplyLetter::query())->count(),
                'for_review' => $applyPermissionFilter(ReplyLetter::query())->where('status', 'For Review')->count(),
                'assigned_to_me' => $applyPermissionFilter(ReplyLetter::query())->where('assigned_to', $userName)->count(),
            ] : null;
            
            // Get statistics for Communications (only if user can view them)
            $miscellaneousStats = $capabilities['can_view_miscellaneous'] ? [
                'total' => $applyPermissionFilter(CommunicationMiscellaneous::query())->count(),
                'for_review' => $applyPermissionFilter(CommunicationMiscellaneous::query())->where('status', 'For Review')->count(),
                'assigned_to_me' => $applyPermissionFilter(CommunicationMiscellaneous::query())->where('assigned_to', $userName)->count(),
            ] : null;
            
            $titleHousingStats = $capabilities['can_view_title_housing'] ? [
                'total' => $applyPermissionFilter(CommunicationTitleHousing::query())->count(),
                'for_review' => $applyPermissionFilter(CommunicationTitleHousing::query())->where('status', 'For Review')->count(),
                'assigned_to_me' => $applyPermissionFilter(CommunicationTitleHousing::query())->where('assigned_to', $userName)->count(),
            ] : null;
            
            // Get recent items (latest 5 from each category) - only if user can view them
            $recentMemoOrders = $capabilities['can_view_memo_orders'] 
                ? $applyPermissionFilter(Memo_Model::query())
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'memo_no', 'subject', 'status', 'date_issued', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->memo_no,
                            'subject' => $item->subject,
                            'status' => $item->status,
                            'date' => $item->date_issued?->format('Y-m-d'),
                            'created_at' => $item->created_at->format('Y-m-d H:i'),
                        ];
                    }) 
                : collect([]);
            
            $recentSpecialOrders = $capabilities['can_view_special_orders']
                ? $applyPermissionFilter(SpecialOrder::query())
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'so_no', 'subject', 'status', 'date_issued', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->so_no,
                            'subject' => $item->subject,
                            'status' => $item->status,
                            'date' => $item->date_issued?->format('Y-m-d'),
                            'created_at' => $item->created_at->format('Y-m-d H:i'),
                        ];
                    })
                : collect([]);
            
            $recentExecutiveOrders = $capabilities['can_view_executive_orders']
                ? $applyPermissionFilter(ExecutiveOrder::query())
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'eo_no', 'title', 'status', 'date_issued', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->eo_no,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->date_issued?->format('Y-m-d'),
                            'created_at' => $item->created_at->format('Y-m-d H:i'),
                        ];
                    })
                : collect([]);
            
            $recentRequestLetters = $capabilities['can_view_request_letters']
                ? $applyPermissionFilter(RequestLetter::query())
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'subject', 'title', 'status', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->subject,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->created_at->format('Y-m-d'),
                            'created_at' => $item->created_at->format('Y-m-d H:i'),
                        ];
                    })
                : collect([]);
            
            $recentReplyLetters = $capabilities['can_view_reply_letters']
                ? $applyPermissionFilter(ReplyLetter::query())
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'subject', 'title', 'status', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->subject,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->created_at->format('Y-m-d'),
                            'created_at' => $item->created_at->format('Y-m-d H:i'),
                        ];
                    })
                : collect([]);
            
            $recentMiscellaneous = $capabilities['can_view_miscellaneous']
                ? $applyPermissionFilter(CommunicationMiscellaneous::query())
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'subject', 'title', 'status', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->subject,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->created_at->format('Y-m-d'),
                            'created_at' => $item->created_at->format('Y-m-d H:i'),
                        ];
                    })
                : collect([]);
            
            $recentTitleHousing = $capabilities['can_view_title_housing']
                ? $applyPermissionFilter(CommunicationTitleHousing::query())
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'subject', 'title', 'status', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->subject,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->created_at->format('Y-m-d'),
                            'created_at' => $item->created_at->format('Y-m-d H:i'),
                        ];
                    })
                : collect([]);
            
            // Get items assigned to me (only if user can view that type)
            $assignedToMe = [];
            
            if ($capabilities['can_view_memo_orders']) {
                $assignedToMe['memo_orders'] = $applyPermissionFilter(Memo_Model::query())
                    ->where('assigned_to', $userName)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'memo_no', 'subject', 'status', 'date_issued', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->memo_no,
                            'subject' => $item->subject,
                            'status' => $item->status,
                            'date' => $item->date_issued?->format('Y-m-d'),
                            'type' => 'Memo Order',
                        ];
                    });
            }
            
            if ($capabilities['can_view_special_orders']) {
                $assignedToMe['special_orders'] = $applyPermissionFilter(SpecialOrder::query())
                    ->where('assigned_to', $userName)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'so_no', 'subject', 'status', 'date_issued', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->so_no,
                            'subject' => $item->subject,
                            'status' => $item->status,
                            'date' => $item->date_issued?->format('Y-m-d'),
                            'type' => 'Special Order',
                        ];
                    });
            }
            
            if ($capabilities['can_view_executive_orders']) {
                $assignedToMe['executive_orders'] = $applyPermissionFilter(ExecutiveOrder::query())
                    ->where('assigned_to', $userName)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'eo_no', 'title', 'status', 'date_issued', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->eo_no,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->date_issued?->format('Y-m-d'),
                            'type' => 'Executive Order',
                        ];
                    });
            }
            
            if ($capabilities['can_view_request_letters']) {
                $assignedToMe['request_letters'] = $applyPermissionFilter(RequestLetter::query())
                    ->where('assigned_to', $userName)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'subject', 'title', 'status', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->subject,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->created_at->format('Y-m-d'),
                            'type' => 'Request Letter',
                        ];
                    });
            }
            
            if ($capabilities['can_view_reply_letters']) {
                $assignedToMe['reply_letters'] = $applyPermissionFilter(ReplyLetter::query())
                    ->where('assigned_to', $userName)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'subject', 'title', 'status', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->subject,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->created_at->format('Y-m-d'),
                            'type' => 'Reply Letter',
                        ];
                    });
            }
            
            if ($capabilities['can_view_miscellaneous']) {
                $assignedToMe['miscellaneous'] = $applyPermissionFilter(CommunicationMiscellaneous::query())
                    ->where('assigned_to', $userName)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'subject', 'title', 'status', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->subject,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->created_at->format('Y-m-d'),
                            'type' => 'Miscellaneous',
                        ];
                    });
            }
            
            if ($capabilities['can_view_title_housing']) {
                $assignedToMe['title_housing'] = $applyPermissionFilter(CommunicationTitleHousing::query())
                    ->where('assigned_to', $userName)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'subject', 'title', 'status', 'created_at'])
                    ->map(function($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->subject,
                            'subject' => $item->title,
                            'status' => $item->status,
                            'date' => $item->created_at->format('Y-m-d'),
                            'type' => 'Title Housing',
                        ];
                    });
            }
            
            // Flatten and merge all assigned items, sort by created_at
            $allAssignedToMe = collect($assignedToMe)->flatten(1)->sortByDesc('date')->values()->take(10)->toArray();
            
            // Calculate totals only for visible stats
            $ordersTotal = ($memoOrderStats ? $memoOrderStats['total'] : 0) + 
                        ($specialOrderStats ? $specialOrderStats['total'] : 0) + 
                        ($executiveOrderStats ? $executiveOrderStats['total'] : 0);
            
            $lettersTotal = ($requestLetterStats ? $requestLetterStats['total'] : 0) + 
                            ($replyLetterStats ? $replyLetterStats['total'] : 0);
            
            $communicationsTotal = ($miscellaneousStats ? $miscellaneousStats['total'] : 0) + 
                                ($titleHousingStats ? $titleHousingStats['total'] : 0);
            
        
                                // Get role distribution
        //               $roleDistribution = [
        //     'admin' => User::whereHas('roles', function($q) { $q->where('name', 'admin'); })->count(),
        //     'manager' => User::whereHas('roles', function($q) { $q->where('name', 'drafter'); })->count(),
        //     'staff' => User::whereHas('roles', function($q) { $q->where('name', 'reviewer'); })->count(),
        //     'viewer' => User::whereHas('roles', function($q) { $q->where('name', 'messenger'); })->count(),
        //     'viewer' => User::whereHas('roles', function($q) { $q->where('name', 'archiver'); })->count(),
        // ];
            
            return Inertia::render('Dashboard', [
                
                'permissions' => $permissions,
                'role' => $role,
                'capabilities' => $capabilities,
                'stats' => [
                    'orders' => [
                        'memo_order' => $memoOrderStats,
                        'special_order' => $specialOrderStats,
                        'executive_order' => $executiveOrderStats,
                        'total' => $ordersTotal,
                    ],
                    'letters' => [
                        'request_letter' => $requestLetterStats,
                        'reply_letter' => $replyLetterStats,
                        'total' => $lettersTotal,
                    ],
                    'communications' => [
                        'miscellaneous' => $miscellaneousStats,
                        'title_housing' => $titleHousingStats,
                        'total' => $communicationsTotal,
                    ],
                ],
                'recent' => [
                    'memo_orders' => $recentMemoOrders->toArray(),
                    'special_orders' => $recentSpecialOrders->toArray(),
                    'executive_orders' => $recentExecutiveOrders->toArray(),
                    'request_letters' => $recentRequestLetters->toArray(),
                    'reply_letters' => $recentReplyLetters->toArray(),
                    'miscellaneous' => $recentMiscellaneous->toArray(),
                    'title_housing' => $recentTitleHousing->toArray(),
                ],
                'assigned_to_me' => $allAssignedToMe,
                'user_name' => $userName,
                'role_distribution' => $roleDistribution, // Add this line
            ]);
    }

private function getTasksAssignedToRole($roleName)
{
    // Get all users with this role
    $usersInRole = User::whereHas('roles', function($q) use ($roleName) {
        $q->where('name', $roleName);
    })->pluck('name')->toArray();

    if (empty($usersInRole)) {
        return 0;
    }

    // Count tasks assigned to users in this role across all document types
    $totalTasks = 0;
    
    // Memo Orders
    $totalTasks += Memo_Model::whereIn('assigned_to', $usersInRole)->count();
    
    // Special Orders
    $totalTasks += SpecialOrder::whereIn('assigned_to', $usersInRole)->count();
    
    // Executive Orders
    $totalTasks += ExecutiveOrder::whereIn('assigned_to', $usersInRole)->count();
    
    // Request Letters
    $totalTasks += RequestLetter::whereIn('assigned_to', $usersInRole)->count();
    
    // Reply Letters
    $totalTasks += ReplyLetter::whereIn('assigned_to', $usersInRole)->count();
    
    // Miscellaneous
    $totalTasks += CommunicationMiscellaneous::whereIn('assigned_to', $usersInRole)->count();
    
    // Title Housing
    $totalTasks += CommunicationTitleHousing::whereIn('assigned_to', $usersInRole)->count();

    return $totalTasks;
}


}
