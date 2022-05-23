import { FSComponent, DisplayComponent } from "msfssdk";
import "../../styles/efb.css";
// import { efbSettings, efbThemeSettings } from "../functions/settings";
export class BootPage extends DisplayComponent {
    render() {
        return (FSComponent.buildComponent("div", { id: "content", class: "absolute-center" },
            FSComponent.buildComponent("svg", { class: "circle-svg", viewBox: "0 0 500 500" },
                FSComponent.buildComponent("defs", null,
                    FSComponent.buildComponent("path", { d: "M50,250c0-110.5,89.5-200,200-200s200,89.5,200,200s-89.5,200-200,200S50,360.5,50,250", id: "textcircle_top" },
                        FSComponent.buildComponent("animateTransform", { attributeName: "transform", begin: "0s", dur: "20s", type: "rotate", from: "0 250 250", to: "360 250 250", repeatCount: "indefinite" }))),
                FSComponent.buildComponent("text", { class: "circle-text", dy: "70", textLength: "1020" },
                    FSComponent.buildComponent("textPath", { "xlink:href": "#textcircle_top" }, "JPLogistics - JPLogistics -")))));
    }
}
//# sourceMappingURL=bootPage.js.map