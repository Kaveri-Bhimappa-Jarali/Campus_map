import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";

import { campusCenter, campusBounds } from "../config/mapBounds";
import { useState, useMemo, useEffect } from "react";
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
  cse: { title: "Computer Science Engineering (CSE)", locationHint: "CSE block", floors: ["GF", "1F", "2F"] },
  ise: { title: "Information Science Engineering (ISE)", locationHint: "ISE block", floors: ["3F"] },
  ece: { title: "Electronics and Communication Engineering (ECE)", locationHint: "ECE block", floors: ["GF", "1F", "2F"] },
  eee: { title: "Electrical and Electronics Engineering (EEE)", locationHint: "EEE block", floors: ["GF", "1F", "2F"] },
  aiml: { title: "AI & ML (AIML)", locationHint: "AIML block", floors: ["Various"] },
  admin: { title: "Administrative Block", locationHint: "Admin / Auditorium block", floors: ["1F"] },
  library: { title: "Library", locationHint: "Library / MBA block", floors: ["1F"] },
  mba: { title: "MBA Department", locationHint: "Library / MBA block", floors: ["2F"] },
  civil: { title: "Civil Engineering", locationHint: "Civil block", floors: ["GF", "1F"] },
  chemical: { title: "Chemical Engineering", locationHint: "Chemistry Department", floors: ["2F"] },
  mechanical: { title: "Mechanical Department", locationHint: "Mechanical block", floors: ["GF", "1F"] },
  boys: { title: "Boys Hostel", locationHint: "Hostels zone", floors: [] },
  girls: { title: "Girls Hostel", locationHint: "Hostels zone", floors: [] },
  playground: { title: "Playground", locationHint: "Sports zone", floors: [] },
  indoor: { title: "Indoor Sports Complex", locationHint: "Sports complex area", floors: ["GF", "1F"] },
  temple: { title: "Temple", locationHint: "Campus Temple", floors: [] },
  "main-entrance": { title: "Main Entrance", locationHint: "Entry point to campus", floors: [] },
  placement: { title: "Placement Office", locationHint: "Career Development Cell", floors: ["1F"] },
  karavali: { title: "Karavali (ATM & Fast Food)", locationHint: "Near Mechanical block", floors: ["GF"] },
  xerox: { title: "Xerox/Stationery Shop", locationHint: "Campus Facility", floors: [] },
  student2w: { title: "Student 2-Wheeler Parking", locationHint: "Near Girls Hostel", floors: [] },
  faculty: { title: "Faculty Parking", locationHint: "Near Admin Block", floors: [] },
  postoffice: { title: "Post Office & Bank", locationHint: "Karnataka Bank and Post Office", floors: ["GF"] },
  transportation: { title: "Transportation Section", locationHint: "Near Mechanical Block", floors: [] },
  canteen: { title: "Canteen & Dining", locationHint: "Central Dining and Recreation Facility", floors: ["GF"] },
  alumni: { title: "Alumni Block", locationHint: "Campus Building", floors: [] },
};

// Mapping from node keys to place detail IDs
const NODE_KEY_TO_PLACE = {
  MainEntrance: "main-entrance",
  CSEBlock: "cse",
  ISEBlock: "ise",
  ECEBlock: "ece",
  EEEBlock: "eee",
  AIMLBlock: "aiml",
  MechanicalBlock: "mechanical",
  CivilBlock: "civil",
  ChemistryDepartment: "chemical",
  PhysicsDepartment: "chemical",
  LibraryMBA: "library",
  AdministrativeBlock: "admin",
  AuditoriumAdmin: "admin",
  Temple: "temple",
  Bank: "bank",
  PostOffice: "postoffice",
  CanteenSIC: "canteen",
  Mess: "dining",
  BoysHostels: "boys",
  GirlsHostels: "girls",
  Playground: "playground",
  IndoorSports: "indoor",
  PlacementOffice: "placement",
  MBADepartment: "mba",
  Karavali: "karavali",
  XeroxShop: "xerox",
  Student2WParking: "student2w",
  FacultyParking: "faculty",
  TransportationSection: "transportation",
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

  const getFloorPenalty = (n1, n2) => {
    if (!nodes[n1] || !nodes[n2]) return 0;
    const diff = Math.abs((nodes[n1].floorLevel || 0) - (nodes[n2].floorLevel || 0));
    return diff * 15; // 15 meters physical effort per floor
  };

  const heuristic = (node) => {
    return haversine(nodes[node].lat, nodes[node].lng, nodes[endNode].lat, nodes[endNode].lng) + getFloorPenalty(node, endNode);
  };

  queue.push({ node: startNode, dist: heuristic(startNode) });

  while (!queue.isEmpty()) {
    const { node: current } = queue.pop();

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endNode) break;

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      const stepCost = haversine(nodes[current].lat, nodes[current].lng, nodes[neighbor].lat, nodes[neighbor].lng) + getFloorPenalty(current, neighbor);
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
  const [currentPathStep, setCurrentPathStep] = useState(0);

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

  const pathInfo = useMemo(() => {
    if (!start || !end) return { coords: [], nodePath: [], navigation: [] };

    const startNode = start.nodeKey;
    const endNode = end.nodeKey;
    const nodePath = shortestCampusPath(currentGraph, startNode, endNode);

    if (!nodePath) return { coords: [], nodePath: [], navigation: [] };

    const coords = nodePath.map((nodeKey) => ({
      lat: nodes[nodeKey].lat,
      lng: nodes[nodeKey].lng,
    }));

    // Create navigation info with floor details
    const startLevel = nodes[startNode]?.floorLevel ?? 0;
    const endLevel = nodes[endNode]?.floorLevel ?? 0;
    
    // Overall floor instruction logic
    let overallFloorInstruction = null;
    if (startLevel === endLevel) {
       overallFloorInstruction = `Both on same floor level (${nodes[endNode]?.floorLabel || startLevel + 'F'}) - Walk across path.`;
    } else if (startLevel < endLevel) {
       overallFloorInstruction = `Overall: You will need to head UP to ${nodes[endNode]?.floorLabel || endLevel + 'F'}.`;
    } else {
       overallFloorInstruction = `Overall: You will need to head DOWN to ${nodes[endNode]?.floorLabel || endLevel + 'F'}.`;
    }

    const navigation = nodePath.map((nodeKey, idx) => {
      const placeId = NODE_KEY_TO_PLACE[nodeKey];
      const placeDetails = placeId ? PLACE_DETAILS[placeId] : null;
      const nextNodeKey = nodePath[idx + 1];
      const nextPlaceId = nextNodeKey ? NODE_KEY_TO_PLACE[nextNodeKey] : null;
      const nextPlaceDetails = nextPlaceId ? PLACE_DETAILS[nextPlaceId] : null;

      let stairInstruction = null;
      if (idx === 0 && startNode !== endNode) {
          // Show the overall instruction at the very first step
          stairInstruction = overallFloorInstruction;
      } else if (nextNodeKey) {
        const currentLevel = nodes[nodeKey]?.floorLevel ?? 0;
        const nextLevel = nodes[nextNodeKey]?.floorLevel ?? 0;
        const currentBuilding = nodes[nodeKey]?.building;
        const nextBuilding = nodes[nextNodeKey]?.building;
        const nextLabel = nodes[nextNodeKey]?.floorLabel || `${nextLevel}F`;
        
        // Only show intermediate stair instructions if staying within the SAME building
        // to avoid "moving down and then up" across buildings.
        if (currentBuilding && currentBuilding === nextBuilding && currentLevel !== nextLevel) {
          if (currentLevel < nextLevel) {
            stairInstruction = `Take stairs UP to ${nextLabel}`;
          } else if (currentLevel > nextLevel) {
            stairInstruction = `Take stairs DOWN to ${nextLabel}`;
          }
        }
      }

      return {
        nodeKey,
        placeId,
        title: placeDetails?.title || formatNodeLabel(nodeKey),
        description: placeDetails?.locationHint || "",
        floors: placeDetails?.floors || [],
        nextNodeKey,
        nextTitle: nextPlaceDetails?.title || (nextNodeKey ? formatNodeLabel(nextNodeKey) : null),
        stairInstruction
      };
    });

    return { coords, nodePath, navigation };
  }, [start, end, currentGraph]);

  const pathCoords = pathInfo.coords;
  const pathNavigation = pathInfo.navigation;

  const showPath = pathCoords.length > 1;
  const pathKey = `${start?.nodeKey || "none"}-${end?.nodeKey || "none"}-${pathCoords.length}`;

  // Reset step when path changes
  useEffect(() => {
    setCurrentPathStep(0);
  }, [pathKey]);

  const pathDistance = useMemo(() => {
    if (!showPath) return 0;
    return pathCoords.reduce((sum, point, idx) => {
      if (idx === 0) return 0;
      return sum + haversine(pathCoords[idx - 1].lat, pathCoords[idx - 1].lng, point.lat, point.lng);
    }, 0);
  }, [pathCoords, showPath]);

  const handleMarkerClick = (place) => {
    if (pickMode === "done") {
      setStart(place);
      setEnd(null);
      setPickMode("end");
    } else if (pickMode === "start") {
      setStart(place);
      if (end) {
        setPickMode("done");
      } else {
        setPickMode("end");
      }
    } else if (pickMode === "end") {
      setEnd(place);
      if (start) {
        setPickMode("done");
      } else {
        setPickMode("start");
      }
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
                          <div style={{ padding: '0px 4px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', lineHeight: '1.2' }}>{p.name}</div>
                            {p.description && (
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{p.description}</div>
                            )}
                            {p.floors.length > 0 && (
                              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '8px' }}>
                                {p.floors.map((f, i) => (
                                  <span key={i} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px' }}>
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </InfoWindow>
                      )}
                    </div>
                  ))}

                  {/* PATH NODE INFOWINDOWS */}
                  {showPath && [
                    pathNavigation[0],
                    pathNavigation[pathNavigation.length - 1]
                  ].filter(Boolean).map((step) => step.floors.length > 0 && (
                    <InfoWindow key={`nav-${step.nodeKey}`} position={{ lat: nodes[step.nodeKey].lat, lng: nodes[step.nodeKey].lng }}>
                      <div style={{ fontSize: '10px', color: '#0f172a', lineHeight: '1.4', padding: '2px' }}>
                        <b style={{ display: 'block', marginBottom: '4px' }}>{step.title}</b>
                        {step.floors.length > 0 && (
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                            {step.floors.map((f, i) => (
                              <span key={i} style={{ backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc', color: '#0284c7', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '10px' }}>
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </InfoWindow>
                  ))}

                  {/* PREMIUM NEON GLOW PATH EFFECT */}
                  <>
                    {/* 1. Outer deep aura */}
                    <Polyline
                      path={showPath && pathCoords.length > 1 ? pathCoords : []}
                      options={{
                        strokeColor: "#0284c7",
                        strokeWeight: 24,
                        strokeOpacity: 0.12,
                        geodesic: true,
                        clickable: false,
                        zIndex: 1,
                      }}
                    />
                    
                    {/* 2. Inner intense glow */}
                    <Polyline
                      path={showPath && pathCoords.length > 1 ? pathCoords : []}
                      options={{
                        strokeColor: "#06b6d4",
                        strokeWeight: 10,
                        strokeOpacity: 0.5,
                        geodesic: true,
                        clickable: false,
                        zIndex: 2,
                      }}
                    />

                    {/* 3. Bright solid core line with sleek directional arrows */}
                    <Polyline
                      path={showPath && pathCoords.length > 1 ? pathCoords : []}
                      options={{
                        strokeColor: "#ffffff",
                        strokeWeight: 4,
                        strokeOpacity: 0.9,
                        geodesic: true,
                        clickable: false,
                        zIndex: 3,
                        icons: [
                          {
                            icon: {
                              path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW,
                              scale: 2.5,
                              strokeColor: "#0284c7",
                              strokeWeight: 1.5,
                              fillColor: "#67e8f9",
                              fillOpacity: 1,
                            },
                            offset: "20%",
                            repeat: "60px",
                          },
                        ],
                      }}
                    />
                  </>

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
                    onClick={() => setPickMode("start")}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${pickMode === 'start' ? 'border-green-400 bg-green-500/20 text-green-300' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickMode("end")}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${pickMode === 'end' ? 'border-red-400 bg-red-500/20 text-red-300' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    Dest
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const temp = start;
                      setStart(end);
                      setEnd(temp);
                    }}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    Swap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStart(null);
                      setEnd(null);
                      setSelectedPlace(null);
                      setPickMode("start");
                    }}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-xs font-semibold text-white hover:bg-white/20"
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

              {/* GUIDE OR ROUTE SECTION */}
              {!showPath ? (
                <section className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <h2 className="text-sm font-bold text-white mb-2">How to Use</h2>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4 marker:text-cyan-400">
                    <li><strong>Pick Start:</strong> Tap a pin on the map or use the dropdown.</li>
                    <li><strong>Pick Destination:</strong> Tap another pin to draw your route.</li>
                    <li><strong>Navigate:</strong> Follow the highlighted blue path!</li>
                    <li><strong>Restart:</strong> Tap any pin to instantly clear and start a new route.</li>
                  </ol>
                </section>
              ) : (
                <section className="rounded-xl border border-white/10 bg-white/5 p-3 max-h-[300px] overflow-y-auto">
                  <h2 className="text-sm font-bold text-white mb-4">Shortest Route Steps</h2>
                  <div className="space-y-4">
                    {pathNavigation.map((step, idx) => (
                      <div key={idx} className="relative pl-6">
                        {/* Connecting line */}
                        {idx !== pathNavigation.length - 1 && (
                          <div className="absolute left-[7px] top-4 bottom-[-20px] w-[2px] bg-cyan-500/20"></div>
                        )}
                        {/* Node bullet */}
                        <div className={`absolute left-0 top-[2px] h-4 w-4 rounded-full border-[3px] border-slate-900 ${idx === 0 ? 'bg-green-500' : idx === pathNavigation.length - 1 ? 'bg-red-500' : 'bg-cyan-400 z-10 shadow-[0_0_8px_rgba(34,211,238,0.4)]'}`}></div>
                        
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-semibold text-white leading-tight">{step.title}</p>
                          {step.floors && step.floors.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {step.floors.map((f, i) => (
                                <span key={i} className="rounded-full border border-cyan-400/50 bg-cyan-900/40 px-1.5 py-[2px] text-[9px] font-bold text-cyan-300">
                                  🏢 {f}
                                </span>
                              ))}
                            </div>
                          )}
                          {step.stairInstruction && (
                            <p className="text-[10px] font-bold text-yellow-300 mt-1 flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded w-max border border-yellow-500/20">
                              {step.stairInstruction.includes('UP') ? "⬆️" : "⬇️"} {step.stairInstruction}
                            </p>
                          )}
                          {step.nextTitle && !step.stairInstruction && (
                            <p className="text-[10px] text-slate-400 mt-1 leading-tight flex items-center gap-1">
                              <span>↓</span> Head towards <span className="text-cyan-200">{step.nextTitle}</span>
                            </p>
                          )}
                          {step.nextTitle && step.stairInstruction && (
                            <p className="text-[10px] text-slate-400 mt-1 leading-tight flex items-center gap-1">
                              <span>↳</span> Then head to <span className="text-cyan-200">{step.nextTitle}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}