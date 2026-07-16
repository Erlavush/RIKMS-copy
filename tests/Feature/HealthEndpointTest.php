<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_liveness_and_readiness_are_machine_readable(): void
    {
        Storage::fake('documents');
        config(['rikms.documents_disk' => 'documents']);

        $this->getJson('/up')->assertOk()->assertExactJson(['status' => 'up']);
        $this->getJson('/ready')->assertOk()->assertExactJson(['status' => 'ready']);
    }
}
