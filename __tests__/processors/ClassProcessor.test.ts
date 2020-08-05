import axios from "axios";
import { Course } from "../../src/types/Courses";
import { getClasses } from "../../src/processors/ClassProcessor";
describe("ClassProcessor tests", () => {
    let mockPost: jest.MockedFunction<typeof axios.post>;
    beforeEach(() => {
        mockPost = axios.post as jest.MockedFunction<typeof axios.post>;
    });
    test("should return classes found", async () => {
        const courses: Course[] = [
            {
                courseTitleLong: "Test Course",
                courseDescription: "Test description",
                classSection: "1",
                enrollmentStatus: "Open",
                minimumUnits: 0,
                instructorFullName: "Test Prof",
                instructorEmail: "test@rit.edu",
                enrollmentTotal: 4,
                enrollmentCap: 6,
                waitTotal: 0,
                waitCap: 6
            },
            {
                courseTitleLong: "Test Course 2",
                courseDescription: "Test description 2",
                classSection: "2",
                enrollmentStatus: "Waitlist",
                minimumUnits: 5,
                instructorFullName: "Test Prof",
                instructorEmail: "test@rit.edu",
                enrollmentTotal: 10,
                enrollmentCap: 10,
                waitTotal: 1,
                waitCap: 6
            }
        ];
        mockPost.mockResolvedValue({
            data: {
                found: true,
                searchResults: courses
            }
        });
        const retrievedCourses = await getClasses("CSCI", "131", "1");
        expect(retrievedCourses).toEqual(courses);
        expect(mockPost).toHaveBeenCalledWith(
            "https://tigercenter.rit.edu/tigerCenterApp/tc/class-search",
            {
                searchParams: {
                    query: "CSCI 131 1",
                    term: "2201",
                    isAdvanced: false,
                    courseAttributeOptions: [],
                    courseAttributeOptionsPassed: []
                }
            }
        );
    });
    test("should return empty array if no classes found", async () => {
        mockPost.mockResolvedValue({
            data: {
                found: false,
                searchResults: []
            }
        });
        const retrievedCourses = await getClasses("CSCI", "131");
        expect(retrievedCourses).toEqual([]);
        expect(mockPost).toHaveBeenCalledWith(
            "https://tigercenter.rit.edu/tigerCenterApp/tc/class-search",
            {
                searchParams: {
                    query: "CSCI 131 1",
                    term: "2201",
                    isAdvanced: false,
                    courseAttributeOptions: [],
                    courseAttributeOptionsPassed: []
                }
            }
        );
    });
});
