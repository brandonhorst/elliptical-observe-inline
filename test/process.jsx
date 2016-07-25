/* eslint-env mocha */
/** @jsx createElement */

import {createElement, compile} from 'elliptical'
import chai, {expect} from 'chai'
import createProcessor from '../src/processor'
import {spy} from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

describe('process', () => {
  it('calls register with the results of observe', () => {
    const Test = {
      describe ({observe}) {
        return observe(3)
      }
    }
    const register = spy()
    const process = createProcessor(register)
    const parse = compile(<Test />, process)
    parse('')

    expect(register).to.have.been.calledWith(3)
  })

  it('passes props to observe', () => {
    const Test = {
      describe ({props, children, observe}) {
        expect(props).to.eql({num: 3})
        expect(children).to.eql([])
        return observe(props.num + 3)
      }
    }
    const register = spy()
    const process = createProcessor(register)
    const parse = compile(<Test num={3} />, process)
    parse()

    expect(register).to.have.been.calledWith(6)
  })

  it('passes result of register to describe as data', () => {
    const Root = {
      describe ({observe}) {
        const data = observe(3)
        expect(data).to.eql(6)
        return <literal text='test' value={data} />
      }
    }

    const register = spy((num) => num + 3)
    const process = createProcessor(register)
    const parse = compile(<Root />, process)
    parse('')

    expect(register).to.have.been.calledWith(3)
  })

  it('does not recompile unless changed', () => {
    const describeSpy = spy()
    const Sub = {
      describe ({props}) {
        describeSpy()
        return <literal text='test' value={props.data} />
      }
    }

    const Root = {
      describe ({observe}) {
        const data = observe()
        return <Sub data={data} />
      }
    }

    const register = () => 6
    const process = createProcessor(register)
    const parse = compile(<Root />, process)

    parse('')
    parse('t')
    parse('te')
    expect(describeSpy).to.have.been.calledTwice
  })

  it('does not recompile children unless changed', () => {
    const describeSpy = spy()
    const Child = {
      describe ({ props }) {
        describeSpy()
        return <literal text='test' value={props.data} />
      }
    }
    const Root = {
      observe () {},
      describe ({data}) {
        return <Child data={data} />
      }
    }

    const register = () => 6
    const process = createProcessor(register)
    const parse = compile(<Root />, process)

    parse('')
    parse('t')
    parse('te')
    expect(describeSpy).to.have.been.calledTwice
  })

  it('does not recompile children unless changed (nested)', () => {
    const describeSpy = spy()
    const Child = {
      describe ({ props }) {
        describeSpy()
        return <literal text='test' value={props.data} />
      }
    }
    const Root = {
      observe () {},
      describe ({data}) {
        return (
          <sequence>
            <literal text='test' />
            <Child data={data} />
          </sequence>
        )
      }
    }

    const register = () => 6
    const process = createProcessor(register)
    const parse = compile(<Root />, process)

    parse('')
    parse('t')
    parse('te')
    expect(describeSpy).to.have.been.calledTwice
  })

  it('passes result of register to visit as data', () => {
    const Root = {
      visit (opt, {observe}, traverse) {
        const data = observe(3)
        expect(opt.text).to.equal('test')
        expect(data).to.eql(6)
        return traverse(<literal text='test' value={data}/>, opt)
      }
    }

    const register = spy((num) => num + 3)
    const process = createProcessor(register)
    const parse = compile(<Root />, process)

    const options = parse('test')
    expect(register).to.have.been.calledWith(3)
    expect(options).to.have.length(1)
    expect(options[0].result).to.equal(6)
  })

  it('can process sources', () => {
    function sourceProcessor (element) {
      expect(element).to.equal(3)
      return 6
    }

    const Test = {}
    const Root = {
      describe ({observe}) {
        const data = observe(3)
        expect(data).to.eql(9)
        return <Test test={data} />
      }
    }

    const register = spy((num) => num + 3)
    const process = createProcessor(register, sourceProcessor)
    compile(<Root />, process)

    expect(register).to.have.been.calledWith(6)
  })
})
