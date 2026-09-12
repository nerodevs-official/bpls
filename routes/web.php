<?php

use App\Http\Controllers\ArchiveController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Order\MemoOrderController;
use App\Http\Controllers\Communication\TitleHousing;
use App\Http\Controllers\Communication\Miscellaneous;
use App\Http\Controllers\Letter\ReplyLetterController;
use App\Http\Controllers\Order\SpecialOrderController;
use App\Http\Controllers\Letter\RequestLetterController;
use App\Http\Controllers\Order\ExecutiveOrderController;
use App\Http\Controllers\FirebaseTokenController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;



// Route::get('/', function () {
//     return Inertia::render('Welcome');
// });

    Route::get('/', [AuthenticatedSessionController::class, 'create']);


Route::middleware('auth')->get('/firebase-token', FirebaseTokenController::class);

// routes/web.php or routes/api.php
Route::get('/health', function () {
    return response()->json(['status' => 'ok'], 200);
});



Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('auth')->name('dashboard');


Route::middleware('auth')->group(function () {
    Route::put('/memo-order/{id}', [MemoOrderController::class, 'update'])->name('memo-order.update');

    Route::get('/eo/file/{id}', [ExecutiveOrderController::class, 'previewFile'])
        ->name('executive-order.file');

    Route::resource('order/memo-order', MemoOrderController::class);
    Route::put('/memo-order/{id}/update-status', [MemoOrderController::class, 'updateStatus'])
        ->name('memo-order.update-status');
    Route::delete('/memo-order/{id}/delete-file', [MemoOrderController::class, 'deleteFile'])
        ->name('memo-order.delete-file');

    Route::resource('order/special-order', SpecialOrderController::class);
    Route::put('/special-order/{id}/update-status', [SpecialOrderController::class, 'updateStatus'])
        ->name('special-order.update-status');
    Route::delete('/special-order/{id}/delete-file', [SpecialOrderController::class, 'deleteFile'])
        ->name('special-order.delete-file');

    Route::resource('order/executive-order', ExecutiveOrderController::class);
    Route::put('/executive-order/{id}/update-status', [ExecutiveOrderController::class, 'updateStatus'])
        ->name('executive-order.update-status');
    Route::delete('/executive-order/{id}/delete-file', [ExecutiveOrderController::class, 'deleteFile'])
        ->name('executive-order.delete-file');

    Route::resource('letter/replyletter', ReplyLetterController::class);
    Route::put('/replyletter/{id}/update-status', [ReplyLetterController::class, 'updateStatus'])
        ->name('replyletter.update-status');
    Route::delete('/replyletter/{id}/delete-file', [ReplyLetterController::class, 'deleteFile'])
        ->name('replyletter.delete-file');

    Route::resource('letter/requestletter', RequestLetterController::class);
    Route::put('/requestletter/{id}/update-status', [RequestLetterController::class, 'updateStatus'])
        ->name('requestletter.update-status');
    Route::delete('/requestletter/{id}/delete-file', [RequestLetterController::class, 'deleteFile'])
        ->name('requestletter.delete-file');

    Route::resource('communication/miscellaneous', Miscellaneous::class);
    Route::put('/miscellaneous/{id}/update-status', [Miscellaneous::class, 'updateStatus'])
        ->name('miscellaneous.update-status');
    Route::delete('/miscellaneous/{id}/delete-file', [Miscellaneous::class, 'deleteFile'])
        ->name('miscellaneous.delete-file');

    Route::resource('communication/titlehousing', TitleHousing::class);
    Route::put('/titlehousing/{id}/update-status', [TitleHousing::class, 'updateStatus'])
        ->name('titlehousing.update-status');
    Route::delete('/titlehousing/{id}/delete-file', [TitleHousing::class, 'deleteFile'])
        ->name('titlehousing.delete-file');


    Route::resource('archive', ArchiveController::class);
    Route::put('/archive/{id}/update-status', [ArchiveController::class, 'updateStatus'])
        ->name('archive.update-status');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::resource('roles', RoleController::class);
    Route::resource('users', UserController::class);
});

require __DIR__ . '/auth.php';
