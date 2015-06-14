/*global exports:true, module, _, Mustache */
(function () {
    var UNSELECTED = 0;
    var PARTIAL = 1;
    var SELECTED = 2;

    function NodeLocationError(loc) {
        this.loc = loc || [];
        this.name = 'NodeLocationError';
        this.message = ' is not a valid node location.';
        this.toString = function () {
            return this.loc.join(' ') + this.message;
        };
    }

    NodeLocationError.prototype = new Error();
    NodeLocationError.prototype.constructor = NodeLocationError;

    function TreeDataError(message) {
        this.message = message || '';
        this.name = 'TreeDataError';
        this.toString = function () {
            return this.message;
        };
    }
    TreeDataError.prototype = new Error();
    TreeDataError.prototype.constructor = TreeDataError;

    var defaultTreeTemplate;
    var defaultNodeTemplate;

    (function () {
        function ready() {
            defaultTreeTemplate = document.getElementById('STV_tree_template');
            defaultNodeTemplate = document.getElementById('STV_node_template');

            if (defaultTreeTemplate && defaultTreeTemplate.innerHTML.length > 0) {
                defaultTreeTemplate = defaultTreeTemplate.innerHTML;
            }
            if (defaultNodeTemplate && defaultNodeTemplate.innerHTML.length > 0) {
                defaultNodeTemplate = defaultNodeTemplate.innerHTML;
            }
        }

        function readyStateChange() {
            if (document.readyState === 'complete') {
                ready();
            }
        }

        if (document.readyState === 'complete') {
            setTimeout(ready, 1);
        } else {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', ready, false);
                window.addEventListener('load', ready, false);
            } else {
                document.attachEvent('onreadystatechange', readyStateChange);
                window.attachEvent('onload', ready);
            }
        }
    }());

    var TreeNode = function (node, parent, tree) {
        // Create a new node based on the given node data, filling in missing
        // properties if possible, assingning the given parent to it, then
        // recursively process each of its children, if any.

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

        this.tree = tree;
        this.parent = parent;
        this.state = node.hasOwnProperty('state') ?
            node.state : UNSELECTED;

        this.id = _.uniqueId('STV_');

        if (_(node).has('children') && _(node.children).isArray() &&
            node.children.length) {
            this.children = _(node.children).map(function (child) {
                return new TreeNode(child, this, tree);
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
    }

    TreeNode.prototype.select = function () {
        this.state = SELECTED;
        setChildrenState(this, this.state);
        setAnscestorState(this);
        return this;
    };

    TreeNode.prototype.deselect = function () {
        this.state = UNSELECTED;
        setChildrenState(this, this.state);
        setAnscestorState(this);
        return this;
    };

    TreeNode.prototype.render = function () {
        var view = {
            label: this.label,
            value: this.value,
            id: this.id,
            children: this.children,
            renderChild: function () {
                return this.render();
            }
        };
        return Mustache.render(this.tree.__nodeTemplate, view);
    };

    // #########  TREE  #########
    var SimpleTreeView = function (opts) {
        var o;

        this.__root = {};
        this.__options = {};
        this.__el = null;
        this.__treeTemplate = defaultTreeTemplate || null;
        this.__nodeTemplate = defaultNodeTemplate || null;

        _(this.__options).extend(opts);
        o = this.__options;

        if (o.data) {
            this.setData(o.data);
        }
        if (o.el) {
            this.setElement(o.el);
        }
        if (o.treeTemplate) {
            this.setTreeTemplate(o.treeTemplate);
        }
        if (o.nodeTemplate) {
            this.setNodeTemplate(o.nodeTemplate);
        }
    };

    SimpleTreeView.prototype.getData = function () {
        return this.__root;
    };

    function copyNode(node) {
        return {
            label: node.label,
            value: node.value,
            parent: node.parent,
            state: node.state,
            children: _(node.children).map(copyNode)
        };
    }

    SimpleTreeView.prototype.copyData = function () {
        return copyNode(this.__root);
    };

    SimpleTreeView.prototype.setData = function (data) {
        this.__root = new TreeNode(data, null, this);
        return this;
    };

    SimpleTreeView.prototype.nodeAt = function (loc) {
        var node = this.getData();
        if (!node.children) {
            throw new TreeDataError('Tree has no data');
        }

        _(loc).each(function (index) {
            if (node.children.length > 0 && node.children[index]) {
                node = node.children[index];
            } else {
                throw new NodeLocationError(loc);
            }
        }, this);
        return node;
    };

    function findNode(root, value) {
        var i, l;
        var node;

        if (root.value === value) {
            return root;
        }

        if (root.children.length === 0) {
            return;
        }

        for (i = 0, l = root.children.length; i < l; i += 1) {
            if (root.children[i].value === value) {
                return root.children[i];
            }

            node = findNode(root.children[i], value);
            if (node) {
                return node;
            }
        }
    }

    SimpleTreeView.prototype.nodeWithValue = function (value) {
        var root = this.getData();
        if (!root.children) {
            throw new TreeDataError('Tree has no data');
        }

        return findNode(this.getData(), value);
    };

    SimpleTreeView.prototype.getElement = function () {
        return this.__el;
    };

    SimpleTreeView.prototype.setElement = function (el) {
        if (!el) {
            throw new TypeError('Unable to set element to' + el);
        }

        if (!el.nodeType || (el.nodeType !== Node.ELEMENT_NODE &&
            el.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)) {
            throw new TypeError('Expected Element (1) or Fragment (11), got ' + el.nodeType);
        }
        this.__el = el;
        return this;
    };

    SimpleTreeView.prototype.getTreeTemplate = function () {
        return this.__treeTemplate;
    };

    SimpleTreeView.prototype.setTreeTemplate = function (template) {
        if (!_(template).isString()) {
            throw new TypeError('Given template is not a string');
        }
        this.__treeTemplate = template;
        return this;
    };

    SimpleTreeView.prototype.getNodeTemplate = function () {
        return this.__nodeTemplate;
    };

    SimpleTreeView.prototype.setNodeTemplate = function (template) {
        if (!_(template).isString()) {
            throw new TypeError('Given template is not a string');
        }
        this.__nodeTemplate = template;
        return this;
    };

    SimpleTreeView.prototype.html = function () {
        var root;
        var view;
        if (!this.__treeTemplate) {
            throw new TypeError('Tree template is invalid: ' + this.__treeTemplate);
        }

        // This is very similar to Node.render, except it uses __treeTemplate
        // instead of __nodeTemplate, because they are likely to be different.
        root = this.__root;
        view = {
            label: root.label,
            value: root.value,
            id: root.id,
            children: root.children,
            renderChild: function () {
                return this.render();
            }
        };
        return Mustache.render(this.__treeTemplate, view);
    };

    SimpleTreeView.NodeLocationError = NodeLocationError;
    SimpleTreeView.TreeDataError = TreeDataError;
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
