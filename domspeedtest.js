/*global SimpleTreeView */
(function () {
    var btn = document.querySelector('#go');
    var num = document.querySelector('#num');
    var useDom = document.querySelector('#usedom');
    var append = document.querySelector('#append');
    var treeElement = document.querySelector('#tree');
    var timingClear = document.querySelector('#timing_clear');
    var timingCreation = document.querySelector('#timing_creation');
    var timingAppending = document.querySelector('#timing_appending');
    var timingTotal = document.querySelector('#timing_total');

    btn.onclick = function () {
        var i, l;
        var treeData = {};
        var tree;

        var startTime = new Date();
        var clearTime;
        var creationTime;
        var appendingTime;
        var totalTime;

        treeElement.innerHTML = '';


        clearTime = new Date();

        treeData.label = 'ROOT';
        treeData.value = '*';
        treeData.children = [];

        l = parseInt(num.value, 10);
        for (i = 0; i < l; i += 1) {
            treeData.children[i] = {
                label: 'child' + i + ' ' + Math.round(Math.random() * l),
                value: 'c' + i
            };
        }
        tree = new SimpleTreeView({
            data: treeData,
            element: treeElement,
            useDomApi: useDom.checked
        });

        creationTime = new Date();

        if (append.checked) {
            tree.render();
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
    };
}());
