"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Check, ChevronsUpDown, MapPin, Minus, Plus, Search, X } from "lucide-react";

import { projectAlbersUsa } from "@/shared/data/albers-usa";
import { US_CITIES, type UsCity } from "@/shared/data/us-cities";
import {
  US_STATES,
  US_STATE_NAME_BY_CODE,
  US_VIEWBOX,
} from "@/shared/data/us-states-geo";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { formatMinor } from "@/shared/utils/money";

/**
 * The map's current selection. A city selection carries its state so the jobs
 * list can filter by state server-side and by city on the client. Modelled as
 * a discriminated union so "a city with no state" is unrepresentable.
 */
export type MapSelection =
  | { readonly kind: "none" }
  | { readonly kind: "state"; readonly state: string }
  | { readonly kind: "city"; readonly state: string; readonly city: string };

interface StateStat {
  readonly openRoles: number;
  readonly averageFeeMinor: number;
}

interface UsJobMapProps {
  /** Per-state aggregates from useJobMap, keyed by 2-letter code. */
  readonly stats: ReadonlyMap<string, StateStat>;
  readonly selection: MapSelection;
  readonly onSelect: (selection: MapSelection) => void;
}

/** Pre-projected city dots in the 960x600 frame; computed once at module load. */
interface PlottedCity extends UsCity {
  readonly x: number;
  readonly y: number;
}

const PLOTTED_CITIES: readonly PlottedCity[] = US_CITIES.flatMap((city) => {
  const point = projectAlbersUsa(city.lng, city.lat);
  return point ? [{ ...city, x: point.x, y: point.y }] : [];
});

/** Fill intensity for a state, scaled by its open-role count. */
function stateFill(count: number, maxCount: number, isActive: boolean): string {
  if (isActive) return "hsl(217 91% 60%)"; // primary blue
  if (count === 0 || maxCount === 0) return "hsl(215 40% 16%)"; // muted navy
  const t = Math.min(1, count / maxCount);
  const lightness = 20 + t * 22; // 20% -> 42%
  return `hsl(217 60% ${lightness}%)`;
}

const ZOOM_STEP = 1.5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

export function UsJobMap({ stats, selection, onSelect }: UsJobMapProps) {
  const titleId = useId();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  // A single scale drives an SVG-space transform; pan is centered on the
  // active state so zooming keeps the selection in view without a drag lib.
  const [zoom, setZoom] = useState(MIN_ZOOM);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const stat of stats.values()) max = Math.max(max, stat.openRoles);
    return max;
  }, [stats]);

  const selectedState =
    selection.kind === "none" ? null : selection.state;
  const selectedCity = selection.kind === "city" ? selection.city : null;

  const { width, height } = US_VIEWBOX;

  // Pan toward the selected state's centroid when zoomed in.
  const focus = useMemo(() => {
    if (!selectedState) return { cx: width / 2, cy: height / 2 };
    const geo = US_STATES.find((s) => s.code === selectedState);
    return geo
      ? { cx: geo.cx, cy: geo.cy }
      : { cx: width / 2, cy: height / 2 };
  }, [selectedState, width, height]);

  const tx = width / 2 - focus.cx * zoom;
  const ty = height / 2 - focus.cy * zoom;

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    const base = q
      ? PLOTTED_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.state.toLowerCase().includes(q) ||
            (US_STATE_NAME_BY_CODE[c.state] ?? "").toLowerCase().includes(q),
        )
      : PLOTTED_CITIES;
    return [...base].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
  }, [cityQuery]);

  const handleStateClick = (code: string) => {
    onSelect(
      selectedState === code && selection.kind === "state"
        ? { kind: "none" }
        : { kind: "state", state: code },
    );
  };

  const handleCityClick = (city: UsCity) => {
    onSelect(
      selectedCity === city.name && selectedState === city.state
        ? { kind: "state", state: city.state }
        : { kind: "city", state: city.state, city: city.name },
    );
  };

  const selectionLabel =
    selection.kind === "city"
      ? `${selection.city}, ${selection.state}`
      : selection.kind === "state"
        ? US_STATE_NAME_BY_CODE[selection.state] ?? selection.state
        : "All states";

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: searchable city combobox, selection chip, clear. */}
      <div className="flex flex-wrap items-center gap-3">
        <CityCombobox
          open={comboOpen}
          onOpenChange={setComboOpen}
          query={cityQuery}
          onQueryChange={setCityQuery}
          cities={filteredCities}
          selectedCity={selectedCity}
          selectedState={selectedState}
          onPick={(city) => {
            handleCityClick(city);
            setComboOpen(false);
          }}
        />

        {selection.kind !== "none" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
            <MapPin className="h-3.5 w-3.5" />
            {selectionLabel}
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => onSelect({ kind: "none" })}
              className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}

        {selection.kind !== "none" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelect({ kind: "none" })}
          >
            Clear selection
          </Button>
        )}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        {/* Soft brand glow behind the map. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(37,99,235,0.12), transparent 70%)",
          }}
        />

        {/* Zoom controls. */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
          <MapControlButton
            label="Zoom in"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
          >
            <Plus className="h-4 w-4" />
          </MapControlButton>
          <MapControlButton
            label="Zoom out"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
          >
            <Minus className="h-4 w-4" />
          </MapControlButton>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="relative block h-auto w-full"
          role="group"
          aria-labelledby={titleId}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={titleId}>Interactive map of open roles by US state</title>
          <g
            transform={`translate(${tx} ${ty}) scale(${zoom})`}
            style={{ transition: "transform 350ms cubic-bezier(0.4,0,0.2,1)" }}
          >
            {/* States */}
            {US_STATES.map((geo) => {
              const stat = stats.get(geo.code);
              const count = stat?.openRoles ?? 0;
              const feeLabel =
                count > 0 && stat
                  ? `, avg fee ${formatMinor(stat.averageFeeMinor)}`
                  : "";
              const isActive = selectedState === geo.code;
              const isHovered = hoveredState === geo.code;
              const name = geo.name;
              return (
                <path
                  key={geo.code}
                  d={geo.d}
                  role="button"
                  tabIndex={0}
                  aria-label={`${name}: ${count} open ${
                    count === 1 ? "role" : "roles"
                  }${feeLabel}${isActive ? ", selected" : ""}`}
                  aria-pressed={isActive}
                  onClick={() => handleStateClick(geo.code)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleStateClick(geo.code);
                    }
                  }}
                  onMouseEnter={() => setHoveredState(geo.code)}
                  onMouseLeave={() => setHoveredState(null)}
                  onFocus={() => setHoveredState(geo.code)}
                  onBlur={() => setHoveredState(null)}
                  fill={stateFill(count, maxCount, isActive)}
                  stroke={
                    isActive
                      ? "hsl(213 94% 78%)"
                      : isHovered
                        ? "hsl(217 91% 60%)"
                        : "hsl(215 30% 30%)"
                  }
                  strokeWidth={isActive ? 1.2 : 0.6}
                  className="cursor-pointer outline-none transition-[fill,stroke] duration-200 focus-visible:stroke-[hsl(213_94%_78%)]"
                  style={{
                    filter: isActive
                      ? "drop-shadow(0 0 6px rgba(37,99,235,0.55))"
                      : isHovered
                        ? "brightness(1.25)"
                        : undefined,
                  }}
                >
                  <title>{`${name} — ${count} open ${
                    count === 1 ? "role" : "roles"
                  }${feeLabel}`}</title>
                </path>
              );
            })}

            {/* City dots */}
            {PLOTTED_CITIES.map((city) => {
              const inSelectedState = selectedState === city.state;
              const isSelectedCity =
                selectedCity === city.name && selectedState === city.state;
              const emphasized = inSelectedState || isSelectedCity;
              const r = isSelectedCity ? 5 : emphasized ? 3.6 : 1.9;
              return (
                <g key={`${city.state}-${city.name}`}>
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={r}
                    // Only emphasized (in-state) dots are exposed as buttons and
                    // keyboard-reachable; the searchable combobox is the a11y
                    // path for every city. Faint out-of-state dots stay
                    // mouse-clickable but hidden from assistive tech so their
                    // role/tabindex can't drift out of sync.
                    role={emphasized ? "button" : undefined}
                    tabIndex={emphasized ? 0 : undefined}
                    aria-hidden={emphasized ? undefined : true}
                    aria-label={emphasized ? `${city.name}, ${city.state}` : undefined}
                    aria-pressed={emphasized ? isSelectedCity : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCityClick(city);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleCityClick(city);
                      }
                    }}
                    fill={
                      isSelectedCity
                        ? "hsl(213 94% 82%)"
                        : emphasized
                          ? "hsl(213 94% 74%)"
                          : "hsl(213 60% 60%)"
                    }
                    stroke={isSelectedCity ? "#fff" : "hsl(222 47% 11%)"}
                    strokeWidth={isSelectedCity ? 1.2 : 0.6}
                    className="cursor-pointer outline-none transition-all duration-200"
                    style={{
                      opacity: selectedState && !emphasized ? 0.35 : 0.9,
                      filter: isSelectedCity
                        ? "drop-shadow(0 0 5px rgba(96,165,250,0.9))"
                        : undefined,
                    }}
                  />
                  {emphasized && (
                    <text
                      x={city.x + r + 2}
                      y={city.y + 3}
                      className="pointer-events-none select-none"
                      fontSize={isSelectedCity ? 11 : 9}
                      fill="hsl(213 94% 88%)"
                      style={{ paintOrder: "stroke", fontWeight: 600 }}
                      stroke="hsl(222 47% 8%)"
                      strokeWidth={2.5}
                    >
                      {city.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Open roles</span>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-[hsl(215_40%_16%)]" />
            None
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-[hsl(217_60%_28%)]" />
            Few
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-[hsl(217_60%_42%)]" />
            Many
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-primary" />
            Selected
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(213_60%_60%)]" />
            City
          </div>
        </div>
      </div>
    </div>
  );
}

function MapControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function CityCombobox({
  open,
  onOpenChange,
  query,
  onQueryChange,
  cities,
  selectedCity,
  selectedState,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (value: string) => void;
  cities: readonly PlottedCity[];
  selectedCity: string | null;
  selectedState: string | null;
  onPick: (city: PlottedCity) => void;
}) {
  const listId = useId();
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          className="inline-flex h-9 w-64 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              Search a city…
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          id={listId}
          align="start"
          sideOffset={6}
          className="z-50 w-64 overflow-hidden rounded-md border border-border/70 bg-popover p-0 text-popover-foreground shadow-lg shadow-black/40 outline-none"
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            {/* Native input so radix Popover keeps focus management simple. */}
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Type a city name…"
              className="h-6 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ScrollArea.Root className="h-64">
            <ScrollArea.Viewport className="h-full w-full">
              {cities.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No cities match “{query}”.
                </p>
              ) : (
                <ul className="p-1">
                  {cities.map((city) => {
                    const active =
                      selectedCity === city.name &&
                      selectedState === city.state;
                    return (
                      <li key={`${city.state}-${city.name}`}>
                        <button
                          type="button"
                          onClick={() => onPick(city)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                            active && "bg-accent",
                          )}
                        >
                          <span className="truncate">
                            {city.name}
                            <span className="ml-1 text-xs text-muted-foreground">
                              {city.state}
                            </span>
                          </span>
                          {active && (
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              className="flex w-2 touch-none select-none p-0.5"
            >
              <ScrollArea.Thumb className="flex-1 rounded-full bg-border" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
