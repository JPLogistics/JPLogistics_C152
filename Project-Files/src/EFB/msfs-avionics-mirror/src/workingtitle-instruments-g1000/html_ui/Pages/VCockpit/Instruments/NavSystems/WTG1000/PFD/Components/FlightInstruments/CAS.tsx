import { FSComponent, DisplayComponent, VNode, ComponentProps } from 'msfssdk';
import { CompositeLogicXMLHost, EventBus, KeyEventData, KeyEvents, KeyInterceptManager } from 'msfssdk/data';
import { Annunciation, AnnunciationType } from 'msfssdk/components/Annunciatons';
import { SoundPublisher } from 'msfssdk/utils/sound';
import { G1000ControlEvents } from '../../../Shared/G1000Events';

import './CAS.css';

/** The two states an alert can be in. */
enum AlertState {
  /** A newly arrived, unackowledged alert message. */
  New,
  /** An alert message that has been acknowledged with the Alert softkey. */
  Acked
}

/** The props for a CAS element. */
interface CASProps extends ComponentProps {
  /** The event bus. */
  bus: EventBus,
  /** Our logic handler. */
  logicHandler: CompositeLogicXMLHost,
  /** The configured annunciations. */
  annunciations: Array<Annunciation>,
  /** A publisher for sound events. */
  soundPublisher: SoundPublisher,
  /** The ID string for the caution sound. */
  cautionSoundId?: string,
  /** The ID string for the warning sound. */
  warningSoundId?: string
}

/** A G1000 PFD CAS display. */
export class CAS extends DisplayComponent<CASProps> {
  /** The overall container for the CAS elements. */
  private divRef = FSComponent.createRef<HTMLDivElement>();
  /** The div for new, unacked annunciations. */
  private newRef = FSComponent.createRef<HTMLDivElement>();
  /** The div for acknowledged but still active annunciations. */
  private ackRef = FSComponent.createRef<HTMLDivElement>();
  /** The well little div for the divider bar beween acked and unacked. */
  private dividerRef = FSComponent.createRef<HTMLDivElement>();

  /** The number of unacked messages currently displayed. */
  private numNewDisplayed = 0;
  /** The number of acked messages currently displayed. */
  private numAckedDisplayed = 0;
  /** The number of warnings we need to be playing a sound for. */
  private numActiveWarnings = 0;
  /** The total number of warnings displayed. */
  private totalWarnings = 0;
  /** The total number of cautions displayed. */
  private totalCautions = 0;

  /**
   * Determine whether we need to hide or unhide ourselves when a child's state changes.
   * @param state Whether the alert is acknowledged or not.
   * @param type The type of alert.
   * @param active Whether the child has gone active.
   */
  private setDisplayed(state: AlertState, type: AnnunciationType, active: boolean): void {
    switch (state) {
      case AlertState.New:
        if (active) {
          // A new alert has been displayed.
          this.numNewDisplayed++;
          switch (type) {
            case AnnunciationType.Caution:
              this.totalCautions++;
              this.setMasterStatus(AnnunciationType.Caution, true);
              break;
            case AnnunciationType.Warning:
              this.totalWarnings++;
              this.setMasterStatus(AnnunciationType.Warning, true);
              break;
          }
          // If we are adding our first active alert, we need to display the full CAS block.
          if (this.numNewDisplayed == 1) {
            this.divRef.instance.style.display = 'block';
          }
          // If we have any acked messages displayed, we'll show the divider.
          if (this.numAckedDisplayed > 0) {
            this.dividerRef.instance.style.display = 'block';
          }
          // Trigger the play of caution or warning sounds if appropriate.
          if (type == AnnunciationType.Caution && this.props.cautionSoundId !== undefined && !this.numActiveWarnings) {
            this.props.soundPublisher.playSound(this.props.cautionSoundId);
          } else if (type == AnnunciationType.Warning && this.props.warningSoundId !== undefined && ++this.numActiveWarnings == 1) {
            this.props.soundPublisher.startSound(this.props.warningSoundId);
          }
        } else {
          // A previously displayed alert has been hidden.
          this.numNewDisplayed--;
          switch (type) {
            case AnnunciationType.Caution:
              if (--this.totalCautions == 0) {
                this.setMasterStatus(AnnunciationType.Caution, false);
              }
              break;
            case AnnunciationType.Warning:
              if (--this.totalWarnings == 0) {
                this.setMasterStatus(AnnunciationType.Warning, false);
              }
          }
          // If nothing other new alerts are displayed we can hide divider block.
          if (this.numNewDisplayed == 0) {
            this.dividerRef.instance.style.display = 'none';
            // We'll also go ahead and hide the whole CAS div if there's nothing else displayed.
            if (this.numAckedDisplayed == 0) {
              this.divRef.instance.style.display = 'none';
            }
          }
          // Disable the warning sound if it's playing and nothing else needs it.
          if (type == AnnunciationType.Warning && this.props.warningSoundId !== undefined && --this.numActiveWarnings == 0) {
            this.props.soundPublisher.stopSound(this.props.warningSoundId);
          }
        }
        break;
      case AlertState.Acked:
        if (active) {
          // A new acked alert has been displayed.
          this.numAckedDisplayed++;
          switch (type) {
            case AnnunciationType.Caution:
              this.totalCautions++;
              this.setMasterStatus(AnnunciationType.Caution, true);
              break;
            case AnnunciationType.Warning:
              this.totalWarnings++;
              this.setMasterStatus(AnnunciationType.Warning, true);
              break;
          }
          // If we're adding our first acked alert, we need to display the full CAS block.
          if (this.numAckedDisplayed == 1) {
            this.divRef.instance.style.display = 'block';
          }
          if (this.numNewDisplayed > 0) {
            // If there are also unacked messages displayed, activate the divider.
            this.dividerRef.instance.style.display = 'block';
          } else {
            // Otherwise, make sure it's turned off.
            this.dividerRef.instance.style.display = 'none';
          }
        } else {
          // A previously acked alert has been hidden.
          this.numAckedDisplayed--;
          switch (type) {
            case AnnunciationType.Caution:
              if (--this.totalCautions == 0) {
                this.setMasterStatus(AnnunciationType.Caution, false);
              }
              break;
            case AnnunciationType.Warning:
              if (--this.totalWarnings == 0) {
                this.setMasterStatus(AnnunciationType.Warning, false);
              }
          }
          // If that was the last one, hide the divider.
          if (this.numAckedDisplayed == 0) {
            this.dividerRef.instance.style.display = 'none';
            // And if there are also no new ones, hide the full div.
            if (this.numNewDisplayed == 0) {
              this.divRef.instance.style.display = 'none';
            }
          }
        }
        break;
    }
  }

  /** Iterate through the configured annunciations and render each into the new and acked divs. */
  public onAfterRender(): void {
    this.setMasterStatus(AnnunciationType.Caution, false);
    this.setMasterStatus(AnnunciationType.Warning, false);

    KeyInterceptManager.getManager(this.props.bus).then(manager => {
      manager.interceptKey('MASTER_CAUTION_ACKNOWLEDGE', true);
      manager.interceptKey('MASTER_WARNING_ACKNOWLEDGE', true);
    });

    for (const ann of this.props.annunciations) {
      FSComponent.render(
        <CASAnnunciation bus={this.props.bus} logicHandler={this.props.logicHandler} config={ann}
          stateCb={this.setDisplayed.bind(this, AlertState.New, ann.type)} stateShown={AlertState.New} />,
        this.newRef.instance);
      FSComponent.render(
        <CASAnnunciation bus={this.props.bus} logicHandler={this.props.logicHandler} config={ann}
          stateCb={this.setDisplayed.bind(this, AlertState.Acked, ann.type)} stateShown={AlertState.Acked} />,
        this.ackRef.instance);
    }
  }

  /**
   * Set both sets of simvars relevant to a master caution or warning status.
   * @param type The type of the status to set
   * @param active Whether or not the status is active
   */
  private setMasterStatus(type: AnnunciationType, active: boolean): void {
    switch (type) {
      case AnnunciationType.Caution:
        SimVar.SetSimVarValue('K:MASTER_CAUTION_SET', 'bool', active);
        SimVar.SetSimVarValue('L:Generic_Master_Caution_Active', 'bool', active);
        break;
      case AnnunciationType.Warning:
        SimVar.SetSimVarValue('K:MASTER_WARNING_SET', 'bool', active);
        SimVar.SetSimVarValue('L:Generic_Master_Warning_Active', 'bool', active);
        break;
    }
  }

  /**
   * Render the CAS.
   * @returns A VNode.
   */
  public render(): VNode {
    return (
      <div class="annunciations" ref={this.divRef}>
        <div class="annunciations-new" ref={this.newRef} />
        <div class="annunciations-divider" ref={this.dividerRef} />
        <div class="annunciations-acked" ref={this.ackRef} />
      </div>)
      ;
  }
}

/** The props for a single annunciation. */
interface AnnunciationProps extends ComponentProps {
  /** An event bus. */
  bus: EventBus
  /** Our logic handler. */
  logicHandler: CompositeLogicXMLHost,
  /** Our annunciation config. */
  config: Annunciation,
  /** A subject for passing our state back to the CAS. */
  stateCb: (active: boolean) => void,
  /** The state we represent. */
  stateShown: AlertState;
}

/** An individual annunciation. */
class CASAnnunciation extends DisplayComponent<AnnunciationProps> {
  private divRef = FSComponent.createRef<HTMLDivElement>();
  /** Whether or not the actual alert condition is currently active. */
  private active = false;
  /** Whether or not we are currently showing ourselves. */
  private shown = false;

  /** Show ourselves and let the CAS know, if we're not already shown. */
  private showSelf(): void {
    if (!this.shown) {
      this.divRef.instance.style.display = 'block';
      this.props.stateCb(true);
      this.shown = true;
    }
  }

  /** Hide ourselves and let the CAS know, if we're currently shown. */
  private hideSelf(): void {
    if (this.shown) {
      this.divRef.instance.style.display = 'none';
      this.props.stateCb(false);
      this.shown = false;
    }
  }

  /** Register our alert logic handlers and subscribe to the G1000 bus for alert push events. */
  public onAfterRender(): void {
    let intercept: string | undefined;
    switch (this.props.config.type) {
      case AnnunciationType.Caution:
        intercept = 'MASTER_CAUTION_ACKNOWLEDGE'; break;
      case AnnunciationType.Warning:
        intercept = 'MASTER_WARNING_ACKNOWLEDGE'; break;
    }

    if (intercept) {
      this.props.bus.getSubscriber<KeyEvents>().on('key_intercept').handle(
        (keyData: KeyEventData) => {
          if (keyData.key === intercept) {
            this.handleAcknowledgement();
          }
        });
    }

    const g1000ControlEvents = this.props.bus.getSubscriber<G1000ControlEvents>();
    g1000ControlEvents.on('pfd_alert_push').handle((evt: boolean) => {
      if (evt) {
        this.handleAcknowledgement();
      }
    });

    // The composite logic host passes a 1 in the callback if the alert has entered an active state,
    // or 0 if it has become inactive.
    this.props.logicHandler.addLogicAsNumber(this.props.config.condition, (v: number): void => {
      if (v == 1) {
        this.active = true;
        // We're going active, which means we can't be acked yet.  In this case, we only need to
        // take action if we show the new alerts;  acked alert divs stay idle.
        if (this.props.stateShown == AlertState.New) {
          this.showSelf();
        }
      } else {
        this.active = false;
        // We're toggling false.  Whether we're acked or unacked, we need to hide ourselves and
        // let the CAS know.
        this.hideSelf();
      }
    }, 0);
  }

  /**
   * Handle a potential acknowledgement event.
   */
  private handleAcknowledgement(): void {
    if (this.props.stateShown == AlertState.New) {
      // If we are the new alert, we need to hide ourselves so the acked version can show.
      this.hideSelf();
    } else {
      // But if we're the acked div, we need to activate ourselves, assuming the alert is hot.
      if (this.active) {
        this.showSelf();
      }
    }
  }

  /**
   * Render an annunciation.
   * @returns A VNode.
   */
  public render(): VNode {
    let type: string;
    switch (this.props.config.type) {
      case AnnunciationType.Advisory:
        type = 'advisory'; break;
      case AnnunciationType.Caution:
        type = 'caution'; break;
      case AnnunciationType.SafeOp:
        type = 'safeop'; break;
      case AnnunciationType.Warning:
        type = 'warning'; break;
    }

    return (
      <div class={`annunciation ${type}`} style="display: none;" ref={this.divRef}>{this.props.config.text}</div>
    );
  }
}