import { ComponentProps, NodeReference } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { ViewService } from '../../../../Shared/UI/ViewService';

/**
 * Props for MFD System Setup page group components.
 */
export interface MFDSystemSetupGroupProps extends ComponentProps {
  /** The event bus. */
  bus: EventBus;

  /** The view service. */
  viewService: ViewService;

  /** The function to use to register the group's controls. */
  registerFunc: (ctrl: UiControl, unregister?: boolean) => void;

  /** A reference to the parent page's containing HTML element. */
  pageContainerRef: NodeReference<HTMLElement>;
}