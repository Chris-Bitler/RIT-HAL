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

export function mergeArgs(start: number, args: string[]): string {
    return args.slice(start).join(" ").trim();
}

export function removeEmptyArgs(args: string[]): string[] {
    const toDelete: number[] = [];
    let index = 0;
    args.forEach((arg: string) => {
        if (arg.trim() === "") {
            toDelete.push(index);
        }
        index++;
    });

    toDelete.forEach((index: number) => {
        args.splice(index,1);
    });

    return args;
}