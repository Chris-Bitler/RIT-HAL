export interface FoodPlace {
    name: string;
    sections: PlaceSection[];
}

export interface PlaceSection {
    header: string;
    day: string;
    times: string;
}

export interface PlaceMenu {
    name: string;
    breakfast?: MenuItem[];
    lunch?: MenuItem[];
    dinner?: MenuItem[];
}

export interface MenuItem {
    category: string;
    items: string[];
}

export interface DailyPostInfo {
    lastTime?: number;
    channel?: string;
    enabled?: boolean;
}