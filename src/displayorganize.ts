import {fftForward} from "./fft";
import * as spectraplot from "./spectraplot";
import * as leafletutil from "./leafletutil";
import {ParticleMotion, createParticleMotionConfig} from "./particlemotion";
import {Quake} from "./quakeml";
import {Station} from "./stationxml";
import {SeismogramDisplayData, uniqueQuakes, uniqueStations} from "./seismogram";
import {Seismograph, SEISMOGRAPH_ELEMENT} from "./seismograph";
import {SeismographConfig} from "./seismographconfig";
import {isDef, isStringArg, stringify} from "./util";
import * as d3 from "d3";
import * as L from "leaflet";
import * as querystringify from "querystringify";
import Handlebars from "handlebars";
export const PLOT_TYPE = "plottype";
export const SEISMOGRAPH = "seismograph";
export const SPECTRA = "amp_spectra";
export const PARTICLE_MOTION = "particlemotion";
export const MAP = "map";
export const INFO = "info";
export const QUAKE_TABLE = "quake_table";
export const STATION_TABLE = "station_table";
export class OrganizedDisplay extends HTMLElement {
  _seisDataList: Array<SeismogramDisplayData>;
  _seismographConfig: SeismographConfig;
  seismograph: Seismograph | null;
  spectraPlot: spectraplot.SpectraPlot | null;
  particleMotionPlot: ParticleMotion | null;
  extras: Map<string, any>;

  constructor() {
    super();
    console.log(`OrganizedDisplay constructor`)
    this._seisDataList = [];
    if (this.plottype.startsWith(PARTICLE_MOTION)) {
      this._seismographConfig = createParticleMotionConfig();
    } else {
      this._seismographConfig = new SeismographConfig();
    }

    this.seismograph = null;
    this.spectraPlot = null;
    this.particleMotionPlot = null;
    this.extras = new Map();

    const shadow = this.attachShadow({mode: 'open'});
    const wrapper = document.createElement('div');
    wrapper.setAttribute("class", "wrapper");
    const style = shadow.appendChild(document.createElement('style'));
    style.textContent = "";
    shadow.appendChild(wrapper);
  }

  get seisData() {
    return this._seisDataList;
  }
  set seisData(seisData: Array<SeismogramDisplayData>) {
    console.log(`Org Disp seisData setter: ${seisData.length}`)
    this._seisDataList = seisData;
    this.draw();
  }
  get seismographConfig() {
    return this._seismographConfig;
  }
  set seismographConfig(seismographConfig: SeismographConfig) {
    console.log(`Org Disp seismographConfig setter: ${this.seisData.length}`)
    this._seismographConfig = seismographConfig;
    this.draw();
  }

  get plottype(): string {
    let k = this.hasAttribute(PLOT_TYPE) ? this.getAttribute(PLOT_TYPE) : SEISMOGRAPH;
    // typescript null
    if (!k) { k = SEISMOGRAPH;}
    return k;
  }
  set plottype(val: string) {
    this.setAttribute(PLOT_TYPE, val);
    this.draw();
  }
  connectedCallback() {
    this.draw();
  }
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    this.draw();
  }
  setExtra(key: string, value: any) {
    this.extras.set(key, value);
  }

  hasExtra(key: string): boolean {
    return this.extras.has(key);
  }

  getExtra(key: string): any {
    if (this.extras.has(key)) {
      return this.extras.get(key);
    }
    return null;
  }

  draw(): void {
    if ( ! this.isConnected) { return; }

    const wrapper = (this.shadowRoot?.querySelector('div') as HTMLDivElement);

    while (wrapper.firstChild) {
      // @ts-ignore
      wrapper.removeChild(wrapper.lastChild);
    }
    this.plot(d3.select(wrapper));
  }
  plot(divElement: any) {
    let qIndex = this.plottype.indexOf("?");
    let plotstyle = this.plottype;
    let queryParams: object;

    if (qIndex !== -1) {
      queryParams = querystringify.parse(this.plottype.substring(qIndex));
      plotstyle = this.plottype.substring(0, qIndex);
    } else {
      queryParams = {};
    }

    divElement.attr("plottype", plotstyle);

console.log(`OrganizedDisplay plot: ${plotstyle}  ${this.seisData.length}`)
    if (this.plottype.startsWith(SEISMOGRAPH)) {
      if (this.seismograph === null ) {
        console.log(`create seismograph via createElement`)
        this.seismograph = document.createElement(SEISMOGRAPH_ELEMENT) as Seismograph;
      }
      this.seismograph.seismographConfig = this._seismographConfig;
      this.seismograph.seisData = this.seisData;
      //this.seismograph.appendSeisData(this.seisData);
      divElement.node().appendChild(this.seismograph);
      this.seismograph.draw();
      console.log(`plot time range: ${this.seismograph?.seismographConfig?.linkedTimeScale?.duration}`)
    } else if (this.plottype.startsWith(SPECTRA)) {
      const loglog = getFromQueryParams(queryParams, "loglog", "true");
      let nonContigList = this.seisData.filter(
        sdd => !(sdd.seismogram && sdd.seismogram.isContiguous()),
      );

      if (nonContigList.length > 0) {
        let nonContigMsg =
          "non-contiguous seismograms, skipping: " +
          nonContigList
            .map(sdd =>
              isDef(sdd.seismogram)
                ? `${sdd.codes()} ${sdd.seismogram.segments.length}`
                : "null",
            )
            .join(",");
        divElement.append("p").text(nonContigMsg);
      }

      let fftList = this.seisData.map(sdd => {
        return sdd.seismogram && sdd.seismogram.isContiguous()
          ? fftForward(sdd)
          : null;
      });
      let fftListNoNull = fftList.filter(isDef);
      let spectraPlot = document.createElement("spectra-plot") as spectraplot.SpectraPlot;
      spectraPlot.seismographConfig = this._seismographConfig;
      spectraPlot.setAttribute(spectraplot.LOGFREQ, loglog);
      divElement.node().appendChild(spectraPlot);
    } else if (this.plottype.startsWith(PARTICLE_MOTION)) {
      if (this.seisData.length !== 2) {
        throw new Error(
          `particle motion requies exactly 2 seisData in seisDataList, ${this.seisData.length}`,
        );
      }

      let pmpSeisConfig = this._seismographConfig.clone();
      this.particleMotionPlot = new ParticleMotion(
        divElement,
        pmpSeisConfig,
        this.seisData[0],
        this.seisData[1],
      );
      this.particleMotionPlot.draw();
    } else if (this.plottype.startsWith(MAP)) {
      const mapid =
        "map" + (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      divElement.classed("map", true).attr("id", mapid);
      const centerLat = parseFloat(
        getFromQueryParams(queryParams, "centerLat", "35"),
      );
      const centerLon = parseFloat(
        getFromQueryParams(queryParams, "centerLat", "-100"),
      );
      const mapZoomLevel = parseInt(
        getFromQueryParams(queryParams, "zoom", "1"),
      );
      const magScale = parseFloat(
        getFromQueryParams(queryParams, "magScale", "5.0"),
      );
      const mymap = L.map(mapid).setView([centerLat, centerLon], mapZoomLevel);
      L.tileLayer(
        "http://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 17,
          attribution:
            'Map data: <a href="https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer">Esri, Garmin, GEBCO, NOAA NGDC, and other contributors</a>)',
        },
      ).addTo(mymap);
      uniqueQuakes(this.seisData).forEach(q => {
        let circle = leafletutil.createQuakeMarker(q, magScale);
        circle.addTo(mymap);
      });
      uniqueStations(this.seisData).forEach(s => {
        let m = leafletutil.createStationMarker(s);
        m.addTo(mymap);
      });
    } else if (this.plottype.startsWith(INFO)) {
      let infoTemplate = defaultInfoTemplate;

      if (this.getExtra("infoTemplate")) {
        infoTemplate = this.getExtra("infoTemplate");
      }

      stationInfoPlot(divElement, this._seismographConfig, this.seisData, infoTemplate);
    } else {
      throw new Error(`Unkown plottype "${this.plottype}"`);
    }
  }
}

customElements.define('organized-display', OrganizedDisplay);

export function getFromQueryParams(
  qParams: any,
  name: string,
  defaultValue: string = "",
): string {
  if (name in qParams) {
    if (isStringArg(qParams[name])) {
      return qParams[name];
    } else {
      throw new Error(`param ${name} exists but is not string: ${stringify(qParams[name])}`);
    }
  }

  return defaultValue;
}
export function individualDisplay(
  sddList: Array<SeismogramDisplayData>,
): Array<OrganizedDisplay> {
  return sddList.map(sdd => {
    const odisp = new OrganizedDisplay();
    odisp.seisData = [ sdd ];
    return odisp;
  });
}
export function mapAndIndividualDisplay(
  sddList: Array<SeismogramDisplayData>,
): Array<OrganizedDisplay> {
  let map = new OrganizedDisplay();
  map.seisData = sddList;
  map.plottype = MAP;
  let individual = individualDisplay(sddList);
  individual.unshift(map);
  return individual;
}
export function overlayBySDDFunction(
  sddList: Array<SeismogramDisplayData>,
  key: string,
  sddFun: (arg0: SeismogramDisplayData) => string | number | null,
): Array<OrganizedDisplay> {
  let out: Array<OrganizedDisplay> = [];
  sddList.forEach(sdd => {
    let found = false;
    const val = sddFun(sdd);

    if (!isDef(val)) {
      // do not add/skip sdd that sddFun returns null
      return;
    }

    out.forEach(org => {
      if (org.getExtra(key) === val) {
        org.seisData.push(sdd);
        found = true;
      }
    });

    if (!found) {
      const org = new OrganizedDisplay();
      org.seisData = [ sdd ];
      org.setExtra(key, val);
      out.push(org);
    }
  });
  return sortByKey(out, key);
}
export function overlayByComponent(
  sddList: Array<SeismogramDisplayData>,
): Array<OrganizedDisplay> {
  return overlayBySDDFunction(sddList, "component", sdd =>
    sdd.channelCode.charAt(2),
  );
}
export function overlayByStation(
  sddList: Array<SeismogramDisplayData>,
): Array<OrganizedDisplay> {
  return overlayBySDDFunction(
    sddList,
    "station",
    sdd => sdd.networkCode + "_" + sdd.stationCode,
  );
}
export function overlayAll(
  sddList: Array<SeismogramDisplayData>,
): Array<OrganizedDisplay> {
  return overlayBySDDFunction(sddList, "all", () => "all");
}
export function sortByKey(
  organized: Array<OrganizedDisplay>,
  key: string,
): Array<OrganizedDisplay> {
  organized.sort((orgA, orgB) => {
    const valA = orgA.getExtra(key);
    const valB = orgB.getExtra(key);

    if (!valA && !valB) {
      return 0;
    } else if (!valA) {
      return 1;
    } else if (!valB) {
      return -1;
    } else if (valA < valB) {
      return -1;
    } else if (valA > valB) {
      return 1;
    } else {
      return 0;
    }
  });
  return organized;
}

/**
 * Groups seismic data into subarrays where members of each subarray are
 * from the same network/station, have the same band and gain/instrument code
 * and overlap in time. Note, in most cases the subarrays will have
 * 1, 2 or 3 elements, but this is not checked nor guaranteed.
 *
 * @param   sddList list of SeismogramDisplayData to split
 * @returns          array of array of data, organized by component of motion
 */
export function groupComponentOfMotion(
  sddList: Array<SeismogramDisplayData>,
): Array<Array<SeismogramDisplayData>> {
  let tmpSeisDataList = Array.from(sddList);

  const bifurcate = (arr: Array<SeismogramDisplayData>, filter: (arg0: SeismogramDisplayData) => boolean) =>
    arr.reduce((acc: Array<Array<SeismogramDisplayData>>, val: SeismogramDisplayData) => (acc[filter(val) ? 0 : 1].push(val), acc), [
      [],
      [],
    ]);

  const byFriends = [];
  let first=tmpSeisDataList.shift();
  while (isDef(first)) {

    const isFriend = (sdddB: SeismogramDisplayData) =>
      isDef(first) && /* dumb, typescript */
      first.networkCode === sdddB.networkCode &&
      first.stationCode === sdddB.stationCode &&
      first.locationCode === sdddB.locationCode &&
      first.channelCode.slice(0, 2) === sdddB.channelCode.slice(0, 2) &&
      first.timeRange.overlaps(sdddB.timeRange);

    const splitArray = bifurcate(tmpSeisDataList, isFriend);
    let nextGroup = splitArray[0];
    nextGroup.unshift(first);
    byFriends.push(nextGroup);
    tmpSeisDataList = splitArray[1];
    first=tmpSeisDataList.shift()
  }

  return byFriends;
}
export function createAttribute(
  organized: Array<OrganizedDisplay>,
  key: string,
  valueFun: (arg0: OrganizedDisplay) => string | number | null,
): Array<OrganizedDisplay> {
  organized.forEach(org => {
    if (org.seisData.length > 0) {
      const v = valueFun(org);
      org.setExtra(key, v);
    } else {
      org.setExtra(key, null);
    }
  });
  return organized;
}
export function sortDistance(
  organized: Array<OrganizedDisplay>,
): Array<OrganizedDisplay> {
  const key = "distance";
  createAttribute(organized, key, attributeDistance);
  return sortByKey(organized, key);
}
export function attributeDistance(orgDisp: OrganizedDisplay): number | null {
  let out = Number.MAX_VALUE;
  orgDisp.seisData.forEach(sdd => {
    if (sdd.hasQuake && sdd.hasChannel) {
      const distaz = sdd.distaz;
      out = distaz ? Math.min(out,distaz.delta) : out;
    }
  });
  return out;
}
export function createPlots(
  organized: Array<OrganizedDisplay>,
  divElement: any,
) {
  // arrow function doesn't work well with d3.select(this)
  divElement
    .selectAll("div")
    .data(organized)
    .enter()
    .append("div")
    .each(function (org: any) {
      // @ts-ignore
      const div = d3.select(this);
      org.plot(div);
    });
}
export const defaultInfoTemplate = `
  <table>
    <tr>
      <th colspan="7">Waveform</th>
      <th colspan="4">Channel</th>
      <th colspan="5">Event</th>
      <th colspan="4">DistAz</th>
    </tr>
    <tr>
      <th>Codes</th>
      <th>Start</th>
      <th>Duration</th>
      <th>End</th>
      <th>Num Pts</th>
      <th>Sample Rate</th>
      <th>Seg</th>

      <th>Lat</th>
      <th>Lon</th>
      <th>Elev</th>
      <th>Depth</th>

      <th>Time</th>
      <th>Lat</th>
      <th>Lon</th>
      <th>Mag</th>
      <th>Depth</th>

      <th>Dist deg</th>
      <th>Dist km</th>
      <th>Azimuth</th>
      <th>Back Azimuth</th>
    </tr>
  {{#each seisDataList as |sdd|}}
    <tr>
      <td>{{sdd.nslc}}</td>
      <td>{{formatIsoDate sdd.seismogram.startTime}}</td>
      <td>{{formatDuration sdd.seismogram.timeRange.duration}}</td>
      <td>{{formatIsoDate sdd.seismogram.endTime}}</td>
      <td>{{sdd.seismogram.numPoints}}</td>
      <td>{{sdd.seismogram.sampleRate}}</td>
      <td>{{sdd.seismogram.segments.length}}</td>

      {{#if sdd.hasChannel}}
        <td>{{sdd.channel.latitude}}</td>
        <td>{{sdd.channel.longitude}}</td>
        <td>{{sdd.channel.elevation}}</td>
        <td>{{sdd.channel.depth}}</td>
      {{else}}
        <td>no channel</td>
        <td/>
        <td/>
        <td/>
      {{/if}}

      {{#if sdd.hasQuake}}
        <td>{{formatIsoDate sdd.quake.time}}</td>
        <td>{{sdd.quake.latitude}}</td>
        <td>{{sdd.quake.longitude}}</td>
        <td>{{sdd.quake.magnitude.mag}} {{sdd.quake.magnitude.type}}</td>
        <td>{{sdd.quake.depthKm}}</td>
      {{else}}
        <td>no quake</td>
        <td/>
        <td/>
        <td/>
        <td/>
      {{/if}}
      {{#if sdd.hasQuake }}
        {{#if sdd.hasChannel }}
          <td>{{formatNumber sdd.distaz.distanceDeg 2}}</td>
          <td>{{formatNumber sdd.distaz.distanceKm 0}}</td>
          <td>{{formatNumber sdd.distaz.az 2}}</td>
          <td>{{formatNumber sdd.distaz.baz 2}}</td>
        {{/if}}
      {{/if}}
    </tr>
  {{/each}}
  </table>
`;
export function stationInfoPlot(
  divElement: any,
  seismographConfig: SeismographConfig,
  seisDataList: Array<SeismogramDisplayData>,
  handlebarsTemplate: string,
) {
  if (!handlebarsTemplate) {
    handlebarsTemplate = defaultInfoTemplate;
  }

  let handlebarsCompiled = Handlebars.compile(handlebarsTemplate);
  divElement.html(
    handlebarsCompiled(
      {
        seisDataList: seisDataList,
        seisConfig: seismographConfig,
      },
      {
        allowProtoPropertiesByDefault: true, // this might be a security issue???
      },
    ),
  );
}
