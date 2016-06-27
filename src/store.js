import _ from 'lodash'
import Observable from 'zen-observable'

export default function createStore () {
  const items = []
  let observer
  const data = new Observable((newObserver) => {
    observer = newObserver
  })

  function register (element) {
    const existing = _.find(items, (item) => _.isEqual(element, item.element))

    if (existing) {
      return existing.value
    } else {
      const newItem = {element}
      items.push(newItem)

      const fetched = element.type.fetch(element)

      const subscription = fetched.subscribe({
        next (value) {
          newItem.value = value

          if (observer) {
            observer.next({element, value})
          }
        }
      })
      newItem.subscription = subscription

      return newItem.value
    }
  }

  function remove (item) {
    const index = items.indexOf(item)
    const removed = items.splice(index, 1)
    removed[0].subscription.unsubscribe()
  }

  return {data, register, items, remove}
}
