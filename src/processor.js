import _ from 'lodash'

export default function createProcessor (register, processor) {
  return function process (element) {
    function untrackedObserve (source) {
      if (processor) {
        source = processor(source)
      }
      return register(source)
    }

    const newElement = _.assign({}, element, {observe: untrackedObserve})

    // Don't worry about builtins, or Phrases with a visit
    if (_.isString(element.type) || !element.type.describe) {
      return newElement
    }

    function describeAndTrackObserve () {
      const sources = []
      const values = []
      function trackedObserve (source) {
        if (processor) {
          source = processor(source)
        }
        const value = register(source)
        sources.push(source)
        values.push(value)
        return value
      }
      const description = element.type.describe(
        _.assign({}, element, {observe: trackedObserve})
      )
      return {description, sources, values}
    }

    const {description: firstDescription, sources: firstSources, values: firstValues} = describeAndTrackObserve()
    let firstRun = true

    // If it never called observe, it never WILL call observe during
    // a normal describe. It may with 'dynamic' or a child value,
    // but we can't track and optimize that - so we'll just
    // pass a naive observe
    if (firstSources.length === 0) {
      return newElement
    } else {
      let oldValues = firstValues
      let oldSources = firstSources
      let oldDescription = firstDescription

      function visit (option, e, traverse) {
        let sources, values, description
        if (firstRun) {
          sources = firstSources
          values = firstValues
          description = firstDescription
          firstRun = false
        } else {
          ;({sources, values, description} = describeAndTrackObserve())
        }
        if (oldDescription == null && description != null ||
          values.length !== oldValues.length || // perf opt
          _.some(_.unzip([values, oldValues]), ([a, b]) => a !== b) ||
          _.some(_.unzip([sources, oldSources]), ([a, b]) => !_.isEqual(a, b))
        ) {
          oldValues = values
          oldSources = sources
          oldDescription = description
        }

        return traverse(oldDescription, option)
      }
      const type = _.assign({}, element.type, {
        visit,
        _oldVisit: element.type.visit,
        describe: undefined
      })
      return _.assign({}, newElement, {type})
    }
  }
}
