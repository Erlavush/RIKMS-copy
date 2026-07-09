import { useState, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Search,
  Building2,
  Calendar,
  ArrowRight,
  Download,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  SDG_DATA,
  AGENCIES,
  RESEARCH_DATA,
  RESEARCH_CATEGORIES,
} from "../data/mock-data";

const YEARS = [2025, 2024, 2023, 2022, 2021];
const MIN_YEAR = 2010;
const MAX_YEAR = 2025;

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <span className="text-sm text-[#1E3A8A]" style={{ fontWeight: 600 }}>
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#6B7280]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B7280]" />
        )}
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function CheckboxFilter({
  label,
  checked,
  onChange,
  count,
  color,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
  color?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
      />
      {color && (
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-[#6B7280] group-hover:text-[#1E3A8A] transition-colors flex-1 truncate">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-400">{count}</span>
      )}
    </label>
  );
}

function YearRangeFilter({
  fromYear,
  toYear,
  onFromChange,
  onToChange,
  onApply,
  onClear,
  isActive,
}: {
  fromYear: number;
  toYear: number;
  onFromChange: (val: number) => void;
  onToChange: (val: number) => void;
  onApply: () => void;
  onClear: () => void;
  isActive: boolean;
}) {
  const handleSliderFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val <= toYear) onFromChange(val);
  };
  const handleSliderTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val >= fromYear) onToChange(val);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs text-[#1E3A8A] mb-2" style={{ fontWeight: 600 }}>
        Custom Range
      </p>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <label className="text-xs text-[#6B7280] mb-1 block">From</label>
          <input
            type="number"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={fromYear}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) onFromChange(Math.min(v, toYear));
            }}
            className="w-full px-2 py-1.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>
        <span className="text-[#6B7280] text-xs mt-5">–</span>
        <div className="flex-1">
          <label className="text-xs text-[#6B7280] mb-1 block">To</label>
          <input
            type="number"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={toYear}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) onToChange(Math.max(v, fromYear));
            }}
            className="w-full px-2 py-1.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>
      </div>
      {/* Range Slider */}
      <div className="relative mb-3 px-0.5">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{MIN_YEAR}</span>
          <span>{MAX_YEAR}</span>
        </div>
        <div className="relative h-5">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-[#1E3A8A] rounded-full"
            style={{
              left: `${((fromYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`,
              right: `${100 - ((toYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`,
            }}
          />
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={fromYear}
            onChange={handleSliderFrom}
            className="absolute top-0 left-0 w-full h-5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1E3A8A] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1E3A8A] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          />
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={toYear}
            onChange={handleSliderTo}
            className="absolute top-0 left-0 w-full h-5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1E3A8A] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1E3A8A] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onApply}
          className="flex-1 px-3 py-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] text-xs rounded-lg hover:bg-[#1E3A8A]/20 transition-colors"
          style={{ fontWeight: 500 }}
        >
          Apply Year Range
        </button>
        {isActive && (
          <button
            onClick={onClear}
            className="text-xs text-red-500 hover:underline shrink-0"
          >
            Clear
          </button>
        )}
      </div>
      {isActive && (
        <p className="text-xs text-[#1E3A8A] mt-2 bg-[#1E3A8A]/5 rounded-md px-2 py-1">
          Range active: {fromYear} – {toYear}
        </p>
      )}
    </div>
  );
}

export function BrowseResearch() {
  const [searchParams] = useSearchParams();
  const initialSdg = searchParams.get("sdg");
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>(
    initialSdg ? [parseInt(initialSdg)] : []
  );
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);

  // Custom year range state
  const [customFromYear, setCustomFromYear] = useState(MIN_YEAR);
  const [customToYear, setCustomToYear] = useState(MAX_YEAR);
  const [yearRangeActive, setYearRangeActive] = useState(false);

  const toggleSdg = (num: number) =>
    setSelectedSdgs((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  const toggleAgency = (name: string) =>
    setSelectedAgencies((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  const toggleYear = (year: number) =>
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const filteredResearch = useMemo(() => {
    let results = [...RESEARCH_DATA];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.abstract.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.toLowerCase().includes(q)) ||
          r.authors.some((a) => a.toLowerCase().includes(q))
      );
    }

    if (selectedSdgs.length > 0) {
      results = results.filter((r) =>
        r.sdgs.some((s) => selectedSdgs.includes(s))
      );
    }

    if (selectedAgencies.length > 0) {
      results = results.filter((r) => selectedAgencies.includes(r.agency));
    }

    if (selectedYears.length > 0) {
      results = results.filter((r) => selectedYears.includes(r.year));
    }

    // Custom year range filter
    if (yearRangeActive) {
      results = results.filter(
        (r) => r.year >= customFromYear && r.year <= customToYear
      );
    }

    if (selectedCategories.length > 0) {
      results = results.filter((r) => selectedCategories.includes(r.category));
    }

    if (sortBy === "latest") {
      results.sort((a, b) => b.year - a.year);
    } else if (sortBy === "downloads") {
      results.sort((a, b) => b.downloads - a.downloads);
    }

    return results;
  }, [
    searchQuery,
    selectedSdgs,
    selectedAgencies,
    selectedYears,
    selectedCategories,
    sortBy,
    yearRangeActive,
    customFromYear,
    customToYear,
  ]);

  const activeFilterCount =
    selectedSdgs.length +
    selectedAgencies.length +
    selectedYears.length +
    selectedCategories.length +
    (yearRangeActive ? 1 : 0);

  const clearFilters = () => {
    setSelectedSdgs([]);
    setSelectedAgencies([]);
    setSelectedYears([]);
    setSelectedCategories([]);
    setYearRangeActive(false);
    setCustomFromYear(MIN_YEAR);
    setCustomToYear(MAX_YEAR);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[#1E3A8A] mb-1 text-xl sm:text-2xl" style={{ fontWeight: 700 }}>
          Browse Research
        </h1>
        <p className="text-[#6B7280]">
          Discover and explore research publications from participating agencies
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                Filters
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <FilterSection title="SDG">
              {SDG_DATA.map((sdg) => (
                <CheckboxFilter
                  key={sdg.number}
                  label={`SDG ${sdg.number}`}
                  checked={selectedSdgs.includes(sdg.number)}
                  onChange={() => toggleSdg(sdg.number)}
                  color={sdg.color}
                />
              ))}
            </FilterSection>

            <FilterSection title="Agency" defaultOpen={false}>
              {AGENCIES.map((agency) => (
                <CheckboxFilter
                  key={agency.id}
                  label={agency.abbreviation}
                  checked={selectedAgencies.includes(agency.name)}
                  onChange={() => toggleAgency(agency.name)}
                  count={agency.publications}
                />
              ))}
            </FilterSection>

            <FilterSection title="Publication Year">
              {YEARS.map((year) => (
                <CheckboxFilter
                  key={year}
                  label={String(year)}
                  checked={selectedYears.includes(year)}
                  onChange={() => toggleYear(year)}
                />
              ))}
              <YearRangeFilter
                fromYear={customFromYear}
                toYear={customToYear}
                onFromChange={setCustomFromYear}
                onToChange={setCustomToYear}
                onApply={() => {
                  setSelectedYears([]);
                  setYearRangeActive(true);
                }}
                onClear={() => {
                  setYearRangeActive(false);
                  setCustomFromYear(MIN_YEAR);
                  setCustomToYear(MAX_YEAR);
                }}
                isActive={yearRangeActive}
              />
            </FilterSection>

            <FilterSection title="Research Category" defaultOpen={false}>
              {RESEARCH_CATEGORIES.map((cat) => (
                <CheckboxFilter
                  key={cat}
                  label={cat}
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
              ))}
            </FilterSection>
          </div>
        </aside>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowFilters(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-[#1E3A8A] text-white p-3 rounded-full shadow-lg"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Mobile Filter Drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowFilters(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#1E3A8A]" style={{ fontWeight: 600 }}>Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <FilterSection title="SDG">
                {SDG_DATA.map((sdg) => (
                  <CheckboxFilter
                    key={sdg.number}
                    label={`SDG ${sdg.number}`}
                    checked={selectedSdgs.includes(sdg.number)}
                    onChange={() => toggleSdg(sdg.number)}
                    color={sdg.color}
                  />
                ))}
              </FilterSection>
              <FilterSection title="Agency" defaultOpen={false}>
                {AGENCIES.map((agency) => (
                  <CheckboxFilter
                    key={agency.id}
                    label={agency.abbreviation}
                    checked={selectedAgencies.includes(agency.name)}
                    onChange={() => toggleAgency(agency.name)}
                    count={agency.publications}
                  />
                ))}
              </FilterSection>
              <FilterSection title="Publication Year">
                {YEARS.map((year) => (
                  <CheckboxFilter
                    key={year}
                    label={String(year)}
                    checked={selectedYears.includes(year)}
                    onChange={() => toggleYear(year)}
                  />
                ))}
                <YearRangeFilter
                  fromYear={customFromYear}
                  toYear={customToYear}
                  onFromChange={setCustomFromYear}
                  onToChange={setCustomToYear}
                  onApply={() => {
                    setSelectedYears([]);
                    setYearRangeActive(true);
                  }}
                  onClear={() => {
                    setYearRangeActive(false);
                    setCustomFromYear(MIN_YEAR);
                    setCustomToYear(MAX_YEAR);
                  }}
                  isActive={yearRangeActive}
                />
              </FilterSection>
              <FilterSection title="Research Category" defaultOpen={false}>
                {RESEARCH_CATEGORIES.map((cat) => (
                  <CheckboxFilter
                    key={cat}
                    label={cat}
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                ))}
              </FilterSection>
            </div>
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 min-w-0">
          {/* Search & Sort Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search within results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
              >
                <option value="relevance">Relevance</option>
                <option value="latest">Latest</option>
                <option value="downloads">Most Downloaded</option>
              </select>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              Showing {filteredResearch.length} result
              {filteredResearch.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Active Filters Bar */}
          {activeFilterCount > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-6">
              <div className="flex items-center flex-wrap gap-2">
                {selectedSdgs.map((sdgNum) => {
                  const sdg = SDG_DATA.find((s) => s.number === sdgNum);
                  return (
                    <button
                      key={`sdg-${sdgNum}`}
                      onClick={() => toggleSdg(sdgNum)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-[#1E3A8A] text-xs hover:bg-gray-200 transition-colors group"
                    >
                      {sdg?.color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sdg.color }}
                        />
                      )}
                      <span>SDG {sdgNum}</span>
                      <X className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  );
                })}
                {selectedAgencies.map((agency) => {
                  const ag = AGENCIES.find((a) => a.name === agency);
                  return (
                    <button
                      key={`agency-${agency}`}
                      onClick={() => toggleAgency(agency)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-[#1E3A8A] text-xs hover:bg-gray-200 transition-colors group"
                    >
                      <span>Agency: {ag?.abbreviation || agency}</span>
                      <X className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  );
                })}
                {selectedYears.map((year) => (
                  <button
                    key={`year-${year}`}
                    onClick={() => toggleYear(year)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-[#1E3A8A] text-xs hover:bg-gray-200 transition-colors group"
                  >
                    <span>Year: {year}</span>
                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                  </button>
                ))}
                {yearRangeActive && (
                  <button
                    onClick={() => {
                      setYearRangeActive(false);
                      setCustomFromYear(MIN_YEAR);
                      setCustomToYear(MAX_YEAR);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-[#1E3A8A] text-xs hover:bg-gray-200 transition-colors group"
                  >
                    <span>Year: {customFromYear}–{customToYear}</span>
                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                  </button>
                )}
                {selectedCategories.map((cat) => (
                  <button
                    key={`cat-${cat}`}
                    onClick={() => toggleCategory(cat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-[#1E3A8A] text-xs hover:bg-gray-200 transition-colors group"
                  >
                    <span>Category: {cat}</span>
                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                  </button>
                ))}
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs text-[#1E3A8A] hover:underline shrink-0 py-1"
                  style={{ fontWeight: 500 }}
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {filteredResearch.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-[#6B7280]" style={{ fontWeight: 500 }}>
                  No research found matching your criteria
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              filteredResearch.map((research) => (
                <div
                  key={research.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap gap-2 mb-2">
                    {research.sdgs.map((sdgNum) => {
                      const sdg = SDG_DATA.find((s) => s.number === sdgNum);
                      return (
                        <span
                          key={sdgNum}
                          className="px-2 py-0.5 rounded-full text-white text-xs"
                          style={{
                            backgroundColor: sdg?.color,
                            fontWeight: 500,
                          }}
                        >
                          SDG {sdgNum}
                        </span>
                      );
                    })}
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#6B7280] text-xs">
                      {research.category}
                    </span>
                  </div>

                  <Link
                    to={`/research/${research.id}`}
                    className="text-[#1E3A8A] hover:underline block mb-1"
                    style={{ fontSize: "1.05rem", fontWeight: 600 }}
                  >
                    {research.title}
                  </Link>

                  <p className="text-xs text-[#6B7280] mb-1">
                    {research.authors.join(", ")}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-[#6B7280] mb-3">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {research.agencyAbbr}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {research.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {research.downloads.toLocaleString()} downloads
                    </span>
                  </div>

                  <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                    {research.abstract}
                  </p>

                  <div className="flex gap-3">
                    <Link
                      to={`/research/${research.id}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-[#1E3A8A] text-white text-sm rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      View Details <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button className="inline-flex items-center gap-1 px-4 py-2 border border-[#1E3A8A] text-[#1E3A8A] text-sm rounded-lg hover:bg-blue-50 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Download className="w-3 h-3" />
                      Download PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}