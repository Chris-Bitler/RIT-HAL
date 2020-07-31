import axios, {AxiosInstance} from "axios";
import {ArrivalResponseContainer, BusRoute, BusRoutes, ArrivalTimes, Stop} from "../types/Bus";
import * as moment from "moment";

let routes: BusRoutes = {};
const AGENCY_ID = 643; // TODO: Make config changeable
const instance: AxiosInstance = axios.create({
    baseURL: "https://transloc-api-1-2.p.rapidapi.com",
    headers: {
        "x-rapidapi-host": "transloc-api-1-2.p.rapidapi.com",
        "x-rapidapi-key": process.env.rapidapi_token,
    }
});

export async function refreshInformation() {
    routes = await fetchRoutes();
    await updateStops(routes);
}

async function fetchRoutes(): Promise<BusRoutes> {
    const response = (await instance.get("/routes.json", {
        params: {
            agencies: AGENCY_ID
        }
    })).data;
    return transformRoutes(response.data[AGENCY_ID]);
}

async function updateStops(routes: BusRoutes) {
    const stopsResponse = (await instance.get("/stops.json", {
        params: {
            agencies: AGENCY_ID
        }
    })).data;
    const stops: Stop[] = stopsResponse.data;
    stops.forEach(stop => {
        stop.routes && stop.routes.forEach(route => {
            if(routes[route]) {
                routes[route].stops[stop.stop_id] = stop;
            }
        });
    });
}

export async function getArrivalTimes(route: BusRoute): Promise<ArrivalTimes> {
    const stopInformation: ArrivalTimes = {};
    const response = (await instance.get("/arrival-estimates.json", {
        params: {
            agencies: AGENCY_ID,
            routes: route.route_id
        }
    })).data;
    const arrivals: ArrivalResponseContainer[] = response.data.data;
    arrivals.forEach(arrival => {
        const stopName = routes[route.route_id].stops[arrival.stop_id].name;
        if (!stopInformation[stopName]) {
            stopInformation[stopName] = [];
        }
        arrival.arrivals.forEach(arrivalTime => {
            stopInformation[stopName].push({
                time: moment(arrivalTime.arrival_at).toNow(true)
            });
        });
    });

    return stopInformation;
}

export function getRouteByName(name: string): BusRoute|null {
    const matchedRoutes = Object.values(routes)
        .filter(route => route.long_name.toLowerCase() === name.toLowerCase());
    return matchedRoutes ? matchedRoutes[0] : null;
}

export function getRouteByNumber(number: number): BusRoute|null {
    const filteredRoutes = Object.values(routes)
        .filter(route => route.is_active);
    return number-1 < filteredRoutes.length ? filteredRoutes[number-1] : null;
}

export function getActiveRoutes(): BusRoute[] {
    return Object.values(routes).filter(route => route.is_active);
}

function transformRoutes(routes: BusRoute[]): BusRoutes {
    const routeObj: BusRoutes = {};
    routes.forEach((route: BusRoute) => {
        routeObj[route.route_id] = route;
        routeObj[route.route_id].stops = {};
    });

    return routeObj;
}