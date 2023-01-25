/*
 * Philip Crotwell
 * University of South Carolina, 2019
 * http://www.seis.sc.edu
 */

import {DateTime, Duration, Interval, FixedOffsetZone} from "luxon";
export const XML_MIME = "application/xml";
export const JSON_MIME = "application/json";
export const JSONAPI_MIME = "application/vnd.api+json";
export const SVG_MIME = "image/svg+xml";
export const TEXT_MIME = "text/plain";
export const BINARY_MIME = "application/octet-stream";

export const UTC_OPTIONS = {zone: FixedOffsetZone.utcInstance};

export function hasArgs(value: any): boolean {
  return arguments.length !== 0 && typeof value !== "undefined";
}
export function hasNoArgs(value: any): boolean {
  return arguments.length === 0 || typeof value === "undefined";
}
export function isStringArg(value: any): value is string {
  return (
    arguments.length !== 0 &&
    (typeof value === "string" || (isObject(value) && value instanceof String))
  );
}
export function isNumArg(value: any): value is number {
  return (
    arguments.length !== 0 &&
    (typeof value === "number" || (isObject(value) && value instanceof Number))
  );
}
export function isNonEmptyStringArg(value: any): value is string {
  return arguments.length !== 0 && isStringArg(value) && value.length !== 0;
}
export function isObject(obj: unknown): obj is object {
  return obj !== null && typeof obj === "object";
}
//export function isDef(v: unknown): boolean {
//  return typeof v !== "undefined" && v !== null;
//}
export function isDef<Value>(value: Value | undefined | null): value is Value {
  return value !== null && value !== undefined;
}

export function reErrorWithMessage(err: any, message: string): Error {
  let out;
  if ( ! isDef(err)) {
    out = new Error(`${message}`);
  } else if (typeof err === "string") {
    out = new Error(`${message} ${err}`);
  } else {
    if (err instanceof Error) {
      err.message = `${message} ${err.message}`;
    }
    out = err;
  }
  return out;
}

export function doStringGetterSetter(
  obj: any,
  field: string,
  value?: string,
) {
  const hiddenField = `_${field}`;

  if (hasNoArgs(value) || value === null) {
    // passing no args or null effectively unsets field
    obj[hiddenField] = undefined;
  } else if (isStringArg(value)) {
    obj[hiddenField] = value;
  } else {
    throw new Error(
      `${field} value argument is optional or string, but was type ${typeof value}, '${value}' `,
    );
  }

  return obj;
}
export function doBoolGetterSetter(
  obj: any,
  field: string,
  value?: boolean,
): boolean | any {
  const hiddenField = `_${field}`;

  if (hasNoArgs(value) || value === null) {
    // passing no args or null effectively unsets field
    obj[hiddenField] = undefined;
  } else if (value === true || value === false) {
    obj[hiddenField] = value;
  } else {
    throw new Error(
      `${field} value argument is optional or boolean, but was type ${typeof value}, '${value}' `,
    );
  }

  return obj;
}
export function doIntGetterSetter(
  obj: any,
  field: string,
  value?: number,
) {
  const hiddenField = `_${field}`;

  if (hasNoArgs(value) || value === null) {
    // passing no args or null effectively unsets field
    obj[hiddenField] = undefined;
  } else if (isNumArg(value)) {
    obj[hiddenField] = value;
  } else if (isStringArg(value) && Number.isFinite(Number(value))) {
    obj[hiddenField] = parseInt(value);
  } else {
    throw new Error(
      `${field} value argument is optional or number, but was type ${typeof value}, '${value}' `,
    );
  }

  return obj;
}
export function doFloatGetterSetter(
  obj: any,
  field: string,
  value?: number,
) {
  const hiddenField = `_${field}`;

  if (hasNoArgs(value) || value === null) {
    // passing no args or null effectively unsets field
    obj[hiddenField] = undefined;
  } else if (isNumArg(value)) {
    obj[hiddenField] = value;
  } else if (isStringArg(value) && Number.isFinite(Number(value))) {
    obj[hiddenField] = parseFloat(value);
  } else {
    throw new Error(
      `value argument is optional or number, but was type ${typeof value}, '${value}' `,
    );
  }

  return obj;
}
export function doMomentGetterSetter(
  obj: any,
  field: string,
  value?: DateTime | string,
) {
  const hiddenField = `_${field}`;

  if (hasNoArgs(value) || value === null) {
    // passing no args or null effectively unsets field
    obj[hiddenField] = undefined;
  } else if (isDef(value) && isObject(value) && DateTime.isDateTime(value)) {
    obj[hiddenField] = value;
  } else if (isDef(value) && DateTime.isDateTime(checkStringOrDate(value))) {
    obj[hiddenField] = checkStringOrDate(value);
  } else {
    throw new Error(
      `${field} value argument is optional, DateTime, date or date string, but was type ${typeof value}, '${stringify(
        value,
      )}' `,
    );
  }

  return obj;
}

/**
 * Converts entire DataView to a string as utf-8.
 *
 * @param   dataView bytes to convert
 * @returns           the string
 */
export function dataViewToString(dataView: DataView): string {
  let out = "";

  for (let i = 0; i < dataView.byteLength; i++) {
    out += String.fromCharCode(dataView.getUint8(i));
  }

  return out;
}

/**
 * Log a message to the console. Put here to limit lint console errors
 * for the times we really do want to use console.log. Will also append a
 * p tag to a div#debug if it exists.
 *
 * @param   msg the message to log
 */
export function log(msg: string): void {
  // eslint-disable-next-line no-console
  if (console) {
    console.log(`${stringify(msg)}`);
  }

  if (typeof document !== "undefined" && document !== null) {
    const p = document.createElement("p");
    p.textContent = `${stringify(msg)}`;
    const divDebug = (document.querySelector("div#debug") as HTMLInputElement);
    if (isDef(divDebug)) {
      divDebug.appendChild(p);
    }
  }
}

/**
 * typescript-y check if Error.
 *
 * @param error
 * @returns true if Error object
 */
export function isError(error: unknown): error is Error {
  return (
    typeof error === 'object' &&
    error !== null &&
    error instanceof Error
  );
}

/**
 * typescript-y convert errors.
 *
 * @param maybeError
 * @returns an Error object
 */
export function toError(maybeError: unknown): Error {
  if (isError(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

/**
 * Log a warning message to the console. Put here to limit lint console errors
 * for the times we really do want to use console.log. Will also append a
 * p tag to a div#debug if it exists.
 *
 * @param   msg the message to log
 */
export function warn(msg: string): void {
  // eslint-disable-next-line no-console
  if (console) {
    console.assert(false, `${stringify(msg)}`);
  }

  if (typeof document !== "undefined" && document !== null) {
    const p = document.createElement("p");
    p.textContent = `${stringify(msg)}`;
    (document.querySelector("div#debug") as HTMLInputElement)
      .appendChild(p);
  }
}

/**
 * String representation of input. This is kind of dumb but makes
 *  flow happier.
 *
 * @param value any kind of thing that can be turned into a string
 * @returns a string
 */
export function stringify(value: unknown): string {
  if (typeof value === "string") {
    return value;
  } else if (typeof value === "number") {
    return value.toString();
  } else if (typeof value === "boolean") {
    return value ? "true" : "false";
  } else if (typeof value === "undefined") {
    return "undefined";
  } else if (typeof value === "function") {
    return "function " + value.name;
  } else if (typeof value === "object") {
    if (value) {
      if (DateTime.isDateTime(value)) {
        const dateTimeValue = (value as any) as DateTime;
        return dateTimeValue.toISO();
      } else {
        return value.constructor.name + " " + value.toString();
      }
    //} else if (typeof value === 'symbol') {
    //  return value.toString();
    } else {
      return `${value}`;
    }
  } else {
    return "<unknown" + typeof value + "???>";
  }
}

export function isoToDateTime(val: string): DateTime {
  if (val.toLowerCase() === "now") {
    return DateTime.utc();
  }
  return DateTime.fromISO(val, UTC_OPTIONS);
}

/**
 * Create a luxon Interval from a start and end.
 *
 * @param  start         start of the interval as iso string or DateTime
 * @param  end         end of the interval as string or DateTime
 * @returns          the interval
 */
export function startEnd(start: string | DateTime,
                              end: string | DateTime ): Interval {
  if (isStringArg(start)) {
    start = isoToDateTime(start);
  }
  if (isStringArg(end)) {
    end = isoToDateTime(end);
  }
  return Interval.fromDateTimes(start, end);
}

/**
 * Create a luxon Interval from a start and a duration.
 *
 * @param  start         start of the interval as iso string or DateTime
 * @param  duration      duration of the interval as iso string, number of seconds, or Duration
 * @returns          the interval
 */
export function startDuration(start: string | DateTime,
                              duration: string | Duration | number): Interval {
  if (isStringArg(start)) {
    start = isoToDateTime(start);
  }
  if (isStringArg(duration)) {
    duration = Duration.fromISO(duration);
  } else if (isNumArg(duration)) {
    duration = Duration.fromMillis(1000*duration);
  }
  return Interval.after(start, duration);
}

/**
 * Create a luxon Interval from a duration and a end.
 *
 * @param  duration      duration of the interval as iso string, number of seconds, or Duration
 * @param  end         end of the interval as string or DateTime
 * @returns          the interval
 */
export function durationEnd(duration: string | Duration | number,
                              end: string | DateTime): Interval {
  if (isStringArg(end)) {
    end = isoToDateTime(end);
  }
  if (isStringArg(duration)) {
    duration = Duration.fromISO(duration);
  } else if (isNumArg(duration)) {
    duration = Duration.fromMillis(1000*duration);
  }
  return Interval.before(end, duration);
}

/**
 * Calculates offset of remote server versus local time. It is assumed that the
 * argument was acquired as close in time to calling this as possible.
 *
 * @param  serverTimeUTC now as reported by remote server
 * @returns offset in seconds to now on local machine
 */
export function calcClockOffset(serverTimeUTC: DateTime): number {
  return DateTime.utc().diff(serverTimeUTC).toMillis()*1000.0;
}
export const WAY_FUTURE: DateTime = DateTime.fromISO("2500-01-01T00:00:00Z");

/**
 * converts the input value is a DateTime, throws Error if not
 * a string, Date or DateTime. Zero length string or "now" return
 * current time.
 *
 * @param d 'now', string time, Date, number of milliseconds since epoch, or DateTime
 * @returns DateTime created from argument
 */
export function checkStringOrDate(d: string | Date | DateTime): DateTime {
  if (DateTime.isDateTime(d)) {
    return d;
  } else if (d instanceof Date) {
    return DateTime.fromJSDate(d, UTC_OPTIONS);
  } else if (isNumArg(d)) {
    return DateTime.fromMillis(d, UTC_OPTIONS);
  } else if (isNonEmptyStringArg(d)) {
    const lc = d.toLowerCase();

    if (d.length === 0 || lc === "now") {
      return DateTime.utc();
    } else {
      return isoToDateTime(d);
    }
  }

  throw new Error(`unknown date type: ${d} ${typeof d}`);
}

/**
 * Converts name and value into a html query parameter, with appending ampersand.
 *
 * @param   name parameter name
 * @param   val  parameter value
 * @returns      formated query parameter
 */
export function makeParam(name: string, val: unknown): string {
  return `${name}=${encodeURIComponent(stringify(val))}&`;
}

/**
 * Converts name and value into a parameter line, with appending newline,
 * for including in POST body.
 *
 * @param   name parameter name
 * @param   val  parameter value
 * @returns      formated query parameter
 */
export function makePostParam(name: string, val: unknown): string {
  return name + "=" + stringify(val) + "\n";
}

/**
 * converts to ISO8601 but removes the trailing Z as FDSN web services
 * do not allow that.
 *
 * @param  date DateTime to convert to string
 * @returns ISO8601 without timezone Z
 */
export function toIsoWoZ(date: DateTime): string {
  let out = date.toISO();
  if (out.endsWith('Z')) {
    out = out.substring(0, out.length - 1);
  }
  return out;
}

/**
 * @returns the protocol, http: or https: for the document if possible.
 * Note this includes the colon.
 */
export function checkProtocol(): string {
  let _protocol = "http:";

  if (
    typeof document !== "undefined" &&
    document !== null &&
    "location" in document &&
    "protocol" in document.location &&
    "https:" === document.location.protocol
  ) {
    _protocol = "https:";
  }

  return _protocol;
}

/**
 * Create default fetch init object with the given mimeType. Sets
 * no-cache, follow redirects, cors mode, referrer as seisplotjs and
 * mimetype as a header. Note that redirect with POST may fail due to
 * POST being changed to GET on a 301. Fetching with POST may wish
 * to use redirect: "manual" to handle the 301 correctly by POSTing to
 * the new URL.
 *
 *
 * @param   mimeType requested mime type
 * @returns           object with fetch configuration parameters
 */
export function defaultFetchInitObj(mimeType?: string): Record<string, any> {
  const headers: Record<string, string> = {};

  if (isStringArg(mimeType)) {
    headers.Accept = mimeType;
  }

  return {
    cache: "no-cache",
    redirect: "follow",
    mode: "cors",
    referrer: "seisplotjs",
    headers: headers,
  };
}
export function cloneFetchInitObj(fetchInit: Record<string, any>): Record<string, any> {
  const out = {};
  if (fetchInit) {
    for (const [key, value] of Object.entries(fetchInit)) {
      // @ts-ignore
      if (Array.isArray(value)) {
        // @ts-ignore
        out[key] = value.slice();
      } else {
        // @ts-ignore
        out[key] = value;
      }
    }
  }
  return out;
}

/**
 * Does a fetch, but times out if it takes too long.
 *
 * @param   url        url to retrieve
 * @param   fetchInit  fetch configuration, initialization
 * @param   timeoutSec maximum time to wait in seconds
 * @returns             promise to the result
 * @throws Error if time out or other failure
 */
export function doFetchWithTimeout(
  url: string | URL,
  fetchInit?: Record<string, any>,
  timeoutSec?: number,
): Promise<Response> {
  const controller = new AbortController();
  const signal = controller.signal;

  let internalFetchInit = isDef(fetchInit) ? fetchInit : defaultFetchInitObj();
  internalFetchInit = cloneFetchInitObj(internalFetchInit);
  if (internalFetchInit.redirect === "follow" && internalFetchInit.method === "POST") {
    // follow on POST is dangerous if the server returns 301, handle it ourselves
    // note this is assuming that the redirect is a simple http -> https.
    internalFetchInit.redirect = "manual";
  }


  if (!isDef(timeoutSec)) {
    timeoutSec = 30;
  }

  setTimeout(() => controller.abort(), timeoutSec * 1000);
  internalFetchInit.signal = signal;
  let absoluteUrl: URL;

  if (url instanceof URL) {
    absoluteUrl = url;
  } else if (isStringArg(url)) {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      absoluteUrl = new URL(url);
    } else {
      absoluteUrl = new URL(url, document.URL);
    }
  } else {
    throw new Error(`url must be string or URL, ${stringify(url)}`);
  }

  log(
    `attempt to fetch ${internalFetchInit.method ? internalFetchInit.method : ""} ${stringify(
      absoluteUrl,
    )}`,
  );
  return fetch(absoluteUrl.href, internalFetchInit)
    .catch(err => {
      log("fetch failed, possible CORS or PrivacyBadger or NoScript?");
      throw err;
    })
    .then(function (response) {
      if (response.ok || response.status === 404) {
        return response;
      } else if (response.status >= 300 &&  response.status <= 399) {
        if (checkProtocol() === 'http:' && absoluteUrl.href.startsWith("http://")) {
          // maybe try https just in case
          const httpsUrl = new URL(`https://${absoluteUrl.href.slice(7)}`);
          const method = internalFetchInit.method ? internalFetchInit.method : "";
          log(`attempt fetch redirect ${response.status} ${method} to ${stringify(httpsUrl)}`);
          return fetch(httpsUrl.href, internalFetchInit).then( httpsResponse => {
            if (httpsResponse.ok || httpsResponse.status === 404) {
              return httpsResponse;
            } else {
              return response.text().then(text => {
                throw new Error(
                  `fetch response was redirect for http and failed for https. ${response.ok} ${response.status}, ${httpsResponse.ok} ${httpsResponse.status} \n${text}`,
                );
              });
            }
          });
        }
      }

      return response.text().then(text => {
        throw new Error(
          `fetch response was not ok. ${response.ok} ${response.status}\n${text}`,
        );
      });
    });
}

/**
 * Allows downloading of in memory data, as ArrayBuffer, to file as if
 * the user clicked a download link.
 *
 * @param  data               ArrayBuffer to download
 * @param  filename          default filename
 * @param  mimeType      mimeType, default application/octet-stream
 */
export function downloadBlobAsFile(data: ArrayBuffer, filename: string, mimeType = 'application/octet-stream') {
  if(!data) {
      console.error(' No data');
      return;
  }

  if(!filename) filename = 'filetodownload.txt';

  const blob = new Blob([data], {type: mimeType});
  const e    = document.createEvent('MouseEvents');
  const a    = document.createElement('a');

  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl =  [mimeType, a.download, a.href].join(':');
  e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  a.dispatchEvent(e);
}


/**
 * Recursively calculates the mean of a slice of an array. This helps with
 * very long seismograms to equally weight each sample point without overflowing.
 *
 * @param   dataSlice slice of a seismogram
 * @param   totalPts  number of points in the original seismogram
 * @returns            sum of slice data points divided by totalPts
 */
export function meanOfSlice(
  dataSlice: Int32Array | Float32Array | Float64Array,
  totalPts: number,
): number {
  if (dataSlice.length < 8) {
    // @ts-ignore
    return dataSlice.reduce(function(acc: number, val: number): number {
        return acc + val;
      }, 0) / totalPts;
  } else {
    const byTwo = Math.floor(dataSlice.length / 2);
    return (
      meanOfSlice(dataSlice.slice(0, byTwo), totalPts) +
      meanOfSlice(dataSlice.slice(byTwo, dataSlice.length), totalPts)
    );
  }
}

export const SVG_NS = "http://www.w3.org/2000/svg";

export function createSVGElement(name: string): SVGElement {
  return document.createElementNS(SVG_NS, name);
}
