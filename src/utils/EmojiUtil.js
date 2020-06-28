const axios = require("axios");

function getEmojiExtension(id) {
    return new Promise((resolve, reject) => {
        axios.get(`https://cdn.discordapp.com/emojis/${id}.gif`).then((success) => {
            resolve(`https://cdn.discordapp.com/emojis/${id}.gif`);
        }).catch((error) => {
            axios.get(`https://cdn.discordapp.com/emojis/${id}.png`).then(() => {
                resolve(`https://cdn.discordapp.com/emojis/${id}.png`)
            }).catch(() => reject)
        })
    });
}

module.exports = {
    getEmojiExtension
}