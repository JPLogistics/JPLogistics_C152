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
	var title = SimVar.GetSimVarValue("TITLE", "string");
	this.livery = title.replace(/\s+/g, '_');
    //
	//--------------------------------FUEL AND WEIGHTS
    this.leftFuel = GetStoredData('JPL152IP_LEFT_FUEL_'+this.livery) ? GetStoredData('JPL152IP_LEFT_FUEL_'+this.livery) : 2;
    this.rightFuel = GetStoredData('JPL152IP_RIGHT_FUEL_'+this.livery) ? GetStoredData('JPL152IP_RIGHT_FUEL_'+this.livery) : 3;
	this.coPilotWeight = GetStoredData('JPL152IP_COPILOTWEIGHT_'+this.livery) ? GetStoredData('JPL152IP_COPILOTWEIGHT_'+this.livery) : 170;
	this.baggage1 = GetStoredData('JPL152IP_BAGGAGE1_'+this.livery) ? GetStoredData('JPL152IP_BAGGAGE1_'+this.livery) : 0;
	this.baggage2 = GetStoredData('JPL152IP_BAGGAGE2_'+this.livery) ? GetStoredData('JPL152IP_BAGGAGE2_'+this.livery) : 0;
	//------------------------------------HANDLING
	this.trim = GetStoredData('JPL152IP_TRIM_'+this.livery) ? GetStoredData('JPL152IP_TRIM_'+this.livery) : 1;
	this.flaps = GetStoredData('JPL152IP_FLAPS_'+this.livery) ? GetStoredData('JPL152IP_FLAPS_'+this.livery) : 0;
	this.flapsL = GetStoredData('JPL152IP_FLAPSL_'+this.livery) ? GetStoredData('JPL152IP_FLAPSL_'+this.livery) : 0;
	this.flapsR = GetStoredData('JPL152IP_FLAPSR_'+this.livery) ? GetStoredData('JPL152IP_FLAPSR_'+this.livery) : 0;
	//-------------------------------------KNOBS
	this.headingBug = GetStoredData('JPL152IP_HEADINGBUG_'+this.livery) ? GetStoredData('JPL152IP_HEADINGBUG_'+this.livery) : 0;
	this.obs1 = GetStoredData('JPL152IP_OBS1_'+this.livery) ? GetStoredData('JPL152IP_OBS1_'+this.livery) : 55;
	this.obs2 = GetStoredData('JPL152IP_OBS2_'+this.livery) ? GetStoredData('JPL152IP_OBS2_'+this.livery) : 55;
	this.panelknob = GetStoredData('JPL152IP_PANELKNOB_'+this.livery) ? GetStoredData('JPL152IP_PANELKNOB_'+this.livery) : 15;
	this.radioknob = GetStoredData('JPL152IP_RADIOKNOB_'+this.livery) ? GetStoredData('JPL152IP_RADIOKNOB_'+this.livery) : 15;
	this.mapknob = GetStoredData('JPL152IP_MAPKNOB_'+this.livery) ? GetStoredData('JPL152IP_MAPKNOB_'+this.livery) : 15;
	//-----------------------------------SWITCHES
	this.pitot = GetStoredData('JPL152IP_PITOT_'+this.livery) ? GetStoredData('JPL152IP_PITOT_'+this.livery) : 0;
	this.nav = GetStoredData('JPL152IP_NAV_'+this.livery) ? GetStoredData('JPL152IP_NAV_'+this.livery) : 0;
	this.strobe = GetStoredData('JPL152IP_STROBE_'+this.livery) ? GetStoredData('JPL152IP_STROBE_'+this.livery) : 0;
	this.beacon = GetStoredData('JPL152IP_BEACON_'+this.livery) ? GetStoredData('JPL152IP_BEACON_'+this.livery) : 0;
	this.taxi = GetStoredData('JPL152IP_TAXI_'+this.livery) ? GetStoredData('JPL152IP_TAXI_'+this.livery) : 0;
	this.landing = GetStoredData('JPL152IP_LANDING_'+this.livery) ? GetStoredData('JPL152IP_LANDING_'+this.livery) : 0;
	this.panel = GetStoredData('JPL152IP_PANEL_'+this.livery) ? GetStoredData('JPL152IP_PANEL_'+this.livery) : 0;
	this.cabin = GetStoredData('JPL152IP_CABIN_'+this.livery) ? GetStoredData('JPL152IP_CABIN_'+this.livery) : 0; //NOT WORKING
	this.battery = GetStoredData('JPL152IP_BATTERY_'+this.livery) ? GetStoredData('JPL152IP_BATTERY_'+this.livery) : 0;
	this.alternator = GetStoredData('JPL152IP_ALTERNATOR_'+this.livery) ? GetStoredData('JPL152IP_ALTERNATOR_'+this.livery) : 0;
	this.fuelvalve = GetStoredData('JPL152IP_FUELVALVE_'+this.livery) ? GetStoredData('JPL152IP_FUELVALVE_'+this.livery) : 0;
	this.APViz = GetStoredData('JPL152IP_APVIZ_'+this.livery) ? GetStoredData('JPL152IP_APVIZ_'+this.livery) : 1;
	this.dmeswitch = GetStoredData('JPL152IP_DMESWITCH_'+this.livery) ? GetStoredData('JPL152IP_DMESWITCH_'+this.livery) : 0;
	//-----------------------------------------COM
	this.com1act = GetStoredData('JPL152IP_COM1ACT_'+this.livery) ? GetStoredData('JPL152IP_COM1ACT_'+this.livery) : 122800000; //must be set to hz
	this.com1stby = GetStoredData('JPL152IP_COM1STBY_'+this.livery) ? GetStoredData('JPL152IP_COM1STBY_'+this.livery) : 124850000; //must be set to hz
	this.com2act = GetStoredData('JPL152IP_COM2ACT_'+this.livery) ? GetStoredData('JPL152IP_COM2ACT_'+this.livery) : 123800000; //must be set to hz
	this.com2stby = GetStoredData('JPL152IP_COM2STBY_'+this.livery) ? GetStoredData('JPL152IP_COM2STBY_'+this.livery) : 123850000; //must be set to hz
	this.com1vol = GetStoredData('JPL152IP_COM1VOL_'+this.livery) ? GetStoredData('JPL152IP_COM1VOL_'+this.livery) : 0;
	this.com2vol = GetStoredData('JPL152IP_COM2VOL_'+this.livery) ? GetStoredData('JPL152IP_COM2VOL_'+this.livery) : 0;
	//---------------------------------------NAV
	this.nav1act = GetStoredData('JPL152IP_NAV1ACT_'+this.livery) ? GetStoredData('JPL152IP_NAV1ACT_'+this.livery) : 115900000; //must be set to hz
	this.nav1stby = GetStoredData('JPL152IP_NAV1STBY_'+this.livery) ? GetStoredData('JPL152IP_NAV1STBY_'+this.livery) : 115900000; //must be set to hz
	this.nav2act = GetStoredData('JPL152IP_NAV2ACT_'+this.livery) ? GetStoredData('JPL152IP_NAV2ACT_'+this.livery) : 115900000; //must be set to hz
	this.nav2stby = GetStoredData('JPL152IP_NAV2STBY_'+this.livery) ? GetStoredData('JPL152IP_NAV2STBY_'+this.livery) : 115900000; //must be set to hz
	this.nav1vol = GetStoredData('JPL152IP_NAV1VOL_'+this.livery) ? GetStoredData('JPL152IP_NAV1VOL_'+this.livery) : 100;
	this.nav2vol = GetStoredData('JPL152IP_NAV2VOL_'+this.livery) ? GetStoredData('JPL152IP_NAV2VOL_'+this.livery) : 100;
	//---------------------------------------ADF
	this.adfvol = GetStoredData('JPL152IP_ADFVOL_'+this.livery) ? GetStoredData('JPL152IP_ADFVOL_'+this.livery) : 50;
	this.adfact = GetStoredData('JPL152IP_ADFACT_'+this.livery) ? GetStoredData('JPL152IP_ADFACT_'+this.livery) : 104700; //must be set to hz
	this.adfstby = GetStoredData('JPL152IP_ADFSTBY_'+this.livery) ? GetStoredData('JPL152IP_ADFSTBY_'+this.livery) : 104700; //must be set to hz
	this.adfcard = GetStoredData('JPL152IP_ADFCARD_'+this.livery) ? GetStoredData('JPL152IP_ADFCARD_'+this.livery) : 55;
	//-----------------------------------AUDIO BUTTONS
	this.pilottrans = GetStoredData('JPL152IP_PILOTTRANS_'+this.livery) ? GetStoredData('JPL152IP_PILOTTRANS_'+this.livery) : 0;
	this.btncom1 = GetStoredData('JPL152IP_BTNCOM1_'+this.livery) ? GetStoredData('JPL152IP_BTNCOM1_'+this.livery) : 1;
	this.btncom2 = GetStoredData('JPL152IP_BTNCOM2_'+this.livery) ? GetStoredData('JPL152IP_BTNCOM2_'+this.livery) : 0;
	this.btnboth = GetStoredData('JPL152IP_BTNBOTH_'+this.livery) ? GetStoredData('JPL152IP_BTNBOTH_'+this.livery) : 0;
	this.btnnav1 = GetStoredData('JPL152IP_BTNNAV1_'+this.livery) ? GetStoredData('JPL152IP_BTNNAV1_'+this.livery) : 0;
	this.btnnav2 = GetStoredData('JPL152IP_BTNNAV2_'+this.livery) ? GetStoredData('JPL152IP_BTNNAV2_'+this.livery) : 0;
	this.btnadf = GetStoredData('JPL152IP_BTNADF_'+this.livery) ? GetStoredData('JPL152IP_BTNADF_'+this.livery) : 0;
	this.btndme = GetStoredData('JPL152IP_BTNDME_'+this.livery) ? GetStoredData('JPL152IP_BTNDME_'+this.livery) : 0;
	this.btnmkr = GetStoredData('JPL152IP_BTNMKR_'+this.livery) ? GetStoredData('JPL152IP_BTNMKR_'+this.livery) : 1;
	this.btnspkr = GetStoredData('JPL152IP_BTNSPKR_'+this.livery) ? GetStoredData('JPL152IP_BTNSPKR_'+this.livery) : 1;
	//----------------------------------------TRANSPONDER
	this.xpndrcode = GetStoredData('JPL152IP_XPNDERCODE_'+this.livery) ? GetStoredData('JPL152IP_XPNDERCODE_'+this.livery) : 2435;
	this.xpndrstate = GetStoredData('JPL152IP_XPNDERSTATE_'+this.livery) ? GetStoredData('JPL152IP_XPNDERSTATE_'+this.livery) : 4;
	//----------------------------------------MISC
	this.yoke1 = GetStoredData('JPL152IP_YOKE1_'+this.livery) ? GetStoredData('JPL152IP_YOKE1_'+this.livery) : 0;
	this.yoke2 = GetStoredData('JPL152IP_YOKE2_'+this.livery) ? GetStoredData('JPL152IP_YOKE2_'+this.livery) : 0;
	this.door1 = GetStoredData('JPL152IP_DOOR1_'+this.livery) ? GetStoredData('JPL152IP_DOOR1_'+this.livery) : 1;
	this.window1 = GetStoredData('JPL152IP_WINDOW1_'+this.livery) ? GetStoredData('JPL152IP_WINDOW1_'+this.livery) : 1;
	this.visor1 = GetStoredData('JPL152IP_VISOR1_'+this.livery) ? GetStoredData('JPL152IP_VISOR1_'+this.livery) : 16384;
	this.door2 = GetStoredData('JPL152IP_DOOR2_'+this.livery) ? GetStoredData('JPL152IP_DOOR2_'+this.livery) : 1;
	this.window2 = GetStoredData('JPL152IP_WINDOW2_'+this.livery) ? GetStoredData('JPL152IP_WINDOW2_'+this.livery) : 1;
	this.visor2 = GetStoredData('JPL152IP_VISOR2_'+this.livery) ? GetStoredData('JPL152IP_VISOR2_'+this.livery) : 12000;
	//---------------------------------------ENG MAINTENANCE
	this.plugFouling = GetStoredData('JPL152IP_PLUG_FOUL_'+this.livery) ? GetStoredData('JPL152IP_PLUG_FOUL_'+this.livery) : 5;
	this.engoil = GetStoredData('JPL152IP_ENGOIL_'+this.livery) ? GetStoredData('JPL152IP_ENGOIL_'+this.livery) : 7;
	this.engmaintenance = GetStoredData('JPL152IP_ENGMAINTENANCE_'+this.livery) ? GetStoredData('JPL152IP_ENGMAINTENANCE_'+this.livery) : 0;
	//---------------------------------------LEVERS
	this.carbheat = GetStoredData('JPL152IP_CARBHEAT_'+this.livery) ? GetStoredData('JPL152IP_CARBHEAT_'+this.livery) : 10000;
	this.cabair = GetStoredData('JPL152IP_CABAIR_'+this.livery) ? GetStoredData('JPL152IP_CABAIR_'+this.livery) : 50;
	this.cabheat = GetStoredData('JPL152IP_CABHEAT_'+this.livery) ? GetStoredData('JPL152IP_CABHEAT_'+this.livery) : 70;
	this.throttle = GetStoredData('JPL152IP_THROTTLE_'+this.livery) ? GetStoredData('JPL152IP_THROTTLE_'+this.livery) : 0;
	this.mixture = GetStoredData('JPL152IP_MIXTURE_'+this.livery) ? GetStoredData('JPL152IP_MIXTURE_'+this.livery) : 0;
	this.parkingbrake = GetStoredData('JPL152IP_PARKINGBRAKE_'+this.livery) ? GetStoredData('JPL152IP_PARKINGBRAKE_'+this.livery) : 1;
	//--------------------------------------BREAKERS 3-13
	this.altbreaker = GetStoredData('JPL152IP_ALTBREAKER_'+this.livery) ? GetStoredData('JPL152IP_ALTBREAKER_'+this.livery) : 0;
	this.breaker3 = GetStoredData('JPL152IP_BREAKER3_'+this.livery) ? GetStoredData('JPL152IP_BREAKER3_'+this.livery) : 1;
	this.breaker4 = GetStoredData('JPL152IP_BREAKER4_'+this.livery) ? GetStoredData('JPL152IP_BREAKER4_'+this.livery) : 1;
	this.breaker5 = GetStoredData('JPL152IP_BREAKER5_'+this.livery) ? GetStoredData('JPL152IP_BREAKER5_'+this.livery) : 1;
	this.breaker6 = GetStoredData('JPL152IP_BREAKER6_'+this.livery) ? GetStoredData('JPL152IP_BREAKER6_'+this.livery) : 1;
	this.breaker7 = GetStoredData('JPL152IP_BREAKER7_'+this.livery) ? GetStoredData('JPL152IP_BREAKER7_'+this.livery) : 1;
	this.breaker8 = GetStoredData('JPL152IP_BREAKER8_'+this.livery) ? GetStoredData('JPL152IP_BREAKER8_'+this.livery) : 1;
	this.breaker9 = GetStoredData('JPL152IP_BREAKER9_'+this.livery) ? GetStoredData('JPL152IP_BREAKER9_'+this.livery) : 1;
	this.breaker10 = GetStoredData('JPL152IP_BREAKER10_'+this.livery) ? GetStoredData('JPL152IP_BREAKER10_'+this.livery) : 1;
	this.breaker11 = GetStoredData('JPL152IP_BREAKER11_'+this.livery) ? GetStoredData('JPL152IP_BREAKER11_'+this.livery) : 1;
	this.breaker12 = GetStoredData('JPL152IP_BREAKER12_'+this.livery) ? GetStoredData('JPL152IP_BREAKER12_'+this.livery) : 1;
	this.breaker13 = GetStoredData('JPL152IP_BREAKER13_'+this.livery) ? GetStoredData('JPL152IP_BREAKER13_'+this.livery) : 1;
	this.breaker14 = GetStoredData('JPL152IP_BREAKER14_'+this.livery) ? GetStoredData('JPL152IP_BREAKER14_'+this.livery) : 1;
	//----------------------------------TESTING
	this.magnetoL = GetStoredData('JPL152IP_MAGNETOL_'+this.livery) ? GetStoredData('JPL152IP_MAGNETOL_'+this.livery) : 0;
	this.magnetoR = GetStoredData('JPL152IP_MAGNETOR_'+this.livery) ? GetStoredData('JPL152IP_MAGNETOR_'+this.livery) : 0;
	this.engcombustion = GetStoredData('JPL152IP_ENGCOMBUSTION_'+this.livery) ? GetStoredData('JPL152IP_ENGCOMBUSTION_'+this.livery) : 0;
	this.simonground = GetStoredData('JPL152IP_SIMONGROUND_'+this.livery) ? GetStoredData('JPL152IP_SIMONGROUND_'+this.livery) : 1;
	this.onparkingspot = GetStoredData('JPL152IP_ONPARKINGSPOT_'+this.livery) ? GetStoredData('JPL152IP_ONPARKINGSPOT_'+this.livery) : 3;
	this.ssonoff = GetStoredData('JPL152IP_SSONOFF_'+this.livery) ? GetStoredData('JPL152IP_SSONOFF_'+this.livery) : 0;  // 0 = ON
  }

  //load the gauge template - found in JPL152IP.HTML
  get templateID() { return 'JPL152IP'; }

  //Runs as the sim is loading
  connectedCallback() {
    super.connectedCallback();
	
    // var reset = resetState();
    function resetState() {
      DeleteStoredData('JPL152IP_CARBHEAT_'+this.livery);
	  DeleteStoredData('JPL152IP_CABAIR_'+this.livery);
	  DeleteStoredData('JPL152IP_CABHEAT_'+this.livery);
	}
	
  } //end connectedCallback

  //Runs once the flight is loaded
  onFlightStart() {
    super.onFlightStart();

    //set the variables that we need to wait for the flight to load
	//STATE SAVING SWITCH LEFT OUTSIDE OF OPTION, AS IS OIL QUANTITY OR IT RESETS TO ZER0
	SimVar.SetSimVarValue("L:JPL152_SSONOFF", "bool", Number(this.ssonoff));
	SimVar.SetSimVarValue("L:JPL152_OILREM", "number", Number(this.engoil));
	SimVar.SetSimVarValue("L:JPL152_MAINTENANCE_TIME", "number", Number(this.engmaintenance));

	if (GetStoredData('JPL152IP_SSONOFF_'+this.livery) == 0) { //START STATE SAVING ON/OFF
	
		//----------------------------------FUEL AND WEIGHTS	
		SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "number", Number(this.leftFuel));
		SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "number", Number(this.rightFuel));	
		SimVar.SetSimVarValue("PAYLOAD STATION WEIGHT:2", "pounds", Number(this.coPilotWeight));
		SimVar.SetSimVarValue("PAYLOAD STATION WEIGHT:3", "pounds", Number(this.baggage1));
		SimVar.SetSimVarValue("PAYLOAD STATION WEIGHT:4", "pounds", Number(this.baggage2));
		//--------------------------------------HANDLING
		SimVar.SetSimVarValue("ELEVATOR TRIM POSITION", "radians", Number(this.trim));
		SimVar.SetSimVarValue("FLAPS HANDLE INDEX", "number", Number(this.flaps));
		SimVar.SetSimVarValue("TRAILING EDGE FLAPS LEFT PERCENT", "percent over 100", Number(this.flapsL));
		SimVar.SetSimVarValue("TRAILING EDGE FLAPS RIGHT PERCENT", "percent over 100", Number(this.flapsR));
		//-------------------------------------KNOBS
		SimVar.SetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degrees", Number(this.headingBug));
		SimVar.SetSimVarValue("B:INSTRUMENT_Course_1_Set", "degrees", Number(this.obs1));
		SimVar.SetSimVarValue("B:INSTRUMENT_Course_2_Set", "degrees", Number(this.obs2));
		SimVar.SetSimVarValue("L:JPL152_Panel_Light", "number", Number(this.panelknob));
		SimVar.SetSimVarValue("L:JPL152_Radio_Light", "number", Number(this.radioknob));
		SimVar.SetSimVarValue("L:JPL152_Map_Light", "number", Number(this.mapknob));	
		//-------------------------------------------SWITCHES
		SimVar.SetSimVarValue("K:PITOT_HEAT_SET", "number", Number(this.pitot));
		SimVar.SetSimVarValue("LIGHT NAV", "bool", Number(this.nav));
		SimVar.SetSimVarValue("LIGHT STROBE", "bool", Number(this.strobe));
		SimVar.SetSimVarValue("LIGHT BEACON", "bool", Number(this.beacon));
		SimVar.SetSimVarValue("LIGHT TAXI", "bool", Number(this.taxi));
		SimVar.SetSimVarValue("LIGHT LANDING", "bool", Number(this.landing));
		SimVar.SetSimVarValue("LIGHT PANEL", "bool", Number(this.panel));
		if (GetStoredData('JPL152IP_CABIN_'+this.livery) == 1) {
				SimVar.SetSimVarValue("K:CABIN_LIGHTS_ON", "number", 1); }
		if (GetStoredData('JPL152IP_CABIN_'+this.livery) == 0) {
				SimVar.SetSimVarValue("K:CABIN_LIGHTS_OFF", "number", 1); }
		if (GetStoredData('JPL152IP_FUELVALVE_'+this.livery) == 1 && SimVar.GetSimVarValue("ENG COMBUSTION:1", "bool") == 0) {
				SimVar.SetSimVarValue("K:TOGGLE_FUEL_VALVE_ENG1", "number", 1); }
		SimVar.SetSimVarValue("L:JPL152_APVIZ", "number", Number(this.APViz));
		SimVar.SetSimVarValue("L:JPL152_DME_POWER", "number", Number(this.dmeswitch));
		//-----------------------------------------COM
		SimVar.SetSimVarValue("K:COM_RADIO_SET_HZ", "number", Number(this.com1act));
		SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET_HZ", "number", Number(this.com1stby));
		SimVar.SetSimVarValue("K:COM2_RADIO_SET_HZ", "number", Number(this.com2act));
		SimVar.SetSimVarValue("K:COM2_STBY_RADIO_SET_HZ", "number", Number(this.com2stby));
		SimVar.SetSimVarValue("K:COM1_VOLUME_SET", "number", Number(this.com1vol));
		SimVar.SetSimVarValue("K:COM2_VOLUME_SET", "number", Number(this.com2vol));
		//-----------------------------------------NAV
		SimVar.SetSimVarValue("K:NAV1_RADIO_SET_HZ", "number", Number(this.nav1act));
		SimVar.SetSimVarValue("K:NAV1_STBY_SET_HZ", "number", Number(this.nav1stby));
		SimVar.SetSimVarValue("K:NAV2_RADIO_SET_HZ", "number", Number(this.nav2act));
		SimVar.SetSimVarValue("K:NAV2_STBY_SET_HZ", "number", Number(this.nav2stby));
		SimVar.SetSimVarValue("NAV VOLUME:1", "percent", Number(this.nav1vol));
		SimVar.SetSimVarValue("NAV VOLUME:2", "percent", Number(this.nav2vol));
		//-----------------------------------------ADF
		SimVar.SetSimVarValue("K:ADF_VOLUME_SET", "number", Number(this.adfvol));
		SimVar.SetSimVarValue("A:ADF ACTIVE FREQUENCY:1", "KHz", Number(this.adfact)); //HALF WORKING, ACTIVE FREQUENCY WONT TAKE??? WORK IN ARROW, PROBABLE ERROR IS ADF.JS
		SimVar.SetSimVarValue("A:ADF STANDBY FREQUENCY:1", "KHz", Number(this.adfstby));
		SimVar.SetSimVarValue("B:INSTRUMENT_ADF_Set", "degrees", Number(this.adfcard));
		//---------------------------------------AUDIO BUTTONS
		SimVar.SetSimVarValue("COM RECEIVE:1", "bool", Number(this.btncom1));
		SimVar.SetSimVarValue("COM RECEIVE:2", "bool", Number(this.btncom2));
		SimVar.SetSimVarValue("K:COM_RECEIVE_ALL_SET", "number", Number(this.btnboth)); //NOT SURE IF THIS IS WORKING, BUTTON IS MESSED UP
		SimVar.SetSimVarValue("K:PILOT_TRANSMITTER_SET", "number", Number(this.pilottrans));
		SimVar.SetSimVarValue("K:RADIO_VOR1_IDENT_SET", "number", Number(this.btnnav1));
		SimVar.SetSimVarValue("K:RADIO_VOR2_IDENT_SET", "number", Number(this.btnnav2));
		SimVar.SetSimVarValue("K:RADIO_ADF_IDENT_SET", "number", Number(this.btnadf));
		SimVar.SetSimVarValue("K:RADIO_DME1_IDENT_SET", "number", Number(this.btndme)); //this looks like it could be set to dme1,dme2, or selected dme if needed
		SimVar.SetSimVarValue("K:MARKER_SOUND_TOGGLE", "number", Number(this.btnmkr));
		SimVar.SetSimVarValue("L:XMLVAR_AUDIO_SPKR_SEL", "number", Number(this.btnspkr));
		//----------------------------------------TRANSPONDER
		SimVar.SetSimVarValue("TRANSPONDER CODE:1", "BCO16", Number(this.xpndrcode));
		SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", Number(this.xpndrstate));
		//-----------------------------------------MISC
		SimVar.SetSimVarValue("L:XMLVAR_YokeHidden1", "number", Number(this.yoke1));
		SimVar.SetSimVarValue("L:XMLVAR_YokeHidden2", "number", Number(this.yoke2));
		SimVar.SetSimVarValue("L:JPL_DOOR_PILOT", "number", Number(this.door1));
		SimVar.SetSimVarValue("L:JPL_WINDOW_PILOT", "number", Number(this.window1));
		SimVar.SetSimVarValue("L:JPL152_VISOR_PILOT", "position 16k", Number(this.visor1));
		SimVar.SetSimVarValue("L:JPL_DOOR_COPILOT", "number", Number(this.door2));
		SimVar.SetSimVarValue("L:JPL_WINDOW_COPILOT", "number", Number(this.window2));
		SimVar.SetSimVarValue("L:JPL152_VISOR_COPILOT", "position 16k", Number(this.visor2));
		SimVar.SetSimVarValue("L:JPL152_ELAPSED_TIME", "number", Number(this.plugFouling));
		//---------------------------------------LEVERS
		SimVar.SetSimVarValue("K:ANTI_ICE_GRADUAL_SET_ENG1", "position 16k", Number(this.carbheat));
		SimVar.SetSimVarValue("L:XMLVAR_CABIN_AIR_1_POSITION", "number", Number(this.cabair));
		SimVar.SetSimVarValue("L:XMLVAR_CABIN_HEAT_1_POSITION", "number", Number(this.cabheat));
		if (GetStoredData('JPL152IP_PARKINGBRAKE_'+this.livery) == 3 && SimVar.GetSimVarValue("BRAKE INDICATOR", "position") == 0) {
				SimVar.SetSimVarValue("K:PARKING_BRAKES", "number", 1); }
		//--------------------------------------BREAKERS 3-13
		//SimVar.SetSimVarValue("ALTERNATOR CONNECTION ON:1", "bool", Number(this.altbreaker)); //having odd effect?
		if (GetStoredData('JPL152IP_ALTBREAKER_'+this.livery) == 0 && SimVar.GetSimVarValue("ALTERNATOR CONNECTION ON:1", "bool") == 1) {
				(SimVar.SetSimVarValue("K:ELECTRICAL_ALTERNATOR_BREAKER_TOGGLE", "number", 1) && SimVar.SetSimVarValue("L:JPL152_ALT_BREAKER", "number", 1)); }
		SimVar.SetSimVarValue("BUS CONNECTION ON:3", "bool", Number(this.breaker3));
		SimVar.SetSimVarValue("BUS CONNECTION ON:4", "bool", Number(this.breaker4));
		SimVar.SetSimVarValue("BUS CONNECTION ON:5", "bool", Number(this.breaker5));
		SimVar.SetSimVarValue("BUS CONNECTION ON:6", "bool", Number(this.breaker6));
		SimVar.SetSimVarValue("BUS CONNECTION ON:7", "bool", Number(this.breaker7));
		SimVar.SetSimVarValue("BUS CONNECTION ON:8", "bool", Number(this.breaker8));
		SimVar.SetSimVarValue("BUS CONNECTION ON:9", "bool", Number(this.breaker9));
		SimVar.SetSimVarValue("BUS CONNECTION ON:10", "bool", Number(this.breaker10));
		SimVar.SetSimVarValue("BUS CONNECTION ON:11", "bool", Number(this.breaker11));
		SimVar.SetSimVarValue("BUS CONNECTION ON:12", "bool", Number(this.breaker12));
		SimVar.SetSimVarValue("BUS CONNECTION ON:13", "bool", Number(this.breaker13));
		SimVar.SetSimVarValue("BUS CONNECTION ON:14", "bool", Number(this.breaker14));
		//--------------------------------------TESTING
		//SimVar.SetSimVarValue("RECIP ENG LEFT MAGNETO:1", "bool", Number(this.magnetoL));
		//SimVar.SetSimVarValue("RECIP ENG RIGHT MAGNETO:1", "bool", Number(this.magnetoR));
		//SimVar.SetSimVarValue("GENERAL ENG COMBUSTION:1", "bool", Number(this.engcombustion)); // must come before throttle/mixture else it sets 0 throttle and 100 mixture
		//SimVar.SetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "percent", Number(this.throttle));
		//SimVar.SetSimVarValue("GENERAL ENG MIXTURE LEVER POSITION:1", "percent", Number(this.mixture));

	
		//-------------------------------------FLIGHT START STATES
		//-------------------------------------------PARKED

		if (SimVar.GetSimVarValue("ATC ON PARKING SPOT", "bool") == 1 && GetStoredData('JPL152IP_ENGCOMBUSTION_'+this.livery) == 0) {	
				SimVar.SetSimVarValue("RECIP ENG LEFT MAGNETO:1", "bool", Number(this.magnetoL));
				SimVar.SetSimVarValue("RECIP ENG RIGHT MAGNETO:1", "bool", Number(this.magnetoR));
				SimVar.SetSimVarValue("ELECTRICAL MASTER BATTERY:1", "number", Number(this.battery));
				SimVar.SetSimVarValue("K:ALTERNATOR_SET", "number", Number(this.alternator));
				SimVar.SetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "percent", Number(this.throttle));
				SimVar.SetSimVarValue("GENERAL ENG MIXTURE LEVER POSITION:1", "percent", Number(this.mixture));	
			}

		if (SimVar.GetSimVarValue("ATC ON PARKING SPOT", "bool") == 1 && GetStoredData('JPL152IP_ENGCOMBUSTION_'+this.livery) == 1) {
				SimVar.SetSimVarValue("GENERAL ENG COMBUSTION:1", "bool", 1);
				SimVar.SetSimVarValue("RECIP ENG LEFT MAGNETO:1", "bool", Number(this.magnetoL));
				SimVar.SetSimVarValue("RECIP ENG RIGHT MAGNETO:1", "bool", Number(this.magnetoR));
				SimVar.SetSimVarValue("ELECTRICAL MASTER BATTERY:1", "number", Number(this.battery));
				SimVar.SetSimVarValue("K:ALTERNATOR_SET", "number", Number(this.alternator));
				SimVar.SetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "percent", 19);
				SimVar.SetSimVarValue("GENERAL ENG MIXTURE LEVER POSITION:1", "percent", 95);
				SimVar.SetSimVarValue("L:XMLVAR_PUMPED_FUEL", "gallons", 0.025);
			}
	
	}  //END STATE SAVING ON/OFF

	
    // I don't think we need to run this every frame so just run it on a timer here
    // Also there might be a performance hit if we try to do that...
    var timerMilSecs = 1000;
    var timer = window.setInterval(checkC152State, timerMilSecs);
	//record the variables at specified interval

    function checkC152State() {
		
		var title = SimVar.GetSimVarValue("TITLE", "string");
		var planeId = title.replace(/\s+/g, '_');
		//this.livery = title.replace(/\s+/g, '_');
		
		// ALWAYS RECORDED
		var ssonoff = SimVar.GetSimVarValue("L:JPL152_SSONOFF", "bool");
		SetStoredData('JPL152IP_SSONOFF_'+planeId, ssonoff.toString());
		var engoil = SimVar.GetSimVarValue("L:JPL152_OILREM", "number");
		SetStoredData('JPL152IP_ENGOIL_'+planeId, engoil.toString());
		var engmaintenance = SimVar.GetSimVarValue("L:JPL152_MAINTENANCE_TIME", "number");
		SetStoredData('JPL152IP_ENGMAINTENANCE_'+planeId, engmaintenance.toString());
		
		if (GetStoredData('JPL152IP_SSONOFF_'+planeId) == 0) { //START STATE SAVING ON/OFF
		
			//-------------------------FUEL AND WEIGHTS
			var leftFuel = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "gallons");
			SetStoredData('JPL152IP_LEFT_FUEL_'+planeId, leftFuel.toString());
			var rightFuel = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "gallons");
			SetStoredData('JPL152IP_RIGHT_FUEL_'+planeId, rightFuel.toString());
			var coPilotWeight = SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:2", "pounds");
			SetStoredData('JPL152IP_COPILOTWEIGHT_'+planeId, coPilotWeight.toString());
			var baggage1 = SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:3", "pounds");
			SetStoredData('JPL152IP_BAGGAGE1_'+planeId, baggage1.toString());
			var baggage2 = SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:4", "pounds");
			SetStoredData('JPL152IP_BAGGAGE2_'+planeId, baggage2.toString());
		
			//----------------------------HANDLING
			var trim = SimVar.GetSimVarValue("ELEVATOR TRIM POSITION", "radians");
			SetStoredData('JPL152IP_TRIM_'+planeId, trim.toString());
			var flaps = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "number");
			SetStoredData('JPL152IP_FLAPS_'+planeId, flaps.toString());
			var flapsL = SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT PERCENT", "percent over 100");
			SetStoredData('JPL152IP_FLAPSL_'+planeId, flapsL.toString());
			var flapsR = SimVar.GetSimVarValue("TRAILING EDGE FLAPS RIGHT PERCENT", "percent over 100");
			SetStoredData('JPL152IP_FLAPSR_'+planeId, flapsR.toString());
		
			//----------------------------KNOBS
			var headingBug = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degrees");
			SetStoredData('JPL152IP_HEADINGBUG_'+planeId, headingBug.toString());
			var obs1 = SimVar.GetSimVarValue("NAV OBS:1", "degrees");
			SetStoredData('JPL152IP_OBS1_'+planeId, obs1.toString());
			var obs2 = SimVar.GetSimVarValue("NAV OBS:2", "degrees");
			SetStoredData('JPL152IP_OBS2_'+planeId, obs2.toString());
			var panelknob = SimVar.GetSimVarValue("L:JPL152_Panel_Light", "number");
			SetStoredData('JPL152IP_PANELKNOB_'+planeId, panelknob.toString());
			var radioknob = SimVar.GetSimVarValue("L:JPL152_Radio_Light", "number");
			SetStoredData('JPL152IP_RADIOKNOB_'+planeId, radioknob.toString());
			var mapknob = SimVar.GetSimVarValue("L:JPL152_Map_Light", "number");
			SetStoredData('JPL152IP_MAPKNOB_'+planeId, mapknob.toString());
		
			//----------------------------SWITCHES
			var pitot = SimVar.GetSimVarValue("L:DEICE_Pitot_1", "number");
			SetStoredData('JPL152IP_PITOT_'+planeId, pitot.toString());
			var nav = SimVar.GetSimVarValue("LIGHT NAV", "bool");
			SetStoredData('JPL152IP_NAV_'+planeId, nav.toString());
			var strobe = SimVar.GetSimVarValue("LIGHT STROBE", "bool");
			SetStoredData('JPL152IP_STROBE_'+planeId, strobe.toString());
			var beacon = SimVar.GetSimVarValue("LIGHT BEACON", "bool");
			SetStoredData('JPL152IP_BEACON_'+planeId, beacon.toString());
			var taxi = SimVar.GetSimVarValue("LIGHT TAXI", "bool");
			SetStoredData('JPL152IP_TAXI_'+planeId, taxi.toString());
			var landing = SimVar.GetSimVarValue("LIGHT LANDING", "bool");
			SetStoredData('JPL152IP_LANDING_'+planeId, landing.toString());
			var panel = SimVar.GetSimVarValue("LIGHT PANEL", "bool");
			SetStoredData('JPL152IP_PANEL_'+planeId, panel.toString());	
			var cabin = SimVar.GetSimVarValue("LIGHT CABIN", "number");
			SetStoredData('JPL152IP_CABIN_'+planeId, cabin.toString());
			var battery = SimVar.GetSimVarValue("ELECTRICAL MASTER BATTERY:1", "bool");
			SetStoredData('JPL152IP_BATTERY_'+planeId, battery.toString());
			var alternator = SimVar.GetSimVarValue("GENERAL ENG MASTER ALTERNATOR:1", "bool");
			SetStoredData('JPL152IP_ALTERNATOR_'+planeId, alternator.toString());
			var fuelvalve = SimVar.GetSimVarValue("GENERAL ENG FUEL VALVE:1", "bool");
			SetStoredData('JPL152IP_FUELVALVE_'+planeId, fuelvalve.toString());
			var APViz = SimVar.GetSimVarValue("L:JPL152_APVIZ", "number");
			SetStoredData('JPL152IP_APVIZ_'+planeId, APViz.toString());
			var dmeswitch = SimVar.GetSimVarValue("L:DME_POWER", "number");
			SetStoredData('JPL152IP_DMESWITCH_'+planeId, dmeswitch.toString());
			var magnetoL = SimVar.GetSimVarValue("RECIP ENG LEFT MAGNETO:1", "bool");
			SetStoredData('JPL152IP_MAGNETOL_'+planeId, magnetoL.toString());
			var magnetoR = SimVar.GetSimVarValue("RECIP ENG RIGHT MAGNETO:1", "bool");
			SetStoredData('JPL152IP_MAGNETOR_'+planeId, magnetoR.toString());
		
			//--------------------------------COM
			var com1act = SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "hz"); // must be set to hz
			SetStoredData('JPL152IP_COM1ACT_'+planeId, com1act.toString());
			var com1stby = SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "hz");
			SetStoredData('JPL152IP_COM1STBY_'+planeId, com1stby.toString());
			var com1vol = SimVar.GetSimVarValue("COM VOLUME:1", "percent");
			SetStoredData('JPL152IP_COM1VOL_'+planeId, com1vol.toString());
			var com2act = SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:2", "hz"); // must be set to hz
			SetStoredData('JPL152IP_COM2ACT_'+planeId, com2act.toString());
			var com2stby = SimVar.GetSimVarValue("COM STANDBY FREQUENCY:2", "hz");
			SetStoredData('JPL152IP_COM2STBY_'+planeId, com2stby.toString());
			var com2vol = SimVar.GetSimVarValue("COM VOLUME:2", "percent");
			SetStoredData('JPL152IP_COM2VOL_'+planeId, com2vol.toString());	
		
			//---------------------------------NAV
			var nav1act = SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:1", "hz"); // must be set to hz
			SetStoredData('JPL152IP_NAV1ACT_'+planeId, nav1act.toString());
			var nav1stby = SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:1", "hz");
			SetStoredData('JPL152IP_NAV1STBY_'+planeId, nav1stby.toString());
			var nav2act = SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:2", "hz"); // must be set to hz
			SetStoredData('JPL152IP_NAV2ACT_'+planeId, nav2act.toString());
			var nav2stby = SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:2", "hz");
			SetStoredData('JPL152IP_NAV2STBY_'+planeId, nav2stby.toString());
			var nav1vol = SimVar.GetSimVarValue("NAV VOLUME:1", "percent");
			SetStoredData('JPL152IP_NAV1VOL_'+planeId, nav1vol.toString());
			var nav2vol = SimVar.GetSimVarValue("NAV VOLUME:2", "percent");
			SetStoredData('JPL152IP_NAV2VOL_'+planeId, nav2vol.toString());
		
			//------------------------------ADF
			var adfvol = SimVar.GetSimVarValue("ADF VOLUME:1", "percent");
			SetStoredData('JPL152IP_ADFVOL_'+planeId, adfvol.toString());
			var adfact = SimVar.GetSimVarValue("A:ADF ACTIVE FREQUENCY:1", "KHz");
			SetStoredData('JPL152IP_ADFACT_'+planeId, adfact.toString());
			var adfstby = SimVar.GetSimVarValue("A:ADF STANDBY FREQUENCY:1", "KHz");
			SetStoredData('JPL152IP_ADFSTBY_'+planeId, adfstby.toString());
			var adfcard = SimVar.GetSimVarValue("ADF CARD", "degrees");
			SetStoredData('JPL152IP_ADFCARD_'+planeId, adfcard.toString());	
		
			//---------------------AUDIO BUTTONS
			var btncom1 = SimVar.GetSimVarValue("COM RECEIVE:1", "bool");
			SetStoredData('JPL152IP_BTNCOM1_'+planeId, btncom1.toString());
			var btncom2 = SimVar.GetSimVarValue("COM RECEIVE:2", "bool");
			SetStoredData('JPL152IP_BTNCOM2_'+planeId, btncom2.toString());
			var btnboth = SimVar.GetSimVarValue("COM RECEIVE ALL", "bool");
			SetStoredData('JPL152IP_BTNBOTH_'+planeId, btnboth.toString());
			var pilottrans = SimVar.GetSimVarValue("COM RECEIVE:2", "bool");
			SetStoredData('JPL152IP_PILOTTRANS_'+planeId, pilottrans.toString());
			var btnnav1 = SimVar.GetSimVarValue("NAV SOUND:1", "bool");
			SetStoredData('JPL152IP_BTNNAV1_'+planeId, btnnav1.toString());
			var btnnav2 = SimVar.GetSimVarValue("NAV SOUND:2", "bool");
			SetStoredData('JPL152IP_BTNNAV2_'+planeId, btnnav2.toString());
			var btnadf = SimVar.GetSimVarValue("ADF SOUND:0", "bool");
			SetStoredData('JPL152IP_BTNADF_'+planeId, btnadf.toString());
			var btndme = SimVar.GetSimVarValue("DME SOUND", "bool");
			SetStoredData('JPL152IP_BTNDME_'+planeId, btndme.toString());
			var btnmkr = SimVar.GetSimVarValue("K:MARKER_SOUND_TOGGLE", "number");
			SetStoredData('JPL152IP_BTNMKR_'+planeId, btnmkr.toString());
			var btnspkr = SimVar.GetSimVarValue("L:XMLVAR_AUDIO_SPKR_SEL", "number");
			SetStoredData('JPL152IP_BTNSPKR_'+planeId, btnspkr.toString());
		
			//--------------------------TRANSPONDER
			var xpndrcode = SimVar.GetSimVarValue("TRANSPONDER CODE:1", "BCO16");
			SetStoredData('JPL152IP_XPNDERCODE_'+planeId, xpndrcode.toString());
			var xpndrstate = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
			SetStoredData('JPL152IP_XPNDERSTATE_'+planeId, xpndrstate.toString());
		
			//-----------------------------MISC
			var yoke1 = SimVar.GetSimVarValue("L:XMLVAR_YokeHidden1", "number");
			SetStoredData('JPL152IP_YOKE1_'+planeId, yoke1.toString());
			var yoke2 = SimVar.GetSimVarValue("L:XMLVAR_YokeHidden2", "number");
			SetStoredData('JPL152IP_YOKE2_'+planeId, yoke2.toString());
			var door1 = SimVar.GetSimVarValue("L:JPL_DOOR_PILOT", "number");
			SetStoredData('JPL152IP_DOOR1_'+planeId, door1.toString());
			var window1 = SimVar.GetSimVarValue("L:JPL_WINDOW_PILOT", "number");
			SetStoredData('JPL152IP_WINDOW1_'+planeId, window1.toString());
			var visor1 = SimVar.GetSimVarValue("L:JPL152_VISOR_PILOT", "position 16k");
			SetStoredData('JPL152IP_VISOR1_'+planeId, visor1.toString());
			var door2 = SimVar.GetSimVarValue("L:JPL_DOOR_COPILOT", "number");
			SetStoredData('JPL152IP_DOOR2_'+planeId, door2.toString());
			var window2 = SimVar.GetSimVarValue("L:JPL_WINDOW_COPILOT", "number");
			SetStoredData('JPL152IP_WINDOW2_'+planeId, window2.toString());
			var visor2 = SimVar.GetSimVarValue("L:JPL152_VISOR_COPILOT", "position 16k");
			SetStoredData('JPL152IP_VISOR2_'+planeId, visor2.toString());
			var plugFouling = SimVar.GetSimVarValue("L:JPL152_ELAPSED_TIME", "number");
			SetStoredData('JPL152IP_PLUG_FOUL_'+planeId, plugFouling.toString());

		
			//----------------------------------LEVERS
			var carbheat = SimVar.GetSimVarValue("A:GENERAL ENG ANTI ICE POSITION:1", "position 16k");
			SetStoredData('JPL152IP_CARBHEAT_'+planeId, carbheat.toString());
			var cabair = SimVar.GetSimVarValue("L:XMLVAR_CABIN_AIR_1_POSITION", "number");
			SetStoredData('JPL152IP_CABAIR_'+planeId, cabair.toString());
			var cabheat = SimVar.GetSimVarValue("L:XMLVAR_CABIN_HEAT_1_POSITION", "number");
			SetStoredData('JPL152IP_CABHEAT_'+planeId, cabheat.toString());
			var throttle = SimVar.GetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "percent");
			SetStoredData('JPL152IP_THROTTLE_'+planeId, throttle.toString());
			var mixture = SimVar.GetSimVarValue("GENERAL ENG MIXTURE LEVER POSITION:1", "percent");
			SetStoredData('JPL152IP_MIXTURE_'+planeId, mixture.toString());
			var parkingbrake = SimVar.GetSimVarValue("BRAKE INDICATOR", "position");
			SetStoredData('JPL152IP_PARKINGBRAKE_'+planeId, parkingbrake.toString());
			
			//-------------------------------BREAKERS 3-13
			var altbreaker = SimVar.GetSimVarValue("ALTERNATOR CONNECTION ON:1", "bool");
			SetStoredData('JPL152IP_ALTBREAKER_'+planeId, altbreaker.toString());
			var breaker3 = SimVar.GetSimVarValue("BUS CONNECTION ON:3", "bool");
			SetStoredData('JPL152IP_BREAKER3_'+planeId, breaker3.toString());
			var breaker4 = SimVar.GetSimVarValue("BUS CONNECTION ON:4", "bool");
			SetStoredData('JPL152IP_BREAKER4_'+planeId, breaker4.toString());
			var breaker5 = SimVar.GetSimVarValue("BUS CONNECTION ON:5", "bool");
			SetStoredData('JPL152IP_BREAKER5_'+planeId, breaker5.toString());
			var breaker6 = SimVar.GetSimVarValue("BUS CONNECTION ON:6", "bool");
			SetStoredData('JPL152IP_BREAKER6_'+planeId, breaker6.toString());
			var breaker7 = SimVar.GetSimVarValue("BUS CONNECTION ON:7", "bool");
			SetStoredData('JPL152IP_BREAKER7_'+planeId, breaker7.toString());
			var breaker8 = SimVar.GetSimVarValue("BUS CONNECTION ON:8", "bool");
			SetStoredData('JPL152IP_BREAKER8_'+planeId, breaker8.toString());
			var breaker9 = SimVar.GetSimVarValue("BUS CONNECTION ON:9", "bool");
			SetStoredData('JPL152IP_BREAKER9_'+planeId, breaker9.toString());
			var breaker10 = SimVar.GetSimVarValue("BUS CONNECTION ON:10", "bool");
			SetStoredData('JPL152IP_BREAKER10_'+planeId, breaker10.toString());
			var breaker11 = SimVar.GetSimVarValue("BUS CONNECTION ON:11", "bool");
			SetStoredData('JPL152IP_BREAKER11_'+planeId, breaker11.toString());
			var breaker12 = SimVar.GetSimVarValue("BUS CONNECTION ON:12", "bool");
			SetStoredData('JPL152IP_BREAKER12_'+planeId, breaker12.toString());
			var breaker13 = SimVar.GetSimVarValue("BUS CONNECTION ON:13", "bool");
			SetStoredData('JPL152IP_BREAKER13_'+planeId, breaker13.toString());
			var breaker14 = SimVar.GetSimVarValue("BUS CONNECTION ON:14", "bool");
			SetStoredData('JPL152IP_BREAKER14_'+planeId, breaker14.toString());
			
			//-------------------------------TESTING
			var engcombustion = SimVar.GetSimVarValue("GENERAL ENG COMBUSTION:1", "bool");
			SetStoredData('JPL152IP_ENGCOMBUSTION_'+planeId, engcombustion.toString());
			var simonground = SimVar.GetSimVarValue("SIM ON GROUND", "bool");
			SetStoredData('JPL152IP_SIMONGROUND_'+planeId, simonground.toString());
			var onparkingspot = SimVar.GetSimVarValue("ATC ON PARKING SPOT", "bool");
			SetStoredData('JPL152IP_ONPARKINGSPOT_'+planeId, onparkingspot.toString());

		} //END STATE SAVING
	 } //End checkC152State function
  } //End onFlightStart()

  //Runs every frame
  Update() {
    super.Update();

			//optional flight start states for efb

			//cold and dark
			if (SimVar.GetSimVarValue("L:JPL152_CAD", "bool") == 1) {
					SimVar.SetSimVarValue("ELECTRICAL MASTER BATTERY:1", "number", 0);
					SimVar.SetSimVarValue("K:ALTERNATOR_SET", "number", 0);
					SimVar.SetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "percent", 0);
					SimVar.SetSimVarValue("GENERAL ENG MIXTURE LEVER POSITION:1", "percent", 0);
					SimVar.SetSimVarValue("L:XMLVAR_PUMPED_FUEL", "gallons", 0.00);
					SimVar.SetSimVarValue("L:JPL_DOOR_PILOT", "bool", 1);
					SimVar.SetSimVarValue("L:JPL_DOOR_COPILOT", "bool", 1);
					if (GetStoredData('JPL152IP_PARKINGBRAKE_'+this.livery) !== 3 && SimVar.GetSimVarValue("BRAKE INDICATOR", "position") == 0) {
						SimVar.SetSimVarValue("K:PARKING_BRAKES", "number", 1); }
					SimVar.SetSimVarValue("K:PITOT_HEAT_SET", "number", 0);
					SimVar.SetSimVarValue("LIGHT NAV", "bool", 0);
					SimVar.SetSimVarValue("LIGHT STROBE", "bool", 0);
					SimVar.SetSimVarValue("LIGHT BEACON", "bool", 0);
					SimVar.SetSimVarValue("LIGHT TAXI", "bool", 0);
					SimVar.SetSimVarValue("LIGHT LANDING", "bool", 0);
					SimVar.SetSimVarValue("LIGHT PANEL", "bool", 0);
					SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 0);
					SimVar.SetSimVarValue("K:MAGNETO1_OFF", "number", 0);
					if (SimVar.GetSimVarValue("GENERAL ENG FUEL VALVE:1", "bool") == 1) {
							SimVar.SetSimVarValue("K:TOGGLE_FUEL_VALVE_ENG1", "number", 1); }	
					// delay work around as anim will not go from 0-100 100-0
					SimVar.SetSimVarValue("K:COM1_VOLUME_SET", "number", 50);
					SimVar.SetSimVarValue("K:COM2_VOLUME_SET", "number", 50);
					SimVar.SetSimVarValue("K:ADF_VOLUME_SET", "number", 50);
					setTimeout(function() {
						SimVar.SetSimVarValue("K:COM1_VOLUME_SET", "number", 0);
						SimVar.SetSimVarValue("K:COM2_VOLUME_SET", "number", 0);
						SimVar.SetSimVarValue("K:ADF_VOLUME_SET", "number", 0);
					}, 500);
				
			}  //end cold and dark
			
			
			
			
			//ready for flight
			if (SimVar.GetSimVarValue("L:JPL152_RFF", "bool") == 1 && SimVar.GetSimVarValue("GENERAL ENG COMBUSTION:1", "bool") == 0) {

					SimVar.SetSimVarValue("LIGHT LANDING", "bool", 0);
					SimVar.SetSimVarValue("LIGHT PANEL", "bool", 0);
					SimVar.SetSimVarValue("K:MAGNETO1_OFF", "number", 0);
					
					// delay work around as anim will not go from 0-100 100-0
					SimVar.SetSimVarValue("K:ADF_VOLUME_SET", "number", 50);
					setTimeout(function() {
						SimVar.SetSimVarValue("K:ADF_VOLUME_SET", "number", 0);
					}, 500);
					
					setTimeout(function() {
					if (SimVar.GetSimVarValue("GENERAL ENG FUEL VALVE:1", "bool") == 0) {
							SimVar.SetSimVarValue("K:TOGGLE_FUEL_VALVE_ENG1", "number", 1); }					
					SimVar.SetSimVarValue("GENERAL ENG MIXTURE LEVER POSITION:1", "percent", 95);
					SimVar.SetSimVarValue("A:GENERAL ENG ANTI ICE POSITION:1", "position 16k", 0);
					}, 1000);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("ELECTRICAL MASTER BATTERY:1", "number", 1);
					SimVar.SetSimVarValue("K:ALTERNATOR_SET", "number", 1);
					}, 2000);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("LIGHT BEACON", "bool", 1);
					SimVar.SetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "percent", 20);
					if (SimVar.GetSimVarValue("BRAKE INDICATOR", "position") == 0) {
						SimVar.SetSimVarValue("K:PARKING_BRAKES", "number", 1); }				
					}, 3000);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("RECIP ENG PRIMER:1", "bool", 1);
					}, 4000);
					setTimeout(function() {
					SimVar.SetSimVarValue("L:XMLVAR_PUMPED_FUEL", "gallons", 0.025);
					}, 6000);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("L:JPL_DOOR_PILOT", "bool", 0);
					SimVar.SetSimVarValue("L:JPL_DOOR_COPILOT", "bool", 0);
					}, 7000);	
					
					setTimeout(function() {
					SimVar.SetSimVarValue("L:JPL_WINDOW_PILOT", "bool", 1);
					}, 7500);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("K:MAGNETO1_BOTH", "number", 0);
					}, 8000);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("L:JPL152_CLEAR", "bool", 1);
					}, 9000);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("K:MAGNETO1_START", "number", 0);
					}, 12200);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("K:FLAPS_UP", "number", 0);
					SimVar.SetSimVarValue("L:JPL152_CLEAR", "bool", 0);
					}, 14000);
					
					
					// delay work around as anim will not go from 0-100 100-0
					setTimeout(function() {
					SimVar.SetSimVarValue("L:JPL152_Panel_Light", "number", 25);
					SimVar.SetSimVarValue("L:JPL152_Radio_Light", "number", 75);
					SimVar.SetSimVarValue("K:COM1_VOLUME_SET", "number", 50);
					SimVar.SetSimVarValue("K:COM2_VOLUME_SET", "number", 50);
						setTimeout(function() {
							SimVar.SetSimVarValue("K:COM1_VOLUME_SET", "number", 100);
							SimVar.SetSimVarValue("K:COM2_VOLUME_SET", "number", 100);
						}, 500);				
					}, 14700);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 1);
					}, 15000);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("LIGHT NAV", "bool", 1);
					}, 15200);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("LIGHT STROBE", "bool", 1);
					}, 15500);
					
					setTimeout(function() {
					SimVar.SetSimVarValue("LIGHT TAXI", "bool", 1);
					}, 15700);
					
					setTimeout(function() {
					if (SimVar.GetSimVarValue("A:AMBIENT TEMPERATURE", "celsius") < 5) {
						SimVar.SetSimVarValue("K:PITOT_HEAT_SET", "number", 1); }
					}, 16000);
					
					setTimeout(function() {
					Simplane.setTransponderToRegion();
					}, 17000);
			}  //end ready for flight
  }  //end super.Update
}

registerInstrument('jpl152ip-element', JPL152IP);