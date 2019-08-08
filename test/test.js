let WeatherFactory  = require('../src/lib/WeatherFactory');

const weather = WeatherFactory.fromProvider('acis');

let stationsPromise = weather.getStations();
stationsPromise.then((response) => {
  // console.log(response);
  weather.updateStations('c:/dev/sources/nee_weather/src/db/spatial.sqlite', response);
});
// console.log(weather);
// let stations = weather.getStations();
// console.log(stations);
// console.log(acis);
// console.log(WeatherFactory);

var url = "http://data.rcc-acis.org/GridData",
  params = {
    loc: "-80.3466176, 25.7674132",
    sdate: "2019-07-21",
    edate: "2019-07-26",
    grid: "3",
    elems: [{
      name: "mint",
      interval: "dly",
      duration: "dly"
    },{
      name: "maxt",
      interval: "dly",
      duration: "dly"
    }]
  };
postResults(url, params);