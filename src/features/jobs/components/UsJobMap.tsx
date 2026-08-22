"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import {
  ArrowUpRight,
  Check,
  ChevronsUpDown,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { projectAlbersUsa } from "@/shared/data/albersUsa";
import { US_CITIES, type UsCity } from "@/shared/data/usCities";
import {
  US_STATES,
  US_STATE_NAME_BY_CODE,
  US_VIEWBOX,
} from "@/shared/data/usStatesGeo";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { formatMinor } from "@/shared/utils/money";

import {
  resolveCityBubbles,
  type CityMapBubble,
  type CityMapRow,
} from "../cityMapBubbles";

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
  /** Per-city rows; each drawn as a demand bubble when its city can be placed. */
  readonly cityData?: readonly CityMapRow[];
  readonly selection: MapSelection;
  readonly onSelect: (selection: MapSelection) => void;
  /**
   * Embedded in a page-owned card: hides the city combobox and the internal
   * legend (the card supplies its own header + legend) and fixes the map to a
   * contained height instead of the full aspect ratio.
   */
  readonly embedded?: boolean;
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

/** Bubble radius (SVG units) scaled by role volume — small→few, large→many. */
function bubbleRadius(count: number): number {
  return Math.min(34, 6 + Math.sqrt(count) * 4);
}

// State fills copied from the mock: a sky-blue selected fill with a blue
// border, a slightly-blue tone for states that have roles, and a neutral tone
// for empty ones. Role volume is conveyed by the centroid bubbles, not fill.
const FILL_SELECTED = "#B4DBFD"; // ice blue (selected)
const FILL_HAS_ROLES = "#E0E8F3";
const FILL_EMPTY = "#EEF4FD";
const FILL_HOVER = "#D6E5FB"; // subtle hover tint

function stateFill(
  count: number,
  isActive: boolean,
  isHovered: boolean,
): string {
  if (isActive) return FILL_SELECTED;
  if (isHovered) return FILL_HOVER;
  return count > 0 ? FILL_HAS_ROLES : FILL_EMPTY;
}

const ZOOM_STEP = 1.5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

/** The hover card for a city bubble — follows the reference exactly. */
function CityPopup({
  bubble,
  anchor,
  onEnter,
  onLeave,
  onViewJobs,
}: {
  bubble: CityMapBubble | null;
  anchor: { x: number; top: number; bottom: number } | null;
  onEnter: () => void;
  onLeave: () => void;
  onViewJobs: (bubble: CityMapBubble) => void;
}) {
  if (!bubble || !anchor) return null;
  // Flip below the bubble when there isn't room for the card above it.
  const placeBelow = anchor.top < 130;
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 -translate-x-1/2",
        !placeBelow && "-translate-y-full",
      )}
      style={{
        left: anchor.x,
        top: placeBelow ? anchor.bottom + 8 : anchor.top - 10,
      }}
    >
      <div
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="pointer-events-auto w-max min-w-[180px] rounded-lg border border-brand-line bg-white px-4 py-3 shadow-card-lg"
      >
        <p className="font-heading text-[15px] font-bold text-navy">
          {bubble.city}
        </p>
        <p className="mt-1 text-[13px] text-navy">
          <span className="font-bold">{bubble.openRoles.toLocaleString()}</span>{" "}
          Open Roles
        </p>
        <p className="text-[13px] text-navy">
          Avg Company Price:{" "}
          <span className="font-bold">
            {formatMinor(bubble.averageFeeMinor)}
          </span>
        </p>
        <button
          type="button"
          onClick={() => onViewJobs(bubble)}
          className="mt-1.5 inline-flex items-center gap-0.5 text-[13px] font-semibold text-primary hover:underline"
        >
          View Jobs <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function UsJobMap({
  stats,
  cityData,
  selection,
  onSelect,
  embedded = false,
}: UsJobMapProps) {
  const titleId = useId();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityMapBubble | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  // A single scale drives an SVG-space transform; pan is centered on the
  // active state so zooming keeps the selection in view without a drag lib.
  const [zoom, setZoom] = useState(MIN_ZOOM);
  // User drag offset in SVG units, added on top of the focus centering.
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  // Set for one tick after a pan so the pointerup doesn't also select a state.
  const suppressClickRef = useRef(false);
  // Delays hiding the city popup so the cursor can travel from the bubble into
  // the (interactive) card without it vanishing mid-move.
  const hideCityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Where the city popup is anchored: the hovered bubble's center-x and its
  // top/bottom edges, in container pixels. Anchoring to the bubble (not the
  // roaming mouse) keeps the card still and reachable so "View Jobs" is
  // clickable; top/bottom let it flip below the bubble near the top edge.
  const [cityAnchor, setCityAnchor] = useState<{
    x: number;
    top: number;
    bottom: number;
  } | null>(null);
  // Cursor position (container px) for the state-name tooltip on hover.
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Returning to the un-zoomed view re-centers on the full map.
  useEffect(() => {
    if (zoom <= MIN_ZOOM) setPan({ x: 0, y: 0 });
  }, [zoom]);

  // Mouse-wheel zoom. Attached natively with { passive: false } so we can
  // preventDefault and stop the page from scrolling while zooming the map.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_STEP ** 0.5 : 1 / ZOOM_STEP ** 0.5;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Clear the popup hide timer if we unmount mid-delay.
  useEffect(
    () => () => {
      if (hideCityRef.current) clearTimeout(hideCityRef.current);
    },
    [],
  );

  const selectedState = selection.kind === "none" ? null : selection.state;
  const selectedCity = selection.kind === "city" ? selection.city : null;

  const { width, height } = US_VIEWBOX;

  // Placeable per-city bubbles, recomputed only when the map data changes.
  const cityBubbles = useMemo(
    () => resolveCityBubbles(cityData ?? []),
    [cityData],
  );

  // Pan toward the selected state's centroid when zoomed in.
  const focus = useMemo(() => {
    if (!selectedState) return { cx: width / 2, cy: height / 2 };
    const geo = US_STATES.find((s) => s.code === selectedState);
    return geo ? { cx: geo.cx, cy: geo.cy } : { cx: width / 2, cy: height / 2 };
  }, [selectedState, width, height]);

  const tx = width / 2 - focus.cx * zoom;
  const ty = height / 2 - focus.cy * zoom;

  // The valid translate range keeps the scaled map covering the viewport, so
  // neither a drag nor the focus centering can push it off-screen. At zoom 1
  // the range collapses to 0 → the full map is always centered.
  const clampedTx = Math.min(0, Math.max(width * (1 - zoom), tx + pan.x));
  const clampedTy = Math.min(0, Math.max(height * (1 - zoom), ty + pan.y));

  const svgUnitsPerPx = (): { sx: number; sy: number } => {
    const rect = svgRef.current?.getBoundingClientRect();
    return {
      sx: rect ? width / rect.width : 1,
      sy: rect ? height / rect.height : 1,
    };
  };

  const startDrag = (event: React.PointerEvent<SVGSVGElement>): void => {
    if (zoom <= MIN_ZOOM) return; // Nothing to pan on the full map.
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<SVGSVGElement>): void => {
    const drag = dragRef.current;
    if (!drag) return;
    const { sx, sy } = svgUnitsPerPx();
    const dx = (event.clientX - drag.startX) * sx;
    const dy = (event.clientY - drag.startY) * sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    setPan({ x: drag.panX + dx, y: drag.panY + dy });
  };

  const endDrag = (event: React.PointerEvent<SVGSVGElement>): void => {
    const drag = dragRef.current;
    if (!drag) return;
    // A drag that actually moved must not also register as a state click.
    if (drag.moved) {
      suppressClickRef.current = true;
      requestAnimationFrame(() => {
        suppressClickRef.current = false;
      });
    }
    dragRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

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
    if (suppressClickRef.current) return; // Came from a pan, not a real click.
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

  const cancelHideCity = (): void => {
    if (hideCityRef.current) {
      clearTimeout(hideCityRef.current);
      hideCityRef.current = null;
    }
  };
  const showCity = (bubble: CityMapBubble, el: SVGCircleElement): void => {
    cancelHideCity();
    const wrap = wrapRef.current?.getBoundingClientRect();
    const dot = el.getBoundingClientRect();
    if (wrap) {
      // Keep the (center-anchored) card clear of the left/right edges.
      const half = 110;
      setCityAnchor({
        x: Math.min(
          Math.max(dot.left + dot.width / 2 - wrap.left, half),
          wrap.width - half,
        ),
        top: dot.top - wrap.top,
        bottom: dot.bottom - wrap.top,
      });
    }
    setHoveredCity(bubble);
    setHoveredState(null);
  };
  const scheduleHideCity = (): void => {
    cancelHideCity();
    hideCityRef.current = setTimeout(() => setHoveredCity(null), 160);
  };

  const selectionLabel =
    selection.kind === "city"
      ? `${selection.city}, ${selection.state}`
      : selection.kind === "state"
        ? (US_STATE_NAME_BY_CODE[selection.state] ?? selection.state)
        : "All states";

  return (
    <div className={cn("flex flex-col", !embedded && "gap-4")}>
      {/* Toolbar: searchable city combobox, selection chip, clear. */}
      {!embedded && (
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
      )}

      <div
        ref={wrapRef}
        className={cn(
          "relative overflow-hidden",
          embedded
            ? "h-[420px] md:h-[500px]"
            : "rounded-md border border-border bg-card shadow-card",
        )}
      >
        {/* Faint blue tint behind the map — keeps the canvas light. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(3,74,239,0.04), transparent 70%)",
          }}
        />

        {/* State-name tooltip: follows the cursor while hovering a state, but
            yields to the richer city card when a bubble is hovered. */}
        {hoveredState && !hoveredCity && pointer && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-brand-line bg-white px-2.5 py-1 text-[13px] font-semibold text-navy shadow-card-lg"
            style={{ left: pointer.x, top: pointer.y - 12 }}
          >
            {US_STATE_NAME_BY_CODE[hoveredState] ?? hoveredState}
          </div>
        )}

        {/* City details card, anchored above (or below) the hovered bubble. */}
        <CityPopup
          bubble={hoveredCity}
          anchor={cityAnchor}
          onEnter={cancelHideCity}
          onLeave={scheduleHideCity}
          onViewJobs={(bubble) => {
            cancelHideCity();
            setHoveredCity(null);
            onSelect({ kind: "state", state: bubble.state });
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
          <MapControlButton
            label="Reset view"
            onClick={() => {
              setZoom(MIN_ZOOM);
              setPan({ x: 0, y: 0 });
            }}
            disabled={zoom <= MIN_ZOOM}
          >
            <RotateCcw className="h-4 w-4" />
          </MapControlButton>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className={cn(
            "relative block w-full touch-none",
            embedded ? "h-full" : "h-auto",
            zoom > MIN_ZOOM && (isDragging ? "cursor-grabbing" : "cursor-grab"),
          )}
          role="group"
          aria-labelledby={titleId}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={startDrag}
          onPointerMove={(event) => {
            moveDrag(event);
            if (isDragging) return; // Don't fight a pan with hover tracking.
            const rect = wrapRef.current?.getBoundingClientRect();
            if (rect) {
              setPointer({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              });
            }
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onMouseLeave={() => {
            setHoveredState(null);
            setPointer(null);
          }}
        >
          <title id={titleId}>Interactive map of open roles by US state</title>
          <g
            transform={`translate(${clampedTx} ${clampedTy}) scale(${zoom})`}
            style={{
              transition: isDragging
                ? "none"
                : "transform 350ms cubic-bezier(0.4,0,0.2,1)",
            }}
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
                  fill={stateFill(count, isActive, isHovered)}
                  stroke={
                    isActive ? "#034AEF" : isHovered ? "#034AEF" : "#FFFFFF"
                  }
                  strokeWidth={isActive ? 1.6 : isHovered ? 1.2 : 1}
                  className="cursor-pointer outline-none transition-[fill,stroke] duration-150 focus-visible:stroke-[#034AEF]"
                  style={{
                    filter: isActive
                      ? "drop-shadow(0 2px 6px rgba(3,74,239,0.28))"
                      : undefined,
                  }}
                />
              );
            })}

            {/* Per-city demand bubbles: one translucent bordered circle per
                placeable city, sized by open-role volume (small→few, large→many).
                Hovering shows the city popup; clicking drills into its state. */}
            {cityBubbles.map((bubble) => {
              const isActive = selectedState === bubble.state;
              const r = bubbleRadius(bubble.openRoles);
              const color = isActive ? "#034AEF" : "#4F80E6";
              return (
                <circle
                  key={`bubble-${bubble.key}`}
                  className="cursor-pointer outline-none"
                  cx={bubble.x}
                  cy={bubble.y}
                  r={r}
                  fill={color}
                  fillOpacity={isActive ? 0.6 : 0.45}
                  stroke={isActive ? "#034AEF" : "#2658CF"}
                  strokeWidth={1.5}
                  strokeOpacity={0.9}
                  onMouseEnter={(event) =>
                    showCity(bubble, event.currentTarget)
                  }
                  onMouseLeave={scheduleHideCity}
                  onClick={() => handleStateClick(bubble.state)}
                >
                  <title>{`${bubble.city}, ${bubble.state} — ${bubble.openRoles} open ${
                    bubble.openRoles === 1 ? "role" : "roles"
                  }`}</title>
                </circle>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        {!embedded && (
          <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span className="font-medium text-navy">Open roles</span>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] border border-border bg-[#EEF4FD]" />
              None
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] border border-border bg-[#E0E8F3]" />
              Has roles
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] border border-[#034AEF] bg-[#B4DBFD]" />
              Selected
            </div>
          </div>
        )}
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
          className="z-50 w-64 overflow-hidden rounded-md border border-border bg-popover p-0 text-popover-foreground shadow-card outline-none"
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
