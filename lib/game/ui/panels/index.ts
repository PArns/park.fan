'use client';

/**
 * The panels `ui` ships itself, registered through the same registry a foreign module uses.
 *
 * That is the point of this file: there is no privileged path. The park panel is registered with
 * the identical call `overlays` will make for its legend, so if the registry is not good enough
 * for these nine it is not good enough at all, and the shortcoming shows up here first rather
 * than in somebody else's module.
 *
 * Order is spelled out rather than implied by the order of the calls, because the rail's order is
 * the order a player learns and it must not depend on which import a bundler hoisted.
 */

import {
  Bell,
  CloudSun,
  CupSoda,
  FerrisWheel,
  Gauge,
  Keyboard,
  MousePointerSquareDashed,
  Save,
  Settings2,
  Users,
} from 'lucide-react';
import type { Translate } from '../../i18n';
import type { UiMainApi } from '../api';
import { GuestsPanel, ParkPanel, WeatherPanel } from './park';
import { RidesPanel, ShopsPanel } from './operations';
import { InspectorPanel, RideInspector, ShopInspector } from './inspector';
import { HelpPanel, LogPanel, SavesPanel, SettingsPanel } from './system';

export function registerBuiltinPanels(ui: UiMainApi, t: Translate): () => void {
  const offs = [
    ui.registerPanel({
      id: 'park',
      title: t('panel.park'),
      icon: Gauge,
      group: 'park',
      order: 10,
      Body: ParkPanel,
    }),
    ui.registerPanel({
      id: 'rides',
      title: t('panel.rides'),
      icon: FerrisWheel,
      group: 'park',
      order: 20,
      Body: RidesPanel,
      badge: (s) => (s.totals.ridesDown > 0 ? s.totals.ridesDown : null),
    }),
    ui.registerPanel({
      id: 'shops',
      title: t('panel.shops'),
      icon: CupSoda,
      group: 'park',
      order: 30,
      Body: ShopsPanel,
    }),
    ui.registerPanel({
      id: 'guests',
      title: t('panel.guests'),
      icon: Users,
      group: 'park',
      order: 40,
      Body: GuestsPanel,
    }),
    ui.registerPanel({
      id: 'weather',
      title: t('panel.weather'),
      icon: CloudSun,
      group: 'park',
      order: 50,
      Body: WeatherPanel,
    }),
    ui.registerPanel({
      id: 'inspector',
      title: t('panel.inspector'),
      icon: MousePointerSquareDashed,
      group: 'build',
      order: 10,
      // Opened by selecting something, and closed again when the selection clears. A rail button
      // for it would be a button that usually opens an empty panel.
      rail: false,
      Body: InspectorPanel,
    }),
    ui.registerPanel({
      id: 'log',
      title: t('panel.log'),
      icon: Bell,
      group: 'system',
      order: 10,
      Body: LogPanel,
      badge: (s) => (s.log.length > 0 ? s.log.length : null),
    }),
    ui.registerPanel({
      id: 'saves',
      title: t('panel.saves'),
      icon: Save,
      group: 'system',
      order: 20,
      Body: SavesPanel,
    }),
    ui.registerPanel({
      id: 'settings',
      title: t('panel.settings'),
      icon: Settings2,
      group: 'system',
      order: 30,
      Body: SettingsPanel,
    }),
    ui.registerPanel({
      id: 'help',
      title: t('panel.help'),
      icon: Keyboard,
      group: 'system',
      order: 40,
      Body: HelpPanel,
    }),
    ui.registerInspector({ kind: 'ride', icon: FerrisWheel, Body: RideInspector }),
    ui.registerInspector({ kind: 'shop', icon: CupSoda, Body: ShopInspector }),
  ];
  return () => {
    for (const off of offs) off();
  };
}
