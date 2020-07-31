// https://rapidapi.com/transloc/api/openapi-1-2?endpoint=53aa596ae4b0f2c975470c11
// TODO: Figure out how to clean up this
export interface BusRoute {
    is_active: boolean;
    long_name: string;
    route_id: string;
    stops: StopList;
}

export interface ArrivalTimes {
    [key: string]: ArrivalTime[]
}

export interface ArrivalTime {
    time: any;
}

export interface ArrivalResponseContainer {
    arrivals: Arrival[];
    stop_id: string;
}

export interface Arrival {
    route_id: string;
    arrival_at: string;
}

export interface BusRoutes {
    [key: string]: BusRoute
}

export interface Stop {
    routes: string[];
    stop_id: string;
    name: string;
}

export interface StopList {
    [key: string]: Stop
}