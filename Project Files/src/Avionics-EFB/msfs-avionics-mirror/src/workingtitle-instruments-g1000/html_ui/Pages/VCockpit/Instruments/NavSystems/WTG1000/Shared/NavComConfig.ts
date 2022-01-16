import { NavComConfig } from 'msfssdk/instruments';

export const G1000Config = new NavComConfig();
G1000Config.navSwitchEvents.set('AS1000_PFD_NAV_Switch', 'PFD');
G1000Config.navSwitchEvents.set('AS1000_MFD_NAV_Switch', 'MFD');
G1000Config.navSelectorEvents.set('AS1000_PFD_NAV_Push', 'PFD');
G1000Config.navSelectorEvents.set('AS1000_MFD_NAV_Push', 'MFD');
G1000Config.navWholeIncEvents.set('AS1000_PFD_NAV_Large_INC', 'PFD');
G1000Config.navWholeIncEvents.set('AS1000_MFD_NAV_Large_INC', 'MFD');
G1000Config.navWholeDecEvents.set('AS1000_PFD_NAV_Large_DEC', 'PFD');
G1000Config.navWholeDecEvents.set('AS1000_MFD_NAV_Large_DEC', 'MFD');
G1000Config.navFractionIncEvents.set('AS1000_PFD_NAV_Small_INC', 'PFD');
G1000Config.navFractionIncEvents.set('AS1000_MFD_NAV_Small_INC', 'MFD');
G1000Config.navFractionDecEvents.set('AS1000_PFD_NAV_Small_DEC', 'PFD');
G1000Config.navFractionDecEvents.set('AS1000_MFD_NAV_Small_DEC', 'MFD');

G1000Config.comSwitchEvents.set('AS1000_PFD_COM_Switch', 'PFD');
G1000Config.comSwitchEvents.set('AS1000_MFD_COM_Switch', 'MFD');
G1000Config.comSelectorEvents.set('AS1000_PFD_COM_Push', 'PFD');
G1000Config.comSelectorEvents.set('AS1000_MFD_COM_Push', 'MFD');
G1000Config.comWholeIncEvents.set('AS1000_PFD_COM_Large_INC', 'PFD');
G1000Config.comWholeIncEvents.set('AS1000_MFD_COM_Large_INC', 'MFD');
G1000Config.comWholeDecEvents.set('AS1000_PFD_COM_Large_DEC', 'PFD');
G1000Config.comWholeDecEvents.set('AS1000_MFD_COM_Large_DEC', 'MFD');
G1000Config.comFractionIncEvents.set('AS1000_PFD_COM_Small_INC', 'PFD');
G1000Config.comFractionIncEvents.set('AS1000_MFD_COM_Small_INC', 'MFD');
G1000Config.comFractionDecEvents.set('AS1000_PFD_COM_Small_DEC', 'PFD');
G1000Config.comFractionDecEvents.set('AS1000_MFD_COM_Small_DEC', 'MFD');
