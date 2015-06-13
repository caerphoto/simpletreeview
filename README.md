# SimpleTreeView

A JavaScript treeview control that leaves the styling up to you, so you can
customise it to fit your application without the hassle of overriding tons of
existing CSS rules.

**NOTE:** this project is very much work-in-progress, so for now it's not
actually useful for anything.

## Dependencies

STV requires [Underscore.js](http://underscorejs.org/), at minimum. It also uses
[Mustache.js](https://github.com/janl/mustache.js/) by default for rendering
nodes, but you can (or will be able to, eventually) override this by providing
your own render function.

## Basic Usage

The main thing you need to supply the control is a tree data structure, since it
obviously won't be much use without one. The tree should look something like
this:

```javascript
treeData = {
    label: 'Root node',
    value: '*',
    expanded: true,
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

