const nodes = {
  // Coordinates are in the `campus-map.jpg` space (~600x456).
  // These were scaled from the previous 960x540 coordinates to better match this image’s aspect ratio.
  // Front gate (main entrance) at the left-side gate road.
  MainEntrance: { x: 56, y: 244 },
  AcademicArea: { x: 156, y: 215 },
  AuditoriumAdminCSE: { x: 194, y: 186 },
  AdministrativeBlock: { x: 183, y: 176 },
  CSEBlock: { x: 203, y: 193 },
  ISEBlock: { x: 219, y: 179 },
  LibraryMBA: { x: 191, y: 262 },
  CivilBlock: { x: 241, y: 211 },
  PhysicsChemistryBlock: { x: 244, y: 181 },
  MechanicalBlock: { x: 281, y: 139 },
  Temple: { x: 291, y: 72 },
  BankPostOffice: { x: 211, y: 152 },
  CanteenSIC: { x: 263, y: 177 },
  DiningRecreation: { x: 381, y: 266 },
  // Updated per latest campus arrangement:
  // - Girls hostel near main entrance zone
  // - Boys hostel near back-gate / temple / mess side
  BoysHostels: { x: 335, y: 138 },
  GirlsHostels: { x: 106, y: 226 },
  Playground: { x: 353, y: 346 },
  IndoorSports: { x: 275, y: 309 },
  STP: { x: 484, y: 338 }
};

// `campus-map.jpg` is ~600x456 (not 16:9). Keep our coordinate system aligned to it.
const MAP_W = 600;
const MAP_H = 456;
const toPct = (x, y) => ({ xPct: (x / MAP_W) * 100, yPct: (y / MAP_H) * 100 });

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

// Map requested labels → existing routing nodes (from `nodes.js` + `graph.js`).
// NOTE: ISE/AIML don’t exist as separate nodes in your graph, so they’re placed near the Admin/CSE
// cluster visually, but route via the same `AuditoriumAdminCSE` node.
const BASE_PINS = [
  {
    id: "cse",
    label: "CSE",
    group: "Departments",
    nodeKey: "CSEBlock",
    ...toPct(nodes.CSEBlock.x, nodes.CSEBlock.y),
  },
  {
    id: "ise",
    label: "ISE",
    group: "Departments",
    nodeKey: "ISEBlock",
    // Place slightly away from CSE so the route is visually clear (and easy to tap).
    ...toPct(nodes.ISEBlock.x, nodes.ISEBlock.y),
  },
  {
    id: "aiml",
    label: "AIML",
    group: "Departments",
    nodeKey: "MechanicalBlock",
    ...toPct(nodes.MechanicalBlock.x + 15, nodes.MechanicalBlock.y + 12),
  },
  {
    id: "mechanical",
    label: "Mechanical",
    group: "Departments",
    nodeKey: "MechanicalBlock",
    ...toPct(nodes.MechanicalBlock.x, nodes.MechanicalBlock.y),
  },
  {
    id: "civil",
    label: "Civil",
    group: "Departments",
    nodeKey: "CivilBlock",
    ...toPct(nodes.CivilBlock.x, nodes.CivilBlock.y),
  },
  {
    id: "chemical",
    label: "Chemical",
    group: "Departments",
    nodeKey: "PhysicsChemistryBlock",
    ...toPct(nodes.PhysicsChemistryBlock.x, nodes.PhysicsChemistryBlock.y),
  },
  {
    id: "library",
    label: "Library",
    group: "Campus",
    nodeKey: "LibraryMBA",
    ...toPct(nodes.LibraryMBA.x, nodes.LibraryMBA.y),
  },
  {
    id: "temple",
    label: "Temple",
    group: "Campus",
    nodeKey: "Temple",
    ...toPct(nodes.Temple.x, nodes.Temple.y),
  },
  {
    id: "admin",
    label: "Administrative",
    group: "Campus",
    nodeKey: "AdministrativeBlock",
    ...toPct(nodes.AdministrativeBlock.x, nodes.AdministrativeBlock.y),
  },
  {
    id: "boys",
    label: "Boys Hostel",
    group: "Hostels",
    nodeKey: "BoysHostels",
    ...toPct(nodes.BoysHostels.x, nodes.BoysHostels.y),
  },
  {
    id: "girls",
    label: "Girls Hostel",
    group: "Hostels",
    nodeKey: "GirlsHostels",
    ...toPct(nodes.GirlsHostels.x, nodes.GirlsHostels.y),
  },
  {
    id: "playground",
    label: "Playground",
    group: "Sports",
    nodeKey: "Playground",
    ...toPct(nodes.Playground.x, nodes.Playground.y),
  },
  {
    id: "indoor",
    label: "Indoor Sports",
    group: "Sports",
    nodeKey: "IndoorSports",
    ...toPct(nodes.IndoorSports.x, nodes.IndoorSports.y),
  },
  {
    id: "main-entrance",
    label: "Main Entrance",
    group: "Campus",
    nodeKey: "MainEntrance",
    ...toPct(nodes.MainEntrance.x, nodes.MainEntrance.y),
  },
];

export default nodes;
export { MAP_W, MAP_H, toPct, floorBadgeFromDetails, NODE_LABELS, PLACE_DETAILS, BASE_PINS };