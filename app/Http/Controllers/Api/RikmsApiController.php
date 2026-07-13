<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

abstract class RikmsApiController extends Controller
{
    protected function paginated(LengthAwarePaginator $paginator, callable $present): JsonResponse
    {
        return response()->json([
            'data' => collect($paginator->items())->map($present)->values(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    protected function perPage(): int
    {
        return min(100, max(1, (int) request()->integer('per_page', 15)));
    }
}
