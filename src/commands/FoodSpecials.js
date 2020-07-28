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