import { useState } from "react";
import CampusMap from "./components/CampusMap";
import AdminEdgeEditor from "./components/AdminEdgeEditor";

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <div>
      {/* Admin Toggle Button */}
      <div style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 1000,
        background: "#333",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: 4,
        cursor: "pointer"
      }} onClick={() => setIsAdminMode(!isAdminMode)}>
        {isAdminMode ? "Exit Admin Mode" : "Admin Mode"}
      </div>

      {isAdminMode ? <AdminEdgeEditor /> : <CampusMap />}
    </div>
  );
}

export default App;