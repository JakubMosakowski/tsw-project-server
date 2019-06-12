

export function checkUniqueValues(val: any[]): number {
    let uniqueValues = [];
    val.forEach((item) => {
        if (!uniqueValues.includes(item)) {
            uniqueValues.push(item)
        }
    });

    return uniqueValues.length
}

export const firstUnusedInteger = (numbers: number[]) => {
    if (numbers.length == 0) {
        numbers.push(0)
    }
    return Math.max(...numbers) + 1;
};
