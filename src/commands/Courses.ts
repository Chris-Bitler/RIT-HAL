import { Command } from "./Command";
import { Client, Message, MessageEmbed } from "discord.js";
import { getClasses } from "../processors/ClassProcessor";
import { Course } from "../types/Courses";
import { getErrorEmbed } from "../utils/EmbedUtil";

/**
 * Command to get information on courses from tigercenter's api
 */
export class Courses extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (args.length < 2) {
            evt.channel.send(
                getErrorEmbed(
                    "Incorrect Syntax. Try `-courses [major abbreviation] [course number] (section)`"
                )
            );
            return;
        }

        const courses: Course[] = await getClasses(
            args[0],
            args[1],
            args.length > 2 ? args[2] : ""
        );
        courses.forEach((course) => {
            evt.channel.send(this.getEmbed(course));
        });
    }

    getCommand(): string[] {
        return ["courses"];
    }

    /**
     * Get an embed to show course information
     * @param course The course to show information on
     */
    getEmbed(course: Course): MessageEmbed {
        const embed: MessageEmbed = new MessageEmbed()
            .setTitle(course.courseTitleLong)
            .setDescription(course.courseDescription);
        embed.addField("Section", course.classSection);
        embed.addField("Status", course.enrollmentStatus);
        embed.addField("Units", course.minimumUnits);
        embed.addField(
            "Professor",
            `${course.instructorFullName}\n${course.instructorEmail}`
        );
        embed.addField(
            "Enrollment",
            `${course.enrollmentTotal}/${course.enrollmentCap}`
        );
        if (course.enrollmentStatus === "Waitlist") {
            embed.addField("Waitlist", `${course.waitTotal}/${course.waitCap}`);
        }

        return embed;
    }

    getConfigBase(): string {
        return "courses";
    }
}
