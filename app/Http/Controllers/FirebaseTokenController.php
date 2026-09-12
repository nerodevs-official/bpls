<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Kreait\Firebase\Factory;
use Illuminate\Support\Facades\Log;

class FirebaseTokenController extends Controller
{
    public function __invoke(): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = auth()->user();

        try {
            // 🔑 First, try environment variable (for Railway)
            $serviceAccountJson = env('FIREBASE_SERVICE_ACCOUNT_JSON');

            if (!empty($serviceAccountJson)) {
                // Check if it's base64 (your current value is!)
                if (base64_encode(base64_decode($serviceAccountJson, true)) === $serviceAccountJson) {
                    // It's base64 — decode it to JSON string
                    $jsonString = base64_decode($serviceAccountJson);
                } else {
                    // It's raw JSON
                    $jsonString = $serviceAccountJson;
                }

                $serviceAccount = json_decode($jsonString, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('Failed to decode service account JSON');
                    return response()->json(['error' => 'Invalid service account'], 500);
                }
            } else {
                // 🖥️ Fallback to file (local only)
                $path = storage_path('app/firebase-service-account.json');
                if (!file_exists($path)) {
                    return response()->json(['error' => 'Service account not found'], 500);
                }
                $serviceAccount = $path;
            }

            $factory = (new Factory)->withServiceAccount($serviceAccount);
            $auth = $factory->createAuth();

            $role = $user->roles->first()?->name ?? 'User';
            $name = trim($user->name) ?: explode('@', $user->email)[0];

            $token = $auth->createCustomToken((string) $user->id, [
                'name' => $name,
                'role' => $role,
            ]);

            return response()->json(['token' => $token->toString()]);

        } catch (\Exception $e) {
            Log::error('Firebase token error: ' . $e->getMessage());
            return response()->json(['error' => 'Token generation failed'], 500);
        }
    }
}