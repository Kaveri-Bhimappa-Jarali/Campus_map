import { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";

import { campusCenter, campusBounds } from "../config/mapBounds";

import placesData from "../data/places.json";
import nodesData from "../data/nodes.json";
import edgesData from "../data/edges.json";

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
  mapTypeId: "satellite",
};

const EDGES_KEY = "insignia_edges";

const loadEdges = () => {
  try {
    const s = localStorage.getItem(EDGES_KEY);
    if (!s) return edgesData;
    return JSON.parse(s);
  } catch {
    return edgesData;
  }
};

export default function AdminEdgeEditor() {

  // ✅ load places & nodes from JSON

  const [placesState] = useState(placesData);
  const [nodesState] = useState(nodesData);

  // ✅ edges from localStorage

  const [edgesState, setEdgesState] = useState(loadEdges);

  const [selectedPoints, setSelectedPoints] = useState([]);
  const [edgeForm, setEdgeForm] = useState({});
  const [showEdgeForm, setShowEdgeForm] = useState(false);

  const allPoints = [...placesState, ...nodesState];

  // ---------------- select points ----------------

  const handlePointSelect = (p) => {

    if (selectedPoints.length === 0) {

      setSelectedPoints([p]);

      return;
    }

    if (selectedPoints.length === 1) {

      if (selectedPoints[0].id === p.id) return;

      setSelectedPoints([selectedPoints[0], p]);
      setShowEdgeForm(true);
    }
  };

  // ---------------- form ----------------

  const handleEdgeFormChange = (e) => {

    const { name, value } = e.target;

    setEdgeForm((prev) => ({
      ...prev,
      [name]:
        name === "distance" || name === "time"
          ? Number(value)
          : value,
    }));
  };

  // ---------------- save edge ----------------

  const handleEdgeSubmit = () => {

    if (!edgeForm.distance) return;

    const nextId =
      Math.max(0, ...edgesState.map(e => e.id)) + 1;

    const newEdge = {

      id: nextId,

      from: selectedPoints[0].id,
      to: selectedPoints[1].id,

      distance: edgeForm.distance,
      direction: edgeForm.direction,
      instruction: edgeForm.instruction,
      time: edgeForm.time,
    };

    const updated = [...edgesState, newEdge];

    setEdgesState(updated);

    localStorage.setItem(
      EDGES_KEY,
      JSON.stringify(updated, null, 2)
    );

    setSelectedPoints([]);
    setShowEdgeForm(false);
    setEdgeForm({});
  };

  // ---------------- export ----------------

  const exportEdges = () => {

    const value = JSON.stringify(
      edgesState,
      null,
      2
    );

    navigator.clipboard.writeText(value);

    alert("Edges copied to clipboard!");
  };

  // ================= UI =================

  return (

    <div style={{ display: "flex", height: "100vh" }}>

      {/* PANEL */}

      <div
        style={{
          width: 300,
          background: "#111",
          color: "#fff",
          padding: 10,
        }}
      >

        <h3>Edge Editor</h3>

        <p>
          Click two markers to create edge
        </p>

        <p>
          Selected:
          {selectedPoints.map(p => p.name || p.id).join(" → ")}
        </p>

        <button onClick={exportEdges} style={{ marginTop: 10, padding: "5px 10px" }}>
          Export Edges
        </button>

        <div style={{ marginTop: 20 }}>
          <h4>Existing Edges: {edgesState.length}</h4>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {edgesState.map(edge => (
              <div key={edge.id} style={{ marginBottom: 10, padding: 5, background: "#222", borderRadius: 4 }}>
                <small>{edge.from} → {edge.to}</small>
                <br />
                <small>Distance: {edge.distance}m, Time: {edge.time}min</small>
              </div>
            ))}
          </div>
        </div>

      </div>


      {/* MAP */}

      <div style={{ flex: 1 }}>

        <LoadScript
          googleMapsApiKey={
            import.meta.env.VITE_GOOGLE_MAP_KEY
          }
        >

          <GoogleMap
            mapContainerStyle={containerStyle}
            center={campusCenter}
            zoom={17}
            options={options}
          >

            {/* PLACES */}

            {placesState.map(p => (

              <Marker
                key={p.id}
                position={{
                  lat: p.lat,
                  lng: p.lng,
                }}
                title={p.name}
                onClick={() => handlePointSelect(p)}
              />

            ))}

            {/* NODES */}

            {nodesState.map(n => (

              <Marker
                key={n.id}
                position={{
                  lat: n.lat,
                  lng: n.lng,
                }}
                icon={{
                  url:
                    "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                }}
                title={n.id}
                onClick={() => handlePointSelect(n)}
              />

            ))}

            {/* selected line */}

            {selectedPoints.length === 2 && (

              <Polyline
                path={[
                  selectedPoints[0],
                  selectedPoints[1],
                ]}
                options={{
                  strokeColor: "#ff0000",
                  strokeWeight: 3,
                }}
              />

            )}

            {/* edges */}

            {edgesState.map(e => {

              const a = allPoints.find(
                x => x.id === e.from
              );

              const b = allPoints.find(
                x => x.id === e.to
              );

              if (!a || !b) return null;

              return (

                <Polyline
                  key={e.id}
                  path={[
                    a,
                    b,
                  ]}
                  options={{
                    strokeColor: "#00ff00",
                    strokeWeight: 2,
                  }}
                />

              );

            })}

          </GoogleMap>

        </LoadScript>

      </div>


      {/* FORM */}

      {showEdgeForm && (

        <div
          style={{
            position: "fixed",
            top: 100,
            left: 400,
            background: "#222",
            padding: 20,
            color: "#fff",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
        >

          <h3>Add Edge</h3>

          <div style={{ marginBottom: 10 }}>
            <strong>From:</strong> {selectedPoints[0]?.name || selectedPoints[0]?.id}
          </div>

          <div style={{ marginBottom: 10 }}>
            <strong>To:</strong> {selectedPoints[1]?.name || selectedPoints[1]?.id}
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              name="distance"
              placeholder="distance (meters)"
              type="number"
              onChange={handleEdgeFormChange}
              style={{ width: "100%", padding: 5, marginBottom: 5 }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              name="direction"
              placeholder="direction (e.g., north, east)"
              onChange={handleEdgeFormChange}
              style={{ width: "100%", padding: 5, marginBottom: 5 }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              name="instruction"
              placeholder="instruction"
              onChange={handleEdgeFormChange}
              style={{ width: "100%", padding: 5, marginBottom: 5 }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              name="time"
              placeholder="time (minutes)"
              type="number"
              onChange={handleEdgeFormChange}
              style={{ width: "100%", padding: 5, marginBottom: 5 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleEdgeSubmit}
              style={{ padding: "8px 16px", background: "#4CAF50", color: "white", border: "none", borderRadius: 4 }}
            >
              Save Edge
            </button>

            <button
              onClick={() => {
                setSelectedPoints([]);
                setShowEdgeForm(false);
                setEdgeForm({});
              }}
              style={{ padding: "8px 16px", background: "#f44336", color: "white", border: "none", borderRadius: 4 }}
            >
              Cancel
            </button>
          </div>

        </div>

      )}

    </div>

  );
}