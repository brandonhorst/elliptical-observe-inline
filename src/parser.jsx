/** @jsx createElement */

import {createElement, compile, combineProcessors} from 'elliptical'
import createProcessor from './processor'
import createStore from './store'
import Observable from 'zen-observable'

export default function createParser (element, otherProcessor) {
  const store = createStore()

  let currentObserver
  let currentInput
  const processor = createProcessor(store.register)

  let trueProcessor = processor
  if (otherProcessor) {
    trueProcessor = combineProcessors(processor, otherProcessor)
  }
  let parse = compile(element, trueProcessor)

  function traverse () {
    const outputs = parse(currentInput)
    currentObserver.next(outputs)
  }

  store.data.subscribe({
    next () {
      if (currentObserver) {
        traverse()
      }
    }
  })

  return {
    watch (input) {
      if (currentObserver) {
        currentObserver.complete()
      }

      return new Observable((observer) => {
        currentObserver = observer
        currentInput = input
        traverse()
      })
    },
    parse (input) {
      return parse(input)
    },
    store
  }
}
