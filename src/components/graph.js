const graph = {
  MainEntrance: ["AcademicArea", "GirlsHostels"],
  AcademicArea: ["MainEntrance", "GirlsHostels", "AuditoriumAdminCSE", "LibraryMBA", "CivilBlock"],
  AuditoriumAdminCSE: ["AcademicArea", "PhysicsChemistryBlock", "BankPostOffice", "AdministrativeBlock", "CSEBlock", "ISEBlock"],
  AdministrativeBlock: ["AuditoriumAdminCSE"],
  CSEBlock: ["AuditoriumAdminCSE", "ISEBlock"],
  ISEBlock: ["AuditoriumAdminCSE", "CSEBlock"],
  PhysicsChemistryBlock: ["AuditoriumAdminCSE", "CivilBlock", "CanteenSIC"],
  LibraryMBA: ["AcademicArea", "IndoorSports"],
  CivilBlock: ["AcademicArea", "PhysicsChemistryBlock", "MechanicalBlock"],
  MechanicalBlock: ["CivilBlock", "Temple", "CanteenSIC"],
  Temple: ["MechanicalBlock", "BoysHostels"],
  BankPostOffice: ["AuditoriumAdminCSE"],
  CanteenSIC: ["PhysicsChemistryBlock", "MechanicalBlock", "BoysHostels"],
  BoysHostels: ["Temple", "CanteenSIC", "DiningRecreation"],
  GirlsHostels: ["MainEntrance", "AcademicArea"],
  DiningRecreation: ["BoysHostels", "Playground", "STP"],
  IndoorSports: ["LibraryMBA", "Playground"],
  Playground: ["IndoorSports", "DiningRecreation", "STP"],
  STP: ["DiningRecreation", "Playground"]
};

export default graph;