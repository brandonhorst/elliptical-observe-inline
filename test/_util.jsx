/** @jsx createElement */
import _ from 'lodash'
import {createElement, compile} from 'elliptical'
import createProcess from '../src/processor'

export function text (input) {
  return _.map(input.words, 'text').join('')
}

export function compileAndTraverse (element, input, register) {
  const process = createProcess(register)
  const parse = compile(element, process)
  return parse(input)
}
