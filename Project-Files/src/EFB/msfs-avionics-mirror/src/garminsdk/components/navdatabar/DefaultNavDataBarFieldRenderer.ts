import { VNode } from 'msfssdk';
import { UserSettingManager } from 'msfssdk/settings';
import { DateTimeUserSettingTypes } from '../../settings/DateTimeUserSettings';
import { UnitsUserSettingManager } from '../../settings/UnitsUserSettings';
import { NavDataFieldType } from '../navdatafield/NavDataFieldType';
import {
  GenericNavDataBarFieldRenderer, NavDataBarFieldBrgRenderer, NavDataBarFieldDestRenderer,
  NavDataBarFieldDisRenderer, NavDataBarFieldDtgRenderer, NavDataBarFieldDtkRenderer,
  NavDataBarFieldEndRenderer, NavDataBarFieldEtaRenderer, NavDataBarFieldEteRenderer,
  NavDataBarFieldFobRenderer, NavDataBarFieldFodRenderer, NavDataBarFieldGsRenderer,
  NavDataBarFieldIsaRenderer, NavDataBarFieldLdgRenderer, NavDataBarFieldTasRenderer,
  NavDataBarFieldTkeRenderer, NavDataBarFieldTrkRenderer, NavDataBarFieldVsrRenderer,
  NavDataBarFieldXtkRenderer
} from './GenericNavDataBarFieldRenderer';
import { NavDataBarFieldTypeModelMap } from './NavDataBarFieldModel';
import { NavDataBarFieldRenderer } from './NavDataBarFieldRenderer';

/**
 * A default implementation of NavDataBarFieldRenderer.
 */
export class DefaultNavDataBarFieldRenderer implements NavDataBarFieldRenderer {
  private readonly renderer: GenericNavDataBarFieldRenderer;

  /**
   * Constructor.
   * @param unitsSettingManager A display units user setting manager.
   * @param dateTimeSettingManager A date/time user setting manager.
   */
  constructor(
    unitsSettingManager: UnitsUserSettingManager,
    dateTimeSettingManager: UserSettingManager<DateTimeUserSettingTypes>
  ) {
    this.renderer = new GenericNavDataBarFieldRenderer();

    this.renderer.register(NavDataFieldType.BearingToWaypoint, new NavDataBarFieldBrgRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.Destination, new NavDataBarFieldDestRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.DistanceToWaypoint, new NavDataBarFieldDisRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.DistanceToDestination, new NavDataBarFieldDtgRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.DesiredTrack, new NavDataBarFieldDtkRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.Endurance, new NavDataBarFieldEndRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.TimeOfWaypointArrival, new NavDataBarFieldEtaRenderer(dateTimeSettingManager));
    this.renderer.register(NavDataFieldType.TimeToWaypoint, new NavDataBarFieldEteRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.FuelOnBoard, new NavDataBarFieldFobRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.FuelOverDestination, new NavDataBarFieldFodRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.GroundSpeed, new NavDataBarFieldGsRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.ISA, new NavDataBarFieldIsaRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.TimeOfDestinationArrival, new NavDataBarFieldLdgRenderer(dateTimeSettingManager));
    this.renderer.register(NavDataFieldType.TrueAirspeed, new NavDataBarFieldTasRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.TrackAngleError, new NavDataBarFieldTkeRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.GroundTrack, new NavDataBarFieldTrkRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.VerticalSpeedRequired, new NavDataBarFieldVsrRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.CrossTrack, new NavDataBarFieldXtkRenderer(unitsSettingManager));
  }

  /**
   * Renders a navigation data bar field of a given type.
   * @param type A data bar field type.
   * @param model The data model for the field.
   * @returns A navigation data bar field of the given type, as a VNode.
   * @throws Error if an unsupported field type is specified.
   */
  public render<T extends NavDataFieldType>(type: T, model: NavDataBarFieldTypeModelMap[T]): VNode {
    return this.renderer.render(type, model);
  }
}