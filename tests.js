/*global SimpleTreeView, describe, it, expect */
describe('Tree initialisation', function () {
    it('can be done without specifying parameters', function () {
        var tree = new SimpleTreeView();
        expect(tree.getData).not.toThrow();
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

});
