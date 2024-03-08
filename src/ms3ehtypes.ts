/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Standard metadata about a seismogram.
 */
export interface MS3ExtraHeader {
  bag?: BagExtraHeader;
  [k: string]: unknown;
}
/**
 * Common seismic values that are useful to embed in header
 */
export interface BagExtraHeader {
  y?: Timeseries;
  ch?: Channel;
  ev?: Event;
  path?: Path;
  mark?: Marker[];
  [k: string]: unknown;
}
/**
 * timeseries units and processing state
 */
export interface Timeseries {
  /**
   * si units of the timeseries amplitude, ex: count, m/s, m/s2
   */
  si: string;
  /**
   * basic processing type. Raw is unprocessed, gain has scalar gain/units, corrected transfer of frequency response, processed further userlevel processing
   */
  proc?: "raw" | "gain" | "corrected" | "synth" | "processed";
  [k: string]: unknown;
}
/**
 * recording station/channel
 */
export interface Channel {
  /**
   * latitude in degrees
   */
  la: number;
  /**
   * longitude in degrees
   */
  lo: number;
  /**
   * elevation in meters
   */
  el?: number;
  /**
   * depth below surface in meters
   */
  dp?: number;
  /**
   * channel azimuth from north in degrees
   */
  az?: number;
  /**
   * channel dip from horizontal in degrees, up is -90
   */
  dip?: number;
  [k: string]: unknown;
}
/**
 * source earthquake
 */
export interface Event {
  /**
   * public identifier for earthquake
   */
  id?: string;
  or?: Origin;
  mag?: Magnitude;
  mt?: MomentTensor;
  [k: string]: unknown;
}
/**
 * origin, location and time
 */
export interface Origin {
  /**
   * origin time as ISO8601
   */
  tm: string;
  /**
   * latitude in degrees
   */
  la: number;
  /**
   * longitude in degrees
   */
  lo: number;
  /**
   * depth in kilometers
   */
  dp: number;
  [k: string]: unknown;
}
/**
 * magnitude
 */
export interface Magnitude {
  /**
   * magnitude value
   */
  v: number;
  /**
   * magnitude type
   */
  t?: string;
  [k: string]: unknown;
}
/**
 * moment tensor
 */
export interface MomentTensor {
  /**
   * scalar moment, M0
   */
  moment: number;
  /**
   * 3x3 symmetric tensor, 6 values, often scaled by the scalar moment
   */
  tensor?: unknown[];
  [k: string]: unknown;
}
/**
 * path between source and receiver
 */
export interface Path {
  /**
   * great circle arc distance in degrees, for uses when only distance is needed
   */
  gcarc?: number;
  /**
   * great circle azimuth degrees from event to station, for uses when only distance is needed
   */
  az?: number;
  /**
   * great circle back azimuth in degrees back from station to event, for uses when only distance is needed
   */
  baz?: number;
  [k: string]: unknown;
}
export interface Marker {
  /**
   * marker time as ISO8601
   */
  tm: string;
  /**
   * name of the marker, like P
   */
  n: string;
  /**
   * type of marker, usual 'pk' for measurement/pick on data or 'md' for predicted from model
   */
  mtype?: string;
  amp?: number;
  desc?: string;
  [k: string]: unknown;
}
