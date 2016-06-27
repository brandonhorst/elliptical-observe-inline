# Sources

Lacona also allows for dynamic phrases. However, in order to manage complexity, dynamic behavior is abstracted through Sources.

Sources are owned by `Phrase`s. Each `Phrase` defines which sources it needs, and the sources are automatically managed for the `Phrase`. This is sometimes known as "sideways data loading," because the Phrase had information that does not come from its parent. It dramatically simplifies the grammar by allowing phrases to be entirely abstracted.

## An Example

```jsx
/** @jsx createElement */

import { createElement, Phrase, Source } from 'lacona-phrase'
import { readdir } from 'fs'
import { join } from 'path'
import { Parser } from 'lacona'

class DirectoryContents extends Source {
  state = []

  onCreate () {
    readdir(this.props.path, (err, files) => {
      if (!err) {
        this.setData(files)
      }
    })
  }
}

class File extends Phrase {
  describe ({observe}) {
    const data = observe(<DirectoryContents path={this.props.directory} />)
    const items = this.source.data.map(filename => {
      return {text: filename, value: join(this.props.directory, filename)}
    })

    return <list items={items} />
  }
}

function doParse() {
  const output = parser.parseArray('open Cal')
  console.log(output)
}

const parser = new Parser({
  grammar: (
    <sequence>
      <literal text='open ' />
      <File directory='/Applications' id='appPath' />
    </sequence>
  )
})

parser.on('update', doParse)
doParse()

/*
[]
*/

/*
[
  {
    result: {
      appPath: /Applications/Calculator.App
    },
    score: 1,
    words: [
      {text: 'open ', input: true}
      {text: 'Cal ', input: true}
      {text: 'endar.app ', input: false}
    ]
  }, {
    result: {
      appPath: /Applications/Calendar.App
    },
    score: 1,
    words: [
      {text: 'open ', input: true}
      {text: 'Cal ', input: true}
      {text: 'culator.app ', input: false}
    ]
  }
]
*/
```
