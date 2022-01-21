import { aircraft } from "./aircraft";

export function round(value: any, decimals: any) {
  return parseFloat(value).toFixed(decimals);
}

export function updateAircraftVar(initialize: Boolean) {
  if (initialize) {
    aircraft.details.livery = SimVar.GetSimVarValue("TITLE", "string").replace(
      /\s+/g,
      "_"
    );
    aircraft.details.reg = SimVar.GetSimVarValue("", "string");
    aircraft.details.model = SimVar.GetSimVarValue("", "string");
    aircraft.fuel.leftTank.Capacity = SimVar.GetSimVarValue(
      "A:FUEL TANK LEFT MAIN CAPACITY",
      "Gallons"
    );
    aircraft.fuel.rightTank.Capacity = SimVar.GetSimVarValue(
      "A:FUEL TANK RIGHT MAIN CAPACITY",
      "Gallons"
    );
    aircraft.equipment.egt = SimVar.GetSimVarValue(
        "JPL152IP_CLOCKEGT_" + aircraft.details.livery,
        "bool"
      );
  }
  aircraft.fuel.leftTank.Quantity = SimVar.GetSimVarValue(
    "A:FUEL TANK LEFT MAIN QUANTITY",
    "Gallons"
  );
  aircraft.fuel.rightTank.Quantity = SimVar.GetSimVarValue(
    "A:FUEL TANK RIGHT MAIN QUANTITY",
    "Gallons"
  ); 
  aircraft.location.lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
  aircraft.location.long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
  aircraft.location.heading = SimVar.GetSimVarValue("PLANE HEADING", "degrees");
  return "Done";
}
