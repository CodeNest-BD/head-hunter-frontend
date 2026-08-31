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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui-components/controls/tooltip";
import { formatMinor } from "@/shared/utils/money";

import {
  bubbleRadius,
  feeRange,
  nextBubbleSelection,
  resolveCityBubbles,
  type CityMapBubble,
  type CityMapRow,
  type MapSelection,
} from "../cityMapBubbles";

// Re-exported from its pure home so existing importers (ExploreJobsView) keep
// importing it from here, while the selection helpers stay unit-testable.
export type { MapSelection };

interface StateStat {
  readonly openRoles: number;
  readonly totalFeeMinor: number;
}

interface UsJobMapProps {
  /** Per-state aggregates from useJobMap, keyed by 2-letter code. */
  readonly stats: ReadonlyMap<string, StateStat>;
  /** Per-city rows; each drawn as a demand bubble when its city can be placed. */
  readonly cityData?: readonly CityMapRow[];
  readonly selection: MapSelection;
  readonly onSelect: (selection: MapSelection) => void;
  /**
   * "View Jobs" in a bubble's popup — an explicit "take me to the results"
   * action. Selects like onSelect, but the caller also scrolls the list into
   * view. Falls back to onSelect when not provided.
   */
  readonly onViewJobs?: (selection: MapSelection) => void;
  /**
   * Embedded in a page-owned card: renders the map's own header bar (with the
   * `header` content on the left and the zoom/clear controls on the right) and
   * fixes the map to a contained height instead of the full aspect ratio.
   */
  readonly embedded?: boolean;
  /** Left side of the embedded header bar (e.g. the card's title + hint). */
  readonly header?: ReactNode;
  /** Overlaid on the map canvas, bottom-right (e.g. the bubble-size legend). */
  readonly legend?: ReactNode;
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

/** SVG radius bounds for the smallest/largest available-fee cities. */
const MIN_BUBBLE_RADIUS = 10;
const MAX_BUBBLE_RADIUS = 32;

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
        className="pointer-events-auto w-max min-w-[180px] max-w-[200px] rounded-lg border border-brand-line bg-white px-4 py-3 shadow-card-lg sm:max-w-none"
      >
        <p className="font-heading text-[15px] font-bold text-navy">
          {bubble.city}
        </p>
        <p className="mt-1 text-[13px] text-navy">
          <span className="font-bold">{bubble.openRoles.toLocaleString()}</span>{" "}
          Open Roles
        </p>
        <p className="text-[13px] text-navy">
          Available fee:{" "}
          <span className="font-bold">{formatMinor(bubble.totalFeeMinor)}</span>
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
  onViewJobs,
  embedded = false,
  header,
  legend,
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
  // Bubbles are sized by available fee (summed recruiter fees), relative to the
  // busiest/quietest city currently plotted.
  const feeSpan = useMemo(() => feeRange(cityBubbles), [cityBubbles]);

  // Draw largest first so smaller bubbles paint on top: in dense metros (San
  // Jose beside San Francisco) a small bubble would otherwise sit under a big
  // neighbour and be impossible to hover or click. Topmost = smallest = the
  // one the pointer is actually over.
  const orderedBubbles = useMemo(
    () => [...cityBubbles].sort((a, b) => b.totalFeeMinor - a.totalFeeMinor),
    [cityBubbles],
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
    // Record a *potential* drag, but do NOT capture the pointer yet. Capturing
    // on pointerdown retargets the ensuing `click` to the SVG (the capture
    // target), so a plain click on a bubble or state would never fire its own
    // onClick — which is exactly why clicks broke once zoomed. Capture is
    // deferred to moveDrag, once a real drag is actually under way.
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  };

  const moveDrag = (event: React.PointerEvent<SVGSVGElement>): void => {
    const drag = dragRef.current;
    if (!drag) return;
    const { sx, sy } = svgUnitsPerPx();
    const dx = (event.clientX - drag.startX) * sx;
    const dy = (event.clientY - drag.startY) * sy;
    // Promote to a real drag only once the pointer clears a small threshold;
    // that is the moment to capture, so panning survives the cursor leaving the
    // map — a click that never moves stays a click and reaches its target.
    if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      drag.moved = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (drag.moved) setPan({ x: drag.panX + dx, y: drag.panY + dy });
  };

  const endDrag = (event: React.PointerEvent<SVGSVGElement>): void => {
    const drag = dragRef.current;
    if (!drag) return;
    // A drag that actually moved must not also register as a click.
    if (drag.moved) {
      suppressClickRef.current = true;
      requestAnimationFrame(() => {
        suppressClickRef.current = false;
      });
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
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
    // Same toggle as a bubble click, so the toolbar and the map agree: picking
    // the already-selected city clears it rather than dropping to state view.
    onSelect(
      nextBubbleSelection(selection, { state: city.state, city: city.name }),
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

  // Clear drops the selection AND returns the map to the full, un-zoomed view —
  // otherwise a "clear" left you zoomed into a now-deselected state.
  const handleClear = (): void => {
    onSelect({ kind: "none" });
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={cn("flex flex-col", !embedded && "gap-4")}>
      {/* The map's header bar: the card's title on the left, and the current
          selection (with a text Clear) plus the zoom controls on the right. */}
      {embedded && (
        <div className="flex flex-col gap-3 border-b border-brand-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <div className="min-w-0">{header}</div>
          <div className="flex flex-wrap items-center gap-2">
            {selection.kind !== "none" && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-navy">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {selectionLabel}
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-primary transition-colors hover:underline"
                >
                  Clear
                </button>
              </>
            )}
            <div className="flex items-center gap-1">
              <MapControlButton
                label="Zoom in"
                onClick={() =>
                  setZoom((z) => Math.min(MAX_ZOOM, z * ZOOM_STEP))
                }
                disabled={zoom >= MAX_ZOOM}
              >
                <Plus className="h-4 w-4" />
              </MapControlButton>
              <MapControlButton
                label="Zoom out"
                onClick={() =>
                  setZoom((z) => Math.max(MIN_ZOOM, z / ZOOM_STEP))
                }
                disabled={zoom <= MIN_ZOOM}
              >
                <Minus className="h-4 w-4" />
              </MapControlButton>
              {/* Reset is redundant once Clear is shown — Clear already resets
                  the zoom — so it only appears when nothing is selected. */}
              {selection.kind === "none" && (
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
              )}
            </div>
          </div>
        </div>
      )}

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
            ? "h-64 sm:h-[420px] md:h-[500px]"
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
            // "View Jobs" always drills into the city (never a toggle-off) and,
            // unlike a plain bubble click, asks the page to scroll to the list.
            (onViewJobs ?? onSelect)({
              kind: "city",
              state: bubble.state,
              city: bubble.city,
            });
          }}
        />

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
                  ? `, available fee ${formatMinor(stat.totalFeeMinor)}`
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

            {/* Two-letter state code at each state's centroid. pointer-events
                off so it never intercepts a click meant for the state. */}
            {US_STATES.map((geo) => (
              <text
                key={`label-${geo.code}`}
                x={geo.cx}
                y={geo.cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none"
                fontSize={11}
                fontWeight={700}
                fill={selectedState === geo.code ? "#034AEF" : "#5B6472"}
              >
                {geo.code}
              </text>
            ))}

            {/* Per-city demand bubbles: one translucent bordered circle per
                placeable city, sized by available fee. Hovering shows the city
                popup; clicking selects (or clears) that specific city. */}
            {orderedBubbles.map((bubble) => {
              const isSelectedCity =
                selectedCity === bubble.city && selectedState === bubble.state;
              // The whole state is highlighted when selected; the exact city
              // gets a stronger fill/stroke on top of that.
              const inActiveState = selectedState === bubble.state;
              const r = bubbleRadius(
                bubble.totalFeeMinor,
                feeSpan.min,
                feeSpan.max,
                MIN_BUBBLE_RADIUS,
                MAX_BUBBLE_RADIUS,
              );
              const color = inActiveState ? "#034AEF" : "#4F80E6";
              return (
                <circle
                  key={`bubble-${bubble.key}`}
                  className="cursor-pointer outline-none"
                  cx={bubble.x}
                  cy={bubble.y}
                  r={r}
                  fill={color}
                  fillOpacity={
                    isSelectedCity ? 0.75 : inActiveState ? 0.6 : 0.45
                  }
                  stroke={
                    isSelectedCity || inActiveState ? "#034AEF" : "#2658CF"
                  }
                  strokeWidth={isSelectedCity ? 2.5 : 1.5}
                  strokeOpacity={0.9}
                  onMouseEnter={(event) =>
                    showCity(bubble, event.currentTarget)
                  }
                  onMouseLeave={scheduleHideCity}
                  onClick={() => {
                    // A pan that happens to end on a bubble isn't a selection.
                    if (suppressClickRef.current) return;
                    onSelect(nextBubbleSelection(selection, bubble));
                  }}
                >
                  <title>{`${bubble.city}, ${bubble.state} — ${bubble.openRoles} open ${
                    bubble.openRoles === 1 ? "role" : "roles"
                  }`}</title>
                </circle>
              );
            })}
          </g>
        </svg>

        {/* Card-supplied overlay (the bubble-size legend), bottom-right. */}
        {legend}

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
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        {/* The trigger is the wrapping span, not the button: a disabled button
            emits no pointer events, so hovering it directly would never show
            the tooltip — exactly when (zoom at its limit) a hint is useful. */}
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <button
              type="button"
              aria-label={label}
              onClick={onClick}
              disabled={disabled}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              {children}
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
          className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
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
