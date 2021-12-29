'use strict';
class JPL152IP extends BaseInstrument {

  // @TODO Check if the aircraft is on the ground as this can cause issues when loading when flying and all your switches are off. It is race to see who wins, the floor or the pilot

  constructor() {
    super();
    //Set our variables and read from the DataStore whilst the sim is loading the flight
    //
    // For people trying to read code and new to JS
    //
    // I am setting a variable to be used and referenced in the class with this.name
    // In this section there are shortened if statements checking the MS DataStore for the named item (e.g. JPL152IP_PROP)
    // if this returns an entry, use that value, if it returns NULL or 0 set it to the value I want for a 'new plane'
    // So...
    // this.name = GetStoredData('THE NAME OF THE ITEM') ? Value if true : value if false
    //
    //
    this.engHasRun = false;
    this.engHours = GetStoredData('JPL152IP_ENG_HOURS') ? GetStoredData('JPL152IP_ENG_HOURS') : 0;
    this.engHobbsRunning = false;
    this.engHobbsTimerStart = '';
    this.engHobbsTimerEnd = '';
    this.leftFuel = GetStoredData('JPL152IP_LEFT_FUEL') ? GetStoredData('JPL152IP_LEFT_FUEL') : 32; // See JuiceBox7535 post #1825 in main forum
    this.rightFuel = GetStoredData('JPL152IP_RIGHT_FUEL') ? GetStoredData('JPL152IP_RIGHT_FUEL') : 32;
    this.bat1 = GetStoredData('JPL152IP_BAT1') ? GetStoredData('JPL152IP_BAT1') : 0;
    this.alt1 = GetStoredData('JPL152IP_ALT1') ? GetStoredData('JPL152IP_ALT1') : 0;
    this.pBrake = GetStoredData('JPL152IP_PBRAKE') ? GetStoredData('JPL152IP_PBRAKE') : 1;
    this.magento = GetStoredData('JPL152IP_MAGNETO') ? GetStoredData('JPL152IP_MAGNETO') : 0;
    this.pitotHeat = GetStoredData('JPL152IP_PITOT') ? GetStoredData('JPL152IP_PITOT') : 0;
    this.strobe = GetStoredData('JPL152IP_STROBE') ? GetStoredData('JPL152IP_STROBE') : 0;
    this.beacon = GetStoredData('JPL152IP_BEACON') ? GetStoredData('JPL152IP_BEACON') : 0;
    this.navLight = GetStoredData('JPL152IP_NAV_LIGHT') ? GetStoredData('JPL152IP_NAV_LIGHT') : 0;
    this.floodLight = GetStoredData('JPL152IP_FLOOD_LIGHT') ? GetStoredData('JPL152IP_FLOOD_LIGHT') : 0;
    this.panelLight = GetStoredData('JPL152IP_PANEL_LIGHT') ? GetStoredData('JPL152IP_PANEL_LIGHT') : 0;
    this.taxiLight = GetStoredData('JPL152IP_TAXI_LIGHT') ? GetStoredData('JPL152IP_TAXI_LIGHT') : 0;
    this.landingLight = GetStoredData('JPL152IP_LANDING_LIGHT') ? GetStoredData('JPL152IP_LANDING_LIGHT') : 0;
    this.throttle = GetStoredData('JPL152IP_THROTTLE') ? GetStoredData('JPL152IP_THROTTLE') : 0;
    this.mixture = GetStoredData('JPL152IP_MIXTURE') ? GetStoredData('JPL152IP_MIXTURE') : 0;
    this.flaps = GetStoredData('JPL152IP_FLAPS') ? GetStoredData('JPL152IP_FLAPS') : 0;
    this.pitchTrim = GetStoredData('JPL152IP_PITCH_TRIM') ? GetStoredData('JPL152IP_PITCH_TRIM') : 0;
	this.plugFouling = GetStoredData('JPL152IP_PLUG_FOUL') ? GetStoredData('JPL152IP_PLUG_FOUL') : 0;
  }

  //load the gauge template - found in JPL152IP.HTML
  get templateID() { return 'JPL152IP'; }

  //Runs as the sim is loading
  connectedCallback() {
    super.connectedCallback();
    //load fuel
    SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "number", Number(this.leftFuel));
    SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "number", Number(this.rightFuel));

  } //end connectedCallback

  //Runs once the flight is loaded
  onFlightStart() {
    super.onFlightStart();

    //set the variables that we need to wait for the flight to load

    //Parking Brake
    SimVar.SetSimVarValue("K:PARKING_BRAKES", "number", Number(this.pBrake));
    //Battery 1
    SimVar.SetSimVarValue("ELECTRICAL MASTER BATTERY:1", "number", Number(this.bat1));


    //Pitot Heat
    if (this.pitotHeat) {
      SimVar.SetSimVarValue("K:PITOT_HEAT_ON", "number", 1);
    } else {
      SimVar.SetSimVarValue("K:PITOT_HEAT_OFF", "number", 1);
    }

    //Alternator 1
    if (this.alt1) {
      SimVar.SetSimVarValue("K:ALTERNATOR_ON", "number", 1);
    } else {
      SimVar.SetSimVarValue("K:ALTERNATOR_OFF", "number", 1);
    }
	
	SimVar.SetSimVarValue("L:JPL152_ELAPSED_TIME", "number", Number(this.plugFouling));
	
    // I don't think we need to run this every frame so just run it on a timer here
    // Also there might be a performance hit if we try to do that...
    //
    // @TODO NEED TO SET TO 60000 ONCE DEV COMPLETE
    //
    var timerMilSecs = 1000;
    var timer = window.setInterval(checkC152State, timerMilSecs);

    function checkC152State() {

      //if the battery master IS on and the engine is running keep the fuel updated
      if (SimVar.GetSimVarValue("ENG COMBUSTION:1", "bool") ==  1) {
        this.engHasRun = true;
        let lefttank = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "gallons");
        let righttank = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "gallons");
        SetStoredData('JPL152IP_LEFT_FUEL', lefttank.toString());
        SetStoredData('JPL152IP_RIGHT_FUEL', righttank.toString());
      }

      //the engine has shutdown - record everything
      if (SimVar.GetSimVarValue("ENG COMBUSTION:1", "bool") == 0) {
        this.engHasRun = false;
        //Set the Parking Brake
        var parkingBrake = SimVar.GetSimVarValue("BRAKE PARKING POSITION", "bool");
        SetStoredData('JPL152IP_PBRAKE', parkingBrake.toString());
        //set the fuel
        var lefttank = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "gallons");
        var righttank = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "gallons");
        SetStoredData('JPL152IP_LEFT_FUEL', lefttank.toString());
        SetStoredData('JPL152IP_RIGHT_FUEL', righttank.toString());
        //Set Battery switches
        var bat1 = SimVar.GetSimVarValue("ELECTRICAL MASTER BATTERY:1", "bool");
        SetStoredData('JPL152IP_BAT1', bat1.toString());
        var alt1 = SimVar.GetSimVarValue("GENERAL ING MASTER ALTERNATOR:1", "bool");
        SetStoredData('JPL152IP_ALT1', alt1.toString());
		//set fouling amount
        var plugFouling = SimVar.GetSimVarValue("L:JPL152_ELAPSED_TIME", "number");
        SetStoredData('JPL152IP_PLUG_FOUL', plugFouling.toString());		

      }
    }
  } //End onFlightStart()

  //Runs every frame
  Update() {
    super.Update();

    if (this.engHasRun == true && this.engHobbsRunning == false) {
      this.engHobbsRunning = true;
      var today = new Date();
      this.engHobbsTimerStart = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    }

    if (this.engHasRun == false && this.engHobbsRunning == true) {
      this.engHobbsRunning = false;
      var today = new Date();
      this.engHobbsTimerEnd = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

      //run the time difference here - to set the hobbs timer

    }


    //@TODO NEED TO COME UP WITH AN EFFECTIVE WAY TO DELETE THE STORED ITEMS (ARRAY?) WHEN NEEDED
    //@TODO DO WE NEED TO BE ABLE TO LET THE USER HAVE STATE SAVING OR NOT?


    //DeleteStoredData('JPL152IP_LEFT_FUEL');
    //DeleteStoredData('JPL152IP_RIGHT_FUEL');
    //DeleteStoredData('JPL152IP_BAT1');
    //DeleteStoredData('JPL152IP_BAT2');
  }
}

registerInstrument('jpl152ip-element', JPL152IP);