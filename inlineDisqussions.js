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


( function ( $ )
{

	var settings = {};

	$.fn.extend( {
		inlineDisqussions: function ( options )
		{

			// Set up defaults
			var defaults = {
				identifier: 'disqussion',
				displayCount: true,
				highlighted: true,
				position: 'right',
				background: 'white',
				maxWidth: 9999,
				disqus_shortname: null,
				disqus_identifier: null,
				disqus_url: null
			};

			// Overwrite default options with user provided ones.
			settings = $.extend( {}, defaults, options );

			if ( !settings.disqus_shortname && console )
			{
				console.warn( "disqus_shortname required for inlineDisqussions" );
				return;
			}

			// Append #disqus_thread to body if it doesn't exist yet.
			if ( $( '#disqussions_wrapper' ).length === 0 )
			{
				$( '<div id="disqussions_wrapper"></div>' ).appendTo( $( 'body' ) );
			}

			if ( $( '#disqus_thread' ).length === 0 )
			{
				$( '<div id="disqus_thread"></div>' ).appendTo( 'body' );
			}
			else
			{
				mainThreadHandler();
			}

			if ( !$( "#disqussions_overlay" ).length )
			{
				$( '<div id="disqussions_overlay"></div>' ).appendTo( $( 'body' ) );
			}

			// Attach a discussion to each paragraph.
			$( this ).each( function ( i )
			{
				disqussionNotesHandler( i, $( this ) );
			} );

			// Display comments count.
			if ( settings.displayCount )
			{
				loadDisqusCounter();
			}

			// Hide the discussion.
			$( 'html' ).click( function ( event )
			{
				if ( $( event.target ).parents( '#disqussions_wrapper, .main-disqussion-link-wrp' ).length === 0 )
				{
					hideDisqussion();
				}
			} );

		}
	} );

	var disqussionNotesHandler = function ( i, node )
	{
		var positionNote = function ( $note )
		{
			$note.css( {
				'top': node.offset().top,
				'left': node.offset().left + ( settings.position == 'right' ? node.width() : -1 * $a.width() )
			} );
		};

		node.wrapInner( "<span/>" );

		var identifier;
		// You can force a specific identifier by adding an attribute to the paragraph.
		if ( node.attr( 'data-disqus-identifier' ) )
		{
			identifier = node.attr( 'data-disqus-identifier' );
		}
		else
		{
			while ( $( '[data-disqus-identifier="' + window.location.pathname + settings.identifier + '-' + i + '"]' ).length > 0 )
			{
				i++;
			}
			identifier = window.location.pathname + settings.identifier + '-' + i;
		}

		// Create the discussion note.
		var cls = "disqussion-link " + ( settings.highlighted ? "disqussion-highlight" : "" );

		var $a = $( '<a class="' + cls + '" />' )
		  .attr( 'href', window.location.pathname + settings.identifier + '-' + i + '#disqus_thread' )
		  .attr( 'data-disqus-identifier', identifier )
		  .attr( 'data-disqus-url', window.location.href + settings.identifier + '-' + i )
		  .attr( 'data-disqus-position', settings.position )
		  .text( '+' )
		  .wrap( '<div class="disqussion" />' );

		var $note = $a
		  .parent()
		  .appendTo( '#disqussions_wrapper' );

		positionNote( $note );

		$( window ).on( "resize", function ()
		{
			positionNote( $note );
		} );

		node.attr( 'data-disqus-identifier', identifier ).on( "mouseover touchstart", function ()
		{
			$( "a.disqussion-link" ).removeClass( "hovered" );
			$note.addClass( "hovered" );
		} ).on( "mouseout", function ()
		{
			$note.removeClass( "hovered" );
		} );

		// Load the relative discussion.
		$note.on( "click", "a", function ( e )
		{
			e.preventDefault();

			if ( $( this ).is( '.active' ) )
			{
				e.stopPropagation();
				hideDisqussion();
			}
			else
			{
				relocateDisqussion( $note );
				loadDisqus( $a );
			}

		} );

	};

	var mainThreadHandler = function ()
	{
		// Create the discussion note.
		if ( $( 'a.main-disqussion-link' ).length === 0 )
		{
			var $a = $( '<a class="main-disqussion-link" />' )
			  .attr( 'href', window.location.pathname + '#disqus_thread' )
			  .text( 'Comments' )
			  .wrap( '<h2 class="main-disqussion-link-wrp" />' )
			  .parent()
			  .insertBefore( '#disqus_thread' );

			// Load the relative discussion.
			$a.on( "click", function ( e )
			{
				e.preventDefault();

				if ( $( this ).is( '.active' ) )
				{
					e.stopPropagation();
				}
				else
				{
					loadDisqus( $( this ), function ( source )
					{
						relocateDisqussion( source, true );
					} );
				}

			} );

		}

	};

	var loadDisqus = function ( source, callback )
	{
		var identifier = source.attr( 'data-disqus-identifier' );
		var url = source.attr( 'data-disqus-url' );

		$( "#disqus_thread" ).empty();

		if ( window.DISQUS )
		{
			// If Disqus exists, call it's reset method with new parameters.
			DISQUS.reset( {
				reload: true,
				config: function ()
				{
					this.page.identifier = identifier;
					this.page.url = url;
				}
			} );
		}
		else
		{
			settings.disqus_identifier = identifier;
			settings.disqus_url = url;

			// Append the Disqus embed script to <head>.
			var s = document.createElement( 'script' );
			s.type = 'text/javascript';
			s.async = true;
			s.src = '//' + settings.disqus_shortname + '.disqus.com/embed.js';
			$( 'head' ).append( s );
		}

		// Add 'active' class.
		$( 'a.disqussion-link, a.main-disqussion-link' ).removeClass( 'active' ).filter( source ).addClass( 'active' );

		// Highlight
		if ( source.is( '.disqussion-highlight' ) )
		{
			highlightDisqussion( identifier );
		}

		if ( callback )
		{
			callback( source );
		}
	};

	var loadDisqusCounter = function ()
	{
		// Append the Disqus count script to <head>.
		var s = document.createElement( 'script' );
		s.type = 'text/javascript';
		s.async = true;
		s.src = '//' + settings.disqus_shortname + '.disqus.com/count.js';
		$( 'head' ).append( s );

		// Add class to discussions that already have comments.
		window.setTimeout( function ()
		{
			$( '.disqussion-link' ).filter( function ()
			{
				return $( this ).text().match( /[1-9]/g );
			} ).addClass( "has-comments" );
		}, 1000 );

	};

	var relocateDisqussion = function ( $note, main )
	{
		// Move the discussion to the right position.
		var css = {};
		if ( main === true )
		{
			$( '#disqus_thread' ).removeClass( "positioned" );
			css = {
				'position': 'static',
				'width': 'auto'
			};
		}
		else
		{
			var anchor = $note.find( "a" ).attr( "data-disqus-identifier" );
			$( '#disqus_thread' ).detach().appendTo( '[data-disqus-identifier="' + anchor + '"]' );
		}
		//else
		//{
		//	$( '#disqus_thread' ).addClass( "positioned" )
		//	css = {
		//		'position': 'absolute'
		//	};
		//}
		css.backgroundColor = settings.background;

		var noteOffset = $note.offset();

		var animate = {
			top: noteOffset.top,
		};


		if ( $note.attr( 'data-disqus-position' ) == 'right' )
		{
			animate.left = noteOffset.left + $note.outerWidth();
			animate.width = Math.min( parseInt( $( window ).width() - ( noteOffset.left + $note.outerWidth() ), 10 ), settings.maxWidth );
		}
		else if ( $note.attr( 'data-disqus-position' ) == 'left' )
		{
			animate.left = noteOffset.left - Math.min( parseInt( noteOffset.left, 10 ), settings.maxWidth );
			animate.width = Math.min( parseInt( noteOffset.left, 10 ), settings.maxWidth );
		}

		$( '#disqus_thread' ).stop().fadeIn( 'fast' ).animate( animate, "fast" ).css( css );

	};

	var hideDisqussion = function ()
	{
		$( '#disqus_thread' ).stop().fadeOut( 'fast' );
		$( 'a.disqussion-link' ).removeClass( 'active' );

		// settings.highlighted
		$( '#disqussions_overlay' ).fadeOut( 'fast' );
		$( 'body' ).removeClass( 'disqussion-highlight' );
		$( '[data-disqus-identifier]' ).removeClass( 'disqussion-highlighted' );
	};

	var highlightDisqussion = function ( identifier )
	{
		$( 'body' ).addClass( 'disqussion-highlight' );
		$( '#disqussions_overlay' ).fadeIn( 'fast' );
		$( '[data-disqus-identifier]' )
		  .removeClass( 'disqussion-highlighted' )
		  .filter( '[data-disqus-identifier="' + identifier + '"]:not(".disqussion-link")' )
		  .addClass( 'disqussion-highlighted' );
	};

} )( jQuery );
