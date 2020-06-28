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

const axios = require('axios');

function getClasses(majorAbbrev, courseNumber, section = "") {
    return new Promise((resolve, reject) => {
        axios.post("https://tigercenter.rit.edu/tigerCenterApp/tc/class-search", {
            searchParams: {
                query: `${majorAbbrev} ${courseNumber} ${section}`.trim(),
                term: "2195",
                isAdvanced: false,
                courseAttributeOptions: [],
                courseAttributeOptionsPassed: []
            }
        })
            .then((response) => {
                const data = response.data;
                if (data.found && data.found > 0) {
                    resolve(data.searchResults);
                } else {
                    resolve([]);
                }
            })
            .catch((err) => {
                console.log(err);
                reject(err);
            })
    });

}

module.exports = {
    getClasses
};