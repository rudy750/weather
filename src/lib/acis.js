import axios from 'axios';
import moment from 'moment';
import sqlite3 from 'spatialite';
// import sqlite3 from 'sqlite3';

const ACIS_META_URL = 'http://data.rcc-acis.org/StnMeta';
const defaultBody = {
  state: ['FL'],
  elems: [
    'maxt',
    'mint'
  ],
  sdate: moment().subtract(3, 'days').format('YYYY-MM-DD'),
  edate: moment().format('YYYY-MM-DD'),
  meta: [
    'sids',
    'uid',
    'name',
    'state',
    'valid_daterange',
    'll'
  ]
};

const defaultConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  proxy: {
    host: 'webproxy.fpl.com',
    port: 8080
  }
};

class Acis {

  config = defaultConfig;

  constructor(config) {
    this.config = config ? config : defaultConfig;
  }

  /**
   * Return all stations for the passed payload.
   * @param payload If payload is null, return only all the stations in Florida.
   * @param config The configuration object.
   * @returns {Promise<*|string|T>}
   */
  async getStations(payload, config) {
    console.log('Here');
    try {
      const body = payload ? payload : defaultBody;
      const cfg = config ? config : defaultConfig;
      const response = await axios.post(ACIS_META_URL, body, cfg);
      // console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
      return (error && error.message) || 'An error has occurred';
    }
  }

  updateStations(dbPath, stations, tableName) {
    let db = new sqlite3.Database(dbPath);
    try {
      const tblName = tableName ? tableName : 'station';
      this.clearStations(dbPath, tblName);
      stations.meta.forEach(function (station) {
        const uid = station.uid;
        const sid = station.sid;
        const name = station.name;
        const state = station.state;
        if (station.ll) {
          const lng = station.ll[0];
          const lat = station.ll[1];
          const query = `INSERT INTO ${tblName}(uid, sid, name, state, lat, lng, Geometry) 
                         VALUES(${uid}, '${sid}', '${name}', '${state}', ${lat}, ${lng}, 
                                GeomFromText('POINT(${lng} ${lat})', 4326))`;
          db.spatialite(function (err) {
            db.run(query, [], function (err) {
              if (err) {
                return console.log(err.message);
              }
              // get the last insert id
              console.log(`A row has been inserted with rowid ${this.lastID}`);
            });
          });
        }
      });
    } finally {
      db.close();
    }
  }

  clearStations(dbPath, tableName) {
    let db = new sqlite3.Database(dbPath);
    try {
      const deleteQuery = `DELETE FROM ${tableName}`;
      db.spatialite(function (err) {
        //We clear the station table
        db.run(deleteQuery, [], function (err) {
          if (err) {
            return console.log(err.message);
          }
          console.log(`Cleared the table: ${tableName}`);
        });
      });
    } finally {
      db.close();
    }
  }

  findNearestStation(dbPath, tableName, lanLng) {
    let db = new sqlite3.Database(dbPath);
    try {
      const query = `SELECT uid, name, state, lat, lng, 
                            ST_Distance(MakePoint(${lanLng.lat} , ${lanLng.lng}, 4326), station.Geometry) As distance
                     FROM ${tableName}
                     ORDER BY distance Limit 1`;
      db.spatialite(function (err) {
        //We clear the station table
        // first row only
        db.get(query, [], (err, row) => {
          if (err) {
            return console.error(err.message);
          }
          return row
            ? console.log(row.id, row.name)
            : console.log(`No near station or the table is empty.`);
        });
      });
    } finally {
      db.close();
    }
  }
}

//Get values per station.
var url = "http://data.rcc-acis.org/StnData",
  params = {
    sid: "086657",
    sdate: "2019-07-20",
    edate: "2019-07-24",
    elems: [{
      name: "maxt",
      interval: [0, 0, 1],
      duration: "dly"
    },
      {
        name: "mint",
        interval: [0, 0, 1],
        duration: "dly"
      }],
    meta: []
  };
postResults(url, params);

module.exports = Acis;