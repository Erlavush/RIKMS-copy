<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $abbreviation
 * @property string|null $region
 * @property string $type
 * @property string|null $description
 * @property string|null $contact_email
 * @property string|null $phone
 * @property string|null $website
 * @property string|null $address
 * @property bool $is_active
 * @property array<string, mixed>|null $settings
 * @property int $publications_count
 * @property int|null $latest_publication_year
 * @property-read Collection<int, User> $users
 * @property-read Collection<int, Document> $documents
 */
class Agency extends Model
{
    protected $fillable = [
        'name', 'abbreviation', 'region', 'type', 'description', 'contact_email',
        'phone', 'website', 'address', 'is_active', 'settings',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'settings' => 'array'];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function abbreviation(): string
    {
        if ($this->abbreviation) {
            return $this->abbreviation;
        }

        $known = [
            'Department of Science and Technology' => 'DOST XI',
            'Commission on Higher Education' => 'CHED XI',
            'National Economic and Development Authority' => 'NEDA XI',
            'Department of Trade and Industry' => 'DTI XI',
            'Department of Information and Communications Technology' => 'DICT XI',
            'University of Southeastern Philippines' => 'USeP',
            'Regional Health Research and Development Consortium' => 'RHRDC XI',
            'Davao Region Industry Energy and Emerging Technology' => 'DRIEERDC',
            'Southern Mindanao Agriculture Aquatic and Natural Resources' => 'SMAARRDEC',
        ];
        foreach ($known as $name => $abbreviation) {
            if (str_contains($this->name, $name)) {
                return $abbreviation;
            }
        }

        return str($this->name)
            ->replace(['-', '–'], ' ')
            ->explode(' ')
            ->filter(fn (string $word) => ctype_upper(substr($word, 0, 1)))
            ->map(fn (string $word) => strtoupper(substr($word, 0, 1)))
            ->take(6)
            ->join('') ?: 'AGENCY';
    }

    public function resolvedType(): string
    {
        if (str_contains($this->name, 'University') || str_contains($this->name, 'College')) {
            return 'Higher Education Institution';
        }
        if (str_contains($this->name, 'Consortium')) {
            return 'Research Consortium';
        }

        return $this->type ?: 'Government Agency';
    }
}
