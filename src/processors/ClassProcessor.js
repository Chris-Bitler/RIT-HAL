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