export type WeatherResponse = {
    coord: {
        lon: number;
        lat: number;
    };
    weather: WeatherData[];
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    visibility: number;
    wind: {
        speed: number;
        deg: number;
        gust: number;
    };
    clouds: {
        all: number;
    };
    rain?: {
        '1h': number;
        '3h': number;
    };
    snow?: {
        '1h': number;
        '3h': number;
    };
}

export interface WeatherData {
    id: number;
    main: string;
    description: string;
}
