/*global exports:true, module, _ */
(function () {
    var UNSELECTED = 0;
    var PARTIAL = 1;
    var SELECTED = 2;

    var Node = function (node, parent) {

        if (!node) {
            throw 'Attempted to call prepareNode with no data';
        }

        // A node with no label or value property is invalid, unless it's
        // the root node.
        if (parent && !_(node).has('label') && !_(node).has('value')) {
            throw 'Encountered tree node with no label or value';
        }

        if (_(node).has('value') && !_(node).has('label')) {
            this.value = node.value;
            this.label = node.value;
        }

        if (_(node).has('label') && !_(node).has('value')) {
            this.label = node.label;
            this.value = node.label;
        }

        if (_(node).has('label') && _(node).has('value')) {
            this.label = node.label;
            this.value = node.value;
        }

        this.parent = parent;
        this.state = node.hasOwnProperty('state') ?
            node.state : UNSELECTED;

        if (_(node).has('children') && _(node.children).isArray() &&
            node.children.length) {
            this.children = _(node.children).map(function (child) {
                return new Node(child, this);
            }, this);
        } else {
            this.children = [];
        }
    };

    function setChildrenState(node, state) {
        _(node.children).each(function (child) {
            child.state = state;
            setChildrenState(child, state);
        });
        return state;
    }

    function setAnscestorState(node) {
        var parent;
        var allSelected;
        var allUnselected;

        if (!node || !node.parent) {
            return;
        }

        parent = node.parent;
        allSelected = _(parent.children).every(function (child) {
            return child.state === SELECTED;
        });
        allUnselected = _(parent.children).every(function (child) {
            return child.state === UNSELECTED;
        });

        if (allSelected) {
            parent.state = SELECTED;
        } else if (allUnselected) {
            parent.state = UNSELECTED;
        } else {
            parent.state = PARTIAL;
        }

        setAnscestorState(parent);
        return parent.state;
    }

    Node.prototype.select = function () {
        this.state = SELECTED;
        setChildrenState(this, this.state);
        setAnscestorState(this);
    };

    Node.prototype.deselect = function () {
        this.state = UNSELECTED;
        setChildrenState(this, this.state);
        setAnscestorState(this);
    };

    var SimpleTreeView = function (opts) {
        var root = {};
        var options = {};

        _(options).extend(opts);

        // Process the given node, filling in missing properties if possible,
        // assingning the given parent to it, then recursively process each of
        // its children, if any.
        function copyNode(node) {
            return {
                label: node.label,
                value: node.value,
                parent: node.parent,
                state: node.state,
                children: _(node.children).map(copyNode)
            };
        }

        this.getData = function () {
            return root;
        };

        this.copyData = function () {
            return copyNode(root);
        };

        this.setData = function (data) {
            root = new Node(data);
        };

        if (options.data) {
            this.setData(options.data);
        }
    };

    SimpleTreeView.UNSELECTED = UNSELECTED;
    SimpleTreeView.PARTIAL = PARTIAL;
    SimpleTreeView.SELECTED = SELECTED;

    var self = this;
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = SimpleTreeView;
        }
        exports.SimpleTreeView = SimpleTreeView;
    } else {
        self.SimpleTreeView = SimpleTreeView;
    }
}).call(this);