import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";

import { campusCenter, campusBounds } from "../config/mapBounds";
import { useState, useMemo } from "react";
import nodes from "./nodes";
import campusGraph from "./graph";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const options = {
  restriction: {
    latLngBounds: campusBounds,
    strictBounds: true,
  },
  disableDefaultUI: true,
  zoomControl: true,
};

// Place details (from the official campus map)
const PLACE_DETAILS = {
  cse: {
    title: "Computer Science Engineering (CSE)",
    locationHint: "CSE block",
    floors: ["Ground Floor", "First Floor", "Second Floor – Computer Science Engineering"],
  },
  ise: {
    title: "Information Science Engineering (ISE)",
    locationHint: "ISE block",
    floors: ["Second Floor – Information Science Engineering"],
  },
  ece: {
    title: "Electronics and Communication Engineering (ECE)",
    locationHint: "ECE block",
    floors: ["Ground Floor", "First & Second Floor – Electrical and Electronics Engineering"],
  },
  eee: {
    title: "Electrical and Electronics Engineering (EEE)",
    locationHint: "EEE block",
    floors: ["Ground Floor", "First & Second Floor – Electrical and Electronics Engineering"],
  },
  aiml: {
    title: "AI & ML (AIML)",
    locationHint: "AIML block",
    floors: ["Various Floors"],
  },
  admin: {
    title: "Administrative Block",
    locationHint: "Admin / Auditorium block",
    floors: ["First Floor – Administrative Block & Auditorium"],
  },
  library: {
    title: "Library",
    locationHint: "Library / MBA block",
    floors: ["First Floor – Library"],
  },
  mba: {
    title: "MBA Department",
    locationHint: "Library / MBA block",
    floors: ["Second Floor – MBA Block"],
  },
  civil: {
    title: "Civil Engineering",
    locationHint: "Civil block",
    floors: ["Ground Floor – Civil Engineering", "First Floor – Physics and Chemistry Department"],
  },
  chemical: {
    title: "Chemical Engineering",
    locationHint: "Chemistry Department",
    floors: ["Second Floor – Chemical Engineering"],
  },
  mechanical: {
    title: "Mechanical Department",
    locationHint: "Mechanical block",
    floors: ["Ground Floor", "First Floor – Mechanical Department"],
  },
  boys: { 
    title: "Boys Hostel", 
    locationHint: "Hostels zone", 
    floors: ["Boys Hostel – Central Facility"] 
  },
  girls: { 
    title: "Girls Hostel", 
    locationHint: "Hostels zone", 
    floors: ["Girls Hostel – Central Facility"] 
  },
  playground: { 
    title: "Playground", 
    locationHint: "Sports zone", 
    floors: ["Outdoor Area"] 
  },
  indoor: { 
    title: "Indoor Sports Complex", 
    locationHint: "Sports complex area", 
    floors: ["Ground & First Floor"] 
  },
  temple: { 
    title: "Temple", 
    locationHint: "Campus Temple", 
    floors: ["Ground Floor"] 
  },
  "main-entrance": { 
    title: "Main Entrance", 
    locationHint: "Entry point to campus", 
    floors: ["Main Gate"] 
  },
  placement: { 
    title: "Placement Office", 
    locationHint: "Career Development Cell", 
    floors: ["First Floor – Library Building"] 
  },
  karavali: { 
    title: "Karavali (ATM & Fast Food)", 
    locationHint: "Near Mechanical block", 
    floors: ["Ground Floor – ATM, Fast Food and Bakery"] 
  },
  xerox: { 
    title: "Xerox/Stationery Shop", 
    locationHint: "Campus Facility", 
    floors: ["Ground Floor"] 
  },
  student2w: { 
    title: "Student 2-Wheeler Parking", 
    locationHint: "Near Girls Hostel", 
    floors: ["Open Air Facility"] 
  },
  faculty: { 
    title: "Faculty Parking", 
    locationHint: "Near Admin Block", 
    floors: ["Open Air Facility"] 
  },
  postoffice: { 
    title: "Post Office & Bank", 
    locationHint: "Karnataka Bank and Post Office", 
    floors: ["Ground Floor"] 
  },
  transportation: { 
    title: "Transportation Section", 
    locationHint: "Near Mechanical Block", 
    floors: ["Administrative Office"] 
  },
  canteen: {
    title: "Canteen & Dining",
    locationHint: "Central Dining and Recreation Facility",
    floors: ["Ground Floor – Canteen & Central Dining"]
  },
  alumni: {
    title: "Alumni Block",
    locationHint: "Campus Building",
    floors: ["Alumni Association Office"]
  },
};

// Base pins (adapted from original)
const BASE_PINS = [
  { id: "main-entrance", label: "Main Entrance", nodeKey: "MainEntrance", lat: nodes.MainEntrance.lat, lng: nodes.MainEntrance.lng },
  { id: "cse", label: "CSE", nodeKey: "CSEBlock", lat: nodes.CSEBlock.lat, lng: nodes.CSEBlock.lng },
  { id: "ise", label: "ISE", nodeKey: "ISEBlock", lat: nodes.ISEBlock.lat, lng: nodes.ISEBlock.lng },
  { id: "ece", label: "ECE", nodeKey: "ECEBlock", lat: nodes.ECEBlock.lat, lng: nodes.ECEBlock.lng },
  { id: "eee", label: "EEE", nodeKey: "EEEBlock", lat: nodes.EEEBlock.lat, lng: nodes.EEEBlock.lng },
  { id: "aiml", label: "AIML", nodeKey: "AIMLBlock", lat: nodes.AIMLBlock.lat, lng: nodes.AIMLBlock.lng },
  { id: "mechanical", label: "Mechanical", nodeKey: "MechanicalBlock", lat: nodes.MechanicalBlock.lat, lng: nodes.MechanicalBlock.lng },
  { id: "civil", label: "Civil", nodeKey: "CivilBlock", lat: nodes.CivilBlock.lat, lng: nodes.CivilBlock.lng },
  { id: "chemical", label: "Chemical", nodeKey: "ChemistryDepartment", lat: nodes.ChemistryDepartment.lat, lng: nodes.ChemistryDepartment.lng },
  { id: "library", label: "Library", nodeKey: "LibraryMBA", lat: nodes.LibraryMBA.lat, lng: nodes.LibraryMBA.lng },
  { id: "admin", label: "Administrative", nodeKey: "AdministrativeBlock", lat: nodes.AdministrativeBlock.lat, lng: nodes.AdministrativeBlock.lng },
  { id: "auditorium-admin-cse", label: "Auditorium / Admin / CSE", nodeKey: "AuditoriumAdmin", lat: nodes.AuditoriumAdmin.lat, lng: nodes.AuditoriumAdmin.lng },
  { id: "temple", label: "Temple", nodeKey: "Temple", lat: nodes.Temple.lat, lng: nodes.Temple.lng },
  { id: "bank", label: "Bank", nodeKey: "Bank", lat: nodes.Bank.lat, lng: nodes.Bank.lng },
  { id: "canteen", label: "Canteen / SIC", nodeKey: "CanteenSIC", lat: nodes.CanteenSIC.lat, lng: nodes.CanteenSIC.lng },
  { id: "dining", label: "Mess", nodeKey: "Mess", lat: nodes.Mess.lat, lng: nodes.Mess.lng },
  { id: "boys", label: "Boys Hostel", nodeKey: "BoysHostels", lat: nodes.BoysHostels.lat, lng: nodes.BoysHostels.lng },
  { id: "girls", label: "Girls Hostel", nodeKey: "GirlsHostels", lat: nodes.GirlsHostels.lat, lng: nodes.GirlsHostels.lng },
  { id: "playground", label: "Playground", nodeKey: "Playground", lat: nodes.Playground.lat, lng: nodes.Playground.lng },
  { id: "indoor", label: "Indoor Sports", nodeKey: "IndoorSports", lat: nodes.IndoorSports.lat, lng: nodes.IndoorSports.lng },
  { id: "placement", label: "Placement Office", nodeKey: "PlacementOffice", lat: nodes.PlacementOffice.lat, lng: nodes.PlacementOffice.lng },
  { id: "mba", label: "MBA Department", nodeKey: "MBADepartment", lat: nodes.MBADepartment.lat, lng: nodes.MBADepartment.lng },
  { id: "karavali", label: "Karavali", nodeKey: "Karavali", lat: nodes.Karavali.lat, lng: nodes.Karavali.lng },
  { id: "xerox", label: "Xerox Shop", nodeKey: "XeroxShop", lat: nodes.XeroxShop.lat, lng: nodes.XeroxShop.lng },
  { id: "student2w", label: "Student 2W Parking", nodeKey: "Student2WParking", lat: nodes.Student2WParking.lat, lng: nodes.Student2WParking.lng },
  { id: "faculty", label: "Faculty Parking", nodeKey: "FacultyParking", lat: nodes.FacultyParking.lat, lng: nodes.FacultyParking.lng },
  { id: "postoffice", label: "Post Office", nodeKey: "PostOffice", lat: nodes.PostOffice.lat, lng: nodes.PostOffice.lng },
  { id: "transportation", label: "Transportation Section", nodeKey: "TransportationSection", lat: nodes.TransportationSection.lat, lng: nodes.TransportationSection.lng },
];

// Convert BASE_PINS to places format
const places = BASE_PINS.map(pin => ({
  id: pin.id,
  name: pin.label,
  lat: pin.lat,
  lng: pin.lng,
  description: PLACE_DETAILS[pin.id]?.locationHint,
  floors: PLACE_DETAILS[pin.id]?.floors || [],
  nodeKey: pin.nodeKey,
}));

function formatNodeLabel(nodeKey) {
  return nodeKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\s/, '')
    .replace(/\s+/g, ' ');
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(index) {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (element.dist >= parent.dist) break;
      this.heap[parentIndex] = element;
      this.heap[index] = parent;
      index = parentIndex;
    }
  }

  _sinkDown(index) {
    const length = this.heap.length;
    const element = this.heap[index];
    while (true) {
      let leftIndex = 2 * index + 1;
      let rightIndex = 2 * index + 2;
      let swap = null;

      if (leftIndex < length) {
        const left = this.heap[leftIndex];
        if (left.dist < element.dist) swap = leftIndex;
      }
      if (rightIndex < length) {
        const right = this.heap[rightIndex];
        if ((swap === null && right.dist < element.dist) || (swap !== null && right.dist < this.heap[swap].dist)) {
          swap = rightIndex;
        }
      }
      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      this.heap[swap] = element;
      index = swap;
    }
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

function shortestCampusPath(graph, startNode, endNode) {
  if (!startNode || !endNode) return null;
  if (startNode === endNode) return [startNode];

  const gScore = { [startNode]: 0 };
  const previous = {};
  const visited = new Set();
  const queue = new MinHeap();

  const heuristic = (node) => {
    return haversine(nodes[node].lat, nodes[node].lng, nodes[endNode].lat, nodes[endNode].lng);
  };

  queue.push({ node: startNode, dist: heuristic(startNode) });

  while (!queue.isEmpty()) {
    const { node: current, dist: currentDist } = queue.pop();

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endNode) break;

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      const stepCost = haversine(nodes[current].lat, nodes[current].lng, nodes[neighbor].lat, nodes[neighbor].lng);
      const tentativeG = (gScore[current] ?? Infinity) + stepCost;
      if (tentativeG < (gScore[neighbor] ?? Infinity)) {
        gScore[neighbor] = tentativeG;
        previous[neighbor] = current;
        const fScore = tentativeG + heuristic(neighbor);
        queue.push({ node: neighbor, dist: fScore });
      }
    }
  }

  if (!previous[endNode] && startNode !== endNode) return null;

  const path = [endNode];
  while (path[0] !== startNode) {
    path.unshift(previous[path[0]]);
  }
  return path;
}

export default function CampusMap() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [mapType, setMapType] = useState("satellite");
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [pickMode, setPickMode] = useState("start"); // "start" | "end"
  const [editPins, setEditPins] = useState(false);

  const mapOptions = useMemo(() => ({
    ...options,
    mapTypeId: mapType,
  }), [mapType]);

  const allNodes = Object.keys(nodes).map(nodeKey => ({
    nodeKey,
    ...nodes[nodeKey],
    label: formatNodeLabel(nodeKey),
  }));

  // Load edges from localStorage and build graph
  const loadEdgesAndBuildGraph = () => {
    try {
      const edgesData = localStorage.getItem("insignia_edges");
      if (edgesData) {
        const edges = JSON.parse(edgesData);
        const graph = {};

        // Initialize graph with empty arrays
        Object.keys(nodes).forEach(nodeKey => {
          graph[nodeKey] = [];
        });

        // Build graph from edges
        edges.forEach(edge => {
          if (graph[edge.from] && !graph[edge.from].includes(edge.to)) {
            graph[edge.from].push(edge.to);
          }
          if (graph[edge.to] && !graph[edge.to].includes(edge.from)) {
            graph[edge.to].push(edge.from);
          }
        });

        return graph;
      }
    } catch (error) {
      console.error("Error loading edges:", error);
    }
    return campusGraph; // fallback to original graph
  };

  const currentGraph = useMemo(() => loadEdgesAndBuildGraph(), []);

  const pathCoords = useMemo(() => {
    if (!start || !end) return [];

    const startNode = start.nodeKey;
    const endNode = end.nodeKey;
    const nodePath = shortestCampusPath(currentGraph, startNode, endNode);

    if (!nodePath) return [];

    return nodePath.map((nodeKey) => ({
      lat: nodes[nodeKey].lat,
      lng: nodes[nodeKey].lng,
    }));
  }, [start, end, currentGraph]);

  const showPath = pathCoords.length > 1;
  const pathKey = `${start?.nodeKey || "none"}-${end?.nodeKey || "none"}-${pathCoords.length}`;

  const pathDistance = useMemo(() => {
    if (!showPath) return 0;
    return pathCoords.reduce((sum, point, idx) => {
      if (idx === 0) return 0;
      return sum + haversine(pathCoords[idx - 1].lat, pathCoords[idx - 1].lng, point.lat, point.lng);
    }, 0);
  }, [pathCoords, showPath]);

  const handleMarkerClick = (place) => {
    if (!start || (start && end)) {
      setStart(place);
      setEnd(null);
    } else {
      setEnd(place);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-950 to-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="text-center md:text-left">
            <h1 className="text-balance text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              SDMCET Campus Map
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Tap a pin to select start and destination locations.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-lg shadow-black/30">
            <div className="relative w-full overflow-hidden rounded-xl bg-white" style={{ height: '620px' }}>
              {/* Map type toggle */}
              <div className="absolute top-3 left-3 z-10 flex rounded-lg overflow-hidden border border-white/20 shadow">
                <button
                  type="button"
                  onClick={() => setMapType("satellite")}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    mapType === "satellite"
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("roadmap")}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    mapType === "roadmap"
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Map
                </button>
              </div>
              <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={campusCenter}
                  zoom={17}
                  options={mapOptions}
                >
                  {/* PLACES */}
                  {places.map((p) => (
                    <div key={p.id}>
                      <Marker
                        position={{ lat: p.lat, lng: p.lng }}
                        title={p.name}
                        onClick={() => {
                          setSelectedPlace(p.id);
                          handleMarkerClick(p);
                        }}
                      />
                      {selectedPlace === p.id && (
                        <InfoWindow
                          position={{ lat: p.lat, lng: p.lng }}
                          onCloseClick={() => setSelectedPlace(null)}
                        >
                          <div style={{ maxWidth: '220px', background: '#1e293b', color: '#f1f5f9', padding: '10px 12px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '6px', fontSize: '13px' }}>{p.name}</div>
                            {p.description && (
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>📍 {p.description}</div>
                            )}
                            {p.floors.length > 0 && (
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#7dd3fc', marginBottom: '3px' }}>🏢 Floor Details</div>
                                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: '#cbd5e1' }}>
                                  {p.floors.map((f, i) => <li key={i}>{f}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </InfoWindow>
                      )}
                    </div>
                  ))}

                  {/* NODE INFOWINDOW */}
                  {selectedPlace && nodes[selectedPlace] && (
                    <InfoWindow
                      position={{ lat: nodes[selectedPlace].lat, lng: nodes[selectedPlace].lng }}
                      onCloseClick={() => setSelectedPlace(null)}
                    >
                      <div className="bg-gray-800 text-white p-2 rounded shadow-lg" style={{ minWidth: '130px' }}>
                        <h3 className="font-bold text-blue-300">{formatNodeLabel(selectedPlace)}</h3>
                        <p className="text-xs text-gray-300">Internal node</p>
                      </div>
                    </InfoWindow>
                  )}

                  {/* PATH — shadow/glow layer + main line + arrows */}
                  {showPath && pathCoords.length > 1 && (
                    <>
                      {/* Glow/shadow underneath */}
                      <Polyline
                        key={`shadow-${pathKey}`}
                        path={pathCoords}
                        options={{
                          strokeColor: "#0ea5e9",
                          strokeWeight: 14,
                          strokeOpacity: 0.25,
                          geodesic: true,
                          clickable: false,
                          zIndex: 1,
                        }}
                      />
                      {/* Main route line */}
                      <Polyline
                        key={`main-${pathKey}`}
                        path={pathCoords}
                        options={{
                          strokeColor: "#38bdf8",
                          strokeWeight: 6,
                          strokeOpacity: 1,
                          geodesic: true,
                          clickable: false,
                          zIndex: 2,
                          icons: [
                            {
                              icon: {
                                path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW,
                                scale: 3.5,
                                strokeColor: "#ffffff",
                                strokeWeight: 1,
                                fillColor: "#0ea5e9",
                                fillOpacity: 1,
                              },
                              offset: "20px",
                              repeat: "50px",
                            },
                          ],
                        }}
                      />
                    </>
                  )}

                  {/* START marker — green with S label */}
                  {start && (
                    <Marker
                      position={{ lat: start.lat, lng: start.lng }}
                      title={`Start: ${start.name}`}
                      zIndex={10}
                      icon={{
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
                            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#16a34a" stroke="#fff" stroke-width="2"/>
                            <circle cx="18" cy="18" r="10" fill="white"/>
                            <text x="18" y="23" font-family="Arial" font-size="12" font-weight="bold" fill="#16a34a" text-anchor="middle">S</text>
                          </svg>`
                        )}`,
                        scaledSize: { width: 36, height: 48 },
                        anchor: { x: 18, y: 48 },
                      }}
                    />
                  )}

                  {/* END marker — red with D label */}
                  {end && (
                    <Marker
                      position={{ lat: end.lat, lng: end.lng }}
                      title={`Destination: ${end.name}`}
                      zIndex={10}
                      icon={{
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
                            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#dc2626" stroke="#fff" stroke-width="2"/>
                            <circle cx="18" cy="18" r="10" fill="white"/>
                            <text x="18" y="23" font-family="Arial" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">D</text>
                          </svg>`
                        )}`,
                        scaledSize: { width: 36, height: 48 },
                        anchor: { x: 18, y: 48 },
                      }}
                    />
                  )}

                </GoogleMap>
              </LoadScript>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-lg shadow-black/30">
            <div className="sticky top-4 space-y-4">
              {/* DIRECTIONS SECTION */}
              <section className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white">Directions</h2>
                  <span className="text-xs font-semibold text-green-400">Open</span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-xs text-slate-300 bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                      Start: <span className="font-semibold text-emerald-300">{start?.name || "—"}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
                      Destination: <span className="font-semibold text-amber-300">{end?.name || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStart(null);
                      setEnd(null);
                      setSelectedPlace(null);
                    }}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    Pick start
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (end) setStart(end);
                      setEnd(null);
                    }}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    Swap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStart(null);
                      setEnd(null);
                      setSelectedPlace(null);
                    }}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    Reset
                  </button>
                </div>

                <p className="text-xxs text-slate-400 mb-2">
                  Pick start &amp; destination pins to get directions.
                </p>

                <div className="space-y-2">
                  <select
                    value={start?.nodeKey || ""}
                    onChange={(e) => {
                      const nodeKey = e.target.value;
                      if (!nodeKey) return setStart(null);
                      setStart({ nodeKey, lat: nodes[nodeKey].lat, lng: nodes[nodeKey].lng, name: formatNodeLabel(nodeKey) });
                    }}
                    className="w-full h-9 rounded-lg border border-white/20 bg-slate-900 px-2 text-xs text-white"
                  >
                    <option value="">Start location</option>
                    {allNodes.map((n) => (
                      <option key={n.nodeKey} value={n.nodeKey}>{n.label}</option>
                    ))}
                  </select>

                  <select
                    value={end?.nodeKey || ""}
                    onChange={(e) => {
                      const nodeKey = e.target.value;
                      if (!nodeKey) return setEnd(null);
                      setEnd({ nodeKey, lat: nodes[nodeKey].lat, lng: nodes[nodeKey].lng, name: formatNodeLabel(nodeKey) });
                    }}
                    className="w-full h-9 rounded-lg border border-white/20 bg-slate-900 px-2 text-xs text-white"
                  >
                    <option value="">Destination</option>
                    {allNodes.map((n) => (
                      <option key={n.nodeKey} value={n.nodeKey}>{n.label}</option>
                    ))}
                  </select>
                </div>

                {showPath && (
                  <div className="mt-2 rounded-lg border border-cyan-400/20 bg-cyan-950/20 px-3 py-2">
                    <p className="text-cyan-300 font-semibold text-xs">
                      📏 {pathDistance >= 1000
                        ? `${(pathDistance / 1000).toFixed(2)} km`
                        : `${Math.round(pathDistance)} m`}
                    </p>
                    <p className="text-slate-400 mt-0.5 text-xs">
                      {pathCoords.length - 1} stops
                    </p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMapType("satellite")}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold ${mapType === "satellite" ? "border-cyan-300 bg-cyan-500/20 text-cyan-300" : "border-white/20 bg-white/5 text-white hover:bg-white/10"}`}
                  >
                    Satellite
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapType("roadmap")}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold ${mapType === "roadmap" ? "border-cyan-300 bg-cyan-500/20 text-cyan-300" : "border-white/20 bg-white/5 text-white hover:bg-white/10"}`}
                  >
                    Map
                  </button>
                </div>
              </section>

              {/* LOCATION PIN POINTS LEGEND */}
              <section className="rounded-xl border border-white/10 bg-white/5 p-3">
                <h2 className="text-sm font-bold text-white mb-2">Location pin points</h2>
                <p className="text-xxs text-slate-400 mb-2">Click a name to highlight its pin on the map.</p>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Campus</p>
                    <div className="grid grid-cols-2 gap-1">
                      {places.slice(0, 4).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleMarkerClick(p)}
                          className="text-xxs text-white bg-white/5 rounded px-2 py-1 hover:bg-white/10 text-left"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Departments</p>
                    <div className="grid grid-cols-2 gap-1">
                      {places.slice(4, 8).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleMarkerClick(p)}
                          className="text-xxs text-white bg-white/5 rounded px-2 py-1 hover:bg-white/10 text-left"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Facilities</p>
                    <div className="grid grid-cols-2 gap-1">
                      {places.slice(8, 12).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleMarkerClick(p)}
                          className="text-xxs text-white bg-white/5 rounded px-2 py-1 hover:bg-white/10 text-left"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* NOTES SECTION */}
              <section className="rounded-xl border border-white/10 bg-white/5 p-3">
                <h2 className="text-sm font-bold text-white mb-2">Notes</h2>
                <ul className="text-xxs text-slate-300 space-y-1 list-disc pl-4">
                  <li>Optimize your route selection by picking start and destination pins</li>
                  <li>A* algorithm finds the shortest path between locations</li>
                  <li>Use Swap to reverse start/destination, Reset to clear</li>
                </ul>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}