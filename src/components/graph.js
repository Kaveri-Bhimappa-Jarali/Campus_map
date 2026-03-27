const graph = {
  // Exterior Backbone
  MainEntrance: [
    "GirlsHostels", "EEEBlock", 
    "CanteenSIC", "Student2WParking", "FacultyParking", "Temple", 
    "MechanicalBlock", "AIMLBlock", "AuditoriumAdmin", "AdministrativeBlock", 
    "IndoorSports", "Mess"
  ],
  GirlsHostels: ["MainEntrance", "EEEBlock"],
  
  // Cyan Block
  EEEBlock: ["MainEntrance", "GirlsHostels", "LibraryMBA", "AuditoriumAdmin", "ECEBlock"],
  ECEBlock: ["EEEBlock", "ISEBlock"],
  ISEBlock: ["ECEBlock"],
  AIMLBlock: ["MainEntrance", "ECEBlock"],

  // Yellow Block
  LibraryMBA: ["EEEBlock", "AuditoriumAdmin", "PlacementOffice", "MBADepartment", "Playground", "IndoorSports"],
  PlacementOffice: ["LibraryMBA"],
  MBADepartment: ["LibraryMBA"],

  // Magenta Block
  AuditoriumAdmin: ["MainEntrance", "EEEBlock", "LibraryMBA", "AdministrativeBlock", "AcademicArea", "CivilBlock", "Bank", "Student2WParking", "FacultyParking"],
  AdministrativeBlock: ["MainEntrance", "AuditoriumAdmin", "CSEBlock"],
  CSEBlock: ["AdministrativeBlock"],
  FacultyParking: ["MainEntrance", "AuditoriumAdmin", "Bank"],

  // Central Area
  AcademicArea: ["AuditoriumAdmin", "CivilBlock", "Student2WParking"],
  Student2WParking: ["MainEntrance", "AuditoriumAdmin", "AcademicArea", "Bank"],

  // Green Block
  CivilBlock: ["AuditoriumAdmin", "AcademicArea", "Bank", "PhysicsDepartment", "ChemistryDepartment"],
  PhysicsDepartment: ["CivilBlock", "ChemistryDepartment", "ChemicalDepartment"],
  ChemistryDepartment: ["CivilBlock", "PhysicsDepartment", "ChemicalDepartment"],
  ChemicalDepartment: ["PhysicsDepartment", "ChemistryDepartment"],

  // Bank & Post
  Bank: ["AuditoriumAdmin", "CivilBlock", "PostOffice", "Student2WParking", "MechanicalBlock", "FacultyParking"],
  PostOffice: ["Bank"],

  // Peach & Far East
  MechanicalBlock: ["MainEntrance", "Bank", "Karavali", "TransportationSection", "CanteenSIC", "Temple"],
  Karavali: ["MechanicalBlock", "XeroxShop"],
  XeroxShop: ["Karavali"],
  TransportationSection: ["MechanicalBlock"],
  
  // Southern Route & Hostels
  CanteenSIC: ["MainEntrance", "MechanicalBlock", "BoysHostels", "Mess"],
  Temple: ["MainEntrance", "MechanicalBlock", "BoysHostels"],
  BoysHostels: ["CanteenSIC", "Temple", "Mess"],
  Mess: ["MainEntrance", "CanteenSIC", "BoysHostels", "Playground"],
  Playground: ["Mess", "LibraryMBA", "IndoorSports"],
  IndoorSports: ["MainEntrance", "Playground", "LibraryMBA"]
};

export default graph;
