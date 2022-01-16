import { FSComponent, VNode } from 'msfssdk';
import { CourseNeedleComponent } from './CourseNeedleComponent';

/**
 * A VOR2 course needle component.
 */
export class Nav2Needle extends CourseNeedleComponent {

  /**
   * Renders the component.
   * @returns The rendered VNode.
   */
  render(): VNode {
    if (this.props.hsiMap) {
      return (
        <div ref={this.needleRef} class="hsi-map-needle">
          <svg viewBox="0 0 386 340">
            <path d="M 173 48 l 0 -18 c 0.003 -0.811 -0.406 -1.62 -1.635 -1.619 l -6.885 0 c -1.62 0 -1.62 -0.81 -1.215 -1.215 l 10.935 -10.935 c 0 0 0.809 -0.812 1.62 0 l 10.935 10.935 c 0.405 0.405 0.405 1.215 -1.215 1.215 l -6.885 0 c -1.215 0 -1.62 0.81 -1.62 1.62 l 0 18 M 173 308 l 0 24.3 c 0 0.81 0.405 1.62 1.215 1.62 l 1.62 0 c 0.81 0 1.215 -0.81 1.215 -1.62 l 0 -24.3" fill="none" stroke="black" stroke-width="5px" />
            <path d="M 173 48 l 0 -18 c 0.003 -0.811 -0.406 -1.62 -1.635 -1.619 l -6.885 0 c -1.62 0 -1.62 -0.81 -1.215 -1.215 l 10.935 -10.935 c 0 0 0.809 -0.812 1.62 0 l 10.935 10.935 c 0.405 0.405 0.405 1.215 -1.215 1.215 l -6.885 0 c -1.215 0 -1.62 0.81 -1.62 1.62 l 0 18 M 173 308 l 0 24.3 c 0 0.81 0.405 1.62 1.215 1.62 l 1.62 0 c 0.81 0 1.215 -0.81 1.215 -1.62 l 0 -24.3" fill="none" stroke="rgb(0,255,0)" stroke-width="2px" />
          </svg>
        </div>
      );
    } else {
      return (
        <div ref={this.needleRef} class="hsi-rose-needle-group">
          <svg viewBox="0 0 386 340">
            <path d="M 183 54 l -11.5 11.5 c -1.5 1.5 -0.5 1.5 1.5 1.5 l 6 0 c 1 0 2 1 2 2 l 0 47 c 0 1 0 2 2 2 l 2 0 c 2 0 2 -1 2 -2 l 0 -47 c 0 -1 1 -2 2 -2 l 7 0 c 1 0 2 0 0.5 -1.5 l -11.5 -11.5 c -1 -1 -1 -1 -2 0 M 184 249 l -1 0 c -2 0 -2 1 -2 2 l 0 62 c 0 1 0 2 2 2 l 2 0 c 2 0 2 -1 2 -2 l 0 -62 c 0 -1 0 -2 -2 -2 l -1 0" fill="none" stroke="black" stroke-width="4.5px" />
            <path d="M 183 54 l -11.5 11.5 c -1.5 1.5 -0.5 1.5 1.5 1.5 l 6 0 c 1 0 2 1 2 2 l 0 47 c 0 1 0 2 2 2 l 2 0 c 2 0 2 -1 2 -2 l 0 -47 c 0 -1 1 -2 2 -2 l 7 0 c 1 0 2 0 0.5 -1.5 l -11.5 -11.5 c -1 -1 -1 -1 -2 0 M 184 249 l -1 0 c -2 0 -2 1 -2 2 l 0 62 c 0 1 0 2 2 2 l 2 0 c 2 0 2 -1 2 -2 l 0 -62 c 0 -1 0 -2 -2 -2 l -1 0" fill="none" stroke="rgb(0,255,0)" stroke-width="2.5px" />
            <circle cx="120px" cy="185px" r="4px" stroke="white" stroke-width="1.0px" fill="none" />
            <circle cx="152px" cy="185px" r="4px" stroke="white" stroke-width="1.0px" fill="none" />
            <circle cx="216px" cy="185px" r="4px" stroke="white" stroke-width="1.0px" fill="none" />
            <circle cx="248px" cy="185px" r="4px" stroke="white" stroke-width="1.0px" fill="none" />
          </svg>
          <div ref={this.toFromRef} class="hsi-rose-needle-group">
            <svg viewBox="0 0 386 340">
              <path d="M 184 113 l -12 12 l 24 0 l -12 -12 z" fill="rgb(0,255,0)" stroke="black" stroke-width="1px" />
            </svg>
          </div>
          <div ref={this.deviationRef} class="hsi-rose-needle-group">
            <svg viewBox="0 0 386 340">
              <path d="M 184 130 l -1 0 c -2 0 -2 1 -2 2 l 0 109 c 0 1 0 2 2 2 l 2 0 c 2 0 2 -1 2 -2 l 0 -109 c 0 -1 0 -2 -2 -2 l -1 0" fill="none" stroke="black" stroke-width="4.5px" />
              <path d="M 184 130 l -1 0 c -2 0 -2 1 -2 2 l 0 109 c 0 1 0 2 2 2 l 2 0 c 2 0 2 -1 2 -2 l 0 -109 c 0 -1 0 -2 -2 -2 l -1 0" fill="none" stroke="rgb(0,255,0)" stroke-width="2.5px" />
            </svg>
          </div>
        </div>
      );
    }
  }
}