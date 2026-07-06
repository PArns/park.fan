/**
 * Queue Tactics visual palette. Origins are theme-park lands, so each origin
 * gets a "land" colour family; classes drive the silhouette, cost drives the
 * base ring (TFT-style grey/green/blue/purple/gold).
 */

import type { TraitId } from '@/lib/tactics/core/types';

export const COST_COLORS: Record<number, number> = {
  1: 0x9aa3b2, // grey
  2: 0x3fb27f, // green
  3: 0x3f8cc9, // blue
  4: 0xa15fd4, // purple
  5: 0xe8a93d, // gold
};

/** Body colour + accent per origin (park land). */
export const ORIGIN_COLORS: Record<string, { body: number; accent: number; emissive?: number }> = {
  pirates: { body: 0x8c3b2e, accent: 0xd9a441 }, // weathered red + brass
  royals: { body: 0x3b4fa0, accent: 0xe3c35a }, // royal blue + gold
  robots: { body: 0x7f8c99, accent: 0x37d0c4 }, // steel + teal glow
  spirits: { body: 0x7a6fd0, accent: 0xbcf3ff, emissive: 0x5a4fd0 }, // ghostly violet
  beasts: { body: 0x6d8f3e, accent: 0xc98b4b }, // forest + fur
};

export const CLASS_ACCENTS: Record<string, number> = {
  guardian: 0xb9c4d4,
  duelist: 0xe0e6ee,
  ranger: 0x8a5a2e,
  mystic: 0x9fd4ff,
  support: 0x9ee6a5,
};

export interface ThemePalette {
  skyTop: number;
  skyBottom: number;
  fog: number;
  ground: number;
  tileOwn: number;
  tileEnemy: number;
  tileEdge: number;
  benchPad: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sun: number;
  sunIntensity: number;
  ambient: number;
  lanternIntensity: number;
  treeFoliage: number;
  treeTrunk: number;
}

export const THEMES: Record<'light' | 'dark', ThemePalette> = {
  light: {
    skyTop: 0x8ec9f0,
    skyBottom: 0xdff0fb,
    fog: 0xcfe6f5,
    ground: 0x87b06a,
    tileOwn: 0xd4dfeb,
    tileEnemy: 0xaab6c6,
    tileEdge: 0x8894a6,
    benchPad: 0xb9a884,
    hemiSky: 0xcfe8ff,
    hemiGround: 0x8a9a78,
    hemiIntensity: 0.9,
    sun: 0xfff2d8,
    sunIntensity: 1.6,
    ambient: 0x9fb4c8,
    lanternIntensity: 0.0,
    treeFoliage: 0x4e7d3a,
    treeTrunk: 0x6b4a30,
  },
  dark: {
    skyTop: 0x16233f,
    skyBottom: 0x3a5187,
    fog: 0x263657,
    ground: 0x35513a,
    tileOwn: 0x55688c,
    tileEnemy: 0x3a4763,
    tileEdge: 0x252f45,
    benchPad: 0x5c5140,
    hemiSky: 0x4a5f92,
    hemiGround: 0x2a3a2c,
    hemiIntensity: 0.95,
    sun: 0xbcd0ff,
    sunIntensity: 1.05,
    ambient: 0x3d4d70,
    lanternIntensity: 2.6,
    treeFoliage: 0x35633b,
    treeTrunk: 0x4d3a26,
  },
};

/** Trait chip colours for the HUD (kept here so 3D + DOM stay in sync). */
export const TRAIT_HUD_COLORS: Record<TraitId, string> = {
  pirates: '#c96a4a',
  royals: '#6d82e0',
  robots: '#45c7bb',
  spirits: '#a394ec',
  beasts: '#8fae54',
  guardian: '#9fb4d0',
  duelist: '#e2e8f2',
  ranger: '#c08a52',
  mystic: '#7cc0f2',
  support: '#7fd489',
};
