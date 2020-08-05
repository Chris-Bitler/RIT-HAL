import { mergeArgs, removeEmptyArgs } from "../../src/utils/StringUtil";

describe("String util tests", () => {
    test("merge args starting at 0", () => {
        expect(mergeArgs(0, ["1", "2", "3"])).toEqual("1 2 3");
    });
    test("merge args starting at 1", () => {
        expect(mergeArgs(1, ["1", "2", "3"])).toEqual("2 3");
    });

    test("should remove empty string args from array", () => {
        expect(removeEmptyArgs(["1", "2", "", "3"])).toEqual(["1", "2", "3"]);
    });
});
