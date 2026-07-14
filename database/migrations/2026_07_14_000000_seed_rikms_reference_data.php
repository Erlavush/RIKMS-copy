<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $sdgs = [
            [1, 'No Poverty', 'No Poverty', '#DC2626'],
            [2, 'Zero Hunger', 'Zero Hunger', '#D6A600'],
            [3, 'Good Health and Well-being', 'Good Health', '#22C55E'],
            [4, 'Quality Education', 'Quality Edu.', '#B91C1C'],
            [5, 'Gender Equality', 'Gender Eq.', '#F97316'],
            [6, 'Clean Water and Sanitation', 'Clean Water', '#06B6D4'],
            [7, 'Affordable and Clean Energy', 'Clean Energy', '#FACC15'],
            [8, 'Decent Work and Economic Growth', 'Decent Work', '#BE185D'],
            [9, 'Industry, Innovation and Infrastructure', 'Industry', '#F97316'],
            [10, 'Reduced Inequalities', 'Reduced Ineq.', '#EC4899'],
            [11, 'Sustainable Cities and Communities', 'Sust. Cities', '#EA580C'],
            [12, 'Responsible Consumption and Production', 'Resp. Consump.', '#B7791F'],
            [13, 'Climate Action', 'Climate', '#166534'],
            [14, 'Life Below Water', 'Life Below Water', '#2563EB'],
            [15, 'Life on Land', 'Life on Land', '#4CAF50'],
            [16, 'Peace, Justice and Strong Institutions', 'Peace & Justice', '#0F4C81'],
            [17, 'Partnerships for the Goals', 'Partnerships', '#1D4ED8'],
        ];

        DB::table('sdg_tags')->upsert(
            array_map(fn (array $sdg) => [
                'number' => $sdg[0],
                'name' => $sdg[1],
                'short_name' => $sdg[2],
                'color' => $sdg[3],
                'created_at' => $now,
                'updated_at' => $now,
            ], $sdgs),
            ['number'],
            ['name', 'short_name', 'color', 'updated_at']
        );
    }

    public function down(): void
    {
        // Reference rows may already be attached to documents. A rollback must
        // not destroy those relationships or production data.
    }
};
