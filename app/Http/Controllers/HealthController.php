<?php

namespace App\Http\Controllers;

use App\Support\DocumentStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('select 1');
            $disk = Storage::disk(DocumentStorage::disk());
            if (! $disk->directoryExists('')) {
                $disk->makeDirectory('');
            }

            return response()->json(['status' => 'ready']);
        } catch (Throwable) {
            return response()->json(['status' => 'unavailable'], 503);
        }
    }
}
