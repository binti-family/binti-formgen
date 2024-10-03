export const toCamelCase = (s) =>
  s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
