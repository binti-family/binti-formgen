import { curry, pipe, when, includes, replace, map, over, lensIndex, reduce, apply, toPairs, append} from 'ramda';

const tagger = curry((tag, text, template) => pipe(
  when(
    includes(tag),
    pipe(
      replace(tag, text),
      tagger(tag, text)
    )
  )
)(template))

const applyTags = (tags, template) =>
  pipe(
    toPairs,
    map(over(lensIndex(0), s => `{${s}}`)),
    reduce(pipe(append, apply(tagger)), template)
  )(tags)

export default applyTags