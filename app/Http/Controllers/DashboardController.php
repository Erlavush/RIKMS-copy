<?php

namespace App\Http\Controllers;

use App\Models\Document;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = Document::query()->with(['metadata', 'sdgTags']);

        if ($user->role !== 'super_admin') {
            $query->where(function ($q) use ($user) {
                $q->where('status', 'published')
                  ->orWhere('agency_id', $user->agency_id);
            });
        }

        $recentDocuments = $query->latest('updated_at')
            ->take(3)
            ->get();

        $agencyId = $user->agency_id;

        return view('dashboard', [
            'stats' => [
                ['value' => Document::query()->where('agency_id', $agencyId)->count(), 'label' => 'Total Research', 'icon' => 'file'],
                ['value' => Document::query()->where('agency_id', $agencyId)->where('status', 'draft')->count(), 'label' => 'Draft Research', 'icon' => 'edit'],
                ['value' => Document::query()->where('agency_id', $agencyId)->where('status', 'published')->count(), 'label' => 'Published', 'icon' => 'check'],
                ['value' => \App\Models\AccessRequest::query()->whereHas('document', function ($q) use ($agencyId) {
                    $q->where('agency_id', $agencyId);
                })->where('status', 'pending')->count(), 'label' => 'Pending Requests', 'icon' => 'inbox'],
            ],
            'recentDocuments' => $recentDocuments,
        ]);
    }
}
