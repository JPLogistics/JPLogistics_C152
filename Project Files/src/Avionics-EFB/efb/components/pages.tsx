import {
  FSComponent,
  DisplayComponent,
  VNode,
  CircleInterceptBuilder,
} from "msfssdk";
import { efbThemeSettings } from "./functions/settings";

export class Pages extends DisplayComponent<any> {
  public render(): VNode {
    return (
      <div id="pages">
        <div id="BootPage"> {/*data-theme={efbThemeSettings.theme}> */}
          <div class="absolute-center">
          <div id="circle">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="300px" height="300px" viewBox="0 0 300 300" enable-background="new 0 0 300 300" xml:space="preserve">
    <defs>
        <path id="circlePath" d=" M 150, 150 m -60, 0 a 60,60 0 0,1 120,0 a 60,60 0 0,1 -120,0 "/>
    </defs>
    <circle cx="150" cy="100" r="75" fill="none"/>
    <g>
        <use xlink:href="#circlePath" fill="none"/>
        <text fill="#fff">
            <textPath xlink:href="#circlePath">Text rotating around a circle path with SVG!</textPath>
        </text>
    </g>
</svg>
</div>
          </div>
        </div>
        <div id="HomePage" class="hidden" data-theme={efbThemeSettings.theme}>
          <div class="grid grid-cols-3 gap-4 absolute-center">
            <div>
              {/*
          <!-- Payload -->
          */}
              <button
                id="navButton2"
                class="rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="360px"
                  viewBox="0 0 20 20"
                  width="360px"
                  fill="#000000"
                >
                  <g>
                    <rect fill="none" height="20" width="20" x="0" />
                  </g>
                  <g>
                    <path
                      d="M10,18c-0.83,0-1.5-0.67-1.5-1.5c0-0.41,0.17-0.79,0.44-1.06l0,0C9.54,14.84,13,13.5,13,13.5s-1.34,3.46-1.94,4.06
                            C10.79,17.83,10.41,18,10,18z M18,18h-5v-1.5l3.4,0c-0.77-5.48-5.79-5.65-6.4-5.65c-0.61,0-5.63,0.17-6.4,5.65l3.4,0V18H2 c0-5.88,3.72-7.97,6.5-8.5V7C4.8,6.55,2,4.49,2,2h16c0,2.49-2.8,4.55-6.5,5v2.5C14.28,10.03,18,12.12,18,18z M10,5.6 c2.67,0,4.83-0.95,5.84-2.1H4.16C5.17,4.65,7.33,5.6,10,5.6z"
                    />
                  </g>
                </svg>
              </button>
            </div>
            <div>
              {/*
          <!-- Map -->
          */}
              <button
                id="navButton3"
                class="rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="360px"
                  viewBox="0 0 24 24"
                  width="360px"
                  fill="#000000"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12
                            2zM4 12c0-.61.08-1.21.21-1.78L8.99 15v1c0 1.1.9 2 2 2v1.93C7.06 19.43 4 16.07 4 12zm13.89 5.4c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C17.92 5.77 20 8.65 20 12c0 2.08-.81 3.98-2.11 5.4z"
                  />
                </svg>
              </button>
            </div>
            <div id="navButton4">
              {/*
          <!-- Tools -->
          */}
              <button
                id="navButton4"
                class="rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="360px"
                  viewBox="0 0 20 20"
                  width="360px"
                  fill="#000000"
                >
                  <g>
                    <rect fill="none" height="20" width="20" x="0" />
                  </g>
                  <g>
                    <g>
                      <rect
                        height="5.5"
                        transform="matrix(0.7071 -0.7071
                            0.7071 0.7071 -5.3383 13.8538)"
                        width="2"
                        x="13.05"
                        y="10.62"
                      />
                      <path
                        d="M14.23,8.98c1.38,0,2.5-1.12,2.5-2.5c0-0.51-0.15-0.98-0.42-1.38l-2.08,2.08l-0.71-0.71l2.08-2.08 c-0.4-0.26-0.87-0.42-1.38-0.42c-1.38,0-2.5,1.12-2.5,2.5c0,0.32,0.07,0.63,0.18,0.91L10.69,8.6L9.64,7.54l0.71-0.71L8.93,5.42
                            L10.34,4C9.56,3.22,8.29,3.22,7.51,4L4.69,6.83l1.06,1.06l-2.13,0L3.27,8.24l2.83,2.83l0.35-0.35L6.46,8.6l1.06,1.06l0.71-0.71 l1.06,1.06l-4.6,4.6l1.41,1.41l7.22-7.22C13.6,8.91,13.91,8.98,14.23,8.98z"
                      />
                    </g>
                  </g>
                </svg>
              </button>
            </div>
            <div>
              {/*
          <!-- Chat -->
          */}
              <button
                id="navButton5"
                class="rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="360px"
                  viewBox="0 0 24 24"
                  width="360px"
                  fill="#000000"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path
                    d="M4 4h16v12H5.17L4 17.17V4m0-2c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1
                            0 2-.9 2-2V4c0-1.1-.9-2-2-2H4zm2 10h8v2H6v-2zm0-3h12v2H6V9zm0-3h12v2H6V6z"
                  />
                </svg>
              </button>
            </div>
            <div>
              {/*
          <!-- Settings -->
          */}
              <button
                id="navButton6"
                class="rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="360px"
                  viewBox="0 0 24 24"
                  width="360px"
                  fill="#000000"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path
                    d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06
                            0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98
                            0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17
                            0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21
                            1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7
                            1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
                  />
                </svg>
              </button>
            </div>
            <div>
              {/*
          <!-- Power -->
          */}
              <button
                id="navButton7"
                class="rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="360px"
                  viewBox="0 0 24 24"
                  width="360px"
                  fill="#000000"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path
                    d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0
                            3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div id="PayloadPage"
          class="hidden"
          data-theme={efbThemeSettings.theme}
        >
          <div class="svg-center" id="aircraft-svg"></div>
        </div>
        <div id="MapPage"
          class="hidden"
        >
          <div id="map"></div>
        </div>
        <div
          id="SettingsPage"
          class="hidden"
          data-theme={efbThemeSettings.theme}
        >
          <div class="column50 shade5 padding16" style="height: 512px;">
            <h3 class="shade15 padding8H">Testing Check Boxes</h3>
            <div>
              <label class="toggle">
                <input id="settingsToggleStateSaving" type="checkbox" />
                <span class="toggleKnob"></span>
              </label>{" "}
              State Saving
            </div>
            <div>
              <label class="toggle">
                <input id="settingsToggleMaintenance" type="checkbox" />
                <span class="toggleKnob"></span>
              </label>{" "}
              Engine Realism
            </div>
            <div>
              <label class="toggle">
                <input id="settingsToggleEGT" type="checkbox" />
                <span class="toggleKnob"></span>
              </label>{" "}
              Show EGT
            </div>
            <div>
              <label class="toggle">
                <input id="settingsToggleAP" type="checkbox" />
                <span class="toggleKnob"></span>
              </label>{" "}
              Show AP
            </div>
            <div>
              <label class="toggle">
                <input id="settingsTogglepilotViz" type="checkbox" />
                <span class="toggleKnob"></span>
              </label>{" "}
              Show Pilot
            </div>
            <div>
              <label class="toggle">
                <input id="settingsToggleCopilotViz" type="checkbox" />
                <span class="toggleKnob"></span>
              </label>{" "}
              Show CoPilot
            </div>
            <div id="loadoutButtons">
              <div
                id="stateCAD"
                class="button"
                style="position: absolute; left: 292px; top: 440px;"
              >
                Cold and Dark
              </div>
              <div
                id="stateRFF"
                class="button"
                style="position: absolute; left: 516px; top: 440px;"
              >
                Ready For Flight
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export class Headers extends DisplayComponent<any> {
  public render(): VNode {
    return (
      <div id="Header">
        <div
          id="navButton1"
          class="rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[4px] py-[4px] text-white focus:ring-2 ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="192px"
            viewBox="0 0 24 24"
            width="192px"
            fill="#ffffff"
          >
            <path d=" M0 0h24v24H0V0z" fill="none" />
            <path d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
          </svg>
        </div>
        <div id="appPageTitle" class="absolute-center">
          JPLogistics EFB V0.0.1
        </div>
      </div>
    );
  }
}
export class Warning extends DisplayComponent<any> {
  public render(): VNode {
    return (
      <div id="outdatedVersion">
        <div class="absolute-center rounded-full">
          OUTDATED: A newer version of this aircraft is availiable!
        </div>
      </div>
    );
  }
}
export class Error extends DisplayComponent<any> {
  public render(): VNode {
    return <div class="absolute-center">Oops... somethings went wrong!</div>;
  }
}
