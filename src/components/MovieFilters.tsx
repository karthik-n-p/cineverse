"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Filter, X, Search } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface MovieFiltersState {
  genre: string;
  language: string;
  country: string;
  sort_by: string;
}

interface MovieFiltersProps {
  genres: FilterOption[];
  languages: FilterOption[];
  countries: FilterOption[];
  filters: MovieFiltersState;
  onFilterChange: (filters: MovieFiltersState) => void;
  accentColor: string;
  isMobile: boolean;
}

// ─── Searchable Dropdown ─────────────────────────────────────

function SearchableDropdown({
  label,
  options,
  value,
  onChange,
  accent,
  placeholder = "All",
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  accent: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 border-2 border-border bg-bg-raised/60 px-3 py-2 text-[12px] text-cream transition-colors hover:border-border-light backdrop-blur-sm"
        style={{ borderColor: open ? accent + "80" : undefined }}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          size={12}
          className="shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full border-2 border-border bg-bg-raised/95 backdrop-blur-md max-h-[200px] overflow-hidden flex flex-col shadow-lg">
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
            <Search size={10} className="text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-[11px] text-cream placeholder:text-muted outline-none"
            />
          </div>
          <div className="overflow-y-auto overscroll-contain">
            <button
              onClick={() => {
                onChange("");
                setOpen(false);
                setSearch("");
              }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-muted hover:bg-bg-card transition-colors"
            >
              {placeholder}
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-bg-card"
                style={{
                  color: opt.value === value ? accent : undefined,
                  fontWeight: opt.value === value ? 600 : undefined,
                }}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-[10px] text-muted">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sort Options ────────────────────────────────────────────

const SORT_OPTIONS: FilterOption[] = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "revenue.desc", label: "Highest Revenue" },
  { value: "vote_count.desc", label: "Most Voted" },
];

// ─── Main Component ──────────────────────────────────────────

export default function MovieFilters({
  genres,
  languages,
  countries,
  filters,
  onFilterChange,
  accentColor,
  isMobile,
}: MovieFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleChange = useCallback(
    (key: keyof MovieFiltersState, value: string) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange]
  );

  const activeCount = [filters.genre, filters.language, filters.country].filter(
    Boolean
  ).length;

  const filterContent = (
    <div className="flex flex-col gap-3">
      {/* Genre Chips */}
      <div>
        <label className="block text-[10px] text-muted uppercase tracking-wider mb-1.5">
          Genre
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleChange("genre", "")}
            className="px-2.5 py-1 text-[10px] border transition-all"
            style={{
              borderColor: !filters.genre ? accentColor : "rgba(255,255,255,0.15)",
              backgroundColor: !filters.genre ? accentColor + "20" : "transparent",
              color: !filters.genre ? accentColor : "rgba(255,255,255,0.6)",
            }}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g.value}
              onClick={() => handleChange("genre", g.value)}
              className="px-2.5 py-1 text-[10px] border transition-all"
              style={{
                borderColor:
                  filters.genre === g.value
                    ? accentColor
                    : "rgba(255,255,255,0.15)",
                backgroundColor:
                  filters.genre === g.value ? accentColor + "20" : "transparent",
                color:
                  filters.genre === g.value
                    ? accentColor
                    : "rgba(255,255,255,0.6)",
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language Dropdown */}
      <SearchableDropdown
        label="Language"
        options={languages}
        value={filters.language}
        onChange={(v) => handleChange("language", v)}
        accent={accentColor}
        placeholder="All Languages"
      />

      {/* Country Dropdown */}
      <SearchableDropdown
        label="Country"
        options={countries}
        value={filters.country}
        onChange={(v) => handleChange("country", v)}
        accent={accentColor}
        placeholder="All Countries"
      />

      {/* Sort */}
      <div>
        <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">
          Sort By
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleChange("sort_by", s.value)}
              className="px-2.5 py-1 text-[10px] border transition-all"
              style={{
                borderColor:
                  filters.sort_by === s.value
                    ? accentColor
                    : "rgba(255,255,255,0.15)",
                backgroundColor:
                  filters.sort_by === s.value
                    ? accentColor + "20"
                    : "transparent",
                color:
                  filters.sort_by === s.value
                    ? accentColor
                    : "rgba(255,255,255,0.6)",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear All */}
      {activeCount > 0 && (
        <button
          onClick={() =>
            onFilterChange({
              genre: "",
              language: "",
              country: "",
              sort_by: "popularity.desc",
            })
          }
          className="self-start flex items-center gap-1 text-[10px] transition-colors hover:text-cream"
          style={{ color: accentColor }}
        >
          <X size={10} />
          Clear all filters
        </button>
      )}
    </div>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <>
        {/* Floating filter button */}
        <button
          onClick={() => setOpen(!open)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-4 py-2.5 border-2 border-border bg-bg-raised/90 backdrop-blur-md shadow-lg transition-transform active:scale-95"
          style={{
            borderColor: activeCount > 0 ? accentColor : undefined,
          }}
        >
          <Filter size={14} style={{ color: accentColor }} />
          <span className="text-[11px] text-cream font-medium">Filters</span>
          {activeCount > 0 && (
            <span
              className="ml-1 px-1.5 py-0.5 text-[9px] font-bold text-black"
              style={{ backgroundColor: accentColor }}
            >
              {activeCount}
            </span>
          )}
        </button>

        {/* Bottom sheet overlay */}
        {open && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 bg-bg-raised/95 backdrop-blur-md border-t-2 border-border p-4 pb-8 max-h-[70vh] overflow-y-auto animate-[slide-up_0.3s_ease-out]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] text-cream font-semibold tracking-wide">
                  FILTER MOVIES
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-muted hover:text-cream transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              {filterContent}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: inline panel
  return (
    <div className="border-2 border-border bg-bg-raised/60 backdrop-blur-sm p-3">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: accentColor }}
        >
          Filter Movies
        </h3>
        {activeCount > 0 && (
          <span
            className="px-1.5 py-0.5 text-[9px] font-bold text-black"
            style={{ backgroundColor: accentColor }}
          >
            {activeCount} active
          </span>
        )}
      </div>
      {filterContent}
    </div>
  );
}
