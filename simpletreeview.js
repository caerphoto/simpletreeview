(function (root, factory) {
     if (typeof define === 'function' && define.amd) {
        define(['jquery', 'underscore'], factory);
    } else {
        root.SimpleTreeView = factory(root.jQuery, root._);
    }
}(this, function ($, _) {
    var D = window.document;

    var UNSELECTED = 0;
    var PARTIAL = 1;
    var SELECTED = 2;

    var STRINGS = {
        searchLabel: 'Search',
        allMatch: '(no search term)',
        someMatch: '# match'
    };

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

    // Slightly more convenient and less verbose helper.
    function appendText(node, text) {
        return node.appendChild(document.createTextNode(text));
    }

    // Node helper functions ---------------------------------------------------

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

    function createElements(recurseDepth, appendToParentList) {
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
            appendText(label, this.label);
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
                createElements.call(child, (recurseDepth || 0) - 1);
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
    }

    // Main tree node object ---------------------------------------------------

    var TreeNode = {
        create: function (attrs, parent, tree) {
            var node;
            function N() {}
            N.prototype = TreeNode.prototype;
            node = new N();

            // Create a new node based on the given node data, filling in missing
            // properties if possible, assingning the given parent to it, then
            // recursively process each of its children, if any.

            if (!attrs) {
                throw 'Attempted to call prepareNode with no data';
            }

            // A node with no label or value property is invalid, unless it's
            // the root node.
            if (parent && !_(attrs).has('label') && !_(attrs).has('value')) {
                throw 'Encountered tree node with no label or value';
            }

            if (_(attrs).has('value') && !_(attrs).has('label')) {
                node.value = attrs.value;
                node.label = attrs.value;
            }

            if (_(attrs).has('label') && !_(attrs).has('value')) {
                node.label = attrs.label;
                node.value = attrs.label;
            }

            if (_(attrs).has('label') && _(attrs).has('value')) {
                node.label = attrs.label;
                node.value = attrs.value;
            }

            node.tree = tree;
            node.parent = parent;
            node.state = UNSELECTED;
            node.id = _.uniqueId('STV_');
            node.elements = null;

            if (_(attrs).has('children') && _(attrs.children).isArray() &&
                attrs.children.length) {
                node.children = _(attrs.children).map(function (child) {
                    return TreeNode.create(child, node, tree);
                }, node);
            } else {
                node.children = [];
            }
            if (tree.__nodeHash[node.id]) {
                throw new TreeDataError('ID of ' + node.id + 'already exists');
            }
            node.tree.__nodeHash[node.id] = node;

            return node;
        }
    };

    TreeNode.prototype = {
        toString: function () {
            return this.value;
        },
        valueOf: function () {
            return this.value;
        },

        labelOrValueMatches: function (lowerCaseTerm) {
            var label = this.label.toLowerCase();
            var value;
            if (label.indexOf(lowerCaseTerm) !== -1) {
                return true;
            }

            value = this.value.toLowerCase();
            if (value.indexOf(lowerCaseTerm) !== -1) {
                return true;
            }

            return false;
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
    };

    // Tree helper functions ---------------------------------------------------

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

    function findNodes(root, lowerCaseTerm) {
        // Return all nodes whose value or label match the given term.
        var nodes = [];

        if (!root) {
            return nodes;
        }

        if (root.labelOrValueMatches(lowerCaseTerm)) {
            nodes.push(root);
        }

        if (root.children.length === 0) {
            return nodes;
        }

        _.each(root.children, function (child) {
            nodes = nodes.concat(findNodes(child, lowerCaseTerm));
        });
        return nodes;
    }

    function toggleNodeExpansion(node, expanded) {
        if (expanded) {
            node.elements.$el.removeClass('stv-collapsed');
            node.elements.$el.addClass('stv-expanded');
        } else {
            node.elements.$el.toggleClass('stv-collapsed');
            node.elements.$el.toggleClass('stv-expanded');
        }

        if (node.elements.$el.hasClass('stv-expanded') && node.children.length > 0) {
            _(node.children).each(function (child) {
                if (!child.elements) {
                    createElements.call(child, 0, true);
                }
            });
        }
    }

    function ensureElements(node) {
        if (node.parent && !node.parent.elements) {
            ensureElements(node.parent);
        }
        if (node.parent) {
            toggleNodeExpansion(node.parent, true);
        }

    }

    function isElement(el) {
        // IE8 doesn't know about the global Node DOM object
        var ELEMENT_NODE = 1;
        var DOCUMENT_FRAGMENT_NODE = 11;
        return el.nodeType && (el.nodeType === ELEMENT_NODE ||
            el.nodeType === DOCUMENT_FRAGMENT_NODE);
    }

    // Main tree object --------------------------------------------------------

    var SimpleTreeView = {
        create: function (opts) {
            var o;

            var tree;
            function T() {}
            T.prototype = SimpleTreeView.prototype;
            tree = new T();

            tree.__root = {};
            tree.__options = {
                HTMLLabels: false,
                filter: true,
                filterDelay: 500
            };
            tree.__el = null;

            // Every node in the tree has an entry in the hash, keyed by the node's
            // unique id.
            tree.__nodeHash = {};

            tree.__rootElement = D.createElement('div');
            tree.__$rootElement = $(tree.__rootElement);

            _(tree.__options).extend(opts);
            o = tree.__options;

            if (o.data) {
                tree.setData(o.data);
            }

            if (o.filter) {
                tree.__createFilterElements();
            }

            if (o.element) {
                tree.setElement(o.element);
            }
            if (o.initialSelection) {
                tree.setSelection(o.initialSelection);
            }

            tree.matchingNodes = [];

            return tree;
        },
        NodeLocationError: NodeLocationError,
        TreeDataError: TreeDataError,
        UNSELECTED: UNSELECTED,
        PARTIAL: PARTIAL,
        SELECTED: SELECTED
    };

    SimpleTreeView.prototype = {
        getData: function () {
            return this.__root;
        },
        copyData: function () {
            return copyNode(this.__root);
        },
        setData: function (data) {
            this.__root = TreeNode.create(data, null, this);
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

            _(currentSelection).invoke('deselect');

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
        getMatching: function () {
            return this.matchingNodes;
        },

        __createFilterElements: function () {
            // Set up the filter input box and 'Select Matching' button. Event
            // handlers are set up separately in __setEventHandlers().

            var elFilterControls = this.elFilterControls = document.createElement('div');
            var elMatchCount = this.elMatchCount = document.createElement('span');
            var elFilter = this.elFilter = document.createElement('input');
            var label = document.createElement('label');
            var elSelectMatching =
                this.elSelectMatching =
                document.createElement('button');

            elFilterControls.className = 'stv-filter-controls';

            elFilter.className = 'stv-filter-input form-control';

            // Previously was 'search' but IE8 doesn't like it.
            elFilter.type = 'text';

            appendText(label, STRINGS.searchLabel);
            label.className = 'stv-filter-label';

            elMatchCount.className = 'stv-match-count';
            appendText(elMatchCount, STRINGS.allMatch);

            // 'btn' class for compatibility with misc frameworks
            elSelectMatching.className = 'btn stv-select-matching';
            appendText(elSelectMatching, 'Select');

            elFilterControls.appendChild(label);
            elFilterControls.appendChild(elFilter);
            elFilterControls.appendChild(elMatchCount);
            elFilterControls.appendChild(elSelectMatching);

            this.$elFilter = $(this.elFilter);
            this.$elSelectMatching = $(this.elSelectMatching);
        },

        __applyFilter: function (term) {
            var matchingNodes;
            var matchText = STRINGS.allMatch;

            this.__$el.toggleClass('stv-filtering', !!term);

            this.__$rootElement.
                find('.stv-filter-match').
                removeClass('stv-filter-match');
            this.__$rootElement.
                find('.stv-filter-descendant-match').
                removeClass('stv-filter-descendant-match');

            if (!term) {
                this.matchingNodes = [];
                this.elMatchCount.innerHTML = matchText;
                return;
            }

            matchingNodes = findNodes(this.getData(), term.toLowerCase());

            _(matchingNodes).each(function (node) {
                ensureElements(node);
                node.elements.$el.addClass('stv-filter-match');
                node.elements.$el.parentsUntil(this.__$el, '.stv-node').addClass('stv-filter-descendant-match');
            });

            this.matchingNodes = matchingNodes;

            matchText = STRINGS.someMatch +
                (matchingNodes.length !== 1 ? 'es' : '');

            this.elMatchCount.innerHTML =
                matchText.replace('#', matchingNodes.length);
        },

        __selectMatching: function () {
            _(this.matchingNodes).invoke('select');
        },

        __setEventHandlers: function () {
            var tree = this;

            this.__$rootElement.on('click', '.stv-checkbox, .stv-label', function () {
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

            if (!this.elFilter) {
                return;
            }

            this.$elFilter.on('keyup input', function () {
                var term = this.value;
                var delay = tree.__options.filterDelay;

                if (delay === false) {
                    tree.__applyFilter(term);
                } else {
                    clearTimeout(tree.__filterTimeout);
                    tree.__filterTimeout = setTimeout(function () {
                        tree.__applyFilter(term);
                    }, 500);
                }
            });

            this.$elSelectMatching.on('click', function () {
                tree.__selectMatching();
            });
        },
        render: function (recurseDepth) {
            if (!this.__el || !isElement(this.__el)) {
                throw new TypeError('Unable to render tree with no valid element');
            }
            recurseDepth = _.isNumber(recurseDepth) ? recurseDepth : -1;
            createElements.call(this.__root, recurseDepth);

            if (this.elFilterControls) {
                this.__el.appendChild(this.elFilterControls);
            }

            this.__el.appendChild(this.__rootElement);
        }
    };

    return SimpleTreeView;
}));
