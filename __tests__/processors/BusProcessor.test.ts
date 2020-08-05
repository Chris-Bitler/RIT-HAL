// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { when } from "jest-when";
import axios from "axios";
import {
  Arrival,
  ArrivalResponseContainer,
  BusRoute,
  Stop,
} from "../../src/types/Bus";
import { BusProcessor } from "../../src/processors/BusProcessor";
describe("Bus Processor tests", () => {
  let busProcessor: BusProcessor;
  beforeEach(() => {
    delete BusProcessor.instance;
    busProcessor = BusProcessor.getInstance();
    process.env.rapidapi_token = "12345";
    const mockGet = axios.get as jest.MockedFunction<typeof axios.get>;
    const route: BusRoute = {
      route_id: "1",
      is_active: true,
      long_name: "test route",
      stops: {},
    };
    const stop: Stop = {
      routes: ["1"],
      stop_id: "1",
      name: "test stop",
    };
    const arrival: Arrival = {
      route_id: "1",
      arrival_at: "2014-01-03T17:06:33-05:00",
    };
    const arrivalContainer: ArrivalResponseContainer = {
      arrivals: [arrival, arrival],
      stop_id: "1",
    };
    when(mockGet)
      .calledWith("/routes.json")
      .mockResolvedValue({
        data: {
          data: {
            "643": [route],
          },
        },
      });
    when(mockGet)
      .calledWith("/stops.json")
      .mockResolvedValue({
        data: {
          data: [stop],
        },
      });
    when(mockGet)
      .calledWith("/arrival-estimates.json")
      .mockResolvedValue({
        data: {
          data: [arrivalContainer],
        },
      });
  });

  // These are all tested in one place because of how the state is kept
  // in the processor
  test("refreshInformation", async () => {
    // Refresh information
    await busProcessor.refreshInformation();
    expect(axios.get).toHaveBeenCalled();
  });

  describe("route handling functions", () => {
    beforeEach(async () => {
      await busProcessor.refreshInformation();
    });

    test("get valid route by number", () => {
      // Test getting routes
      const route = busProcessor.getRouteByNumber(1) as BusRoute;
      expect(route).not.toBeNull();
      expect(route.route_id).toEqual("1");
      expect(route.stops[1]).not.toBeNull();

      const namedRoute = busProcessor.getRouteByName("test route");
      expect(route).not.toBeNull();
    });

    test("get invalid route by number", () => {
      // Invalid route
      const invalidRoute = busProcessor.getRouteByNumber(2);
      expect(invalidRoute).toBeNull();
    });

    test("get valid named route", () => {
      const namedRoute = busProcessor.getRouteByName("test route");
      expect(namedRoute).not.toBeNull();
    });

    test("get invalid named route", () => {
      const invalidNamedRoute = busProcessor.getRouteByName("test");
      expect(invalidNamedRoute).toBeNull();
    });

    test("get active routes should return active routes", () => {
      expect(busProcessor.getActiveRoutes().length).toBe(1);
    });
  });

  describe("test getArrivalTimes", () => {
    beforeEach(async () => {
      await busProcessor.refreshInformation();
    });

    test("should return arrival times", async () => {
      const route: BusRoute = {
        route_id: "1",
        is_active: true,
        long_name: "test route",
        stops: {},
      };

      const times = await busProcessor.getArrivalTimes(route);
      expect(times["test stop"][0].time).not.toBeNull();
    });
  });

  test("getting singleton instance should create new one", () => {
    const test = BusProcessor.getInstance();
    expect(test).not.toBeNull();
  });
  test("getting singelton instance twice should return same instance", () => {
    const test = BusProcessor.getInstance();
    const test2 = BusProcessor.getInstance();

    expect(test).toEqual(test2);
  });
});
