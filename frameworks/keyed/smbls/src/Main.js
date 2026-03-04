import { create } from '@domql/element'

function _random (max) {
  return Math.round(Math.random() * 1000) % max
}

const adjectives = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy']
const colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange']
const nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard']

let nextId = 1

function buildData (count) {
  const data = new Array(count)
  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: adjectives[_random(adjectives.length)] + ' ' + colours[_random(colours.length)] + ' ' + nouns[_random(nouns.length)]
    }
  }
  return data
}

let data = []
let rows = []
let selectedRow

const tbody = document.getElementById('tbody')
const table = document.getElementsByTagName('table')[0]
const context = {}

function createRow (item) {
  const el = create({
    tag: 'tr',
    TdId: {
      tag: 'td',
      attr: { class: 'col-md-1' },
      text: String(item.id)
    },
    TdLabel: {
      tag: 'td',
      attr: { class: 'col-md-4' },
      Label: {
        tag: 'a',
        text: item.label
      }
    },
    TdRemove: {
      tag: 'td',
      attr: { class: 'col-md-1' },
      Remove: {
        tag: 'a',
        Icon: {
          tag: 'span',
          attr: { class: 'glyphicon glyphicon-remove', 'aria-hidden': 'true' }
        }
      }
    },
    TdSpacer: {
      tag: 'td',
      attr: { class: 'col-md-6' }
    }
  }, tbody, 'row_' + item.id, { context })

  el.node.data_id = item.id
  return el
}

function getParentId (elem) {
  while (elem) {
    if (elem.tagName === 'TR') return elem.data_id
    elem = elem.parentNode
  }
}

// Button event delegation
document.getElementById('main').addEventListener('click', (e) => {
  if (e.target.matches('#add')) { e.stopPropagation(); add() }
  else if (e.target.matches('#run')) { e.stopPropagation(); run() }
  else if (e.target.matches('#update')) { e.stopPropagation(); update() }
  else if (e.target.matches('#runlots')) { e.stopPropagation(); runLots() }
  else if (e.target.matches('#clear')) { e.stopPropagation(); clear() }
  else if (e.target.matches('#swaprows')) { e.stopPropagation(); swapRows() }
})

// Table row event delegation
tbody.addEventListener('click', (e) => {
  e.stopPropagation()
  let p = e.target
  while (p && p.tagName !== 'TD') p = p.parentNode
  if (!p) return
  if (p.parentNode.childNodes[1] === p) {
    const id = getParentId(e.target)
    const idx = data.findIndex((row) => row.id === id)
    select(idx)
  } else if (p.parentNode.childNodes[2] === p) {
    const id = getParentId(e.target)
    const idx = data.findIndex((row) => row.id === id)
    del(idx)
  }
})

function run () {
  removeAllRows()
  data = buildData(1000)
  rows = []
  appendRows(0)
  unselect()
}

function runLots () {
  removeAllRows()
  data = buildData(10000)
  rows = []
  appendRows(0)
  unselect()
}

function add () {
  const start = data.length
  data = data.concat(buildData(1000))
  appendRows(start)
}

function update () {
  for (let i = 0; i < data.length; i += 10) {
    data[i].label += ' !!!'
    rows[i].node.childNodes[1].childNodes[0].firstChild.nodeValue = data[i].label
  }
}

function unselect () {
  if (selectedRow !== undefined) {
    selectedRow.className = ''
    selectedRow = undefined
  }
}

function select (idx) {
  unselect()
  selectedRow = rows[idx].node
  selectedRow.className = 'danger'
}

function del (idx) {
  rows[idx].node.remove()
  rows.splice(idx, 1)
  data.splice(idx, 1)
  unselect()
  recreateSelection()
}

function recreateSelection () {
  if (selectedRow) {
    const selId = selectedRow.data_id
    const selIdx = data.findIndex((d) => d.id === selId)
    if (selIdx >= 0) {
      selectedRow = rows[selIdx].node
      selectedRow.className = 'danger'
    }
  }
}

function clear () {
  data = []
  rows = []
  removeAllRows()
  unselect()
}

function removeAllRows () {
  tbody.textContent = ''
}

function swapRows () {
  if (data.length > 998) {
    const tmp = data[1]
    data[1] = data[998]
    data[998] = tmp

    tbody.insertBefore(rows[998].node, rows[2].node)
    tbody.insertBefore(rows[1].node, rows[999].node)

    const tmpRow = rows[998]
    rows[998] = rows[1]
    rows[1] = tmpRow
  }
}

function appendRows (start) {
  const empty = !tbody.firstChild
  if (empty) tbody.remove()
  for (let i = start; i < data.length; i++) {
    rows[i] = createRow(data[i])
  }
  if (empty) table.insertBefore(tbody, null)
}
