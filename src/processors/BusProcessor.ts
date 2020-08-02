import axios, {AxiosInstance} from "axios";
import {ArrivalResponseContainer, BusRoute, BusRoutes, ArrivalTimes, Stop} from "../types/Bus";
import * as moment from "moment";

const AGENCY_ID = 643; // TODO: Make config changeable
const axiosInstance: AxiosInstance = axios.create({
    baseURL: "https://transloc-api-1-2.p.rapidapi.com",
    headers: {
        "x-rapidapi-host": "transloc-api-1-2.p.rapidapi.com",
        "x-rapidapi-key": process.env.rapidapi_token,
    }
});

export class BusProcessor {
    routes: BusRoutes = {};
    static instance: BusProcessor;

    public static getInstance(): BusProcessor {
        if (!BusProcessor.instance) {
            BusProcessor.instance  = new BusProcessor();
        }

        return BusProcessor.instance;
    }

    async refreshInformation() {
        this.routes = await this.fetchRoutes();
        await this.updateStops(this.routes);
    }

    async fetchRoutes(): Promise<BusRoutes> {
        const response = (await axiosInstance.get("/routes.json", {
            params: {
                agencies: AGENCY_ID
            }
        })).data;
        return this.transformRoutes(response.data[AGENCY_ID]);
    }

    async updateStops(routes: BusRoutes) {
        const stopsResponse = (await axiosInstance.get("/stops.json", {
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

    async getArrivalTimes(route: BusRoute): Promise<ArrivalTimes> {
        const stopInformation: ArrivalTimes = {};
        const response = (await axiosInstance.get("/arrival-estimates.json", {
            params: {
                agencies: AGENCY_ID,
                routes: route.route_id
            }
        })).data;
        const arrivals: ArrivalResponseContainer[] = response.data;
        arrivals.forEach(arrival => {
            const stopName = this.routes[route.route_id].stops[arrival.stop_id].name;
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

    getRouteByName(name: string): BusRoute|null {
        const matchedRoutes = Object.values(this.routes)
            .filter(route => route.long_name.toLowerCase() === name.toLowerCase());
        return matchedRoutes.length > 0 ? matchedRoutes[0] : null;
    }

    getRouteByNumber(number: number): BusRoute|null {
        const filteredRoutes = Object.values(this.routes)
            .filter(route => route.is_active);
        return number-1 < filteredRoutes.length ? filteredRoutes[number-1] : null;
    }

    getActiveRoutes(): BusRoute[] {
        return Object.values(this.routes).filter(route => route.is_active);
    }

    transformRoutes(routes: BusRoute[]): BusRoutes {
        const routeObj: BusRoutes = {};
        routes.forEach((route: BusRoute) => {
            routeObj[route.route_id] = route;
            routeObj[route.route_id].stops = {};
        });

        return routeObj;
    }
}