class EFB extends BaseInstrument {
    constructor() {
        super();
    }
    get templateID() { return "EFB"; }
    get isInteractive() { return true; }

    connectedCallback() {
            //# General
            super.connectedCallback();
            //Vars
            //Buttons
            // this.appButton1 = this.getChildById("appButton1");
            // this.appButton1.addEventListener("mouseup", this.appButton1Press.bind(this));
        }
        //Button Functions
    appButton1Press() {
        this.activateApp(1);
    }
    disconnectedCallback() {
        super.disconnectedCallback();

    }
    Update() {
        super.Update();
        this.tablet_init();
        this.getChildById("debug").classList.add("hidden");
        if (this.appSelected == null) {
            this.activateApp(1);
        }
        switch (this.appSelected) {
            case 0: // Stowed
                break;
            case 1: // Systems
                let x = 0
                try {
                    x = "Update Fuel";
                    this.update_fuel();
                    x = "Draw Fuel";
                    this.drawAircraft("aircraft-svg");
                    //this.drawFuelTank("loadoutLeft", "Left", this.dataFuelTanksLeftQuantity, this.dataFuelTanksLeftCapacity, false, false);
                    //this.drawFuelTank("loadoutRight", "Right", this.dataFuelTanksRightQuantity, this.dataFuelTanksRightCapacity, false, false);
                } catch (e) {
                    this.getChildById("debug").innerHTML = "Ex." + x + "<br/>" + "Ex." + e;
                    this.getChildById("debug").classList.remove("hidden");
                }
            case 2: // Metar
                break;
            case 3: // Checklists
                break;
        }


        // if (this.isElectricityAvailable()) {
        //     if (this.initTime == 0) {
        //         this.initTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
        //     }
        //     this.elapsedTime = (SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") - this.initTime);
        //     //# Calculate Everything

        //     //# General
        //     if (this.elapsedTime < 3) {
        //         diffAndSetAttribute(this.welcomeScreen, "state", "on");
        //         diffAndSetAttribute(this.normalScreen, "state", "off");
        //         diffAndSetText(this.welcome, "JPLogistics DME System");
        //         this.msg = "Starting";
        //         for (let i = 0; i < this.elapsedTime; i++){
        //             this.msg += ".";
        //         }
        //         diffAndSetText(this.welcomeLow, this.msg);
        //     }
        //     else {
        //         diffAndSetAttribute(this.welcomeScreen, "state", "off");
        //         if (this.lowBatteryCheck()) {
        //             diffAndSetAttribute(this.normalScreen, "state", "off");
        //             diffAndSetAttribute(this.lowBScreen, "state", "on");
        //         }
        //         else {
        //             diffAndSetAttribute(this.lowBScreen, "state", "off");
        //             diffAndSetAttribute(this.normalScreen, "state", "on");
        //             diffAndSetText(this.nav1Freq, this.getActiveNavFreq(1));
        //             diffAndSetText(this.nav2Freq, this.getActiveNavFreq(2));
        //             //# Nav 1 Script
        //             if (this.getNavAlive(23)){
        //                 if (this.getIsSignalOk(1)) {
        //                     diffAndSetText(this.nav1Distance, this.getDMEDistance(1) + " NM");
        //                     diffAndSetText(this.nav1Time, this.getDMETime(1));
        //                 }
        //                 else {
        //                     diffAndSetText(this.nav1Time, "--:--");
        //                     diffAndSetText(this.nav1Distance, "-- NM");
        //                 }
        //             }
        //             else {
        //                 diffAndSetText(this.nav1Time, "--:--");
        //                 diffAndSetText(this.nav1Distance, "-- NM");
        //             }
        //             //# Nav 2 Script
        //             if (this.getNavAlive(25)){
        //                 if (this.getIsSignalOk(2)) {
        //                     diffAndSetText(this.nav2Distance, this.getDMEDistance(2) + " NM");
        //                     diffAndSetText(this.nav2Time, this.getDMETime(2));
        //                 }
        //                 else {
        //                     diffAndSetText(this.nav2Time, "--:--");
        //                     diffAndSetText(this.nav2Distance, "-- NM");
        //                 }
        //             }
        //             else {
        //                 diffAndSetText(this.nav2Time, "--:--");
        //                 diffAndSetText(this.nav2Distance, "-- NM");
        //             }
        //         }
        //     }
        // }
        // else {
        //     this.initTime = 0;
        //     this.elapsedTime = 0;
        // }
    }

    //EFB Functions
    tablet_init() {
        if (this.tablet_init_complete == null) {
            // App
            this.appCount = 2;
            this.appSelected = 1;
            this.appPrevious = 1;
            this.tablet_init_complete = true;
            this.activateApp(1);
        }
    }
    activateApp(page) {
        this.appSelected = page;
        for (let i = 0; i <= this.appCount; i++) {
            this.getChildById("appPage" + i).classList.add("hidden");
            //if (i > 0) { this.getChildById("appButton" + i).style.color = "" };
        }
        this.getChildById("appPage" + page).classList.remove("hidden");
        //if (page > 0) { this.getChildById("appButton" + page).style.color = "#f5ab30" };
    }
    getNearestAirports() {

    }
    round(value, decimals) { return parseFloat(value).toFixed(decimals); }

    update_fuel() {
        if (this.dataFuelTanksTotalQuantity != null) {
            this.dataFuelTanksTotalQuantity = SimVar.GetSimVarValue("A:FUEL TOTAL QUANTITY", "Gallons");
            this.dataFuelTanksLeftQuantity = SimVar.GetSimVarValue("A:FUEL TANK LEFT MAIN QUANTITY", "Gallons");
            this.dataFuelTanksRightQuantity = SimVar.GetSimVarValue("A:FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
            this.dataFuelTanksTotalPercentage = this.round((this.dataFuelTanksTotalQuantity / this.dataFuelTanksTotalCapacity) * 100, 0);
            this.dataFuelTanksLeftPercentage = this.round((this.dataFuelTanksLeftQuantity / this.dataFuelTanksLeftCapacity) * 100, 0);
            this.dataFuelTanksRightPercentage = this.round((this.dataFuelTanksRightQuantity / this.dataFuelTanksRightCapacity) * 100, 0);
        } else {
            this.dataFuelTanksTotalCapacity = SimVar.GetSimVarValue("A:FUEL TOTAL CAPACITY", "Gallons");
            this.dataFuelTanksLeftCapacity = SimVar.GetSimVarValue("A:FUEL TANK LEFT MAIN CAPACITY", "Gallons");
            this.dataFuelTanksRightCapacity = SimVar.GetSimVarValue("A:FUEL TANK RIGHT MAIN CAPACITY", "Gallons");
            this.dataFuelTanksTotalQuantity = SimVar.GetSimVarValue("A:FUEL TOTAL QUANTITY", "Gallons");
            this.dataFuelTanksLeftQuantity = SimVar.GetSimVarValue("A:FUEL TANK LEFT MAIN QUANTITY", "Gallons");
            this.dataFuelTanksRightQuantity = SimVar.GetSimVarValue("A:FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
            this.dataFuelTanksTotalPercentage = this.round((this.dataFuelTanksTotalQuantity / this.dataFuelTanksTotalCapacity) * 100, 0);
            this.dataFuelTanksLeftPercentage = this.round((this.dataFuelTanksLeftQuantity / this.dataFuelTanksLeftCapacity) * 100, 0);
            this.dataFuelTanksRightPercentage = this.round((this.dataFuelTanksRightQuantity / this.dataFuelTanksRightCapacity) * 100, 0);
        }
    }
    drawAircraft(id) {
        let svg = `
        <svg width="2267.7166"
        height="1611.9048"
        viewBox="0 0 906 644">
        <g
     transform="translate(-5.140976e-8,63.244094)"
     id="g21">
    <path
       d="m 226.77166,-62.503295 2.9403,5.145549 1.47016,4.41047 h 34.5487 v 1.470157 l -33.81361,0.735078 0.73507,2.940314 h 5.14555 l 4.41046,1.470156 2.20525,2.940313 1.47014,5.145548 2.20525,25.727741 0.73507,22.052351 h 83.06386 l 114.67222,5.145549 4.41046,2.940312 2.20523,5.880627 V 63.930175 L 324.53706,82.307136 h -77.91829 l -13.23142,103.646044 58.80627,8.82094 2.94032,3.67539 1.47016,8.08586 v 8.82094 l -1.47016,6.61571 -2.94032,5.14555 -53.66072,8.08585 -9.55601,-18.37695 -0.73507,41.16438 -1.47016,0.73509 -1.47016,-0.73509 -0.73507,-41.16438 -9.55603,18.37695 -53.66071,-8.08585 -2.94031,-5.14555 -1.47016,-6.61571 v -8.82094 l 1.47016,-8.08586 2.94031,-2.94032 58.80626,-9.55601 -13.23141,-103.646044 h -77.9183 L 0.36753904,63.930175 V 23.50087 L 2.572769,17.620243 6.9832502,15.415009 121.65546,9.534382 h 83.06385 l 0.73508,-22.052351 2.20523,-25.727741 1.47016,-5.145548 2.20523,-2.940313 4.41048,-1.470156 h 5.14553 l 0.73509,-2.940314 -34.54868,-0.735078 v -1.470157 h 35.28375 l 1.47016,-4.41047 z"
       fill="#ccffff"
       stroke="#0014aa"
       stroke-width="0.735078"
       id="path19" />
    <rect
       style="fill:#0000ff;fill-opacity:0;fill-rule:evenodd;stroke:#000067;stroke-width:0.816148;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
       id="rect131"
       width="36.038631"
       height="59.125889"
       x="164.30324"
       y="16.477753" />
    <rect
       style="fill:#0000ff;fill-opacity:0;fill-rule:evenodd;stroke:#000067;stroke-width:0.816148;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
       id="rect131-4"
       width="36.038631"
       height="59.125889"
       x="252.33763"
       y="15.962939" />
  </g>
       </svg>
       `;
        this.getChildById(id).innerHTML = svg;
    }

    drawFuelTank(id, label, gallons, capacity, isSelected, isCrossfeed) {
            const width = 200;
            const height = 250;
            const labelHeight = 40;
            const barHeight = height - labelHeight;
            const filledHeight = (barHeight - 8) * (gallons / capacity);
            let colorLabelForeground = "fffdf4";
            let colorLabelBackground = "565656";
            if (label == "TOTAL") {
                colorLabelForeground = "1a1a1a";
                colorLabelBackground = "fffdf4";
            } else if (isSelected) {
                colorLabelForeground = "1a1a1a";
                colorLabelBackground = "f5ab30";
            } else if (isCrossfeed) {
                colorLabelForeground = "1a1a1a";
                colorLabelBackground = "aaaaaa";
            }
            let svg = `
        <svg width="${width}" height="${height}">
            <rect x="0" y="0" width="${width}" height="${height}" style="fill: #1a1a1a;" />
            <rect x="4" y="4" width="${width - 8}" height="${labelHeight - 4}" style="fill: #${colorLabelBackground};" />
            <rect x="0" y="${labelHeight}" width="${width}" height="${barHeight}" style="fill: #1a1a1a;" />
            <rect x="4" y="${height - filledHeight - 4}" width="${width - 8}" height="${filledHeight}" style="fill: #9b2f25;" />
            <text x="50%" y="26" text-anchor="middle" fill="#${colorLabelForeground}">${label}</text>
            <text x="50%" y="80" text-anchor="middle" fill="#fffdf4">${this.round((gallons/capacity)*100, 0)}%</text>
        </svg>
        `;
            this.getChildById(id).innerHTML = svg;
        } //Helper Functions
}
registerInstrument("efb-element", EFB);