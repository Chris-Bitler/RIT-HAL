## HAL Discord Bot
A discord bot made for the [Unofficial RIT Discord Server](https://discord.gg/rit). Has moderation capabilities along with some other miscellaneous uses.
## How to run HAL
1. Pull the code down via `git clone git@github.com:Chris-Bitler/RIT-HAL.git`
2. Replace the discord_token and rapidapi_token in .env.bk with API tokens from the respective services.
3. Set the postgres host and credentials and database in the .env.bk
4. Move .env.bk to .env
5. Run npm install in the project directory
6. Run tsc to build the typescript code
7. Run the bot via `npm run hal`