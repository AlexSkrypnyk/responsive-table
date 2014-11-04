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
