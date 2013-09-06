/*
 *  inlineDisqussions
 *  By Tsachi Shlidor ( @shlidor )
 *  Inspired by http://mystrd.at/articles/multiple-disqus-threads-on-one-page/
 *
 *  USAGE:
 *
 *       disqus_shortname = 'inlinecomments';
 *       $(document).ready(function() {
 *         $("p").inlineDisqussions();
 *       });
 *
 *  See https://github.com/tsi/inlineDisqussions for more info.
 */

// Disqus global vars.
var disqus_shortname;
var disqus_identifier;
var disqus_url;

// @ToDo - dynamic horizontal position/width
(function($) {

  var settings = {};

  $.fn.extend({
    inlineDisqussions: function(options) {

      // Set up defaults
      var defaults = {
        displayCount: true,
      };

      // Overwrite default options with user provided ones.
      settings = $.extend({}, defaults, options);

      // Append #disqus_thread to body if it doesn't exist yet.
      if ($('#disqussions_wrapper').length === 0) {
        $('<div id="disqussions_wrapper"></div>').appendTo($('body'));
      }
      if ($('#disqus_thread').length === 0) {
        $('<div id="disqus_thread"></div>').appendTo('#disqussions_wrapper');
      }

      // Attach a discussion to each paragraph.
      $(this).each(function(i) {
        disqussionNotesHandler(i, $(this));
      });

      // Display comments count.
      if (settings.displayCount) {
        loadDisqusCounter();
      }

    }
  });

  var disqussionNotesHandler = function(i, node) {

    var identifier;
    // You can force a specific identifier by adding an attribute to the paragraph.
    if (node.attr('data-disqus-identifier')) {
      identifier = node.attr('data-disqus-identifier');
    }
    else {
      while ($('[data-disqus-identifier="' + window.location.pathname + 'disqussion-' + i + '"]').length > 0) {
        i++;
      }
      identifier = window.location.pathname + 'disqussion-' + i;
    }

    // Create the discussion note.
    var a = $('<a class="disqussion-link" />')
      .attr('href', window.location.pathname + 'disqussion-'  + i + '#disqus_thread')
      .attr('data-disqus-identifier', identifier)
      .attr('data-disqus-url', window.location.href + 'disqussion-' + i)
      .text('+')
      .wrap('<div class="disqussion" />')
      .parent()
      .css({
        'top': node.offset().top,
        'left': node.offset().left + node.outerWidth()
      })
      .appendTo('#disqussions_wrapper');

    node.attr('data-disqus-identifier', identifier).mouseover(function() {
        a.addClass("hovered");
    }).mouseout(function() {
        a.removeClass("hovered");
    });

    // Load the relative discussion.
    a.delegate('a.disqussion-link', "click", function(e) {
      e.preventDefault();
      loadDisqus($(this), function(source) {
        relocateDisqussion(source);
      });
    });

  };

  var loadDisqus = function(source, callback) {

    var identifier = source.attr('data-disqus-identifier');
    var url = source.attr('data-disqus-url');

    if (window.DISQUS) {
      // If Disqus exists, call it's reset method with new parameters.
      DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = identifier;
          this.page.url = url;
        }
      });

    } else {

      disqus_identifier = identifier;
      disqus_url = url;

      // Append the Disqus embed script to <head>.
      var s = document.createElement('script'); s.type = 'text/javascript'; s.async = true;
      s.src = '//' + disqus_shortname + '.disqus.com/embed.js';
      $('head').append(s);

    }

    callback(source);

  };

  var loadDisqusCounter = function() {

    // Append the Disqus count script to <head>.
    var s = document.createElement('script'); s.type = 'text/javascript'; s.async = true;
    s.src = '//' + disqus_shortname + '.disqus.com/count.js';
    $('head').append(s);

    // Add class to discussions that already have comments.
    window.setTimeout(function() {
      $('.disqussion-link').filter(function() {
        return $(this).text().match(/[1-9]/g);
      }).addClass("has-comments");
    }, 1000);

  };

  var relocateDisqussion = function(el) {

    // Move the discussion to the right position.
    $('#disqus_thread').animate({
      "top": el.offset().top,
      "left": el.offset().left + el.outerWidth(),
      "width": $(window).width() - (el.offset().left + el.outerWidth())
    }, "fast" );

  };

})(jQuery);