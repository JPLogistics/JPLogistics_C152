import { FSComponent, DisplayComponent, ComponentProps, NodeReference, VNode } from 'msfssdk';
import { NavSourceId, NavSourceType, ObsSetting, VorToFrom } from 'msfssdk/instruments';
import { GpsNeedle } from './GpsNeedle';
import { Nav1Needle } from './Nav1Needle';
import { Nav2Needle } from './Nav2Needle';
import { NavIndicatorController } from '../../../Shared/Navigation/NavIndicatorController';

import './CourseNeedles.css';


/**
 * The props on the CourseNeedles component.
 */
interface CourseNeedlesProps extends ComponentProps {

  /** A prop to define whether this is for the map or rose. */
  hsiMap: boolean;

  /** An instance of the HSI controller. */
  controller: NavIndicatorController;
}

/**
 * The course needles component on the HSI.
 */
export class CourseNeedles extends DisplayComponent<CourseNeedlesProps> {

  private readonly nav1Needle = new NodeReference<Nav1Needle>();

  private readonly nav2Needle = new NodeReference<Nav2Needle>();

  private readonly gpsNeedle = new NodeReference<GpsNeedle>();

  private readonly el = new NodeReference<HTMLDivElement>();

  private nav1Course = 0;
  private nav2Course = 0;
  private gpsDTK = 0;

  /**
   * A callback called after rendering is complete.
   */
  public onAfterRender(): void {
    this.setDefaultVisibility();
  }

  /**
   * A method called from Hsi that commands an update to the format of the needles
   */
  public updateSourceSensitivity(): void {
    this.onCDISelect(this.props.controller.navStates[this.props.controller.activeSourceIndex].source);
  }

  /**
   * A method called from Hsi that commands an update to the data driving the needles
   */
  public updateData(): void {
    const dtk = this.props.controller.navStates[this.props.controller.activeSourceIndex].dtk_obs;
    if (dtk !== null) {
      this.setNeedleRotations(dtk);
    }
    if (!this.props.hsiMap) {
      const toFrom = this.props.controller.navStates[this.props.controller.activeSourceIndex].toFrom;
      if (toFrom !== null) {
        this.onToFrom(toFrom);
        const xtk = this.props.controller.navStates[this.props.controller.activeSourceIndex].deviation;
        switch (this.props.controller.navStates[this.props.controller.activeSourceIndex].source.type) {
          case NavSourceType.Gps:
            if (xtk !== null) {
              this.gpsNeedle.instance.setDeviation(xtk);
            }
            break;
          case NavSourceType.Nav:
            if (this.props.controller.navStates[this.props.controller.activeSourceIndex].source.index == 1) {
              if (xtk !== null) {
                this.nav1Needle.instance.setDeviation(xtk);
              }
            } else if (this.props.controller.navStates[this.props.controller.activeSourceIndex].source.index == 2) {
              if (xtk !== null) {
                this.nav2Needle.instance.setDeviation(xtk);
              }
            }
            break;
        }
      }
    }
  }

  /**
   * Rotates the course needles component to the specified value in degrees.
   * @param val The value to rotate the course needles component to.
   */
  public rotateComponent(val: number): void {
    this.el.instance.style.transform = `rotate3d(0, 0, 1, ${-val}deg)`;
  }

  /**
   * Handles setting to/from flag and whether to display the deviation needle.
   * @param toFrom The value to rotate the course needles component to.
   */
  private onToFrom(toFrom: VorToFrom): void {
    const source = this.props.controller.navStates[this.props.controller.activeSourceIndex];
    let showDeviationIndicator = true;
    let setFromFlag = false;
    switch (toFrom) {
      case VorToFrom.OFF:
        showDeviationIndicator = false;
        break;
      case VorToFrom.FROM:
        setFromFlag = true;
        break;
    }
    if (source.source.type === NavSourceType.Nav) {
      switch (this.props.controller.navStates[this.props.controller.activeSourceIndex].source.index) {
        case 1:
          this.nav1Needle.instance.setDeviationVisible(showDeviationIndicator);
          this.nav1Needle.instance.setFromFlag(setFromFlag);
          break;
        case 2:
          this.nav2Needle.instance.setDeviationVisible(showDeviationIndicator);
          this.nav2Needle.instance.setFromFlag(setFromFlag);
          break;
      }
    } else {
      this.gpsNeedle.instance.setDeviationVisible(showDeviationIndicator);
      this.gpsNeedle.instance.setFromFlag(setFromFlag);
    }
  }

  /**
   * Handles when the CDI source is selected.
   * @param source The CDI source event information.
   */
  private onCDISelect = (source: NavSourceId): void => {
    if (source.type !== null) {
      switch (source.type) {
        case NavSourceType.Nav:
          this.setNavVisible(source.index);
          break;
        case NavSourceType.Gps:
          this.setGpsVisible();
          break;
      }
    }
  }

  /**
   * Handles when the OBS setting is changed.
   * @param setting The OBS setting to handle.
   */
  private onOBSSet = (setting: ObsSetting): void => {
    if (setting.source.type == NavSourceType.Gps) {
      // We don't handle GPS stuff through this logic change because of our custom lnav.
    } else {
      switch (setting.source.index) {
        case 1:
          setting.heading !== null && (this.nav1Course = setting.heading);
          break;
        case 2:
          setting.heading !== null && (this.nav1Course = setting.heading);
          break;
      }

      setting.heading !== null && this.setNeedleRotations(setting.heading);
    }
  }

  /**
   * Sets the default visibility of the course needles.
   */
  private setDefaultVisibility(): void {
    this.nav1Needle.instance.setVisible(true);
    this.nav2Needle.instance.setVisible(false);
    this.gpsNeedle.instance.setVisible(false);
  }

  /**
   * Sets the rotations of the course needles.
   * @param val The heading value to set the rotation to.
   */
  private setNeedleRotations(val: number): void {
    this.nav1Needle.instance.setRotation(val);
    this.nav2Needle.instance.setRotation(val);
    this.gpsNeedle.instance.setRotation(val);
  }

  /**
   * Sets a nav needle as visible.
   * @param index The nav radio index to set visible.
   */
  private setNavVisible(index: number): void {
    this.gpsNeedle.instance.setVisible(false);
    if (index === 1) {
      this.nav1Needle.instance.setVisible(true);
      this.nav2Needle.instance.setVisible(false);
    } else {
      this.nav1Needle.instance.setVisible(false);
      this.nav2Needle.instance.setVisible(true);
    }
    const dtk = this.props.controller.navStates[this.props.controller.activeSourceIndex].dtk_obs;
    setTimeout(() => {
      if (dtk !== null) {
        this.setNeedleRotations(dtk);
      }
    });

  }

  /**
   * Sets the GPS needle as visible.
   */
  private setGpsVisible(): void {
    this.nav1Needle.instance.setVisible(false);
    this.nav2Needle.instance.setVisible(false);
    this.gpsNeedle.instance.setVisible(true);
    const dtk = this.props.controller.navStates[this.props.controller.activeSourceIndex].dtk_obs;
    setTimeout(() => {
      if (dtk !== null) {
        this.setNeedleRotations(dtk);
      }
      if (!this.props.hsiMap) {
        this.gpsNeedle.instance.setDeviationVisible(this.props.controller.isLnavCalculating.get());
      }
    });
  }

  /**
   * Renders the course needles component.
   * @returns The rendered VNode.
   */
  public render(): VNode {
    return (
      <div class="course-needles-rotating" ref={this.el}>
        <Nav1Needle ref={this.nav1Needle} hsiMap={this.props.hsiMap} />
        <Nav2Needle ref={this.nav2Needle} hsiMap={this.props.hsiMap} />
        <GpsNeedle ref={this.gpsNeedle} hsiMap={this.props.hsiMap} />
      </div>
    );
  }
}
