const Command = require("./Command");
const FoodProcessor = require("../processors/FoodProcessor");

const PROHIBITED_CHANNELS = ["401908664018927628"];

class FoodSpecials extends Command {
    useCommand(client, evt, args) {
        FoodProcessor.getSpecials().then((places) => {
            if (!PROHIBITED_CHANNELS.includes(evt.channel.id)) {
                places.forEach((place) => {
                    if (place.breakfast || place.lunch || place.dinner) {
                        evt.channel.send(FoodProcessor.getSpecialsEmbed(place));
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
        return "rit specials";
    }
}

module.exports = FoodSpecials;