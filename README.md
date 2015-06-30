# SimpleTreeView

A JavaScript checkbox tree control that leaves the styling up to you, so you can
customise it to fit your application without the hassle of overriding tons of
existing CSS rules.

## Dependencies

STV requires [Underscore.js](http://underscorejs.org/), at minimum. It also uses
[jQuery](http://jquery.com/) for event handling and some DOM manipulation.

## Basic Usage

The main thing you need to supply the control is a tree data structure, since it
obviously won't be much use without one. The tree should look something like
this:

```javascript
treeData = {
    label: 'Root node',
    value: '*',
    children: [
        {
            label: 'Child 0',
            value: 'c0',
            state: SimpleTreeView.SELECTED
        },
        {
            label: 'Child 1',
            value: 'c1'
            state: SimpleTreeView.UNSELECTED
        }
    ]
}
```

Most of these properties are optional, but you'll need to supply, at minimum,
either a `label` or a `value`; whichever is missing will be copied from the
other (to simplify rendering).

To actually set up a tree, do the following:

```javascript
var tree = new SimpleTreeView({ data: treeData });
```

## Options

There are only really two options: `data` and `element`. The first is, as
described above, the actual data structure used to build and render the tree.
The second is an HTML element into which you'd like to render the tree. You can
use the tree without getting the DOM involved, but obviously it won't be able to
render unless you give it somewhere to go.

## API

Once you've created an instance of a tree, there are a number of methods you can
call on it:

- **setElement(*element*)**: tells the tree which HTML element to insert its
  rendered output into. TODO: when setElement() is called on an already rendered
  tree, move the tree to the new element.

- **getElement()**: returns the HTML element the tree is assigned to.

- **setData(*data*)**: replace the existing tree data structure with the new
  one.

- **getData()**: returns the data structure used to set up the tree, but
  including all the additional properties the tree uses, such as selection
  state.

- **copyData()**: returns a deep copy of the tree, limited to each node's
  `label`, `value`, `parent`, `state` and `children` properties.

- **getSelection()**: returns a list of objects with `label` and `value`
  properties, representing the currently selected nodes.

- **setSelection(*selection*)**: reset the current selection to the given value,
  which can be either a string representing a node value, or a list of strings.

- **nodeAt(*location*)**: gets the node at the given location, which must be an
  array of indices, starting with the root, into each subsequent node's children
  list. For example, `[ 0, 0 ]` is the first child of the first child. Pass `[]`
  to return the root node (which is the same as calling `getData()`).

- **nodeWithValue(*value*)**: gets the (first) node whose `value` property matches the given value.

- **nodeWithId(*id*)**: each node has a unique ID, which is also attached to its
  associated DOM node via the `data-node-id` attribute. This can be useful for
  event handling.

- **render(*depth*)**: renders the tree in its element, optionally limited to
  the given nesting depth.

Nodes also have a couple of methods you can call on them:

- **select()**: marks the node as selected, also cascading the effect as
  appropriate up and down the tree, and updating the affected nodes' associated
  HTML element's CSS classes.

- **deselect()**: the inverse of `select()`.

A node's selection state is represented by its `state` property, which is one of
`SimpleTreeView.UNSELECTED` (0), `SimpleTreeView.PARTIAL` (1) or
`SimpleTreeView.SELECTED` (2).

In addition, nodes have an `elements` property which contains a reference to
each HTML element making up the rendered node: `label`, `checkbox`, `expander`,
`childList` and `el` (the `<li>` of the node itself, or a `<div>` for the root
node). Obviously you should **be careful modifying this property**, lest you
confuse the tree.
