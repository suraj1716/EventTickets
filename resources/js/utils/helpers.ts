export function arraysAreEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

// export function chooseOption(
//   selectedOptionIds: number[],
//   variations: Variation[]
// ): Variation | null {
//   for (const variation of variations) {
//     if (arraysAreEqual(selectedOptionIds, variation.optionIds)) {
//       return variation;
//     }
//   }
//   return null; // No match found
// }

