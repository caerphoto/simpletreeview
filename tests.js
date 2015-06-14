/*global SimpleTreeView, beforeEach, describe, it, expect */
describe('Tree creation', function () {
    it('can be done without specifying parameters', function () {
        var tree;
        expect(function () {
            tree = new SimpleTreeView();
        }).not.toThrow();
    });

    it('accepts a data property to build a basic tree', function () {
        var testData = {
            value: 'root-node'
        };
        var tree = new SimpleTreeView({ data: testData });

        expect(tree.getData().value).toEqual(testData.value);
    });

    it('uses a node\'s label for its value if no label is given', function () {
        var testData = {
            label: 'Root Node'
        };
        var tree = new SimpleTreeView({ data: testData });

        var node = tree.getData();

        expect(node.label).toEqual(node.value);
    });

    it('uses a node\'s value for its label if no value is given', function () {
        var testData = {
            value: 'root-node'
        };
        var tree = new SimpleTreeView({ data: testData });

        var node = tree.getData();

        expect(node.value).toEqual(node.label);
    });

    it ('adds missing properties if necessary', function () {
        var testData = {
            label: 'Root Node',
            value: 'root-node',
            children: [
                { label: 'Child 1', value: 'child1' },
                { label: 'Child 2', value: 'child2' }
            ]
        };
        var tree = new SimpleTreeView({ data: testData });

        var data = tree.getData();

        expect(data.hasOwnProperty('parent')).toBe(true);
        expect(data.hasOwnProperty('state')).toBe(true);
    });
});

describe('An existing tree', function () {
    var testData = {
        value: 'root',
        children: [
            { value: 'child0', children: [
                { value: 'child00' }
            ] },
            { value: 'child1' }
        ]
    };

    it('can have new tree data assigned to it', function () {
        var tree = new SimpleTreeView({ data: testData });

        testData.children.push({
            label: 'New Thing'
        });

        tree.setData(testData);
        expect(tree.getData().children.length).toEqual(3);
    });

    it('can have its data modified', function () {
        var tree = new SimpleTreeView({ data: testData });

        var data = tree.getData();
        data.label = 'CHANGED';

        expect(tree.getData().label).toEqual('CHANGED');
    });

    it('can create a deep copy of its data', function () {
        var tree = new SimpleTreeView({ data: testData });
        var dataCopy1 = tree.copyData();
        var dataCopy2 = tree.copyData();

        dataCopy1.children[0].label = 'CHANGED';

        expect(testData.children[0].label).not.toEqual('CHANGED');
        expect(dataCopy2.children[0].label).not.toEqual('CHANGED');
    });

    it('can get a node by location', function () {
        var tree = new SimpleTreeView({ data: testData });
        var node = tree.nodeAt([ 0, 0 ]);
        expect(node.value).toEqual(testData.children[0].children[0].value);
    });

    it('throws a NodeLocationError when getting a node at an invalid location', function () {
        var tree = new SimpleTreeView({ data: testData });
        expect(function () {
            tree.nodeAt([ 1, 0 ]);
        }).toThrowError(SimpleTreeView.NodeLocationError);
    });

    it('throws a TreeDataError when locating nodes if it has no data', function () {
        var tree = new SimpleTreeView();
        expect(function () {
            tree.nodeAt([ 0 ]);
        }).toThrowError(SimpleTreeView.TreeDataError);
    });

    it('can get a node by value', function () {
        var tree = new SimpleTreeView({ data: testData });
        var node = tree.nodeWithValue('child00');

        expect(node).toBeDefined();
        expect(node.value).toEqual('child00');
    });

    it('thows a TreeDataError when finding nodes if it has no data', function () {
        var tree = new SimpleTreeView();

        expect(function () {
            tree.nodeWithValue('42');
        }).toThrowError(SimpleTreeView.TreeDataError);
    });
});

describe('A node', function () {
    var testData = {
        value: 'root',
        children: [
            { value: 'child0', children: [
                { value: 'child00' }
            ] },
            { value: 'child1' }
        ]
    };

    var SELECTED = SimpleTreeView.SELECTED;
    var PARTIAL = SimpleTreeView.PARTIAL;
    var UNSELECTED = SimpleTreeView.UNSELECTED;

    it('can be marked as selected', function () {
        var tree = new SimpleTreeView({ data: testData });
        var data = tree.getData();

        data.select();
        expect(data.state).toEqual(SELECTED);
        console.log(tree.html());
    });

    it('selects all of its descendants when selected', function () {
        var tree = new SimpleTreeView({ data: testData });

        var data = tree.getData();
        data.select();

        expect(data.children[0].state).toEqual(SELECTED);
        expect(data.children[0].children[0].state).toEqual(SELECTED);
    });

    it('deselects all of its descendants when deselected', function () {
        var tree = new SimpleTreeView({ data: testData });

        var data = tree.getData();
        data.deselect();

        expect(data.children[0].state).toEqual(UNSELECTED);
        expect(data.children[0].children[0].state).toEqual(UNSELECTED);
    });

    it('marks its parent as partial when siblings are different', function () {
        var tree = new SimpleTreeView({ data: testData });

        var data = tree.getData();
        data.children[1].select();

        expect(data.state).toEqual(PARTIAL);

        data.children[0].select();
        data.children[1].deselect();
        expect(data.state).toEqual(PARTIAL);
    });

    it('marks its parent as selected when siblings are selected', function () {
        var tree = new SimpleTreeView({ data: testData });

        var data = tree.getData();
        data.children[0].select();
        data.children[1].select();
        expect(data.state).toEqual(SELECTED);
    });

    it('marks its parent as unselected when siblings are unselected', function () {
        var tree = new SimpleTreeView({ data: testData });

        var data = tree.getData();
        data.children[0].select();
        data.children[1].select();

        data.children[0].deselect();
        data.children[1].deselect();

        expect(data.state).toEqual(UNSELECTED);
    });

    it('knows about the tree it belongs to', function () {
        var tree = new SimpleTreeView({ data: testData });
        var node = tree.nodeAt([ 0 ]);
        expect(node.tree).toEqual(tree);
    });

    it('has a unique ID', function () {
        var tree = new SimpleTreeView({ data: testData });
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
        var tree = new SimpleTreeView({ el: el });
        expect(tree.getElement()).toEqual(el);
    });

    it('can be assigned after tree creation', function () {
        var tree = new SimpleTreeView();
        tree.setElement(el);
        expect(tree.getElement()).toEqual(el);
    });

    it('must be a valid HTML element or document fragment', function () {
        var tree = new SimpleTreeView();

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

describe('Tree template', function () {
    var basicTestData = {
        value: 'root-node'
    };
    it('has a default, that is a string', function () {
        var tree = new SimpleTreeView();
        var template = tree.getTreeTemplate();
        expect(typeof template === 'string' || template instanceof String).toBe(true);
    });

    it('can be specified when creating the tree', function () {
        var tree = new SimpleTreeView({
            treeTemplate: 'TEMPLATE'
        });
        expect(tree.getTreeTemplate()).toEqual('TEMPLATE');
    });

    it('can be assigned after creating the tree', function () {
        var tree = new SimpleTreeView();
        tree.setTreeTemplate('TEMPLATE');
        expect(tree.getTreeTemplate()).toEqual('TEMPLATE');
    });

    it('can only be assigned a string', function () {
        var tree = new SimpleTreeView();

        expect(function () {
            tree.setTreeTemplate(42);
        }).toThrowError(TypeError);
    });

    it('can be rendered to a string of HTML', function () {
        var tree = new SimpleTreeView({
            data: basicTestData,
            treeTemplate: '{{label}}'
        });

        expect(tree.html()).toEqual(tree.getData().label);
    });
});

describe('Node template', function () {
    var basicTestData = {
        value: 'root-node',
        children: [
            {
                value: 'child0',
                children: [
                    { value: 'child00' }
                ]
            }
        ]
    };
    it('has a default, that is a string', function () {
        var tree = new SimpleTreeView();
        var template = tree.getNodeTemplate();
        expect(typeof template === 'string' || template instanceof String).toBe(true);
    });

    it('can be specified when creating the tree', function () {
        var tree = new SimpleTreeView({
            nodeTemplate: 'TEMPLATE'
        });
        expect(tree.getNodeTemplate()).toEqual('TEMPLATE');
    });

    it('can be assigned after creating the tree', function () {
        var tree = new SimpleTreeView();
        tree.setNodeTemplate('TEMPLATE');
        expect(tree.getNodeTemplate()).toEqual('TEMPLATE');
    });

    it('can only be assigned a string', function () {
        var tree = new SimpleTreeView();

        expect(function () {
            tree.setNodeTemplate(42);
        }).toThrowError(TypeError);
    });

    it('can be rendered to a string of HTML', function () {
        var tree = new SimpleTreeView({
            data: basicTestData,
            treeTemplate: '{{#children}}{{renderChild}}{{/children}}',
            nodeTemplate: '{{value}}'
        });

        expect(tree.html()).toEqual(tree.getData().children[0].value);
    });

    it('renders its child nodes', function () {
        var tree = new SimpleTreeView({
            data: basicTestData,
            treeTemplate: '{{#children}}{{renderChild}}{{/children}}',
            nodeTemplate: '{{value}}{{#children}}{{renderChild}}{{/children}}'
        });
        var child0 = tree.getData().children[0];
        var child00 = child0.children[0];

        expect(tree.html()).toEqual(child0.value + child00.value);
    });
});
