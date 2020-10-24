# Developer Branch!

## May contain bugs and be unstable! Only for testing!

# JPLogistics MSFS_C152

## V0.8.2

- Fixed an issue when using Saitek Switch Panel
     - Unable to start using panel key

### V0.8.1

- Corrected NAV1/NAV2 behaviour
     - Nav Ball 1/2 will disconnect when corresponding radio stack is turned off
     - Nav Identify Audio will no longer be played if corresponding radio stack is turned off
     
### V0.8;

- Corrected COM1/COM2 behaviour
  - Radio now shuts down correctly (Not just turn off the screen) when the volume knob is switched to OFF
  - Works with vPilot correctly (Turning COM1 off will now terminate any Tx/Rx over vPilot)
  
- Added 2 x Cargo areas
  - Forward (Max 120lb)
  - Rear (Max 40lb)
  - Note: Combined payload weight should _not_ exceed 120lb!

- Corrected alternator charge - Battery now recharges correctly!
  - Also corrected Max Output to fit real world!

- Radio Stack "initial" values changed for Buttons & Freq.

- Initial work for upcoming changes (TBA)


### Credits to [@TheFrett](https://github.com/TheFrett) & [@DRF30q](https://github.com/DRF30q) for some of the changes made!

#### Below are the performance changes made by TheFrett

Glide performance: you can now correctly do ~16 nm from 10000 feet with a windmilling prop (was 12 nm)

Climb performance is an exact fit to the chart. From ~700 fpm @ SL down to 200 fpm @ 12.000 feet. It may feel a little underwhelming though. This is due to a wrong mixture model. At SL 100% mixture doesnt get you max power.

Cruise performance within 1% fit at all given POH altitudes. Also tested across several power/rpm settings.

Engine slightly more efficient at lower rpm (a bit less power needed during approach). I only got this from video reference though.

Corrected idle RPM

#### Below are the changes by DRF30q

0.17

Some of the current improvements (not exhaustive):

Modified stall speeds flap up/flap down in accordance with published information. Aircraft will now stall at a significantly higher speed.

Numerous changes to engine performance, now in accordance with Lycoming O-235L2C (115HP, 2700RPM).

Fuel consumption adjusted.

Long Range Fuel Tanks 37.5USG total useable.

Fuel Gauges correctly calibrated.

Fuel Gauge indications will vary realistically in out of balance flight (depending on quantity of fuel in tank) and also on the ground when the aircraft is not wings level.

Flight tested to verify climb, cruise, service ceiling, fuel consumption etc in accordance with published information.

Oil Temperature Gauge - gauge calibration and oil temperature modelling adjusted.

Oil Pressure Gauge - gauge calibration and oil pressure modelling adjusted.

Electrical system - completely remodelled, using documented electrical loads etc.

Now models realistic battery discharge/charge and subsequent electrical system behaviour.

If battery goes flat, various systems will fail at various voltage levels as the battery discharges.

Ammeter - gauge calibration and behaviour.

Low voltage light now comes on below ~ 1000 RPM as in real life.

OAT thermometer now operates regardless of the position of the master switch.

The overhead (Dome) light can now be dimmed by the dimmer knob below the pilot control yoke.

The NAV CDI gauges completely revised:

CDI gauges now respond correctly to: User selected On/Off state of corresponding NAV/COM Radio.

CDI gauges now respond correctly to: Power state of corresponding NAV/COM Radio.

CDI gauges now power off when Avionics Power (Battery Master Switch) switched off.

CDI gauges now power off when the applicable NAV/COM Radio is turned off using the Volume/Off knob.

CDI gauges now power off if the battery discharges and the voltage level supplied to the applicable NAV/COM radio drops below the minimum required for operation.

CDI gauges, Glideslope/Localiser Needle behaviour adjusted.

CDI gauges, Glideslope/Localiser Flag behaviour adjusted.

CDI gauges, NAV Flag behaviour adjusted.

ADF Radio completely revised Knob behaviour. ADF Modes: BFO/REC/ADF and spring return TEST position.

ADF Rotatable Card gauge behaviour completely revised:

ADF Needle is driven to point to the selected NDB station only in ADF Mode. (Note that currently the ADF Mode Knob defaults to BFO Mode and must be manually rotated to ADF 
Mode.)

ADF Needle remains in current position in ADF Mode when no signal received from an NDB on the currently selected frequency.

ADF Needle remains in current position in BFO and REC Modes.

ADF Needle is slewed in a clockwise direction while ADF Mode Knob held in TEST position. When released, the ADF Mode Knob spring returns to ADF Mode.

ADF Needle remains in current position when ADF Radio is turned off using the Volume/Off knob.

ADF Needle remains in current position if battery discharges and voltage level to the radio drops below the minimum required for operation.

ADF Volume and ADF Mode Knob position state now loaded from .flt files. ADF Mode knob defaults to 'ADF' position.

NAVCOM (KX155) reworked. Various states including volume/Off state etc now loaded from .flt files.

NAV Ident / COM Test remain out when pulled.

Audio Selector (KA134) completely revised. Various states now loaded from .flt files.

Buttons now remain depressed when selected.

MIC1/MIC2 selects either COM1 or COM2 as active transmitter.

BOTH allows selection of reception on both COM1 and COM2.

NAV1, NAV2, ADF (AOE wtf?) etc select ident audio.

MKR selects Marker ident audio. Note: My testing so far indicates audio received (and light flashes) from Middle Marker, however Outer Marker light flashes but no audio heard. 
Not sure if this is a sim issue.

DME, SPKR buttons now operate but are currently non functional.

