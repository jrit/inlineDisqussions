/*
 *  inlineDisqussions
 *  By Tsachi Shlidor ( @shlidor )
 *  Inspired by http://mystrd.at/articles/multiple-disqus-threads-on-one-page/
 *
 *  USAGE:
 *
 *       disqus_shortname = 'your_disqus_shortname';
 *       $(document).ready(function() {
 *         $("p").inlineDisqussions(options);
 *       });
 *
 *  See https://github.com/tsi/inlineDisqussions for more info.
 */

// disqus requires these as globals
var disqus_identifier, disqus_url, disqus_shortname;

(function ($) {
  var settings = {};

  $.fn.inlineDisqussions = function (options) {
    // Set up defaults
    var defaults = {
      identifier: 'disqussion',
      displayCount: true,
      highlighted: true,
      position: 'right',
      backgroundColor: 'white',
      maxWidth: 9999,
      minMargin: 300,
      disqus_shortname: null,
      nodeIdentifier: 'data-emphasis-key',
      getTopOffset: function () { return (10); }
    };

    // Overwrite default options with user provided ones.
    settings = $.extend({}, defaults, options);

    if (!settings.disqus_shortname && console) {
      console.error("disqus_shortname required for inlineDisqussions");
      return;
    }

    disqus_shortname = settings.disqus_shortname;

    // Append #disqus_thread to body if it doesn't exist yet.
    if ($('#disqussions_wrapper').length === 0) {
      $('<div id="disqussions_wrapper"></div>').appendTo($('body'));
    }

    if ($('#disqus_thread').length === 0) {
      $('<div id="disqus_thread"></div>').appendTo('body');
    }

    if (!$("#disqussions_overlay").length) {
      $('<div id="disqussions_overlay"></div>').appendTo($('body'));
    }

    // Attach a discussion to each paragraph.
    $(this).each(function (i) {
      disqussionNotesHandler(i, $(this));
    });

    // Display comments count.
    if (settings.displayCount) {
      loadDisqusCounter();
    }

    // Hide the discussion.
    $('html').click(function (e) {
      if ($(e.target).parents('#disqussions_wrapper, .disqussion.inline').length === 0) {
        hideDisqussion();
      }
    });

    showMainThread();
  };

  var getDisqusUrl = function (identifier) {
    return (window.location.href.split("#")[0] + "-" + identifier);
  };

  var disqussionNotesHandler = function (i, $node) {
    var positionNote = function ($note) {
      $note.css({
        'top': $node.offset().top,
        'left': $node.offset().left + (settings.position == 'right' ? $node.width() : -1 * $absA.width())
      });
    };

    if (!$node.text().replace(/\w/g, '')) {
      return;
    }

    $node.wrapInner("<span/>");

    var identifier;
    // You can force a specific identifier by adding an attribute to the paragraph.
    if ($node.attr(settings.nodeIdentifier)) {
      identifier = $node.attr(settings.nodeIdentifier);
    }
    else {
      while ($('[' + settings.nodeIdentifier + '="' + window.location.pathname + settings.identifier + '-' + i + '"]').length > 0) {
        i++;
      }
      identifier = window.location.pathname + settings.identifier + '-' + i;
    }

    // Create the discussion note.
    var cls = "disqussion-link " + (settings.highlighted ? "disqussion-highlight" : "");

    var url = getDisqusUrl(identifier);

    var $relA = $('<a class="' + cls + '" />')
              .attr('href', url + "#disqus_thread")
              .attr(settings.nodeIdentifier, identifier)
              .attr('data-disqus-url', url)
              .attr('data-disqus-position', settings.position)
              .text('+')
              .wrap('<div class="disqussion disqus-' + settings.position + '" />');

    var $absA = $relA.clone().wrap('<div class="disqussion disqus-' + settings.position + '" />');

    $relA.parent().addClass("inline").appendTo($node);

    var $note = $absA
                .parent()
                .appendTo('#disqussions_wrapper');

    positionNote($note);

    $(window).on("resize", function () {
      positionNote($note);
    });

    setInterval(function () {
      positionNote($note);
    }, 1000);

    $node
      .attr(settings.nodeIdentifier, identifier)
      .on("mouseover touchstart", function () {
        $(".disqussion.hovered").removeClass("hovered");
        $note.addClass("hovered");
      })
    .on("mouseout", function () {
      $note.removeClass("hovered");
    });

    // Load the relative discussion.
    $note.find("a").add($relA).on("click", function (e) {
      e.preventDefault();

      if ($(this).is('.active')) {
        e.stopPropagation();
        hideDisqussion();
      }
      else {
        relocateDisqussion($note);
        loadDisqus($absA);
      }
    });

  };

  var showMainThread = function () {
    var $a = $('a.main-disqussion-link');

    if ($a.length === 0) {
      var $a = $('<a class="main-disqussion-link" />')
  .attr('href', '#disqus_thread')
          .attr(settings.nodeIdentifier, "main")
      .attr('data-disqus-url', getDisqusUrl("main"));
    }

    loadDisqus($a);
    relocateDisqussion($a, true);
  };

  var createDisqusScript = function (identifier, url) {
    disqus_identifier = identifier;
    disqus_url = url;

    disqus_config = function () {
      this.callbacks.onNewComment.push(function () {
        var $link = $("a.disqussion-link[" + settings.nodeIdentifier + "='" + identifier + "']");
        $link.addClass("has-comments").text((+$link.text() || 0) + 1);
      });
      /* Available callbacks are afterRender, onInit, onNewComment, onPaginate, onReady, preData, preInit, preReset */
    };

    // Append the Disqus embed script to <head>.
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = '//' + settings.disqus_shortname + '.disqus.com/embed.js';
    $('head').append(s);
  };

  var createDisqusCountScript = function () {
    // Append the Disqus count script to <head>.
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = '//' + settings.disqus_shortname + '.disqus.com/count.js';
    $('head').append(s);
  };

  var resetDisqus = function (identifier, url) {
    DISQUS.reset({
      reload: true,
      config: function () {
        this.page.identifier = identifier;
        this.page.url = url;
      }
    });
  };

  var loadDisqus = function ($source) {
    var identifier = $source.attr(settings.nodeIdentifier);
    var url = $source.attr('data-disqus-url');

    $("#disqus_thread").empty();

    if (window.DISQUS) {
      resetDisqus(identifier, url);
    }
    else {
      createDisqusScript(identifier, url);
    }

    // Add 'active' class.
    $('a.disqussion-link, a.main-disqussion-link')
  .removeClass('active')
  .filter($source)
  .addClass('active');

    // Highlight
    if ($source.is('.disqussion-highlight')) {
      highlightDisqussion(identifier);
    }
  };

  var loadDisqusCounter = function () {
    createDisqusCountScript();

    // Add class to discussions that already have comments.
    var counterInterval = window.setInterval(function () {
      $('.disqussion-link').filter(function () {
        return $(this).text().match(/[1-9]/g);
      }).addClass("has-comments");
    }, 250);

    setTimeout(function () {
      clearInterval(counterInterval);
    }, 10000);

  };

  var relocateDisqussion = function ($note, main) {
    var windowWidth = $(window).width();
    $('#disqus_thread').removeClass("disqus-left disqus-right disqus-positioned");

    // Move the discussion to the right position.
    var css = {
      position: 'static',
      width: 'auto',
      left: 'auto',
      top: 'auto',
      backgroundColor: settings.backgroundColor
    };

    if (main === true) {
      $('#disqus_thread').detach().appendTo($("#main-disqussion"));
    }
    else {
      var anchorName = $note.find("a").attr(settings.nodeIdentifier);
      var $p = $('p[' + settings.nodeIdentifier + '="' + anchorName + '"]');

      if (!$p.length && console) {
        console.warn("can't find " + '[' + settings.nodeIdentifier + '="' + anchorName + '"]');
        return;
      }

      var rightMargin = windowWidth - ($p.offset().left + $p.width());
      var leftMargin = $p.offset().left;

      if (settings.position == 'right' && rightMargin < settings.minMargin
        || settings.position == 'left' && leftMargin < settings.minMargin) {
        $('#disqus_thread').detach().appendTo($p);
      }
      else {
        $('#disqus_thread').detach().addClass("disqus-positioned").prependTo("#disqussions_wrapper");
        css.position = "absolute";
      }

      if (css.position !== "absolute") {
        $(window).scrollTop(Math.max($(window).scrollTop(), $p.offset().top - settings.getTopOffset()));
      }

      if (css.position === "absolute") {
        var noteOffset = $note.offset();

        css.top = noteOffset.top;

        if ($note.find("a").attr('data-disqus-position') == 'right') {
          $('#disqus_thread').addClass("disqus-right");
          css.left = windowWidth - rightMargin;
          css.width = Math.min(windowWidth - rightMargin, settings.maxWidth);
        }
        else {
          $('#disqus_thread').addClass("disqus-left");
          css.left = noteOffset.left - Math.min(parseInt(noteOffset.left, 10), settings.maxWidth);
          css.width = Math.min(parseInt(noteOffset.left, 10), settings.maxWidth);
        }
      }
    }

    $('#disqus_thread').stop().fadeIn('fast').css(css);

  };

  var hideDisqussion = function () {
    if ($("#disqus_thread").closest("#main-disqussion").length) {
      return;
    }

    $('#disqus_thread').stop().fadeOut('fast');
    $('a.disqussion-link').removeClass('active');

    // settings.highlighted
    $('#disqussions_overlay').fadeOut('fast');
    $('body').removeClass('disqussion-highlight');
    $('[' + settings.nodeIdentifier + ']').removeClass('disqussion-highlighted');
    showMainThread();
  };

  var highlightDisqussion = function (identifier) {
    $('body').addClass('disqussion-highlight');
    $('#disqussions_overlay').fadeIn('fast');
    $('[' + settings.nodeIdentifier + ']')
  .removeClass('disqussion-highlighted')
  .filter('[' + settings.nodeIdentifier + '="' + identifier + '"]:not(".disqussion-link")')
  .addClass('disqussion-highlighted');
  };

})(jQuery);
