import { VNode } from 'msfssdk';
import { NavDataFieldType } from '../../../../Shared/UI/NavDataField/NavDataFieldType';
import { UnitsUserSettingManager } from '../../../../Shared/Units/UnitsUserSettings';
import {
  GenericMFDNavDataBarFieldRenderer, MFDNavDataBarFieldBrgRenderer, MFDNavDataBarFieldDestRenderer,
  MFDNavDataBarFieldDisRenderer, MFDNavDataBarFieldDtgRenderer, MFDNavDataBarFieldDtkRenderer,
  MFDNavDataBarFieldEndRenderer, MFDNavDataBarFieldEtaRenderer, MFDNavDataBarFieldEteRenderer,
  MFDNavDataBarFieldFobRenderer, MFDNavDataBarFieldFodRenderer, MFDNavDataBarFieldGsRenderer,
  MFDNavDataBarFieldTasRenderer, MFDNavDataBarFieldTkeRenderer, MFDNavDataBarFieldTrkRenderer,
  MFDNavDataBarFieldVsrRenderer, MFDNavDataBarFieldXtkRenderer
} from './GenericMFDNavDataBarFieldRenderer';
import { MFDNavDataBarFieldTypeModelMap } from './MFDNavDataBarFieldModel';
import { MFDNavDataBarFieldRenderer } from './MFDNavDataBarFieldRenderer';

/**
 * A default implementation of MFDNavDataBarFieldRenderer.
 */
export class DefaultMFDNavDataBarFieldRenderer implements MFDNavDataBarFieldRenderer {
  private readonly renderer: GenericMFDNavDataBarFieldRenderer;

  /**
   * Constructor.
   * @param unitsSettingManager A display units user setting manager.
   */
  constructor(unitsSettingManager: UnitsUserSettingManager) {
    this.renderer = new GenericMFDNavDataBarFieldRenderer();

    this.renderer.register(NavDataFieldType.BearingToWaypoint, new MFDNavDataBarFieldBrgRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.Destination, new MFDNavDataBarFieldDestRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.DistanceToWaypoint, new MFDNavDataBarFieldDisRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.DistanceToDestination, new MFDNavDataBarFieldDtgRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.DesiredTrack, new MFDNavDataBarFieldDtkRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.Endurance, new MFDNavDataBarFieldEndRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.TimeToDestination, new MFDNavDataBarFieldEtaRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.TimeToWaypoint, new MFDNavDataBarFieldEteRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.FuelOnBoard, new MFDNavDataBarFieldFobRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.FuelOverDestination, new MFDNavDataBarFieldFodRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.GroundSpeed, new MFDNavDataBarFieldGsRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.TrueAirspeed, new MFDNavDataBarFieldTasRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.TrackAngleError, new MFDNavDataBarFieldTkeRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.GroundTrack, new MFDNavDataBarFieldTrkRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.VerticalSpeedRequired, new MFDNavDataBarFieldVsrRenderer(unitsSettingManager));
    this.renderer.register(NavDataFieldType.CrossTrack, new MFDNavDataBarFieldXtkRenderer(unitsSettingManager));
  }

  /**
   * Renders a navigation data bar field of a given type.
   * @param type A data bar field type.
   * @param model The data model for the field.
   * @returns A navigation data bar field of the given type, as a VNode.
   * @throws Error if an unsupported field type is specified.
   */
  public render<T extends NavDataFieldType>(type: T, model: MFDNavDataBarFieldTypeModelMap[T]): VNode {
    return this.renderer.render(type, model);
  }
}