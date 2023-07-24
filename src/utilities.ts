export function removeArrayDuplicates<T>(array: T[]) {
  return array.reduce<T[]>((accumulator, currentValue) => {
    if (accumulator.includes(currentValue)) {
      return accumulator;
    } else {
      return [...accumulator, currentValue];
    }
  }, []);
}
