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