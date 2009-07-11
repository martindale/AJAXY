/**
 * jQuery Ajaxy Plugin (balupton edition) - Ajax extension for history remote
 * Copyright (C) 2008-2009 Benjamin Arthur Lupton
 * http://www.balupton/projects/jquery_ajaxy/
 *
 * This file is part of jQuery History Plugin (balupton edition).
 * 
 * jQuery Ajaxy Plugin (balupton edition) is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * jQuery Ajaxy Plugin (balupton edition) is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with jQuery History Plugin (balupton edition).  If not, see <http://www.gnu.org/licenses/>.
 *
 * @name jqsmarty: jquery.ajaxy.js
 * @package jQuery Ajaxy Plugin (balupton edition)
 * @version 1.0.1-final
 * @date July 11, 2009
 * @category jquery plugin
 * @author Benjamin "balupton" Lupton {@link http://www.balupton.com}
 * @copyright (c) 2008-2009 Benjamin Arthur Lupton {@link http://www.balupton.com}
 * @license GNU Affero General Public License - {@link http://www.gnu.org/licenses/agpl.html}
 * @example Visit {@link http://jquery.com/plugins/project/jquery_history_bal} for more information.
 * 
 * 
 * I would like to take this space to thank the following projects, blogs, articles and people:
 * - jQuery {@link http://jquery.com/}
 * - jQuery UI History - Klaus Hartl {@link http://www.stilbuero.de/jquery/ui_history/}
 * - Really Simple History - Brian Dillard and Brad Neuberg {@link http://code.google.com/p/reallysimplehistory/}
 * - jQuery History Plugin - Taku Sano (Mikage Sawatari) {@link http://www.mikage.to/jquery/jquery_history.html}
 * - jQuery History Remote Plugin - Klaus Hartl {@link http://stilbuero.de/jquery/history/}
 * - Content With Style: Fixing the back button and enabling bookmarking for ajax apps - Mike Stenhouse {@link http://www.contentwithstyle.co.uk/Articles/38/fixing-the-back-button-and-enabling-bookmarking-for-ajax-apps}
 * - Bookmarks and Back Buttons {@link http://ajax.howtosetup.info/options-and-efficiencies/bookmarks-and-back-buttons/}
 * - Ajax: How to handle bookmarks and back buttons - Brad Neuberg {@link http://dev.aol.com/ajax-handling-bookmarks-and-back-button}
 *
 **
 ***
 * CHANGELOG
 **
 * v1.0.1-final, July 11, 2009
 * - Restructured a little bit
 * - Documented
 * - Added get and set functions for misc
 * - Added support for Ajaxy error headers
 * - Cleaned go/request
 *
 * v1.0.0-final, June 19, 2009
 * - Been stable for over a year now, pushing live.
 * 
 * v0.1.0-dev, July 24, 2008
 * - Initial Release
 * 
 */

// Start of our jQuery Plugin
(function($)
{	// Create our Plugin function, with $ as the argument (we pass the jQuery object over later)
	// More info: http://docs.jquery.com/Plugins/Authoring#Custom_Alias
	
	/**
	 * Debug
	 */
	if (typeof console === 'undefined') {
		console = typeof window.console !== 'undefined' ? window.console : {};
	}
	console.log			= console.log 			|| function(){};
	console.debug		= console.debug 		|| console.log;
	console.warn		= console.warn			|| console.log;
	console.error		= console.error			|| function(){var args = [];for (var i = 0; i < arguments.length; i++) { args.push(arguments[i]); } alert(args.join("\n")); };
	console.trace		= console.trace			|| console.log;
	console.group		= console.group			|| console.log;
	console.groupEnd	= console.groupEnd		|| console.log;
	console.profile		= console.profile		|| console.log;
	console.profileEnd	= console.profileEnd	|| console.log;
	
	/**
	 * Helpers for $.fn.ajaxify
	 */
	var ajaxify_helper = {
		a: function(event){
			var Ajaxy = $.Ajaxy;
			// We have a ajax link
			var $this = $(this);
			var hash = Ajaxy.format($this.attr('href'));
			if ( !Ajaxy.request(hash) ) {
				// No change, Stop click
				event.preventDefault();
			}
			// Done
			return true;
		},
		form: function(event){
			var Ajaxy = $.Ajaxy;
			// We have a ajax form
			var $form = $(this);
			// Get values
			var values = {};
			$form.find('input,option,textarea,select').each(function(){
				var $input = $(this);
				if ( $input.is(':radio,:checkbox') && !$input.is(':selected,:checked') ) {
					// Multi select not selected
					return true;
				}
				// Set value
				var name = $input.attr('name') || null;
				if ( !name ) return true;
				if ( name.indexOf('[]') !== -1 ) {
					// We want an array
					if ( typeof values[name] === 'undefined' ) {
						values[name] = [];
					}
					values[name].push($input.val() || $input.text());
				} else {
					values[name] = $input.val();
				}
			});
			var hash = $form.attr('action').replace(/[?\.]?\/?/, '#/');
			// not supported: var method = $form.attr('method').toLowerCase();
			Ajaxy.request({
				'hash':	hash,
				'data':	values
			});
			return false;
		}
	};
	
	/**
	 * Ajaxify an Element
	 * Eg. $('#id').ajaxify();
	 * @param {Object} options
	 */
	$.fn.ajaxify = function ( options ) {
		var Ajaxy = $.Ajaxy;
		var $this = $(this);
		// Ajaxify the controllers
		for ( var controller in $.Ajaxy.controllers ) {
			$.Ajaxy.ajaxifyController(controller);
		}
		// Add the onclick handler for ajax compatiable links
		$this.find('a.ajaxy').unbind('click',ajaxify_helper.a).click(ajaxify_helper.a);
		// Add the onclick handler for ajax compatiable forms
		$this.find('form.ajaxy').unbind('submit',ajaxify_helper.form).submit(ajaxify_helper.form);
		// And chain
		return this;
	};
	
	/**
	 * Ajaxy
	 */
	$.Ajaxy = {
		
		// -----------------
		// Options
		
		/**
		 * User configuration
		 */
		options: {
			base_url: '',
			analytics: true,
			auto_ajaxify: true,
			debug: false
		},
		
		// -----------------
		// Variables
		
		/**
		 * Have we been constructed
		 */
		constructed: false,
		
		/**
		 * Our controllers
		 */
		controllers: {},
		
		/**
		 * Any data to be joined to a hash
		 */
		hashdata: {},
		
		/**
		 * Queue for our events
		 * @param {Object} hash
		 */
		ajaxqueue: [],
		
		/**
		 * Our assigned data
		 * @param {Object} data
		 */
		data: {},
		
		// --------------------------------------------------
		// Functions
		
		/**
		 * Format a hash accordingly
		 * @param {String} hash
		 */
		format: function (hash){
			var Ajaxy = $.Ajaxy; var History = $.History;
			// Trim the base url off the front
			hash = hash.replace(Ajaxy.options.base_url, '');
			// History format
			hash = History.format(hash);
			// All good
			return hash;
		},
		
		/**
		 * Bind controllers
		 * Either via Ajaxy.bind(controller, options), or Ajaxy.bind(controllers)
		 * @param {String} controller
		 * @param {Object} options
		 */
		bind: function ( controller, options ) {
			var Ajaxy = $.Ajaxy;
			// Add a controller
			if ( typeof options === 'undefined' && typeof controller === 'object' ) {
				// Array of controllers
				for (index in controller) {
					Ajaxy.bind(index, controller[index]);
				}
				return true;
			} else if ( typeof options === 'function' ) {
				// We just have the response handler
				options = {
					'response': options
				}
			} else if ( typeof options !== 'object' ) {
				// Unknown handlers
				console.error('AJAXY: Bind: Unknown option type', controller, options);
				return false;
			}
			
			// Create the controller
			if ( typeof Ajaxy.controllers[controller] === 'undefined' ) {
				Ajaxy.controllers[controller] = {
					trigger:function(action){
						return Ajaxy.trigger(controller, action);
					},
					response_data: {},
					request_data: {},
					error_data: {}
				};
			}
			
			// Bind the handlers to the controller
			for ( option in options ) {
				Ajaxy.controllers[controller][option] = options[option];
			}
			
			// Ajaxify the controller
			Ajaxy.ajaxifyController(controller);
			
			// Done
			return true;
		},
		
		/**
		 * Ajaxify a particullar controller
		 * @param {String} controller
		 */
		ajaxifyController: function(controller) {
			var Ajaxy = $.Ajaxy; var History = $.History;
			// Do selector
			if ( typeof this.controllers[controller]['selector'] !== 'undefined' ) {
				// We have a selector
				$(function(){
					// Onload
					var $els = $(Ajaxy.controllers[controller]['selector']);
					var handler = function(){
						// Check to make sure we aren't already where we need to be
						var hash = Ajaxy.format($(this).attr('href'));
						if ( hash === History.getHash() ) return false;
						// Fire the request handler
						Ajaxy.trigger(controller, 'request');
						// Cancel link
						return false;
					};
					$els.click(handler);
				})
			}
		},
		
		/**
		 * Trigger the action for the particular controller
		 * @param {Object} controller
		 * @param {Object} action
		 * @param {Object} args
		 * @param {Object} params
		 */
		trigger: function ( controller, action, args, params ) {
			var Ajaxy = $.Ajaxy;
			// Fire the state handler
			params = params || {};
			args = args || [];
			var i, n, list, call_generic;
			call_generic = true;
			
			// Fire specific controller handler
			if ( typeof Ajaxy.controllers[controller] === 'undefined' ) {
				console.error('AJAXY: trigger: no controller', [controller, action]);
				console.trace();
				return false;
			}
			if ( typeof Ajaxy.controllers[controller][action] === 'undefined' )
			{	// We have a specific handler
				console.error('AJAXY: trigger: no controller handler', [controller, action]);
				console.trace();
				return false;
			}
			
			// Apply the params
			if ( typeof params.response_data !== 'undefined' ) {
				Ajaxy.controllers[controller].response_data = params.response_data;
			}
			
			// Fire the specific handler
			var handler = Ajaxy.controllers[controller][action];
			if ( handler.apply(Ajaxy.controllers[controller], args) === false ) {
				// Break
				call_generic = false;
			}
			
			// Fire generic
			if ( call_generic && controller !== '_generic' ) {
				Ajaxy.controllers['_generic'].response_data = params.response_data;
				Ajaxy.trigger('_generic', action, args);
			}
			
			// Done
			return true;
		},
		
		/**
		 * Get a piece of data
		 * @param {Object} name
		 */
		get: function ( name ) {
			var Ajaxy = $.Ajaxy;
			
			//
			if ( typeof Ajaxy.data[name] !== 'undefined' ) {
				return Ajaxy.data[name];
			} else {
				return undefined;
			}
		},
		
		/**
		 * Set a piece (or pieces) of data
		 * Ajaxy.set(data), Ajaxy.set(name, value)
		 * @param {Object} data
		 * @param {Object} value
		 */
		set: function ( data, value ) {
			var Ajaxy = $.Ajaxy;
			
			// Set route data
			if ( typeof value === 'undefined' ) {
				if ( typeof data === 'object' ) {
					Ajaxy.data.extend(true, data);
				}
			} else {
				Ajaxy.data[data] = value;
			}
		},
		
		/**
		 * Go to the route
		 * @param {Object} data
		 */
		go: function ( data ) {
			var Ajaxy = $.Ajaxy;
			return Ajaxy.request(data);
		},
		
		/**
		 * Perform the Ajaxy request
		 * @param {Object} data
		 */
		request: function ( data ) {
			var Ajaxy = $.Ajaxy; var History = $.History;
			
			// Ensure data format
			if ( typeof data === 'string' ) {
				data = {
					hash: data
				};
			}
			data = $.extend({
				url:	null,
				hash:	null,
				data:	{}
			}, data);
			
			// Check
			if ( !data.hash ) {
				console.error('Ajaxy.request: No Hash');
				return false;
			} else {
				data.hash = Ajaxy.format(data.hash);
			}
			
			// Figure it out
			if ( data.hash !== History.getHash() && Ajaxy.options.debug ) {
				console.debug('Ajaxy.reqest: Trigger but no change.',data.hash);
			}
			
			// Assign data for reuse
			Ajaxy.hashdata[data.hash] = data;
			
			// Trigger hash
			History.go(data.hash);
		},
		
		/**
		 * Handler for a hashchange
		 * @param {Object} hash
		 */
		hashchange: function ( hash ) {
			var Ajaxy = $.Ajaxy; var History = $.History;
			
			// Add to AJAX queue
			hash = Ajaxy.format(hash);
			Ajaxy.ajaxqueue.push(hash);
			if ( Ajaxy.ajaxqueue.length !== 1 ) {
				// Already processing an event
				return false;
			}
			
			// Fire the analytics
			if ( this.options.analytics && typeof pageTracker !== 'undefined' ) {
				pageTracker._trackPageview('/'+hash);
			}
			
			// Trigger Request
			Ajaxy.trigger('_generic', 'request');
			
			// Grab data
			var request_data = $.extend({
				hash:hash,
				data:{}
			}, Ajaxy.hashdata[hash]);
			
			// Perform AJAX request
			$.ajax({
				type:		'post',
				url:		this.options.base_url+(hash || '?'),
				data:		request_data.data,
				dataType:	'json',
				success: 	function ( response_data, status ) {
					// Success function
					
					// Handler queue
					Ajaxy.ajaxqueue.shift()
					var queue_hash = Ajaxy.ajaxqueue.pop();
					if ( queue_hash && queue_hash !== hash  ) {
						Ajaxy.ajaxqueue = []; // abandon others
						Ajaxy.hashchange(queue_hash);
						return false; // don't care for this
					}
					
					// Check controller
					if ( typeof response_data.controller === 'undefined' ) {
						return Ajaxy.trigger('_generic', 'error');
					}
					
					// Trigger handler
					return Ajaxy.trigger(response_data.controller, 'response', [], {
						response_data: response_data
					});
				},
				error:		function ( XMLHttpRequest, textStatus, errorThrown ) {
					// Error function
				
					// Check if we really are an error
					if ( XMLHttpRequest.responseText && XMLHttpRequest.responseText[0] === '{' ) {
						var response_data = JSON.parse(XMLHttpRequest.responseText);
						return this.success(response_data, textStatus);
					}
					
					// Handler queue
					Ajaxy.ajaxqueue.shift()
					var queue_hash = Ajaxy.ajaxqueue.pop();
					if ( queue_hash && queue_hash !== hash  ) {
						Ajaxy.ajaxqueue = []; // abandon others
						Ajaxy.hashchange(queue_hash);
						return false; // don't care for this
					}
					
					// Set data
					Ajaxy.controllers['_generic'].error_data = {
						XMLHttpRequest: XMLHttpRequest,
						textStatus: textStatus,
						errorThrown: errorThrown
					};
					
					// Trigger handler
					return Ajaxy.trigger('_generic', 'error');
				}
			});
			
			// Done
			return true;
		},
		
		// --------------------------------------------------
		// Constructors
		
		/**
		 * Configure Ajaxy
		 * @param {Object} options
		 */
		configure: function ( options ) {
			var Ajaxy = $.Ajaxy; var History = $.History;
			
			// Extract
			var controllers, routes;
			if ( typeof options.controllers !== 'undefined' ) {
				controllers = options.controllers; delete options.controllers;
			}
			if ( typeof options.routes !== 'undefined' ) {
				routes = options.routes; delete options.routes;
			}
			
			// Set options
			Ajaxy.options = $.extend(Ajaxy.options, options);
			
			// Set params
			Ajaxy.bind(controllers);
			
			// Done
			return true;
		},
		
		/**
		 * Construct Ajaxy
		 * @param {Object} options
		 */
		construct: function ( )
		{	// Construct our Plugin
			var Ajaxy = $.Ajaxy; var History = $.History;
			
			// Check if we've been constructed
			if ( Ajaxy.constructed ) {
				return;
			} else {
				Ajaxy.constructed = true;
			}
			
			// Set AJAX History Handler
			History.bind(function(hash)
			{	// History Handler
				return Ajaxy.hashchange(hash);
			});
			
			// Modify the document
			$(function()
			{	// On document ready
				Ajaxy.domReady();
				History.domReady();
			});
			
			// All done
			return true;
		},
		
		/**
		 * Perform any DOM manipulation
		 */
		domReady: function ( )
		{	// We are good
			var Ajaxy = $.Ajaxy;
			
			// Auto ajaxify?
			if ( Ajaxy.options.auto_ajaxify ) {
				$('body').ajaxify();
			}
			
			// All done
			return true;
		}
	
	};
	
	// Construct
	$.Ajaxy.construct();

// Finished definition
})(jQuery); // We are done with our plugin, so lets call it with jQuery as the argument
