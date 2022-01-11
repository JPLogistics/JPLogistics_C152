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
            this.navButton1 = this.getChildById("navButton1");
            this.navButton1.addEventListener("click", this.navButton1Press.bind(this));
            this.navButton2 = this.getChildById("navButton2");
            this.navButton2.addEventListener("click", this.navButton2Press.bind(this));
            this.navButton3 = this.getChildById("navButton3");
            this.navButton3.addEventListener("click", this.navButton3Press.bind(this));
            this.navButton4 = this.getChildById("navButton4");
            this.navButton4.addEventListener("click", this.navButton4Press.bind(this));
            this.navButton5 = this.getChildById("navButton5");
            this.navButton5.addEventListener("click", this.navButton5Press.bind(this));
            this.navButton6 = this.getChildById("navButton6");
            this.navButton6.addEventListener("click", this.navButton6Press.bind(this));
            this.navButton7 = this.getChildById("navButton7");
            this.navButton7.addEventListener("click", this.navButton7Press.bind(this));

        }
        //Button Functions
    navButton1Press() {
        this.activateApp(1);
    }
    navButton2Press() {
        this.activateApp(2);
    }
    navButton3Press() {
        this.activateApp(3);
    }
    navButton4Press() {
        this.activateApp(4);
    }
    navButton5Press() {
        this.activateApp(5);
    }
    navButton6Press() {
        this.activateApp(6);
    }
    navButton7Press() {
        this.activateApp("stowed");
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
            case 0: // Tablet Booting
                break;
            case 1: // Home Screen
                let x1 = 0;
                try {
                    diffAndSetText(this.getChildById("appPageTitle"), "JPLogistics EFB");
                    x1 = "Home Screen";
                } catch (e) {
                    this.getChildById("debug").innerHTML = "Ex." + x1 + "<br/>" + "Ex." + e;
                    this.getChildById("debug").classList.remove("hidden");
                }
            case 2: // Aircraft Payload
                let x2 = 0;
                try {
                    diffAndSetText(this.getChildById("appPageTitle"), "Aircraft Payload");
                    x2 = "Payload Screen";
                    this.drawAircraftFuel("aircraft-svg");
                } catch (e) {
                    this.getChildById("debug").innerHTML = "Ex." + x2 + "<br/>" + "Ex." + e;
                    this.getChildById("debug").classList.remove("hidden");
                }
            case 3: // Nearest Airport // METARS
                let x3 = 0;
                try {
                    diffAndSetText(this.getChildById("appPageTitle"), "World Map");
                    x3 = "Nearest/World";
                } catch (e) {
                    this.getChildById("debug").innerHTML = "Ex." + x3 + "<br/>" + "Ex." + e;
                    this.getChildById("debug").classList.remove("hidden");
                }
            case 4: // Tools
                let x4 = 0;
                try {
                    diffAndSetText(this.getChildById("appPageTitle"), "Aircraft Maintenance");
                    x4 = "Maintenance Page";

                } catch (e) {
                    this.getChildById("debug").innerHTML = "Ex." + x4 + "<br/>" + "Ex." + e;
                    this.getChildById("debug").classList.remove("hidden");
                }
            case 5: // Chat
                let x5 = 0;
                try {
                    diffAndSetText(this.getChildById("appPageTitle"), "Pilot Chat");
                    x5 = "Pilot Chat Screen";

                } catch (e) {
                    this.getChildById("debug").innerHTML = "Ex." + x5 + "<br/>" + "Ex." + e;
                    this.getChildById("debug").classList.remove("hidden");
                }
            case 6: // Settings
                let x6 = 0;
                try {
                    diffAndSetText(this.getChildById("appPageTitle"), "Settings");
                    x6 = "Load Settings Screen";

                } catch (e) {
                    this.getChildById("debug").innerHTML = "Ex." + x6 + "<br/>" + "Ex." + e;
                    this.getChildById("debug").classList.remove("hidden");
                }
            case 7: // Power
                let x7 = 0;
                try {
                    diffAndSetText(this.getChildById("appPageTitle"), "");
                    x7 = "Power Button";

                } catch (e) {
                    this.getChildById("debug").innerHTML = "Ex." + x7 + "<br/>" + "Ex." + e;
                    this.getChildById("debug").classList.remove("hidden");
                }
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
            this.getChildById("tablet").classList.remove("hidden");
            this.getChildById("header").classList.add("hidden");
            // this.getChildById("footer").classList.add("hidden");
            this.getChildById("appPage0").classList.remove("hidden");
            this.appCount = 7;
            this.appSelected = 0;
            this.appPrevious = 1;

            setTimeout(() => {
                this.activateApp(1);
                this.getChildById("header").classList.remove("hidden");
                this.tablet_init_complete = true;
                // this.getChildById("footer").classList.remove("hidden");
            }, 5000);
        }
    }
    activateApp(page) {
        this.appSelected = page;
        if (page == "stowed") {
            this.getChildById("tablet").classList.add("hidden");
        } else {
            this.getChildById("tablet").classList.remove("hidden");
            for (let i = 0; i <= this.appCount; i++) {
                this.getChildById("appPage" + i).classList.add("hidden");
            }
            this.getChildById("appPage" + page).classList.remove("hidden");
        }
    }
    getNearestAirports() {

    }
    round(value, decimals) { return parseFloat(value).toFixed(decimals); }

    drawAircraftFuel(id) {
        const width = 36;
        const height = 60;
        const labelHeight = 10;
        const barHeight = height - labelHeight;

        let colorLabelForeground = "fffdf4";
        let colorLabelBackground = "565656";
        let lGallons = SimVar.GetSimVarValue("A:FUEL TANK LEFT MAIN QUANTITY", "Gallons");
        let lCapacity = SimVar.GetSimVarValue("A:FUEL TANK LEFT MAIN CAPACITY", "Gallons");
        let rGallons = SimVar.GetSimVarValue("A:FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
        let rCapacity = SimVar.GetSimVarValue("A:FUEL TANK RIGHT MAIN CAPACITY", "Gallons");
        const lfilledHeight = (barHeight - 4) * (lGallons / lCapacity);
        const rfilledHeight = (barHeight - 4) * (rGallons / rCapacity);
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
           width="36"
           height="60"
           x="164"
           y="16" />
           <rect x="164" y="16" width="${width}" height="${labelHeight}" style="fill: #${colorLabelBackground};" />
            <rect x="164" y="${labelHeight + 16}" width="${width}" height="${barHeight}" style="fill: #1a1a1a;" />
            <rect x="166" y="${height - lfilledHeight + 14}" width="${width - 4}" height="${lfilledHeight}" style="fill: #9b2f25;" />
            <text
           xml:space="preserve"
           style="font-size:4.8px;line-height:1.25;stroke-width:0.2"
           x="173.9864"
           y="22.767141"
           id="text3783"><tspan
             sodipodi:role="line"
             id="tspan3781"
             style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:6.66667px;font-family:sans-serif;-inkscape-font-specification:'sans-serif, Normal';font-variant-ligatures:none;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;fill:#ffffff;stroke-width:0.2"
             x="173.9864"
             y="22.767141">LEFT</tspan></text>
            <text x="182" y="54" style="font-size:8px;line-height:1.25;stroke-width:0.2" text-anchor="middle" fill="#fffdf4">${this.round((lGallons/lCapacity)*100, 0)}%</text>

        <rect
           style="fill:#0000ff;fill-opacity:0;fill-rule:evenodd;stroke:#000067;stroke-width:0.816148;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
           id="rect131-4"
           width="36"
           height="60"
           x="252"
           y="16" />
           <rect x="252" y="16" width="${width}" height="${labelHeight}" style="fill: #${colorLabelBackground};" />
            <rect x="252" y="${labelHeight + 16}" width="${width}" height="${barHeight}" style="fill: #1a1a1a;" />
            <rect x="254" y="${height - rfilledHeight + 14}" width="${width - 4}" height="${rfilledHeight}" style="fill: #9b2f25;" />
            <text
            xml:space="preserve"
            style="font-size:4.8px;line-height:1.25;font-family:sans-serif;-inkscape-font-specification:'sans-serif, Normal';font-variant-ligatures:none;stroke-width:0.2"
            x="259.7012"
            y="22.916245"
            id="text3783"><tspan
              sodipodi:role="line"
              id="tspan3781"
              style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:6.66667px;font-family:sans-serif;-inkscape-font-specification:'sans-serif, Normal';font-variant-ligatures:none;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;fill:#ffffff;stroke-width:0.2"
              x="259.7012"
              y="22.916245">RIGHT</tspan></text>

            <text x="270" y="54" style="font-size:8px;line-height:1.25;stroke-width:0.2" text-anchor="middle" fill="#fffdf4">${this.round((rGallons/rCapacity)*100, 0)}%</text>
      </g>
           </svg>
           `;
        this.getChildById(id).innerHTML = svg;
    }


}
registerInstrument("efb-element", EFB);