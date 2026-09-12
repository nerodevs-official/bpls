<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Memo_Model;
use App\Models\ReplyLetter;
use App\Models\SpecialOrder;
use Illuminate\Http\Request;
use App\Models\RequestLetter;
use App\Models\ExecutiveOrder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Models\CommunicationTitleHousing;
use App\Models\CommunicationMiscellaneous;

class ArchiveController extends Controller
{
    public function index(Request $request)
    {
        // Helper function to generate file URL with cache-busting
        $generateFileUrl = function ($item) {
            if (!$item->file_path) {
                return null;
            }
            $baseUrl = Storage::disk('r2')->url($item->file_path);
            $timestamp = $item->updated_at ? $item->updated_at->timestamp : now()->timestamp;
            $fileHash = md5($item->file_path . $timestamp);
            return $baseUrl . '?v=' . $fileHash;
        };

        // Fetch archived data
        $executive_orders = ExecutiveOrder::where('status', 'Archived')->get()->map(function ($eo) use ($generateFileUrl) {
            $eo->file_url = $generateFileUrl($eo);
            return $eo;
        });

        $memo = Memo_Model::where('status', 'Archived')->get()->map(function ($m) use ($generateFileUrl) {
            $m->file_url = $generateFileUrl($m);
            return $m;
        });

        $special_order = SpecialOrder::where('status', 'Archived')->get()->map(function ($so) use ($generateFileUrl) {
            $so->file_url = $generateFileUrl($so);
            return $so;
        });

        $request_letter = RequestLetter::where('status', 'Archived')->get()->map(function ($rl) use ($generateFileUrl) {
            $rl->file_url = $generateFileUrl($rl);
            return $rl;
        });

        $reply_letter = ReplyLetter::where('status', 'Archived')->get()->map(function ($rpl) use ($generateFileUrl) {
            $rpl->file_url = $generateFileUrl($rpl);
            return $rpl;
        });

        $miscellaneous = CommunicationMiscellaneous::where('status', 'Archived')->get()->map(function ($misc) use ($generateFileUrl) {
            $misc->file_url = $generateFileUrl($misc);
            return $misc;
        });

        $titlehousing = CommunicationTitleHousing::where('status', 'Archived')->get()->map(function ($th) use ($generateFileUrl) {
            $th->file_url = $generateFileUrl($th);
            return $th;
        });

        return Inertia::render('Archive/Index', [
            'executive_orders' => $executive_orders,
            'memo' => $memo,
            'special_order' => $special_order,
            'request_letter' => $request_letter,
            'reply_letter' => $reply_letter,
            'miscellaneous' => $miscellaneous,
            'titlehousing' => $titlehousing,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'model' => 'required|string',
            'status' => 'required|string',
        ]);

        $modelMap = [
            'executive_orders' => ExecutiveOrder::class,
            'memo' => Memo_Model::class,
            'special_order' => SpecialOrder::class,
            'request_letter' => RequestLetter::class,
            'reply_letter' => ReplyLetter::class,
            'miscellaneous' => CommunicationMiscellaneous::class,
            'titlehousing' => CommunicationTitleHousing::class,
        ];

        if (!isset($modelMap[$validated['model']])) {
            return response()->json(['error' => 'Invalid model type.'], 400);
        }

        $modelClass = $modelMap[$validated['model']];
        $record = $modelClass::find($id);

        if (!$record) {
            return response()->json(['error' => 'Record not found.'], 404);
        }

        $record->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => ucfirst($validated['model']) . ' marked as ' . $validated['status'],
        ]);
    }
}
