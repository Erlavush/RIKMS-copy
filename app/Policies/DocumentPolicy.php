<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active && in_array($user->role, ['agency_admin', 'super_admin'], true);
    }

    public function view(User $user, Document $document): bool
    {
        return $user->isSuperAdmin() || $this->sameAgency($user, $document);
    }

    public function create(User $user): bool
    {
        return $user->is_active && $user->isAgencyAdmin();
    }

    public function update(User $user, Document $document): bool
    {
        return $user->isSuperAdmin() || $this->sameAgency($user, $document);
    }

    public function delete(User $user, Document $document): bool
    {
        return $this->update($user, $document);
    }

    public function restore(User $user, Document $document): bool
    {
        return $this->update($user, $document);
    }

    public function forceDelete(User $user, Document $document): bool
    {
        return false;
    }

    private function sameAgency(User $user, Document $document): bool
    {
        return $user->agency_id !== null && (int) $user->agency_id === (int) $document->agency_id;
    }
}
