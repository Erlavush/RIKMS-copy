<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;

class DocumentAccessService
{
    public function isAdministrativeOwner(?User $user, Document $document): bool
    {
        if (! $user?->is_active) {
            return false;
        }
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->isAgencyAdmin()
            && $user->agency?->is_active === true
            && (int) $user->agency_id === (int) $document->agency_id;
    }
}
