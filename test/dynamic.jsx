/** @jsx createElement */
/* eslint-env mocha */

import {createElement} from 'elliptical'
import Observable from 'zen-observable'
import {compileAndTraverse} from './_util'
import createStore from '../src/store'

import {spy} from 'sinon'
import chai, {expect} from 'chai'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

describe('dynamic', () => {
  it('calls observe for a specific input', () => {
    const Test = {
      fetch ({props}) {
        expect(props).to.eql({input: 't'})
        return new Observable((observer) => {
          observer.next('test')
        })
      }
    }

    function describe (input, observe) {
      const data = observe(<Test input={input} />)

      return <literal text={data} value={data} />
    }

    const Phrase = {
      describe ({observe}) {
        console.log(observe)
        return <dynamic describe={(input) => describe(input, observe)} />
      }
    }

    const store = createStore()
    const grammar = <Phrase />
    const options = compileAndTraverse(grammar, 't', store.register)

    expect(options).to.eql([{
      text: null,
      words: [{text: 't', input: true}, {text: 'est', input: false}],
      result: 'test',
      score: 1,
      qualifiers: []
    }])
  })

  it('calls observe for a specific input, and handles async data', (done) => {
    const Test = {
      fetch () {
        return new Observable((observer) => {
          process.nextTick(() => {
            observer.next('totally')
          })
        })
      }
    }

    function describe (input, observe) {
      const data = observe(<Test input={input} />) || 'test'
      return <literal text={data} value={data} />
    }

    const Phrase = {
      describe ({observe}) {
        return <dynamic describe={(input) => describe(input, observe)} consumeAll />
      }
    }

    const grammar = <Phrase />
    const store = createStore()
    const options = compileAndTraverse(grammar, 't', store.register)
    expect(options).to.eql([{
      text: null,
      words: [{text: 't', input: true}, {text: 'est', input: false}],
      result: 'test',
      score: 1,
      qualifiers: []
    }])

    process.nextTick(() => {
      const options = compileAndTraverse(grammar, 't', store.register)
      expect(options).to.eql([{
        text: null,
        words: [{text: 't', input: true}, {text: 'otally', input: false}],
        result: 'totally',
        score: 1,
        qualifiers: []
      }])

      done()
    })
  })

  it('calls fetch for two different inputs on the same parse', () => {
    const Test = {
      fetch ({props}) {
        return new Observable((observer) => {
          observer.next(`${props.input}batman${props.input}`)
        })
      }
    }

    function describe (input, observe) {
      const data = observe(<Test input={input} />)
      return <literal text={data} value={data} />
    }

    const Phrase = {
      describe ({observe}) {
        return (
          <choice>
            <sequence>
              <literal text='test' />
              <dynamic describe={input => describe(input, observe)} id='dynamic' consumeAll />
            </sequence>
            <dynamic describe={input => describe(input, observe)} id='dynamic' consumeAll />
          </choice>
        )
      }
    }

    const grammar = <Phrase />
    const store = createStore()

    const options = compileAndTraverse(grammar, 'testb', store.register)
    expect(options).to.eql([{
      text: null,
      words: [
        {text: 'test', input: true},
        {text: 'b', input: true},
        {text: 'batmanb', input: false}
      ],
      result: {dynamic: 'bbatmanb'},
      score: 1,
      qualifiers: []
    }, {
      text: null,
      words: [
        {text: 'testb', input: true},
        {text: 'batmantestb', input: false}
      ],
      result: {dynamic: 'testbbatmantestb'},
      score: 1,
      qualifiers: []
    }])
  })

  it('calls observe for multiple splits', () => {
    const observeSpy = spy()

    function describe (input) {
      observeSpy(input)
    }

    const grammar = <dynamic describe={describe} splitOn=' ' />
    compileAndTraverse(grammar, 'b t')
    expect(observeSpy).to.have.been.calledTwice
    expect(observeSpy).to.have.been.calledWith('b')
    expect(observeSpy).to.have.been.calledWith('b t')
  })

  it('calls observe for multiple splits (regex)', () => {
    const observeSpy = spy()

    function describe (input) {
      observeSpy(input)
    }

    const grammar = <dynamic describe={describe} splitOn={/\s|,/} />
    compileAndTraverse(grammar, 'b t')
    expect(observeSpy).to.have.been.calledTwice
    expect(observeSpy).to.have.been.calledWith('b')
    expect(observeSpy).to.have.been.calledWith('b t')
  })

  it('can be limited', () => {
    function describe () {
      return <literal text='b test' />
    }

    const grammar = <dynamic describe={describe} splitOn=' ' limit={1} />

    const store = createStore()
    const options = compileAndTraverse(grammar, 'b test', store.register)
    expect(options).to.have.length(1)
  })

  it('limiting limits splits, not child branches', () => {
    function describe () {
      return <list items={['super', 'bat']} />
    }

    const grammar = (
      <sequence>
        <dynamic describe={describe} limit={1} />
        <literal text='man' />
      </sequence>
    )

    const store = createStore()
    const options = compileAndTraverse(grammar, '', store.register)
    expect(options).to.have.length(2)
  })

  it('can be greedy', () => {
    const Test = {
      fetch ({props}) {
        return new Observable((observer) => {
          observer.next(props.input)
        })
      }
    }

    function describe (input, observe) {
      const data = observe(<Test input={input} />)
      return <literal text={data} value={data} />
    }

    const Phrase = {
      describe ({observe}) {
        return (
          <sequence>
            <dynamic describe={input => describe(input, observe)} splitOn=' ' greedy />
            <literal text=' test' />
          </sequence>
        )
      }
    }

    const grammar = <Phrase />
    const store = createStore()
    const options = compileAndTraverse(grammar, 'b t', store.register)
    expect(options).to.eql([{
      text: null,
      words: [
        {text: 'b t', input: true},
        {text: ' test', input: false}
      ],
      result: {},
      score: 1,
      qualifiers: []
    }, {
      text: null,
      words: [
        {text: 'b', input: true},
        {text: ' t', input: true},
        {text: 'est', input: false}
      ],
      result: {},
      score: 1,
      qualifiers: []
    }])
  })
})
