import _ from 'lodash'
import Observable from 'zen-observable'

export default function createStore () {
  const items = []
  let observer
  const data = new Observable((newObserver) => {
    observer = newObserver
  })

  function fetchAndSubscribe (element, item) {
    const fetched = element.type.fetch(element)

    const subscription = fetched.subscribe({
      next (value) {
        item.value = value

        if (observer) {
          observer.next({element, value})
        }
      }
    })
    if (item.subscription) {
      item.subscription.unsubscribe()
    }
    item.subscription = subscription
  }

  function register (element) {
    const existing = _.find(items, (item) => _.isEqual(element, item.element))

    if (existing) {
      const currentValue = existing.value

      return currentValue
    } else {
      const newItem = {element, dirty: false}
      items.push(newItem)

      fetchAndSubscribe(element, newItem)

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
