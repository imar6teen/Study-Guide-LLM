export const capitalizeEachWord = (sentence: string) =>
  sentence
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
