/**
 * This file is part of RIT-HAL.
 *
 * RIT-HAL is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * RIT-HAL is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with RIT-HAL.  If not, see <https://www.gnu.org/licenses/>.
 */
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