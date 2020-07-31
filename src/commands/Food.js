const Command = require("./Command");
const FoodProcessor = require("../processors/FoodProcessor");

const PROHIBITED_CHANNELS = ["401908664018927628"];

class Food extends Command {
    useCommand(client, evt, args) {
        FoodProcessor.getOpenPlaces().then((places) => {
            if (!PROHIBITED_CHANNELS.includes(evt.channel.id)) {
                places.forEach((place) => {
                    if (place.sections.length > 0) {
                        evt.channel.send(FoodProcessor.getFoodEmbed(place));
                    }
                });
            } else {
                evt.channel.sendMessage("The use of this command is prohibited in this channel.");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    getCommand() {
        return "rit food";
    }
}

module.exports = Food;