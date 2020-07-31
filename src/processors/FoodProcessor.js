const axios = require("axios");
const cheerio = require("cheerio");
const placeIDs = [103,104,105,106,107,108,112];
const foodChannel = "668249652570751017";
const serverId = "401908664018927626";
const Discord = require("discord.js");
let lastUpdatedDate = null;

function getOpenPlaces() {
    return new Promise((resolve, reject) => {
        const places = [];
        axios.get("https://www.rit.edu/fa/diningservices/places-to-eat/hours").then(response => {
            const data = response.data;
            const $ = cheerio.load(data);
            let currentLocation = null;
            const locationsAndInformation = $(".view-content > div.hours-title,div.hours-all-panel");
            locationsAndInformation.each((i, elem) => {
                if ($(elem).hasClass("hours-title")) {
                    if (currentLocation) {
                        places.push(currentLocation);
                    }

                    currentLocation = {
                        name: $(elem).find("h3").find("a").text(),
                        sections: []
                    };
                } else if ($(elem).hasClass("hours-all-panel")) {
                    const header = $(elem).find("div > div > h4").text().replace("&nbsp;","");
                    const body = $(elem).find("div.panel-body");
                    const weekDay = body.find("div.col-sm-7").text();
                    const times = body.find("div.col-sm-5").text();

                    if (times.trim() !== "Closed") {
                        currentLocation.sections.push({
                            header: header,
                            day: weekDay,
                            times: times
                        });
                    }
                }
            });

            if(currentLocation) {
                places.push(currentLocation);
            }

            resolve(places);
        }).catch(error => {
            console.log(error);
            reject(error);
        });
    });
}

function getSpecials() {
    return new Promise((resolve, reject) => {
        const places = [];
        axios.get("https://www.rit.edu/fa/diningservices/daily-specials").then(response => {
            const data = response.data;
            const $ = cheerio.load(data);

            placeIDs.forEach((id) => {
                const breakfastContainer = $(`.ds-output > div#${id} > div.ds-loc-title > div#BREAKFAST-${id} > div.menu-category-items > div.menu-category-list`);
                const lunchContainer = $(`.ds-output > div#${id} > div.ds-loc-title > div#LUNCH-${id} > div.menu-category-items > div.menu-category-list`);
                const dinnerContainer = $(`.ds-output > div#${id} > div.ds-loc-title > div#DINNER-${id} > div.menu-category-items > div.menu-category-list`);
                const currentPlace = {};
                currentPlace.name = $(`.ds-output > div#${id} > h3 > a`).text();

                if (breakfastContainer.length > 0) {
                    currentPlace.breakfast = [];
                    breakfastContainer.each((i, elem) => {
                        currentPlace.breakfast.push({
                            category: $(elem).find("div.menu-category").text(),
                            items: $(elem).find("div.menu-items").html().split("<br>").filter((item) => item.trim()).map((item) => item.replace("&amp;", "&"))
                        })
                    });
                }

                if (lunchContainer.length > 0) {
                    currentPlace.lunch = [];
                    lunchContainer.each((i, elem) => {
                        currentPlace.lunch.push({
                            category: $(elem).find("div.menu-category").text(),
                            items: $(elem).find("div.menu-items").html().split("<br>").filter((item) => item.trim()).map((item) => item.replace("&amp;", "&"))
                        })
                    });
                }

                if (dinnerContainer.length > 0) {
                    currentPlace.dinner = [];
                    dinnerContainer.each((i, elem) => {
                        currentPlace.dinner.push({
                            category: $(elem).find("div.menu-category").text(),
                            items: $(elem).find("div.menu-items").html().split("<br>").filter((item) => item.trim()).map((item) => item.replace("&amp;", "&"))
                        })
                    });
                }

                places.push(currentPlace);
            });

            resolve(places);
        }).catch(error => {
            console.log(error);
            reject(error);
        });
    });
}

function getFoodEmbed(place) {
    let embed = new Discord.MessageEmbed()
        .setTitle(place.name);
    place.sections.forEach((section) => {
        embed = embed.addField(section.header, section.times);
    });

    return embed;
}

function getSpecialsEmbed(place) {
    let embed = new Discord.MessageEmbed().setTitle(place.name);
    embed = addSpecialsSections(place, embed);
    return embed;
}

function addSpecialsSections(place, embed) {
    if (place.breakfast) {
        embed = embed.addField("Breakfast", constructDescriptionForSpecialsCategory(place.breakfast));
    }

    if (place.lunch) {
        embed = embed.addField("Lunch", constructDescriptionForSpecialsCategory(place.lunch));
    }

    if (place.dinner) {
        embed = embed.addField("Dinner", constructDescriptionForSpecialsCategory(place.dinner));
    }

    return embed;
}

function constructDescriptionForSpecialsCategory(category) {
    var description = "";
    category.forEach((categoryItem) => {
        description += `__${categoryItem.category}__\n`;
        categoryItem.items.forEach((item, index) => {
            if (index !== 0) {
                description += ",";
            }

            description += `_${item.replace("&amp;", "&")}_`;
        });
        description += "\n\n";
    });

    return description;
}

function checkFoodDaily(client) {
    const currentDate = new Date();
    if (!lastUpdatedDate || (lastUpdatedDate.getDate() !== currentDate.getDate() && currentDate.getHours() > 6)) {
        lastUpdatedDate = currentDate;
        const server = client.guilds.resolve(serverId);
        const channel = server.channels.resolve(foodChannel);
        for (let i = 0; i < 10; i++) {
            channel.bulkDelete(25)
                .then(messages => console.log(`Bulk deleted ${messages.size} messages`))
                .catch(console.error);
        }
        getOpenPlaces().then(places => {
            places.forEach((place) => {
                if (place.sections.length > 0) {
                    channel.send(getFoodEmbed(place));
                }
            });
        });
        getSpecials().then(places => {
            places.forEach((place) => {
                if (place.breakfast || place.lunch || place.dinner) {
                    channel.send(getSpecialsEmbed(place));
                }
            });
        });
    }
}

module.exports = {
    getOpenPlaces,
    getSpecials,
    getFoodEmbed,
    getSpecialsEmbed,
    checkFoodDaily
};