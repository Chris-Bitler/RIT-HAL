import { getClasses } from "../../src/processors/ClassProcessor";
import { Course } from "../../src/types/Courses";
import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { Courses } from "../../src/commands/Courses";
import {getErrorEmbed} from "../../src/utils/EmbedUtil";

jest.mock("../../src/processors/ClassProcessor");
describe("Courses command tests", () => {
    let client: Client;
    let message: Message;
    let channel: TextChannel;
    let mockGetClasses: jest.MockedFunction<typeof getClasses>;
    let mockSend: jest.MockedFunction<typeof channel.send>;
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        client = new Client();
        message = new MockDiscord.Message();
        channel = new MockDiscord.TextChannel();
        message.channel = channel;
        mockSend = channel.send as jest.MockedFunction<typeof channel.send>;
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
        mockGetClasses = getClasses as jest.MockedFunction<typeof getClasses>;
        mockGetClasses.mockResolvedValue(courses);
        Date.now = jest.fn();
        (Date.now as jest.MockedFunction<typeof Date.now>).mockReturnValue(1);
    });

    afterAll(() => {
        client.destroy();
    });

    test("should send courses embeds without section", async () => {
        const courses = new Courses();
        await courses.useCommand(client, message, ["CSCI", "131"]);
        const firstEmbed: MessageEmbed = mockSend.mock.calls[0][0];
        const secondEmbed: MessageEmbed = mockSend.mock.calls[1][0];
        const firstExpectedFields = [
            { name: "Section", value: "1" },
            { name: "Status", value: "Open" },
            { name: "Units", value: "0" },
            { name: "Professor", value: "Test Prof\ntest@rit.edu" },
            { name: "Enrollment", value: "4/6" }
        ];
        const secondExpectedFields = [
            { name: "Section", value: "2" },
            { name: "Status", value: "Waitlist" },
            { name: "Units", value: "5" },
            { name: "Professor", value: "Test Prof\ntest@rit.edu" },
            { name: "Enrollment", value: "10/10" },
            { name: "Waitlist", value: "1/6" }
        ];
        expect(firstEmbed.title).toEqual("Test Course");
        expect(firstEmbed.description).toEqual("Test description");
        firstExpectedFields.forEach((expectedField: any, index: number) => {
            expect(firstEmbed.fields[index].name).toEqual(expectedField.name);
            expect(firstEmbed.fields[index].value).toEqual(expectedField.value);
        });
        expect(secondEmbed.title).toEqual("Test Course 2");
        expect(secondEmbed.description).toEqual("Test description 2");
        secondExpectedFields.forEach((expectedField: any, index: number) => {
            expect(secondEmbed.fields[index].name).toEqual(expectedField.name);
            expect(secondEmbed.fields[index].value).toEqual(
                expectedField.value
            );
        });
    });

    test("should send courses embeds with section", async () => {
        const courses = new Courses();
        await courses.useCommand(client, message, ["CSCI", "131", "1"]);
        const firstEmbed: MessageEmbed = mockSend.mock.calls[0][0];
        const secondEmbed: MessageEmbed = mockSend.mock.calls[1][0];
        const firstExpectedFields = [
            { name: "Section", value: "1" },
            { name: "Status", value: "Open" },
            { name: "Units", value: "0" },
            { name: "Professor", value: "Test Prof\ntest@rit.edu" },
            { name: "Enrollment", value: "4/6" }
        ];
        const secondExpectedFields = [
            { name: "Section", value: "2" },
            { name: "Status", value: "Waitlist" },
            { name: "Units", value: "5" },
            { name: "Professor", value: "Test Prof\ntest@rit.edu" },
            { name: "Enrollment", value: "10/10" },
            { name: "Waitlist", value: "1/6" }
        ];
        expect(firstEmbed.title).toEqual("Test Course");
        expect(firstEmbed.description).toEqual("Test description");
        firstExpectedFields.forEach((expectedField: any, index: number) => {
            expect(firstEmbed.fields[index].name).toEqual(expectedField.name);
            expect(firstEmbed.fields[index].value).toEqual(expectedField.value);
        });
        expect(secondEmbed.title).toEqual("Test Course 2");
        expect(secondEmbed.description).toEqual("Test description 2");
        secondExpectedFields.forEach((expectedField: any, index: number) => {
            expect(secondEmbed.fields[index].name).toEqual(expectedField.name);
            expect(secondEmbed.fields[index].value).toEqual(
                expectedField.value
            );
        });
    });

    test("useCommand without enough args should send error message", async () => {
        const courses = new Courses();
        await courses.useCommand(client, message, []);
        expect(mockSend).toHaveBeenCalledWith(
            getErrorEmbed("Incorrect Syntax. Try `-courses [major abbreviation] [course number] (section)`")
        );
    });

    test("getCommand should return courses", () => {
        expect(new Courses().getCommand()).toEqual("courses");
    });

    test("getConfigBase should return courses", () => {
        expect(new Courses().getConfigBase()).toEqual("courses");
    });
});
