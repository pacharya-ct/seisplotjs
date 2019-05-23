// @flow

/*global DataView*/
/**
 * Philip Crotwell
 * University of South Carolina, 2014
 * http://www.seis.sc.edu
 */

// special due to flow
import {moment, stringify} from './util';

import {Seismogram, Trace} from './seismogram';
import * as seedcodec from './seedcodec';


/** parse arrayBuffer into an array of DataRecords. */
export function parseDataRecords(arrayBuffer: ArrayBuffer) {
  console.log(`Parse Data Records, arrayBuffer length = ${arrayBuffer.byteLength}`);
  let dataRecords = [];
  let offset = 0;
  while (offset < arrayBuffer.byteLength) {
    let dataView = new DataView(arrayBuffer, offset);
    let dr = parseSingleDataRecord(dataView);
    dataRecords.push(dr);
    offset += dr.header.recordSize;
  }
  return dataRecords;
}

/** parse a single DataRecord starting at the beginning of the DataView. */
export function parseSingleDataRecord(dataView: DataView) {
  let header = parseSingleDataRecordHeader(dataView);
  let data = new DataView(dataView.buffer,
                          dataView.byteOffset+header.dataOffset,
                          header.recordSize-header.dataOffset);
  return new DataRecord(header, data);
}

/** parse the DataHeader from a single DataRecord starting at the beginning of the DataView. */
export function parseSingleDataRecordHeader(dataView: DataView): DataHeader {
  if (dataView.byteLength < 47) {
    throw new Error(`Not enought bytes for header, need 47, found ${dataView.byteLength}`);
  }
  let out = new DataHeader();
  out.seq = makeString(dataView, 0, 6);
  out.typeCode = dataView.getUint8(6);
  out.continuationCode = dataView.getUint8(7);
  out.staCode = makeString(dataView, 8, 5);
  out.locCode = makeString(dataView, 13, 2);
  out.chanCode = makeString(dataView, 15, 3);
  out.netCode = makeString(dataView, 18, 2);
  out.startBTime = parseBTime(dataView, 20);
  let headerByteSwap = checkByteSwap(out.startBTime);
  if (headerByteSwap) {
    out.startBTime = parseBTime(dataView, 20, headerByteSwap);
  }
  out.numSamples = dataView.getInt16(30, headerByteSwap);
  out.sampRateFac = dataView.getInt16(32, headerByteSwap);
  out.sampRateMul = dataView.getInt16(34, headerByteSwap);
  out.activityFlags = dataView.getUint8(36);
  out.ioClockFlags = dataView.getUint8(37);
  out.dataQualityFlags = dataView.getUint8(38);
  out.numBlockettes = dataView.getUint8(39);
  out.timeCorrection = dataView.getInt32(40, headerByteSwap);
  out.dataOffset = dataView.getUint16(44, headerByteSwap);
  out.blocketteOffset = dataView.getUint16(46, headerByteSwap);
  let offset = out.blocketteOffset;
  out.blocketteList = [];
  out.recordSize = 4096;
  out.sampleRate = out.calcSampleRate();
  out.start = out.startBTime.toMoment();
  for (let i=0; i< out.numBlockettes; i++) {
    let nextOffset = dataView.getUint16(offset+2, headerByteSwap);
    if (nextOffset == 0) {
      // last blockette
      nextOffset = out.dataOffset;
    }
    if (nextOffset == 0) {
      nextOffset = offset; // zero length, probably an error...
    }
    let blockette = parseBlockette(dataView, offset, nextOffset-offset, headerByteSwap);
    out.blocketteList.push(blockette);
    offset = nextOffset;
    if (blockette instanceof Blockette1000) {
      out.recordSize = 1 << blockette.dataRecordLengthByte;
      out.encoding = blockette.encoding;
      out.littleEndian = (blockette.wordOrder === 0);
    } else if(blockette instanceof Blockette1001) {
      out.startBTime.microsecond = blockette.microsecond;
    } else if(blockette instanceof Blockette100) {
      out.sampleRate = blockette.sampleRate;
    }
  }
  out.end = out.timeOfSample(out.numSamples-1);
  return out;
}

/** parses a Blockette within the DataView.
  * @param {DataView} dataView containing the data
  * @param {number} offset offset into the DataView to start
  * @param {number} length size in bytes of the Blockette
  * @param headerByteSwap true if byte swapping is needed
  */
export function parseBlockette(dataView: DataView, offset: number, length: number, headerByteSwap: boolean): Blockette {
  const type = dataView.getUint16(offset, headerByteSwap);
  const body = new DataView(dataView.buffer, dataView.byteOffset+offset, length);
  if (type === 1000) {
    const encoding = body.getUint8(4);
    const wordOrder = body.getUint8(5);
    const dataRecordLengthByte = body.getUint8(6);
    return new Blockette1000(type, body, encoding, dataRecordLengthByte, wordOrder);
  } else if (type === 1001) {
    const timeQual = body.getUint8(4);
    const microsecond = body.getUint8(5);
    //const reserved = body.getUint8(6)
    const frameCount = body.getUint8(7);
    return new Blockette1001(type, body, timeQual, microsecond, frameCount);
  } else if (type === 100) {
    const sampleRate = body.getFloat32(4);
    const flags = body.getUint8(8);
    return new Blockette100(type, body, sampleRate, flags);
  } else {
    return new Blockette(type, body);
  }
}

/** Represents a SEED Data Record, with header, blockettes and data.
  * Currently only blockette 1000 is parsed, others are separated,
  * but left as just a DataView. */
export class DataRecord {
  header: DataHeader;
  data: DataView;
  decompData: Array<number> | void;

  constructor(header: DataHeader, data: DataView) {
    this.header = header;
    this.data = data;
    this.decompData = undefined;
  }
    /** Decompresses the data into the decompData field, if the compression
     *  type is known. This only needs to be called once and the result will
     *  be cached.
     */
  decompress() {
    // only decompress once as it is expensive operation
    if ( typeof this.decompData === 'undefined') {
      this.decompData = seedcodec.decompress(this.header.encoding, this.data, this.header.numSamples, this.header.littleEndian);
    }
    return this.decompData;
  }

  /** Concatenates the net, station, loc and channel codes,
    * separated by the given seperator, or periods if not given.
  */
  codes(sep) {
    if ( ! sep) { sep = '.';}
    return this.header.netCode+sep+this.header.staCode+sep+this.header.locCode+sep+this.header.chanCode;
  }
}

/** Represents the header part of the DataRecord, including all the actual
 *  fixed header plus fields pulled from a blockette 1000 if present.
 */
export class DataHeader {
  seq: string;
  typeCode: number;
  continuationCode: number;
  staCode: string;
  locCode: string;
  chanCode: string;
  netCode: string;
  startBTime: BTime;
  numSamples: number;
  encoding: number;
  littleEndian: boolean;
  sampRateFac: number;
  sampRateMul: number;
  sampleRate: number;
  activityFlags: number;
  ioClockFlags: number;
  dataQualityFlags: number;
  numBlockettes: number;
  timeCorrection: number;
  dataOffset: number;
  blocketteOffset: number;
  recordSize: number;
  blocketteList: Array<Blockette>;
  start: moment;
  end: moment;
  constructor() {
    this.seq = "      ";
    this.typeCode = 68; // D
    this.continuationCode = 32; // space
    this.staCode = '';
    this.locCode = '';
    this.chanCode = '';
    this.netCode = '';
    this.startBTime = new BTime(1900, 1, 0, 0, 0, 0);
    this.numSamples = 0;
    this.sampRateFac = 0;
    this.sampRateMul = 0;
    this.activityFlags = 0;
    this.ioClockFlags = 0;
    this.dataQualityFlags = 0;
    this.numBlockettes = 0;
    this.timeCorrection = 0;
    this.dataOffset = 0;
    this.blocketteOffset = 0;
    this.blocketteList = [];
    this.recordSize = 4096;
    this.encoding = 0;
    this.littleEndian = false;
    this.sampleRate = 0;
    this.start = this.startBTime.toMoment();
    this.end = moment.utc(this.start);
  }

  toString() {
    return this.netCode+"."+this.staCode+"."+this.locCode+"."+this.chanCode+" "+this.start.toISOString()+" "+this.encoding;
  }

  /** Calculates the sample rate in hertz from the sampRateFac and sampRateMul
  parameters. This.sampleRate value is set to this value at construction. */
  calcSampleRate(): number {
    let factor = this.sampRateFac;
    let multiplier = this.sampRateMul;
    let sampleRate = 10000.0; // default (impossible) value;
    if((factor * multiplier) != 0.0) { // in the case of log records
        sampleRate = Math.pow(Math.abs(factor),
                              (factor / Math.abs(factor)))
                     * Math.pow(Math.abs(multiplier),
                              (multiplier / Math.abs(multiplier)));
    }
    return sampleRate;
  }

  /** Calculates the time of the i-th sample in the record, zero based,
   *  so timeOfSample(0) is the start and timeOfSample(this.numSamples-1) is end.
  */
  timeOfSample(i: number): moment {
    return moment.utc(this.start).add(i/this.sampleRate, 'second');
  }
}

export class Blockette {
  type: number;
  body: DataView;

  constructor(type: number, body: DataView) {
    this.type = type;
    this.body = body;
  }
}


export class Blockette1000 extends Blockette {
  encoding: number;
  dataRecordLengthByte: number;
  wordOrder: number;
  constructor(type: number, body: DataView, encoding: number, dataRecordLengthByte: number, wordOrder: number) {
    super(type, body);
    if (type != 1000) {throw new Error("Not a blockette1000: "+this.type);}
    this.encoding = encoding;
    this.dataRecordLengthByte = dataRecordLengthByte;
    this.wordOrder = wordOrder;
  }
}

export class Blockette1001 extends Blockette {
  timeQual: number;
  microSec: number;
  frameCount: number;
  constructor(type: number, body: DataView, timeQual: number, microSec: number, frameCount: number) {
    super(type, body);
    if (type != 1001) {throw new Error("Not a blockette1001: "+this.type);}
    this.timeQual = timeQual;
    this.microSec = microSec;
    this.frameCount = frameCount;
  }
}

export class Blockette100 extends Blockette {
  sampleRate: number;
  flags: number;
  constructor(type: number, body: DataView, sampleRate: number, flags: number) {
    super(type, body);
    if (type != 100) {throw new Error("Not a blockette100: "+this.type);}
    this.sampleRate = sampleRate;
    this.flags = flags;
  }
}

function makeString(dataView: DataView, offset: number, length: number): string {
  let out = "";
  for (let i=offset; i<offset+length; i++) {
    let charCode = dataView.getUint8(i);
    if (charCode > 31) {
      out += String.fromCharCode(charCode);
    }
  }
  return out.trim();
}

export function parseBTime(dataView: DataView, offset: number, byteSwap?: boolean): BTime {
    if ( ! byteSwap ) { byteSwap = false; }
    let year = dataView.getInt16(offset, byteSwap);
    let jday = dataView.getInt16(offset+2, byteSwap);
    let hour = dataView.getInt8(offset+4);
    let min = dataView.getInt8(offset+5);
    let sec = dataView.getInt8(offset+6);
    // byte 7 unused, alignment
    let tenthMilli = dataView.getInt16(offset+8, byteSwap);
    return new BTime(year, jday, hour, min, sec, tenthMilli);
}

export class BTime {
  year: number;
  jday: number;
  hour: number;
  min: number;
  sec: number;
  tenthMilli: number;
  microsecond: number; // -50 to 49, not part of BTime proper, but added in case of B1001
  length: number;
  constructor(year: number, jday: number, hour: number, min: number, sec: number, tenthMilli: number) {
    this.length = 10;
    this.year = year;
    this.jday = jday;
    this.hour = hour;
    this.min = min;
    this.sec = sec;
    this.tenthMilli = tenthMilli;
    this.microsecond = 0;
  }
  toString(): string {
    return this.year+"-"+this.jday+" "+this.hour+":"+this.min+":"+this.sec+"."+this.tenthMilli.toFixed().padStart(4,'0')+" "+this.toMoment().toISOString();
  }
  toMoment(): moment {
    let m = new moment.utc([this.year, 0, 1, this.hour, this.min, this.sec, 0]);
    m.add(Math.round(this.tenthMilli/10), 'ms');
    m.dayOfYear(this.jday);
    if (m.isValid()) {
      return m;
    } else {
      throw new Error(`BTime.start is invalid moment: ${this.year} ${this.jday} ${this.hour} ${this.min} ${this.sec} ${this.tenthMilli}`);
    }
  }
  toDate(): Date {
    return new Date(this.year, 0, this.jday, this.hour, this.min, this.sec, this.tenthMilli/10);
  }
}


function checkByteSwap(bTime: BTime): boolean {
  return bTime.year < 1960 || bTime.year > 2055;
}

/** Determines if two DataRecords are contiguous, ie if the second starts
  * after the end of the first and the start time of the second is within
  * 1.5 times the sample period of the end of the first.
  */
export function areContiguous(dr1: DataRecord, dr2: DataRecord) {
    let h1 = dr1.header;
    let h2 = dr2.header;
    return h1.end.isBefore(h2.start)
        && h1.end.valueOf() + 1000*1.5/h1.sampleRate > h2.start.valueOf();
}

/** Concatentates a sequence of DataRecords into a single seismogram object.
  * Assumes that they are all contiguous and in order. Header values from the first
  * DataRecord are used. */
export function createSeismogram(contig: Array<DataRecord>): Seismogram {
  let y = [];
  for (let i=0; i<contig.length; i++) {
    y = y.concat(contig[i].decompress());
  }
  let out = new Seismogram(y,
                                 contig[0].header.sampleRate,
                                 contig[0].header.start);
  out.networkCode = contig[0].header.netCode;
  out.stationCode = contig[0].header.staCode;
  out.locationCode = contig[0].header.locCode;
  out.channelCode = contig[0].header.chanCode;

  return out;
}


/**
 * Merges data records into a Trace object, each of
 * which consists of Seismogram segment objects
 * containing the data as a float array.
 * This assumes all data records are from the same channel, byChannel
 * can be used first if multiple channels may be present.
 */
export function merge(drList: Array<DataRecord>): Trace {
  let out = [];
  let currDR;
  drList.sort(function(a,b) {
      return a.header.start.diff(b.header.start);
  });
  let contig = [];
  for (let i=0; i<drList.length; i++) {
    currDR = drList[i];
    if ( contig.length == 0 ) {
      contig.push(currDR);
    } else if (areContiguous(contig[contig.length-1], currDR)) {
      contig.push(currDR);
    } else {
      //found a gap
      out.push(createSeismogram(contig));
      contig = [ currDR ];
    }
  }
  if (contig.length > 0) {
      // last segment
      out.push(createSeismogram(contig));
      contig = [];
  }
  return new Trace(out);
}



/** Finds the min and max values of a Seismogram, with an optional
  * accumulator for use with gappy data. */
export function segmentMinMax(segment: Seismogram, minMaxAccumulator?: Array<number>): Array<number> {
  if ( ! segment.y) {
    throw new Error("Segment does not have a y field, doesn't look like a seismogram segment. "+stringify(segment));
  }
  let minAmp = Number.MAX_SAFE_INTEGER;
  let maxAmp = -1 * (minAmp);
  if ( minMaxAccumulator) {
    minAmp = minMaxAccumulator[0];
    maxAmp = minMaxAccumulator[1];
  }
  let yData = ((segment.y: any): Array<number>); // for flow
  for (let n = 0; n < yData.length; n++) {
    if (minAmp > yData[n]) {
      minAmp = yData[n];
    }
    if (maxAmp < yData[n]) {
      maxAmp = yData[n];
    }
  }
  return [ minAmp, maxAmp ];
}

/** Splits a list of data records by channel code, returning a Map
  * with each NSLC string mapped to an array of data records. */
export function byChannel(drList: Array<DataRecord>): Map<string, Array<DataRecord>> {
  let out = new Map();
  let key;
  for (let i=0; i<drList.length; i++) {
    let currDR = drList[i];
    key = currDR.codes();
    let array = out.get(key);
    if ( ! array) {
      array = [currDR];
      out.set(key, array);
    } else {
      array.push(currDR);
    }
  }
  return out;
}

export function mergeByChannel(drList: Array<DataRecord> ): Map<string, Trace> {
  let out = new Map();
  let byChannelMap = this.byChannel(drList);
  console.log("mergeByChannel  byChannelMap.size="+byChannelMap.size);
  for (let [key, seisArray] of byChannelMap) {
    out.set(key, merge(seisArray));
  }
  console.log("mergeByChannel  out.size="+out.size);
  return out;
}

export function tracePerChannel(drList: Array<DataRecord>): Map<string, Trace> {
  let out = new Map();
  let byChannelMap = this.byChannel(drList);
  console.log("mergeByChannel  byChannelMap.size="+byChannelMap.size);
  for (let [key, seisArray] of byChannelMap) {
    seisArray = seisArray.map(dr => createSeismogram( [ dr ] ));
    out.set(key, new Trace(seisArray));
  }
  console.log("traceByChannel  out.size="+out.size);
  return out;
}
