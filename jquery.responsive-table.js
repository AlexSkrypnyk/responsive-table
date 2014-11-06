/**
 * Responsive Tables jQuery plugin.
 */

;
(function ($, window, document, undefined) {
  var pluginName = 'responsiveTable',
    version = '0.1',
    defaults = {
      // Responsive mode: 'auto' to collapse/expand automatically when container
      // dimensions change; 'all' to collapse/expand all items when table does
      // not fit container. expandAlways and collapseAlways are respected.
      responsiveMode: 'auto',
      // Collapsible columns start position: first, last, number.
      start: 'last',
      // Collapse direction: rtl, ltr.
      collapseDirection: 'rtl',
      expandTriggerClass: 'js-expand-trigger',
      expandTriggerHtml: '+',
      collapseTriggerClass: 'js-collapse-trigger',
      collapseTriggerHtml: '-',
      // Push collapsed text outside of header.
      emptyHeader: false,
      // Array of permanently expanded columns: first, last, number, *.
      expandAlways: [],
      // Array of permanently collapsed columns: first, last, number, *.
      collapseAlways: [],
      // Collapsed header text direction: 'tb'- top to bottom; 'bt' - bottom to
      // top. Text styling is done via css.
      textDirection: 'tb'
    };

  function Plugin(element, options) {
    this.element = element;
    this.$element = $(element);
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  $.extend(Plugin.prototype, {
    init: function () {
      // Cache current plugin instance.
      var plugin = this;

      if (plugin.element.tagName.toLowerCase() != 'table') {
        throw 'Responsive table plugin should be used on tables only.';
      }

      // Scan table to init main variables.
      plugin.initTable();

      plugin.columnMinWidths = [];

      $(window).on('resizeEnd', function (evt, forceRefresh) {
        if (plugin.settings.responsiveMode == 'all') {
          plugin.responsiveAll();
        }
        else {
          plugin.responsiveAuto();
        }
      }).trigger('resizeEnd');

      // Bind expand trigger click event.
      $(plugin.$element).delegate('.' + plugin.settings.expandTriggerClass, 'click', function () {
        plugin.expandColumn(plugin.getColumnFromTrigger($(this)), true);
      });

      // Bind collapse trigger click event.
      $(plugin.$element).delegate('.' + plugin.settings.collapseTriggerClass, 'click', function () {
        plugin.collapseColumn(plugin.getColumnFromTrigger($(this)));
      });
    },
    responsiveAll: function () {
      var collapse = this.$element.outerWidth() > this.$container.width();
      for (var idx in this.columns) {
        if (collapse) {
          this.collapseColumn(parseInt(idx, 10));
        }
        else {
          this.expandColumn(parseInt(idx, 10));
        }
      }
    },
    responsiveAuto: function () {
      // Gather minimum widths of the table, but only if smaller than container.
      // This is required to calculate whether it is required to collapse/expand
      // columns.
      // @note: If content of the cell changes based on the size of the font
      // when breakpoint changes, this needs to be called to refresh inner
      // values. But even then, values will be taken from already collapsed
      // cells. There is no solution here to calculate columns width without
      // resetting whole table, which would lead to major visual issues.
      if (this.$element.outerWidth() > this.$container.width()) {
        this.gatherMinWidths();
      }

      // Get start column to traverse through.
      var current = this.initCurrent();

      // Collapse each column until table becomes smaller than container.
      // We also using a guard to avoid infinite loop.
      while (this.$element.outerWidth() > this.$container.width() && current !== false) {
        this.collapseColumn(current);
        current = this.getNext(current);
        $(this.$element).trigger('responsiveTable.tableCollapse');
      }

      // Expand each column, but only if minimal table width in known.
      if (this.columnMinWidths.length > 0) {
        // Get width of all collapsed columns.
        this.gatherCollapsedWidths();

        // Traverse through all collapsed columns and check whether it is
        // possible to expand any of them without exceeding container width.
        current = this.initCurrent(true);
        //current = this.initCurrent();
        while (current !== false) {
          if (this.columnCollapsedWidths[current]) {
            var predictedWidth = this.getPredictedWidth(current);
            if (predictedWidth < this.$container.width()) {
              // Expand current column, but do not add collapse trigger.
              this.expandColumn(current, false);
            }
          }
          current = this.getNext(current, true);
        }
      }
    },
    /**
     * Helper to init table variables.
     */
    initTable: function () {
      var plugin = this;

      // Add processed class.
      plugin.$element.addClass('js-responsive-table-processed');

      // Cache table container.
      plugin.$container = plugin.$element.parent();

      // Cache table header. Only single-row header supported.
      plugin.$header = this.$element.find('th');
      // Cache table rows, excluding header rows.
      plugin.$rows = this.$element.find('tr').filter(function () {
        return $(this).parent().get(0).tagName.toLowerCase() != 'thead' &&
        $(this).children(':first').get(0).tagName.toLowerCase() != 'th';
      });

      // Cache table columns. Each array element is a jQuery set of cells
      // suitable for expand/collapse manipulation.
      plugin.columns = plugin.getColumns(plugin.$element);

      // Find maximum and minimum columns per row for the whole table.
      plugin.maxColumns = Object.keys(plugin.columns).length;

      plugin.settings.expandAlways = plugin.parseRange(plugin.settings.expandAlways);
      plugin.settings.collapseAlways = plugin.parseRange(plugin.settings.collapseAlways);

      plugin.initCollapseAlways();
    },
    initCollapseAlways: function () {
      for (var i = 0; i < this.settings.collapseAlways.length; i++) {
        this.collapseColumn(this.settings.collapseAlways[i]);
      }
    },
    /**
     * Helper to parse specified range into array of numbers.
     *
     * Available values: first, last, number, *
     * Also, available range: 1,*,5,10 will have 1,2,3,4,5,10
     */
    parseRange: function (arr, min, max) {
      var plugin = this,
        newArr = [];

      min = min || 0;
      max = max || plugin.maxColumns - 1;

      var prev = min;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == 'first') {
          newArr.push(min);
        }
        else if (arr[i] == 'last') {
          newArr.push(max);
        }
        else if ($.isNumeric(arr[i])) {
          newArr.push(arr[i] > 0 && arr[i] < plugin.maxColumns ? arr[i] : min);
        }
        else if (arr[i] == '*') {
          // Complex case.
          var seq = [];
          var next = i + 1 < arr.length ? plugin.parseRange([arr[i + 1]], min, max) : [max];
          next = next.pop();
          for (var k = prev; k <= next; k++) {
            seq.push(k);
          }
          newArr = $.merge(newArr, seq);
        }
        prev = newArr.length > 0 ? newArr[newArr.length - 1] : min;
      }

      // Return only unique array items.
      return $.grep(newArr, function (el, index) {
        return index == $.inArray(el, newArr);
      });
    },
    /**
     * Gather minimum widths of table columns.
     */
    gatherMinWidths: function () {
      var plugin = this;

      plugin.columnMinWidths = [];

      plugin.$header.each(function () {
        plugin.columnMinWidths.push(plugin.getCellWidth($(this)));
      });

      return plugin.columnMinWidths;
    },
    /**
     * Gather widths of collapsed table columns.
     */
    gatherCollapsedWidths: function () {
      var plugin = this;
      plugin.columnCollapsedWidths = [];
      plugin.$header.each(function () {
        if ($(this).hasClass('js-head-collapsed')) {
          plugin.columnCollapsedWidths.push(plugin.getCellWidth($(this)));
        }
        else {
          // Pushed false to keep in sync with plugin.columnMinWidthss.
          plugin.columnCollapsedWidths.push(false);
        }
      });
      return plugin.columnCollapsedWidths;
    },
    /**
     * Calculate width with currently expanded column.
     */
    getPredictedWidth: function (current) {
      var predictedWidth = 0;
      for (var i in this.columnCollapsedWidths) {
        if (i == current) {
          predictedWidth += this.columnMinWidths[i];
        }
        else if (this.columnCollapsedWidths[i] !== false) {
          predictedWidth += this.columnCollapsedWidths[i];
        }
        else {
          predictedWidth += this.columnMinWidths[i];
        }
      }
      return predictedWidth;
    },
    /**
     * Helper to get cell width.
     */
    getCellWidth: function ($cell) {
      // Due to the fact that jQuery does not know how to calculate table cell
      // outer width when border-collapse is set to collapse, we use our own
      // helper to be greedy about it and add full border width from both sides.
      var borderWidth = 0;
      borderWidth += parseInt($cell.css('border-left-width'), 10);
      borderWidth += parseInt($cell.css('border-right-width'), 10);
      return $cell.outerWidth() + borderWidth;
    },
    /**
     * Get next column based on provided settings.
     *
     * @param {numder} position
     *   Current column number.
     * @param {bool} inverse
     *   Boolean flag to reverse result. Required to start expanding already
     *   collapsed items from the last-to-first.
     * @returns {number}
     *   Next column position,
     */
    getNext: function (position, inverse) {
      inverse = inverse || false;
      var delta = this.settings.collapseDirection == 'ltr' ? 1 : -1;
      delta *= inverse ? -1 : 1;
      position += delta;

      return position >= this.maxColumns || position < 0 ? false : position;
    },
    initCurrent: function (inverse) {
      inverse = inverse || false;
      if (this.settings.start == 'first') {
        return inverse ? this.maxColumns - 1 : 0;
      }
      else if ($.isNumeric(this.settings.start)) {
        // Specified column with fallback to last column.
        if (this.settings.start > 0 && this.settings.start < this.maxColumns) {
          return inverse ? this.maxColumns - this.settings.start : this.settings.start;
        }
        else {
          return inverse ? 0 : this.maxColumns - 1;
        }
      }
      // Fallback to last column.
      else {
        return inverse ? 0 : this.maxColumns - 1;
      }
    },
    /**
     * Retrieves table columns suitable for DOM manipulation.
     */
    getColumns: function () {
      var cols = {},
        spansMatrix = this.getSpanMatrix(),
        idxHeader,
        idxHeaderSpanCurrent,
        spanHeader,
        idxCurrentCell,
        idxPrevCells;

      // Walk through header columns.
      for (idxHeader = 0, idxHeaderSpan = 0; idxHeader < this.$header.length; idxHeader++) {
        // Get span for header cell, if set, or default to 1.
        spanHeader = this.$header.eq(idxHeader).attr('colspan') !== undefined ? parseInt(this.$header.eq(idxHeader).attr('colspan'), 10) : 1;

        // Traverse all rows to find current column.
        this.$rows.each(function (rowIdx) {
          // Init current column, if has not been initialised during previous
          // iteration.
          cols[idxHeader] = cols[idxHeader] || $();
          // Walk through columns starting from current header to the column
          // that this header is spanned across.
          for (idxHeaderSpanCurrent = idxHeaderSpan; idxHeaderSpanCurrent < idxHeaderSpan + spanHeader;) {
            // Current cell index in current row. Each cell index is calculated
            // separately from the start of the row.
            idxCurrentCell = 0;
            if (idxHeaderSpanCurrent > 0) {
              for (idxPrevCells = idxHeaderSpanCurrent - 1; idxPrevCells >= 0; idxPrevCells--) {
                // This will add anny non-zero spanned cells. Zero-spanned cells
                // do not actually exist in DOM; they exist in span matrix.
                idxCurrentCell += spansMatrix[rowIdx][idxPrevCells] > 0;
              }
            }

            // Add current cell only if it exists in DOM (its span is non-zero).
            if (spansMatrix[rowIdx][idxHeaderSpanCurrent] > 0) {
              cols[idxHeader] = cols[idxHeader].add($(this).find('td').eq(idxCurrentCell));
            }
            // Increment current header span.
            idxHeaderSpanCurrent++;
          }
        });

        // Increment header span index with current header span value.
        idxHeaderSpan += spanHeader;
      }

      return cols;
    },
    /**
     * Calculates span matrix.
     *
     * Each cell is a span value. Spanned cells are filled with zeros to
     * get complete matrix.
     */
    getSpanMatrix: function () {
      var m = [];
      this.$rows.each(function (rowIdx) {
        m[rowIdx] = m[rowIdx] || [];
        $(this).find('td').each(function () {
          tdColspan = $(this).attr('colspan') !== undefined ? parseInt($(this).attr('colspan'), 10) : 1;
          // Add current colspan value.
          m[rowIdx].push(tdColspan);
          // And fill following cells with zeros.
          if (tdColspan > 1) {
            for (var k = 0; k < tdColspan - 1; k++) {
              m[rowIdx].push(0);
            }
          }
        });
      });

      return m;
    },
    triggerHtml: function (type) {
      if (type + 'TriggerHtml' in this.settings && this.settings[type + 'TriggerHtml']) {
        return '<span class="' + this.settings[type + 'TriggerClass'] + '">' + this.settings[type + 'TriggerHtml'] + '</span>';
      }
      return '';
    },
    /**
     * Router function for specific collapse handler.
     */
    collapseColumn: function (idx) {
      if ($.inArray(idx, this.settings.expandAlways) != -1) {
        return;
      }

      if (this.settings.emptyHeader) {
        this.collapseColumnNoHeader(idx);
      }
      else {
        this.collapseColumnHeader(idx);
      }
    },
    collapseColumnHeader: function (idx) {
      var $th = this.$header.eq(idx);
      if (!$th.hasClass('js-head-collapsed')) {
        $th.addClass('js-head-collapsed').addClass(this.getTextDirectionClass());
        $th.attr('rowspan', this.$rows.length + 1);
        if ($th.find('.js-vertical-text').length == 0) {
          $th.wrapInner('<div class="js-vertical-text"><div class="js-vertical-text--inner"></div></div>');
        }
        // Detach trigger to preserve events.
        $th.find('.' + this.settings.collapseTriggerClass).remove();
        if ($th.find('.' + this.settings.expandTriggerClass).length == 0) {
          $th.prepend(this.triggerHtml('expand'));
        }

        this.columns[idx].addClass('js-cell-collapsed');
      }
    },
    collapseColumnNoHeader: function (idx) {
      var $th = this.$header.eq(idx);
      if (!$th.hasClass('js-head-collapsed')) {
        //Inject empty header.
        $th.before($th.clone().html('').addClass('js-cell-replacement').addClass(this.getTextDirectionClass()));
        $th.addClass('js-head-collapsed').addClass(this.getTextDirectionClass());
        $th.attr('rowspan', this.$rows.length + 1);
        if ($th.find('.js-vertical-text').length == 0) {
          $th.wrapInner('<div class="js-vertical-text"><div class="js-vertical-text--inner"></div></div>');
        }

        // Detach trigger to preserve events.
        $th.find('.' + this.settings.collapseTriggerClass).remove();
        if ($th.find('.' + this.settings.expandTriggerClass).length == 0) {
          $th.prepend(this.triggerHtml('expand'));
        }

        var $newTh = $th.clone(true, true);
        $th.hide();
        $newTh.addClass('js-cell-replacement').addClass(this.getTextDirectionClass());
        $newTh.attr('rowspan', this.$rows.length);

        this.columns[idx].addClass('js-cell-collapsed');
        // Add new header cell before first cell of current column.
        this.columns[idx].eq(0).before($newTh);
      }
    },
    /**
     * Router function for specific expand handler.
     */
    expandColumn: function (idx, needTrigger) {
      if ($.inArray(idx, this.settings.collapseAlways) != -1) {
        return;
      }
      if (this.settings.emptyHeader) {
        this.expandColumnNoHeader(idx, needTrigger);
      }
      else {
        this.expandColumnHeader(idx, needTrigger);
      }
    },
    expandColumnHeader: function (idx, needTrigger) {
      var $th = this.$header.eq(idx);
      if ($th.hasClass('js-head-collapsed')) {
        $th.removeClass('js-head-collapsed');
        $th.removeAttr('rowspan');
        $th.find('.' + this.settings.expandTriggerClass).remove();
        $th.html($th.find('.js-vertical-text--inner').html());
        if ($th.find('.' + this.settings.collapseTriggerClass).length == 0 && needTrigger) {
          $th.prepend(this.triggerHtml('collapse'));
        }

        this.columns[idx].removeClass('js-cell-collapsed');
      }
    },
    expandColumnNoHeader: function (idx, needTrigger) {
      var $th = this.$header.eq(idx);
      if ($th.hasClass('js-head-collapsed')) {
        $th.removeClass('js-head-collapsed');
        $th.removeAttr('rowspan');
        $th.find('.' + this.settings.expandTriggerClass).remove();
        $th.html($th.find('.js-vertical-text--inner').html());
        if ($th.find('.' + this.settings.collapseTriggerClass).length == 0 && needTrigger) {
          $th.prepend(this.triggerHtml('collapse'));
        }

        // Remove injected header.
        $th.prev('.js-cell-replacement').remove();
        // Remove injected cell.
        this.columns[idx].eq(0).prev('.js-cell-replacement').remove();

        this.columns[idx].removeClass('js-cell-collapsed');
        $th.show();
      }
    },
    getColumnFromTrigger: function ($trigger) {
      var $th = $trigger.parents('th:first'),
        $container = $th.parent(),
        idx = 0;

      // If parent container is a row from table body search using closes match.
      if ($container.get(0) == this.$rows.get(0)) {
        return this.findClosestColumn($th);
      }

      // Otherwise assume that parent container is header row.
      for (var i = 0; i < $container.children().length; i++) {
        if ($container.children().get(i) == $th.get(0)) {
          break;
        }
        if (!$container.children().eq(i).hasClass('js-cell-replacement')) {
          idx++;
        }
      }

      return idx;
    },
    findClosestColumn: function ($cell) {
      for (var idx in this.columns) {
        if (this.columns[idx].eq(0).prev().get(0) == $cell.get(0)) {
          return idx;
        }
      }

      return false;
    },
    getTextDirectionClass: function () {
      return 'align-' + this.settings.textDirection;
    }
  });

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function (options) {
    this.each(function () {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
      }
    });

    return this;
  };
}(jQuery, window, document));
