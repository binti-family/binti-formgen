import {
  curry,
  pipe,
  when,
  includes,
  replace,
  map,
  over,
  lensIndex,
  reduce,
  apply,
  toPairs,
  append,
  flow,
} from "ramda";

const tagger = curry((tag, text, template) =>
  when(includes(tag), pipe(replace(tag, text), tagger(tag, text)))(template)
);

export const applyTags = (tags, template) =>
  flow(tags, [
    toPairs,
    map(over(lensIndex(0), (s) => `{${s}}`)),
    reduce(pipe(append, apply(tagger)), template),
  ]);

export const toCamelCase = (s) =>
  s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
