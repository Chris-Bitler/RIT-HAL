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