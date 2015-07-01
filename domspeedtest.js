/*global SimpleTreeView, _ */
(function () {
    var btn = document.querySelector('#go');
    var num = document.querySelector('#num');
    var append = document.querySelector('#append');
    var flat = document.querySelector('#flat');
    var treeElement = document.querySelector('#tree');
    var selection = document.querySelector('#selection');
    var nodeCount = document.querySelector('#node_count');
    var timingClear = document.querySelector('#timing_clear');
    var timingCreation = document.querySelector('#timing_creation');
    var timingAppending = document.querySelector('#timing_appending');
    var timingTotal = document.querySelector('#timing_total');
    var simpleTreeView;

    function randomString() {
        var i;
        var l = Math.floor(Math.random() * 11) + 1;
        var s = '';
        var c;
        for (i = 0; i < l; i += 1) {
            c = i === 0 ? 65 : 97;
            s += String.fromCharCode(Math.floor(Math.random() * 26) + c);
        }
        return s;
    }

    function createNodes(parent, max, depth, recurse) {
        var i, l;
        var count = 0;
        if (recurse && parent.value !== '*') {
            l = Math.floor(Math.random() * max);
        } else {
            l = max;
        }

        for (i = 0; i < l; i += 1) {
            parent.children[i] = {
                label:  depth + '/' + i + ': ' + '<a href="#">' + randomString() +
                    '</a>',
                value: depth + '/' + i
            };
            count += 1;
            if (depth > 0 && recurse) {
                parent.children[i].children = [];
                count += createNodes(parent.children[i], max, depth - 1, recurse);
            }
        }
        return count;
    }

    $(treeElement).on('click', '.stv-checkbox', function () {
        var sel = simpleTreeView.getSelectedNodes();
        selection.innerHTML = _.pluck(sel, 'label').join(',');
    });

    btn.onclick = function () {
        var l;
        var count;
        var treeData = {};

        var startTime;
        var clearTime;
        var creationTime;
        var appendingTime;
        var totalTime;

        treeData.label = 'ROOT';
        treeData.value = '*';
        treeData.children = [];

        l = parseInt(num.value, 10);
        count = createNodes(treeData, l, flat.checked ? 1 : 4, !flat.checked);

        startTime = new Date();
        treeElement.innerHTML = '';
        clearTime = new Date();

        simpleTreeView = new SimpleTreeView({
            data: treeData,
            element: treeElement,
            HTMLLabels: true
        });

        creationTime = new Date();

        if (append.checked) {
            simpleTreeView.render(1);
        }

        appendingTime = new Date();
        totalTime = new Date() - startTime;

        appendingTime = appendingTime - creationTime;
        creationTime = creationTime - clearTime;
        clearTime = clearTime - startTime;

        timingClear.innerHTML = clearTime;
        timingCreation.innerHTML = creationTime;
        timingAppending.innerHTML = appendingTime;
        timingTotal.innerHTML = totalTime + ' (<span class="ac">' + (creationTime + appendingTime) + '</span>)';
        nodeCount.innerHTML = count;
    };
}());
