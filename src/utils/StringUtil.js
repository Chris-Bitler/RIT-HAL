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

function mergeArgs(start, args) {
    return args.slice(start).join(" ").trim();
}

function removeEmptyArgs(args) {
    const toDelete = [];
    let index = 0;
    args.forEach((arg) => {
        if (arg.trim() === "") {
            toDelete.push(index);
        }
        index++;
    });

    toDelete.forEach((i) => {
        args.splice(i,1);
    });

    return args;
}

module.exports = {
    mergeArgs,
    removeEmptyArgs
};