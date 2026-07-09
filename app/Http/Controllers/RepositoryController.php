<?php

namespace App\Http\Controllers;

use App\Models\Document;

class RepositoryController extends Controller
{
    public function index()
    {
        $documents = Document::query()
            ->where('status', 'published')
            ->with(['metadata', 'sdgTags', 'agency'])
            ->orderByRaw("case when title like 'Cybersecurity data science%' then 0 when title like 'Changes-in-thyroid%' then 1 when title like 'NEAR-REALTIME%' then 2 else 3 end")
            ->latest()
            ->take(6)
            ->get();

        return view('repository.index', [
            'documents' => $documents,
            'analytics' => [
                'total' => 38,
                'published' => 13,
                'sdgs_covered' => 13,
                'ai_tagged' => 37,
                'sdg_bars' => [
                    [9, 20, '#F97316'],
                    [3, 13, '#22C55E'],
                    [17, 12, '#1D4ED8'],
                    [16, 7, '#0F4C81'],
                    [8, 5, '#BE185D'],
                    [15, 5, '#4CAF50'],
                    [13, 5, '#166534'],
                    [12, 3, '#B7791F'],
                    [1, 2, '#DC2626'],
                    [2, 2, '#D6A600'],
                ],
            ],
        ]);
    }
}
