/**
 * Merge all args starting together from a specific index
 * @param start The index to start at
 * @param args The list of arguments
 */
export function mergeArgs(start: number, args: string[]): string {
    return args.slice(start).join(" ").trim();
}

/**
 * Remove empty arguments from an array (empty argument is empty string)
 * @param args The list of arguments
 */
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
        args.splice(index, 1);
    });

    return args;
}
