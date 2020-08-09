<p align="center">
<img alt="HAL profile picture" src="https://cdn.discordapp.com/app-icons/643590178727919616/7a9a0505cdd4f951e34f392e6ef9eba1.png?size=512" />
</p>

## HAL Discord Bot 

[![codecov](https://codecov.io/gh/Chris-Bitler/RIT-HAL/branch/master/graph/badge.svg)](https://codecov.io/gh/Chris-Bitler/RIT-HAL)
[![circleci](https://circleci.com/gh/Chris-Bitler/RIT-HAL.svg?style=svg)](https://circleci.com/gh/Chris-Bitler/RIT-HAL)

A discord bot made for the [Unofficial RIT Discord Server](https://discord.gg/rit). Has moderation capabilities along with some other miscellaneous uses.

## How to run HAL
1. Pull the code down via `git clone git@github.com:Chris-Bitler/RIT-HAL.git`
2. Replace the discord_token and rapidapi_token in .env.bk with API tokens from the respective services.
3. Set the postgres host and credentials and database in the .env.bk
4. Move .env.bk to .env
5. Run npm install in the project directory
6. Run tsc to build the typescript code
7. Run the bot via `npm run hal`

## Filling in .env
The environment file includes 6 different environment variables that need to be filled out for HAL to work correctly. They are as follows:
```
discord_token: The bot token you obtain from a created bot at https://discord.com/developers/

rapidapi_token: Register for an account at https://rapidapi.com and obtain a key for https://rapidapi.com/transloc/api/openapi-1-2

postgre_db: The database name that is being used for HAL

postgre_username: The username to log into postgres

postgre_password:  The password to log into postgres

postgre_host: The host for the postgres instance, including port if it is not on the default port
```