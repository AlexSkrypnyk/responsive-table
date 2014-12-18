/**
 * @file
 * Responsive Tables plugin example page scripts.
 */


// Shorthand for $( document ).ready()
(function ($) {
  $(document).ready(function () {
    //// Default table.
    $('.table1').responsiveTable();

    $('.table12').responsiveTable({
      start: 'first',
      collapseDirection: 'ltr'
    });

    $('.table13').responsiveTable({
      start: 8
    });

    $('.table2').responsiveTable();

    $('.table3').responsiveTable();

    $('.table4').responsiveTable();

    $('.table41').responsiveTable({
      start: 'first',
      collapseDirection: 'ltr'
    });

    $('.table5').responsiveTable({
      emptyHeader: true
    });

    $('.table51').responsiveTable({
      emptyHeader: true
    });

    $('.table52').responsiveTable({
      emptyHeader: true,
      start: 2
    });

    $('.table53').responsiveTable({
      emptyHeader: true
    });

    $('.table54').responsiveTable({
      emptyHeader: true
    });

    $('.table6').responsiveTable({
      expandAlways: [5, '*', 7]
    });

    $('.table61').responsiveTable({
      collapseAlways: [5, '*', 7]
    });

    $('.table62').responsiveTable({
      emptyHeader: true,
      expandAlways: ['first'],
      responsiveMode: 'all'
    });

    $('.table7').responsiveTable({
      textDirection: 'bt'
    });

    $('.table8').responsiveTable({
      scrollContainer: true
    });

    $('.table9').responsiveTable({
      scrollContainer: true
    });

    $('.table91').responsiveTable({
      "responsiveMode": "auto",
      "start": "last",
      "collapseDirection": "rtl",
      "expandTriggerClass": "js-expand-trigger",
      "expandTriggerHtml": "+",
      "collapseTriggerClass": "js-collapse-trigger",
      "collapseTriggerHtml": "-",
      "emptyHeader": false,
      "expandAlways": [],
      "collapseAlways": [],
      "textDirection": "tb",
      "scrollContainer": false
    });

    ////////////////////////////////////////////////////////////////////////////
    // UNIT TESTS
    ////////////////////////////////////////////////////////////////////////////
    var plugin = $('.js-responsive-table-processed:first').data().plugin_responsiveTable;

    var verbose = function (message) {
      message = message || '<br/>';
      $('.js-unit-tests-container').append('<div>' + message + '</div>');
    };

    var assertEqual = function (val1, val2, message) {
      message = message || '';
      message = message == '' ? message : ' ' + message;
      if (!$.isArray(val1)) {
        var text = val1 + ' == ' + val2;
        text = (val1 == val2 ? 'PASS: ' + text : 'FAIL: ' + text) + message;
      }
      else {
        var valid = 0;
        for (var i in val1) {
          valid += val1[i] === val2[i];
        }
        var text = JSON.stringify(val1) + ' == ' + JSON.stringify(val2);
        text = (valid == val1.length ? 'PASS: ' + text : 'FAIL: ' + text) + message;
      }

      verbose(text);
    };

    verbose('SELF TEST');
    assertEqual(1, 1);
    assertEqual('a', 'a');
    assertEqual('a', 'b', 'expected fail');
    assertEqual([1, 2, 3], [1, 2, 3]);
    assertEqual([1, 2, 3], [1, 2, 4], 'expected fail');
    verbose();
    verbose('Test parseRange() function');
    assertEqual(plugin.parseRange([1, 2, 3]), [1, 2, 3]);
    assertEqual(plugin.parseRange(['first', 2, 'last']), [0, 2, 9]);
    assertEqual(plugin.parseRange(['first', 2, '*', 5, 'last']), [0, 2, 3, 4, 5, 9]);
    assertEqual(plugin.parseRange(['first', 2, '*', 5, '*', 'last']), [0, 2, 3, 4, 5, 6, 7, 8, 9]);
    assertEqual(plugin.parseRange(['*']), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assertEqual(plugin.parseRange([2, '*']), [2, 3, 4, 5, 6, 7, 8, 9]);

    ////////////////////////////////////////////////////////////////////////////
    // TEST PAGE SCRIPTS
    ////////////////////////////////////////////////////////////////////////////
    var toRange = function (x, min, max, minr, maxr) {
      return Math.round(((maxr - minr) * (x - min)) / (max - min) + minr);
    };

    /**
     * Convert current value to range-related color.
     */
    var colorRange = function (min, max) {
      var color = '#';
      for (var i = 0, c; i < 3; i++) {
        c = Math.abs(Math.round(toRange(Math.random() * (max - min), min, max, 0, 255))).toString(16);
        c = c.length == 1 ? '0' + c : c;
        c = c.substr(-1, 2);
        color += c;
      }

      return color;
    };

    $('.js-responsive-table-processed').each(function () {
      var $this = $(this),
        plugin = $this.data().plugin_responsiveTable;

      // Add options to each table.
      $(this).before('<fieldset class="options js-collapsible js-collapsed"><legend class="js-collapsible-trigger">Options</legend><div class="fieldset-content js-collapsible-panel"><pre><code>' + JSON.stringify(plugin.settings, null, 2) + '</code></pre></div></fieldset>');

      // Add random color to each table column.
      for (var i in plugin.columns) {
        plugin.columns[i].css({
          background: colorRange(128, 200)
        });
      }
    });

    // Event handler for table container resize button click.
    $('.js-resize-table-container').click(function () {
      $('.js-table-container').animate({
        width: $(this).text()
      }, 'fast', 'swing', function () {
        $(window).trigger('resizeEnd');
      });
    });

    // Ecent handler for collapsible fieldset trigger click.
    $('.js-collapsible .js-collapsible-trigger').on('click', function () {
      var $trigger = $(this);
      if ($trigger.parent().hasClass('js-collapsed')) {
        $trigger.parent().removeClass('js-collapsed');
      }
      else {
        $trigger.parent().addClass('js-collapsed');
      }
    });
  });
}(jQuery));
