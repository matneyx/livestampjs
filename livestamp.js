// Livestamp.js / v2.1.0 / (c) 2015 Matt Bradley / MIT License
(function (plugin) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery', 'moment'], plugin);
  } else {
    // Browser globals
    plugin(jQuery, moment);
  }
}(function($, moment) {
  var updateInterval = 1000,
      useNativeTimestamps = false,
      paused = false,
      updateID = null,
      $livestamps = $([]);

  var init = function() {
    livestampGlobal.resume();
  };

  var prep = function($el, timestamp) {
    var oldData = $el.data('livestampdata');
    if (typeof timestamp === 'number' && !useNativeTimestamps) {
      timestamp *= 1000;
    }

    $el.removeAttr('data-livestamp')
      .removeData('livestamp');

    timestamp = moment(new Date(timestamp));
    if (moment.isMoment(timestamp) && !isNaN(+timestamp)) {
      var newData = $.extend({}, { 'original': $el.contents() }, oldData);
      newData.moment = moment(new Date(timestamp));
      var attr = $el.attr('livestampaltformat');
      if (typeof attr !== typeof undefined && attr !== false) {
        newData.livealtformat = attr;
      } else {
        newData.livealtformat = "LLLL";
      }

      $el.data('livestampdata', newData).empty();
      $livestamps.push($el[0]);
    }
  };

  var run = function() {
    if (paused) return;
    livestampGlobal.update();
  };

  var livestampGlobal = {
    update: function() {
      clearTimeout(updateID);
      if (!paused) {
        updateID = setTimeout(run, updateInterval);
      }

      $('[data-livestamp]').each(function() {
        var $this = $(this);
        prep($this, $this.data('livestamp'));
      });

      var toRemove = [];
      $livestamps.each(function() {
        var $this = $(this),
            data = $this.data('livestampdata'),
            includeSuffix = ($this.data('livestamp-suffix') === true);

        if (data === undefined) {
          toRemove.push(this);
        } else if (moment.isMoment(data.moment)) {
          var from = $this.html(),
              to = data.moment.fromNow(!includeSuffix);

          if (from !== to) {
            var e = $.Event('change.livestamp');
            $this.trigger(e, [from, to]);
            if (!e.isDefaultPrevented()) {
              $this.html(to);
            }
          }
          
          var titleFrom = $this.attr("title"),
              titleTo = data.moment.format(data.livealtformat);
          if (titleFrom !== titleTo) {
            var event = $.Event('change.title');
            $this.trigger(event, [titleFrom, titleTo]);
            if (!event.isDefaultPrevented()) {
              $this.attr('title', titleTo);
            }
          }
        }
      });

      $livestamps = $livestamps.not(toRemove);
      delete $livestamps.prevObject;
    },

    pause: function() {
      paused = true;
    },

    resume: function() {
      paused = false;
      run();
    },

    interval: function(interval) {
      if (interval === undefined) {
        return updateInterval;
      }
      updateInterval = interval;
    },

    nativeTimestamps: function(nativeTimestamps) {
      if (nativeTimestamps === undefined) {
        return useNativeTimestamps;
      }
      useNativeTimestamps = nativeTimestamps;
    }
  };

  var livestampLocal = {
    add: function($el, timestamp) {
      if (typeof timestamp === 'number' && !useNativeTimestamps) {
        timestamp *= 1000;
      }
      timestamp = moment(new Date(timestamp));

      if (moment.isMoment(timestamp) && !isNaN(+timestamp)) {
        $el.each(function() {
          prep($(this), timestamp);
        });
        livestampGlobal.update();
      }

      return $el;
    },

    destroy: function($el) {
      $livestamps = $livestamps.not($el);
      $el.each(function() {
        var $this = $(this),
            data = $this.data('livestampdata');

        if (data === undefined) {
          return $el;
        }

        $this
          .html(data.original ? data.original : '')
          .removeData('livestampdata');
      });

      return $el;
    },

    isLivestamp: function($el) {
      return $el.data('livestampdata') !== undefined;
    }
  };

  $.livestamp = livestampGlobal;
  $(init);
  $.fn.livestamp = function(method, options) {
    if (!livestampLocal[method]) {
      options = method;
      method = 'add';
    }

    return livestampLocal[method](this, options);
  };
}));
