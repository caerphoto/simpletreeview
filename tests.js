/*global $, SimpleTreeView, jasmine, beforeEach, describe, it, expect */
var SELECTED = SimpleTreeView.SELECTED;
var PARTIAL = SimpleTreeView.PARTIAL;
var UNSELECTED = SimpleTreeView.UNSELECTED;

describe('Tree creation', function () {
    it('can be done without specifying parameters', function () {
        var tree;
        expect(function () {
            tree = SimpleTreeView.create();
        }).not.toThrow();
    });

    it('accepts a data property to build a basic tree', function () {
        var testData = {
            value: 'root-node'
        };
        var tree = SimpleTreeView.create({ data: testData });

        expect(tree.getData().value).toEqual(testData.value);
    });

    it('uses a node label for its value if no label is given', function () {
        var testData = {
            label: 'Root Node'
        };
        var tree = SimpleTreeView.create({ data: testData });

        var node = tree.getData();

        expect(node.label).toEqual(node.value);
    });

    it('uses a node value for its label if no value is given', function () {
        var testData = {
            value: 'root-node'
        };
        var tree = SimpleTreeView.create({ data: testData });

        var node = tree.getData();

        expect(node.value).toEqual(node.label);
    });

    it('adds missing properties if necessary', function () {
        var testData = {
            label: 'Root Node',
            value: 'root-node',
            children: [
                { label: 'Child 1', value: 'child1' },
                { label: 'Child 2', value: 'child2' }
            ]
        };
        var tree = SimpleTreeView.create({ data: testData });

        var data = tree.getData();

        expect(data.hasOwnProperty('parent')).toBe(true);
        expect(data.hasOwnProperty('state')).toBe(true);
    });

    it('can apply an initial selection', function () {
        var testData = {
            value: 'root-node',
            children: [
                { value: 'child0' },
                { value: 'child1' }
            ]
        };
        var tree = SimpleTreeView.create({
            data: testData,
            initialSelection: [ 'child1' ]
        });
        expect(tree.getData().children[1].state).toEqual(SELECTED);
    });
});

describe('An existing tree', function () {
    var testData = {
        value: 'root',
        children: [
            { value: 'child0', children: [
                { value: 'child00' },
                { value: 'child01' }
            ] },
            { value: 'child1' }
        ]
    };

    it('can have new tree data assigned to it', function () {
        var tree = SimpleTreeView.create({ data: testData });

        testData.children.push({
            label: 'New Thing'
        });

        tree.setData(testData);
        expect(tree.getData().children.length).toEqual(3);
    });

    it('can have its data modified', function () {
        var tree = SimpleTreeView.create({ data: testData });

        var data = tree.getData();
        data.label = 'CHANGED';

        expect(tree.getData().label).toEqual('CHANGED');
    });

    it('can create a deep copy of its data', function () {
        var tree = SimpleTreeView.create({ data: testData });
        var dataCopy1 = tree.copyData();
        var dataCopy2 = tree.copyData();

        dataCopy1.children[0].label = 'CHANGED';

        expect(testData.children[0].label).not.toEqual('CHANGED');
        expect(dataCopy2.children[0].label).not.toEqual('CHANGED');
    });

    it('can get a node by location', function () {
        var tree = SimpleTreeView.create({ data: testData });
        var node = tree.nodeAt([ 0, 0 ]);
        expect(node.value).toEqual(testData.children[0].children[0].value);
    });

    it('throws a NodeLocationError when getting a node at an invalid location', function () {
        var tree = SimpleTreeView.create({ data: testData });
        expect(function () {
            tree.nodeAt([ 1, 0 ]);
        }).toThrowError(SimpleTreeView.NodeLocationError);
    });

    it('throws a TreeDataError when locating nodes if it has no data', function () {
        var tree = SimpleTreeView.create();
        expect(function () {
            tree.nodeAt([ 0 ]);
        }).toThrowError(SimpleTreeView.TreeDataError);
    });

    it('can get a node by value', function () {
        var tree = SimpleTreeView.create({ data: testData });
        var node = tree.nodeWithValue('child00');

        expect(node).toBeDefined();
        expect(node.value).toEqual('child00');
    });

    it('thows a TreeDataError when finding nodes if it has no data', function () {
        var tree = SimpleTreeView.create();

        expect(function () {
            tree.nodeWithValue('42');
        }).toThrowError(SimpleTreeView.TreeDataError);
    });

    it('can provide a list of fully selected nodes', function () {
        var tree = SimpleTreeView.create({ data: testData });
        var selection;
        tree.nodeWithValue('child00').select();
        tree.nodeWithValue('child01').select();

        selection = tree.getSelection();
        expect(selection[0]).toEqual('child0');
    });

    it('can have a new selection applied, clearing the old one', function () {
        var tree = SimpleTreeView.create({ data: testData });
        var selection = [ 'child0' ];
        tree.setSelection(selection);
        selection = [ 'child01', 'child1' ];
        tree.setSelection(selection);

        selection = tree.getSelection();
        expect(selection[0]).toEqual('child01');
        expect(selection[1]).toEqual('child1');
    });
});

describe('A node', function () {
    var testData;

    beforeEach(function () {
        testData = {
            value: 'root',
            children: [
                { value: 'child0', children: [
                    { value: 'child00' }
                ] },
                { value: 'child1' }
            ]
        };
    });

    it('can be marked as selected', function () {
        var tree = SimpleTreeView.create({ data: testData });
        var data = tree.getData();

        data.select();
        expect(data.state).toEqual(SELECTED);
    });

    it('selects all of its descendants when selected', function () {
        var tree = SimpleTreeView.create({ data: testData });

        var data = tree.getData();
        data.select();

        expect(data.children[0].state).toEqual(SELECTED);
        expect(data.children[0].children[0].state).toEqual(SELECTED);
    });

    it('deselects all of its descendants when deselected', function () {
        var tree = SimpleTreeView.create({ data: testData });

        var data = tree.getData();
        data.deselect();

        expect(data.children[0].state).toEqual(UNSELECTED);
        expect(data.children[0].children[0].state).toEqual(UNSELECTED);
    });

    it('marks its parent as partial when siblings are different', function () {
        var tree = SimpleTreeView.create({ data: testData });

        var data = tree.getData();
        data.children[1].select();

        expect(data.state).toEqual(PARTIAL);

        data.children[0].select();
        data.children[1].deselect();
        expect(data.state).toEqual(PARTIAL);
    });

    it('marks its parent as selected when siblings are selected', function () {
        var tree = SimpleTreeView.create({ data: testData });

        var data = tree.getData();
        data.children[0].select();
        data.children[1].select();
        expect(data.state).toEqual(SELECTED);
    });

    it('marks its parent as unselected when siblings are unselected', function () {
        var tree = SimpleTreeView.create({ data: testData });

        var data = tree.getData();
        data.children[0].select();
        data.children[1].select();

        data.children[0].deselect();
        data.children[1].deselect();

        expect(data.state).toEqual(UNSELECTED);
    });

    it('knows about the tree it belongs to', function () {
        var tree = SimpleTreeView.create({ data: testData });
        var node = tree.nodeAt([ 0 ]);
        expect(node.tree).toEqual(tree);
    });

    it('has a unique ID', function () {
        var tree = SimpleTreeView.create({ data: testData });
        var root = tree.getData();
        var node = tree.nodeAt([ 0 ]);
        expect(root.id).not.toEqual(node.id);
    });
});

describe('DOM element', function () {
    var el;

    beforeEach(function() {
        el = document.createElement('div');
    });

    it('can be assigned when creating the tree', function () {
        var tree = SimpleTreeView.create({ element: el });
        expect(tree.getElement()).toEqual(el);
    });

    it('can be assigned after tree creation', function () {
        var tree = SimpleTreeView.create();
        tree.setElement(el);
        expect(tree.getElement()).toEqual(el);
    });

    it('must be a valid HTML element or document fragment', function () {
        var tree = SimpleTreeView.create();

        expect(function () {
            tree.setElement();
        }).toThrowError(TypeError);

        expect(function () {
            tree.setElement({});
        }).toThrowError(TypeError);

        expect(function () {
            tree.setElement(document.createDocumentFragment());
        }).not.toThrow();
    });
});


describe('Tree rendering', function () {
    var basicTestData = {
        value: 'root-node',
        children: [
            { value: 'child0' }
        ]
    };
    var testData = {
        value: 'root',
        children: [
            { value: 'child0', children: [
                { value: 'child00' },
                { value: 'child01' }
            ] },
            { value: 'child1' }
        ]
    };
    var el;
    var tree;

    beforeEach(function () {
        el = document.createElement('div');
        tree = SimpleTreeView.create({
            data: testData,
            element: el
        });
    });

    it('creates a root element', function () {
        var tree = SimpleTreeView.create({
            data: basicTestData,
            element: el
        });
        var rootElement;

        tree.render(0);
        rootElement = el.querySelector('div > .stv-label');
        expect(rootElement).not.toBeNull();
    });

    it('creates child elements', function () {
        var tree = SimpleTreeView.create({
            data: basicTestData,
            element: el
        });
        var nodes;

        tree.render(-1);
        nodes = el.querySelectorAll('.stv-node');
        expect(nodes.length).toEqual(2);
    });

    it('creates all child elements recursively by default', function () {
        var nodes;
        tree.render();
        nodes = el.querySelectorAll('.stv-node');
        expect(nodes.length).toEqual(5);
    });

    it('can limit child element creation to a given depth', function () {
        var nodes;
        tree.render(1);
        nodes = el.querySelectorAll('.stv-node');
        expect(nodes.length).toEqual(3);
    });

    it('marks leaf nodes correctly', function () {
        var nodes;
        tree.render(-1);
        nodes = el.querySelectorAll('.stv-leaf');
        expect(nodes.length).toEqual(3);

    });

    it('attaches the node value as a data attribute to the node element', function () {
        tree.render(1);
        var node = el.querySelector('[data-value="child0"]');
        expect(node).not.toBeNull();
    });
});

describe('Node checkbox event handling', function () {
    var testData = {
        value: 'root',
        children: [
            { value: 'child0', children: [
                { value: 'child00' },
                { value: 'child01' }
            ] },
            { value: 'child1' }
        ]
    };
    var el;
    var tree;

    beforeEach(function () {
        el = document.createElement('div');
        tree = SimpleTreeView.create({
            data: testData,
            element: el
        });
    });

    it('sets unselected child node state to selected when child checkbox is clicked', function () {
        tree.render();
        var node = tree.nodeWithValue('child00');
        $(node.elements.checkbox).trigger('click');
        expect(node.state).toEqual(SELECTED);
    });

    /* not sure if I want this behaviour or not
    it('sets unselected child node state to selected when child label is clicked', function () {
        tree.render();
        var node = tree.nodeWithValue('child00');
        $(node.elements.label).trigger('click');
        expect(node.state).toEqual(SELECTED);
    });
    */

    it('sets unselected child node element class to "stv-selected" when child checkbox is clicked', function () {
        tree.render();
        var node = tree.nodeWithValue('child00');
        $(node.elements.checkbox).trigger('click');
        expect(node.elements.el.className).toMatch(/stv-selected/);
    });

    it('sets selected child node element class to "stv-unselected" when child checkbox is clicked', function () {
        var node = tree.nodeWithValue('child00');
        node.select();
        tree.render();
        $(node.elements.checkbox).trigger('click');
        expect(node.elements.el.className).toMatch(/stv-unselected/);
    });

    it('sets parent node state to partial when only one child node checkbox is clicked', function () {
        tree.render();
        var node = tree.nodeWithValue('child00');
        $(node.elements.checkbox).trigger('click');
        expect(node.parent.elements.el.className).toMatch(/stv-partially-selected/);
    });

    it('sets parent node state to selected when both child node checkboxes are clicked', function () {
        tree.render();
        var node1 = tree.nodeWithValue('child00');
        var node2 = tree.nodeWithValue('child01');
        $(node1.elements.checkbox).trigger('click');
        $(node2.elements.checkbox).trigger('click');
        expect(node1.parent.elements.el.className).toMatch(/stv-selected/);
    });

    it('sets child node class names to "stv-unselected" when parent node checkbox is clicked', function () {
        var node1 = tree.nodeWithValue('child00');
        var node2 = tree.nodeWithValue('child01');
        node1.select();
        node2.select();
        tree.render();
        $(node1.parent.elements.checkbox).trigger('click');
        expect(node1.elements.el.className).toMatch(/stv-unselected/);
        expect(node2.elements.el.className).toMatch(/stv-unselected/);
    });
});

describe('Node expander event handling', function () {
    var testData = {
        value: 'root',
        children: [
            { value: 'child0', children: [
                { value: 'child00' },
                { value: 'child01' }
            ] },
            { value: 'child1' }
        ]
    };
    var el;
    var tree;

    beforeEach(function () {
        el = document.createElement('div');
        tree = SimpleTreeView.create({
            data: testData,
            element: el
        });
    });

    it('sets the "stv-collapsed" class when clicked on an expanded node', function () {
        var node = tree.nodeWithValue('child0');
        tree.render();
        $(node.elements.expander).trigger('click');
        expect(node.elements.el.className).toMatch(/stv-collapsed/);
        expect(node.elements.el.className).not.toMatch(/stv-expanded/);
    });

    it('sets the "stv-expanded" class when clicked on an collapsed node', function () {
        var node = tree.nodeWithValue('child0');
        tree.render(1);
        $(node.elements.expander).trigger('click');
        expect(node.elements.el.className).toMatch(/stv-expanded/);
        expect(node.elements.el.className).not.toMatch(/stv-collapsed/);
    });

    it('causes child nodes to be rendered as needed when parent is expanded', function () {
        var node = tree.nodeWithValue('child0');
        tree.render(1);
        expect(node.elements.childList.children.length).toEqual(0);
        $(node.elements.expander).trigger('click');
        expect(node.elements.childList.children.length).toEqual(2);
    });

    it('does not render new child nodes when expanding if they already exists', function () {
        var node = tree.nodeWithValue('child0');
        tree.render(1);
        expect(node.elements.childList.children.length).toEqual(0);
        $(node.elements.expander).trigger('click');
        expect(node.elements.childList.children.length).toEqual(2);
        $(node.elements.expander).trigger('click');
        $(node.elements.expander).trigger('click');
        expect(node.elements.childList.children.length).toEqual(2);
    });
});

describe('Tree filtering', function () {
    var testData = {
        value: 'root',
        children: [
            { value: 'child0', children: [
                { value: 'child00' },
                { value: 'child01' }
            ] },
            { value: 'child1' }
        ]
    };
    var el;
    var tree;

    beforeEach(function () {
        el = document.createElement('div');
        tree = SimpleTreeView.create({
            data: testData,
            element: el,
            filterDelay: 300
        });
    });

    it('provides a filter text input box by default', function () {
        var input;
        tree.render();
        input = el.querySelector('input');
        expect(input).not.toBeNull();
        expect(tree.elFilter).toBeDefined();
    });

    it('does not create a filter input if the "filter" option is false', function () {
        tree = SimpleTreeView.create({
            data: testData,
            element: el,
            filter: false
        });

        tree.render();
        expect(tree.elFilter).not.toBeDefined();
    });

    it('sets an appropriate class name on the element when filtering', function () {
        jasmine.clock().install();

        tree.render();
        tree.elFilter.value = 'child';
        $(tree.elFilter).trigger('keyup');

        // Class name is changed after a 500ms delay.
        jasmine.clock().tick(500);
        jasmine.clock().uninstall();

        expect(tree.getElement().className).toMatch(/stv-filtering/);

    });

    it('marks filtered node elements with the correct class', function () {
        jasmine.clock().install();

        tree.render();
        tree.elFilter.value = 'child';
        $(tree.elFilter).trigger('keyup');
        jasmine.clock().tick(500);
        jasmine.clock().uninstall();

        expect($(tree.getElement()).find('.stv-filter-match').length).toEqual(4);

    });

    it('selects matching nodes when Select button is clicked', function () {
        jasmine.clock().install();

        tree.render();
        tree.elFilter.value = 'child0';
        $(tree.elFilter).trigger('keyup');
        jasmine.clock().tick(500);
        $(tree.getElement()).find('.stv-select-matching').trigger('click');
        jasmine.clock().uninstall();

        expect($(tree.getElement()).find('.stv-child-node.stv-selected').length).toEqual(3);
    });
});
