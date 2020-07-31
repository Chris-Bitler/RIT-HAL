const fs = require("fs");
const lineEnd = require("os").EOL;
const env = {};

function readInEnv() {
    const data = fs.readFileSync(".env").toString();
    const lines = data.split(lineEnd);
    lines.forEach(line => {
        const split = line.split("=");
        if (split.length >= 2) {
            env[split[0]] = split[1];
        }
    });
}

function getEnvVariable(name) {
    return env[name];
}

module.exports = {
    readInEnv,
    getEnvVariable
};