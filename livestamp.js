// Livestamp.js / v3.0.0 / (c) 2023 Dave Matney / MIT License
import relativeTime from "./relativeTime.js";
(function (plugin) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["jquery", "dayjs"], plugin);
  } else {
    // Browser globals
    plugin(jQuery, dayjs);
  }
})(function ($, dayjs) {
  dayjs.extend(relativeTime);
  var updateInterval = 1000,
    useNativeTimestamps = false,
    paused = false,
    updateID = null,
    $livestamps = $(),
    init = function () {
      livestampGlobal.resume();
    },
    prep = function ($el, timestamp) {
      if (typeof timestamp === "number" && !useNativeTimestamps) {
        timestamp *= 1000;
      }
      $el.removeAttr("data-livestamp").removeData("livestamp");
      timestamp = dayjs(new Date(timestamp));
      if (dayjs.isDayjs(timestamp) && !isNaN(+timestamp)) {
        var newData = {
          original: $el.contents(),
          dayjs: timestamp,
          livealtformat: $el.attr("livestampaltformat") || "LLLL",
        };
        $el.data("livestampdata", newData).empty();
        $livestamps = $livestamps.add($el[0]);
      }
    },
    run = function () {
      if (paused) return;
      livestampGlobal.update();
    },
    livestampGlobal = {
      update: function () {
        // Clear any timeout in case we're called before it fires.
        clearTimeout(updateID);

        // Schedule the next update if appropriate.
        if (!paused) {
          updateID = setTimeout(run, updateInterval);
        }
        var toRemove = [];
        $("[data-livestamp]").each(function () {
          var $this = $(this);
          prep($this, $this.data("livestamp"));
        });
        $livestamps.each(function () {
          var $this = $(this),
            data = $this.data("livestampdata"),
            includeSuffix = $this.data("livestamp-suffix") === true;
          if (data === undefined || !dayjs.isDayjs(data.dayjs)) {
            toRemove.push(this);
            return; // Skip to the next iteration if data is undefined or data.dayjs is not valid
          }

          var from = $this.html(),
            to = data.dayjs.fromNow(!includeSuffix);
          if (from !== to) {
            var e = $.Event("change.livestamp");
            $this.trigger(e, [from, to]);
            if (!e.isDefaultPrevented()) {
              $this.html(to);
            }
          }
          from = $this.attr("title");
          to = data.dayjs.format(data.livealtformat);
          if (from !== to) {
            var e = $.Event("change.title");
            $this.trigger(e, [from, to]);
            if (!e.isDefaultPrevented()) {
              $this.attr("title", to);
            }
          }
        });
        $livestamps = $livestamps.not(toRemove);
      },
      pause: function () {
        paused = true;
      },
      resume: function () {
        paused = false;
        run();
      },
      interval: function (interval) {
        if (interval === undefined) {
          return updateInterval;
        }
        updateInterval = interval;
      },
      nativeTimestamps: function (nativeTimestamps) {
        if (nativeTimestamps === undefined) {
          return useNativeTimestamps;
        }
        useNativeTimestamps = nativeTimestamps;
      },
    },
    livestampLocal = {
      add: function ($el, timestamp) {
        if (typeof timestamp === "number" && !useNativeTimestamps)
          timestamp *= 1e3;
        timestamp = dayjs(new Date(timestamp));
        if (dayjs.isDayjs(timestamp) && !isNaN(+timestamp)) {
          $el.each(function () {
            prep($(this), timestamp);
          });
          livestampGlobal.update();
        }
        return $el;
      },
      destroy: function ($el) {
        $livestamps = $livestamps.not($el);
        var $elArray = $el.toArray(); // Cache the $el jQuery object as an array

        $elArray.forEach(function (el) {
          var $this = $(el);
          var data = $this.data("livestampdata");
          if (data === undefined) return $el;
          $this
            .html(data.original ? data.original : "")
            .removeData("livestampdata");
        });
        return $el;
      },
      isLivestamp: function ($el) {
        return $el.data("livestampdata") !== undefined;
      },
    };
  $.livestamp = livestampGlobal;
  $(init);
  $.fn.livestamp = function (method, options) {
    if (!livestampLocal[method]) {
      options = method;
      method = "add";
    }
    return livestampLocal[method](this, options);
  };
});
