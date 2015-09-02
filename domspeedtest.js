/*global $, SimpleTreeView, _ */
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

    var lipsumCounter = 0;

    var loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'.toLowerCase().match(/\w+/g);

    loremIpsum = _.map(loremIpsum, function (word) {
        return word.charAt(0).toUpperCase() + word.substring(1);
    });

    function randomString() {
        var result = loremIpsum[lipsumCounter];
        lipsumCounter += 1;
        if (lipsumCounter === loremIpsum.length) {
            lipsumCounter = 0;
        }
        return result;
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
                label: randomString(),
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

    $(treeElement).on('click', '.stv-checkbox, .stv-select-matching', function () {
        var sel = simpleTreeView.getSelectedNodes();
        selection.innerHTML = _.pluck(sel, 'label').join(', ');
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

        window.tree = simpleTreeView = SimpleTreeView.create({
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


    btn.onclick();


    $('.stv-filter-input').val('amet').trigger('keyup');
}());
