import axios from "axios";
import * as cheerio from "cheerio";
import { DailyPostInfo, FoodPlace, MenuItem, PlaceMenu } from "../types/Food";
import { Client, Guild, MessageEmbed, TextChannel } from "discord.js";
import { ConfigProperty } from "../models/ConfigProperty";
const placeIDs = [103, 104, 105, 106, 107, 108, 112];
const foodChannel = "668249652570751017";
const serverId = "401908664018927626";

export async function getOpenPlaces(): Promise<FoodPlace[] | null> {
  try {
    const places: FoodPlace[] = [];
    const response = await axios.get(
      "https://www.rit.edu/fa/diningservices/places-to-eat/hours"
    );
    const data = response.data;
    const $ = cheerio.load(data);
    let currentLocation: FoodPlace | null = null;
    const locationsAndInformation = $(
      ".view-content > div.hours-title,div.hours-all-panel"
    );
    locationsAndInformation.each((i, elem) => {
      if ($(elem).hasClass("hours-title")) {
        // This seems backwards, but this inserts existing places after they have their sections filled
        if (currentLocation) {
          places.push(currentLocation);
        }

        currentLocation = {
          name: $(elem).find("h3").find("a").text(),
          sections: [],
        };
      } else if ($(elem).hasClass("hours-all-panel")) {
        const header = $(elem)
          .find("div > div > h4")
          .text()
          .replace("&nbsp;", "");
        const body = $(elem).find("div.panel-body");
        const weekDay = body.find("div.col-sm-7").text();
        const times = body.find("div.col-sm-5").text();

        if (times.trim() !== "Closed" && currentLocation) {
          currentLocation.sections.push({
            header: header,
            day: weekDay,
            times: times,
          });
        }
      }
    });

    // Push the last place
    if (currentLocation) {
      places.push(currentLocation);
    }

    return places;
  } catch (error) {
    // TODO: log to sentry
    return null;
  }
}

export async function getSpecials() {
  const places: PlaceMenu[] = [];
  try {
    const response = await axios.get(
      "https://www.rit.edu/fa/diningservices/daily-specials"
    );
    const data = response.data;
    const $ = cheerio.load(data);

    placeIDs.forEach((id) => {
      const breakfastContainer = $(
        `.ds-output > div#${id} > div.ds-loc-title > div#BREAKFAST-${id} > div.menu-category-items > div.menu-category-list`
      );
      const lunchContainer = $(
        `.ds-output > div#${id} > div.ds-loc-title > div#LUNCH-${id} > div.menu-category-items > div.menu-category-list`
      );
      const dinnerContainer = $(
        `.ds-output > div#${id} > div.ds-loc-title > div#DINNER-${id} > div.menu-category-items > div.menu-category-list`
      );
      const currentPlace: PlaceMenu = {
        name: $(`.ds-output > div#${id} > h3 > a`).text(),
      };

      if (breakfastContainer.length > 0) {
        currentPlace.breakfast = [];
        breakfastContainer.each((i, elem) => {
          const menuItems = $(elem).find("div.menu-items").html();
          if (currentPlace.breakfast && menuItems) {
            currentPlace.breakfast.push({
              category: $(elem).find("div.menu-category").text(),
              items: menuItems
                .split("<br>")
                .filter((item) => item.trim())
                .map((item) => item.replace("&amp;", "&")),
            });
          }
        });
      }

      if (lunchContainer.length > 0) {
        currentPlace.lunch = [];
        lunchContainer.each((i, elem) => {
          const menuItems = $(elem).find("div.menu-items").html();
          if (currentPlace.lunch && menuItems) {
            currentPlace.lunch.push({
              category: $(elem).find("div.menu-category").text(),
              items: menuItems
                .split("<br>")
                .filter((item) => item.trim())
                .map((item) => item.replace("&amp;", "&")),
            });
          }
        });
      }

      if (dinnerContainer.length > 0) {
        currentPlace.dinner = [];
        dinnerContainer.each((i, elem) => {
          const menuItems = $(elem).find("div.menu-items").html();
          if (currentPlace.dinner && menuItems) {
            currentPlace.dinner.push({
              category: $(elem).find("div.menu-category").text(),
              items: menuItems
                .split("<br>")
                .filter((item) => item.trim())
                .map((item) => item.replace("&amp;", "&")),
            });
          }
        });
      }

      places.push(currentPlace);
    });

    return places;
  } catch (err) {
    // TODO: Log to sentry
    return places;
  }
}

export function getFoodEmbed(place: FoodPlace): MessageEmbed {
  let embed = new MessageEmbed().setTitle(place.name);
  place.sections.forEach((section) => {
    embed = embed.addField(section.header, section.times);
  });

  return embed;
}

export function getSpecialsEmbed(place: PlaceMenu): MessageEmbed {
  let embed = new MessageEmbed().setTitle(place.name);
  embed = addSpecialsSections(place, embed);
  return embed;
}

function addSpecialsSections(
  place: PlaceMenu,
  embed: MessageEmbed
): MessageEmbed {
  if (place.breakfast) {
    embed = embed.addField(
      "Breakfast",
      constructDescriptionForSpecialsCategory(place.breakfast)
    );
  }

  if (place.lunch) {
    embed = embed.addField(
      "Lunch",
      constructDescriptionForSpecialsCategory(place.lunch)
    );
  }

  if (place.dinner) {
    embed = embed.addField(
      "Dinner",
      constructDescriptionForSpecialsCategory(place.dinner)
    );
  }

  return embed;
}

function constructDescriptionForSpecialsCategory(category: MenuItem[]) {
  let description = "";
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

export async function checkFoodDaily(client: Client) {
  const currentDate = new Date();
  for (const guild of client.guilds.cache.values()) {
    const dailyPostInfo = await fetchLastDailyInfo(guild.id);
    if (dailyPostInfo.enabled && dailyPostInfo.channel) {
      const lastUpdated = dailyPostInfo.lastTime || 0;
      const lastUpdatedDate = new Date(lastUpdated);
      if (
        !lastUpdatedDate ||
        (lastUpdatedDate.getDate() !== currentDate.getDate() &&
          currentDate.getHours() > 6)
      ) {
        await ConfigProperty.update(
          {
            value: Date.now(),
          },
          {
            where: {
              serverId: guild.id,
              key: "food.last",
            },
          }
        );
        const channel = guild.channels.resolve(dailyPostInfo.channel);
        if (channel && channel instanceof TextChannel) {
          for (let i = 0; i < 10; i++) {
            channel
              .bulkDelete(25)
              .then((messages) =>
                console.log(`Bulk deleted ${messages.size} messages`)
              )
              .catch(console.error);
          }
          const places = await getOpenPlaces();
          if (places) {
            places.forEach((place) => {
              if (place.sections.length > 0) {
                channel.send(getFoodEmbed(place));
              }
            });
          }
          const specials = await getSpecials();

          specials.forEach((place) => {
            if (place.breakfast || place.lunch || place.dinner) {
              channel.send(getSpecialsEmbed(place));
            }
          });
        }
      }
    }
  }
}

/**
 * Attempt to fetch the food-related configuration values for a server
 * @param serverId The guild id to fetch the configuration values for
 */
async function fetchLastDailyInfo(serverId: string): Promise<DailyPostInfo> {
  const lastTime = await ConfigProperty.getServerProperty(
    "food.last",
    serverId
  );
  const channel = await ConfigProperty.getServerProperty(
    "food.channel",
    serverId
  );
  const enabled = await ConfigProperty.getServerProperty(
    "food.enabled",
    serverId
  );
  const dailyPostInfo: DailyPostInfo = {};
  if (lastTime?.value) {
    dailyPostInfo.lastTime = parseInt(lastTime.value);
  }
  if (channel?.value) {
    dailyPostInfo.channel = channel.value;
  }
  if (enabled?.value) {
    dailyPostInfo.enabled = enabled.value.toLowerCase() === "true";
  }

  return dailyPostInfo;
}
