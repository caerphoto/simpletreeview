/*global _, $ */
(function () {
    var self = this;
    var D = self.document;

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

    var TreeNode = function (nodeAttrs, parent, tree) {
        // Create a new node based on the given node data, filling in missing
        // properties if possible, assingning the given parent to it, then
        // recursively process each of its children, if any.

        if (!nodeAttrs) {
            throw 'Attempted to call prepareNode with no data';
        }

        // A node with no label or value property is invalid, unless it's
        // the root node.
        if (parent && !_(nodeAttrs).has('label') && !_(nodeAttrs).has('value')) {
            throw 'Encountered tree node with no label or value';
        }

        if (_(nodeAttrs).has('value') && !_(nodeAttrs).has('label')) {
            this.value = nodeAttrs.value;
            this.label = nodeAttrs.value;
        }

        if (_(nodeAttrs).has('label') && !_(nodeAttrs).has('value')) {
            this.label = nodeAttrs.label;
            this.value = nodeAttrs.label;
        }

        if (_(nodeAttrs).has('label') && _(nodeAttrs).has('value')) {
            this.label = nodeAttrs.label;
            this.value = nodeAttrs.value;
        }

        this.tree = tree;
        this.parent = parent;
        this.state = UNSELECTED;
        this.id = _.uniqueId('STV_');
        this.elements = null;

        if (_(nodeAttrs).has('children') && _(nodeAttrs.children).isArray() &&
            nodeAttrs.children.length) {
            this.children = _(nodeAttrs.children).map(function (child) {
                return new TreeNode(child, this, tree);
            }, this);
        } else {
            this.children = [];
        }
        if (tree.__nodeHash[this.id]) {
            throw new TreeDataError('ID of ' + this.id + 'already exists');
        }
        this.tree.__nodeHash[this.id] = this;
    };

    function setChildrenState(node, state) {
        _(node.children).each(function (child) {
            child.state = state;
            setNodeElementStateClass(child);
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

        setNodeElementStateClass(parent);
        setAnscestorState(parent);
    }

    function setNodeElementStateClass(node) {
        var $el;
        if (!node.elements) {
            // Node has not been rendered yet.
            return;
        }
        $el = node.elements.$el;
        if (node.state === SELECTED) {
            $el.removeClass('stv-unselected stv-partially-selected');
            $el.addClass('stv-selected');
        } else if (node.state === PARTIAL) {
            $el.removeClass('stv-unselected stv-selected');
            $el.addClass('stv-partially-selected');
        } else {
            $el.removeClass('stv-partially-selected stv-selected');
            $el.addClass('stv-unselected');
        }
    }

    _(TreeNode.prototype).extend({
        __createElements: function (recurseDepth, appendToParentList) {
            var el;
            var label = D.createElement('label');
            var checkbox = D.createElement('span');
            var expander = D.createElement('span');
            var childList;

            if (this.parent) {
                // Node is a child, so put its elements in an <li>
                el = D.createElement('li');
                el.className = 'stv-child-node';
            } else {
                // Node is the root, so add its elements to the tree's element
                el = this.tree.__rootElement;
                el.className = 'stv-root-node';
            }
            el.setAttribute('data-node-id', this.id);
            el.setAttribute('data-value', this.value);
            el.className += ' stv-node';

            label.className = 'stv-label';
            if (this.tree.__options.HTMLLabels) {
                label.innerHTML = this.label;
            } else {
                label.appendChild(D.createTextNode(this.label));
            }

            checkbox.className = 'stv-checkbox';
            if (this.state === UNSELECTED) {
                el.className += ' stv-unselected';
            } else if (this.state === PARTIAL) {
                el.className += ' stv-partially-selected';
            } else {
                el.className += ' stv-selected';
            }

            expander.className = 'stv-expander';
            if (recurseDepth === 0 && this.children.length > 0) {
                el.className += ' stv-collapsed';
            } else if (this.children.length > 0) {
                el.className += ' stv-expanded';
            }

            el.appendChild(expander);
            el.appendChild(checkbox);
            el.appendChild(label);

            if (this.children.length > 0) {
                childList = D.createElement('ul');
                childList.className = 'stv-child-list';
                el.appendChild(childList);
                el.className += ' stv-parent';
            } else {
                childList = null;
                el.className += ' stv-leaf';
            }

            // Check recurseDepth against exactly 0 so that -1 can be passed to
            // mean 'indefinite'.
            if (this.children.length > 0 && recurseDepth !== 0) {
                _(this.children).each(function (child) {
                    child.__createElements((recurseDepth || 0) - 1);
                    childList.appendChild(child.elements.el);
                });
            }

            // This parameter is used when creating elements for a
            // newly-expanded child list that was beyond the original recurse
            // depth.
            if (appendToParentList) {
                this.parent.elements.childList.appendChild(el);
            }

            this.elements = {
                label: label,
                childList: childList,
                checkbox: checkbox,
                expander: expander,
                el: el,
                $el: $(el)
            };
        },
        select: function () {
            this.state = SELECTED;
            setNodeElementStateClass(this);
            setChildrenState(this, this.state);
            setAnscestorState(this);
            return this;
        },
        deselect: function () {
            this.state = UNSELECTED;
            setNodeElementStateClass(this);
            setChildrenState(this, this.state);
            setAnscestorState(this);
            return this;
        }
    });

    // #########  TREE  #########
    var SimpleTreeView = function (opts) {
        var o;

        this.__root = {};
        this.__options = {
            HTMLLabels: false
        };
        this.__el = null;

        // Every node in the tree has an entry in the hash, keyed by the node's
        // unique id.
        this.__nodeHash = {};

        this.__rootElement = D.createElement('div');
        this.__$rootElement = $(this.__rootElement);

        _(this.__options).extend(opts);
        o = this.__options;

        if (o.data) {
            this.setData(o.data);
        }
        if (o.element) {
            this.setElement(o.element);
        }
        if (o.initialSelection) {
            this.setSelection(o.initialSelection);
        }
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

    function findNodeWithValue(root, value) {
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

            node = findNodeWithValue(root.children[i], value);
            if (node) {
                return node;
            }
        }
    }

    function toggleNodeExpansion(node) {
        node.elements.$el.toggleClass('stv-collapsed');
        node.elements.$el.toggleClass('stv-expanded');
        if (node.elements.$el.hasClass('stv-expanded') && node.children.length > 0) {
            _(node.children).each(function (child) {
                if (!child.elements) {
                    child.__createElements(0, true);
                }
            });
        }
    }

    function isElement(el) {
        // IE8 doesn't know about the global Node DOM object
        var ELEMENT_NODE = 1;
        var DOCUMENT_FRAGMENT_NODE = 11;
        return el.nodeType && (el.nodeType === ELEMENT_NODE ||
            el.nodeType === DOCUMENT_FRAGMENT_NODE);
    }

    _(SimpleTreeView.prototype).extend({
        getData: function () {
            return this.__root;
        },
        copyData: function () {
            return copyNode(this.__root);
        },
        setData: function (data) {
            this.__root = new TreeNode(data, null, this);
            return this;
        },
        nodeAt: function (loc) {
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
        },
        nodeWithValue: function (value) {
            var root = this.getData();
            if (!root.children) {
                throw new TreeDataError('Tree has no data');
            }

            return findNodeWithValue(this.getData(), value);
        },
        nodeWithId: function (id) {
            return this.__nodeHash[id];
        },
        getElement: function () {
            return this.__el;
        },
        setElement: function (el) {
            if (!el) {
                throw new TypeError('Unable to set element to' + el);
            }

            if (!isElement(el)) {
                throw new TypeError('Expected Element (1) or Fragment (11), got ' +
                    el.nodeType);
            }
            this.__el = el;
            this.__$el = $(el);
            this.__setEventHandlers();
            return this;
        },
        getSelectedNodes: function (node) {
            var selection = [];
            var childSelection;

            if (!node) {
                node = this.__root;
            }

            if (node.state === SELECTED) {
                selection.push(node);
            } else if (node.state === PARTIAL) {
                _.each(node.children, function (child) {
                    if (child.state === SELECTED) {
                        selection.push(child);
                    } else if (child.state === PARTIAL) {
                        childSelection = this.getSelectedNodes(child);
                        selection = selection.concat(childSelection);
                    }
                }, this);
            }

            return selection;
        },
        getSelection: function () {
            return _(this.getSelectedNodes()).pluck('value');
        },
        setSelection: function (selection) {
            var currentSelection = this.getSelectedNodes();

            _(currentSelection).each(function (node) {
                node.deselect();
            });

            if (_.isString(selection)) {
                this.nodeWithValue(selection).select();
                return this;
            }

            if (_.isArray(selection)) {
                _(selection).each(function (value) {
                    this.nodeWithValue(value).select();
                }, this);
                return this;
            }

            throw new TypeError('Expected string or array when setting selection, but got ' + (typeof selection));
        },
        __setEventHandlers: function () {
            var tree = this;
            this.__$rootElement.on('click', '.stv-checkbox', function () {
                var nodeId = this.parentNode.getAttribute('data-node-id');
                var node = tree.nodeWithId(nodeId);
                if (!node) {
                    throw new Error('Unable to handle click on element with node id ' + nodeId + ': node not found');
                }
                if (node.state === SELECTED) {
                    node.deselect();
                } else {
                    node.select();
                }
            });

            this.__$rootElement.on('click', '.stv-expander', function () {
                var nodeId = this.parentNode.getAttribute('data-node-id');
                var node = tree.nodeWithId(nodeId);
                if (!node) {
                    throw new Error('Unable to handle click on element with node id ' + nodeId + ': node not found');
                }
                toggleNodeExpansion(node);
            });
        },
        render: function (recurseDepth) {
            if (!this.__el || !isElement(this.__el)) {
                throw new TypeError('Unable to render tree with no valid element');
            }
            recurseDepth = _.isNumber(recurseDepth) ? recurseDepth : -1;
            this.__root.__createElements(recurseDepth);

            this.__el.appendChild(this.__rootElement);
        }
    });

    SimpleTreeView.NodeLocationError = NodeLocationError;
    SimpleTreeView.TreeDataError = TreeDataError;
    SimpleTreeView.UNSELECTED = UNSELECTED;
    SimpleTreeView.PARTIAL = PARTIAL;
    SimpleTreeView.SELECTED = SELECTED;

    self.SimpleTreeView = SimpleTreeView;
}).call(this);
