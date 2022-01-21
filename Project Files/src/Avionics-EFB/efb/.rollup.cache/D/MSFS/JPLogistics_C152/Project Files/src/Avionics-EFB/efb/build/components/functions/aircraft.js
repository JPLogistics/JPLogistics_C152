export var aircraft = {
    stateSaving: true,
    details: {
        livery: "",
        reg: "",
        model: "",
        type: "C152",
    },
    fuel: {
        leftTank: {
            Quantity: 0,
            Capacity: 0,
        },
        rightTank: {
            Quantity: 0,
            Capacity: 0,
        },
    },
    payload: {
        pilot: 0,
        copilot: 0,
        cargo: {
            forward: 0,
            rear: 0,
        },
    },
    location: {
        lat: 0,
        long: 0,
        heading: 360,
        altitude: 0,
        speed: 0,
    },
    maintenance: {
        enabled: true,
        oilRemaining: 0,
        timeSinceService: 0,
        sparkFoulTime: 0,
    },
    equipment: {
        ap: true,
        egt: true,
        copilot: true,
        pilot: false,
        dme: true
    },
};
//# sourceMappingURL=aircraft.js.map