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

const Command = require("./Command");
const ClassProcessor = require("../processors/ClassProcessor");
const Discord = require("discord.js");

const PROHIBITED_CHANNELS = ["401908664018927628"];

class Courses extends Command {
    useCommand(client, evt, args) {
        if(!PROHIBITED_CHANNELS.includes(evt.channel.id)) {
            if (args.length < 2) {
                evt.channel.send("Incorrect Syntax. Try `-courses [major abbreviation] [course number] (section)`");
                return;
            }

            ClassProcessor.getClasses(args[0], args[1], args.length > 2 ? args[2] : "").then((classes) => {
                classes.forEach((course) => {
                    evt.channel.send(this.getEmbed(course));
                });
            }).catch((error) => {
                console.error(error);
            });
        }
    }

    getCommand() {
        return "courses";
    }

    getEmbed(course) {
        let embed = new Discord.MessageEmbed()
            .setTitle(course.courseTitleLong)
            .setDescription(course.courseDescription);
        embed.addField("Section", course.classSection);
        embed.addField("Status", course.enrollmentStatus);
        embed.addField("Units", course.minimumUnits);
        embed.addField("Professor", `${course.instructorFullName}\n${course.instructorEmail}`);
        embed.addField("Enrollment", `${course.enrollmentTotal}/${course.enrollmentCap}`);
        if (course.enrollmentStatus === "Waitlist") {
            embed.addField("Waitlist", `${course.waitTotal}/${course.waitCap}`);
        }
        
        return embed;
    }
}

module.exports = Courses;