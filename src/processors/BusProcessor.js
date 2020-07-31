const axios = require("axios");
const moment = require("moment");
const Env = require("../utils/Env");

let routes = {};
const AGENCY_ID = "643";
let instance;

function refreshInformation() {
    instance = axios.create({
        baseURL: "https://transloc-api-1-2.p.rapidapi.com",
        headers: {
            "x-rapidapi-host": "transloc-api-1-2.p.rapidapi.com",
            "x-rapidapi-key": Env.getEnvVariable("rapidapi_token")
        }
    });
    instance.get("/routes.json", {
        params: {
            agencies: AGENCY_ID
        }
    }).then(response => {
        const responseData = response.data;
        routes = transformRoutes(responseData.data[AGENCY_ID]);
        instance.get("/stops.json", {
            params: {
                agencies: AGENCY_ID
            }
        }).then(response => {
            const stops = response.data.data;
            stops.forEach(stop => {
                stop.routes && stop.routes.forEach(route => {
                    if(routes[route]) {
                        routes[route].stops[stop.stop_id] = stop;
                    }
                });
            });
        }).catch(console.log)
    }).catch(console.log);
}

function getArrivalTimes(route) {
    return new Promise((resolve, reject) => {
        const stopInformation = {};
        instance.get("/arrival-estimates.json", {
            params: {
                agencies: AGENCY_ID,
                routes: route.route_id
            }
        }).then(response => {
            const arrivals = response.data.data;
            arrivals.forEach(arrival => {
                const stopName = routes[route.route_id].stops[arrival.stop_id].name;
                if(!stopInformation[stopName]) {
                    stopInformation[stopName] = [];
                }

                arrival.arrivals.forEach(arrivalTime => {
                    stopInformation[stopName].push({
                        time: moment(arrivalTime.arrival_at).toNow(true)
                    });
                });
            });

            resolve(stopInformation);
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    });
}

function getRouteByName(name) {
    const matchedRoutes = Object.values(routes).filter(route => route.long_name.toLowerCase() === name.toLowerCase());
    return matchedRoutes ? matchedRoutes[0] : null;
}

function getRouteByNumber(number) {
    const filteredRoutes = Object.values(routes).filter(route => route.is_active);
    return number-1 < filteredRoutes.length ? filteredRoutes[number-1] : null;
}

function getActiveRoutes() {
    console.log(routes);
    return Object.values(routes).filter(route => route.is_active);
}

function transformRoutes(routes) {
    const routeObj = {};
    routes.forEach(route => {
        routeObj[route.route_id] = route;
        routeObj[route.route_id].stops = {};
    });

    return routeObj;
}

module.exports = {
    refreshInformation,
    getActiveRoutes,
    getArrivalTimes,
    getRouteByName,
    getRouteByNumber
};