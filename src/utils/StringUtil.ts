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
    return args.filter((arg) => arg !== "");
}

/**
 * Test if a string is numeric
 * @param str The input string
 */
export function isNumeric(str: string): boolean {
    return /^?\d+$/.test(str);
}