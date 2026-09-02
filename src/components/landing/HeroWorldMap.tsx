import {
  HERO_CITIES,
  HERO_DOTS_PATH,
  HERO_VIEWBOX,
} from "@/shared/data/worldDots";

/** Approximate width of a city-name pill from its text length. */
const pillWidth = (name: string): number => name.length * 6.3 + 18;

/** A city marker: the open-roles bubble plus a name pill beneath it. */
function CityMarker({
  x,
  y,
  roles,
  name,
  active,
}: {
  x: number;
  y: number;
  roles: number;
  name: string;
  active: boolean;
}) {
  const r = active ? 30 : 24;
  const pw = pillWidth(name);
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={active ? "#034AEF" : "#FFFFFF"}
        stroke={active ? "#034AEF" : "#C7DBFA"}
        strokeWidth={active ? 0 : 1.5}
      />
      <text
        x={x}
        y={y}
        dy="0.35em"
        textAnchor="middle"
        fontSize={active ? 20 : 16}
        fontWeight={800}
        fill={active ? "#FFFFFF" : "#1E4FD1"}
      >
        {roles}
      </text>
      <rect
        x={x - pw / 2}
        y={y + r + 6}
        width={pw}
        height={20}
        rx={10}
        fill="#FFFFFF"
        stroke="#E7EEF9"
        strokeWidth={1}
      />
      <text
        x={x}
        y={y + r + 16}
        dy="0.1em"
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#0A1738"
      >
        {name}
      </text>
    </g>
  );
}

/** The illustrative "New York" popup — decorative marketing figures. */
function HeroPopup() {
  return (
    <g>
      <rect
        x={408}
        y={30}
        width={384}
        height={200}
        rx={16}
        fill="#FFFFFF"
        stroke="#E7EEF9"
        strokeWidth={1}
      />
      <text x={430} y={68} fontSize={20} fontWeight={800} fill="#0A1738">
        New York, NY
      </text>
      <text x={768} y={70} fontSize={20} textAnchor="middle" fill="#9AA3B2">
        ×
      </text>
      <text x={430} y={100} fontSize={17} fontWeight={700} fill="#034AEF">
        432 Open Roles
      </text>
      <line
        x1={430}
        y1={118}
        x2={770}
        y2={118}
        stroke="#EDF2FA"
        strokeWidth={1}
      />
      <text x={430} y={144} fontSize={12} fontWeight={500} fill="#616676">
        Available Price
      </text>
      <text x={430} y={178} fontSize={26} fontWeight={800} fill="#034AEF">
        $6,750
      </text>
      <rect x={430} y={190} width={340} height={28} rx={8} fill="#034AEF" />
      <text
        x={600}
        y={204}
        dy="0.35em"
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="#FFFFFF"
      >
        View Jobs
      </text>
    </g>
  );
}

/**
 * The landing hero graphic as pure SVG: a dotted world map (generated from real
 * geodata — see scripts/generate-world-dots.mjs), live-looking city bubbles, and
 * an illustrative popup. Vector all the way down, so it stays crisp at any size
 * where a raster export softened.
 */
export function HeroWorldMap() {
  return (
    <svg
      viewBox={`0 0 ${HERO_VIEWBOX.width} ${HERO_VIEWBOX.height}`}
      className="h-auto w-full"
      role="img"
      aria-label="A world map showing open roles and recruiter fees by city"
    >
      <path d={HERO_DOTS_PATH} fill="#A6C4F6" />
      {/* Popup first so the New York bubble overlaps its lower-left, as in the
          reference. */}
      <HeroPopup />
      {HERO_CITIES.map((city) => (
        <CityMarker
          key={city.name}
          x={city.x}
          y={city.y}
          roles={city.roles}
          name={city.name}
          active={city.active}
        />
      ))}
    </svg>
  );
}
