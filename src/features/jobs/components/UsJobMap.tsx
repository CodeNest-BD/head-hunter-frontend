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
import { titleCase } from "@/shared/utils/titleCase";

import {
  STATE_FRAME,
  bubbleRadius,
  feeRange,
  nextBubbleSelection,
  resolveCityBubbles,
  resolveStateBubbles,
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
  /** Rendered as a strip below the map canvas (e.g. the bubble-size legend). */
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
// Room for the deepest per-state auto-zoom (STATE_FRAME caps at 13) plus a
// little manual headroom on top.
const MAX_ZOOM = 14;
// Cross this zoom and the map swaps state bubbles for city bubbles. Below the
// smallest per-state auto-zoom (2.2), so clicking any state reveals its cities.
const CITY_ZOOM = 2;

/** What a hovered bubble (state or city) shows in its card. */
interface BubbleInfo {
  readonly title: string;
  readonly openRoles: number;
  readonly totalFeeMinor: number;
  /** What "View Jobs" (and a plain click) selects. */
  readonly target: MapSelection;
}

/**
 * The hover card shown above a bubble — used for both a state bubble (zoomed
 * out) and a city bubble (zoomed into a state), so they read identically.
 */
function BubblePopup({
  info,
  anchor,
  onEnter,
  onLeave,
  onViewJobs,
}: {
  info: BubbleInfo | null;
  anchor: { x: number; top: number; bottom: number } | null;
  onEnter: () => void;
  onLeave: () => void;
  onViewJobs: (info: BubbleInfo) => void;
}) {
  if (!info || !anchor) return null;
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
          {info.title}
        </p>
        <p className="mt-1 text-[13px] text-navy">
          <span className="font-bold">{info.openRoles.toLocaleString()}</span>{" "}
          Open Roles
        </p>
        <p className="text-[13px] text-navy">
          Available Fees:{" "}
          <span className="font-bold">{formatMinor(info.totalFeeMinor)}</span>
        </p>
        <button
          type="button"
          onClick={() => onViewJobs(info)}
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
  const [hoveredBubble, setHoveredBubble] = useState<BubbleInfo | null>(null);
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
  const hideBubbleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Where the city popup is anchored: the hovered bubble's center-x and its
  // top/bottom edges, in container pixels. Anchoring to the bubble (not the
  // roaming mouse) keeps the card still and reachable so "View Jobs" is
  // clickable; top/bottom let it flip below the bubble near the top edge.
  const [bubbleAnchor, setBubbleAnchor] = useState<{
    x: number;
    top: number;
    bottom: number;
  } | null>(null);
  // Cursor position (container px) for the state-name tooltip on hover.
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedState = selection.kind === "none" ? null : selection.state;
  const selectedCity = selection.kind === "city" ? selection.city : null;

  // Returning to the un-zoomed view re-centers on the full map.
  useEffect(() => {
    if (zoom <= MIN_ZOOM) setPan({ x: 0, y: 0 });
  }, [zoom]);

  // Auto-zoom: picking a state animates the camera to fit that state so its
  // cities are spread out and clickable; clearing the selection returns to the
  // whole-USA view. Keyed on the selected state only, so the user can still
  // wheel/drag afterwards without it snapping back.
  useEffect(() => {
    if (!selectedState) {
      setZoom(MIN_ZOOM);
      setPan({ x: 0, y: 0 });
      return;
    }
    setZoom(STATE_FRAME.get(selectedState)?.zoom ?? 4);
    setPan({ x: 0, y: 0 });
  }, [selectedState]);

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
      if (hideBubbleRef.current) clearTimeout(hideBubbleRef.current);
    },
    [],
  );

  const { width, height } = US_VIEWBOX;

  // Zoomed-out view: one bubble per state that has live roles, sized by the
  // state's total available fees.
  const stateBubbles = useMemo(() => resolveStateBubbles(stats), [stats]);
  const stateFeeSpan = useMemo(() => feeRange(stateBubbles), [stateBubbles]);

  // Zoomed-in view: every placeable city, sized by available fee relative to
  // the whole map so a big city reads big at any zoom. They only render past
  // CITY_ZOOM, and the zoomed viewport clips to whichever state(s) fill it —
  // so you naturally see just that state's cities without pre-filtering.
  const cityBubbles = useMemo(
    () => resolveCityBubbles(cityData ?? []),
    [cityData],
  );
  const cityFeeSpan = useMemo(() => feeRange(cityBubbles), [cityBubbles]);

  // Draw largest first so smaller bubbles paint on top: in a dense metro a small
  // bubble would otherwise sit under a big neighbour and be unclickable.
  // Topmost = smallest = the one the pointer is actually over.
  const orderedCityBubbles = useMemo(
    () => [...cityBubbles].sort((a, b) => b.totalFeeMinor - a.totalFeeMinor),
    [cityBubbles],
  );

  // The whole switch is zoom-driven, exactly as the client asked: zoomed out
  // shows one bubble per state; once you cross CITY_ZOOM (by clicking a state,
  // which auto-zooms in, or by wheeling/using the +/- controls) the state
  // bubbles give way to the city bubbles, and zooming back out restores them.
  const showCities = zoom >= CITY_ZOOM;

  // Centre on the selected state's fitted frame when zoomed in.
  const focus = useMemo(() => {
    if (!selectedState) return { cx: width / 2, cy: height / 2 };
    const frame = STATE_FRAME.get(selectedState);
    return frame
      ? { cx: frame.cx, cy: frame.cy }
      : { cx: width / 2, cy: height / 2 };
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

  const cancelHideBubble = (): void => {
    if (hideBubbleRef.current) {
      clearTimeout(hideBubbleRef.current);
      hideBubbleRef.current = null;
    }
  };
  const showBubble = (info: BubbleInfo, el: SVGCircleElement): void => {
    cancelHideBubble();
    const wrap = wrapRef.current?.getBoundingClientRect();
    const dot = el.getBoundingClientRect();
    if (wrap) {
      // Keep the (center-anchored) card clear of the left/right edges.
      const half = 110;
      setBubbleAnchor({
        x: Math.min(
          Math.max(dot.left + dot.width / 2 - wrap.left, half),
          wrap.width - half,
        ),
        top: dot.top - wrap.top,
        bottom: dot.bottom - wrap.top,
      });
    }
    setHoveredBubble(info);
    setHoveredState(null);
  };
  const scheduleHideBubble = (): void => {
    cancelHideBubble();
    hideBubbleRef.current = setTimeout(() => setHoveredBubble(null), 160);
  };

  const selectionLabel =
    selection.kind === "city"
      ? `${titleCase(selection.city)}, ${selection.state}`
      : selection.kind === "state"
        ? (US_STATE_NAME_BY_CODE[selection.state] ?? selection.state)
        : "All States";

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
        {hoveredState && !hoveredBubble && pointer && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-brand-line bg-white px-2.5 py-1 text-[13px] font-semibold text-navy shadow-card-lg"
            style={{ left: pointer.x, top: pointer.y - 12 }}
          >
            {US_STATE_NAME_BY_CODE[hoveredState] ?? hoveredState}
          </div>
        )}

        {/* Details card, anchored above (or below) the hovered bubble — the
            same card for a state bubble and a city bubble. */}
        <BubblePopup
          info={hoveredBubble}
          anchor={bubbleAnchor}
          onEnter={cancelHideBubble}
          onLeave={scheduleHideBubble}
          onViewJobs={(info) => {
            cancelHideBubble();
            setHoveredBubble(null);
            // "View Jobs" drills into the bubble's target (never a toggle-off)
            // and, unlike a plain hover, asks the page to scroll to the list.
            (onViewJobs ?? onSelect)(info.target);
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
                  // Keep borders crisp at any zoom instead of ballooning with
                  // the scale transform when drilled into a state.
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer outline-none transition-[fill,stroke] duration-150 focus-visible:stroke-[#034AEF]"
                  style={{
                    filter: isActive
                      ? "drop-shadow(0 2px 6px rgba(3,74,239,0.28))"
                      : undefined,
                  }}
                />
              );
            })}

            {/* Two-letter state code at each state's centroid — only in the
                whole-USA view. Zoomed into a state, the scale transform would
                blow these up, so they're hidden in favour of the city bubbles.
                pointer-events off so a label never eats a state click. */}
            {!showCities &&
              US_STATES.map((geo) => (
                <text
                  key={`label-${geo.code}`}
                  x={geo.cx}
                  y={geo.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fontSize={11}
                  fontWeight={700}
                  fill="#5B6472"
                >
                  {geo.code}
                </text>
              ))}

            {/* Zoomed-out view: one demand bubble per state, sized by the
                state's total available fees. Hovering shows the card; clicking
                drills into that state (selects it → the auto-zoom effect frames
                it and the city bubbles below take over). Radius is divided by
                the zoom so a bubble stays a constant on-screen size. */}
            {!showCities &&
              stateBubbles.map((bubble) => {
                const info: BubbleInfo = {
                  title: US_STATE_NAME_BY_CODE[bubble.state] ?? bubble.state,
                  openRoles: bubble.openRoles,
                  totalFeeMinor: bubble.totalFeeMinor,
                  target: { kind: "state", state: bubble.state },
                };
                const r = bubbleRadius(
                  bubble.totalFeeMinor,
                  stateFeeSpan.min,
                  stateFeeSpan.max,
                  MIN_BUBBLE_RADIUS,
                  MAX_BUBBLE_RADIUS,
                );
                return (
                  <circle
                    key={`state-bubble-${bubble.key}`}
                    className="cursor-pointer outline-none"
                    cx={bubble.x}
                    cy={bubble.y}
                    r={r / zoom}
                    fill="#4F80E6"
                    fillOpacity={0.55}
                    stroke="#2658CF"
                    strokeWidth={1.5 / zoom}
                    strokeOpacity={0.9}
                    onMouseEnter={(event) =>
                      showBubble(info, event.currentTarget)
                    }
                    onMouseLeave={scheduleHideBubble}
                    onClick={() => {
                      if (suppressClickRef.current) return;
                      onSelect({ kind: "state", state: bubble.state });
                    }}
                  >
                    <title>{`${info.title} — ${bubble.openRoles} open ${
                      bubble.openRoles === 1 ? "role" : "roles"
                    }`}</title>
                  </circle>
                );
              })}

            {/* Zoomed-in view: the selected state's city bubbles, sized by
                available fee relative to that state. Clicking selects (or
                clears) that specific city. */}
            {showCities &&
              orderedCityBubbles.map((bubble) => {
                const isSelectedCity =
                  selectedCity === bubble.city &&
                  selectedState === bubble.state;
                const info: BubbleInfo = {
                  title: titleCase(bubble.city),
                  openRoles: bubble.openRoles,
                  totalFeeMinor: bubble.totalFeeMinor,
                  target: {
                    kind: "city",
                    state: bubble.state,
                    city: bubble.city,
                  },
                };
                const r = bubbleRadius(
                  bubble.totalFeeMinor,
                  cityFeeSpan.min,
                  cityFeeSpan.max,
                  MIN_BUBBLE_RADIUS,
                  MAX_BUBBLE_RADIUS,
                );
                return (
                  <circle
                    key={`city-bubble-${bubble.key}`}
                    className="cursor-pointer outline-none"
                    cx={bubble.x}
                    cy={bubble.y}
                    r={r / zoom}
                    fill="#034AEF"
                    fillOpacity={isSelectedCity ? 0.8 : 0.55}
                    stroke="#034AEF"
                    strokeWidth={(isSelectedCity ? 2.5 : 1.5) / zoom}
                    strokeOpacity={0.9}
                    onMouseEnter={(event) =>
                      showBubble(info, event.currentTarget)
                    }
                    onMouseLeave={scheduleHideBubble}
                    onClick={() => {
                      // A pan that happens to end on a bubble isn't a selection.
                      if (suppressClickRef.current) return;
                      onSelect(nextBubbleSelection(selection, bubble));
                    }}
                  >
                    <title>{`${titleCase(bubble.city)}, ${bubble.state} — ${bubble.openRoles} open ${
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

      {/* Bubble-size key — rendered below the map (not overlaid) so it never
          hides a bubble. */}
      {legend}
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
