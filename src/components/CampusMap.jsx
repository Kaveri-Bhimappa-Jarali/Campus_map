import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import nodes from "./nodes";
import campusGraph from "./graph";

// SDMCET (Dharwad) campus center (approx; used as map initial center).
// Source: public references (Wikipedia/GeoHack). You can adjust anytime.
const CAMPUS_CENTER = { lat: 15.430333, lng: 75.01475 };

// Rough campus span (degrees). Used to convert legacy image-relative pin positions into a
// reasonable "starting" placement on the Google Map. You can then drag pins to exact spots.
const DEFAULT_SPAN = { dLat: 0.004, dLng: 0.004 };

function legacyPctToLatLng(xPct, yPct, center = CAMPUS_CENTER, span = DEFAULT_SPAN) {
  // xPct: 0..100 left->right, yPct: 0..100 top->bottom
  const lng = center.lng + ((xPct - 50) / 100) * span.dLng;
  const lat = center.lat + ((50 - yPct) / 100) * span.dLat;
  return { lat, lng };
}

function floorBadgeFromDetails(details) {
  if (!details?.floors?.length) return null;
  const text = details.floors.join(" ").toLowerCase();
  if (text.includes("ground floor")) return "G";
  if (text.includes("first floor")) return "1F";
  if (text.includes("second floor")) return "2F";
  return null;
}

const NODE_LABELS = {
  MainEntrance: "Main Entrance",
  AcademicArea: "Academic Area",
  AuditoriumAdminCSE: "Admin / Auditorium / CSE",
  AdministrativeBlock: "Administrative Block",
  CSEBlock: "CSE Block",
  ISEBlock: "ISE Block",
  LibraryMBA: "Library",
  CivilBlock: "Civil Block",
  PhysicsChemistryBlock: "Physics / Chemistry Block",
  MechanicalBlock: "Mechanical Block",
  Temple: "Temple",
  BankPostOffice: "Bank / Post Office",
  CanteenSIC: "Canteen / SIC",
  DiningRecreation: "Dining / Recreation",
  BoysHostels: "Boys Hostel",
  GirlsHostels: "Girls Hostel",
  Playground: "Playground",
  IndoorSports: "Indoor Sports",
  STP: "STP",
};

// Floor / department legend (from the image you provided)
const PLACE_DETAILS = {
  cse: {
    title: "Computer Science Engineering (CSE)",
    locationHint: "CSE block",
    floors: ["Second Floor – Computer Science Engineering"],
  },
  ise: {
    title: "Information Science Engineering (ISE)",
    locationHint: "ISE block",
    floors: ["Second Floor – Information Science Engineering"],
  },
  ece: {
    title: "Electronics and Communication Engineering (ECE)",
    locationHint: "ECE / EEE / ISE block",
    floors: ["First Floor – Electronics and Communication Engineering"],
  },
  eee: {
    title: "Electrical and Electronics Engineering (EEE)",
    locationHint: "ECE / EEE / ISE block",
    floors: ["Ground Floor – Electrical and Electronics Engineering"],
  },
  aiml: {
    title: "AI & ML (AIML)",
    locationHint: "Near Mechanical block",
    floors: ["(Floor as per campus: update if needed)"],
  },
  admin: {
    title: "Administrative Block",
    locationHint: "Admin / Auditorium block",
    floors: ["First Floor – Administrative Block"],
  },
  library: {
    title: "Library",
    locationHint: "CCCF / Library / MBA block",
    floors: ["First Floor – Library"],
  },
  civil: {
    title: "Civil Engineering",
    locationHint: "Civil / Physics-Chemistry / Chemical block",
    floors: ["Ground Floor – Civil Engineering"],
  },
  chemical: {
    title: "Chemical Engineering",
    locationHint: "Shown under blocks that list Chemical Engineering",
    floors: ["Second Floor – Chemical Engineering"],
  },
  mechanical: {
    title: "Mechanical Department",
    locationHint: "Mechanical block",
    floors: ["Mechanical Department (floor not specified in legend)"],
  },
  boys: { title: "Boys Hostel", locationHint: "Hostels zone", floors: [] },
  girls: { title: "Girls Hostel", locationHint: "Hostels zone", floors: [] },
  playground: { title: "Playground", locationHint: "Sports zone", floors: [] },
  indoor: { title: "Indoor Sports", locationHint: "Sports complex area", floors: [] },
  temple: { title: "Temple", locationHint: "Near the top/north side", floors: [] },
  "main-entrance": { title: "Main Entrance", locationHint: "Entry point to campus", floors: [] },
};

// Pins are based on your legacy image coordinates (600x456). We convert them to lat/lng for
// initial placement on Google Maps, then allow precise drag-adjustments stored in localStorage.
const LEGACY_MAP_W = 600;
const LEGACY_MAP_H = 456;
const toLegacyPct = (x, y) => ({ xPct: (x / LEGACY_MAP_W) * 100, yPct: (y / LEGACY_MAP_H) * 100 });

// Department pin anchors tuned against the SDMCET layout reference image.
const DEPARTMENT_PIN_POS = {
  cse: { x: 204, y: 191 }, // CSE in Admin/Auditorium/CSE cluster
  ise: { x: 170, y: 210 }, // ISE in EEE/ECE/ISE block
  ece: { x: 161, y: 218 }, // ECE in same block (first floor)
  eee: { x: 178, y: 201 }, // EEE in same block (ground floor)
  aiml: { x: 291, y: 141 }, // AIML shown near Mechanical side in current campus mapping
  mechanical: { x: 281, y: 139 },
  civil: { x: 241, y: 211 },
  chemical: { x: 244, y: 181 },
};

function haversineMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function shortestCampusPath(graph, startNode, endNode) {
  if (!startNode || !endNode) return null;
  if (startNode === endNode) return [startNode];
  const queue = [[startNode]];
  const visited = new Set([startNode]);
  while (queue.length) {
    const path = queue.shift();
    const last = path[path.length - 1];
    const nextNodes = graph[last] || [];
    for (const n of nextNodes) {
      if (visited.has(n)) continue;
      const nextPath = [...path, n];
      if (n === endNode) return nextPath;
      visited.add(n);
      queue.push(nextPath);
    }
  }
  return null;
}

const BASE_PINS = [
  {
    id: "cse",
    label: "CSE",
    group: "Departments",
    nodeKey: "CSEBlock",
    ...toLegacyPct(DEPARTMENT_PIN_POS.cse.x, DEPARTMENT_PIN_POS.cse.y),
  },
  {
    id: "ise",
    label: "ISE",
    group: "Departments",
    nodeKey: "ISEBlock",
    ...toLegacyPct(DEPARTMENT_PIN_POS.ise.x, DEPARTMENT_PIN_POS.ise.y),
  },
  {
    id: "ece",
    label: "ECE",
    group: "Departments",
    nodeKey: "ISEBlock",
    ...toLegacyPct(DEPARTMENT_PIN_POS.ece.x, DEPARTMENT_PIN_POS.ece.y),
  },
  {
    id: "eee",
    label: "EEE",
    group: "Departments",
    nodeKey: "ISEBlock",
    ...toLegacyPct(DEPARTMENT_PIN_POS.eee.x, DEPARTMENT_PIN_POS.eee.y),
  },
  {
    id: "aiml",
    label: "AIML",
    group: "Departments",
    nodeKey: "MechanicalBlock",
    ...toLegacyPct(DEPARTMENT_PIN_POS.aiml.x, DEPARTMENT_PIN_POS.aiml.y),
  },
  {
    id: "mechanical",
    label: "Mechanical",
    group: "Departments",
    nodeKey: "MechanicalBlock",
    ...toLegacyPct(DEPARTMENT_PIN_POS.mechanical.x, DEPARTMENT_PIN_POS.mechanical.y),
  },
  {
    id: "civil",
    label: "Civil",
    group: "Departments",
    nodeKey: "CivilBlock",
    ...toLegacyPct(DEPARTMENT_PIN_POS.civil.x, DEPARTMENT_PIN_POS.civil.y),
  },
  {
    id: "chemical",
    label: "Chemical",
    group: "Departments",
    nodeKey: "PhysicsChemistryBlock",
    ...toLegacyPct(DEPARTMENT_PIN_POS.chemical.x, DEPARTMENT_PIN_POS.chemical.y),
  },
  {
    id: "library",
    label: "Library",
    group: "Campus",
    nodeKey: "LibraryMBA",
    ...toLegacyPct(nodes.LibraryMBA.x, nodes.LibraryMBA.y),
  },
  {
    id: "academic",
    label: "Academic Area",
    group: "Campus",
    nodeKey: "AcademicArea",
    ...toLegacyPct(nodes.AcademicArea.x, nodes.AcademicArea.y),
  },
  {
    id: "auditorium-admin-cse",
    label: "Auditorium / Admin / CSE",
    group: "Campus",
    nodeKey: "AuditoriumAdminCSE",
    ...toLegacyPct(nodes.AuditoriumAdminCSE.x, nodes.AuditoriumAdminCSE.y),
  },
  {
    id: "temple",
    label: "Temple",
    group: "Campus",
    nodeKey: "Temple",
    ...toLegacyPct(nodes.Temple.x, nodes.Temple.y),
  },
  {
    id: "admin",
    label: "Administrative",
    group: "Campus",
    nodeKey: "AdministrativeBlock",
    ...toLegacyPct(nodes.AdministrativeBlock.x, nodes.AdministrativeBlock.y),
  },
  {
    id: "bank",
    label: "Bank / Post Office",
    group: "Campus",
    nodeKey: "BankPostOffice",
    ...toLegacyPct(nodes.BankPostOffice.x, nodes.BankPostOffice.y),
  },
  {
    id: "canteen",
    label: "Canteen / SIC",
    group: "Campus",
    nodeKey: "CanteenSIC",
    ...toLegacyPct(nodes.CanteenSIC.x, nodes.CanteenSIC.y),
  },
  {
    id: "dining",
    label: "Dining / Recreation",
    group: "Campus",
    nodeKey: "DiningRecreation",
    ...toLegacyPct(nodes.DiningRecreation.x, nodes.DiningRecreation.y),
  },
  {
    id: "boys",
    label: "Boys Hostel",
    group: "Hostels",
    nodeKey: "BoysHostels",
    ...toLegacyPct(nodes.BoysHostels.x, nodes.BoysHostels.y),
  },
  {
    id: "girls",
    label: "Girls Hostel",
    group: "Hostels",
    nodeKey: "GirlsHostels",
    ...toLegacyPct(nodes.GirlsHostels.x, nodes.GirlsHostels.y),
  },
  {
    id: "playground",
    label: "Playground",
    group: "Sports",
    nodeKey: "Playground",
    ...toLegacyPct(nodes.Playground.x, nodes.Playground.y),
  },
  {
    id: "indoor",
    label: "Indoor Sports",
    group: "Sports",
    nodeKey: "IndoorSports",
    ...toLegacyPct(nodes.IndoorSports.x, nodes.IndoorSports.y),
  },
  {
    id: "stp",
    label: "STP",
    group: "Campus",
    nodeKey: "STP",
    ...toLegacyPct(nodes.STP.x, nodes.STP.y),
  },
  {
    id: "main-entrance",
    label: "Main Entrance",
    group: "Campus",
    nodeKey: "MainEntrance",
    ...toLegacyPct(nodes.MainEntrance.x, nodes.MainEntrance.y),
  },
];

// Keep UI focused on key navigation points only.
const IMPORTANT_PIN_IDS = new Set([
  "main-entrance",
  "cse",
  "ise",
  "ece",
  "eee",
  "aiml",
  "mechanical",
  "civil",
  "chemical",
  "library",
  "admin",
  "auditorium-admin-cse",
  "temple",
  "bank",
  "canteen",
  "boys",
  "girls",
  "playground",
  "indoor",
]);

function PinIcon({ tone = "default" }) {
  const cls =
    tone === "start"
      ? "text-emerald-500"
      : tone === "end"
        ? "text-amber-500"
        : tone === "selected"
          ? "text-indigo-500"
          : "text-red-600";
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["h-6 w-6 drop-shadow", cls].join(" ")}
      fill="currentColor"
    >
      <path d="M12 2c-3.86 0-7 3.14-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export default function CampusMap() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [startId, setStartId] = useState(null);
  const [endId, setEndId] = useState(null);
  const [pickMode, setPickMode] = useState("end"); // "start" | "end"
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [editPins, setEditPins] = useState(false);
  const [mapsLoadError, setMapsLoadError] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [myLocation, setMyLocation] = useState(null); // {lat,lng}
  const [travelMode, setTravelMode] = useState("DRIVING"); // DRIVING | WALKING | BICYCLING | TRANSIT
  const mapDivRef = useRef(null);
  const mapRef = useRef(null); // google.maps.Map
  const zoomTimerRef = useRef(null);
  const markersRef = useRef(new Map()); // id -> google.maps.Marker
  const routePolylineRef = useRef(null); // google.maps.Polyline
  const routesApiRef = useRef(null); // { Route, PinElement, AdvancedMarkerElement }
  const [routeInfo, setRouteInfo] = useState(null); // { distanceText, durationText }
  const [routeSteps, setRouteSteps] = useState([]);

  // Support both env var names:
  // - preferred: VITE_GOOGLE_MAPS_API_KEY
  // - accepted:  VITE_GOOGLE_MAP_KEY (common naming)
  const apiKeyRaw =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAP_KEY;
  const apiKey = typeof apiKeyRaw === "string" ? apiKeyRaw.trim() : "";
  // Optional but recommended (required for Advanced Markers).
  // - preferred: VITE_GOOGLE_MAPS_MAP_ID
  // - accepted:  VITE_GOOGLE_MAP_ID
  const mapIdRaw =
    import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || import.meta.env.VITE_GOOGLE_MAP_ID;
  const mapId = typeof mapIdRaw === "string" ? mapIdRaw.trim() : "";
  const hasMapId = !!mapId;
  // Advanced Markers are picky about Map IDs. If the env var is missing or set to a placeholder,
  // avoid importing the marker library to prevent "map can't load" / marker warnings.
  const looksLikeMapId = hasMapId && mapId.length >= 10 && /^[a-zA-Z0-9]+$/.test(mapId);
  const enableAdvancedMarkers =
    (import.meta.env.VITE_ENABLE_ADVANCED_MARKERS === "true" || import.meta.env.VITE_ENABLE_ADVANCED_MARKERS === true) &&
    looksLikeMapId;
  const useRoadRouting =
    import.meta.env.VITE_USE_ROAD_ROUTING === "true" ||
    import.meta.env.VITE_USE_ROAD_ROUTING === true;

  const [pinOverrides, setPinOverrides] = useState(() => {
    try {
      const raw = localStorage.getItem("campusPinLatLngOverrides:v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const exportOverridesJson = () => {
    const payload = JSON.stringify(pinOverrides, null, 2);
    try {
      navigator.clipboard?.writeText?.(payload);
    } catch {
      // ignore
    }
    return payload;
  };

  useEffect(() => {
    try {
      localStorage.setItem("campusPinLatLngOverrides:v1", JSON.stringify(pinOverrides));
    } catch {
      // ignore
    }
  }, [pinOverrides]);

  const pins = useMemo(() => {
    return BASE_PINS.map((p) => {
      const o = pinOverrides?.[p.id];
      const lat = typeof o?.lat === "number" ? o.lat : legacyPctToLatLng(p.xPct, p.yPct).lat;
      const lng = typeof o?.lng === "number" ? o.lng : legacyPctToLatLng(p.xPct, p.yPct).lng;
      return { ...p, lat, lng };
    });
  }, [pinOverrides]);

  const MAIN_ENTRANCE_ID = "main-entrance";
  const MY_LOCATION_ID = "__my_location__";
  const importantPins = useMemo(
    () => pins.filter((p) => IMPORTANT_PIN_IDS.has(p.id)),
    [pins]
  );

  const visiblePins = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return importantPins;
    return importantPins.filter((p) => p.label.toLowerCase().includes(q));
  }, [query, importantPins]);

  const selected = useMemo(
    () => pins.find((p) => p.id === selectedId) || null,
    [pins, selectedId]
  );

  const startPin = useMemo(() => pins.find((p) => p.id === startId) || null, [pins, startId]);
  const endPin = useMemo(() => pins.find((p) => p.id === endId) || null, [pins, endId]);

  const destinationDetails = useMemo(() => {
    if (!endPin) return null;
    return PLACE_DETAILS[endPin.id] || null;
  }, [endPin]);

  const destinationBadge = useMemo(
    () => floorBadgeFromDetails(destinationDetails),
    [destinationDetails]
  );

  const hasRoute = !!(startPin && endPin && routeInfo);

  const fitMapToPoints = (points) => {
    const map = mapRef.current;
    if (!map || !window.google?.maps?.LatLngBounds || !points?.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    let valid = 0;
    for (const pt of points) {
      const lat = typeof pt?.lat === "function" ? pt.lat() : pt?.lat;
      const lng = typeof pt?.lng === "function" ? pt.lng() : pt?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") continue;
      bounds.extend({ lat, lng });
      valid += 1;
    }
    if (!valid) return;
    map.fitBounds(bounds, 80);
    window.setTimeout(() => {
      const z = map.getZoom?.();
      if (typeof z === "number" && z > 19) map.setZoom(19);
    }, 0);
  };

  useEffect(() => {
    if (endId) setDirectionsOpen(true);
  }, [endId]);

  const applyPinChoice = (pinId) => {
    setSelectedId(pinId);

    if (pickMode === "start") {
      setStartId(pinId);
      if (endId === pinId) setEndId(null);
      setPickMode("end");
      return;
    }

    if (!startId) {
      setStartId(pinId);
      return;
    }

    if (!endId) {
      if (pinId !== startId) setEndId(pinId);
      return;
    }

    // If a route already exists (start + destination), a new tap begins a new route
    // with this point as the new start (Google Maps-like quick comparisons).
    setStartId(pinId);
    setEndId(null);
  };

  const zoomMapBy = (delta) => {
    const map = mapRef.current;
    if (!map) return;
    const current = map.getZoom?.();
    if (typeof current !== "number") return;
    const target = Math.max(15, Math.min(21, current + delta));
    if (zoomTimerRef.current) {
      window.clearTimeout(zoomTimerRef.current);
      zoomTimerRef.current = null;
    }
    const step = () => {
      const live = map.getZoom?.();
      if (typeof live !== "number") return;
      if (live === target) {
        zoomTimerRef.current = null;
        return;
      }
      const next = live < target ? live + 1 : live - 1;
      map.setZoom(next);
      zoomTimerRef.current = window.setTimeout(step, 130);
    };
    step();
  };

  const fitCurrentRoute = () => {
    const routePath = routePolylineRef.current?.getPath?.();
    const points = routePath ? routePath.getArray() : [];
    if (points?.length) {
      fitMapToPoints(points);
      return;
    }
    const fallback = [];
    if (startPin) fallback.push({ lat: startPin.lat, lng: startPin.lng });
    if (endPin) fallback.push({ lat: endPin.lat, lng: endPin.lng });
    if (fallback.length) fitMapToPoints(fallback);
  };

  const requestMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        if (typeof lat !== "number" || typeof lng !== "number") {
          setGeoError("Could not read location coordinates.");
          return;
        }
        setMyLocation({ lat, lng });
        setStartId(MY_LOCATION_ID);
        const map = mapRef.current;
        if (map) map.panTo({ lat, lng });
      },
      (err) => {
        setGeoError(err?.message || "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const setPinLatLngOverride = (pinId, latLng) => {
    setPinOverrides((prev) => ({
      ...prev,
      [pinId]: { lat: latLng.lat(), lng: latLng.lng() },
    }));
  };

  // Initialize Google Map
  useEffect(() => {
    if (!apiKey) return;
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    setMapsLoadError(null);
    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.error("[CampusMap] gm_authFailure fired (invalid/restricted Maps key/referrer/billing).");
      setMapsLoadError(
        "Google Maps authentication failed. Check that billing is enabled, the key is valid, and HTTP referrer restrictions allow this origin (e.g. http://localhost:5173/*)."
      );
    };
    console.info("[CampusMap] Initializing Google Maps", {
      apiKeyPresent: !!apiKey,
      mapIdPresent: hasMapId,
      mapIdLooksValid: looksLikeMapId,
      enableAdvancedMarkers,
      mapIdLen: hasMapId ? mapId.length : 0,
      mapIdPrefix: hasMapId ? mapId.slice(0, 4) : null,
    });
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
      // If you have a Map ID, provide it to the script loader as well.
      // (Option is deprecated, but harmless; newer loader versions still accept it.)
      mapIds: enableAdvancedMarkers ? [mapId] : undefined,
      // Helps when your key is restricted by referrer but local dev uses ports/paths.
      authReferrerPolicy: "origin",
    });

    let cancelled = false;
    loader
      .load()
      .then(async () => {
        if (cancelled) return;
        const mainEntrance = BASE_PINS.find((p) => p.id === "main-entrance");
        const entranceLatLng = mainEntrance
          ? legacyPctToLatLng(mainEntrance.xPct, mainEntrance.yPct)
          : CAMPUS_CENTER;
        const map = new window.google.maps.Map(mapDivRef.current, {
          center: entranceLatLng,
          zoom: 17,
          mapId: enableAdvancedMarkers ? mapId : undefined,
          mapTypeId: window.google.maps.MapTypeId.SATELLITE,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: window.google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: [
              window.google.maps.MapTypeId.ROADMAP,
              window.google.maps.MapTypeId.SATELLITE,
              window.google.maps.MapTypeId.HYBRID,
            ],
          },
          streetViewControl: false,
          fullscreenControl: true,
          minZoom: 15,
          maxZoom: 21,
          gestureHandling: "cooperative",
        });
        mapRef.current = map;
        routePolylineRef.current = new window.google.maps.Polyline({
          map,
          clickable: false,
          geodesic: true,
          strokeColor: "#2563eb",
          strokeOpacity: 0.95,
          strokeWeight: 6,
          icons: [
            {
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                strokeColor: "#1d4ed8",
                fillColor: "#1d4ed8",
                fillOpacity: 1,
                scale: 3,
              },
              repeat: "42px",
            },
          ],
        });

        // Load modern Routes + Advanced Markers libraries (recommended as of 2026).
        try {
          const [{ Route }, markerLib] = await Promise.all([
            window.google.maps.importLibrary("routes"),
            enableAdvancedMarkers
              ? window.google.maps.importLibrary("marker")
              : Promise.resolve(null),
          ]);
          routesApiRef.current = {
            Route,
            AdvancedMarkerElement: markerLib?.AdvancedMarkerElement || null,
            PinElement: markerLib?.PinElement || null,
          };
        } catch {
          // If these fail, we can still render the base map (but routing may not work).
          routesApiRef.current = null;
        }
      })
      .catch((err) => {
        console.error("[CampusMap] loader.load() failed", err);
        const msg =
          typeof err?.message === "string"
            ? err.message
            : "Failed to load Google Maps. Check API key, enabled APIs, and HTTP referrer restrictions.";
        setMapsLoadError(msg);
      });

    return () => {
      cancelled = true;
      window.gm_authFailure = prevAuthFailure;
      if (zoomTimerRef.current) {
        window.clearTimeout(zoomTimerRef.current);
        zoomTimerRef.current = null;
      }
    };
  }, [apiKey, mapId]);

  const markerToneForPinId = (pinId) => {
    if (!pinId) return "default";
    if (pinId === startId) return "start";
    if (pinId === endId) return "end";
    if (pinId === selectedId) return "selected";
    return "default";
  };

  const markerIconForTone = (tone) => {
    const colors = {
      start: { fill: "#10b981", stroke: "#064e3b" },
      end: { fill: "#f59e0b", stroke: "#78350f" },
      selected: { fill: "#6366f1", stroke: "#312e81" },
      default: { fill: "#ef4444", stroke: "#7f1d1d" },
    };
    const c = colors[tone] || colors.default;
    const pin = routesApiRef.current?.PinElement;
    if (pin) {
      const el = new pin({
        background: c.fill,
        borderColor: c.stroke,
        glyphColor: "#ffffff",
        glyph: tone === "start" ? "S" : tone === "end" ? "D" : "",
        scale: tone === "start" || tone === "end" ? 1.1 : 1,
      });
      return el.element;
    }
    if (tone === "start" || tone === "end") {
      const color = tone === "start" ? "#10b981" : "#f59e0b";
      const svg = encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='${color}' d='M12 2c-3.86 0-7 3.14-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7z'/><circle cx='12' cy='9' r='3.1' fill='white'/></svg>`
      );
      return {
        url: `data:image/svg+xml;charset=UTF-8,${svg}`,
        scaledSize: new window.google.maps.Size(30, 30),
        anchor: new window.google.maps.Point(15, 30),
      };
    }
    // Fallback (legacy marker icon)
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: c.fill,
      fillOpacity: 1,
      strokeColor: c.stroke,
      strokeOpacity: 1,
      strokeWeight: 2,
      scale: 7,
    };
  };

  // Build/update markers when pins (or edit mode) change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = markersRef.current;
    // In normal mode we show only Start/Destination (and the currently selected pin),
    // so the map stays clean. In edit mode we show all pins for easy placement.
    const idsToShow = editPins
      ? new Set(pins.map((p) => p.id))
      : new Set([startId, endId, selectedId].filter(Boolean));
    const nextIds = idsToShow;

    // Remove old markers
    for (const [id, marker] of existing.entries()) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        existing.delete(id);
      }
    }

    const allPins = myLocation
      ? [
          ...pins,
          {
            id: MY_LOCATION_ID,
            label: "My location",
            lat: myLocation.lat,
            lng: myLocation.lng,
          },
        ]
      : pins;

    // Create/update markers
    for (const p of allPins) {
      if (!nextIds.has(p.id)) continue;
      const pos = { lat: p.lat, lng: p.lng };
      const adv = routesApiRef.current?.AdvancedMarkerElement;

      if (adv) {
        let marker = existing.get(p.id);
        if (!marker) {
          marker = new adv({
            map,
            position: pos,
            title: p.label,
            content: markerIconForTone(markerToneForPinId(p.id)),
            gmpDraggable: editPins && p.id !== MY_LOCATION_ID,
          });
          marker.addListener("click", () => applyPinChoice(p.id));
          marker.addListener("dragend", () => {
            const position = marker.position;
            if (!position || p.id === MY_LOCATION_ID) return;
            // position may be a LatLng; normalize.
            const lat = typeof position.lat === "function" ? position.lat() : position.lat;
            const lng = typeof position.lng === "function" ? position.lng() : position.lng;
            if (typeof lat !== "number" || typeof lng !== "number") return;
            setPinOverrides((prev) => ({ ...prev, [p.id]: { lat, lng } }));
          });
          existing.set(p.id, marker);
        } else {
          marker.map = map;
          marker.position = pos;
          marker.title = p.label;
          marker.content = markerIconForTone(markerToneForPinId(p.id));
          marker.gmpDraggable = editPins && p.id !== MY_LOCATION_ID;
        }
      } else {
        // Fallback: legacy Marker
        const marker =
          existing.get(p.id) ||
          new window.google.maps.Marker({
            map,
            position: pos,
            title: p.label,
            draggable: editPins && p.id !== MY_LOCATION_ID,
          });

        marker.setDraggable(editPins && p.id !== MY_LOCATION_ID);
        marker.setPosition(pos);
        marker.setIcon(markerIconForTone(markerToneForPinId(p.id)));

        if (!existing.has(p.id)) {
          marker.addListener("click", () => applyPinChoice(p.id));
          marker.addListener("dragend", (e) => {
            if (!e?.latLng || p.id === MY_LOCATION_ID) return;
            setPinLatLngOverride(p.id, e.latLng);
          });
          existing.set(p.id, marker);
        }
      }
    }
  }, [pins, myLocation, editPins, selectedId, startId, endId]);

  // Pan/zoom when selecting a pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const p = pins.find((x) => x.id === selectedId);
    if (!p) return;
    map.panTo({ lat: p.lat, lng: p.lng });
    const z = map.getZoom?.();
    if (typeof z === "number" && z < 18) map.setZoom(18);
  }, [selectedId, pins]);

  // Request directions when start/end change
  useEffect(() => {
    const map = mapRef.current;
    const poly = routePolylineRef.current;
    if (!map || !poly) return;

    if (!endPin || (!startPin && startId !== MY_LOCATION_ID)) {
      poly.setPath([]);
      setRouteInfo(null);
      setRouteError(null);
      setRouteSteps([]);
      return;
    }

    const origin =
      startId === MY_LOCATION_ID
        ? myLocation
        : startPin
          ? { lat: startPin.lat, lng: startPin.lng }
          : null;
    const destination = endPin ? { lat: endPin.lat, lng: endPin.lng } : null;

    if (!origin || !destination) {
      poly.setPath([]);
      setRouteInfo(null);
      setRouteError(null);
      setRouteSteps([]);
      return;
    }

    const formatDuration = (ms) => {
      if (typeof ms !== "number") return null;
      const totalMins = Math.round(ms / 60000);
      if (totalMins < 60) return `${totalMins} min`;
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return m ? `${h} hr ${m} min` : `${h} hr`;
    };

    const formatDistance = (m) => {
      if (typeof m !== "number") return null;
      return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
    };

    const buildFallbackRoute = () => {
      const nearestPinToMyLocation =
        startId === MY_LOCATION_ID && myLocation
          ? pins.reduce((best, p) => {
              const d = haversineMeters(myLocation, { lat: p.lat, lng: p.lng });
              if (!best || d < best.d) return { pin: p, d };
              return best;
            }, null)?.pin
          : null;

      const startNode = startId === MY_LOCATION_ID ? nearestPinToMyLocation?.nodeKey : startPin?.nodeKey;
      const endNode = endPin?.nodeKey;

      const nodePath = shortestCampusPath(campusGraph, startNode, endNode);
      let polyPath = [];
      if (nodePath?.length) {
        if (startId === MY_LOCATION_ID && myLocation) polyPath.push(myLocation);
        for (const nodeName of nodePath) {
          const p = pins.find((x) => x.nodeKey === nodeName);
          if (p) polyPath.push({ lat: p.lat, lng: p.lng });
        }
      }
      if (polyPath.length < 2) polyPath = [origin, destination];

      poly.setPath(polyPath);
      fitMapToPoints(polyPath);
      const totalMeters = polyPath.slice(1).reduce((sum, pt, idx) => {
        return sum + haversineMeters(polyPath[idx], pt);
      }, 0);
      const speedMps =
        travelMode === "WALKING"
          ? 1.35
          : travelMode === "BICYCLING"
            ? 4.2
            : travelMode === "TRANSIT"
              ? 6.5
              : 7.5;
      const durationMs = (totalMeters / speedMps) * 1000;

      setRouteInfo({
        distanceText: formatDistance(totalMeters),
        durationText: formatDuration(durationMs),
      });
      const fallbackSteps =
        nodePath?.length
          ? nodePath.map((node) => NODE_LABELS[node] || node)
          : [startPin?.label || "Source", endPin?.label || "Destination"];
      setRouteSteps(fallbackSteps);
      setRouteError(
        "Using campus fallback routing because Google Routes API is not enabled for this key."
      );
    };

    const Route = routesApiRef.current?.Route;
    if (!useRoadRouting) {
      setRouteError(null);
      buildFallbackRoute();
      return;
    }
    if (Route?.computeRoutes) {
      let cancelled = false;
      (async () => {
        try {
          setRouteError(null);
          const { routes } = await Route.computeRoutes({
            origin,
            destination,
            travelMode,
            // Request only what we need
            fields: ["path", "distanceMeters", "durationMillis"],
            computeAlternativeRoutes: true,
          });
          if (cancelled || !routes?.length) throw new Error("No routes returned.");
          const chosen = routes.reduce((acc, r) => {
            if (typeof r?.distanceMeters !== "number") return acc;
            if (!acc) return r;
            if (typeof acc?.distanceMeters !== "number") return r;
            return r.distanceMeters < acc.distanceMeters ? r : acc;
          }, null) || routes[0];

          poly.setPath(chosen.path || []);
          fitMapToPoints(chosen.path || [origin, destination]);
          setRouteInfo({
            distanceText: formatDistance(chosen.distanceMeters) || null,
            durationText: formatDuration(chosen.durationMillis) || null,
          });
          setRouteSteps([startPin?.label || "Source", endPin?.label || "Destination"]);
        } catch (e) {
          if (cancelled) return;
          buildFallbackRoute();
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    // Fallback: legacy DirectionsService (may be blocked depending on your project settings)
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode[travelMode] || window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        if (status !== "OK" || !result?.routes?.length) {
          buildFallbackRoute();
          return;
        }
        setRouteError(null);

        const best = result.routes.reduce((acc, r) => {
          const leg = r?.legs?.[0];
          const dist = leg?.distance?.value;
          if (typeof dist !== "number") return acc;
          if (!acc) return r;
          const accDist = acc?.legs?.[0]?.distance?.value;
          if (typeof accDist !== "number") return r;
          return dist < accDist ? r : acc;
        }, null);

        const chosen = best || result.routes[0];
        poly.setPath(chosen.overview_path || []);
        fitMapToPoints(chosen.overview_path || [origin, destination]);
        const leg = chosen?.legs?.[0];
        setRouteInfo({
          distanceText: leg?.distance?.text || null,
          durationText: leg?.duration?.text || null,
        });
        setRouteSteps([startPin?.label || "Source", endPin?.label || "Destination"]);
      }
    );
  }, [
    useRoadRouting,
    startId,
    endId,
    travelMode,
    myLocation?.lat,
    myLocation?.lng,
    startPin?.lat,
    startPin?.lng,
    endPin?.lat,
    endPin?.lng,
  ]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const p of visiblePins) {
      if (!m.has(p.group)) m.set(p.group, []);
      m.get(p.group).push(p);
    }
    return Array.from(m.entries());
  }, [visiblePins]);


  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-950 to-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="text-center md:text-left">
            <h1 className="text-balance text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              SDMCET Campus Map
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Tap a pin (or pick from the list) to clearly identify locations like CSE, ISE, AIML,
              Mechanical, Civil, Chemical, Library, Temple, Administrative, Hostels, and Playground.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <label className="sr-only" htmlFor="place-search">
              Search places
            </label>
            <input
              id="place-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (e.g., CSE, library, hostel)…"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-400 shadow-sm outline-none ring-0 transition focus:border-cyan-300/40 focus:bg-white/10 focus:shadow-cyan-500/10 sm:w-80"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-lg shadow-black/30">
            <div className="relative w-full overflow-hidden rounded-xl bg-white">
              <div
                className="relative w-full"
              >
                {!apiKey ? (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-slate-950 px-6 text-center">
                    <div className="max-w-md">
                      <p className="text-sm font-extrabold text-white">Google Maps API key missing</p>
                      <p className="mt-2 text-xs text-slate-300">
                        Add <span className="font-semibold text-white">VITE_GOOGLE_MAPS_API_KEY</span> to a local{" "}
                        <span className="font-semibold text-white">.env</span> file (see{" "}
                        <span className="font-semibold text-white">.env.example</span>), then restart the dev server.
                      </p>
                    </div>
                  </div>
                ) : mapsLoadError ? (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-slate-950 px-6 text-center">
                    <div className="max-w-md">
                      <p className="text-sm font-extrabold text-white">Google Maps failed to load</p>
                      <p className="mt-2 text-xs text-slate-300">{mapsLoadError}</p>
                      <div className="mt-3 text-xs text-slate-300">
                        Make sure these APIs are enabled in Google Cloud:
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          <li>Maps JavaScript API</li>
                          <li>Directions API</li>
                        </ul>
                        If you restricted the key, add allowed referrers like{" "}
                        <span className="font-semibold text-white">http://localhost:5173/*</span>.
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div ref={mapDivRef} className="aspect-[16/10] w-full" />
                    <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => zoomMapBy(1)}
                        className="pointer-events-auto h-9 w-9 rounded-lg border border-white/15 bg-slate-900/85 text-lg font-bold text-white shadow hover:bg-slate-800"
                        aria-label="Zoom in"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => zoomMapBy(-1)}
                        className="pointer-events-auto h-9 w-9 rounded-lg border border-white/15 bg-slate-900/85 text-lg font-bold text-white shadow hover:bg-slate-800"
                        aria-label="Zoom out"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={fitCurrentRoute}
                        className="pointer-events-auto rounded-lg border border-white/15 bg-slate-900/85 px-2 py-1 text-[11px] font-semibold text-white shadow hover:bg-slate-800"
                      >
                        Fit Route
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Controls + route details are shown in the right panel / mobile bottom sheet */}
          </div>

          <aside className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-lg shadow-black/30">
            <div className="sticky top-4 space-y-4">
              <section className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold tracking-wide text-white">Directions</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectionsOpen(true);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Open
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-200">
                  <div className="grid grid-cols-1 gap-2">
                    <label className="grid gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Mode
                      </span>
                      <select
                        value={travelMode}
                        onChange={(e) => setTravelMode(e.target.value)}
                        className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
                      >
                        <option value="DRIVING" className="bg-slate-950">
                          Drive
                        </option>
                        <option value="WALKING" className="bg-slate-950">
                          Walk
                        </option>
                        <option value="TRANSIT" className="bg-slate-950">
                          Transit
                        </option>
                        <option value="BICYCLING" className="bg-slate-950">
                          Bike
                        </option>
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Start
                      </span>
                      <select
                        value={startId || ""}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          setStartId(v);
                          if (endId && v && endId === v) setEndId(null);
                        }}
                        className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
                      >
                        <option value="" className="bg-slate-950">
                          —
                        </option>
                        <option value={MY_LOCATION_ID} className="bg-slate-950">
                          My location
                        </option>
                        <option value={MAIN_ENTRANCE_ID} className="bg-slate-950">
                          Main Entrance
                        </option>
                        {importantPins.map((p) => (
                          <option key={p.id} value={p.id} className="bg-slate-950">
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Destination
                      </span>
                      <select
                        value={endId || ""}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          if (v && v === startId) {
                            setEndId(null);
                            return;
                          }
                          setEndId(v);
                        }}
                        className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
                      >
                        <option value="" className="bg-slate-950">
                          —
                        </option>
                        {importantPins.map((p) => (
                          <option key={p.id} value={p.id} className="bg-slate-950">
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {startId === MY_LOCATION_ID && !myLocation ? (
                    <div className="rounded-lg border border-amber-400/25 bg-amber-950/30 px-2 py-2 text-[11px] text-amber-100">
                      Click{" "}
                      <button
                        type="button"
                        onClick={requestMyLocation}
                        className="underline decoration-amber-200/60 underline-offset-2 hover:text-white"
                      >
                        Use my location
                      </button>{" "}
                      to set your start point.
                      {geoError ? <div className="mt-1 text-amber-200/90">{geoError}</div> : null}
                    </div>
                  ) : null}
                  <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                    Start:{" "}
                    <span className="font-semibold text-emerald-200">
                      {startId === MY_LOCATION_ID ? "My location" : startPin?.label || "—"}
                    </span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                    Destination:{" "}
                    <span className="font-semibold text-amber-200">{endPin?.label || "—"}</span>
                  </div>
                  {hasRoute ? (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                      Distance:{" "}
                      <span className="font-semibold text-white">
                        {routeInfo?.distanceText || "—"}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-slate-300">
                      Select start & destination to get directions.
                    </div>
                  )}
                  {hasRoute && routeInfo?.durationText ? (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                      ETA: <span className="font-semibold text-white">{routeInfo.durationText}</span>
                    </div>
                  ) : null}
                  {routeSteps.length > 1 ? (
                    <div className="rounded-lg border border-cyan-400/20 bg-cyan-950/20 px-2 py-2 text-[11px] text-cyan-100">
                      <p className="font-semibold">Path guide</p>
                      <p className="mt-1 leading-relaxed">
                        {routeSteps.join(" -> ")}
                      </p>
                    </div>
                  ) : null}
                  {routeError ? (
                    <div className="rounded-lg border border-rose-400/25 bg-rose-950/30 px-2 py-2 text-[11px] text-rose-100">
                      {routeError}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPickMode("start")}
                      className={[
                        "rounded-lg border px-2 py-1 text-xs font-semibold transition",
                        pickMode === "start"
                          ? "border-emerald-400/40 bg-emerald-950/55 text-emerald-100"
                          : "border-emerald-400/25 bg-emerald-950/30 text-emerald-100 hover:bg-emerald-950/45",
                      ].join(" ")}
                    >
                      Pick start
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartId((s) => {
                          const nextStart = endId || s;
                          return nextStart;
                        });
                        setEndId((e) => startId || e);
                      }}
                      disabled={!startId || !endId}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Swap
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartId(null);
                        setEndId(null);
                        setDirectionsOpen(false);
                      }}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Desktop directions description + destination floor details */}
                <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold text-white">Step-by-step</p>
                  <p className="mt-2 text-xs text-slate-300">
                    The route line & distance come from Google Directions (walking). For full turn-by-turn steps,
                    we can add a step list next.
                  </p>

                  {destinationDetails ? (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-semibold text-white">Floor details</p>
                      <p className="mt-1 text-xs text-slate-300">
                        <span className="font-semibold text-slate-100">{destinationDetails.title}</span>
                      </p>
                      {destinationDetails.floors?.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-200">
                          {destinationDetails.floors.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-slate-300">No floor details needed.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-extrabold tracking-wide text-white">
                  Location pin points (legend)
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Click a name to highlight its pin on the map.
                </p>

                <div className="mt-3 space-y-4">
                  {groups.map(([groupName, pins]) => (
                    <section key={groupName}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {groupName}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {pins.map((p) => {
                          const isSelected = p.id === selectedId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                applyPinChoice(p.id);
                              }}
                              className={[
                                "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                                isSelected
                                  ? "border-cyan-300/40 bg-cyan-950/40 text-cyan-100"
                                  : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                              ].join(" ")}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </section>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                <p className="font-semibold text-white">Notes</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>
                    <span className="font-semibold text-slate-100">Edit pins:</span>{" "}
                    Turn on edit mode to drag markers into the exact locations; positions are saved in your browser.
                  </li>
                  <li>
                    ISE is routed via the admin/cse node in the current campus graph; AIML is near
                    Mechanical block.
                  </li>
                  <li>Chemical is routed via the Physics/Chemistry block in the current graph.</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPins((v) => !v)}
                    className={[
                      "rounded-lg border px-2 py-1 text-xs font-semibold transition",
                      editPins
                        ? "border-cyan-300/40 bg-cyan-950/40 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                    ].join(" ")}
                  >
                    {editPins ? "Exit edit pins" : "Edit pins (drag markers)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinOverrides({});
                      setRouteInfo(null);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Reset pin positions
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom-sheet directions (easy access like Google Maps) */}
      <div className="md:hidden">
        <div
          className={[
            "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-6xl px-4 pb-4",
            directionsOpen ? "" : "pointer-events-none",
          ].join(" ")}
        >
          <div
            className={[
              "rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/60 backdrop-blur",
              "transition-transform duration-200",
              directionsOpen ? "translate-y-0" : "translate-y-[65%]",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => setDirectionsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="text-sm font-extrabold text-white">Directions</span>
              <span className="text-xs font-semibold text-slate-300">
                {directionsOpen ? "Hide" : "Show"}
              </span>
            </button>
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                  Start:{" "}
                  <span className="font-semibold text-emerald-200">{startPin?.label || "—"}</span>
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                  Destination:{" "}
                  <span className="font-semibold text-amber-200">{endPin?.label || "—"}</span>
                </span>
                {hasRoute ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                    {routeInfo?.distanceText || "—"}
                  </span>
                ) : null}
              </div>

              {destinationDetails ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-semibold text-white">Floor details</p>
                  <p className="mt-1 text-xs text-slate-300">
                    <span className="font-semibold text-slate-100">{destinationDetails.title}</span>
                  </p>
                  {destinationDetails.floors?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-200">
                      {destinationDetails.floors.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-300">No floor details needed.</p>
                  )}
                </div>
              ) : null}

              <p className="mt-3 text-xs text-slate-300">
                The route line is drawn on the Google Map (walking directions).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}