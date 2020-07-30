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

import fs  = require("fs");
import os = require("os");
const env: object = {};
const lineEnd: string = os.EOL;

export function readInEnv(): void {
    const data = fs.readFileSync(".env").toString();
    const lines = data.split(lineEnd);
    lines.forEach((line: string) => {
        const split = line.split("=");
        if (split.length >= 2) {
            env[split[0]] = split[1];
        }
    });
}

export function getEnvVariable(name: string): any {
    return env[name];
}