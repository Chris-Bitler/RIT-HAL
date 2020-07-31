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