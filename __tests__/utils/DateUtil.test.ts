import { parseModDateString } from "../../src/utils/DateUtil";

describe("Date util tests", () => {
  const testCases = [
    { dateString: "1 year", time: 32140800000 },
    { dateString: "3 months", time: 8035200000 },
    { dateString: "5 days", time: 432000000 },
    { dateString: "1 hour", time: 3600000 },
    { dateString: "30 minutes", time: 1800000 },
    { dateString: "10 seconds", time: 10000 },
    { dateString: "1 year 1 month 5 seconds", time: 34819205000 },
    { dateString: "1 second", time: 10000 },
  ];
  testCases.forEach((testCase) => {
    test(testCase.dateString, () => {
      const time = parseModDateString(testCase.dateString);
      expect(time).toEqual(testCase.time);
    });
  });
});
