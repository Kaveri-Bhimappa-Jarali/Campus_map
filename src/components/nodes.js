// Real GPS coordinates for SDMCET Dharwad campus buildings.
// Verified against satellite imagery of the campus (~15.430°N, 75.014°E).
const nodes = {
MainEntrance:         { lat: 15.431261313098682, lng: 75.01260992331335},
  AcademicArea:         { lat: 15.430562502398589, lng: 75.01452152492303 },
  AuditoriumAdmin:      { lat: 15.430416426978626, lng: 75.01439487742509},
  AdministrativeBlock:  { lat: 15.43050181407361, lng: 75.0145830185025 },
  CSEBlock:             { lat: 15.430554803664092, lng: 75.01448120633201 },
  ISEBlock:             { lat: 15.430735790347253, lng: 75.01413251916007 },
  ECEBlock:             { lat: 15.430813356020302, lng: 75.01368995467261 },
  EEEBlock:             { lat: 15.43079056503788,  lng: 75.01362293989324 },
  LibraryMBA:           { lat: 15.430231612765962, lng: 75.01417007008628 },
  CivilBlock:           { lat: 15.429948386365824, lng: 75.01459221584862 },
  PhysicsDepartment:    { lat: 15.430110155523051,  lng: 75.01492174930672 },
  ChemistryDepartment:  { lat: 15.430280737814906, lng: 75.01479502478675 },
  MechanicalBlock:      { lat: 15.43018832041521, lng: 75.01572066620558 },
  AIMLBlock:            { lat: 15.43007843537352, lng: 75.01572737173498 },
  Temple:               { lat: 15.430371311,      lng: 75.016125407 },
  Bank:                 { lat: 15.430516011263363, lng: 75.01499417718992 },
  CanteenSIC:           { lat: 15.430084228029813, lng: 75.01541528400526 },
  Mess:                 { lat: 15.429020469181712, lng: 75.01478764709577 },
  BoysHostels:          { lat: 15.427980841815762, lng: 75.01582834419355 },
  GirlsHostels:         { lat: 15.431201340411992, lng: 75.0134779885397 },
  Playground:           { lat: 15.427892932851313, lng: 75.01475009616956 },
  IndoorSports:         { lat: 15.4315, lng: 75.0178 },
  PlacementOffice:      { lat: 15.430249711469548, lng: 75.01422371426658 },
  MBADepartment:        { lat: 15.430179902175558, lng: 75.01414861241416 },
  Karavali:             { lat: 15.4305855929, lng:  75.0157201036 },
  XeroxShop:            { lat: 15.430595935, lng: 75.0157804533 },
  Student2WParking:     { lat: 15.4310057223, lng: 75.0151824285 },
  FacultyParking:       { lat: 15.4303265969, lng: 75.0149973924 },
  PostOffice:           { lat: 15.4305862827, lng: 75.0149609988 },
  TransportationSection: { lat: 15.4305855929, lng: 75.0156208618 },  
};

// Georeference bounds for pixel conversion
const LAT_MIN = 15.427892932851313;
const LAT_MAX = 15.4315;
const LNG_MIN = 75.01260992331335;
const LNG_MAX = 75.0178;
const MAP_W = 600;
const MAP_H = 456;

function latLngToXY(lat, lng) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return { x, y };
}

const toPct = (x, y) => ({ xPct: (x / MAP_W) * 100, yPct: (y / MAP_H) * 100 });

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function routeDistanceMeters(route) {
  let dist = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = nodes[route[i]];
    const b = nodes[route[i + 1]];
    if (a && b) dist += haversine(a.lat, a.lng, b.lat, b.lng);
  }
  return dist;
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
  AuditoriumAdmin: "Auditorium / Admin",
  AdministrativeBlock: "Administrative Block",
  CSEBlock: "CSE Block",
  ISEBlock: "ISE Block",
  ECEBlock: "ECE Block",
  EEEBlock: "EEE Block",
  LibraryMBA: "Library / MBA",
  CivilBlock: "Civil Block",
  PhysicsDepartment: "Physics Department",
  ChemistryDepartment: "Chemistry Department",
  MechanicalBlock: "Mechanical Block",
  AIMLBlock: "AI & ML Block",
  Temple: "Temple",
  Bank: "Bank",
  CanteenSIC: "Canteen / SIC",
  Mess: "Mess",
  BoysHostels: "Boys Hostel",
  GirlsHostels: "Girls Hostel",
  Playground: "Playground",
  IndoorSports: "Indoor Sports",
  PlacementOffice: "Placement Office",
  MBADepartment: "MBA Department",
  Karavali: "Karavali",
  XeroxShop: "Xerox Shop",
  Student2WParking: "Student 2W Parking",
  FacultyParking: "Faculty Parking",
  PostOffice: "Post Office",
  TransportationSection: "Transportation Section",
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
    locationHint: "ECE block",
    floors: ["(Floor as per campus)"],
  },
  eee: {
    title: "Electrical and Electronics Engineering (EEE)",
    locationHint: "EEE block",
    floors: ["(Floor as per campus)"],
  },
  aiml: {
    title: "AI & ML (AIML)",
    locationHint: "AIML block",
    floors: ["(Floor as per campus)"],
  },
  admin: {
    title: "Administrative Block",
    locationHint: "Admin / Auditorium block",
    floors: ["First Floor – Administrative Block"],
  },
  library: {
    title: "Library",
    locationHint: "Library / MBA block",
    floors: ["First Floor – Library"],
  },
  civil: {
    title: "Civil Engineering",
    locationHint: "Civil block",
    floors: ["Ground Floor – Civil Engineering"],
  },
  chemical: {
    title: "Chemical Engineering",
    locationHint: "Chemistry Department",
    floors: ["(Floor as per campus)"],
  },
  mechanical: {
    title: "Mechanical Department",
    locationHint: "Mechanical block",
    floors: ["Mechanical Department (floor not specified)"],
  },
  boys: { title: "Boys Hostel", locationHint: "Hostels zone", floors: [] },
  girls: { title: "Girls Hostel", locationHint: "Hostels zone", floors: [] },
  playground: { title: "Playground", locationHint: "Sports zone", floors: [] },
  indoor: { title: "Indoor Sports", locationHint: "Sports complex area", floors: [] },
  temple: { title: "Temple", locationHint: "Near the top/north side", floors: [] },
  "main-entrance": { title: "Main Entrance", locationHint: "Entry point to campus", floors: [] },
  placement: { title: "Placement Office", locationHint: "Near Library", floors: [] },
  mba: { title: "MBA Department", locationHint: "Near Library", floors: [] },
  karavali: { title: "Karavali", locationHint: "Near Mechanical block", floors: [] },
  xerox: { title: "Xerox Shop", locationHint: "Near Karavali", floors: [] },
  student2w: { title: "Student 2 Wheeler Parking", locationHint: "Near Girls Hostel", floors: [] },
  faculty: { title: "Faculty Parking", locationHint: "Near Admin", floors: [] },
  postoffice: { title: "Post Office", locationHint: "Near Bank", floors: [] },
  transportation: { title: "Transportation Section", locationHint: "Near Mechanical", floors: [] },
};

// Map requested labels → existing routing nodes (from `nodes.js` + `graph.js`).
// NOTE: ISE/AIML don’t exist as separate nodes in your graph, so they’re placed near the Admin/CSE
// cluster visually, but route via the same `AuditoriumAdmin` node.
const BASE_PINS = [
  {
    id: "cse",
    label: "CSE",
    group: "Departments",
    nodeKey: "CSEBlock",
    ...toPct(latLngToXY(nodes.CSEBlock.lat, nodes.CSEBlock.lng).x, latLngToXY(nodes.CSEBlock.lat, nodes.CSEBlock.lng).y),
  },
  {
    id: "ise",
    label: "ISE",
    group: "Departments",
    nodeKey: "ISEBlock",
    ...toPct(latLngToXY(nodes.ISEBlock.lat, nodes.ISEBlock.lng).x, latLngToXY(nodes.ISEBlock.lat, nodes.ISEBlock.lng).y),
  },
  {
    id: "ece",
    label: "ECE",
    group: "Departments",
    nodeKey: "ECEBlock",
    ...toPct(latLngToXY(nodes.ECEBlock.lat, nodes.ECEBlock.lng).x, latLngToXY(nodes.ECEBlock.lat, nodes.ECEBlock.lng).y),
  },
  {
    id: "eee",
    label: "EEE",
    group: "Departments",
    nodeKey: "EEEBlock",
    ...toPct(latLngToXY(nodes.EEEBlock.lat, nodes.EEEBlock.lng).x, latLngToXY(nodes.EEEBlock.lat, nodes.EEEBlock.lng).y),
  },
  {
    id: "aiml",
    label: "AIML",
    group: "Departments",
    nodeKey: "AIMLBlock",
    ...toPct(latLngToXY(nodes.AIMLBlock.lat, nodes.AIMLBlock.lng).x, latLngToXY(nodes.AIMLBlock.lat, nodes.AIMLBlock.lng).y),
  },
  {
    id: "mechanical",
    label: "Mechanical",
    group: "Departments",
    nodeKey: "MechanicalBlock",
    ...toPct(latLngToXY(nodes.MechanicalBlock.lat, nodes.MechanicalBlock.lng).x, latLngToXY(nodes.MechanicalBlock.lat, nodes.MechanicalBlock.lng).y),
  },
  {
    id: "civil",
    label: "Civil",
    group: "Departments",
    nodeKey: "CivilBlock",
    ...toPct(latLngToXY(nodes.CivilBlock.lat, nodes.CivilBlock.lng).x, latLngToXY(nodes.CivilBlock.lat, nodes.CivilBlock.lng).y),
  },
  {
    id: "chemical",
    label: "Chemical",
    group: "Departments",
    nodeKey: "ChemistryDepartment",
    ...toPct(latLngToXY(nodes.ChemistryDepartment.lat, nodes.ChemistryDepartment.lng).x, latLngToXY(nodes.ChemistryDepartment.lat, nodes.ChemistryDepartment.lng).y),
  },
  {
    id: "library",
    label: "Library",
    group: "Campus",
    nodeKey: "LibraryMBA",
    ...toPct(latLngToXY(nodes.LibraryMBA.lat, nodes.LibraryMBA.lng).x, latLngToXY(nodes.LibraryMBA.lat, nodes.LibraryMBA.lng).y),
  },
  {
    id: "temple",
    label: "Temple",
    group: "Campus",
    nodeKey: "Temple",
    ...toPct(latLngToXY(nodes.Temple.lat, nodes.Temple.lng).x, latLngToXY(nodes.Temple.lat, nodes.Temple.lng).y),
  },
  {
    id: "admin",
    label: "Administrative",
    group: "Campus",
    nodeKey: "AdministrativeBlock",
    ...toPct(latLngToXY(nodes.AdministrativeBlock.lat, nodes.AdministrativeBlock.lng).x, latLngToXY(nodes.AdministrativeBlock.lat, nodes.AdministrativeBlock.lng).y),
  },
  {
    id: "boys",
    label: "Boys Hostel",
    group: "Hostels",
    nodeKey: "BoysHostels",
    ...toPct(latLngToXY(nodes.BoysHostels.lat, nodes.BoysHostels.lng).x, latLngToXY(nodes.BoysHostels.lat, nodes.BoysHostels.lng).y),
  },
  {
    id: "girls",
    label: "Girls Hostel",
    group: "Hostels",
    nodeKey: "GirlsHostels",
    ...toPct(latLngToXY(nodes.GirlsHostels.lat, nodes.GirlsHostels.lng).x, latLngToXY(nodes.GirlsHostels.lat, nodes.GirlsHostels.lng).y),
  },
  {
    id: "playground",
    label: "Playground",
    group: "Sports",
    nodeKey: "Playground",
    ...toPct(latLngToXY(nodes.Playground.lat, nodes.Playground.lng).x, latLngToXY(nodes.Playground.lat, nodes.Playground.lng).y),
  },
  {
    id: "indoor",
    label: "Indoor Sports",
    group: "Sports",
    nodeKey: "IndoorSports",
    ...toPct(latLngToXY(nodes.IndoorSports.lat, nodes.IndoorSports.lng).x, latLngToXY(nodes.IndoorSports.lat, nodes.IndoorSports.lng).y),
  },
  {
    id: "main-entrance",
    label: "Main Entrance",
    group: "Campus",
    nodeKey: "MainEntrance",
    ...toPct(latLngToXY(nodes.MainEntrance.lat, nodes.MainEntrance.lng).x, latLngToXY(nodes.MainEntrance.lat, nodes.MainEntrance.lng).y),
  },
  {
    id: "placement",
    label: "Placement",
    group: "Campus",
    nodeKey: "PlacementOffice",
    ...toPct(latLngToXY(nodes.PlacementOffice.lat, nodes.PlacementOffice.lng).x, latLngToXY(nodes.PlacementOffice.lat, nodes.PlacementOffice.lng).y),
  },
  {
    id: "mba",
    label: "MBA",
    group: "Campus",
    nodeKey: "MBADepartment",
    ...toPct(latLngToXY(nodes.MBADepartment.lat, nodes.MBADepartment.lng).x, latLngToXY(nodes.MBADepartment.lat, nodes.MBADepartment.lng).y),
  },
  {
    id: "karavali",
    label: "Karavali",
    group: "Campus",
    nodeKey: "Karavali",
    ...toPct(latLngToXY(nodes.Karavali.lat, nodes.Karavali.lng).x, latLngToXY(nodes.Karavali.lat, nodes.Karavali.lng).y),
  },
  {
    id: "xerox",
    label: "Xerox",
    group: "Campus",
    nodeKey: "XeroxShop",
    ...toPct(latLngToXY(nodes.XeroxShop.lat, nodes.XeroxShop.lng).x, latLngToXY(nodes.XeroxShop.lat, nodes.XeroxShop.lng).y),
  },
  {
    id: "student2w",
    label: "Student 2W",
    group: "Parking",
    nodeKey: "Student2WParking",
    ...toPct(latLngToXY(nodes.Student2WParking.lat, nodes.Student2WParking.lng).x, latLngToXY(nodes.Student2WParking.lat, nodes.Student2WParking.lng).y),
  },
  {
    id: "faculty",
    label: "Faculty",
    group: "Parking",
    nodeKey: "FacultyParking",
    ...toPct(latLngToXY(nodes.FacultyParking.lat, nodes.FacultyParking.lng).x, latLngToXY(nodes.FacultyParking.lat, nodes.FacultyParking.lng).y),
  },
  {
    id: "postoffice",
    label: "Post Office",
    group: "Campus",
    nodeKey: "PostOffice",
    ...toPct(latLngToXY(nodes.PostOffice.lat, nodes.PostOffice.lng).x, latLngToXY(nodes.PostOffice.lat, nodes.PostOffice.lng).y),
  },
  {
    id: "transportation",
    label: "Transportation",
    group: "Campus",
    nodeKey: "TransportationSection",
    ...toPct(latLngToXY(nodes.TransportationSection.lat, nodes.TransportationSection.lng).x, latLngToXY(nodes.TransportationSection.lat, nodes.TransportationSection.lng).y),
  },
];

export default nodes;
export { MAP_W, MAP_H, toPct, floorBadgeFromDetails, NODE_LABELS, PLACE_DETAILS, BASE_PINS, routeDistanceMeters };
