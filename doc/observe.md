# Observe

Language is not static, so elliptical grammars can't always be static either.
Sometimes grammars depend on information that cannot be hard-coded. Perhaps
it is stored in a database, or obtained from a web service.

Dynamic behavior can seriously increase complexity,
so it must be managed well. Elliptical handles this using
"Declarative Observers".

It's not difficult. The `describe` method is passed an `observe` function,
which takes a Source Element and returns its current data.

```jsx
const Superhero {
  describe ({observe}) {
    const data = observe(<HeroSource />)
    const heroItems = data.map(hero => {
      return {text: hero.name, value: hero.secretIdentity}
    })

    return <list items={heroItems} />
  }
}
```

Notice that `observe` returns an `Element`, just like `describe`. However,
the `type` of this element is not a `Phrase` it is a `Source`.

## Sources

### Fetch

A `Source` is an object with a function called `fetch`
that returns an `Observable`.

```js
function fetch () {
  return new Observable(observer => {
    observer.next([])

    fetchHeroData((err, heroData) => {
      if (err) {
        observer.error(err)
      } else {
        observer.next(heroData)
      }
    })
  })
}

const HeroSource = {fetch}
```

Don't be scared, it's not that bad. `Observable` is a Stage 1 Draft
for ECMAScript2016 (ES7). It simply a generic way of representing
values that change over time. It has not been implemented yet in any
major environments, so you will need to use a lightweight Polyfill like
[zen-observable](https://github.com/zenparsing/zen-observable), or a library
that uses the same interface, like
[ReactiveX/RxJS](https://github.com/ReactiveX/RxJS). Note that FRP libraries
that do not match the spec (Bacon, Kefir, Reactive-Extensions/RxJS) will
not automatically work with elliptical.

In our `fetch` function, we are creating a new `Observable`.
The first thing it does is
push an empty Array, which, in this case, means that no data
has been received yet. Then, it calls
`fetchHeroData`, some async function. When the callback is called, it will
pass the data to `observer.next`.

What does this mean for our `Component`? Notice that our `describe` method's
argument has a new property - `data`. `data` will always contain the most recent
value from our `Observable`. `describe` can use this variable
when it builds its element tree.

The first time `observe` is called, `data` will have the value of `[]`.
However, if we call `describe` sometime later, will contain some data
returned from `fetchHeroData`.

## `props` in `Source`s

Sources do not share `props` with the phrases that use them. Rather,
sources need to be passed props of their own.

```jsx
function fetch ({props}) {
  return new Observable(observer => {
    observer.next([])

    if (props.company === 'DC') {
      fetchDCHeroData(...)
    } else if (props.company === 'Marvel') {
      fetchMarvelHeroData(...)
    }
  })
}

const HeroSource = {fetch}

const Superhero {
  describe ({observe, props}) {
    const data = observe(<HeroSource company={props.universe} />)
    const heroItems = data.map(hero => {
      return {text: hero.name, value: hero.secretIdentity}
    })

    return <list items={heroItems} />
  }
}

const outputs = createParser(<Superhero universe='DC' />)
```

In this example, `HeroSource` is going to call `fetchDCHeroData` when it
is compile.

### Observe

Sources can actually observe other sources if the `observe` method is passed
as a prop.

```js
const SidekickSource = {
  fetch ({props}) {
    return new Observable(observer => {
      observer.next([])

      const data = props.observe(<HeroSource />)
      const sidekicks = []
      data.forEach(hero => {
        fetchSideKickForHero(hero, (err, sidekickData) => {
          if (err) {
            observer.error(err)
          } else {
            sidekicks.push(sidekickData)
            observer.next(sidekickData)
          }
        })
      })
    })
  }
}

// reference it with
// const data = observe(<SidekickSource observe={observe} />)
```

Here, we have a source called `SidekickSource` that observes our
`HeroSource` source. Whenever `HeroSource` gets new data, `fetch` will
be called again, which uses the data to generate a new list of sidekicks.