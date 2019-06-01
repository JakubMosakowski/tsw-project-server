
export function getFirstMissingValueFromArray(numbers: number[]): number {
    numbers.sort();
    let returnValue = numbers.length + 1;
    numbers.forEach((value, index) => {
        if (value != index + 1) {
            returnValue = index + 1
        }
    });
    return returnValue;
}

export function isInRange(array: Array<number>, start: number, end: number, step: number): boolean {
    let isInRange = true;
    array.forEach(value => {
        if (!(value >= start && value <= end && value % step == 0)) {
            isInRange = false;
            return false;
        }
    });
    return isInRange
}
