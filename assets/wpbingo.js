window.wpbingo = window.wpbingo || {};

wpbingo.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};

wpbingo.Sections.prototype = _.assignIn({}, wpbingo.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');
    constructor = constructor || this.constructors[type];
    if (_.isUndefined(constructor)) {
      return;
    }
    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container
    });
    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
  },

  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance) {
      var isEventInstance = instance.id === evt.originalEvent.detail.sectionId;
      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }
      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.originalEvent.detail.sectionId;
    });
    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.originalEvent.detail.sectionId;
    });
    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.originalEvent.detail.sectionId;
    });
    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.originalEvent.detail.sectionId;
    });
    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;
    $('[data-section-type=' + type + ']').each(
      function(index, container) {
        this._createInstance(container, constructor);
      }.bind(this)
    );
  }
});

wpbingo.LibraryLoader = (function() {
  var types = {
    link: 'link',
    script: 'script'
  };
  var status = {
    requested: 'requested',
    loaded: 'loaded'
  };
  var cloudCdn = 'https://cdn.shopify.com/shopifycloud/';
  var libraries = {
    youtubeSdk: {
      tagId: 'youtube-sdk',
      src: 'https://www.youtube.com/iframe_api',
      type: types.script
    },
    plyrShopifyStyles: {
      tagId: 'plyr-shopify-styles',
      src: cloudCdn + 'shopify-plyr/v1.0/shopify-plyr.css',
      type: types.link
    },
    modelViewerUiStyles: {
      tagId: 'shopify-model-viewer-ui-styles',
      src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.css',
      type: types.link
    }
  };

  function load(libraryName, callback) {
    var library = libraries[libraryName];
    if (!library) return;
    if (library.status === status.requested) return;
    callback = callback || function() {};
    if (library.status === status.loaded) {
      callback();
      return;
    }
    library.status = status.requested;
    var tag;
    switch (library.type) {
      case types.script:
        tag = createScriptTag(library, callback);
        break;
      case types.link:
        tag = createLinkTag(library, callback);
        break;
    }
    tag.id = library.tagId;
    library.element = tag;
    var firstScriptTag = document.getElementsByTagName(library.type)[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  function createScriptTag(library, callback) {
    var tag = document.createElement('script');
    tag.src = library.src;
    tag.addEventListener('load', function() {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  function createLinkTag(library, callback) {
    var tag = document.createElement('link');
    tag.href = library.src;
    tag.rel = 'stylesheet';
    tag.type = 'text/css';
    tag.addEventListener('load', function() {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  return {
    load: load
  };
})();

wpbingo.Disclosure = (function() {
	var selectors = {
		disclosureInput: '[data-disclosure-input]',
		disclosureOptions: '[data-disclosure-option]'
	};
	function Disclosure($disclosure) {
		this.$container = $disclosure;
		this.cache = {};
		this._cacheSelectors();
		this._connectOptions();
	}
	Disclosure.prototype = _.assignIn({}, Disclosure.prototype, {
		_cacheSelectors: function() {
			this.cache = {
				$disclosureInput: this.$container.find(selectors.disclosureInput),
				$disclosureOptions: this.$container.find(selectors.disclosureOptions)
			};
		},
		_connectOptions: function() {
			this.cache.$disclosureOptions.on('click',function(evt) {
				evt.preventDefault();
				this._submitForm($(evt.currentTarget).data('value'));
			}.bind(this));
		},
		_submitForm: function(value) {
			this.cache.$disclosureInput.val(value);
			this.$container.parents('form').submit();
		},
		unload: function() {
			this.cache.$disclosureOptions.off();
			this.$container.off();
		}
	});
	return Disclosure;
})();

wpbingo.Currency = (function() {
  var moneyFormat = '${{amount}}';
  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || moneyFormat;

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ',';
      decimal = decimal || '.';
      if (isNaN(number) || number === null) {
        return 0;
      }
      number = (number / 100.0).toFixed(precision);
      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        '$1' + thousands
      );
      var centsAmount = parts[1] ? decimal + parts[1] : '';
      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      case 'amount_with_apostrophe_separator':
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }
    return formatString.replace(placeholderRegex, value);
  }
  return {
    formatMoney: formatMoney
  };
})();

wpbingo.collectionPages = (function() {
  var bwpFilter = '.js-page-collection',
	wpbingoCollectionProduct = '#JsCollectionProduct',
	wpbingoFilterContentProduct = '.js-collection-content-product',
	wpbingoFilterSidebar = '.collection-sidebar',
	wpbingoFilterTitle = '.wpbingo-breadcrumbs__inner',	
	wpbingoFacetsContainer = '.active-facets-desktop',
    bwpChangeView = '.js-change-view',
	canbeloaded = true,
    bwpSortBy = '.js-sortby';

  var ajaxFilterParams,
    ajaxFilterGetCollectionUrl,
    ajaxFilterCreateUrl,
    ajaxFilterChangeView,
	ajaxFilterCategory,
	ajaxBreadcrumbsCategory,
	ajaxFilterLoadMore,
	ajaxFilterInfinity,
    ajaxFilterPaging;

	var init = function() {
		if ($(bwpFilter)) {
			var History = window.History;
			History.Adapter.bind(window, 'statechange', function() {
			History.getState();
		  });
		}
		ajaxFilterParams();
		ajaxFilterChangeView();
		ajaxFilterCategory();
		ajaxBreadcrumbsCategory();
		ajaxFilterLoadMore();
		ajaxFilterInfinity();
		ajaxFilterPaging();
	};
	ajaxFilterParams = function() {
		Shopify.queryParams = {};
		if (location.search.length) {
		  for (var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&'); i < aCouples.length; i++) {
			aKeyValue = aCouples[i].split('=');
			if (aKeyValue.length > 1) {
			  Shopify.queryParams[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(aKeyValue[1]);
			}
		  }
		}
	};
	ajaxFilterGetCollectionUrl = function(collection, url) {
		var str = url;
		var indexCollection = str.indexOf(collection);
		if(indexCollection < 0)
			return '';
		str = str.slice(indexCollection + collection.length, str.length);
		var indexSlash = str.indexOf('/') > -1 ? str.indexOf('/') : str.length;
		str = str.slice(0, indexSlash).toLowerCase();
		return str.replace('=', '');
	};
	ajaxFilterCreateUrl = function(baseLink) {
		var newQuery = $.param(Shopify.queryParams).replace(/%2B/g, '+');
		var collectionHandle = ajaxFilterGetCollectionUrl('/collections/', location.pathname);
		var pathName = '/collections/' + collectionHandle;
		var arrayUrl = location.pathname.split('/');
		if (arrayUrl.length >= 4) {
			var currentTagName = arrayUrl[3].split('?').shift();
			if (currentTagName != '') {
				newQuery = newQuery + '+' + currentTagName;
			}
		}
		if (baseLink) {
			if (newQuery != '')
				return baseLink + '?' + newQuery;
			else
				return baseLink;
		}
		return pathName + '?' + newQuery;
	};
	ajaxFilterChangeView = function() {
		cViewCollection = wpbingo.getCookie('wpbingo_view_collection');
		if(cViewCollection){
			$(wpbingoCollectionProduct).removeAttr('class');
			$(wpbingoCollectionProduct).addClass(cViewCollection);
			$(bwpChangeView).removeClass('active');
			$('[data-view='+cViewCollection+']').addClass('active');
		}
		$(bwpFilter).on('click', bwpChangeView, function(e) {
			e.preventDefault();
			if (!$(this).hasClass('active')) {
				$('.product-card__image-wrapper.slider .js-carousel',wpbingoFilterContentProduct).each(function() {
					$(this).slick('refresh');
				});
				wpbingo.setCookie("wpbingo_view_collection", $(this).data('view'), 1);
				$(bwpChangeView).removeClass('active');
				$(this).addClass('active');
				$(wpbingoCollectionProduct).removeAttr('class');
				$(wpbingoCollectionProduct).addClass($(this).data('view'));
			}
		});
	};
	ajaxFilterPaging = function() {
		$(bwpFilter).on('click', '.js-collection-pagination a', function(e) {
			e.preventDefault();
			var pageURL = $(this).attr('href').match(/page=\d+/g);
			if (pageURL) {
				Shopify.queryParams.page = parseInt(pageURL[0].match(/\d+/g));
				var searchParams = ( window.history.state && window.history.state.searchParams ) ? window.history.state.searchParams : '';
				var newurl = ajaxFilterCreateUrl();
				history.pushState({ searchParams }, '', `${newurl}${searchParams && '&'.concat(searchParams)}`);
				$.ajax({
					type: 'get',
					url: `${newurl}${searchParams && '&'.concat(searchParams)}`,
					success: function(data) {
						$(wpbingoFilterContentProduct).replaceWith($(data).find(wpbingoFilterContentProduct));
						$('.product-card__image-wrapper.slider .js-carousel',wpbingoFilterContentProduct).each(function() {
							wpbingo.elementslickCarousel($(this));
						});
						if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
						wpbingo.click_atribute_image();
						wpbingo.zoom_thumb();
						wpbingo.popup_product_card();
						if(window.SPR){
							SPR.initRatingHandler (); 
							SPR.initDomEls ();
							SPR.loadProducts ();
							SPR.loadBadges ();
						}
						wpbingo.countdown();
						initButtons();
						initButtonsCompare();
						wpbingo.sidebarCollection();
						wpbingo.toggleSidebar();
						wpbingo.product_result_count();
					},
					error: function(xhr, text) {
						console.log(text);
					}
				});
				$('body,html').animate({
					scrollTop: $('.header').height()
				}, 600);
			}
		});
	};
	ajaxFilterLoadMore = function() {
		$(bwpFilter).on('click', '.js-collection-loadmore a', function(e) {
			e.preventDefault();
			var pageURL = $(this).attr('href');
			$("#loadmore-wait").show();      // show “Please wait…”
			$(this).addClass('active');
			if (pageURL) {
				Shopify.queryParams.page = parseInt(pageURL.match(/\d+/g));
				var searchParams = ( window.history.state && window.history.state.searchParams ) ? window.history.state.searchParams : '';
				var newurl = ajaxFilterCreateUrl();
				$.ajax({
					type: 'get',
					url: pageURL,
					success: function(data) {
						$(".products__row",wpbingoFilterContentProduct).append($(data).find(".products__row").html());
						$('.js-collection-loadmore').empty();
						$(".js-collection-loadmore",wpbingoFilterContentProduct).append($(data).find(".js-collection-loadmore").html());
						$('#product_result_count').empty();
						$("#product_result_count",wpbingoFilterContentProduct).append($(data).find("#product_result_count").html());
						$('.product-card__image-wrapper.slider .js-carousel',wpbingoFilterContentProduct).each(function() {
							if(!$(this).hasClass("slick-initialized")){
								wpbingo.elementslickCarousel( $(this) );
							}
						});
						if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
						if(window.SPR){
							SPR.registerCallbacks();
							SPR.initRatingHandler();
							SPR.initDomEls();
							SPR.loadProducts();
							SPR.loadBadges();
						}
                      	wpbingo.countdown();
						wpbingo.click_atribute_image();
						wpbingo.zoom_thumb();
						wpbingo.popup_product_card();
						initButtons();
						initButtonsCompare();
						wpbingo.sidebarCollection();
						wpbingo.christmas_snow();
						wpbingo.product_result_count();
						$(this).removeClass('active');
						$("#loadmore-wait").hide();

					},
					error: function(xhr, text) {
						console.log(text);
					}
				});
			}
		});
	};
	ajaxFilterInfinity = function() {
		if( $(".js-collection-infinity").length > 0 ){
			$(window).scroll(function(){
				if ( $(document).scrollTop() > ( $(document).height() - 2000 ) && canbeloaded==true && $( ".js-collection-infinity >a").length > 0 ){
					$( ".js-collection-infinity a").addClass("active");
					var pageURL = $("a",".js-collection-infinity").attr('href');
					if (pageURL) {
						Shopify.queryParams.page = parseInt(pageURL[0].match(/\d+/g));
						var searchParams = ( window.history.state && window.history.state.searchParams ) ? window.history.state.searchParams : '';
						var newurl = ajaxFilterCreateUrl();
						$.ajax({
							type: 'get',
							url: pageURL,
							beforeSend: function( xhr ){
								
								canbeloaded = false;
							},
							success: function(data) {
								canbeloaded = true;
								$(".products__row",wpbingoFilterContentProduct).append($(data).find(".products__row").html());
								$('.js-collection-infinity').empty();
								$(".js-collection-infinity",wpbingoFilterContentProduct).append($(data).find(".js-collection-infinity").html());
								$('#product_result_count').empty();
								$("#product_result_count",wpbingoFilterContentProduct).append($(data).find("#product_result_count").html());
								$('.product-card__image-wrapper.slider .js-carousel',wpbingoFilterContentProduct).each(function() {
									if(!$(this).hasClass("slick-initialized")){
										wpbingo.elementslickCarousel( $(this) );
									}
								});
								if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
								if(window.SPR){
									SPR.initRatingHandler();
									SPR.initDomEls();
									SPR.loadProducts();
									SPR.loadBadges();
								}
								wpbingo.click_atribute_image();
								wpbingo.zoom_thumb();
								wpbingo.popup_product_card();
                             	wpbingo.countdown();
								initButtons();
								initButtonsCompare();
								wpbingo.christmas_snow();
								wpbingo.sidebarCollection();
								wpbingo.product_result_count();
							},
							error: function(xhr, text) {
								console.log(text);
							}
						});
					}
				}
			});
		}
	};	
	ajaxFilterCategory = function($element) {
		var wpbingoFacetsWrapper = '.FacetsWrapperDesktop ';
		if($element){
			var $categories = $element;
		}else{
			var $categories = $('.sidebar-categories');
		}
		if ( $('.wpbingo-breadcrumbs').hasClass('have-collection') ) {
			var $collection = true;
		}
		$($categories).on('click', 'a', function(e){
			e.preventDefault();
			var pageURL = $(this).attr('href');
			var newTitle = $(this).attr('title');
			History.pushState({
			  param: Shopify.queryParams
			}, pageURL, pageURL);	
			delete Shopify.queryParams.page;
			$("#pre-loading").addClass('load-product');
			$('#pre-loading .pre-loading__bar').css({"width":"40%"});
			$.ajax({
				type: 'get',
				url: pageURL,
				success: function(data) {
					document.title = newTitle;			
					$(wpbingoFilterContentProduct).replaceWith($(data).find(wpbingoFilterContentProduct));
					$(wpbingoFilterSidebar).replaceWith($(data).find(wpbingoFilterSidebar));
					$(wpbingoFilterTitle).replaceWith($(data).find(wpbingoFilterTitle));
					$(wpbingoFacetsContainer).replaceWith($(data).find(wpbingoFacetsContainer));
					if($('.js-page-collection').hasClass('dropdown')){
						$(wpbingoFacetsWrapper).replaceWith($(data).find(wpbingoFacetsWrapper));
						wpbingo.countActiveSidebar();
					}
					$('.wpbingo-section--collection-breadcrumb').replaceWith($(data).find('.wpbingo-section--collection-breadcrumb'));
					if ( $collection ) {
						wpbingo.elementslickCarousel( $('.wpbingo-breadcrumbs__image .js-carousel') );
					}			
					ajaxFilterCategory();
					ajaxBreadcrumbsCategory( $('.wpbingo-breadcrumbs .bwp_slider-carousel') );
					wpbingo.click_atribute_image();
					wpbingo.zoom_thumb();
					$('.product-card__image-wrapper.slider .js-carousel',wpbingoFilterContentProduct).each(function() {
						wpbingo.elementslickCarousel( $(this) );
					});
					if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
					wpbingo.hideLoading();
					wpbingo.popup_product_card();
					if(window.SPR){
						SPR.initRatingHandler ();
						SPR.initDomEls ();
						SPR.loadProducts ();
						SPR.loadBadges ();
					}
                  	wpbingo.countdown();
					ajaxFilterChangeView();
					wpbingo.sidebarCollection();
					initButtons();
					initButtonsCompare();
					wpbingo.toggleSidebar();
					wpbingo.product_result_count();
					$('#pre-loading .pre-loading__bar').css({"width":"100%"});
					setTimeout(function() { 
						$('#pre-loading .pre-loading__bar').css({"width":"0"});
						$("#pre-loading").removeClass('load-product');
					}, 500);
				},
				error: function(xhr, text) {
					console.log(text);
				}
			});			
			$('body,html').animate({
				scrollTop: $('.header').height() + $('.wpbingo-breadcrumbs').height()
			}, 600);
		});
	};	
	ajaxBreadcrumbsCategory = function($element) {
		if($element){
			var $categories = $element;
		}else{
			var $categories = $('.wpbingo-breadcrumbs .bwp_slider-carousel');
		}
		if ( $('.wpbingo-breadcrumbs').hasClass('have-collection') ) {
			var $collection = true;
		}
		$($categories).on('click', 'a', function(e){
			e.preventDefault();
			var pageURL = $(this).attr('href');
			var newTitle = $("h2",$(this)).text();
			History.pushState({
			  param: Shopify.queryParams
			}, pageURL, pageURL);	
			delete Shopify.queryParams.page;
			$("#pre-loading").addClass('load-product');
			$('#pre-loading .pre-loading__bar').css({"width":"40%"});
			$.ajax({
				type: 'get',
				url: pageURL,
				success: function(data) {
					document.title = newTitle;			
					$(wpbingoFilterContentProduct).replaceWith($(data).find(wpbingoFilterContentProduct));
					$(wpbingoFilterSidebar).replaceWith($(data).find(wpbingoFilterSidebar));
					$(wpbingoFilterTitle).replaceWith($(data).find(wpbingoFilterTitle));
					$(wpbingoFacetsContainer).replaceWith($(data).find(wpbingoFacetsContainer));
					$('.wpbingo-breadcrumbs__image').replaceWith($(data).find('.wpbingo-breadcrumbs__image'));
					ajaxFilterCategory( $('.sidebar-categories') );
					$('.product-card__image-wrapper.slider .js-carousel',wpbingoFilterContentProduct).each(function() {
						wpbingo.elementslickCarousel( $(this) );
					});
					if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
					ajaxBreadcrumbsCategory();
					wpbingo.click_atribute_image();
					wpbingo.zoom_thumb();
					wpbingo.popup_product_card();
					wpbingo.hideLoading();
					if(window.SPR){
						SPR.initRatingHandler ();
						SPR.initDomEls ();
						SPR.loadProducts ();
						SPR.loadBadges ();
					}
                 	wpbingo.countdown();
					wpbingo.sidebarCollection();
					initButtonsCompare();
					initButtons();
					wpbingo.countActiveSidebar();
					if(!$('.js-page-collection').hasClass('dropdown')){
						wpbingo.toggleSidebar();
					}
					if ( $collection ) {
						wpbingo.elementslickCarousel( $('.wpbingo-breadcrumbs__image .js-carousel') );
					}
					ajaxFilterChangeView();
					$('#pre-loading .pre-loading__bar').css({"width":"100%"});
					setTimeout(function() { 
						$('#pre-loading .pre-loading__bar').css({"width":"0"});
						$("#pre-loading").removeClass('load-product');
					}, 500);
				},
				error: function(xhr, text) {
					console.log(text);
				}
			});			
			$('body,html').animate({
				scrollTop: $('.header').height() + $('.wpbingo-breadcrumbs').height()
			}, 600);
		});
	};
	return init;
})();

wpbingo.Variants = (function() {
  function Variants(options) {
    this.$container = options.$container;
    this.product = options.product;
    this.productSelectOption = options.productSelectOption;
    this.singleOptionSelector = options.singleOptionSelector;
    this.originalSelectorId = options.originalSelectorId;
    this.enableHistoryState = options.enableHistoryState;
    this.currentVariant = this._getVariantFromOptions();
    $(this.singleOptionSelector, this.$container).on(
		'change',this._onSelectChange.bind(this)
    );
  }

  Variants.prototype = _.assignIn({}, Variants.prototype, {
    _getCurrentOptions: function() {
		var currentOptions = _.map(
			$(this.singleOptionSelector, this.$container),
			function(element) {
				var $element = $(element);
				var type = $element.attr('type');
				var currentOption = {};
				if (type === 'radio' || type === 'checkbox') {
					if ($element[0].checked) {
						currentOption.value = $element.val();
						currentOption.index = $element.data('index');
						return currentOption;
					} else {
						return false;
					}
				} else {
					currentOption.value = $element.val();
					currentOption.index = $element.data('index');
					return currentOption;
				}
			}
		);
		currentOptions = _.compact(currentOptions);
		return currentOptions;
    },

    _getVariantFromOptions: function() {
		var selectedValues = this._getCurrentOptions();
		var variants = this.product.variants;
		var found = _.find(variants, function(variant) {
			return selectedValues.every(function(values) {
				return _.isEqual(variant[values.index], values.value);
			});
		});
		return found;
    },

    _onSelectChange: function() {
		var variant = this._getVariantFromOptions();
		if ($('[data-single-option-button]', this.$container).length && $('.color-select', this.$container).length < 1 ) {
			this._updateVariantsButton();
			if (!variant || !variant.available) {
				this._updateVariantsButtonDisabed();
				return;
			}
		}
		this.$container.trigger({
			type: 'variantChange',
			variant: variant
		});
		if (!variant) return;
		this._updateMasterSelect(variant);
		this._updateMedia(variant);
		this._updatePrice(variant);
		this._updateQuantity(variant);
		this._updateOption(variant);
		this._updatePricesticky(variant);
		this._updateSKU(variant);
		this._updateLabelvariant(variant);
		this.currentVariant = variant;
		this._updatePickUp(variant);
		this._updateBtnText(variant);
		this._updateDelivery(variant);
		if (this.enableHistoryState) {
			this._updateHistoryState(variant);
		}
    },

    _updateVariantsButtonDisabed: function() {
		for (var i = 2; i <= 3; i++) {
			if ($(this.productSelectOption + i, this.$container).length) {
				var isUpdate = false;
				$(this.productSelectOption + i + ' ' + this.singleOptionSelector, this.$container).each(function() {
					var $element = $(this);
					var type = $element.attr('type');
					if (type === 'radio' || type === 'checkbox') {
						if (this.checked && $element.hasClass('disabled')) {
							$element.prop('checked', false);
							isUpdate = true;
							return false;
						}
					}
				});
				$(this.productSelectOption + i + ' ' + this.singleOptionSelector, this.$container).each(function() {
					var $element = $(this);
					var type = $element.attr('type');
					if (isUpdate && (type === 'radio' || type === 'checkbox') && !$element.hasClass('disabled')) {
						$element.prop('checked', true);
						isUpdate = false;
						$element.trigger('change');
						return false;
					}
				});
			}
		}
    },

    _updateVariantsButton: function() {
		var selectedValues = this._getCurrentOptions();
		var variants = this.product.variants;
		for (var i = 2; i <= 3; i++) {
			if ($(this.productSelectOption + i, this.$container).length) {
				var $parent = this.productSelectOption + i;
				$($parent + ' ' + this.singleOptionSelector, this.$container).each(function() {
					var $self = $(this);
					var optionValue = $self.val();
					var foundIndex;
					if (i === 2) {
						foundIndex = _.findIndex(variants, function(variant) {
							variant.option1 = variant.option1.toString();
							selectedValues[0].value = selectedValues[0].value.toString();
							variant.option2 = variant.option2.toString();
							optionValue = optionValue.toString();
							return variant.option1 === selectedValues[0].value &&
							variant.option2 === optionValue &&
							variant.available === true;
						});
						
					} else if (i === 3) {
						foundIndex = _.findIndex(variants, function(variant) {
							variant.option1 = variant.option1.toString();
							variant.option2 = variant.option2.toString();
							variant.option3 = variant.option3.toString();
							selectedValues[0].value = selectedValues[0].value.toString();
							selectedValues[1].value = selectedValues[1].value.toString();
							optionValue = optionValue.toString();
							return variant.option1 === selectedValues[0].value && variant.option2 === selectedValues[1].value &&
							variant.option3 === optionValue &&
							variant.available === true;
						});
					}
					if (foundIndex !== -1) {
						if ($($parent +'.color-select', this.$container).length > 0) {
							$self.removeClass('disabled');
							$self.next('label').removeClass('disabled');
						}else{
							$self.removeAttr('disabled', 'disabled').removeClass('disabled');
							$self.next('label').removeClass('disabled');
						}
						
					} else {
						if ($($parent +'.color-select', this.$container).length  > 0) {
							$self.addClass('disabled');
							$self.next('label').addClass('disabled');
						}else{
							$self.attr('disabled', 'disabled').addClass('disabled');
							$self.next('label').addClass('disabled');
						}
					}
				});
			}
		}
    },

    _updateMedia: function(variant) {
		var variantMedia = variant.featured_media || {};
		var currentVariantMedia = this.currentVariant.featured_media || {};
		var isMatchingPreviewImage = false;
		if (variantMedia.preview_image && currentVariantMedia.preview_image) {
			isMatchingPreviewImage = variantMedia.preview_image.src === currentVariantMedia.preview_image.src;
		}
		if (!variant.featured_media || isMatchingPreviewImage) return;
		this.$container.trigger({
			type: 'variantMediaChange',
			variant: variant
		});
		
    },

    _updatePrice: function(variant) {
		if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		if (
			variant.price === this.currentVariant.price &&
			variant.compare_at_price === this.currentVariant.compare_at_price
		){
			return;
		}
		this.$container.trigger({
			type: 'variantPriceChange',
			variant: variant
		});
    },
	
	_updateQuantity: function(variant){
		if( $(".product-single .content-variant_inventory").length > 0 ){
			setTimeout(function(){ $( ".product-single .content-variant_inventory" ).load(window.location.href + ".content-variant_inventory .js-product-avaiable" ); }, 10);
		}
	},
	
	_updateOption: function(){ 
		setTimeout(function(){ $( "#option-selector" ).load(window.location.href + " #option-selector" ); }, 10);
	},
	
	_updatePricesticky: function(){ 
		setTimeout(function(){ $( "#price-sticky" ).load(window.location.href + " #price-sticky" ); }, 10);
	},
	
    _updateSKU: function(variant) {
		if (variant.sku === this.currentVariant.sku) {
			return;
		}
		this.$container.trigger({
			type: 'variantSKUChange',
			variant: variant
		});
    },
	_updateLabelvariant: function(variant) {
		var $element = $('.product-single .product-single__form .variants-wrapper')
		$('.mutil_slider-single').removeClass('active');
		$($element).each(function() {
			var $this = $(this);
			if( $("select",$this).length > 0 ){
				var value = $( "select",$this).find(':selected').val();
			}else{
				var value = $('input:checked',$this).attr('value');
			}
            var value_variants = value.trim().replace(/\s+/g, '_');
			$('.variants__label span',$this).html(value);
			$('.mutil_slider-single.'+ value_variants +'').addClass('active');
		});
    },
    _updateHistoryState: function(variant) {
		if (!history.replaceState || !variant) {
			return;
		}
		var newurl =
			window.location.protocol +
			'//' +
			window.location.host +
			window.location.pathname +
			'?variant=' +
			variant.id;
		window.history.replaceState({path: newurl},'',newurl
		);
		if( $(".product-single #buy_more_form").length > 0 ){
			$('#buy_more_form input[name="items[][id]"]').attr('value',variant.id);
			wpbingo.discount_single();
		}
    },
	
	_updatePickUp: function(variant) {
		if( $(".product-single .product-single__pick_up").length > 0 ){
			$('.product-single .product-single__pick_up').addClass('load-pick_up').css("height", $('.product-single .product-single__pick_up').height() + 'px');
			$(".product-single .product-single__pick_up").empty();
			wpbingo.pick_up(variant.id);
			setTimeout(function(){
				$('.product-single .product-single__pick_up').removeClass('load-pick_up').removeAttr('style');
			}, 1000);
		}
    },
	_updateBtnText: function(variant) {
		if( $(".product-single .product-single__buttons .btn--add-to-cart .btn__text").length > 0 ){
			setTimeout(function(){ $( ".product-single .product-single__buttons .btn--add-to-cart" ).load(window.location.href + " .btn__text" ); }, 10);
		}
		if( $(".sticky-cart-single").length > 0 ){
			setTimeout(function(){ $( ".sticky-cart-single .btn--add-to-cart" ).load(window.location.href + " .btn__text" ); }, 10);
		}
    },
	_updateDelivery: function(variant) {
		if( $(".product-single .estimated_delivery").length > 0 && $(".product-single .section-estimated_delivery[data-incoming]").length > 0 ){
			$('.product-single .section-estimated_delivery').addClass('load-delivery').css("height", $('.product-single .section-estimated_delivery').height() + 'px');
			setTimeout(function(){
				$( ".product-single .section-estimated_delivery" ).load(window.location.href + ".product-single .estimated_delivery" );				
			}, 10);
			setTimeout(function(){
				if( $(".product-single .time_hour").length > 0 ){
					wpbingo.time_estimated_delivery();
				}
			}, 1200);
			setTimeout(function(){
				if( $(".product-single .time_hour").length > 0 ){
					$('.product-single .section-estimated_delivery').removeClass('load-delivery').removeAttr('style');
				}
			}, 1400);
		}
    },
    _updateMasterSelect: function(variant) {
		$(this.originalSelectorId, this.$container).val(variant.id);
    }
  });

  return Variants;
})();

wpbingo.ProductModel = (function() {
  var modelJsonSections = {};
  var models = {};
  var xrButtons = {};
  var selectors = {
    productMediaGroup: '.js-product-media-group',
    productMediaGroupWrapper: '.js-product-single-media',
    xrButton: '[data-shopify-xr]',
    xrButtonSingle: '[data-shopify-xr-single]'
  };

  var classes = {
    viewInSpaceDisabled: 'product-single__view-in-space--disabled'
  };

  function init(modelViewerContainers, sectionId) {
    modelJsonSections[sectionId] = {
      loaded: false
    };

    modelViewerContainers.each(function(index) {
      var $modelViewerContainer = $(this);
      var mediaId = $modelViewerContainer.data('media-id');
      var $modelViewerElement = $(
        $modelViewerContainer.find('model-viewer')[0]
      );
      var modelId = $modelViewerElement.data('model-id');

      if (index === 0) {
        var $xrButton = $modelViewerContainer
          .closest(selectors.productMediaGroupWrapper)
          .find(selectors.xrButtonSingle);

        xrButtons[sectionId] = {
          $element: $xrButton,
          defaultId: modelId
        };
      }

      models[mediaId] = {
        modelId: modelId,
        sectionId: sectionId,
        $container: $modelViewerContainer,
        $element: $modelViewerElement
      };
    });

    window.Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: setupShopifyXr
      }
    ]);

    if (models.length < 1) return;
    window.Shopify.loadFeatures([
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: setupModelViewerUi
      }
    ]);
    wpbingo.LibraryLoader.load('modelViewerUiStyles');
  }

  function setupShopifyXr(errors) {
    if (errors) return;
    if (!window.ShopifyXR) {
      document.addEventListener('shopify_xr_initialized', function(event) {
        if (event.detail.shopifyXREnabled) {
          setupShopifyXr();
        } else {
          $(selectors.xrButton).addClass(classes.viewInSpaceDisabled);
        }
      });
      return;
    }

    for (var sectionId in modelJsonSections) {
      if (modelJsonSections.hasOwnProperty(sectionId)) {
        var modelSection = modelJsonSections[sectionId];
        if (modelSection.loaded) continue;
        var $modelJson = $('#ModelJson-' + sectionId);
        window.ShopifyXR.addModels(JSON.parse($modelJson.html()));
        modelSection.loaded = true;
      }
    }
    window.ShopifyXR.setupXRElements();
  }

  function setupModelViewerUi(errors) {
    if (errors) return;
    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (!model.modelViewerUi) {
          model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
        }
        setupModelViewerListeners(model);
      }
    }
  }

  function setupModelViewerListeners(model) {
    var xrButton = xrButtons[model.sectionId];
    var $productMediaGroup = model.$container.closest(
      selectors.productMediaGroup
    );

    model.$element
      .on('shopify_model_viewer_ui_toggle_play', function() {
        wpbingo.updateSlickSwipe($productMediaGroup, false);
      })
      .on('shopify_model_viewer_ui_toggle_pause', function() {
        wpbingo.updateSlickSwipe($productMediaGroup, true);
      });

    model.$container.on('mediaVisible', function() {
      xrButton.$element.attr('data-shopify-model3d-id', model.modelId);
      model.modelViewerUi.play();
    });

    model.$container
      .on('mediaHidden', function() {
        xrButton.$element.attr('data-shopify-model3d-id', xrButton.defaultId);
        model.modelViewerUi.pause();
      })
      .on('xrLaunch', function() {
        model.modelViewerUi.pause();
      });
  }

  function removeSectionModels(sectionId) {
    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (model.sectionId === sectionId) {
          models[key].modelViewerUi.destroy();
          delete models[key];
        }
      }
    }
    delete modelJsonSections[sectionId];
  }

  return {
    init: init,
    removeSectionModels: removeSectionModels
  };
})();

function onYouTubeIframeAPIReady() {
  wpbingo.ProductVideo.loadVideos(wpbingo.ProductVideo.hosts.youtube);
}

wpbingo.ProductVideo = (function() {
  var videos = {};
  var hosts = {
    html5: 'html5',
    youtube: 'youtube'
  };
  var selectors = {
    productMediaWrapper: '.js-product-media',
    productMediaGroup: '.js-product-media-group',
  };
  var attributes = {
    enableVideoLooping: 'enable-video-looping',
    videoId: 'video-id'
  };

  function init(videoContainer, sectionId) {
    if (!videoContainer.length) {
      return;
    }
    var videoElement = videoContainer.find('iframe, video')[0];
    var mediaId = videoContainer.data('mediaId');
    if (!videoElement) {
      return;
    }
    videos[mediaId] = {
      mediaId: mediaId,
      sectionId: sectionId,
      host: hostFromVideoElement(videoElement),
      container: videoContainer,
      element: videoElement,
      ready: function() {
        createPlayer(this);
      }
    };
    var video = videos[mediaId];
    switch (video.host) {
      case hosts.html5:
        window.Shopify.loadFeatures([
          {
            name: 'video-ui',
            version: '1.1',
            onLoad: setupPlyrVideos
          }
        ]);
        wpbingo.LibraryLoader.load('plyrShopifyStyles');
        break;
      case hosts.youtube:
        wpbingo.LibraryLoader.load('youtubeSdk');
        break;
    }
  }

  function setupPlyrVideos(errors) {
    if (errors) {
      fallbackToNativeVideo();
      return;
    }
    loadVideos(hosts.html5);
  }

  function createPlayer(video) {
    if (video.player) {
      return;
    }
    var productMediaWrapper = video.container.closest(
      selectors.productMediaWrapper
    );
    var enableLooping = productMediaWrapper.data(attributes.enableVideoLooping);
    switch (video.host) {
      case hosts.html5:
        video.player = new Shopify.Plyr(video.element, {
          loop: { active: enableLooping }
        });
        var $productMediaGroup = $(video.container).closest(
          selectors.productMediaGroup
        );
        video.player.on('seeking', function() {
          wpbingo.updateSlickSwipe($productMediaGroup, false);
        });
        video.player.on('seeked', function() {
          wpbingo.updateSlickSwipe($productMediaGroup, true);
        });
        break;
      case hosts.youtube:
        var videoId = productMediaWrapper.data(attributes.videoId);
        video.player = new YT.Player(video.element, {
          videoId: videoId,
          events: {
            onStateChange: function(event) {
              if (event.data === 0 && enableLooping) event.target.seekTo(0);
            }
          }
        });
        break;
    }

    productMediaWrapper.on('mediaHidden xrLaunch', function() {
      if (!video.player) return;
      if (video.host === hosts.html5) {
        video.player.pause();
      }
      if (video.host === hosts.youtube && video.player.pauseVideo) {
        video.player.pauseVideo();
      }
    });

    productMediaWrapper.on('mediaVisible', function() {
      if (!video.player) return;
      if (video.host === hosts.html5) {
        video.player.play();
      }
      if (video.host === hosts.youtube && video.player.playVideo) {
        video.player.playVideo();
      }
    });
  }

  function hostFromVideoElement(video) {
    if (video.tagName === 'VIDEO') {
      return hosts.html5;
    }
    if (video.tagName === 'IFRAME') {
      if (
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(
          video.src
        )
      ) {
        return hosts.youtube;
      }
    }
    return null;
  }

  function loadVideos(host) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        if (video.host === host) {
          video.ready();
        }
      }
    }
  }

  function fallbackToNativeVideo() {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        if (video.nativeVideo) continue;
        if (video.host === hosts.html5) {
          video.element.setAttribute('controls', 'controls');
          video.nativeVideo = true;
        }
      }
    }
  }

  function removeSectionVideos(sectionId) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        if (video.sectionId === sectionId) {
          if (video.player) video.player.destroy();
          delete videos[key];
        }
      }
    }
  }

  return {
    init: init,
    hosts: hosts,
    loadVideos: loadVideos,
    removeSectionVideos: removeSectionVideos
  };
})();

// PRODUCT SECTION
wpbingo.Product = (function() {
	function Product(container) {
		var $window = $(window);
		var $container = (this.$container = $(container));
		var sectionId = $container.attr('data-section-id');
		this.settings = {
			productPageLoad: false,
			preloadImage: false,
			enableHistoryState: $container.data('enable-history-state'),
			namespace: '.productSection',
			sectionId: sectionId
		};
		this.selectors = {
			productMediaGroup: '.js-product-media-group',
			productMediaGroupItem: '.js-product-media-item',
			productMediaWrapper: '.js-product-media',
			productMediaTypeModel: '[data-product-media-type-model]',
			productMediaTypeVideo: '[data-product-media-type-video]',
			productThumbnails: '.js-product-thumbnails',
			buyTogether: '.buy-together-products',
			productThumbnail: '[data-product-thumbnail]',
			productImageZoom: '[data-mfp-src]',
			meta: '.product-single__meta',
			productWrapper: '.product-single',
			productSelectOption: '.js-product-select-option--',
			originalSelectorId: '.js-product-select',
			singleOptionSelector: '.js-single-option-selector',
			slickDots: '[data-slick-dots]',
			slickNext: '[data-slick-next]',
			slickPrevious: '[data-slick-previous]',
			variantColor: '[data-color]',
		};
		this.classes = {
			hide: 'd-none',
			priceContainerUnitAvailable: 'price-container--unit-available',
			productInventoryInStock: 'product-avaiable__text--instock',
			productInventoryOutStock: 'product-avaiable__text--outstock',
		};
		this.slickMediaSettings = {
		  slide: this.selectors.productMediaGroupItem,
		  rows: 0,
		  accessibility: true,
		  arrows: true,
		  appendDots: this.selectors.slickDots,
		  prevArrow: this.selectors.slickPrevious,
		  nextArrow: this.selectors.slickNext,
		  dots: false,
		  rtl : wpbingo.rtl_slick() ,
		  infinite: $(this.selectors.productMediaGroup).data('infinite') ? true : false,
		  draggable: $(this.selectors.productMediaGroup).data('draggable') ? true : false,
		  adaptiveHeight: true,
		  fade: $(this.selectors.productMediaGroup).data('fade') ? true : false,
		  customPaging: function(slick, index) {
			var slideA11yString = wpbingo.strings.productSlideLabel
			  .replace('[slide_number]', index + 1)
			  .replace('[slide_max]', slick.slideCount);

			var mediaA11yString = $(
			  '[data-slick-index="' + index + '"]',
			  this.$container
			).data('slick-media-label');

			var ariaCurrent = index === 0 ? ' aria-current="true"' : '';
			return (
			  '<a href="javascript:void(0)' +
			  '" aria-label="' +
			  slideA11yString +
			  ' ' +
			  mediaA11yString +
			  '" aria-controls="slick-slide0' +
			  index +
			  '"' +
			  ariaCurrent +
			  '></a>'
			);
		  }.bind(this)
		};
		if (!$('#ProductJson-' + sectionId).html()) {
		  return;
		}
		this.productSingleObject = JSON.parse(
		  document.getElementById('ProductJson-' + sectionId).innerHTML
		);

		this.zoomType = $container.data('image-zoom-type');
		this.isStackedLayout = $container.data('stacked-layout');
		this.isNothumLayout = $container.data('nothum');
		this.focusableElements = [
		  'iframe',
		  'input',
		  'button',
		  'video',
		  '[tabindex="0"]'
		].join(',');

		this.slickThumbsSettings = {
			slidesToShow: $(this.selectors.productThumbnails).data('columns'),
			slidesToScroll: 1,
			rows: 0,
			accessibility: true,
			arrows: true,
			dots: false,
			infinite: false,
			focusOnSelect: true,
			adaptiveHeight: true,
			rtl: ($('body').hasClass("rtl") && !$(this.selectors.productThumbnails).data('vertical')) ? true : false ,
			vertical: $(this.selectors.productThumbnails).data('vertical') ? true : false,
			responsive: [
				{
					breakpoint: 767,
					settings: {
						slidesToShow: 4,
						vertical: false,
					}
				},
			]
		};

		if (!this.isStackedLayout && !this.isNothumLayout && $(this.selectors.productMediaGroup, this.$container) && $(this.selectors.productThumbnails, this.$container)) {
			this.slickMediaSettings.asNavFor = this.selectors.productThumbnails + '-' + sectionId;
			this.slickThumbsSettings.asNavFor = this.selectors.productMediaGroup + '-' + sectionId;
		}else{
			if ($(window).width() < 991 && $(this.selectors.productWrapper).data('layout_thumb') == 'gird-sticky') {
				this.slickMediaSettings.asNavFor = this.selectors.productThumbnails + '-' + sectionId;
				this.slickThumbsSettings.asNavFor = this.selectors.productMediaGroup + '-' + sectionId;
			}
		}
		this.view_gallery_product();
		this.event_buy_together();
		this.event_group_product();
		this.initBreakpoints();
		this.initProductVariant();
		this.initModelViewerLibraries();
		this.initShopifyXrLaunch();
		this.initProductVideo();
		this.initStickyProductMeta();
		this.count_view_product();
		this.count_sale_product();
		this.percent_sale_product();
		this.delivery_return();
		this.ask_a_question();
		this.back_in_stock();
		this.single_product_share();
		this.gallery_cursor();
		this.discount_single();
		this.sticky_gird();
		this.sticky_sidebar();
		this.image_360();
		this.tab_information();
		
		var $element = $(".product-single");
		var _data = $element.data();
		$('.product-single__video img').css("width",$(".product-single__thumbnail img").width());
		$('.product-single__video img').css("height",($(".product-single__thumbnail img").height() - 2.5));
		$window
		  .on('load' + this.settings.namespace, wpbingo.initStickyProductMeta)
		  .on(
			'resize' + this.settings.namespace,
			wpbingo.debounce(this.initStickyProductMeta, 150).bind(this)
		  );
	}

  Product.prototype = _.assignIn({}, Product.prototype, {
    initBreakpoints: function() {
		var self = this;
		if (!self.isStackedLayout) {
			self.createMediaCarousel();
			self.createThumbnailCarousel();
		} else {
			if ($(window).width() < 991) {
				self.createMediaCarousel();
				self.createThumbnailCarousel();
			}else{
				enquire.register(wpbingo.variables.mediaMobile, {
					match: function() {
						self.createMediaCarousel();
					},
					unmatch: function() {
						self.destroyMediaCarousel();
					}
				});
			}
		}
    },
    initProductVariant: function() {
		var options = {
			$container: this.$container,
			enableHistoryState: this.settings.enableHistoryState || false,
			productSelectOption: this. selectors.productSelectOption,
			singleOptionSelector: this.selectors.singleOptionSelector,
			originalSelectorId: this.selectors.originalSelectorId + '--' + this.settings.sectionId,
			product: this.productSingleObject
		};
		var count = $(this.selectors.productThumbnails, this.$container).data('columns');
		this.variants = new wpbingo.Variants(options);
		var featured_media = this.variants.currentVariant.featured_media;
		if(!$('.js-product-single-media').hasClass('no-variants') && !$('.js-product-single-media >.row').hasClass('mutil_slider-single') && featured_media ){
			this.showVariantMedia(this.variants.currentVariant,true);
		}
		this.$container.on('variantChange' + this.settings.namespace,this.productPage.bind(this));
		this.$container.on('variantMediaChange' + this.settings.namespace,this.showVariantMedia.bind(this));
		if(this.variants.product.media.length <= count){
			$(this.selectors.productThumbnails, this.$container).addClass('no-transform');
		}
    },
    initModelViewerLibraries: function() {
		if (!this.$container.data('has-model')) return;
		var $modelViewerElements = $(
			this.selectors.productMediaTypeModel,
			this.$container
		);
		wpbingo.ProductModel.init($modelViewerElements, this.settings.sectionId);
    },

    initShopifyXrLaunch: function() {
      $(document).on(
        'shopify_xr_launch',
        function() {
          var $currentMedia = $(
            this.selectors.productMediaWrapper +
              ':not(.' +
              this.classes.hide +
              ')',
            this.$container
          );
          $currentMedia.trigger('xrLaunch');
        }.bind(this)
      );
    },

    initProductVideo: function() {
      var sectionId = this.settings.sectionId;

      $(this.selectors.productMediaTypeVideo, this.$container).each(function() {
        var $videoContainer = $(this);
        wpbingo.ProductVideo.init($videoContainer, sectionId);
      });
    },

    trapCarouselFocus: function($slider, removeFocusTrap) {
      if (!$slider) return;

      $slider
        .find('.slick-slide:not(.slick-active)')
        .find(this.focusableElements)
        .attr('tabindex', removeFocusTrap ? '0' : '-1');

      $slider
        .find('.slick-active')
        .find(this.focusableElements)
        .attr('tabindex', '0');
    },

    updateCarouselDotsA11y: function(nextSlide) {
      var $dotLinks = $(this.selectors.slickDots).find('a');
      $dotLinks
        .removeAttr('aria-current')
        .eq(nextSlide)
        .attr('aria-current', 'true');
    },
	view_gallery_product: function() {
		$element = $(".product-single");
		$(".product-media__wrapper.product-media__wrapper--image",$element).bind("click", function(e) {
			e.preventDefault();
			var groups = $(this).closest('.js-product-media-group');
			var items = [];
			var gallery = [];
			var $j = 0;
			var $i = 0;
			$('.js-product-media-item',groups).each(function(){
				$("img",$(this)).data( "number", $j );
				if($("img",$(this)).data("image") == true){
					var $href = $("img",$(this)).attr("src");
					if($href){
						gallery[$j] = {"href":$href};
						$j++;
					}
				}
			});
			if(gallery){
				$.each( gallery, function( key, value ){
					if( value ){
						items[$i] = {"src":value.href,w: $(".mfp-image",$element).width() * 3,h: $(".mfp-image",$element).height() * 3};
						$i++;
					}
				});
				var pswpElement = document.querySelectorAll('.pswp')[0];
				var options = {
					index: $("img",$(this)).data("number"),
					closeOnScroll: false,
					history: false,
					shareEl: false,
				};
				var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
				gallery.init();
			}
		});
    },
	event_buy_together: function() {
		$(document).on('change', '#buy_together_form .item-product input[type="checkbox"]', function (e) {
			var $this = $(this);
			if( $this.closest('.item-product').hasClass('active') ){
				$this.closest('.item-product').removeClass('active');
			}else{
				$this.closest('.item-product').addClass('active');
			}
			moneyFormat = wpbingo.strings.moneyFormat;
			var $thisWrap = $this.closest('.item-products-wrap');
			var $thisWpbingoWrap = $thisWrap.closest('.buy-together-products');
			var $thisProductsBtWrap = $thisWpbingoWrap.find('.item-products-wrap');
			var total_items = 0;
			var total_price = 0;
			$thisWrap.find('.item-product').each(function () {
				var this_product_id = $(this).attr('data-product_id');
				if ( $(this).hasClass('active') ) {
					$('input[type="hidden"]',$(this)).prop('disabled', false);
					$('input[type="number"]',$(this)).prop('disabled', false);
					if( $('select',$(this)).length > 0 ){
						var this_price = $('select',$(this)).find(':selected').data('price');
						$('select',$(this)).prop('disabled', false);
					}else{
						var this_price = $('input[type="checkbox"]',$(this)).attr('data-price');
					}
					if (!isNaN(this_price)) {
						total_price = Number(total_price) + Number(this_price);
					}
					Number(total_items++);
					$thisProductsBtWrap.find('.item-product-inner[data-product_id="' + this_product_id + '"]').removeClass('buy-together-hidden');
				}
				else {
					$thisProductsBtWrap.find('.item-product-inner[data-product_id="' + this_product_id + '"]:not(.buy-together-content)').addClass('buy-together-hidden');
					$('input[type="hidden"]',$(this)).prop('disabled', true);
					$('input[type="number"]',$(this)).prop('disabled', true);
					if( $('select',$(this)).length > 0 ){
						$('select',$(this)).prop('disabled', true);
					}
				}
			});
			$thisWpbingoWrap.find('.for-items-text span').html(total_items);
			$thisWpbingoWrap.find('.total-price-html span').html('<span class="money">'+ wpbingo.Currency.formatMoney(total_price,moneyFormat) + '</span>');
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		});
		$(document).on('change', '#buy_together_form .item-product select', function (e) {
			moneyFormat = wpbingo.strings.moneyFormat;
			var $this = $(this);
			var $thisWrap = $this.closest('.item-products-wrap');
			var $thisWpbingoWrap = $thisWrap.closest('.buy-together-products');
			var total_items = 0;
			var total_price = 0;
			var $parent = $(this).closest('.item-product');
			var this_product_id = $parent.attr('data-product_id');
			var $parent_image = $(this).closest('.buy-together-products').find('.item-product-inner[data-product_id="' + this_product_id + '"]');
			var this_price_selected = $(this).find(':selected').data('price');
			var this_image_selected = $(this).find(':selected').data('image');
			$('.buy-together-price',$parent).html('<span class="money">'+ wpbingo.Currency.formatMoney(this_price_selected,moneyFormat) + '</span>');
			$(".image img",$parent_image).attr("src", this_image_selected);
			$(".image img",$parent_image).attr("srcset", this_image_selected);
			$thisWrap.find('.item-product').each(function () {
				if ( $(this).hasClass('active') ) {
					if( $('select',$(this)).length > 0 ){
						var this_price = $('select',$(this)).find(':selected').data('price');
					}else{
						var this_price = $('input[type="checkbox"]',$(this)).attr('data-price');
					}
					if (!isNaN(this_price)) {
						total_price = Number(total_price) + Number(this_price);
					}
					Number(total_items++);
				}
			});
			$thisWpbingoWrap.find('.total-price-html span').html('<span class="money">'+ wpbingo.Currency.formatMoney(total_price,moneyFormat) + '</span>');
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		});	
		$('#buy_together_form .buy-together-add-all-to-cart').on('click',function(e){
			e.preventDefault();
			$(this).addClass('active');
			let addToCartForm = document.querySelector('#buy_together_form');
			let formData = new FormData(addToCartForm);
			var params = {
				type: 'POST',
				url: '/cart/add.js',
				data: formData,
				processData: false,
				contentType: false,
				dataType: 'json',
				success: function(line_item) {
					$('.buy-together-add-all-to-cart').removeClass('active');
					ajaxCart.load();
					if($('.js-drawer').length){
						$('body').addClass('drawer--open');
					}
					$('.js-drawer-close').on('click', function() {
						$('body').removeClass('drawer--open');
					});
				},
				error: function(XMLHttpRequest, textStatus) {
					if (typeof errorCallback === 'function') {
						errorCallback(XMLHttpRequest, textStatus);
					} else {
						ShopifyAPI.onError(XMLHttpRequest, textStatus);
					}
				}
			};
			jQuery.ajax(params);
		});
    },
	
	event_group_product: function() {
		$('#group_table_product .add-group-to-cart').on('click',function(e){
			e.preventDefault();
			$(this).removeClass('added');
			$(this).addClass('active');
			let addToCartForm = document.querySelector('#group_table_product');
			let formData = new FormData(addToCartForm);
			var params = {
				type: 'POST',
				url: '/cart/add.js',
				data: formData,
				processData: false,
				contentType: false,
				dataType: 'json',
				success: function(line_item) {
					$('#group_table_product .add-group-to-cart').removeClass('active');
					$('#group_table_product .add-group-to-cart').addClass('added');
					setTimeout(function() {
						$('#group_table_product .add-group-to-cart').removeClass('added');
					}, 3000);
					ajaxCart.load();
					if($('.js-drawer').length > 0){
						$('body').addClass('drawer--open');
					}
					$('.js-drawer-close').on('click', function() {
						$('body').removeClass('drawer--open');
					});
				},
				error: function(XMLHttpRequest, textStatus) {
					if (typeof errorCallback === 'function') {
						errorCallback(XMLHttpRequest, textStatus);
					} else {
						ShopifyAPI.onError(XMLHttpRequest, textStatus);
					}
				}
			};
			jQuery.ajax(params);
		});
    },
	
    translateCarouselDots: function(totalSlides, nextSlide, dotStyle) {
		if (totalSlides <= dotStyle.max) {
			return;
		}
		var calculatedTranslateDistance = 0;
		var maxTranslateDistance = (totalSlides - dotStyle.max) * dotStyle.width;
		if (nextSlide >= dotStyle.max - 1) {
			calculatedTranslateDistance =
				(nextSlide + 2 - dotStyle.max) * dotStyle.width;
			calculatedTranslateDistance =
				maxTranslateDistance < calculatedTranslateDistance
				? maxTranslateDistance
				: calculatedTranslateDistance;
		}
		$(this.selectors.slickDots).find('ul').css('transform', 'translateX(-' + calculatedTranslateDistance + 'px)');
    },

    triggerMediaChangeEvent: function(mediaId) {
		var $otherMedia = $(this.selectors.productMediaWrapper, this.$container);
		$otherMedia.trigger('mediaHidden');
		var $newMedia = $(
			this.selectors.productMediaWrapper,
			this.$container
		).filter('[data-media-id="' + mediaId + '"]');
		$newMedia.trigger('mediaVisible');
    },

    showVariantMedia: function(evt,check) {
		if(check){
			var variant = evt;
		}else{
			var variant = evt.variant;
		}
		var variantMediaId =
        this.settings.sectionId + '-' + variant.featured_media.id;
		var $newMedia = $(
			this.selectors.productMediaWrapper +
			'[data-media-id="' +
			variantMediaId +
			'"]'
		);
		this.triggerMediaChangeEvent(variantMediaId);

		var mediaIndex;

		if (!wpbingo.variables.isMobile && this.isStackedLayout) {
			mediaIndex = $newMedia.closest('.slick-slide').index();
			if (mediaIndex !== 0 || wpbingo.variables.productPageLoad) {
				if (wpbingo.variables.productPageSticky) {
					$('html, body').animate(
						{
							scrollTop: $newMedia.offset().top
						}, 250
					);
				} else {
					var currentScroll = $(document).scrollTop();
					$newMedia
						.closest(
							$(this.selectors.productMediaGroupItem, this.$container)
						)
						.prependTo(
							$(this.selectors.productMediaGroup, this.$container)
						);
					$(document).scrollTop(currentScroll);
				}
			}
		} else {
			mediaIndex = $newMedia.closest('.slick-slide').data('slick-index');
			if (_.isUndefined(mediaIndex)) {
				return;
			}
			if (mediaIndex !== 0 || wpbingo.variables.productPageLoad) {
				$(this.selectors.productMediaGroup, this.$container).slick(
					'slickGoTo',
					mediaIndex
				);
			}
		}
		if (!wpbingo.variables.productPageLoad) {
			wpbingo.variables.productPageLoad = true;
		}
    },

    setFeaturedMedia: function() {
      var mediaId = $(this.selectors.productMediaGroup, this.$container)
        .find('.slick-slide.slick-current.slick-active ' + this.selectors.productMediaWrapper)
        .attr('data-media-id');
      this.triggerMediaChangeEvent(mediaId);
    },

    createMediaCarousel: function() {
		if ( $(this.selectors.productMediaGroupItem).length < 2 || !$(this.selectors.productMediaGroup, this.$container) || this.isCarouselActive ) {
			return; }
		this.isCarouselActive = true;
		var dotStyle = {
			max: 9,
			width: 20
		};
		var focusTrapped = false;
		$(this.selectors.productMediaGroupItem, this.$container).on(
			'focusin',
			function() {
				if (focusTrapped) {
					return;
				}
				this.trapCarouselFocus($(this.selectors.productMediaGroup));
				focusTrapped = true;
			}.bind(this)
		);
		if( $('.mutil_slider-single').length > 0 ){
			var sectionId = this.settings.sectionId;
			var $config = this.slickMediaSettings;
			if (!this.isStackedLayout && !this.isNothumLayout && $(this.selectors.productMediaGroup, this.$container) && $(this.selectors.productThumbnails, this.$container)) {
				var asNavFor = true ;
			}
			$('.mutil_slider-single').each(function(index){
				$config['nextArrow'] = $(("[data-slick-next]"),$(this));
				$config['prevArrow'] = $(("[data-slick-previous]"),$(this));
				if (asNavFor) {
					$config['asNavFor'] = '.js-product-thumbnails' + '-' + sectionId + '-' + (index+1);
				}
				$('.js-product-media-group', $(this)).slick($config);
			});
		}else{
			$(this.selectors.productMediaGroup, this.$container).slick(this.slickMediaSettings).on('beforeChange',function(event, slick, currentSlide, nextSlide) {
				this.updateCarouselDotsA11y(nextSlide);
				this.translateCarouselDots(slick.slideCount, nextSlide, dotStyle);
			}.bind(this))
		}
    },

    destroyMediaCarousel: function() {
		if ( !$(this.selectors.productMediaGroup, this.$container).length ||
			!this.isCarouselActive ) {
			return;
		}
		this.trapCarouselFocus(
			$(this.selectors.productMediaGroup, this.$container),
			true
		);
		$(this.selectors.productMediaGroup, this.$container).slick('unslick');
		this.isCarouselActive = false;
    },

    createThumbnailCarousel: function() {
		if( $('.mutil_slider-single').length > 0 ){
			var sectionId = this.settings.sectionId;
			var $configThumb = this.slickThumbsSettings;
			if (!this.isStackedLayout && !this.isNothumLayout && $(this.selectors.productMediaGroup, this.$container) && $(this.selectors.productThumbnails, this.$container)) {
				var asNavFor = true ;
			}
			$('.mutil_slider-single').each(function(index){
				if(asNavFor){
					$configThumb.asNavFor = '.js-product-media-group' + '-' + sectionId + '-' + (index+1);
				}
				$('.js-product-thumbnails',$(this)).slick($configThumb);
			});
		}else{
			$(this.selectors.productThumbnails, this.$container).slick(this.slickThumbsSettings);
		}
    },

    initStickyProductMeta: function() {
		var $meta = $(this.selectors.meta, this.$container);
		var $wrapper = $(this.selectors.productWrapper, this.$container);
		if (
			!$meta.length ||
			$(this.selectors.productMediaWrapper, this.$container).length < 2
		){
			return;
		}
		$meta.trigger('detach.ScrollToFixed');
		if (wpbingo.variables.isMobile) {
			return;
		}
		var productCopyHeight = $meta.outerHeight();
		var productMediaGroupHeight = $(
			this.selectors.productMediaGroup,
			this.$container
		).height();
		var calcLimit = $wrapper.offset().top + $wrapper.height();
		calcLimit -= productCopyHeight;
		if (
			productCopyHeight < productMediaGroupHeight &&
			productCopyHeight < $(window).height()
		){
			wpbingo.variables.productPageSticky = true;
			$meta.scrollToFixed({
			limit: calcLimit
			});
		} else {
			wpbingo.variables.productPageSticky = false;
		}
    },

    getBaseUnit: function(variant) {
		return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    },

    productPage: function(evt) {
		var moneyFormat = wpbingo.strings.moneyFormat;
		var variant = evt.variant;
		var translations = wpbingo.strings;
		var selectors = {
			addToCart: '.btn--add-to-cart',
			addToCartText: '.btn--add-to-cart .btn__text',
			quantityElements: '.js-quantity-selector',
			shopifyPaymentButton: '.shopify-payment-button',
			priceContainer: '[data-price-container]',
			productPrice: '.js-product-price',
			priceA11y: '.js-product-price-a11y',
			comparePrice: '.js-product-compare-price',
			comparePriceA11y: '.js-product-compare-price-a11y',
			comparePriceWrapper: '.product-single__price--wrapper',
			productAvailable: '.js-product-avaiable',
			productAvailableText: '.js-product-avaiable-text',
			unitPrice: '[data-unit-price]',
			unitPriceBaseUnit: '[data-unit-price-base-unit]',
			SKU: '.js-variant-sku'
		};
		if (variant) {
			$(selectors.priceContainer, this.$container).removeClass(this.classes.hide);
			$(selectors.productAvailable, this.$container).removeClass(this.classes.hide);
			$(selectors.productPrice, this.$container).attr('aria-hidden', 'false');
			$(selectors.priceA11y, this.$container).attr('aria-hidden', 'false');
			if (variant.available) {
				$(selectors.addToCart, this.$container).removeClass('disabled').prop('disabled', false);
				$(selectors.addToCartText, this.$container).html(translations.addToCart);
				$(selectors.productAvailableText)
					.removeClass(this.classes.productInventoryOutStock)
					.addClass(this.classes.productInventoryInStock)
					.html(wpbingo.strings.inStock);
			$(selectors.quantityElements, this.$container).removeClass(this.classes.hide);
			$(selectors.shopifyPaymentButton, this.$container).removeClass(this.classes.hide);
			} else {
				$(selectors.addToCart, this.$container).addClass('disabled').prop('disabled', true);
				$(selectors.addToCartText, this.$container).html(translations.soldOut);
				$(selectors.productAvailableText)
					.removeClass(this.classes.productInventoryInStock)
					.addClass(this.classes.productInventoryOutStock)
					.html(wpbingo.strings.outStock);
				$(selectors.quantityElements, this.$container).addClass(this.classes.hide);
				$(selectors.shopifyPaymentButton, this.$container).addClass(this.classes.hide);
			}
			$(selectors.productPrice, this.$container).html(wpbingo.Currency.formatMoney(variant.price, moneyFormat)).removeClass(this.classes.hide);
			if (variant.compare_at_price > variant.price) {
				$(selectors.comparePrice, this.$container).html(
					wpbingo.Currency.formatMoney(variant.compare_at_price, moneyFormat)
				);
				$(selectors.comparePriceWrapper, this.$container).removeClass(this.classes.hide);
				$(selectors.productPrice, this.$container).addClass('on-sale');
				$(selectors.comparePriceWrapper, this.$container).attr('aria-hidden', 'false');
				$(selectors.comparePriceA11y, this.$container).attr('aria-hidden', 'false');
			} else {
				$(selectors.comparePriceWrapper, this.$container).addClass(this.classes.hide).attr('aria-hidden', 'true');
				$(selectors.productPrice, this.$container).removeClass('on-sale');
				$(selectors.comparePrice, this.$container).html('');
				$(selectors.comparePriceA11y, this.$container).attr('aria-hidden', 'true');
			}

			if (variant.unit_price) {
				var $unitPrice = $(selectors.unitPrice, this.$container);
				var $unitPriceBaseUnit = $(
					selectors.unitPriceBaseUnit,
					this.$container
				);
				$unitPrice.html(wpbingo.Currency.formatMoney(variant.unit_price, moneyFormat));
				$unitPriceBaseUnit.html(this.getBaseUnit(variant));
				$(selectors.priceContainer, this.$container).addClass(this.classes.priceContainerUnitAvailable);
			}
			$(selectors.SKU).html(variant.sku != '' ? variant.sku : 'N/A');
		} else {
			$(selectors.addToCart, this.$container).addClass('disabled').prop('disabled', true);
			$(selectors.addToCartText, this.$container).html(translations.unavailable);
			$(selectors.quantityElements, this.$container).addClass(this.classes.hide);
			$(selectors.shopifyPaymentButton, this.$container).addClass(this.classes.hide);
			$(selectors.priceContainer, this.$container).addClass(this.classes.hide);
			$(selectors.productAvailable, this.$container).addClass(this.classes.hide);
			$(selectors.productPrice, this.$container).attr('aria-hidden', 'true');
			$(selectors.priceA11y, this.$container).attr('aria-hidden', 'true');
			$(selectors.comparePriceWrapper, this.$container).attr('aria-hidden', 'true');
			$(selectors.comparePriceA11y, this.$container).attr('aria-hidden', 'true');
		}
    },

    onUnload: function() {
		this.$container.off(this.settings.namespace);
		wpbingo.ProductModel.removeSectionModels(this.settings.sectionId);
		wpbingo.ProductVideo.removeSectionVideos(this.settings.sectionId);
		if (this.isStackedLayout) {
			if ($(window).width() > 991) {
				this.destroyMediaCarousel();
			}
		}
    },
	count_view_product: function() {
		if( $(".product-count-view").length > 0 ){
			var id_product = $(".product-count-view").data("id_product");
			var min = $(".product-count-view").data("min") ? $(".product-count-view").data("min") : 30;
			var max = $(".product-count-view").data("max") ? $(".product-count-view").data("max") : 40;
			var timeout = $(".product-count-view").data("timeout") ? $(".product-count-view").data("timeout") : 10000;
			var auto = Math.round(Math.random() * (max - min)) + min;
			$("span",".product-count-view").html(auto);
			setTimeout(function random() {
				var auto = Math.round(Math.random() * (max - min)) + min;
				$("span",".product-count-view").html(auto);
				setTimeout(random, timeout);
			}, timeout);
		}
	},
	count_sale_product: function() {
		if( $(".product-count-sale").length > 0 ){
			var id_product = $(".product-count-sale").data("id_product");
			var min = $(".product-count-sale").data("min") ? $(".product-count-sale").data("min") : 30;
			var max = $(".product-count-sale").data("max") ? $(".product-count-sale").data("max") : 40;
			var time_min = $(".product-count-sale").data("time_min") ? $(".product-count-sale").data("time_min") : 30;
			var time_max = $(".product-count-sale").data("time_max") ? $(".product-count-sale").data("time_max") : 40;
			var cookieValue = wpbingo.getCookie("product_"+id_product);
			var cookieTime = wpbingo.getCookie("time_"+id_product);
			if( cookieValue && cookieTime) {
				$("span.count",".product-count-sale").html(cookieValue);
				$("span.time",".product-count-sale").html(cookieTime);
			}else{
				var rand = Math.round(Math.random() * (max - min)) + min;
				var time = Math.round(Math.random() * (time_max - time_min)) + time_min;
				wpbingo.setCookie("product_"+id_product, rand, { expires : 24 * 60 * 60 * 1000 });
				wpbingo.setCookie("time_"+id_product, time, { expires : 24 * 60 * 60 * 1000 });
				$("span.count",".product-count-sale").html(rand);	
				$("span.time",".product-count-sale").html(time);
			}
		}
	},
	percent_sale_product: function() {
		setTimeout(function(){
			var percent = $( ".js-product-avaiable #variant-inventory_percent.show" ).data('percent');
			$(".js-product-avaiable #variant-inventory_percent .percent").css("--progress-bar-width", percent); 
		}, 500);
	},
	delivery_return: function() {
		if( $(".product-single .delivery_return").length > 0 ){
			var $element = $( ".product-single .delivery_return" );
			$(".delivery_return-title",$element).on( "click", function() {
				if(!$(".delivery_return-content",$element).hasClass('active')){
					$(".delivery_return-content",$element).addClass('active');
					setTimeout(function(){
						$(".content-shipping",$element).addClass('active');
					}, 300);
				}
			});
			$(".delivery_return-close",$element).on( "click", function() {
				if($(".delivery_return-content",$element).hasClass('active')){
					$(".content-shipping",$element).removeClass('active');
					setTimeout(function(){
						$(".delivery_return-content",$element).removeClass('active');
					}, 300);
				}
			});
		}
	},
	ask_a_question: function() {
		if( $(".product-single .product-ask_a_question").length > 0 ){
			$(".product-ask_a_question .open-ask_a_question").on( "click", function() {
				if($('.product-ask_a_question .ask_a_question-form').hasClass('active')){
					$('.product-ask_a_question .ask_a_question-form').removeClass('active');	
					$(".product-ask_a_question .ask_a_question-form .content-form").removeClass('active');
				}else{
					$('.product-ask_a_question .ask_a_question-form').addClass('active');
					setTimeout(function(){
						$(".product-ask_a_question .ask_a_question-form .content-form").addClass('active');
					}, 300);
				}
			});
			$(".product-ask_a_question .close-ask_a_question-form").on( "click", function() {
				if($('.product-ask_a_question .ask_a_question-form').hasClass('active')){
					$(".product-ask_a_question .ask_a_question-form .content-form").removeClass('active');
					setTimeout(function(){
						$('.product-ask_a_question .ask_a_question-form').removeClass('active');
					}, 300);
				}
			});
			setTimeout(function() { 
				$('.product-ask_a_question .alert').remove();
			}, 2000);
		}
	},
	back_in_stock: function() {
		if( $(".product-single .product-back_in_stock").length > 0 ){
			$(".product-back_in_stock .open-back_in_stock").on( "click", function() {
				if($('.product-back_in_stock .back_in_stock-form').hasClass('active')){
					$('.product-back_in_stock .back_in_stock-form').removeClass('active');	
					$(".product-back_in_stock .back_in_stock-form .content-form").removeClass('active');
				}else{
					$('.product-back_in_stock .back_in_stock-form').addClass('active');
					setTimeout(function(){
						$(".product-back_in_stock .back_in_stock-form .content-form").addClass('active');
					}, 300);
				}
			});
			$(".product-back_in_stock .close-back_in_stock-form").on( "click", function() {
				if($('.product-back_in_stock .back_in_stock-form').hasClass('active')){
					$(".product-back_in_stock .back_in_stock-form .content-form").removeClass('active');
					setTimeout(function(){
						$('.product-back_in_stock .back_in_stock-form').removeClass('active');
					}, 300);
				}
			});
			setTimeout(function() { 
				$('.product-back_in_stock .alert').remove();
			}, 2000);
		}
	},
	single_product_share: function() {
		if( $(".product-single .product_share").length > 0 ){
			var $element = $( ".product-single .product_share" );
			$(".product_share_label",$element).on( "click", function() {
				if(!$(".product_share-content",$element).hasClass('active')){
					$(".product_share-content",$element).addClass('active');
					setTimeout(function(){
						$(".content-product_share",$element).addClass('active');
					}, 300);
				}
			});
			$(".product_share-close",$element).on( "click", function() {
				if($(".product_share-content",$element).hasClass('active')){
					$(".content-product_share",$element).removeClass('active');
					setTimeout(function(){
						$(".product_share-content",$element).removeClass('active');
					}, 300);
				}
			});
			 $(".product_share-copy button", $element).click(function () {
				var copyText =  $(".product_share-copy .url_share", $element).attr('value');
				var $text =  $(".product_share-copy", $element).data('text');
				var $temp = $("<input>");
				$("body").append($temp);
				$temp.val(copyText).select();
				document.execCommand("copy");
				$temp.remove();
				var notificationTag = $("div.copy-notification");
				if ( notificationTag.length == 0) {
					notificationTag = $("<div/>", { "class": "copy-notification", text: $text });
					$("body").append(notificationTag);
					notificationTag.fadeIn("slow", function () {
						setTimeout(function () {
							notificationTag.fadeOut("slow", function () {
								notificationTag.remove();
							});
						}, 1000);
					});
				}
			});
		}
	},
	gallery_cursor:	function() {
		$(".bwp-single-image .product-media__wrapper.product-media__wrapper--image").mouseenter(function(){
			$(".gallery-cursor",$(this)).addClass('show');
		});
		$(".bwp-single-image .product-media__wrapper.product-media__wrapper--image").mousemove(function(event){
			 var offset = $(this).offset();
			var relX = (event.pageX - offset.left) - 25;
			var relY =(event.pageY - offset.top) - 25;
			$(".gallery-cursor",$(this)).css({"top": relY + "px", "left": relX + "px"});
		});
		$(".bwp-single-image .product-media__wrapper.product-media__wrapper--image").mouseleave(function(event){
			$(".gallery-cursor",$(this)).removeClass('show');
		});
	},
	discount_single: function() {
		if( $(".product-single #buy_more_form").length > 0 ){
			$('#buy_more_form .buy-more-cart').on('click',function(e){
				e.preventDefault();
				$(this).addClass('active');
				let addToCartForm = document.querySelector('#buy_more_form');
				let formData = new FormData(addToCartForm);
				var params = {
					type: 'POST',
					url: '/cart/add.js',
					data: formData,
					processData: false,
					contentType: false,
					dataType: 'json',
					success: function(line_item) {
						$('.buy-more-cart').removeClass('active');
						$('.buy-more-cart').addClass('added');
						if($('.js-drawer').length){
							$('body').addClass('drawer--open');
						}
						$('.js-drawer-close').on('click', function() {
							$('body').removeClass('drawer--open');
						});
						ajaxCart.load();
						wpbingo.discount_single();
					},
					error: function(XMLHttpRequest, textStatus) {
						if (typeof errorCallback === 'function') {
							errorCallback(XMLHttpRequest, textStatus);
						} else {
							ShopifyAPI.onError(XMLHttpRequest, textStatus);
						}
					}
				};
				jQuery.ajax(params);
			});
		}
	},
	sticky_gird: function() {
		if ($(window).width() > 992 && $('.product-single.gird-sticky').length > 0) {
			var $element = $('.product-single.gird-sticky');
			var eventElemArray = [];
			var _count = 0;
			var _countFix = 0;
			var $image_array = $('.js-product-media-group .js-product-media-item',$element);
			$('.js-product-thumbnails a',$element).on( "click", function() {
				var $thumb = $(this).data('media-id'),
					$image = $('.js-product-media-group .js-product-media[data-media-id='+ $thumb +']',$element);
				$( 'html, body' ).animate({ scrollTop: $image.offset().top }, '300' );
				$image.css({ 'padding-top': '15px' });
				$(this).addClass('slick-current');
			});
			$(window).on('load scroll resize',function(){
				eventElemArray = [];
				_count = 0;
				$image_array.each(function(i,pager){
					eventElemArray.push( $(pager).offset().top );
				});
				for(var _i = 0;_i < eventElemArray.length; _i++){
					if( $(window).scrollTop() + ($(window).height() * 0.5) > eventElemArray[_i] ){
						_count++;
					}
				}
				if(_count !== _countFix){
					_countFix = _count;
					$('.js-product-thumbnails .product-single__thumbnail-wrapper',$element).removeClass('slick-current');
					$('.js-product-thumbnails .product-single__thumbnail-wrapper',$element).eq(_count-1).addClass('slick-current');
				}
			});
			// sticky thumb
			var $content = $('.js-product-single-media',$element);
			var thumb_left = $('.js-product-thumbnails',$element).offset.left;
			var thumb_width = $('.js-product-thumbnails',$element).width() + 'px';
			var thumb_ToTop = $('.js-product-thumbnails',$element).offset().top;
			if( $content.height() > $('.js-product-thumbnails',$element).height() ){
				$(window).scroll(function() {
					var windowToTop = $(window).scrollTop();
					var thumb_height = $('.js-product-thumbnails',$element).height() + 'px';
					var stopsticky = ( $content.height() + $content.offset().top ) - windowToTop;
					if (windowToTop + 10 > thumb_ToTop) {
						$('.js-product-thumbnails',$element).css({
							'position': 'fixed',
							'top': '15px',
							'left': thumb_left,
							'width': thumb_width,
							'height': thumb_height
						});
					} else {
						$('.js-product-thumbnails',$element).removeAttr('style');
						$('.js-product-media-group .js-product-media',$element).removeAttr('style');
					}
					if(stopsticky < $('.js-product-thumbnails',$element).height()) {
						$('.js-product-thumbnails',$element).css({
							'position': 'absolute',
							'top': ($content.height() - $('.js-product-thumbnails',$element).height()) + 'px',
							'left': thumb_left,
							'width': thumb_width,
							'height': thumb_height
						});
					}
				});
			}
			// sticky info
			var info_image = $('.js-product-media-item',$content).height() * 2;
			var info_left = $('.product-single__metas',$element).offset.left;
			var info_width = $('.product-single__metas',$element).width() + 'px';
			var info_ToTop = $('.product-single__metas',$element).offset().top;
			if( $content.height() > ( $('.product-single__metas',$element).height() + info_image )){
				$(window).scroll(function() {
					var windowToTop = $(window).scrollTop();
					var info_height = $('.product-single__metas',$element).height() + 'px';
					var stopsticky = ( $content.height() + $content.offset().top ) - windowToTop;
					if (windowToTop + 10 > info_ToTop) {
						$('.product-single__metas',$element).css({
							'position': 'fixed',
							'top': '15px',
							'left': info_left,
							'width': info_width,
							'height': info_height
						});
					} else {
						$('.product-single__metas',$element).removeAttr('style');
					}
					if(stopsticky < ( $('.product-single__metas',$element).height() + info_image )) {
						$('.product-single__metas',$element).css({
							'position': 'absolute',
							'top': ($content.height() - $('.product-single__metas',$element).height() - info_image ) + 'px',
							'left': info_left,
							'width': info_width,
							'height': info_height
						});
					}
				});
			}
		}
	},
	sticky_sidebar: function() {
		if ($(window).width() < 1199 && $('.product-single .bwp-single-sidebar').length > 0) {
			var $element = $('.product-single .bwp-single-sidebar');
			$('.product-single .toggle-sidebar').on('click', function() {
				if ( $element.hasClass('show') ) {
					$element.removeClass('show');
				}else{
					$element.addClass('show');
				}
			});
		}
	},
	image_360: function() {
		if ($('.product-single .bwp-image-360').length > 0) {
			$('.product-single .bwp-image-360').TreeSixtyImageRotate({
				totalFrames: $('.product-single .bwp-image-360').data("count"),
				endFrame: $('.product-single .bwp-image-360').data("count")
			}).initTreeSixty();
		}
	},
	tab_information: function() {
		if ($('.template-product .product-more-info').length > 0) {
			var $parent = $('.template-product .product-more-info');
			if ($(window).width() > 991) {
				$('.more-info-tabs__nav-link',$parent).on('click', function() {
					var id = $(this).data('id');
					$('.more-info-tabs__nav-link',$parent).removeClass('active');
					$('.more-info-tabs__content .tab-pane',$parent).removeClass('show');
					$(this).addClass('active');
					$('#'+id+'',$parent).addClass('show');
				});
			}else{
				$('.more-info-tabs__content .tab-pane',$parent).removeClass('show');
				$('.more-info-tabs__nav-link',$parent).on('click', function() {
					var id = $(this).data('id');
					$('.more-info-tabs__content .tab-pane',$parent).slideUp();
					$('body,html').animate({
						scrollTop: $(".more-info-tabs__content").offset().top - 50
					}, 600);
					if($(this).hasClass('active')){
						$('#'+id+'',$parent).slideUp();
						$('.more-info-tabs__nav-link',$parent).removeClass('active');
					}else{
						$('#'+id+'',$parent).slideDown();
						$('.more-info-tabs__nav-link',$parent).removeClass('active');
						$(this).addClass('active');
					}
				});
			}
		}
	}
  });
  return Product;
})();
wpbingo.ProductRecommendations = (function() {
  function ProductRecommendations(container) {
    this.$container = $(container);
    var self = this;
    var baseUrl = this.$container.data('baseUrl');
    var productId = this.$container.data('productId');
    var recommendationsSectionUrl =
      baseUrl +
      '?section_id=product-recommendations&product_id=' +
      productId +
      '&limit=6';
    $.get(recommendationsSectionUrl).then(function(section) {
      var recommendationsMarkup = $(section).html();
      if (recommendationsMarkup.trim() !== '') {
		self.$container.html(recommendationsMarkup);
		var $config = $('[data-section-type="product-recommendations"]');
		var $title = $('[data-section-type="product-recommendations"]').data('title');
		var $element = $('.js-product-recommendations',self.$container);
		$('.wpbingo-title__heading',$config).html($title);
		$element.slick({
			slidesToShow: $config.data('columns'),
			autoplay : $config.data('autoplay'),
			autoplaySpeed: $config.data('autoplayspeed'),
			arrows : $config.data('nav'),
			infinite : $config.data('infinite'),
			slidesToScroll : $config.data("slidestoscroll") ? $config.data("columns") : 1,
			rtl : wpbingo.rtl_slick() ,
			responsive: [
				{
				  breakpoint: 1441,
				  settings: {
					slidesToShow: $config.data("column1440") ? $config.data("column1440") : $config.data("column"),
					slidesToScroll: $config.data("column1440") ? $config.data("column1440") : $config.data("column"),
				  }
				},
				{
				  breakpoint: 1200,
				  settings: {
					slidesToShow: $config.data("column1"),
					slidesToScroll: $config.data("column1"),
				  }
				},				
				{
				  breakpoint: 1024,
				  settings: {
					slidesToShow: $config.data("column2"),
					slidesToScroll: $config.data("column2"),
				  }
				},
				{
				  breakpoint: 768,
				  settings: {
					slidesToShow: $config.data("column3"),
					slidesToScroll: $config.data("column3"),
				  }
				},
				{
				  breakpoint: 480,			  
				  settings: {
					slidesToShow: $config.data("column4"),
					slidesToScroll: $config.data("column4"),
				  }
				}
			]
			
		});
		initButtons(".js-product-recommendations");
		initButtonsCompare(".js-product-recommendations");
		wpbingo.countdown();
		wpbingo.click_atribute_image();
		wpbingo.zoom_thumb();
		wpbingo.popup_product_card();
		if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		$('.product-card__image-wrapper.slider .js-carousel').each(function() {
			wpbingo.elementslickCarousel( $(this) );
		});
      }
    });
  }
  return ProductRecommendations;
})();

// HEADER SECTION
wpbingo.HeaderSection = (function() {
  var selectors = {
    disclosureLocale: '[data-disclosure-locale]',
    disclosureCurrency: '[data-disclosure-currency]',
    searchOptions: '.js-header-search-options',
    searchMobileToggle: '.js-header-search-toggle',
    menuMobileToggle : '.js-menu-mobile',
    menuMobileChildToggle: '.js-mm-nav-item'
  };

  function Header(container) {
    this.$container = $(container);
    this.cache = {};
    this.cacheSelectors();
    var $body = $('body');
    if (this.cache.$localeDisclosure.length) {
		this.localeDisclosure = new wpbingo.Disclosure(
			this.cache.$localeDisclosure
		);
    }

    if (this.cache.$currencyDisclosure.length) {
      this.currencyDisclosure = new wpbingo.Disclosure(
        this.cache.$currencyDisclosure
      );
    }

    this.cache.$searchOptions.on('click', function(evt) {
      evt.preventDefault();
      var $this = $(this),
        $form = $this.closest('form');
      $form.find('.js-header-search-options').removeClass('active');
      $this.addClass('active');
      $form.find('.dropdown-toggle').text($this.text());
      $form.find('.js-search-type').val($this.data('type'));
    });

    this.cache.$searchMobileToggle.on('click', function(evt) {
      evt.preventDefault();
      $body.toggleClass('modal-search--open');
    });

    this.cache.$menuMobileToggle.on('click', function(evt) {
      evt.preventDefault();
      $body.toggleClass('menu-mobile--open');
    });
	$('.menu-mobile__overlay').on('click', function(evt) {
      evt.preventDefault();
      $body.removeClass('menu-mobile--open');
    });
    this.cache.$menuMobileChildToggle.on('click', function(evt) {
      evt.preventDefault();
      var $this = $(this);
      if ($this.hasClass('mm-nav__prev')) {
        $this.closest('.active--hidden').removeClass('active--hidden');
      } else {
        $this.parents('.mm-nav__links').addClass('active--hidden');
      }
      $this.closest('.menu-mobile__nav-item').toggleClass('active');
    });
  }

  Header.prototype = _.assignIn({}, Header.prototype, {
    cacheSelectors: function() {
      this.cache = {
        $localeDisclosure: this.$container.find(selectors.disclosureLocale),
        $currencyDisclosure: this.$container.find(selectors.disclosureCurrency),
        $searchOptions: this.$container.find(selectors.searchOptions),
        $searchMobileToggle: this.$container.find(selectors.searchMobileToggle),
        $menuMobileToggle: this.$container.find(selectors.menuMobileToggle),
        $menuMobileChildToggle: this.$container.find(selectors.menuMobileChildToggle)
      };
    },

    onUnload: function() {
      if (this.cache.$localeDisclosure.length) {
        this.localeDisclosure.unload();
      }

      if (this.cache.$currencyDisclosure.length) {
        this.currencyDisclosure.unload();
      }
    }
  });

  return Header;
})();

wpbingo.LoginRegister = (function() {
	var selectors = {
		loginForm: '.js-login-form',
		recoverPasswordForm: '.js-recover-password',
		recoverPasswordToggle: '.js-forget-password',
		recoverPasswordSuccess: '.js-recover-password-success'
	};
	function LoginRegister(container) {
		this.$container = $(container);
		this.cache = {};
		this.classes = {
			hidden: 'd-none'
		};
		this.cacheSelectors();
		this.initializeEvents();
		this.resetPasswordSuccess();
	}
	LoginRegister.prototype = _.assignIn({}, LoginRegister.prototype, {
		cacheSelectors: function() {
			this.cache = {
				$loginForm: this.$container.find(selectors.loginForm),
				$recoverPasswordForm: this.$container.find(selectors.recoverPasswordForm),
				$recoverPasswordToggle: this.$container.find(selectors.recoverPasswordToggle),
				$recoverPasswordSuccess: this.$container.find(selectors.recoverPasswordSuccess)
			};
		},
		initializeEvents: function() {
			if (this.cache.$recoverPasswordToggle.length) {
				this.cache.$recoverPasswordToggle.on('click', function(e) {
					e.preventDefault();
					var isShow = this.cache.$loginForm.hasClass(this.classes.hidden) ? false : true;
					this.displayRecoverPasswordForm(isShow);
				}.bind(this));
			}
			if (window.location.hash === '#recover') {
				this.displayRecoverPasswordForm(true);
			}
		},
		displayRecoverPasswordForm: function(isShow) {
			if (isShow) {
				this.cache.$loginForm.addClass(this.classes.hidden);
				this.cache.$recoverPasswordForm.removeClass(this.classes.hidden);
			} else {
				this.cache.$loginForm.removeClass(this.classes.hidden);
				this.cache.$recoverPasswordForm.addClass(this.classes.hidden);
			}
		},
		resetPasswordSuccess: function() {
			if (typeof(window.resetPassword) != 'undefined' && window.resetPassword) {
				this.cache.$recoverPasswordSuccess.removeClass(this.classes.hidden);
			}
		}
	});
	return LoginRegister;
})();

wpbingo.Search = (function() {
  var selectors = {
    search: '[data-search]',
    searchPagination: '.search-pagination a'
  };

  function Search(container) {
    var ajaxCartSearch = function() {
      if (typeof ajaxCart != 'undefined') {
        ajaxCart.init({
          formSelector: '.search-results [data-product-form]'
        });
      }
    };

    var searchResultData = function(container, url) {
      $.get(url, function(data) {
        container.html(data);
        ajaxCartSearch();
      });
    }

    var getSearchResult = function(searchs) {
      searchs.each(function() {
        var $this = $(this);
        $.get($this.data('url'), function(data) {
          $this.html(data);
          ajaxCartSearch();
        });
      });
    };

    this.$container = $(container);
    this.cache = {};
    this.cacheSelectors();

    if (this.cache.$search.length) {
      getSearchResult(this.cache.$search);
    }

    this.$container.on('click', selectors.searchPagination, function(e) {
      e.preventDefault();
      var $searchContainer = $(this).parents(selectors.search);
      var searchURL = $(this).attr('href');
      searchResultData($searchContainer, searchURL);
    });
  }

  Search.prototype = _.assignIn({}, Search.prototype, {
    cacheSelectors: function() {
      this.cache = {
        $search: this.$container.find(selectors.search)
      };
    }
  });

  return Search;
})();

wpbingo.QuickView = (function() {
	var selectors = {
		body: 'body',
		quickView: '[data-quickview]',
		quickViewTemplate: '#quickview-template',
		quickViewBtn: '.js-btn-quickview',
		quickViewContainer: '[data-quickview-container]',
		quickViewClose: '[data-quickview-close]',
		quickViewImages: '[data-quickview-images]',
		quickViewReview: '[data-quickview-review]',
		quickViewReview: '[data-quickview-review]',
		quickviewVariant: '.js-quickview-option-selector',
		originalSelectorId: '[data-quickview-variant]',
		quickViewProductPrice: '.js-qv-product-price',
		quickViewProductPriceCompare: '.js-qv-product-price-compare',
		quickViewQty: '[data-quickview-quantity]',
		quickViewSKU: '[data-quickview-sku]',
		quickViewAvaiable: '.product-avaiable',
		quickViewAvaiableInStock: '.product-avaiable--instock',
		quickViewAvaiableOutStock: '.product-avaiable--outstock',
		quickViewProductDetailsURL: '.js-qv-product-details'
	};
	function QuickView(container) {
		this.$container = $(container);
		this.cache = {};
		this.productVariants = [];
		this.currentVariant = {};
		this.cacheSelectors();
		this.initializeEvents();
	}
	QuickView.prototype = _.assignIn({}, QuickView.prototype, {
		cacheSelectors: function() {
			this.cache = {
				$body: $('body'),
				$quickViewContainer: this.$container.find(selectors.quickViewContainer)
			};
		},

		initializeEvents: function() {
			var $this = this;
			$(selectors.body).on('click', selectors.quickViewBtn, function(e) {
				e.preventDefault();
				var productHandle = $(this).data('handle');
				$(this).addClass('load-quickview');
				$.getJSON('/products/' + productHandle + '.js', function(product) {
					if (product.available) {
					$this.firstAvailableVariant(product.variants, $this);
					} else {
						$this.currentVariant = product.variants[0];
					}
					$(selectors.quickViewBtn).removeClass('load-quickview');
					$this.buildQuickView(product);
					$this.buildMetafields(product);
					$this.renderReview();
					$this.createImageCarousel();
					$('[data-quickview]').addClass('show');
					setTimeout(function(){
						$('[data-quickview]').addClass('show-content');
					}, 300);
					var $element = $('.quickview .product-quickview__variants .variants-wrapper')
					$($element).each(function() {
						var $this = $(this);
						if( $("select",$this).length > 0 ){
							var value = $( "select",$this).find(':selected').val();
						}else{
							var value = $('input:checked',$this).attr('value');
						}
						$('.variants__label span',$this).html(value);
					});
				});
			});
			$(selectors.body).on('click', selectors.quickViewClose, function(e) {
				e.preventDefault();
				$('[data-quickview]').removeClass('show-content');
				setTimeout(function(){
					$('[data-quickview]').removeClass('show');
				}, 300);
				setTimeout(function(){
					$('[data-quickview-container]').empty();
				}, 500);
			});
			$(selectors.quickViewContainer).on('change', selectors.quickviewVariant, function(e) {
				$this.onVariantChange();
			});
		},

		firstAvailableVariant: function(variants, global) {
			global.productVariants = variants;
			for (var i = 0; i < variants.length; i++) {
				var variant = variants[i];
				if (variant.available) {
					global.currentVariant = variant;
					break;
				}
			}
		},
		buildQuickView: function(product) {
			var moneyFormat = wpbingo.strings.moneyFormat;
			var currentVariant = this.currentVariant;
			var source = $(selectors.quickViewTemplate).html();
			var template = Handlebars.compile(source);
			var images = '';
			var price = '';
			var external='';
			var qvObject = {
				id: product.id
			};
			if (typeof product.media !== 'undefined') {
				images += '<div class="quickview-images__list slick-carousel" data-quickview-images>'
				for (var i = 0; i < product.media.length; i++) {
					var media = product.media[i];
					if (media.media_type !== 'video') {
						images += '<div class="slick-carousel__item"><div class="quickview-images__item" data-media-id=' + media.id + '><img class="img-fluid" alt="' + product.title + '" src="' + media.preview_image.src + '" /></div></div>';
					}else{
						var media_video;
						for (var j in media.sources) {
							if( media.sources[j].width == media.preview_image.width && media.sources[j].format == 'mp4' ){
								media_video = media.sources[j].url;
							}
						}
						images += '<div class="slick-carousel__item"><div class="quickview-images__item" data-media-id=' + media.id + '><video class="img-fluid" playsinline="" loop="loop" autoplay="autoplay" muted="muted" src="' + media_video + '" /></video></div></div>';
					}
				}
				images += '</div>'
			}
			qvObject.variantID = currentVariant.id;
			qvObject.sku = currentVariant.sku !== null && currentVariant.sku !== '' ? currentVariant.sku : 'N/A';
			qvObject.images = images;
			qvObject.title = product.title;
			qvObject.url = product.url;
			qvObject.vendor = product.vendor;
			price += '<div class="price-container">';
			var productCompareClass = currentVariant.compare_at_price !== null ? '' : 'd-none';
			price += '<div class="js-qv-product-price-compare product-single__price--compare-at ' + productCompareClass + '">' + wpbingo.Currency.formatMoney(currentVariant.compare_at_price, moneyFormat) + '</div>';
			price += '<div class="js-qv-product-price product-single__price">' + wpbingo.Currency.formatMoney(currentVariant.price, moneyFormat) + '</div>';
			price += '</div">';
			qvObject.price = price;
			qvObject.vendor = product.vendor;
			qvObject.type = product.type;
			qvObject.variants = this.buildVariant(product);
			$(selectors.quickViewContainer).html(template(qvObject));
			// AFTER BUILD HTML
			this.updateMedia(currentVariant);
			this.updateSKU(currentVariant);
			this.updateProductAvaiable(currentVariant);
			this.updateDetailsLink(currentVariant);
			$('#form-simple-addtocart .btn--add-to-cart').on('click',function(e){
				e.preventDefault();
				$(this).removeClass('added');
				$(this).addClass('active');
				let addToCartForm = document.querySelector('#form-simple-addtocart');
				let formData = new FormData(addToCartForm);
				var params = {
					type: 'POST',
					url: '/cart/add.js',
					data: formData,
					processData: false,
					contentType: false,
					dataType: 'json',
					success: function(line_item) {
						$('#form-simple-addtocart .btn--add-to-cart').removeClass('active');
						$('#form-simple-addtocart .btn--add-to-cart').addClass('added');
						setTimeout(function() {
							$('#form-simple-addtocart .btn--add-to-cart').removeClass('added');
						}, 2000);
						ajaxCart.load();
						if($('.js-drawer').length){
							$('body').addClass('drawer--open');
						}
						$('.js-drawer-close').on('click', function() {
							$('body').removeClass('drawer--open');
						});
					},
					error: function(XMLHttpRequest, textStatus) {
						if (typeof errorCallback === 'function') {
							errorCallback(XMLHttpRequest, textStatus);
						} else {
							ShopifyAPI.onError(XMLHttpRequest, textStatus);
						}
					}
				};
				jQuery.ajax(params);
			});
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		},
		convertToSlug: function(str) {
			return str.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
		},
		buildMetafields: function(product) {
			var this_button = $('.js-btn-quickview[data-handle='+product.handle+']');
			var parent_button = this_button.closest('.product-card');
			var html = '';
			if(parent_button.data('external')){
				var value = parent_button.data('external');
				$('.product-quickview__buttons').remove();
				html += '<a href="'+ value +'">'+ wpbingo.strings.external +'</a>';
				$(".product-quickview__buttons_external").html(html);
			}
			if(parent_button.data('short_description')){
				var value = parent_button.data('short_description');
				$(".product-quickview .product-quickview__description").html(value);
			}
			if(parent_button.data('countdowns')){
				var countdowns = parent_button.data('countdowns');
				$('.quickview .countdown-quickview').removeClass('hidden');
				html += '<div class="countdown" data-countdown="'+ countdowns +'"></div>';
				$(".countdown-quickview .content").html(html);
				var $this = $('.product-quickview .countdown-quickview .countdown'),
					finalDate = $this.data('countdown'),
					date_final = new Date(finalDate),
					seconds_final = date_final.getTime(),
					date = Date.now(),
					text_day = 'd',
					text_hour = 'h',
					time_min = 'm',
					text_sec = 's';
				if(seconds_final > date){
					$this.countdown(finalDate, function(event) {
					  var strTime = '<div class="countdown__item"><span>%D</span><span>' + text_day + '</span></div>' +
						'<div class="countdown__item"><span>%H</span><span>' + text_hour + '</span></div>' +
						'<div class="countdown__item"><span>%M</span><span>' + time_min + '</span></div>' +
						'<div class="countdown__item"><span>%S</span><span>' + text_sec + '</span></div>';
					  $this.html(event.strftime(strTime));
					})
					.on('finish.countdown', function() {
					  $this.html(wpbingo.strings.countdownFinish);
					});
				}else{
					$('.product-quickview .countdown-quickview').remove();
				}
			}
			if(parent_button.data('is_group_product')){
				if(parent_button.data('group_product')){
					var value = parent_button.data('group_product');
					const group_handle = value.split(',');
					$('.product-quickview .product-quickview__variants').remove();
					$('.product-quickview .price-container').remove();
					$('#form-simple-addtocart').remove();
					html += '<form method="post" id="group_table_product" action="/cart/add"  enctype="multipart/form-data" novalidate="novalidate"><input type="hidden" name="form_type" value="product"><div class="group_table"></div><div class="product-group__add-to-cart product-single__buttons"><button type="submit" class="add-group-to-cart"><span>'+ wpbingo.strings.add_to_cart +'</span></button></div></form>';
					$(".group-quickview").html(html);
					var group = '';
					for (const handle of group_handle) {
						$.getJSON('/products/' + handle + '.js', function(product) {
							group+= '<div data-product_id="'+ product.id +'" class="item-product-group">';
								group+= '<div class="product-content">';
									group+= '<div class="product-thumb">';
										group+= '<a href="/product/'+ product.handle +'"><img class="featured-banner__img" src="'+ product.featured_image +'" alt="'+ product.featured_image.alt +'" /></a>';
									group += '</div>';
									group += '<div class="product-info">';
										group += '<h3 class="product-title"><a href="/product/'+ product.handle +'">'+ product.title +'</a></h3>';
										if( product.variants.length > 1){
											group+= '<select name="items[][id]" class="js-product-btp--'+ product.id +' product-single__variants">'
											for (var i = 0; i < product.variants.length; i++) {
												group+= '<option data-price="'+ product.variants[i].price +'" value="'+ product.variants[i].id +'"> '+ product.variants[i].title +' - '+ wpbingo.Currency.formatMoney(product.variants[i].price) +' </option>';
											}
											group+= '</select>';
										}else{
											group += '<div class="product-price">'+ wpbingo.Currency.formatMoney(product.variants[0].price) +'</div><input name="items[][id]" type="hidden" value="'+ product.variants[0].id +'">';
										}
									group += '</div>';
								group += '</div>';
								group+= '<div class="quantity-content">';
									group += '<button type="button" class="js-qty-adjust wpbingo-qty__adjust wpbingo-qty__adjust--minus"><i class="feather-minus"></i></button>';
									group += '<input type="text" name="items[][quantity]" class="js-qty-number wpbingo-qty__number" value="1" min="0" aria-label="quantity" pattern="[0-9]*">';
									group += '<button type="button" class="js-qty-adjust wpbingo-qty__adjust wpbingo-qty__adjust--plus"><i class="feather-plus"></i></button>';
								group += '</div>';
							group += '</div>';
							$(".group-quickview .group_table").html(group);
						});
					}
					$('#group_table_product .add-group-to-cart').on('click',function(e){
						e.preventDefault();
						$(this).removeClass('added');
						$(this).addClass('active');
						let addToCartForm = document.querySelector('#group_table_product');
						let formData = new FormData(addToCartForm);
						var params = {
							type: 'POST',
							url: '/cart/add.js',
							data: formData,
							processData: false,
							contentType: false,
							dataType: 'json',
							success: function(line_item) {
								$('#group_table_product .add-group-to-cart').removeClass('active');
								$('#group_table_product .add-group-to-cart').addClass('added');
								setTimeout(function() {
									$('#group_table_product .add-group-to-cart').removeClass('added');
								}, 3000);
								ajaxCart.load();
							},
							error: function(XMLHttpRequest, textStatus) {
								if (typeof errorCallback === 'function') {
									errorCallback(XMLHttpRequest, textStatus);
								} else {
									ShopifyAPI.onError(XMLHttpRequest, textStatus);
								}
							}
						};
						jQuery.ajax(params);
					});
				}else{
					$('.product-quickview .product-quickview__variants').remove();
					$('.product-quickview .price-container').remove();
					$('#form-simple-addtocart').remove();
					html += '<div class="view-gruop-product"><a class="view-gruop-product-btn" href="'+product.url+'"><span>'+ wpbingo.strings.view_group +'</span></a></div>';
					$(".group-quickview").html(html);
				}
			}
		},		
		buildVariant: function(product) {
			var result = '';
			var currentVariant = this.currentVariant;
			if (product.options[0].name !== 'Title') {
				var options = product.options;
				for (var i = 0; i < options.length; i ++) {
					var option = options[i];
					var optionIndex = i + 1;
					var type = 'label';
					var size = wpbingo.settings.size_option;
					if (wpbingo.settings.filter_name_1 === option.name) {
						type = wpbingo.settings.select_filter_1;
					}else if (wpbingo.settings.filter_name_2 === option.name) {
						type = wpbingo.settings.select_filter_2;
					}else if (wpbingo.settings.filter_name_3 === option.name) {
						type = wpbingo.settings.select_filter_3;
					}
					result += '<div class="variants-wrapper product-form__item '+ type +'" data-quickview-variant-option="' + optionIndex + '">';
					result += '<label class="variants__label">' + option.name + ': <span></span></label>';
					result += '<div class="variants__options">';
					if (wpbingo.settings.quickViewVariantType === 'select') {
						result += '<select class="js-quickview-option-selector product-form__input" data-id="quickViewOptionSelector-' + optionIndex + '" data-index="option' + optionIndex + '">';
						for (var j = 0; j < option.values.length; j ++) {
							var value = option.values[j];
							result += '<option value="' + _.escape(value) + '" ';
							result += currentVariant.options[i] === value ? 'selected="selected"' : '';
							result += '>' + value + '</option>';
						}
						result += '</select>';
					} else if (wpbingo.settings.quickViewVariantType === 'radio') {
						for (var j = 0; j < option.values.length; j ++) {
							var value = option.values[j];
							var isDisable = true;
							var isVariantsImage = false;
							var colorAttribute = '';
							// CHECK Product option is available or disabled
							for (var k = 0; k < this.productVariants.length; k ++) {
								var variantCondition = this.productVariants[k];
								if (variantCondition.available) {
									if (i == 0 && variantCondition.option1 === value) {
										isDisable = false;
										break;
									} else if (i == 1 && variantCondition.option2 === value && variantCondition.option1 == currentVariant.option1) {
										isDisable = false;
										break;
									} else if (i == 2 && variantCondition.option3 === value && variantCondition.option2 == currentVariant.option2 && variantCondition.option1 == currentVariant.option1) {
										isDisable = false;
										break;
									}
								}
							}
							for (var e = 0; e < product.media.length; e ++) {
								var media_arr = product.media[e] ;
								var media_alt = media_arr.alt;
								if( media_alt ){
									var alt = media_alt.split('-');
								}
								if( alt && alt[1] == value ){
									isVariantsImage = true;
									break;
								}
							}
							// RENDER Product option button
							if( isVariantsImage ){
								for (var e = 0; e < product.media.length; e ++) {
									var media_arr = product.media[e] ;
									var media_alt = media_arr.alt;
									if( media_alt ){
										var alt = media_alt.split('-');
									}
									if( alt[1] == value ){
										var background = media_arr.src;
										result += '<div class="single-option-selector">';
										result += '<input type="radio" data-single-option-button';
										result += currentVariant.options[i] === value ? ' checked ' : ' ';
										if (isDisable) {
											result += 'disabled="disabled"';
										}
										result += 'value="' + _.escape(value) + '" data-index="option' + optionIndex + '" name="option' + option.position + '" ';
										result += 'class="js-quickview-option-selector';
										if (isDisable) {
											result += ' disabled';
										}
										result += '" id="quickview-product-option-' + i + '-' + value.toLowerCase() + '">';
										result += '<label class="' + value + '" data-toggle="tooltip" title="' + value + '" for="quickview-product-option-' + i + '-' + value.toLowerCase() + '" ' + colorAttribute;
										if (isDisable) {
											result += ' class="disabled"';
										}
										result += 'style="background:url('+ background +');background-size: cover;background-position: center;">' + value + '<span class="d-none"></span></label>';
										result += '</div>';
										break;
									}
								}
							}else{
								result += '<div class="single-option-selector">';
								result += '<input type="radio" data-single-option-button';
								result += currentVariant.options[i] === value ? ' checked ' : ' ';
								if (isDisable) {
									result += 'disabled="disabled"';
								}
								result += 'value="' + _.escape(value) + '" data-index="option' + optionIndex + '" name="option' + option.position + '" ';
								result += 'class="js-quickview-option-selector';
								if (isDisable) {
									result += ' disabled';
								}
								result += '" id="quickview-product-option-' + i + '-' + value.toLowerCase() + '">';
								result += '<label class="' + value + '" data-toggle="tooltip" title="' + value + '" for="quickview-product-option-' + i + '-' + value.toLowerCase() + '" ' + colorAttribute;
								if (isDisable) {
									result += ' class="disabled"';
								}
								result += '>' + value + '<span class="d-none"></span></label>';
								result += '</div>';
							}
						}
					}
					result += '</div>';
					result += '</div>';
				}
			}
			return result;
		},
		createImageCarousel: function() {
			$(selectors.quickView).find(selectors.quickViewImages).slick({
				infinite: false,
				rows: 0,
				fade:true,
				rtl : wpbingo.rtl_slick()
			});
		},
		renderReview: function() {
			if (window.SPR && wpbingo.settings.enableReview) {
				if ($(selectors.quickView).find(selectors.quickViewReview).length) {
					return window.SPR.registerCallbacks(), window.SPR.initRatingHandler(), window.SPR.initDomEls(), window.SPR.loadProducts(), window.SPR.loadBadges();
				};
			}
		},
		getCurrentOptions: function() {
			var currentOptions = _.map(
				$(selectors.quickviewVariant, selectors.quickViewContainer), function(element) {
					var $element = $(element);
					var type = $element.attr('type');
					var currentOption = {};
					if (type === 'radio' || type === 'checkbox') {
						if ($element[0].checked) {
							currentOption.value = $element.val();
							currentOption.index = $element.data('index');
							return currentOption;
						} else {
							return false;
						}
					} else {
						currentOption.value = $element.val();
						currentOption.index = $element.data('index');
						return currentOption;
					}
				}
			);
			currentOptions = _.compact(currentOptions);
			return currentOptions;
		},
		getVariantFromOptions: function() {
			var selectedValues = this.getCurrentOptions();
			var variants = this.productVariants;
			var found = _.find(variants, function(variant) {
				return selectedValues.every(function(values) {
					return _.isEqual(variant[values.index], values.value);
				});
			});
			return found;
		},
		updateVariantsButton: function () {
			var selectedValues = this.getCurrentOptions();
			var variants = this.productVariants;
			for (var i = 2; i <= 3; i++) {
				if ($('[data-quickview-variant-option="' + i + '"]', selectors.quickViewContainer).length) {
					$('[data-quickview-variant-option="' + i + '"] ' + selectors.quickviewVariant, selectors.quickViewContainer).each(function() {
						var $self = $(this);
						var optionValue = $self.val();
						var foundIndex;
						if (i === 2) {
							foundIndex = _.findIndex(variants, function(variant) {
								variant.option1 = variant.option1.toString();
								selectedValues[0].value = selectedValues[0].value.toString();
								variant.option2 = variant.option2.toString();
								optionValue = optionValue.toString();
								return variant.option1 === selectedValues[0].value &&
								variant.option2 === optionValue &&
								variant.available === true;
							});
							
						} else if (i === 3) {
							foundIndex = _.findIndex(variants, function(variant) {
								variant.option1 = variant.option1.toString();
								variant.option2 = variant.option2.toString();
								variant.option3 = variant.option3.toString();
								selectedValues[0].value = selectedValues[0].value.toString();
								selectedValues[1].value = selectedValues[1].value.toString();
								optionValue = optionValue.toString();
								return variant.option1 === selectedValues[0].value && variant.option2 === selectedValues[1].value &&
								variant.option3 === optionValue &&
								variant.available === true;
							});
						}
						if (foundIndex !== -1) {
							$self.removeAttr('disabled', 'disabled').removeClass('disabled');
							$self.next('label').removeClass('disabled');
						} else {
							$self.attr('disabled', 'disabled').addClass('disabled');
							$self.next('label').addClass('disabled');
						}
					});
				}
			}
		},
		updateVariantsButtonDisabed: function() {
			for (var i = 2; i <= 3; i++) {
				if ($('[data-quickview-variant-option="' + i + '"]', selectors.quickViewContainer).length) {
					var isUpdate = false;
					$('[data-quickview-variant-option="' + i + '"] ' + selectors.quickviewVariant, selectors.quickViewContainer).each(function() {
						var $element = $(this);
						var type = $element.attr('type');
						if (type === 'radio' || type === 'checkbox') {
							if (this.checked && $element.hasClass('disabled')) {
								$element.prop('checked', false);
								isUpdate = true;
								return false;
							}
						}
					});
					$('[data-quickview-variant-option="' + i + '"] ' + selectors.quickviewVariant, selectors.quickViewContainer).each(function() {
						var $element = $(this);
						var type = $element.attr('type');
						if (isUpdate && (type === 'radio' || type === 'checkbox') && !$element.hasClass('disabled')) {
							$element.prop('checked', true);
							isUpdate = false;
							$element.trigger('change');
							return false;
						}
					});
				}
			}
		},
		updateMasterSelect: function(variant) {
			if (variant) {
				$(selectors.originalSelectorId, selectors.quickViewContainer).val(variant.id);
			}
		},
		updateMedia: function(variant) {
			$(selectors.quickViewImages,selectors.quickView).on('init', function(event, slick){
				if (variant && variant.featured_media && variant.featured_media.id) {
					$(selectors.quickViewImages, selectors.quickViewContainer).find('.quickview-images__item').each(function() {
						var imageID = $(this).data('media-id');
						if (variant.featured_media.id == imageID) {
							var slickIndex = $(this).closest('.slick-carousel__item').data('slick-index');
							setTimeout(function(){
								if (slickIndex !== undefined && slickIndex !== null) {
									$(selectors.quickViewImages, selectors.quickViewContainer).slick('slickGoTo', slickIndex);
								}
							}, 100);
						}
					});
				}
			});
			if (variant && variant.featured_media && variant.featured_media.id) {
				$(selectors.quickViewImages, selectors.quickViewContainer).find('.quickview-images__item').each(function() {
					var imageID = $(this).data('media-id');
					if (variant.featured_media.id == imageID) {
						var slickIndex = $(this).closest('.slick-carousel__item').data('slick-index');
						if (slickIndex !== undefined && slickIndex !== null) {
							$(selectors.quickViewImages, selectors.quickViewContainer).slick('slickGoTo', slickIndex);
						}
					}
				});
			}
		},

		updatePrice: function(variant) {
			var moneyFormat = wpbingo.strings.moneyFormat;
			if (!variant) {
				$(selectors.quickViewProductPrice, selectors.quickViewContainer).addClass('d-none');
				$(selectors.quickViewProductPriceCompare, selectors.quickViewContainer).addClass('d-none');
			} else {
				$(selectors.quickViewProductPrice, selectors.quickViewContainer).removeClass('d-none');
				$(selectors.quickViewProductPriceCompare, selectors.quickViewContainer).removeClass('d-none');
				$(selectors.quickViewProductPrice, selectors.quickViewContainer).html(
					wpbingo.Currency.formatMoney(variant.price, moneyFormat)
				);
				if (variant.compare_at_price > variant.price) {
					$(selectors.quickViewProductPriceCompare, selectors.quickViewContainer).html(
						wpbingo.Currency.formatMoney(variant.compare_at_price, moneyFormat)
					).removeClass('d-none');
					$(selectors.quickViewProductPrice, selectors.quickViewContainer).addClass('on-sale');
				} else {
					$(selectors.quickViewProductPriceCompare, selectors.quickViewContainer).addClass('d-none');
					$(selectors.quickViewProductPrice, selectors.quickViewContainer).removeClass('on-sale');
				}
			}
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		},

		updateSKU: function(variant) {
			var sku = variant && variant.sku !== null && variant.sku !== '' ? variant.sku : 'N/A';
			$(selectors.quickViewSKU, selectors.quickViewContainer).html(sku);
		},

		updateProductAvaiable: function(variant) {
			var classActive = 'product-avaiable--active';
			var translations = wpbingo.strings;
			$(selectors.quickViewAvaiable, selectors.quickViewContainer).removeClass(classActive);
			if (variant) {
				if (variant.available) {
					$(selectors.quickViewQty, selectors.quickViewContainer).removeClass('d-none');
					$(selectors.quickViewAvaiableInStock, selectors.quickViewContainer).addClass(classActive);
				} else {
					$(selectors.quickViewQty, selectors.quickViewContainer).addClass('d-none');
					$(selectors.quickViewAvaiableOutStock, selectors.quickViewContainer).addClass(classActive);
				}
				// Button add to cart
				if (variant.available) {
					$(selectors.quickViewContainer).find('.btn--add-to-cart')
						.removeClass('disabled')
						.prop('disabled', false);
					$(selectors.quickViewContainer).find('.btn--add-to-cart .btn__text').html(translations.addToCart);
				} else {
					$(selectors.quickViewContainer).find('.btn--add-to-cart')
						.addClass('disabled')
						.prop('disabled', true);
					$(selectors.quickViewContainer).find('.btn--add-to-cart .btn__text').html(translations.soldOut);
				}
			} else {
				$(selectors.quickViewQty, selectors.quickViewContainer).addClass('d-none');
				$(selectors.quickViewContainer).find('.btn--add-to-cart')
					.addClass('disabled')
					.prop('disabled', true);
				$(selectors.quickViewContainer).find('.btn--add-to-cart .btn__text').html(translations.unavailable);
			}
		},

		updateDetailsLink: function(variant) {
			if (variant) {
				var productURL = $(selectors.quickViewProductDetailsURL, selectors.quickViewContainer).data('url') + '?variant=' + variant.id;
				$(selectors.quickViewProductDetailsURL, selectors.quickViewContainer).removeClass('d-none').attr('href', productURL);
			} else {
				$(selectors.quickViewProductDetailsURL, selectors.quickViewContainer).addClass('d-none');
			}
		},

		onVariantChange: function() {
			var variant = this.getVariantFromOptions();
			if ($('[data-single-option-button]', selectors.quickViewContainer).length) {
				this.updateVariantsButton();
				if (!variant || !variant.available) {
					this.updateVariantsButtonDisabed();
					return;
				}
			}
			var $element = $('.quickview .product-quickview__variants .variants-wrapper')
			$($element).each(function() {
				var $this = $(this);
				if( $("select",$this).length > 0 ){
					var value = $( "select",$this).find(':selected').val();
				}else{
					var value = $('input:checked',$this).attr('value');
				}
				$('.variants__label span',$this).html(value);
			});
			this.updateMasterSelect(variant);
			this.updateMedia(variant);
			this.updatePrice(variant);
			this.updateSKU(variant);
			this.updateProductAvaiable(variant);
			this.updateDetailsLink(variant);
			this.currentVariant = variant;
		}
	});
	return QuickView;
})();

if (typeof ShopifyAPI === 'undefined') {
	ShopifyAPI = {};
}

ShopifyAPI.attributeToString = function(attribute) {
	if (typeof attribute !== 'string') {
		attribute += '';
		if (attribute === 'undefined') {
			attribute = '';
		}
	}
	return jQuery.trim(attribute);
}

ShopifyAPI.updateCartNote = function(note, callback) {
	var params = {
		type: 'POST',
		url: '/cart/update.js',
		data: 'note=' + ShopifyAPI.attributeToString(note),
		dataType: 'json',
		success: function(cart) {
			if (typeof callback === 'function') {
				callback(cart);
			}
		},
		error: function(XMLHttpRequest, textStatus) {
			ShopifyAPI.onError(XMLHttpRequest, textStatus);
		}
	};
	jQuery.ajax(params);
};

ShopifyAPI.onError = function(XMLHttpRequest) {
	var data = eval('(' + XMLHttpRequest.responseText + ')');
	if (data.message) {
		alert(data.message + '(' + data.status + '): ' + data.description);
	}
};

ShopifyAPI.addItemFromForm = function(form, callback, errorCallback) {
	var formData = new FormData(form);
	var params = {
		type: 'POST',
		url: '/cart/add.js',
		data: formData,
		processData: false,
		contentType: false,
		dataType: 'json',
		success: function(line_item) {
			if (typeof callback === 'function') {
				callback(line_item, form);
				if( $(".product-single .content-variant_inventory").length > 0 ){
					setTimeout(function(){ $( ".product-single .content-variant_inventory" ).load(window.location.href + ".content-variant_inventory .js-product-avaiable" ); }, 100);
				}
			} else {
				ShopifyAPI.onItemAdded(line_item, form);
				if( $(".product-single .content-variant_inventory").length > 0 ){
					setTimeout(function(){ $( ".product-single .content-variant_inventory" ).load(window.location.href + ".content-variant_inventory .js-product-avaiable" ); }, 100);
				}
			}
			// // ✅ Trigger OptiMonk custom event here (after successful add-to-cart)
			// if (window.OptiMonk && typeof window.OptiMonk.triggerEvent === 'function') {
			// 	document.dispatchEvent(new Event('optimonk_add_to_cart'));
			// 	console.log('OptiMonk event triggered inside wpbingo.js');
			// } else {
			// 	// Fallback if OptiMonk is not yet loaded
			// 	document.dispatchEvent(new Event('optimonk_add_to_cart'));
			// 	console.log('OptiMonk event dispatched manually');
			// }
		},
		error: function(XMLHttpRequest, textStatus) {
			if (typeof errorCallback === 'function') {
				errorCallback(XMLHttpRequest, textStatus);
			} else {
				ShopifyAPI.onError(XMLHttpRequest, textStatus);
			}
		}
	};
	jQuery.ajax(params);
};

ShopifyAPI.getCart = function(callback, added) {
  jQuery.getJSON('/cart.js', function(cart) {
    if (typeof callback === 'function') {
      callback(cart, added);
    }
  });
};

ShopifyAPI.changeItem = function(line, quantity, callback,modal) {
	var params = {
		type: 'POST',
		url: '/cart/change.js',
		data: 'quantity=' + quantity + '&line=' + line,
		dataType: 'json',
		success: function(cart) {
			if (typeof callback === 'function') {
				callback(cart);
			}
			if(modal){
				var moneyFormat = '${{amount}}';
				if (wpbingo.strings.moneyFormat !== undefined) {
					moneyFormat = wpbingo.strings.moneyFormat;
				}
				var id = $('#form-modal-addtocart input[data-modal-variant]').val();
				for (var j in cart.items) {
					if( id == cart.items[j].variant_id ){
						var price = cart.items[j].final_line_price;
						var price_discount = cart.items[j].original_line_price;
					}
				}
				$("#form-modal-addtocart .modalcart__line_price .price").html(
					wpbingo.Currency.formatMoney(price,moneyFormat)
				);
				if(cart.items[j].discounts.length > 0){
					$('#form-modal-addtocart .modalcart__line_price .price_discount').html(
						wpbingo.Currency.formatMoney(price_discount,moneyFormat)
					);
					for (var i in cart.items[j].discounts) {
						$('.js-cart-modal .discount').text(cart.items[j].discounts[i].title);
					}
				}else{
					$('#form-modal-addtocart .modalcart__line_price .price_discount').empty();
					$('.js-cart-modal .discount').empty();
				}
				$('#form-modal-addtocart .cart-modal__middle').removeClass('load_modal');
			}
		},
		error: function(XMLHttpRequest, textStatus) {
			ShopifyAPI.onError(XMLHttpRequest, textStatus);
		}
	};
	jQuery.ajax(params);
};

var ajaxCart = (function(module, $) {
  'use strict';

  // Public functions
  var init, loadCart;

  // Private general variables
  var settings, isUpdating, $body;

  // Private plugin variables
  var $formContainer,
    $addToCart,
    $cartCountSelector,
    $cartCostSelector,
    $cartContainer;

  // Private functions
  var initializeEvents,
    updateCountPrice,
    formOverride,
    itemAddedCallback,
    itemErrorCallback,
    cartModalAdded,
	cartModalupdate,
	updateModalRecommendations,
    cartUpdateCallback,
    buildCart,
    cartCallback,
    adjustCart,
    adjustCartCallback,
    validateQty;

  /*============================================================================
    Initialise the plugin and define global options
  ==============================================================================*/
  init = function(options) {
    // Default settings
    settings = {
      formSelector: '[data-product-form]',
      cartContainer: '[data-cart-container]',
      addToCartSelector: 'button[type="submit"]',
      cartCountSelector: '[data-cart-count]',
      cartCostSelector: '[data-cart-cost]',
      cartRemoveSelector: '[data-cart-remove]',
      headerCartSelector: '.js-header-cart',
      cartModalSelector: '.js-cart-modal',
      cartModalCloseSelector: '.js-cart-modal-close',
      moneyFormat: '${{amount}}',
      disableAjaxCart: false,
      cartTemplate: '#ajaxcart-template',
      cartModalHeaderTemplate: '#ajaxcart-header-template'
    };

    if (wpbingo.strings.moneyFormat !== undefined) {
      settings.moneyFormat = wpbingo.strings.moneyFormat;
    }

    // Override defaults with arguments
    $.extend(settings, options);

    // Select DOM elements
    $formContainer = $(settings.formSelector);
    $cartContainer = $(settings.cartContainer);
    $addToCart = $formContainer.find(settings.addToCartSelector);
    $cartCountSelector = $(settings.cartCountSelector);
    $cartCostSelector = $(settings.cartCostSelector);

    $body = $('body');
    isUpdating = false;
    initializeEvents();
    if (!settings.disableAjaxCart && $addToCart.length) {
      formOverride();
    }
    adjustCart();
  };

	initializeEvents = function() {
		$body.on('click', settings.cartModalCloseSelector, function() {
			$('.js-cart-modal .cart-modal__inner').removeClass('show');
			setTimeout(function() {
				$(settings.cartModalSelector).fadeOut(400, function() {
					$(this).remove();
				});
			}, 400);
		});
		$body.on('click', settings.headerCartSelector, function(e) {
			if (wpbingo.settings.cartType == 'modal' && $(window).width() > 767 && !$('body').hasClass('template-cart')) {
				e.preventDefault();
				return;
			}
		});
		$body.on('click', settings.cartRemoveSelector, function(e) {
			if (isUpdating) {
				return;
			}
			var $el = $(this),
				line = $el.data('line');
			if (line) {
				$('.ajaxcart__product[data-line="' + line + '"]').addClass('is-loading');
				isUpdating = true;
				setTimeout(function() {
					ShopifyAPI.changeItem(line, 0, adjustCartCallback);
				}, 250);
			}
			wpbingo.discount_single();
		});
		$body.on('change', '.ajaxcart__note-input', function() {
			var newNote = $(this).val();
			$(".ajaxcart__info .save-ajaxcart__note").on( "click", function() {
				ShopifyAPI.updateCartNote(newNote, function() {});
			});
		});
		$body.on('change', '.discount_code_input', function() {
			var newDiscount = $(this).val();
			$(".ajaxcart__info .save-discount_code_input").on( "click", function() {
				wpbingo.setCookie('wpbingo_discount', newDiscount, 1);
			});
		});	
	};

	loadCart = function() {
		if($('.js-drawer').length > 0 || $('[data-cart-container]').length > 0 ) {
			$body.addClass('ajaxcart--is-loading');
		}
		ShopifyAPI.getCart(cartUpdateCallback);
	};

	updateCountPrice = function(cart) {
		if ($('[data-cart-count]')) {
			$('[data-cart-count]').html(cart.item_count);
		}
		if (cart.item_count === 0) {
			$('[data-cart-count]').hide();
		} else {
			$('[data-cart-count]').show();
		}

		if($('.js-drawer').length > 0 || $('[data-cart-container]').length > 0 ) {
			if ($cartCostSelector) {
				$cartCostSelector.html(
					wpbingo.Currency.formatMoney(cart.total_price, settings.moneyFormat)
				);
			}
			$(".cart-modal-totalprice span").html(
				wpbingo.Currency.formatMoney(cart.total_price, settings.moneyFormat)
			);
			$(".cart-modal-totalcount span.count").html(cart.item_count);
		}
	};

	formOverride = function() {
		$body.on('submit', settings.formSelector, function(evt) {
			evt.preventDefault();
			$('.btn--add-to-cart',$(this)).attr('disabled', 'disabled').prepend('<span class="spinner-border spinner-border-sm"></span>');
			$('.btn--add-to-cart',$(this)).removeClass('is-added').addClass('is-adding');
			$('.ajaxcart-toast').toast('hide');
			ShopifyAPI.addItemFromForm(evt.target,itemAddedCallback,itemErrorCallback);
		});
	};

	itemAddedCallback = function(lineItem) {
		$('form .btn--add-to-cart').removeAttr('disabled').find('.spinner-border').remove();
		$('form .btn--add-to-cart').removeClass('is-adding').addClass('is-added');
		if (wpbingo.settings.cartType == 'modal') {
			cartModalAdded(lineItem);
		}
		ShopifyAPI.getCart(cartUpdateCallback, true);
		wpbingo.discount_single();
	};

	itemErrorCallback = function(XMLHttpRequest) {
		var data = eval('(' + XMLHttpRequest.responseText + ')');
		$addToCart.removeAttr('disabled').find('.spinner-border').remove();
		$addToCart.removeClass('is-adding is-added');
		if (data.message) {
			if (data.status === 422) {
				var $toast = $('.ajaxcart-toast');
				$toast.find('.toast-body').html(data.description);
				$toast.toast('show');
			}
		}
	};

	cartModalAdded = function(lineItem) {
		var data = {},
			image = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif',
			source = $(settings.cartModalHeaderTemplate).html(),
			template = Handlebars.compile(source);
		if (lineItem.image != null) {
			image = lineItem.image;
		}
		updateModalRecommendations(lineItem);
		var count = $('#count_quantity [data-variant_id="'+lineItem.variant_id+'"]').data('count_quantity');
		var disabled='';
		if( lineItem.quantity == count ){
			disabled = 'disabled';
		}
		data = {
			name: lineItem.product_title,
			image: image,
			discount: lineItem.discounts,
			variant_id: lineItem.variant_id,
			variant:lineItem.variant_title,
			options: lineItem.options_with_values,
			price_discount:wpbingo.Currency.formatMoney(lineItem.original_line_price,settings.moneyFormat),
			final_line_price: wpbingo.Currency.formatMoney(lineItem.final_line_price,settings.moneyFormat),
			final_price: wpbingo.Currency.formatMoney(lineItem.final_price,settings.moneyFormat),
			quantity : lineItem.quantity,
			disabled:disabled
		}
		$body.append(template(data));
		if(data.variant != null) {
			for (var j in data.options) {
				$('.js-cart-modal .variant').append('<span>'+data.options[j].name+' : '+data.options[j].value+'</span>');
			}
		}
		if(data.discount.length > 0) {
			for (var j in data.discount) {
				$('.js-cart-modal .discount').text(data.discount[j].title);
			}
			$('#form-modal-addtocart .modalcart__line_price .price_discount').html(wpbingo.Currency.formatMoney(lineItem.original_line_price,settings.moneyFormat));
		}else{
			$('.js-cart-modal .discount').empty();
			$('#form-modal-addtocart .modalcart__line_price .price_discount').empty();
		}
		$('.js-cart-modal').fadeIn(400);
		setTimeout(function(){
			$('.js-cart-modal .cart-modal__inner').addClass('show');
		},400);
	};
	cartModalupdate = function(cart) {
		$('#form-modal-addtocart .modalcart__quantity input').change(function(){
			$('#form-modal-addtocart .cart-modal__middle').addClass('load_modal');
			var id = $('#form-modal-addtocart input[data-modal-variant]').val();
			var qty = $('#form-modal-addtocart .modalcart__quantity input').val();
			var modal = true;
			var count = $('#count_quantity [data-variant_id="'+id+'"]').data('count_quantity');
			if( qty >= count ){
				var qty = count;
				$('#form-modal-addtocart .modalcart__quantity .ajaxcart__qty-adjust.wpbingo-qty__adjust--plus').prop('disabled', true);
			}else{
				$('#form-modal-addtocart .modalcart__quantity .ajaxcart__qty-adjust.wpbingo-qty__adjust--plus').prop('disabled', false);
			}
			$('#form-modal-addtocart .modalcart__quantity input').val(qty);
			for (var j in cart.items) {
				if( id == cart.items[j].variant_id ){
					var line = parseInt(j) + 1;
				}
			}
			ShopifyAPI.changeItem(line, qty, adjustCartCallback,modal);
		});
		$('#form-modal-addtocart .modalcart__quantity .ajaxcart__qty-adjust').on('click',function(){
			$('#form-modal-addtocart .cart-modal__middle').addClass('load_modal');
			var id = $('#form-modal-addtocart input[data-modal-variant]').val();
			var modal = true;
			for (var j in cart.items) {
				if( id == cart.items[j].variant_id ){
					var line = parseInt(j) + 1;
					var lineItem = cart.items[j];
				}
			}
			setTimeout(function(){
				var qty = $('#form-modal-addtocart .modalcart__quantity input').val();
				var count = $('#count_quantity [data-variant_id="'+id+'"]').data('count_quantity');
				if( qty >= count ){
					var qty = count;
					$('#form-modal-addtocart .modalcart__quantity .ajaxcart__qty-adjust.wpbingo-qty__adjust--plus').prop('disabled', true);
				}else{
					$('#form-modal-addtocart .modalcart__quantity .ajaxcart__qty-adjust.wpbingo-qty__adjust--plus').prop('disabled', false);
				}
				$('#form-modal-addtocart .modalcart__quantity input').val(qty);
				if( qty == 1 ){
					$('#form-modal-addtocart .modalcart__quantity .ajaxcart__qty-adjust.wpbingo-qty__adjust--minus').prop('disabled', true);
				}else{
					$('#form-modal-addtocart .modalcart__quantity .ajaxcart__qty-adjust.wpbingo-qty__adjust--minus').prop('disabled', false);
				}
				ShopifyAPI.changeItem(line, qty, adjustCartCallback,modal);
			},500);
		});
	},
	updateModalRecommendations = function(lineItem) {
		var baseUrl = routes.product_recommendations_url;
		var productId = lineItem.product_id;
		var recommendationsSectionUrl = baseUrl + '?section_id=product-recommendations&product_id=' + productId +'&limit=6';
		$.get(recommendationsSectionUrl).then(function(section) {
			var recommendationsMarkup = $(section).html();
			$(".cart-modal-recommendations").html(recommendationsMarkup);
			var $element = $(".js-product-recommendations",$(".cart-modal-recommendations"));
			wpbingo.elementslickCarousel( $element );
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }			
		});
	};

	cartUpdateCallback = function(cart, added) {
		updateCountPrice(cart);
		if($('.js-drawer').length > 0 || $('[data-cart-container]').length > 0 ) {
			buildCart(cart,fire_work);
			cartModalupdate(cart);
			if (added) {
				$body.trigger('drawer.open');
			}
		}
	};

  buildCart = function(cart) {
    $cartContainer.empty();
	

    // Show empty cart
    if (cart.item_count === 0) {
      $cartContainer.append(
        '<p class="cart-empty-message">' +
          wpbingo.strings.cartEmpty +
          '</p>\n' +
          '<p class="cookie-message">' +
          wpbingo.strings.cartCookies +
          '</p>'
      );
      cartCallback(cart);
		$('.js-drawer .drawer__title .count').text('0');
		$('.shipping-bar-cart').addClass('hidden');
		 return;
    }

    var items = [],
      item = {},
      data = {},
      source = $(settings.cartTemplate).html();

    var template = Handlebars.compile(source);

    $.each(cart.items, function(index, cartItem) {
		var prodImg; 
		var unitPrice = null;
		var disabled = '';
		var variant_id = cartItem.variant_id;
		var count = $('#count_quantity [data-variant_id="'+variant_id+'"]').data('count_quantity');
		if( cartItem.quantity == count ){
			disabled = 'disabled';
		}
		if (cartItem.image !== null) {
			prodImg = cartItem.image
				.replace(/(\.[^.]*)$/, '_compact$1')
				.replace('http:', '');
		} else {
			prodImg = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
		}

		if (cartItem.properties !== null) {
			$.each(cartItem.properties, function(key, value) {
				if (key.charAt(0) === '_' || !value) {
					delete cartItem.properties[key];
				}
			});
		}

		if (cartItem.properties !== null) {
			$.each(cartItem.properties, function(key, value) {
				if (key.charAt(0) === '_' || !value) {
					delete cartItem.properties[key];
				}
			});
		}

		if (cartItem.line_level_discount_allocations.length !== 0) {
			for (var discount in cartItem.line_level_discount_allocations) {
				var amount =
				cartItem.line_level_discount_allocations[discount].amount;
				cartItem.line_level_discount_allocations[
						discount
				].formattedAmount = wpbingo.Currency.formatMoney(
					amount,settings.moneyFormat
				);
			}
		}

		if (cart.cart_level_discount_applications.length !== 0) {
			for (var cartDiscount in cart.cart_level_discount_applications) {
				var cartAmount =
				cart.cart_level_discount_applications[cartDiscount]
					.total_allocated_amount;

				cart.cart_level_discount_applications[
					cartDiscount
				].formattedAmount = wpbingo.Currency.formatMoney(
					cartAmount,
					settings.moneyFormat
				);
			}
		}

		if (cartItem.unit_price_measurement) {
			unitPrice = {
				addRefererenceValue:
				cartItem.unit_price_measurement.reference_value !== 1,
				price: wpbingo.Currency.formatMoney(
					cartItem.unit_price,
					settings.moneyFormat
				),
				reference_value: cartItem.unit_price_measurement.reference_value,
				reference_unit: cartItem.unit_price_measurement.reference_unit
			};
		}

      // Create item's data object and add to 'items' array
		item = {
			key: cartItem.key,
			line: index + 1, // Shopify uses a 1+ index in the API
			url: cartItem.url,
			img: prodImg,
			name: cartItem.product_title,
			variation: cartItem.variant_title === null ? false : true,
			variant: cartItem.variant,
			options: cartItem.options_with_values,
			variant_id: cartItem.variant_id,
			properties: cartItem.properties,
			itemAdd: cartItem.quantity + 1,
			itemMinus: cartItem.quantity - 1,
			itemQty: cartItem.quantity,
			handle:cartItem.handle,
			price: wpbingo.Currency.formatMoney(
			  cartItem.original_line_price,
			  settings.moneyFormat
			),
			discountedPrice: wpbingo.Currency.formatMoney(
			  cartItem.final_line_price,
			  settings.moneyFormat
			),
			discounts: cartItem.line_level_discount_allocations,
			discountsApplied:cartItem.line_level_discount_allocations.length === 0 ? false : true,
			vendor: cartItem.vendor,
			unitPrice: unitPrice,
			disabled:disabled
		};
		items.push(item);
		wpbingo.discount_single();
    });

    // Gather all cart data and add to DOM
    data = {
		items: items,
		note: cart.note,
		totalPrice: wpbingo.Currency.formatMoney(
			cart.total_price,
			settings.moneyFormat
		),
		cartDiscounts: cart.cart_level_discount_applications,
		cartDiscountsApplied:cart.cart_level_discount_applications.length === 0 ? false : true
    };
    $cartContainer.append(template(data));
    cartCallback(cart);
	if( data.note ) {
		$(".cart-table .cart-note__input textarea").val(data.note);
	}
	var discount_code = wpbingo.getCookie('wpbingo_discount');
	if( discount_code ) {
		$(".cart-table .discount_code_input").val(discount_code);
		$(".js-drawer .discount_code_input").val(discount_code);
	}
	$('.js-drawer .drawer__title .count').text(cart.item_count);
	$('.shipping-bar-cart').removeClass('hidden');
	if($('.shipping-bar-cart').length) {
		var price_shipping_bar 	= $('.shipping-bar-cart').data("price_shipping_bar");
		if( (price_shipping_bar > cart.total_price) && price_shipping_bar != 0){
			var minus_spend 		= price_shipping_bar - cart.total_price;
			var spend 				= wpbingo.Currency.formatMoney(minus_spend,settings.moneyFormat);
			var percent				= cart.total_price/price_shipping_bar*100;
			$('.shipping-bar-cart .title-spend .spend').html(spend);
			$('.shipping-bar-cart .shipping-progress').css("width",percent+"%");
			$('.shipping-bar-cart .title-shipping').addClass('hide');
			$('.shipping-bar-cart .title-spend').removeClass('hide');
			$('.shipping-bar-cart').removeClass('full');
			$('[data-cart-container]').removeClass('fire-done');
			$('#fire_work').addClass('hide');
		}else {
			$('.shipping-bar-cart .title-shipping').removeClass('hide');
			$('.shipping-bar-cart .title-spend').addClass('hide');
			$('.shipping-bar-cart .shipping-progress').css("width","100%");
			$('.shipping-bar-cart').addClass('full');
			if(!$('[data-cart-container]').hasClass('fire-done')){
				$('[data-cart-container]').addClass('fire');
			}
			if($('[data-cart-container]').hasClass('fire')){
				$('#fire_work').removeClass('hide');
				confettiLoop();
			}
			setTimeout(function() {
				$('[data-cart-container]').addClass('fire-done');
				$('[data-cart-container]').removeClass('fire');
			},1000);
			setTimeout(function() {
				$('#fire_work').addClass('hide');
			},5000);
		}
	}
	$('.pre_order-cart >span').each(function(){
		var id = $(this).data('handle');
		for (var i in data.items) {
			if(data.items[i].variant_id == id) {
				$('.ajaxcart__product[data-line="'+data.items[i].line+'"] .pre_order').removeClass('hide');
			}
		}
	});
	wpbingo.checkbox_terms_conditions();
	if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
  };

  cartCallback = function(cart) {
    $body.removeClass('ajaxcart--is-loading');

    if (window.Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize();
    }

    $body.trigger('drawer.footer');
  };

  adjustCart = function() {
    $body.on('click', '.ajaxcart__qty-adjust', function() {
		if (isUpdating) {
			return;
		}
		var $el = $(this),
			line = $el.data('line'),
			$qtySelector = $el.siblings('.ajaxcart__qty-num'),
			qty = parseInt($qtySelector.val().replace(/\D/g, ''));
		qty = validateQty(qty);
		if ($el.hasClass('ajaxcart__qty--plus')) {
			qty += 1;
		} else {
			qty -= 1;
			if (qty <= 0) qty = 0;
		}
		if (line) {
			updateQuantity(line, qty);
		} else {
			$qtySelector.val(qty);
		}
    });

    $body.on('change', '.ajaxcart__qty-num', function() {
		var id = $(this).data('variant_id');
		var count = $('#count_quantity [data-variant_id="'+id+'"]').data('count_quantity');
		if (isUpdating) {
			return;
		}
		var $el = $(this),
			line = $el.data('line'),
			qty = parseInt($el.val().replace(/\D/g, ''));
		qty = validateQty(qty);
		if(qty >= count){
			qty = count;
			$el.val(qty);
		}
		if (line) {
			updateQuantity(line, qty);
		}
    });

    $body.on('submit', 'form.ajaxcart', function(evt) {
      if (isUpdating) {
        evt.preventDefault();
      }
    });

    $body.on('focus', '.ajaxcart__qty-adjust', function() {
      var $el = $(this);
      setTimeout(function() {
        $el.select();
      }, 50);
    });

    function updateQuantity(line, qty) {
      isUpdating = true;

      var $row = $('.ajaxcart__product[data-line="' + line + '"]').addClass('is-loading');
      if (qty === 0) {
        $row.parent().addClass('is-removed');
      }

      setTimeout(function() {
        ShopifyAPI.changeItem(line, qty, adjustCartCallback);
      }, 250);
    }
  };

  adjustCartCallback = function(cart) {
    updateCountPrice(cart);
    setTimeout(function() {
      ShopifyAPI.getCart(buildCart);
      isUpdating = false;
    }, 150);
  };

  validateQty = function(qty) {
    if (parseFloat(qty) === parseInt(qty) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      qty = 1;
    }
    return qty;
  };

  module = {
    init: init,
    load: loadCart
  };

  return module;

})(ajaxCart || {}, jQuery);

wpbingo.drawerCart = (function(module) {
  var $body, $drawer, drawerCloseSelector, headerCartSelector, drawerIsOpen;

  var init, drawerOpen, drawerClose, drawerFooter;

  var classes = {
    open: 'drawer--open'
  };

  init = function() {
    $body = $('body');
    $drawer = $('.js-drawer');
    drawerCloseSelector = '.js-drawer-close';
    headerCartSelector = '.js-header-cart';
    drawerIsOpen = false;

    $body.on('drawer.open', function(evt) {
      drawerOpen(evt);
    });

    $body.on('drawer.close', function(evt) {
      drawerClose(evt);
    });

    $body.on('drawer.footer', function() {
      drawerFooter();
    });

    $body.on('click', headerCartSelector, function(evt) {
		if( !$('body').hasClass('template-cart') ){
			evt.preventDefault();
			$body.trigger('drawer.open', evt);
		}
    });

    $body.on('click', drawerCloseSelector, function(evt) {
      evt.preventDefault();
      $body.trigger('drawer.close', evt);
    });
  };

  drawerOpen = function(evt) {
    if (drawerIsOpen) {
      if (evt) {
        evt.preventDefault();
      }
      return;
    }

    if (evt) {
      evt.preventDefault();
    }

    $body.addClass(classes.open);
    drawerIsOpen = true;
  };

  drawerClose = function(evt) {
    if (!drawerIsOpen) {
      return;
    }

    if (evt.keyCode !== 27) {
      evt.preventDefault();
    }

    $body.removeClass(classes.open);
    drawerIsOpen = false;
  };

  drawerFooter = function() {
    if (!$drawer.hasClass('drawer--has-fixed-footer')) {
      return;
    }

    var $cartFooter = $('.ajaxcart__footer').removeAttr('style');
    var $cartInner = $('.ajaxcart__inner').removeAttr('style');
    var cartFooterHeight = $cartFooter.outerHeight();
    $cartInner.css('bottom', cartFooterHeight);
    $cartFooter.css('height', cartFooterHeight);
	$(".ajaxcart__info .button_note").on( "click", function() {
		if($('.ajaxcart__info .ajaxcart__note').hasClass('active')){
			$('.ajaxcart__info .ajaxcart__note').removeClass('active');	
		}else{
			$('.ajaxcart__info .ajaxcart__note').addClass('active');		
		}
	});
	$(".ajaxcart__info .button_discount").on( "click", function() {
		if($('.ajaxcart__info .discount_code').hasClass('active')){
			$('.ajaxcart__info .discount_code').removeClass('active');	
		}else{
			$('.ajaxcart__info .discount_code').addClass('active');		
		}
	});
	$(".ajaxcart__info .button_shiping").on( "click", function() {
		if($('.drawer__inner #shipping-calculator').hasClass('active')){
			$('.drawer__inner #shipping-calculator').removeClass('active');	
		}else{
			$('.drawer__inner #shipping-calculator').addClass('active');		
		}
	});
	$(".ajaxcart__info .close-ajaxcart__info").on( "click", function() {
		if($('.ajaxcart__info .ajaxcart__info_content >div').hasClass('active')){
			$('.ajaxcart__info .ajaxcart__info_content >div').removeClass('active');
		}
	});
	$(".ajaxcart__info .save").on( "click", function() {
		if($('.ajaxcart__info .ajaxcart__info_content >div').hasClass('active')){
			$('.ajaxcart__info .ajaxcart__info_content >div').removeClass('active');
		}
	});
	$(".drawer__inner #shipping-calculator .close-ajaxcart__info").on( "click", function() {
		if($('.drawer__inner #shipping-calculator').hasClass('active')){	
			$('.drawer__inner #shipping-calculator').removeClass('active');
		}
	});
	Shopify.Cart.ShippingCalculator.show( {
	  submitButton: window.strings.shippingCalcSubmitButton,
	  submitButtonDisabled: window.strings.shippingCalcSubmitButtonDisabled,
	  customerIsLoggedIn: window.strings.shippingCalcCustomerIsLoggedIn,
	  moneyFormat: window.strings.shippingCalcMoneyFormat,
	  CalculateMessSuccess: window.strings.CalculateMessSuccess,
	  CalculateMessPrice: window.strings.CalculateMessPrice,
	  CalculateMessError: window.strings.CalculateMessError
	});
  };

  module = {
    init: init
  }

  return module;
})();

wpbingo.variables = {
  productPageLoad: false,
  productPageSticky: true,
  mediaTablet: 'screen and (max-width: 1024px)',
  mediaMobile: 'screen and (max-width: 767px)',
  isTablet: false,
  isMobile: false
};

wpbingo.initializeEvents = function() {
	var $body = $('body'),
		passwordToggle = '.js-password-toggle',
		tooltip = '[data-toggle="tooltip"]',
		scrollToTop = '.js-scroll-to-top',
		collectionSidebarToggle = '.js-sidebar-toggle';
	var classes = {
		passwordShow: 'password-toggle--show'
	};
	$(tooltip).tooltip();
	$body.on('click', passwordToggle, function(e) {
		e.preventDefault();
		var $this = $(this);
		var $passwordField = $this.siblings('.form-control');
		var isShow = $this.hasClass(classes.passwordShow) ? true : false;
		if (isShow) {
			$this.removeClass(classes.passwordShow);
			$passwordField.attr('type', 'password');
		} else {
			$this.addClass(classes.passwordShow);
			$passwordField.attr('type', 'text');
		}
	});
	$body.on('click', scrollToTop, function(e) {
		e.preventDefault();
		$('body, html').stop().animate({ scrollTop: 0 }, '500');
	});
	$body.on('click', collectionSidebarToggle,function(evt) {
		evt.preventDefault();
		$body.toggleClass('collection-sidebar--open');
	});
	$(window).scroll(function() {
		if ($(window).scrollTop() >= 200) {
			$(scrollToTop).fadeIn();
		} else {
			$(scrollToTop).fadeOut();
		}
	});
};

wpbingo.setBreakpoints = function() {
	enquire.register(wpbingo.variables.mediaTablet, {
		match: function() {
			wpbingo.variables.isTablet = true;
		},
		unmatch: function() {
			wpbingo.variables.isTablet = false;
		}
	});
	enquire.register(wpbingo.variables.mediaMobile, {
		match: function() {
			wpbingo.variables.isMobile = true;
		},
		unmatch: function() {
			wpbingo.variables.isMobile = false;
		}
	});
};

wpbingo.updateSlickSwipe = function(element, allowSwipe){
  if (!element.hasClass('slick-initialized')) {
    return;
  }
  var slickOptions = {
    accessibility: allowSwipe,
    draggable: allowSwipe,
    swipe: allowSwipe,
    touchMove: allowSwipe
  };
  element.slick('slickSetOption', slickOptions, false);
};

wpbingo.showLoading = function () {
	$('body').append(wpbingo.loading != undefined && wpbingo.loading != '' ? wpbingo.loading : '');
};

wpbingo.hideLoading = function() {
	$('.wpbingo-loading').remove();
};

wpbingo.cartInit = function() {
  var $body = $('body');
  if (!wpbingo.cookiesEnabled()) {
    $body.addClass('cart--no-cookies');
  }
  if (wpbingo.settings.cartType == 'modal' || wpbingo.settings.cartType == 'drawer') {
    ajaxCart.init();
    ajaxCart.load();

    if (wpbingo.settings.cartType == 'drawer') {
      wpbingo.drawerCart.init();
    }
  }
};

wpbingo.cookiesEnabled = function() {
  var cookieEnabled = navigator.cookieEnabled;

  if (!cookieEnabled){
    document.cookie = 'webcookie';
    cookieEnabled = (document.cookie.indexOf('webcookie') !== -1);
  }
  return cookieEnabled;
};
wpbingo.setCookie = function(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = 'expires=' + d.toGMTString();
	document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
};
wpbingo.getCookie = function(cname) {
	var name = cname + '=';
	var decodedCookie = decodeURIComponent(document.cookie);
	var cookieArray = decodedCookie.split(';');
	for(var i = 0; i < cookieArray.length; i++) {
		var cookieItem = cookieArray[i];
		while (cookieItem.charAt(0) === ' ') {
			cookieItem = cookieItem.substring(1);
		}
		if (cookieItem.indexOf(name) === 0) {
			return cookieItem.substring(name.length, cookieItem.length);
		}
	}
	return '';
};

wpbingo.cookieConsent = function() {
	var cConsent = wpbingo.getCookie('cookie_consent'),
		cConsentSelector = $('.cookie-consent'),
		cConsentDismiss = '.cookie-consent-dismiss';
		cConsentAgree = '.cookie-consent-agree';
	if (cConsent == 'true' || cConsent == 'false') {
		cConsentSelector.remove();
	} else {
		setTimeout(function() {
			cConsentSelector.addClass('active');
		}, 1500);
		if (cConsent == '') wpbingo.setCookie('cookie_consent', '', 10);
	}
	$('body').on('click', cConsentDismiss, function(e) {
		e.preventDefault();
		cConsentSelector.remove();
		wpbingo.setCookie('cookie_consent', false, 10);
	});
	$('body').on('click', cConsentAgree, function(e) {
		e.preventDefault();
		cConsentSelector.remove();
		wpbingo.setCookie('cookie_consent', true, 10);
	});
};

wpbingo.slideshow = function() {
	var slideshow = '.js-wpbingo-slideshow',
		fade = $(slideshow).data('fade'),
		autoplay = $(slideshow).data('autoplay'),
		autoplayInterval = $(slideshow).data('autoplayinterval'),
		autoplayNavigation = $(slideshow).data('navigation'),
		autoplayPagination = $(slideshow).data('pagination');
	var config = {
		fade: true,
		rows: 0,
		arrows: autoplayNavigation,
		autoplay: autoplay,
		rtl : wpbingo.rtl_slick() ,
		autoplaySpeed: autoplayInterval
	};
	(fade === undefined || fade == null) ? true : config.fade = fade;
	(autoplayInterval === undefined || autoplayInterval == null) ? true : config.autoplaySpeed = autoplayInterval;
	(autoplayPagination === undefined || autoplayPagination == null || autoplayPagination != true) ? config.dots = false : config.dots = true;
	$(slideshow).slick(config);
};
wpbingo.rtl_slick = function() {
	if ($('body').hasClass("rtl")) {
		return true;
	} else {
		return false;
	}
}
wpbingo.slickCarousel = function() {
	var bwpCarousel = '.js-carousel';
	$(bwpCarousel).each(function() {
		var $element = $(this),
			nav = $element.data('nav'),
			dots = $element.data('dots'),
			draggable = $element.data("draggable") ? false : true ,
			fade = $element.data("fade") ? true : false ,
			center = $element.data('center'),
			infinite = $element.data('infinite'),
			autoplay = $element.data('autoplay'),
			autoplaySpeed = $element.data('autoplayspeed'),
			slidesToScroll = $element.data("slidestoscroll") ? $element.data("columns") : 1,
			columns = $element.data("columns"),
			column1440 = $element.data("column1440"),
			column1 = $element.data("column1"),
			column2 = $element.data("column2"),
			column3 = $element.data("column3"),
			column4 = $element.data("column4"),
			asNavFor = $element.data("asnavfor") ? $element.data("asnavfor") : false ,
			rows = $element.data('rows');
		var config = {
			rtl : wpbingo.rtl_slick() ,
			draggable: draggable,
			fade: fade,
			asNavFor: asNavFor,
			arrows: nav,
			slidesToShow: columns,
			slidesToScroll: slidesToScroll,
			responsive: [
				{
					breakpoint: 1441,
					settings: {
						slidesToShow: column1440,
						slidesToScroll: column1440,
					}
				},
				{
					breakpoint: 1200,
					settings: {
						slidesToShow: column1,
						slidesToScroll: column1,
					}
				},				
				{
					breakpoint: 1024,
					settings: {
						slidesToShow: column2,
						slidesToScroll: column2,
					}
				},
				{
					breakpoint: 768,
					settings: {
						slidesToShow: column3,
						slidesToScroll: column3,
						vertical: false,
						verticalSwiping : false,
					}
				},
				{
					breakpoint: 480,			  
					settings: {
						slidesToShow: column4,
						slidesToScroll: column4,
						vertical: false,
						verticalSwiping : false,
					}
				}
			]
		};
		(center === undefined || center == null || center != true) ? config.centerMode = false : config.centerMode = true;
		(dots === undefined || dots == null || dots != true) ? config.dots = false : config.dots = true;
		(infinite === undefined || infinite == null || infinite != true) ? config.infinite = false : config.infinite = true;
		if (autoplay) {
			config.autoplay = autoplay;
			config.autoplaySpeed = autoplaySpeed;
		}
		if (rows !== undefined && rows != null && rows != 1) {
			config.rows = rows;
			config.slidesPerRow = columnone;
			config.slidesToShow = 1,
			config.responsive = [
				{
					breakpoint: 1025,
					settings: {
						slidesPerRow: columntwo,
						slidesToShow: 1
					}
				},
				{
					breakpoint: 768,
					settings: {
						slidesPerRow: columnthree,
						slidesToShow: 1
					}
				}
			]
		} else {
			config.rows = 0;
		}
		$element.slick(config);
		if($(".slick-arrow",$element).length > 0){
			var $prev = $(".slick-prev",$element).clone();
			$(".slick-prev",$element).remove();
			if($element.parent().find(".slick-prev").length == 0){
				$prev.prependTo($element.parent());
			}
			$prev.on( "click", function() {
				$element.slick('slickPrev');
			});
			var $next =  $(".slick-next",$element).clone();
			$(".slick-next",$element).remove();
			if($element.parent().find(".slick-next").length == 0){
				$next.appendTo($element.parent());
			}
			$next.on( "click", function() {
				$element.slick('slickNext');
			});
		}
	});
	$('.product-tabs__nav-link').on('shown.bs.tab', function() {
		var productTabs = $(this).closest('.product-tabs');
		if (productTabs.find(bwpCarousel).length > 0) {
			productTabs.find(bwpCarousel).slick('setPosition');
		}
	});
};
wpbingo.elementslickCarousel = function($element) {
	var nav = $element.data('nav'),
		infinite = $element.data('infinite'),
		columns = $element.data("columns") ? $element.data("columns") : 1,
		column1440 = $element.data("column1440"),
		column1 = $element.data("column1"),
		column2 = $element.data("column2"),
		column3 = $element.data("column3"),
		column4 = $element.data("column4"),
		rows = $element.data('rows');
	var config = {
		arrows: nav,
		slidesToShow: columns,
		slidesToScroll: columns,
		rtl : wpbingo.rtl_slick() ,
		responsive: [
			{
				breakpoint: 1441,
				settings: {
					slidesToShow: column1440,
					slidesToScroll: column1440,
				}
			},
			{
				breakpoint: 1200,
				settings: {
					slidesToShow: column1,
					slidesToScroll: column1,
				}
			},				
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: column2,
					slidesToScroll: column2,
				}
			},
			{
				breakpoint: 768,
				settings: {
					slidesToShow: column3,
					slidesToScroll: column3,
					vertical: false,
					verticalSwiping : false,
				}
			},
			{
				breakpoint: 480,			  
				settings: {
					slidesToShow: column4,
					slidesToScroll: column4,
					vertical: false,
					verticalSwiping : false,
				}
			}
		]
	};
	if (rows !== undefined && rows != null && rows != 1) {
		config.rows = rows;
		config.slidesPerRow = columnone;
		config.slidesToShow = 1,
		config.responsive = [
			{
				breakpoint: 1025,
				settings: {
					slidesPerRow: columntwo,
					slidesToShow: 1
				}
			},
			{
				breakpoint: 768,
				settings: {
					slidesPerRow: columnthree,
					slidesToShow: 1
				}
			}
		]
	} else {
		config.rows = 0;
	}
	$element.slick(config);
	if($(".slick-arrow",$element).length > 0){
		var $prev = $(".slick-prev",$element).clone();
		$(".slick-prev",$element).remove();
		if($element.parent().find(".slick-prev").length == 0){
			$prev.prependTo($element.parent());
		}
		$prev.on( "click", function() {
			$element.slick('slickPrev');
		});
		var $next =  $(".slick-next",$element).clone();
		$(".slick-next",$element).remove();
		if($element.parent().find(".slick-next").length == 0){
			$next.appendTo($element.parent());
		}
		$next.on( "click", function() {
			$element.slick('slickNext');
		});
	}
};	
wpbingo.countdown = function($class) {
	var countdown = '[data-countdown]';
	$(countdown).each(function() {
		var $this = $(this);
		var	finalDate = $(this).data('countdown'),
			date_final = new Date(finalDate),
			seconds_final = date_final.getTime(),
			date = Date.now(),
			parent = $this.closest('.product-card'),
			text_day = $(this).data('day') ? $(this).data('day') : wpbingo.strings.countdownDays,
			text_hour = $(this).data('hour') ? $(this).data('hour') : wpbingo.strings.countdownHours,
			time_min = $(this).data('min') ? $(this).data('min') : wpbingo.strings.countdownMinutes,
			text_sec = $(this).data('sec') ? $(this).data('sec') : wpbingo.strings.countdownSeconds;
		if(seconds_final > date){
			$this.countdown(finalDate, function(event) {
			  var strTime = '<div class="countdown__item"><span>%D</span><span>' + text_day + '</span></div>' +
				'<div class="countdown__item"><span>%H</span><span>' + text_hour + '</span></div>' +
				'<div class="countdown__item"><span>%M</span><span>' + time_min + '</span></div>' +
				'<div class="countdown__item"><span>%S</span><span>' + text_sec + '</span></div>';
			  $this.html(event.strftime(strTime));
			})
			.on('finish.countdown', function() {
			  $this.html(wpbingo.strings.countdownFinish);
			});
		}else{
			$('.countdown-product',parent).remove();
			$('.product-quickview .countdown-quickview').remove();
		}
	});
};
wpbingo.countdown_single = function() {
    var $this = $('.countdown-single .countdown'),
		finalDate = $this.data('countdown_single'),
		date_final = new Date(finalDate),
		seconds_final = date_final.getTime(),
		date = Date.now(),
		text_day = $this.data('day') ? $this.data('day') : wpbingo.strings.countdownDays,
		text_hour = $this.data('hour') ? $this.data('hour') : wpbingo.strings.countdownHours,
		time_min = $this.data('min') ? $this.data('min') : wpbingo.strings.countdownMinutes,
		text_sec = $this.data('sec') ? $this.data('sec') : wpbingo.strings.countdownSeconds;
	if(seconds_final > date){
		$this.countdown(finalDate, function(event) {
		  var strTime = '<div class="countdown__item"><span>%D</span><span>' + text_day + '</span></div>' +
			'<div class="countdown__item"><span>%H</span><span>' + text_hour + '</span></div>' +
			'<div class="countdown__item"><span>%M</span><span>' + time_min + '</span></div>' +
			'<div class="countdown__item"><span>%S</span><span>' + text_sec + '</span></div>';
		  $this.html(event.strftime(strTime));
		})
		.on('finish.countdown', function() {
		  $this.html(wpbingo.strings.countdownFinish);
		});
	}else{
		$('.product-single .countdown-single').remove();
	}
};
wpbingo.active_form_login = function() {
	$(".header-account [data-login-account]").on( "click", function(e) {
		e.preventDefault();
		var $element = $('[data-login_popup]');
		if($element.hasClass('active')){
			$element.removeClass('active');
			$('body').removeClass('not-scroll');
		}else{
			$element.addClass('active');
			$('body').addClass('not-scroll');
		}
	});
	$("[data-close_login_popup]").on( "click", function(e) {
		e.preventDefault();
		var $element = $('[data-login_popup]');
		if($element.hasClass('active')){
			$element.removeClass('active');
			$('body').removeClass('not-scroll');
		}
	});
};

// wpbingo.click_atribute_image = function(){
// 	var moneyFormat = wpbingo.strings.moneyFormat;
// 	$('.wpb-variants-swatch').each(function() {
// 		var $element = $(this);	
// 		$(".swatch-items",$element).on( "click", function() {
// 			var $this = $(this);
// 			if(!$(this).hasClass("active")){
// 				var $parent = $(this).closest(".swatch-content");
// 				$(".swatch-items",$parent).removeClass("active");
// 				$(this).addClass("active");
// 				var variants_value = wpbingo.get_variant_value($element);
// 				var productHandle = $element.data('handle');
// 				$.getJSON('/products/' + productHandle + '.js', function(product) {
// 					if(product.variants){
// 						wpbingo.updateVariantsButton($element,product);
// 						$.each( product.variants, function( index, variant ){
// 							if (variant.available) {
// 								if(variant.title == variants_value){
// 									var $current =  $this.closest(".product-card");
// 									$(".product-group-price[data-handle="+productHandle+"] .variant-price",$current).html(wpbingo.Currency.formatMoney(variant.price, moneyFormat));
// 									$(".product-card__form[data-handle="+productHandle+"] input[name='id']",$current).val(variant.id);
// 									if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
//                                     if($('.product-card__image-wrapper',$current).hasClass('slider')){
//                                         var value = $( "label",$this).data('variant');
//                                         var value_variants = value.trim().replace(/\s+/g, '_');
//                                         $('.mutil_slider-single',$current).removeClass('active');
//                                         $('.mutil_slider-single.'+ value_variants +'',$current).addClass('active');
//                                     }
// 									if(variant.featured_media){
// 										prodImg = variant.featured_media.preview_image.src.replace(/(\.[^.]*)$/, '_600x$1').replace('http:', '');
// 										if(!$('.product-card__image-wrapper',$current).hasClass('slider')){
// 											$(".product-card__image img.variant",$current).attr("src", prodImg);
// 											$(".product-card__image img.variant",$current).attr("srcset", prodImg);
// 										}
// 										if($('.product-card__image-wrapper',$current).hasClass('zoom')){
// 											$(".product-card__image img",$current).last().attr("src", prodImg);
// 										}
// 										$(".product-card__image_compare[data-handle="+productHandle+"] img",".content-compare.active").attr("src", prodImg);
// 										$(".product-card__image_compare[data-handle="+productHandle+"] img",".content-compare.active").attr("srcset", prodImg);
// 									}
// 								}
// 							}
// 						});
// 					}
// 				});
// 			}
// 		});
// 	});
// }
// wpbingo.get_variant_value = function($element){
// 	var variant1,variant2,variant3;
// 	$('.swatch-content-1',$element).each(function(index) {
// 		var value = $(".swatch-items.active label",$(this)).data("variant");
// 		if(value === null){
// 			value = "null";
// 		}
// 		variant1 = value;
// 	});
// 	$('.swatch-content-2',$element).each(function(index) {
// 		var value = $(".swatch-items.active label",$(this)).data("variant");
// 		if(value === null){
// 			value = "null";
// 		}
// 		variant2 = value;
// 	});
// 	$('.swatch-content-3',$element).each(function(index) {
// 		var value = $(".swatch-items.active label",$(this)).data("variant");
// 		if(value === null){
// 			value = "null";
// 		}
// 		variant3 = value;
// 	});
// 	if(variant1 && variant2 && variant3){
// 		var variants_value = variant1 + ' / ' + variant2 + ' / ' + variant3;
// 	}else if(variant1 && variant2){
// 		var variants_value = variant1 + ' / ' + variant2;
// 	}else if(variant1){
// 		var variants_value = variant1;
// 	}
// 	return variants_value;
// }
// wpbingo.updateVariantsButton = function($element,$product) {
// 	var selectedValues = wpbingo.getCurrentOptions($element);
// 	var variants = $product.variants;
// 	for (var i = 2; i <= 3; i++) {
// 		if ($(".swatch-content-"+i+"",$element).length) {
// 			var $container = $(".swatch-content-"+i+"",$element);
// 			$("label", $container).each(function() {
// 				var $self = $(this);
// 				var optionValue = $self.data("variant");
// 				var foundIndex;
// 				if (i === 2) {
//                 	foundIndex = _.findIndex(variants, function(variant) {
//                 		variant.option1 = variant.option1.toString();
//                 		selectedValues[0].value = selectedValues[0].value.toString();
//                 		variant.option2 = variant.option2.toString();
//                 		optionValue = optionValue.toString();
//                 		return variant.option1 === selectedValues[0].value &&
//                 		variant.option2 === optionValue &&
//                 		variant.available === true;
//                 	});
                	
//                 } else if (i === 3) {
//                 	foundIndex = _.findIndex(variants, function(variant) {
//                 		variant.option1 = variant.option1.toString();
//                 		variant.option2 = variant.option2.toString();
//                 		variant.option3 = variant.option3.toString();
//                 		selectedValues[0].value = selectedValues[0].value.toString();
//                 		selectedValues[1].value = selectedValues[1].value.toString();
//                 		optionValue = optionValue.toString();
//                 		return variant.option1 === selectedValues[0].value && variant.option2 === selectedValues[1].value &&
//                 		variant.option3 === optionValue &&
//                 		variant.available === true;
//                 	});
//                 }
// 				if (foundIndex !== -1) {
// 					$self.closest(".swatch-items").removeClass('disabled');
// 				} else {
// 					$self.closest(".swatch-items").addClass('disabled');
// 				}
// 			});	
// 		}
// 	}
// }
// wpbingo.getCurrentOptions =  function($element) {
// 	var currentOptions = [];
// 	for (var i = 1; i <= 3; i++) {
// 		if ($(".swatch-content-"+i+"",$element).length) {
// 			var currentOption = {};
// 			currentOption.index = $(".swatch-content-"+i+" .swatch-items.active label",$element).data("index");
// 			var $variant = $(".swatch-content-"+i+" .swatch-items.active label",$element).data("variant");
// 			if($variant === null){
// 				$variant = "null";
// 			}		
// 			currentOption.value = $variant;
// 			currentOptions[i] = currentOption;
// 		}
// 	}
// 	return _.compact(currentOptions);
// }

/////////////demo///////////////////
wpbingo.click_atribute_image = function(){
	var moneyFormat = wpbingo.strings.moneyFormat;
	$('.wpb-variants-swatch').each(function() {
		var $element = $(this);	
		$(".swatch-items",$element).on( "click", function() {
			var $this = $(this);
			if(!$(this).hasClass("active")){
				var $parent = $(this).closest(".swatch-content");
				$(".swatch-items",$parent).removeClass("active");
				$(this).addClass("active");
				var variants_value = wpbingo.get_variant_value($element);
				var productHandle = $element.data('handle');
				$.getJSON('/products/' + productHandle + '.js', function(product) {
					if(product.variants){
						wpbingo.updateVariantsButton($element,product);
						$.each( product.variants, function( index, variant ){
							if (variant.available) {
								if(variant.title == variants_value){
									var $current =  $this.closest(".product-card");
									$(".product-group-price[data-handle="+productHandle+"] .variant-price",$current).html(wpbingo.Currency.formatMoney(variant.price, moneyFormat));
									$(".product-card__form[data-handle="+productHandle+"] input[name='id']",$current).val(variant.id);
									
									if( $('.bwp_currency').length > 0){ 
										Currency.Currency_customer(true); 
									}
									
									// Handle image switching for SLIDER template
									if($('.product-card__image-wrapper.slider',$current).length > 0){
										var value = $( "label",$this).data('variant');
										if(value) {
											var value_variants = value.trim().replace(/\s+/g, '_');
											$('.mutil_slider-single',$current).removeClass('active');
											$('.mutil_slider-single.'+ value_variants +'',$current).addClass('active');
										}
									}
									
									// Handle image switching for TRANSFORMER template
									if($('.product-card__image-container',$current).length > 0 && !$('.product-card__image-wrapper.slider',$current).length){
										if(variant.featured_media){
											var prodImg = variant.featured_media.preview_image.src.replace(/(\.[^.]*)$/, '_600x$1').replace('http:', '');
											
											// Update all variant images
											$("img.variant",$current).each(function(){
												$(this).attr("src", prodImg);
												$(this).attr("srcset", prodImg);
												$(this).attr("data-src", prodImg);
											});
											
											// Also update the main product-card__img
											$("img.product-card__img",$current).each(function(){
												$(this).attr("src", prodImg);
												$(this).attr("srcset", prodImg);
												$(this).attr("data-src", prodImg);
											});
										}
									}
									
									// Handle image switching for ZOOM template (if exists)
									if($('.product-card__image-wrapper.zoom',$current).length > 0 && !$('.product-card__image-wrapper.slider',$current).length){
										if(variant.featured_media){
											var prodImg = variant.featured_media.preview_image.src.replace(/(\.[^.]*)$/, '_600x$1').replace('http:', '');
											$(".product-card__image img",$current).last().attr("src", prodImg);
										}
									}
									
									// Update compare image if exists
									$(".product-card__image_compare[data-handle="+productHandle+"] img",".content-compare.active").attr("src", prodImg);
									$(".product-card__image_compare[data-handle="+productHandle+"] img",".content-compare.active").attr("srcset", prodImg);
								}
							}
						});
					}
				});
			}
		});
	});
}

// Rest of the functions remain the same as before
wpbingo.get_variant_value = function($element){
	var variant1,variant2,variant3;
	$('.swatch-content-1',$element).each(function(index) {
		var value = $(".swatch-items.active label",$(this)).data("variant");
		if(value === null){
			value = "null";
		}
		variant1 = value;
	});
	$('.swatch-content-2',$element).each(function(index) {
		var value = $(".swatch-items.active label",$(this)).data("variant");
		if(value === null){
			value = "null";
		}
		variant2 = value;
	});
	$('.swatch-content-3',$element).each(function(index) {
		var value = $(".swatch-items.active label",$(this)).data("variant");
		if(value === null){
			value = "null";
		}
		variant3 = value;
	});
	if(variant1 && variant2 && variant3){
		var variants_value = variant1 + ' / ' + variant2 + ' / ' + variant3;
	}else if(variant1 && variant2){
		var variants_value = variant1 + ' / ' + variant2;
	}else if(variant1){
		var variants_value = variant1;
	}
	return variants_value;
}

wpbingo.updateVariantsButton = function($element,$product) {
	var selectedValues = wpbingo.getCurrentOptions($element);
	var variants = $product.variants;
	for (var i = 2; i <= 3; i++) {
		if ($(".swatch-content-"+i+"",$element).length) {
			var $container = $(".swatch-content-"+i+"",$element);
			$("label", $container).each(function() {
				var $self = $(this);
				var optionValue = $self.data("variant");
				var foundIndex;
				if (i === 2) {
                	foundIndex = _.findIndex(variants, function(variant) {
                		variant.option1 = variant.option1.toString();
                		selectedValues[0].value = selectedValues[0].value.toString();
                		variant.option2 = variant.option2.toString();
                		optionValue = optionValue.toString();
                		return variant.option1 === selectedValues[0].value &&
                		variant.option2 === optionValue &&
                		variant.available === true;
                	});
                	
                } else if (i === 3) {
                	foundIndex = _.findIndex(variants, function(variant) {
                		variant.option1 = variant.option1.toString();
                		variant.option2 = variant.option2.toString();
                		variant.option3 = variant.option3.toString();
                		selectedValues[0].value = selectedValues[0].value.toString();
                		selectedValues[1].value = selectedValues[1].value.toString();
                		optionValue = optionValue.toString();
                		return variant.option1 === selectedValues[0].value && variant.option2 === selectedValues[1].value &&
                		variant.option3 === optionValue &&
                		variant.available === true;
                	});
                }
				if (foundIndex !== -1) {
					$self.closest(".swatch-items").removeClass('disabled');
				} else {
					$self.closest(".swatch-items").addClass('disabled');
				}
			});	
		}
	}
}

wpbingo.getCurrentOptions =  function($element) {
	var currentOptions = [];
	for (var i = 1; i <= 3; i++) {
		if ($(".swatch-content-"+i+"",$element).length) {
			var currentOption = {};
			currentOption.index = $(".swatch-content-"+i+" .swatch-items.active label",$element).data("index");
			var $variant = $(".swatch-content-"+i+" .swatch-items.active label",$element).data("variant");
			if($variant === null){
				$variant = "null";
			}		
			currentOption.value = $variant;
			currentOptions[i] = currentOption;
		}
	}
	return _.compact(currentOptions);
}

// ----------Demo----------

wpbingo.sticky_product = function(){
	var $parent = $(".template-product");
	if( $(".sticky-cart-single",$parent).length > 0 ){
		var bwp_width = $( window ).width();
		$( window ).scroll(function() {
			var scroll_top 	= $( window ).scrollTop();
			var offset_top 	= $(".product-single__buttons",$parent).offset().top;
			var offset_top2 = $(".bwp-footer").offset().top;
			var distance   	= (offset_top - scroll_top);
			var distance2   = (offset_top2 - scroll_top - $( window ).height());
			if ( distance <= 0) {
				$('.sticky-cart-single',$parent).addClass('sticky');
			}else{
				$('.sticky-cart-single',$parent).removeClass('sticky');
			}
			if ( $('.sticky-cart-single',$parent).hasClass('sticky') ) {
				if ( distance2 <= 0) {
					$('.sticky-cart-single',$parent).removeClass('sticky');
				}else{
					$('.sticky-cart-single',$parent).addClass('sticky');
				}
			}
		});
	}
}
wpbingo.sticky_header = function(){
	if($(".bwp-header").data("sticky_header")){
		var current_scroll = 0;
		var height = $('.bwp-header').height();
		var height_mb = $('.bwp-header .header-mobile .header-top-mobile').height();
		if ($('.bwp-header-topbar').length > 0){
			var height_topbar = $('.bwp-header-topbar').height();
		}else{
			var height_topbar = 0;
		}
		if ($('.bwp-header-campar').length > 0){
			var height_campar = $('.bwp-header-campar').height();
		}else{
			var height_campar = 0;
		}
		$( window ).scroll(function() {
			var next_scroll = $(this).scrollTop();
			if($(window).width() > 1199){
				if ( next_scroll > (height + height_topbar + height_campar) ) {
					$('.bwp-header').addClass('sticky');
					if($('body').hasClass('template-index')){
						if(!$('.bwp-header').hasClass('header-absolute')){
							$('.bwp-header').css('padding-top',height+'px')
						}
					}else{
						$('.bwp-header').css('padding-top',height+'px')
					}
				} else {
					$('.bwp-header').removeClass('sticky');
					$('.bwp-header').removeAttr('style');
				}
			}else{
				if ( next_scroll > (height_mb + height_topbar + height_campar) ) {
					$('.bwp-header').addClass('sticky');
					$('.bwp-header').css('padding-top',height_mb+'px')
				} else {
					$('.bwp-header').removeClass('sticky');
					$('.bwp-header').removeAttr('style');
				}
			}
			current_scroll = next_scroll;  
		});
	}
}
wpbingo.click_button = function(){
	$(".search-toggle").on( "click", function() {
		if($(".content-search-toggle").hasClass('active')){
			$(".bwp-header-topbar ").removeClass('active-index');
			$("body").removeClass('active_search');
			$(".content-search-toggle").removeClass('show');
			setTimeout(function(){ $(".content-search-toggle").removeClass('active'); }, 300);
		}else{
			$(".content-search-toggle").addClass('active');
			$(".bwp-header-topbar ").addClass('active-index');
			$("body").addClass('active_search');
			setTimeout(function(){ $(".content-search-toggle").addClass('show'); }, 100);
		}
	});
	$("[data-close-search-toggle]").on( "click", function() {
		if($(".content-search-toggle").hasClass('active')){
			$(".content-search-toggle").removeClass('show');
			$(".bwp-header-topbar ").removeClass('active-index');
			$("body").removeClass('active_search');
			setTimeout(function(){ $(".content-search-toggle").removeClass('active'); }, 300);
		}else{
			$(".content-search-toggle").addClass('active');
			$(".bwp-header-topbar ").addClass('active-index');
			$("body").addClass('active_search');
			setTimeout(function(){ $(".content-search-toggle").addClass('show'); }, 100);
		}
	});
	$(".title-size-guide").on( "click", function() {
		if($('.size-guide').hasClass('active')){
			$('.size-guide').removeClass('active');	
		}else{
			$('.size-guide').addClass('active');		
		}
	});
}
wpbingo.lookbook = function(){
	$(window).on("click.Bst", function(event){
		var $box = $('.wpbingo-section--lookbook:not(.lookbook-simple) .content-product-card .product-card');
		var $box2 = $('.wpbingo-section--lookbook:not(.lookbook-simple) .lookbook-card__point');
		if ( $box.has(event.target).length == 0 && !$box.is(event.target) && $box2.has(event.target).length == 0 && !$box2.is(event.target) ) {
			if($('.wpbingo-section--lookbook:not(.lookbook-simple) .content-product-card').hasClass("active")){
				$('.wpbingo-section--lookbook:not(.lookbook-simple) .content-product-card').removeClass("active").removeAttr('style');
				$('.wpbingo-section--lookbook:not(.lookbook-simple) .lookbook-card__btn').removeClass("active");
			}
		}
	});
	$(".wpbingo-section--lookbook:not(.lookbook-simple) .close-lookbook").on( "click", function() {
		if($('.wpbingo-section--lookbook:not(.lookbook-simple) .content-product-card').hasClass("active")){
			$('.wpbingo-section--lookbook:not(.lookbook-simple) .content-product-card').removeClass("active").removeAttr('style');
			$('.wpbingo-section--lookbook:not(.lookbook-simple) .lookbook-card__btn').removeClass("active");
		}
	});
	$(".wpbingo-section--lookbook:not(.lookbook-simple) .lookbook-card__btn").on( "click", function() {
		var $parent = $(this).closest('.wpbingo-section--lookbook:not(.lookbook-simple)');
		var $id = $(this).data("target")
		var x = $(this).offset();
		$('.content-product-card',$parent).removeClass("active").removeAttr('style');
		$('.lookbook-card__btn',$parent).removeClass("active");
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			$("#"+$id+"",$parent).removeClass("active").removeAttr('style');
		}else{
			$(this).addClass("active");
			$("#"+$id+"",$parent).addClass("active").css({"top": x.top, "left": x.left});
		}
	});
	$(".wpbingo-section--lookbook.lookbook-split .wpbingo-lookbook__item").mouseover(function(){
		if(!$(this).hasClass("active")){
			$(".wpbingo-section--lookbook.lookbook-split .wpbingo-lookbook__item").removeClass("active");
			$(this).addClass("active");
			if($('.wpbingo-section--lookbook.lookbook-split .content-product-card').hasClass("active")){
				$('.wpbingo-section--lookbook.lookbook-split .content-product-card').removeClass("active").removeAttr('style');
				$('.wpbingo-section--lookbook.lookbook-split .lookbook-card__btn').removeClass("active");
			}
		}
	});
	$(".wpbingo-section--lookbook.lookbook-simple .lookbook-card__btn").on( "click", function() {
		var $parent = $(this).closest('.wpbingo-section--lookbook.lookbook-simple');
		var $element = $(this).closest('.lookbook__item');
		var $id = $(this).data("target")
		if(!$(this).hasClass("active")){
			$('.content-product-card',$element).removeClass("active");
			$('.lookbook-card__btn',$element).removeClass("active");
			$(this).addClass("active");
			$("#"+$id+"",$parent).addClass("active");
			var slick_current = $("#"+$id+"",$parent).data('slick-index');
			$('.lookbook-product',$element).slick('slickGoTo',slick_current);
		}
	});
}
wpbingo.newsletter = function() {
	var alertNewsletter;
	$('.js-wpbingo-newsletter').each(function() {
		var $form = $(this);
		$form.on('submit', function(event) {
			event.preventDefault();
			$('.js-alert-newsletter').remove();
			$.ajax({
				type: $form.attr('method'),
				url: $form.attr('action'),
				data: $form.serialize(),
				cache: false,
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				success: function(data) {
					if (data.result === 'success') {
						$form.prepend(alertNewsletter(wpbingo.strings.newsletterSuccess ,'success'));
						$('.js-input-newsletter').val('');
					} else {
						$form.prepend(alertNewsletter(data.msg.replace('0 - ', '') ,'danger'));
					}
				},
				error: function(err) {
					$form.prepend(alertNewsletter(err ,'danger'));
				}
			});
		});
	});
	alertNewsletter = function(message, type) {
		var alert = '<div class="js-alert-newsletter alert alert--mailchimp alert-' + type + '">' + message + '</div>';
		return alert;
	};
	var newsletterPopup = '.js-newsletter-popup',
		newsletterPopupClose = '.js-newsletter-popup-close',
		newsletterPopupSubmit = '.js-newsletter-popup-submit',
		cNewsletter = '',
		classNameNewsletterActive = 'newsletter-popup--active';
	if ($(newsletterPopup).find('.js-newsletter-popup-success').length > 0) {
		wpbingo.setCookie('wpbingo_newsletter_popup', 1, 30);
	}
	cNewsletter = wpbingo.getCookie('wpbingo_newsletter_popup');
	if (cNewsletter == 1) $(newsletterPopup).remove();
	if (cNewsletter != 1 && !($('.shopify-challenge__container').length > 0)) {
		setTimeout(function() { $(newsletterPopup).addClass('show');}, 5000);
	}
	$(newsletterPopupClose).on('click', function() {
		if ($(newsletterPopup).find('.alert--mailchimp').length > 0) {
			wpbingo.setCookie('wpbingo_newsletter_popup', 1, 30);
		} else {
			wpbingo.setCookie('wpbingo_newsletter_popup', 1, 1);
		}
		$(newsletterPopup).removeClass('show');
	});
	$(newsletterPopupSubmit).on('click', function() {
		wpbingo.setCookie('wpbingo_newsletter_popup', 1, 30);
	});
};
wpbingo.verify_popup = function() {
	if( $('.js-verify-popup').length ){
		var verify_popup = '';
		if( !verify_popup ){
			$('.js-verify-popup').addClass('active');
		}
		$('.js-verify-popup .button-not-allow').on('click', function() {
			wpbingo.setCookie('wpbingo_verify_popup', 'exit', 1);
			$('.js-verify-popup').addClass('disabled');
			$('.js-verify-popup .verify-info').addClass('hidden');
			$('.js-verify-popup .alert-verify').removeClass('hidden');
			$('body').addClass('not-scroll');
		});
		$('.js-verify-popup .button-allow').on('click', function() {
			wpbingo.setCookie('wpbingo_verify_popup', 'allow', 1);
			$('.js-verify-popup').removeClass('active');
		});
		verify_popup = wpbingo.getCookie('wpbingo_verify_popup');
		if( verify_popup == 'allow' ){
			$('.js-verify-popup').removeClass('active');
		}
		if( verify_popup == 'exit' ){
			$('.js-verify-popup').addClass('disabled');
			$('.js-verify-popup .verify-info').addClass('hidden');
			$('.js-verify-popup .alert-verify').removeClass('hidden');
			$('body').addClass('not-scroll');
		}
	}
};
wpbingo.header_campar = function() {
	var header_campar = '';
	$('.bwp-header-campar .close-campbar').on('click', function() {
		wpbingo.setCookie('wpbingo_header_campar', 1, 1);
		$('.bwp-header-campar').slideUp();
	});
	header_campar = wpbingo.getCookie('wpbingo_header_campar');
	if( header_campar != 1 ){
		$('.bwp-header-campar').removeClass('active');
		$('.bwp-header-campar').slideDown();
	}
};
wpbingo.customNumberInput = function() {
  var $body = $('body'),
    qtyAdjust = '.js-qty-adjust',
    qtyNumber = '.js-qty-number';

  var validateQty;

  $body.on('click', qtyAdjust, function() {
    var $el = $(this),
      $qtySelector = $el.siblings(qtyNumber),
      qty = parseInt($qtySelector.val().replace(/\D/g, ''));

    qty = validateQty(qty);

    if ($el.hasClass('wpbingo-qty__adjust--plus')) {
      qty += 1;
    } else {
      qty -= 1;
      if (qty <= 0) qty = 0;
      if (qty <= 0 && $qtySelector.attr('min') == '1') qty = 1;
    }

    $qtySelector.val(qty);
  });

  $body.on('focus', qtyAdjust, function() {
    var $el = $(this);
    setTimeout(function() {
      $el.select();
    }, 50);
  });

  validateQty = function(qty) {
    if (parseFloat(qty) === parseInt(qty) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      qty = 1;
    }
    return qty;
  };
};
wpbingo.ajaxFilterCategory = function($element) {
	if($element){
		var $categories = $element;
	}else{
		var $categories = $('.js-page-collection .FacetsWrapperDesktop .sidebar-categories');
	}
	if ( $('.wpbingo-breadcrumbs').hasClass('have-collection') ) {
		var $collection = true;
	}
	var wpbingoFilterContentProduct = '.js-collection-content-product',
		wpbingoFilterSidebar = '.collection-sidebar',
		wpbingoFilterTitle = '.wpbingo-breadcrumbs__inner',	
		wpbingoFacetsContainer = '.active-facets-desktop',
		bwpChangeView = '.js-change-view',
		wpbingoFacetsWrapper = '.FacetsWrapperDesktop ';
	$($categories).on('click', 'a', function(e){
		e.preventDefault();
		var pageURL = $(this).attr('href');
		var newTitle = $(this).attr('title');
		History.pushState({
		  param: Shopify.queryParams
		}, pageURL, pageURL);	
		delete Shopify.queryParams.page;
		$("#pre-loading").addClass('load-product');
		$('#pre-loading .pre-loading__bar').css({"width":"40%"});
		$.ajax({
			type: 'get',
			url: pageURL,
			success: function(data) {
				document.title = newTitle;			
				$(wpbingoFilterContentProduct).replaceWith($(data).find(wpbingoFilterContentProduct));
				$(wpbingoFilterSidebar).replaceWith($(data).find(wpbingoFilterSidebar));
				$(wpbingoFilterTitle).replaceWith($(data).find(wpbingoFilterTitle));
				$(wpbingoFacetsContainer).replaceWith($(data).find(wpbingoFacetsContainer));
				$(wpbingoFacetsWrapper).replaceWith($(data).find(wpbingoFacetsWrapper));
				$('.wpbingo-breadcrumbs__image').replaceWith($(data).find('.wpbingo-breadcrumbs__image'));
				if ( $collection ) {
					wpbingo.elementslickCarousel( $('.wpbingo-breadcrumbs__image .js-carousel') );
				}			
				wpbingo.ajaxFilterCategory();
				//ajaxBreadcrumbsCategory( $('.wpbingo-breadcrumbs .bwp_slider-carousel') );
				wpbingo.click_atribute_image();
				wpbingo.popup_product_card();
				wpbingo.zoom_thumb();
				$('.product-card__image-wrapper.slider .js-carousel',wpbingoFilterContentProduct).each(function() {
					wpbingo.elementslickCarousel( $(this) );
				});
				wpbingo.hideLoading();
				if(window.SPR){
					SPR.initRatingHandler ();
					SPR.initDomEls ();
					SPR.loadProducts ();
					SPR.loadBadges ();
				}
				wpbingo.countdown();
				cViewCollection = wpbingo.getCookie('wpbingo_view_collection');
				if(cViewCollection){
					$('#JsCollectionProduct').removeAttr('class');
					$('#JsCollectionProduct').addClass(cViewCollection);
					$(bwpChangeView).removeClass('active');
					$('[data-view='+cViewCollection+']').addClass('active');
				}
				$('.js-page-collection').on('click', bwpChangeView, function(e) {
					e.preventDefault();
					if (!$(this).hasClass('active')) {
						$('.product-card__image-wrapper.slider .js-carousel',wpbingoFilterContentProduct).each(function() {
							$(this).slick('refresh');
						});
						wpbingo.setCookie("wpbingo_view_collection", $(this).data('view'), 1);
						$(bwpChangeView).removeClass('active');
						$(this).addClass('active');
						$('#JsCollectionProduct').removeAttr('class');
						$('#JsCollectionProduct').addClass($(this).data('view'));
					}
				});
				wpbingo.sidebarCollection();
				initButtons();
				initButtonsCompare();
				wpbingo.countActiveSidebar();
				wpbingo.toggleSidebar();
				if(!$('.js-page-collection').hasClass('dropdown') && !$('.js-page-collection').hasClass('on_top')){
					wpbingo.toggleSidebar();
				}
				$('#pre-loading .pre-loading__bar').css({"width":"100%"});
				setTimeout(function() { 
					$('#pre-loading .pre-loading__bar').css({"width":"0"});
					$("#pre-loading").removeClass('load-product');
				}, 500);
			},
			error: function(xhr, text) {
				console.log(text);
			}
		});			
		$('body,html').animate({
			scrollTop: $('.header').height() + $('.wpbingo-breadcrumbs').height()
		}, 600);
	});
};
wpbingo.zoom_thumb = function() {
	if($(".product-card .product-card__image-wrapper").hasClass("zoom")){
		$('.product-card .product-card__image').zoom();
	}
}
wpbingo.sale_nofication = function() {
	if($(".sale-nofication").length){
		var $element 		= $('.sale-nofication');
		var time_start 		= 0;
		var start		 	= $element.data('start');
		var start_unit 		= $element.data('start_unit');
		if(start_unit == 'second'){
			time_start = start*1000;
		}else if(start_unit == 'minute'){
			time_start = start*1000*60;
		}
		$(".close-notification",$element).on( "click", function() {
			if($element.hasClass('active')){
				$element.removeClass('active');
			}
		});
		setTimeout(function(){
			wpbingo.sale_nofication_start(); 
		},time_start);
	}
}
wpbingo.sale_nofication_start = function() {
	if($(".sale-nofication").length){
		var $element 		= $('.sale-nofication');
		var collectionId 	= $element.data('id');
		var array_product 	= $element.data('array_product');
		var limit 			= $element.data('limit') - 1;
		var stay 			= $element.data('stay');
		var stay_unit 		= $element.data('stay_unit');
		var user_purchased 	= window.routes.user_purchased;
		var list_time 		= window.routes.list_time;
		const purchased 	= user_purchased.split('|');
		const time 			= list_time.split('|');
		var time_stay = 0;
		if(stay_unit == 'second'){
			time_stay = stay*1000;
		}else if(stay_unit == 'minute'){
			time_stay = stay*1000*60;
		}
		var array1 = array_product.split('""');
		var item = Math.floor(limit*Math.random());
		var array2 = array1[item].split('"');
		if(item == 0){
			var array = array2[1];
		}else{
			var array = array2[0];
		}
		$.getJSON('/products/' + array + '.js', function(product) {
			$("#image",$element).attr("src",product.featured_image);
			$("a",$element).attr("href","/products/"+product.handle);
			$('.product-title a',$element).text(product.title);
			$('.notification-purchased .name',$element).text(purchased[item]);
			$('.time-suggest',$element).text(time[item]);
			$element.addClass('active');
		});
		$(".scroll-notification",$element).css("animation-duration", stay+"s");
		setTimeout(function(){
			$element.removeClass('active');
			wpbingo.sale_nofication();
		}, time_stay );
	}
}
wpbingo.discount_single = function() {
	if( $(".product-single #buy_more_form").length > 0 ){
		var $parent = $(".product-single #buy_more_form"),
			count = $(".buy_more",$parent).data('quatily'),
			id_product = $("input[name='items[][id]']",$parent).attr('value');
		var params = {
			type: 'POST',
			url: '/cart.js',
			processData: false,
			contentType: false,
			dataType: 'json',
			success: function(cart) {
				if( cart.items.length == 0 ){
					$('.buy-more-cart',$parent).removeClass('disabled');
				}else{
					for (var item in cart.items) {
						var variant = cart.items[item],
							variant_id = variant.variant_id;
						if( variant_id == id_product ){
							if( variant.quantity >= count ){
								$('.buy-more-cart',$parent).addClass('disabled');
								$('.buy-more-cart',$parent).prop('disabled', true);
							}else{
								$('.buy-more-cart',$parent).removeClass('disabled');
								$('.buy-more-cart',$parent).prop('disabled', false);
							}
							break;
						}else{
							$('.buy-more-cart',$parent).removeClass('disabled');
							$('.buy-more-cart',$parent).prop('disabled', false);
						}
					}
				}
			},
			error: function(XMLHttpRequest, textStatus) {
				if (typeof errorCallback === 'function') {
					errorCallback(XMLHttpRequest, textStatus);
				} else {
					ShopifyAPI.onError(XMLHttpRequest, textStatus);
				}
			}
		};
		jQuery.ajax(params);
	}
}
wpbingo.pick_up = function(id) {
	if( $(".product-single .product-single__pick_up").length > 0 ){
		var $element = $('.product-single .product-single__pick_up'),
			title = $element.data('product_title'),
			image_url = $element.data('src');
		if(id == null){
			var id = $element.data('id');
		}
		fetch(window.Shopify.routes.root + "variants/"+id+"/?section_id=pickup-availability").then(response => response.text()).then(text => {
			const container = document.querySelector('[data-store-availability-container]');
			const pickupAvailabilityHTML = new DOMParser().parseFromString(text, 'text/html').querySelector('.shopify-section');
			container.appendChild(pickupAvailabilityHTML);
			$(".content-info .title",$element).html(title);
			if($element.data('only_variant') == true){
				$(".product-info .content-image img",$element).attr('src',image_url);
			}
			$(".pickup-availability-information",$element).on( "click", function() {
				if(!$(".pickup-availabilities-modal",$element).hasClass('active')){
					$(".pickup-availabilities-modal",$element).addClass('active');
				}
			});
			$(".pickup_modal-close",$element).on( "click", function() {
				if($(".pickup-availabilities-modal",$element).hasClass('active')){
					$(".pickup-availabilities-modal",$element).removeClass('active');
				}
			});
		})
		.catch(e => {
			console.error(e);
		});
	}
}
wpbingo.time_estimated_delivery = function() {
	if( $(".product-single .estimated_delivery").length > 0 ){
		var code_time =  window.routes.iso_code;
		var $element			= $( ".product-single .estimated_delivery" );
		var datenow_preorder 	= $( ".product-single .estimated_delivery" ).data('date_now')
		if(datenow_preorder){
			var datenow 		= new Date(datenow_preorder).getTime();
		}else{
			var datenow 		= Date.now();
		}
		var date 				= new Date,
			day 				= 24*60*60*1000,
			day_ship 			= $($element ).data('number_day');
		var day_start 			= new Date(day_ship*day + datenow);
		var day_stop 			= new Date((day_ship + 4)*day + datenow);
		var day_start 			= day_start.toLocaleDateString(code_time, { weekday:"long", month:"short", day:"numeric"});
		var day_stop 			= day_stop.toLocaleDateString(code_time, { weekday:"long", month:"short", day:"numeric"});
		var date_time 			= ((date.getHours()*60 + date.getMinutes())*60 + date.getSeconds())*1000,
			time_sec			= (day - date_time)/1000,
			time_left_m			= ((time_sec - (time_sec % 60))/60) % 60,
			time_left_h			= (((time_sec - (time_sec % 60))/60) - time_left_m % 60)/60;
		$("span.time_hour",$element).html(time_left_h);
		$("span.time_min",$element).html(time_left_m);
		$("span.day_start",$element).html(day_start);
		$("span.day_stop",$element).html(day_stop);
	}
}
wpbingo.countActiveSidebar = function() {
	var count = 0;
	if($('.js-page-collection').hasClass('dropdown') || $('.js-page-collection').hasClass('on_top') ){
		var $parent_collection = $('.js-page-collection .FacetsWrapperDesktop')
	}else{
		var $parent_collection = $('.js-page-collection .collection-sidebar')
	}
	$('.js-filter',$parent_collection).each(function(){
		count = $('input:checked',$(this)).length;
		if(count > 0){
			$('.block-sidebar__title .count',$(this)).removeClass('hide');
			$('.facets__display .reset-filter',$(this)).removeClass('hide');
			$('.block-sidebar__title .count',$(this)).text(count);
		}else{
			$('.block-sidebar__title .count',$(this)).addClass('hide');
		}
		if($(this).hasClass('show')){
			if( $('h4.block-sidebar__title',$(this)).hasClass('active') ){
				$('h4.block-sidebar__title',$(this)).removeClass("active");
			}else{
				$('h4.block-sidebar__title',$(this)).addClass("active");
			}
		}
	});
	var count_sidebar = $('.js-page-collection.dropdown .sidebar-categories ul li.active').length;
	if(count_sidebar > 0){
		$('.js-page-collection.dropdown .sidebar-categories .block-sidebar__title .count').removeClass('hide');
	}else{
		$('.js-page-collection.dropdown .sidebar-categories .block-sidebar__title .count').addClass('hide');
	}
	$('.collection-sidebar .js-filter .facets__display .select-filter label').on( "click", function() {
		$('.collection-sidebar .js-filter').removeClass('show');
		var $parent = $(this).closest('.js-filter');
		$parent.addClass('show');
	});
	$('.collection-sidebar .js-filter .facets__display .facets__price input').change(function(){
		$('.collection-sidebar .js-filter').removeClass('show');
		var $parent = $(this).closest('.js-filter');
		$parent.addClass('show');
	});
	$('.js-page-collection.on_top .js-filter .facets__display li label').on( "click", function() {
		var $parent = $(this).closest('.js-page-collection.on_top ');
		if(!$parent.hasClass('show')){
			$parent.addClass('show');
		}
	});
	$('.js-page-collection.on_top .js-filter .facets__display .facets__price input').change(function(){
		var $parent = $(this).closest('.js-page-collection.on_top ');
		if(!$parent.hasClass('show')){
			$parent.addClass('show');
		}
	});
};
wpbingo.toggleSidebar = function($element) {
	$('.js-page-collection:not(.sidebar_4,.on_top) h4.block-sidebar__title').on( "click", function() {
		if($('.js-page-collection').hasClass('dropdown')){
			if( !$(this).hasClass('active') ){
				$('.js-page-collection.dropdown .facets__display').slideUp();
				$('.js-page-collection.dropdown h4.block-sidebar__title').removeClass("active");
			}
		}
		if($element){
			if($('.js-page-collection').hasClass('dropdown')){
				var $parent = $(this).closest('.js-filter');
			}else{
				var $parent = $(this).closest('.js-filter:not(.sidebar-categories)');
			}
		}else{
			var $parent = $(this).closest('.js-filter');
		}
		if( $('h4.block-sidebar__title',$parent).hasClass('active') ){
			$('h4.block-sidebar__title',$parent).removeClass("active");
		}else{
			$('h4.block-sidebar__title',$parent).addClass("active");
		}
		$('.facets__display',$parent).slideToggle();
	});
	if ($(window).width() > 991) {
		$('.js-page-collection.on_top .js-sidebar-toggle').on( "click", function() {
			$(this).toggleClass('active');
			$('.js-page-collection.on_top .dropdown_ontop').slideToggle();
			if($('.js-page-collection.on_top').hasClass('show')){
				$('.js-page-collection.on_top').removeClass('show');
			}
		});
        $('.js-page-collection .collection-sidebar__overlay').on( "click", function() {
    		if($('body').hasClass('collection-sidebar--open')){
    			$('.js-page-collection.on_top .dropdown_ontop').slideUp();
    			if($('.js-page-collection').hasClass('on_top')){
    				setTimeout(function(){
    					$('body').removeClass('collection-sidebar--open');
    					if($('.js-page-collection.on_top').hasClass('show')){
    						$('.js-page-collection.on_top').removeClass('show');
    					}
    				}, 600);
    			}else{
    				$('body').removeClass('collection-sidebar--open');
    			}
    		}
    	});
	}else{
        if(!$element){
          $('.js-page-collection.on_top .collection-sidebar__overlay').on( "click", function() {
      		if($('body').hasClass('collection-sidebar--open')){
                  $('body').removeClass('collection-sidebar--open');
              }else{
                  $('body').addClass('collection-sidebar--open');
              }
      	});
        }
    }
	if($('.js-page-collection').hasClass('viewmore')){
		var number_list = $('.js-page-collection').data('list_number');
		if( $('.js-page-collection').hasClass('filter_drawer') ){
			if($element){
				if($('.js-page-collection').hasClass('on_top')){
					var list = $('.filter-list');
				}else{
					var list = $('.filter-list:not(.sidebar-categories)');
				}
			}else{
				var list = $('.filter-list');
			}
		}else if($('.js-page-collection').hasClass('side_out')){
			if($element){
				var list = $('.js-filter:not(.sidebar-categories,.filter-color,.js-filter-price,.filter-image)');
			}else{
				var list = $('.js-filter:not(.filter-color,.js-filter-price,.filter-image)');
			}
		}else if($('.js-page-collection').hasClass('sidebar_1')){
			if($element){
				var list = $('.js-filter:not(.sidebar-categories,.filter-color,.js-filter-price,.filter-image)');
			}else{
				var list = $('.js-filter:not(.filter-color,.js-filter-price,.filter-image)');
			}
		}else if($('.js-page-collection').hasClass('sidebar_2')){
			if($element){
				var list = $('.js-filter:not(.sidebar-categories,.filter-color,.js-filter-price,.filter-image)');
			}else{
				var list = $('.js-filter:not(.filter-color,.js-filter-price,.filter-image)');
			}
		}else if($('.js-page-collection').hasClass('sidebar_3')){
			if($element){
				var list = $('.js-filter:not(.sidebar-categories,.js-filter-price,.filter-image,.filter-label)');
			}else{
				var list = $('.js-filter:not(.js-filter-price,.filter-image,.filter-label)');
			}
		}else if($('.js-page-collection').hasClass('sidebar_4')){
			if($element){
				var list = $('.filter-list:not(.sidebar-categories,.filter-out_stock)');
			}else{
				var list = $('.filter-list:not(.filter-out_stock)');
			}
		}else if($('.js-page-collection').hasClass('dropdown') || $('.js-page-collection').hasClass('on_top')){
			var list = $('.js-filter:not(.filter-image)');
		}
		$(list).each(function(){
			var count_sidebar_1 = $('.facets__display>ul>li',$(this)).length;
			if(!$('.facets__display>ul>li.view',$(this)).length){
				if( count_sidebar_1 > number_list ){
					$('.facets__display>ul',$(this)).append('<li class="view"><span>'+window.strings.view_more+'</span></li>');
				}
			}
			$('.facets__display>ul>li:not(.view)',$(this)).each(function(index){
				if( index + 1 > number_list ){
					$(this).css("display","none");
				}	
			});
		});
		$('.facets__display>ul>li.view',list).on( "click", function() {
			var $parent = $(this).closest('ul');
			$('>li:not(.view)',$parent).each(function(index){
				if( index + 1 > number_list ){
					$(this).slideToggle();
				}
			});
			if($(this).hasClass('show')){
				$(this).removeClass('show');
				$('span',$(this)).text(window.strings.view_more);
				return;
			}else{
				$(this).addClass('show');
				$('span',$(this)).text(window.strings.view_less);
				return;
			}
		});
	}
};
wpbingo.sidebarCollection = function($element) {
	if($element){
		var $parent = $('.js-page-collection .FacetsWrapperDesktop');
	}else{
		var $parent = $('.js-page-collection');
	}
	$(".sidebar-categories ul li a",$parent).on( "click", function() {
		var $parent = $(this).closest('li');
		$(".sidebar-categories ul li").removeClass("active");
		if( !$parent.hasClass('active') ){
			$parent.addClass("active");
		}
	});
	$(".sidebar-categories .toggle_collection-children",$parent).on( "click", function() {
		var $parent = $(this).closest('li');
		$(this).toggleClass("show");
		$('>.collection-children',$parent).slideToggle();
	});
	$('.sidebar-categories .collection-children li',$parent).each(function(){
		if( $(this).hasClass('active') ){
			var $parent = $(this).parents('.collection-children');
			var $parent2 = $(this).parents('li');
			$parent.css({"display": "block"});
			if( !$('>.link-collection >.toggle_collection-children',$parent2).hasClass('show') ){
				$('>.link-collection >.toggle_collection-children',$parent2).addClass("show");
			}
		}
	});
};
wpbingo.gift_wrap = (function() {
	var selectors = {
		body: 'body',
		GiftCard: '[data-gift-card]',
		giftWrapTemplate: '#gift-card-template',
		giftWrapBtn: '.gift-wrap [data-gift_card]',
		giftCardContainer: '[data-gift-card-container]',
		giftCardClose: '[data-gift-card-close]',
		giftCardImages: '[data-gift-card-images]',
		giftCardVariant: '.js-giftcard-option-selector',
		originalSelectorId: '[data-edit_variant-variant]',
		giftCardProductPrice: '.js-gift-product-price',
		giftCardProductPriceCompare: '.js-gift-product-price-compare',
		giftCardQty: '[data-gift-card-quantity]',
		giftCardAvaiable: '.product-avaiable',
		giftCardAvaiableInStock: '.product-avaiable--instock',
		giftCardAvaiableOutStock: '.product-avaiable--outstock',
		giftCardProductDetailsURL: '.js-qv-product-details'
	};
	function GiftCard(container) {
		this.$container = $(container);
		this.cache = {};
		this.productVariants = [];
		this.currentVariant = {};
		this.cacheSelectors();
		this.initializeEvents();
	}
	GiftCard.prototype = _.assignIn({}, GiftCard.prototype, {
		cacheSelectors: function() {
			this.cache = {
				$body: $('body'),
				$giftCardContainer: this.$container.find(selectors.giftCardContainer)
			};
		},

		initializeEvents: function() {
			var $this = this;
			$(selectors.body).on('click', selectors.giftWrapBtn, function(e) {
				e.preventDefault();
				var productHandle = $(this).data('gift_card');
				$(this).addClass('load-giftcard');
				$.getJSON('/products/' + productHandle + '.js', function(product) {
					if (product.available) {
					$this.firstAvailableVariant(product.variants, $this);
					} else {
						$this.currentVariant = product.variants[0];
					}
					$(selectors.giftWrapBtn).removeClass('load-giftcard');
					$this.buildGiftCard(product);
					$this.show();
					$this.createImageCarousel(product);
				});
			});
			$(selectors.body).on('click', selectors.giftCardClose, function(e) {
				e.preventDefault();
				$this.hide();
			});
			$(selectors.giftCardContainer).on('change', selectors.giftCardVariant, function(e) {
				$this.onVariantChange();
			});
		},

		firstAvailableVariant: function(variants, global) {
			global.productVariants = variants;
			for (var i = 0; i < variants.length; i++) {
				var variant = variants[i];
				if (variant.available) {
					global.currentVariant = variant;
					break;
				}
			}
		},
		buildGiftCard: function(product) {
			var moneyFormat = wpbingo.strings.moneyFormat;
			var currentVariant = this.currentVariant;
			var source = $(selectors.giftWrapTemplate).html();
			var template = Handlebars.compile(source);
			var images = '';
			var price = '';
			var external='';
			var qvObject = {
				id: product.id
			};
			if (typeof product.media !== 'undefined') {
				images += '<div class="gift_card-images__list slick-carousel" data-gift-card-images>'
				for (var i = 0; i < product.media.length; i++) {
					var media = product.media[i];
					if (media.media_type === 'image') {
						images += '<div class="slick-carousel__item"><div class="giftcard-images__item" data-media-id=' +
							media.id + '><img class="img-fluid" alt="' +
							product.title + '" src="' +
							media.src + '" /></div></div>';
					}
				}
				images += '</div>'
			}			
			qvObject.variantID = currentVariant.id;
			qvObject.sku = currentVariant.sku !== null && currentVariant.sku !== '' ? currentVariant.sku : 'N/A';
			qvObject.images = images;
			qvObject.title = product.title;
			qvObject.url = product.url;
			price += '<div class="price-container">';
			var productCompareClass = product.compare_at_price !== null ? '' : 'd-none';
			price += '<div class="js-gift-product-price-compare product-single__price--compare-at ' + productCompareClass + '">' + wpbingo.Currency.formatMoney(product.compare_at_price, moneyFormat) + '</div>';
			price += '<div class="js-gift-product-price product-single__price">' + wpbingo.Currency.formatMoney(product.price, moneyFormat) + '</div>';
			price += '</div">';
			qvObject.price = price;
			qvObject.variants = this.buildVariant(product);
			$(selectors.giftCardContainer).html(template(qvObject));
			// AFTER BUILD HTML
			this.updateMedia(currentVariant);
			this.updateDetailsLink(currentVariant);
			$('#form-gift-card-addtocart .btn--add-to-cart').on('click',function(e){
				e.preventDefault();
				$(this).removeClass('added');
				$(this).addClass('active');
				let addToCartForm = document.querySelector('#form-gift-card-addtocart');
				let formData = new FormData(addToCartForm);
				var params = {
					type: 'POST',
					url: '/cart/add.js',
					data: formData,
					processData: false,
					contentType: false,
					dataType: 'json',
					success: function(line_item) {
						$('#form-gift-card-addtocart .btn--add-to-cart').removeClass('active');
						$('#form-gift-card-addtocart .btn--add-to-cart').addClass('added');
						setTimeout(function() {
							$('#form-gift-card-addtocart .btn--add-to-cart').removeClass('added');
						}, 3000);
						ajaxCart.load();
						ajaxCartPage.load();
					},
					error: function(XMLHttpRequest, textStatus) {
						if (typeof errorCallback === 'function') {
							errorCallback(XMLHttpRequest, textStatus);
						} else {
							ShopifyAPI.onError(XMLHttpRequest, textStatus);
						}
					}
				};
				jQuery.ajax(params);
			});
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		},
		convertToSlug: function(str) {
			return str.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
		},
		buildVariant: function(product) {
			var result = '';
			var currentVariant = this.currentVariant;
			if (product.options[0].name !== 'Title') {
				var options = product.options;
				for (var i = 0; i < options.length; i ++) {
					var option = options[i];
					var optionIndex = i + 1;
					result += '<div class="variants-wrapper product-form__item" data-giftcard-variant-option="' + optionIndex + '">';
					result += '<label class="variants__label">' + option.name + '</label>';
					result += '<div class="variants__options">';
					for (var j = 0; j < option.values.length; j ++) {
						var value = option.values[j];
						var isDisable = true;
						var colorAttribute = '';
						// CHECK Product option is available or disabled
						for (var k = 0; k < this.productVariants.length; k ++) {
							var variantCondition = this.productVariants[k];
							if (variantCondition.available) {
								if (i == 0 && variantCondition.option1 === value) {
									isDisable = false;
									break;
								} else if (i == 1 && variantCondition.option2 === value && variantCondition.option1 == currentVariant.option1) {
									isDisable = false;
									break;
								} else if (i == 2 && variantCondition.option3 === value && variantCondition.option2 == currentVariant.option2 && variantCondition.option1 == currentVariant.option1) {
									isDisable = false;
									break;
								}
							}
						}
						// RENDER Product option button
						result += '<div class="single-option-selector">';
						result += '<input type="radio" data-single-option-button';
						result += currentVariant.options[i] === value ? ' checked ' : ' ';
						if (isDisable) {
							result += 'disabled="disabled"';
						}
						result += 'value="' + _.escape(value) + '" data-index="option' + optionIndex + '" name="option' + option.position + '" ';
						result += 'class="js-giftcard-option-selector';
						if (isDisable) {
							result += ' disabled';
						}
						result += '" id="giftcard-product-option-' + i + '-' + value.toLowerCase() + '">';
						result += '<label data-toggle="tooltip" title="' + value + '" for="giftcard-product-option-' + i + '-' + value.toLowerCase() + '" ' + colorAttribute;
						if (isDisable) {
							result += ' class="disabled"';
						}
						result += '>' + value + '<span class="d-none"></span></label>';
						result += '</div>';
					}
					result += '</div>';
					result += '</div>';
				}
			}
			return result;
		},
		createImageCarousel: function(product) {
			if(product.media.length > 1){
				$(selectors.GiftCard).find(selectors.giftCardImages).slick({
					infinite: false,
					rows: 0,
					arrows: false,
					rtl : wpbingo.rtl_slick()
				});
			}
		},
		getCurrentOptions: function() {
			var currentOptions = _.map(
				$(selectors.giftCardVariant, selectors.giftCardContainer), function(element) {
					var $element = $(element);
					var type = $element.attr('type');
					var currentOption = {};
					if (type === 'radio' || type === 'checkbox') {
						if ($element[0].checked) {
							currentOption.value = $element.val();
							currentOption.index = $element.data('index');
							return currentOption;
						} else {
							return false;
						}
					} else {
						currentOption.value = $element.val();
						currentOption.index = $element.data('index');
						return currentOption;
					}
				}
			);
			currentOptions = _.compact(currentOptions);
			return currentOptions;
		},
		getVariantFromOptions: function() {
			var selectedValues = this.getCurrentOptions();
			var variants = this.productVariants;
			var found = _.find(variants, function(variant) {
				return selectedValues.every(function(values) {
					return _.isEqual(variant[values.index], values.value);
				});
			});
			return found;
		},
		updateVariantsButton: function () {
			var selectedValues = this.getCurrentOptions();
			var variants = this.productVariants;
			for (var i = 2; i <= 3; i++) {
				if ($('[data-giftcard-variant-option="' + i + '"]', selectors.giftCardContainer).length) {
					$('[data-giftcard-variant-option="' + i + '"] ' + selectors.giftCardVariant, selectors.giftCardContainer).each(function() {
						var $self = $(this);
						var optionValue = $self.val();
						var foundIndex;
						if (i === 2) {
							foundIndex = _.findIndex(variants, function(variant) {
								variant.option1 = variant.option1.toString();
								selectedValues[0].value = selectedValues[0].value.toString();
								variant.option2 = variant.option2.toString();
								optionValue = optionValue.toString();
								return variant.option1 === selectedValues[0].value &&
								variant.option2 === optionValue &&
								variant.available === true;
							});
							
						} else if (i === 3) {
							foundIndex = _.findIndex(variants, function(variant) {
								variant.option1 = variant.option1.toString();
								variant.option2 = variant.option2.toString();
								variant.option3 = variant.option3.toString();
								selectedValues[0].value = selectedValues[0].value.toString();
								selectedValues[1].value = selectedValues[1].value.toString();
								optionValue = optionValue.toString();
								return variant.option1 === selectedValues[0].value && variant.option2 === selectedValues[1].value &&
								variant.option3 === optionValue &&
								variant.available === true;
							});
						}
						if (foundIndex !== -1) {
							$self.removeAttr('disabled', 'disabled').removeClass('disabled');
							$self.next('label').removeClass('disabled');
						} else {
							$self.attr('disabled', 'disabled').addClass('disabled');
							$self.next('label').addClass('disabled');
						}
					});
				}
			}
		},
		updateVariantsButtonDisabed: function() {
			for (var i = 2; i <= 3; i++) {
				if ($('[data-giftcard-variant-option="' + i + '"]', selectors.giftCardContainer).length) {
					var isUpdate = false;
					$('[data-giftcard-variant-option="' + i + '"] ' + selectors.giftCardVariant, selectors.giftCardContainer).each(function() {
						var $element = $(this);
						var type = $element.attr('type');
						if (type === 'radio' || type === 'checkbox') {
							if (this.checked && $element.hasClass('disabled')) {
								$element.prop('checked', false);
								isUpdate = true;
								return false;
							}
						}
					});
					$('[data-giftcard-variant-option="' + i + '"] ' + selectors.giftCardVariant, selectors.giftCardContainer).each(function() {
						var $element = $(this);
						var type = $element.attr('type');
						if (isUpdate && (type === 'radio' || type === 'checkbox') && !$element.hasClass('disabled')) {
							$element.prop('checked', true);
							isUpdate = false;
							$element.trigger('change');
							return false;
						}
					});
				}
			}
		},
		updateMasterSelect: function(variant) {
			if (variant) {
				$(selectors.originalSelectorId, selectors.giftCardContainer).val(variant.id);
			}
		},
		updateMedia: function(variant) {
			if (variant && variant.featured_media && variant.featured_media.id) {
				$(selectors.giftCardImages, selectors.giftCardContainer).find('.giftcard-images__item').each(function() {
					var imageID = $(this).data('media-id');
					if (variant.featured_media.id == imageID) {
						var slickIndex = $(this).closest('.slick-carousel__item').data('slick-index');
						if (slickIndex !== undefined && slickIndex !== null) {
							$(selectors.giftCardImages, selectors.giftCardContainer).slick('slickGoTo', slickIndex);
						}
					}
				});
			}
		},

		updatePrice: function(variant) {
			var moneyFormat = wpbingo.strings.moneyFormat;
			if (!variant) {
				$(selectors.giftCardProductPrice, selectors.giftCardContainer).addClass('d-none');
				$(selectors.giftCardProductPriceCompare, selectors.giftCardContainer).addClass('d-none');
			} else {
				$(selectors.giftCardProductPrice, selectors.giftCardContainer).removeClass('d-none');
				$(selectors.giftCardProductPriceCompare, selectors.giftCardContainer).removeClass('d-none');
				$(selectors.giftCardProductPrice, selectors.giftCardContainer).html(
					wpbingo.Currency.formatMoney(variant.price, moneyFormat)
				);
				if (variant.compare_at_price > variant.price) {
					$(selectors.giftCardProductPriceCompare, selectors.giftCardContainer).html(
						wpbingo.Currency.formatMoney(variant.compare_at_price, moneyFormat)
					).removeClass('d-none');
					$(selectors.giftCardProductPrice, selectors.giftCardContainer).addClass('on-sale');
				} else {
					$(selectors.giftCardProductPriceCompare, selectors.giftCardContainer).addClass('d-none');
					$(selectors.giftCardProductPrice, selectors.giftCardContainer).removeClass('on-sale');
				}
			}
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		},

		updateProductAvaiable: function(variant) {
			var classActive = 'product-avaiable--active';
			var translations = wpbingo.strings;
			$(selectors.giftCardAvaiable, selectors.giftCardContainer).removeClass(classActive);
			if (variant) {
				if (variant.available) {
					$(selectors.giftCardQty, selectors.giftCardContainer).removeClass('d-none');
					$(selectors.giftCardAvaiableInStock, selectors.giftCardContainer).addClass(classActive);
				} else {
					$(selectors.giftCardQty, selectors.giftCardContainer).addClass('d-none');
					$(selectors.giftCardAvaiableOutStock, selectors.giftCardContainer).addClass(classActive);
				}
				// Button add to cart
				if (variant.available) {
					$(selectors.giftCardContainer).find('.btn--add-to-cart')
						.removeClass('disabled')
						.prop('disabled', false);
					$(selectors.giftCardContainer).find('.btn--add-to-cart .btn__text').html(translations.addToCart);
				} else {
					$(selectors.giftCardContainer).find('.btn--add-to-cart')
						.addClass('disabled')
						.prop('disabled', true);
					$(selectors.giftCardContainer).find('.btn--add-to-cart .btn__text').html(translations.soldOut);
				}
			} else {
				$(selectors.giftCardQty, selectors.giftCardContainer).addClass('d-none');
				$(selectors.giftCardContainer).find('.btn--add-to-cart')
					.addClass('disabled')
					.prop('disabled', true);
				$(selectors.giftCardContainer).find('.btn--add-to-cart .btn__text').html(translations.unavailable);
			}
		},

		updateDetailsLink: function(variant) {
			if (variant) {
				var productURL = $(selectors.giftCardProductDetailsURL, selectors.giftCardContainer).data('url') + '?variant=' + variant.id;
				$(selectors.giftCardProductDetailsURL, selectors.giftCardContainer).removeClass('d-none').attr('href', productURL);
			} else {
				$(selectors.giftCardProductDetailsURL, selectors.giftCardContainer).addClass('d-none');
			}
		},

		onVariantChange: function() {
			var variant = this.getVariantFromOptions();
			if ($('[data-single-option-button]', selectors.giftCardContainer).length) {
				this.updateVariantsButton();
				if (!variant || !variant.available) {
					this.updateVariantsButtonDisabed();
					return;
				}
			}
			this.updateMasterSelect(variant);
			this.updateMedia(variant);
			this.updatePrice(variant);
			this.updateProductAvaiable(variant);
			this.updateDetailsLink(variant);
			this.currentVariant = variant;
		},
		show: function() {
			$(selectors.body).addClass('giftcard-active');
			$(selectors.GiftCard).addClass('show');
			setTimeout(function(){
				$('.gift_card-container .gift_card__content').addClass('show');
			}, 400);
		},
		hide: function() {
			$(selectors.giftCardContainer).html();
			$(selectors.body).removeClass('giftcard-active');
			$('.gift_card-container .gift_card__content').removeClass('show');
			setTimeout(function(){
				$(selectors.GiftCard).removeClass('show');
			}, 400);
		}
	});
	return GiftCard;
})();
wpbingo.update_variant_cartpage = (function() {
	var selectors = {
		body: 'body',
		EditVariant: '[data-edit_variant-cart]',
		EditVariantTemplate: '#edit_variants-template',
		EditVariantBtn: '.cart-product-edit_variant',
		EditVariantContainer: '[data-edit_variant-cart-container]',
		EditVariantClose: '[data-edit_variant-cart-close]',
		EditVariantImages: '[data-edit_variant-images]',
		EditVariantVariant: '.js-edit_variant-option-selector',
		originalSelectorId: '[data-edit_variant-variant]',
		EditVariantProductPrice: '.js-edit_variant-product-price',
		EditVariantProductPriceCompare: '.js-edit_variant-product-price-compare',
		EditVariantQty: '[data-edit_variant-quantity]',
		EditVariantAvaiable: '.product-avaiable',
		EditVariantAvaiableInStock: '.product-avaiable--instock',
		EditVariantAvaiableOutStock: '.product-avaiable--outstock',
		EditVariantDetailsURL: '.js-qv-product-details'
	};
	function EditVariant(container) {
		this.$container = $(container);
		this.cache = {};
		this.productVariants = [];
		this.currentVariant = {};
		this.cacheSelectors();
		this.initializeEvents();
	}
	EditVariant.prototype = _.assignIn({}, EditVariant.prototype, {
		cacheSelectors: function() {
			this.cache = {
				$body: $('body'),
				$EditVariantContainer: this.$container.find(selectors.EditVariantContainer)
			};
		},

		initializeEvents: function() {
			var $this = this;
			$(selectors.body).on('click', selectors.EditVariantBtn, function(e) {
				e.preventDefault();
				var productHandle = $(this).data('handle');
				var qty = $(this).data('value');
				var line = $(this).data('line');
				var id_variant = $(this).data('id_variant');
				var $parent = $(this).closest('.content-edit_variant-popup');
				$(this).addClass('load-edit_variant');
				$('.image-popup',$parent).addClass('imagepopup_active');
				$('body').addClass('editv_overlay-layer');
				$.getJSON('/products/' + productHandle + '.js', function(product) {
					if (product.available) {
					$this.firstAvailableVariant(product.variants, $this);
					} else {
						$this.currentVariant = product.variants[0];
					}
					$(selectors.EditVariantBtn).removeClass('load-edit_variant');
					$this.buildEditVariant(product,qty,line,id_variant);
					var $element = $('.edit_variant-cart-container .content_product_detail .variants-wrapper')
					$($element).each(function() {
						var $this = $(this);
						var value = $('input:checked',$this).attr('value');
						$('.variants__label span',$this).html(value);
					});
					$(selectors.EditVariantContainer).on('change', selectors.EditVariantVariant, function(e) {
						$this.onVariantChange(id_variant);
					});
					if ($(window).width() < 767) {
						$(selectors.EditVariant).addClass('transform');
					}else{
						$(selectors.EditVariant).addClass('transform');
					}
				});
			});
			$(selectors.body).on('click', selectors.EditVariantClose, function(e) {
				if ($(window).width() < 767) {
					$(selectors.EditVariant).removeClass('transform');
					$('body').removeClass('editv_overlay-layer');
					setTimeout(function() {
						$('[data-edit_variant-cart-container]').empty();
					},300);
				}else{
					$(selectors.EditVariant).removeClass('transform');
					setTimeout(function() { 
						$('body').removeClass('editv_overlay-layer');
						$('[data-edit_variant-cart-container]').empty();
					},300);
				}
			});
			$(selectors.body).on('click', function(e) {
				if( $(e.target).is('body.editv_overlay-layer')) {
					if ($(window).width() < 767) {
						$(selectors.EditVariant).removeClass('transform');
						$('body').removeClass('editv_overlay-layer');
						setTimeout(function() {
							$('[data-edit_variant-cart-container]').empty();
						},300);
					}else{
						$(selectors.EditVariant).removeClass('transform');
						setTimeout(function() { 
							$('body').removeClass('editv_overlay-layer');
							$('[data-edit_variant-cart-container]').empty();
						},300);
					}
				}
			});
		},

		firstAvailableVariant: function(variants, global) {
			global.productVariants = variants;
			for (var i = 0; i < variants.length; i++) {
				var variant = variants[i];
				if (variant.available) {
					global.currentVariant = variant;
					break;
				}
			}
		},
		buildEditVariant: function(product,qty,line,id_variant) {
			var moneyFormat = wpbingo.strings.moneyFormat;
			var currentVariant = this.currentVariant;
			for (var key in product.variants) {
				if (id_variant == product.variants[key].id) {
					var currentVariant = product.variants[key];
				}
			}
			var source = $(selectors.EditVariantTemplate).html();
			var template = Handlebars.compile(source);
			var images = '';
			var price = '';
			var external='';
			var qvObject = {
				id: product.id
			};
			if (typeof product.media !== 'undefined') {
				images += '<div class="edit_variant-images__list slick-carousel" data-edit_variant-images>'
				for (var i = 0; i < product.media.length; i++) {
					var media = product.media[i];
					if (media.media_type === 'image') {
						if ( i == 0 ) {
							images += '<div class="slick-carousel__item show"><div class="edit_variant-images__item" data-media-id=' +
								media.id + '><img class="img-fluid" alt="' +
								product.title + '" src="' +
								media.src + '" /></div></div>';
						}else{
							images += '<div class="slick-carousel__item"><div class="edit_variant-images__item" data-media-id=' +
								media.id + '><img class="img-fluid" alt="' +
								product.title + '" src="' +
								media.src + '" /></div></div>';
						}
					}
				}
				images += '</div>'
			}			
			qvObject.variantID = currentVariant.id;
			qvObject.sku = currentVariant.sku !== null && currentVariant.sku !== '' ? currentVariant.sku : 'N/A';
			qvObject.images = images;
			qvObject.title = product.title;
			qvObject.qty = qty;
			qvObject.line = line;
			qvObject.url = product.url;
			price += '<div class="price-container">';
			var productCompareClass = product.compare_at_price !== null ? '' : 'd-none';
			price += '<div class="js-edit_variant-product-price-compare product-single__price--compare-at ' + productCompareClass + '">' + wpbingo.Currency.formatMoney(product.compare_at_price, moneyFormat) + '</div>';
			price += '<div class="js-edit_variant-product-price product-single__price">' + wpbingo.Currency.formatMoney(product.price, moneyFormat) + '</div>';
			price += '</div">';
			qvObject.price = price;
			qvObject.variants = this.buildVariant(product,id_variant);
			$(selectors.EditVariantContainer).html(template(qvObject));
			// AFTER BUILD HTML
			this.updateMedia(currentVariant);
			this.updateDetailsLink(currentVariant);
			$('#form-edit_variants-addtocart .btn--add-to-cart').on('click',function(e){
				e.preventDefault();
				var $parent = $(this).closest('.product-edit_variants');
				$(this).removeClass('added');
				$(this).addClass('active');
				let addToCartForm = document.querySelector('#form-edit_variants-addtocart');
				let formData = new FormData(addToCartForm);
				var params = {
					type: 'POST',
					url: '/cart/add.js',
					data: formData,
					processData: false,
					contentType: false,
					dataType: 'json',
					success: function(cart) {
						var line = $parent.data('line') + 1;
						$('#form-edit_variants-addtocart .btn--add-to-cart').removeClass('active');
						$('#form-edit_variants-addtocart .btn--add-to-cart').addClass('added');
						setTimeout(function() {
							$('#form-edit_variants-addtocart .btn--add-to-cart').removeClass('added');
						}, 2000);
						ShopifyAPI.changeItem(line, 0);
						setTimeout(function(){
							ajaxCart.load();
						}, 300);
						if( $('body').hasClass('template-cart') ){
							setTimeout(function(){
								ajaxCartPage.load();
							}, 300);
						}
						setTimeout(function() {
							if ($(window).width() < 767) {
								$(selectors.EditVariant).removeClass('is-visible');
								$('body').removeClass('editv_overlay-layer');
								setTimeout(function() {
									$('[data-edit_variant-cart-container]').empty();
								},300);
							}else{
								$(selectors.EditVariant).removeClass('is-visible');
								setTimeout(function() { 
									$(selectors.EditVariant).removeClass('transform');
								},500);
								setTimeout(function() {
									$('body').removeClass('editv_overlay-layer');
									$('[data-edit_variant-cart-container]').empty();
								},700);
							}
						}, 500);
					},
					error: function(XMLHttpRequest, textStatus) {
						if (typeof errorCallback === 'function') {
							errorCallback(XMLHttpRequest, textStatus);
						} else {
							ShopifyAPI.onError(XMLHttpRequest, textStatus);
						}
					}
				};
				jQuery.ajax(params);
			});
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		},
		convertToSlug: function(str) {
			return str.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
		},
		buildVariant: function(product,id_variant) {
			var result = '';
			var currentVariant = this.currentVariant;
			for (var key in product.variants) {
				if (id_variant == product.variants[key].id) {
					var currentVariant = product.variants[key];
				}
			}
			if (product.options[0].name !== 'Title') {
				var options = product.options;
				for (var i = 0; i < options.length; i ++) {
					var option = options[i];
					var optionIndex = i + 1;
					var type = 'label';
					if (wpbingo.settings.filter_name_1 === option.name) {
						type = wpbingo.settings.select_filter_1;
					}else if (wpbingo.settings.filter_name_2 === option.name) {
						type = wpbingo.settings.select_filter_2;
					}else if (wpbingo.settings.filter_name_3 === option.name) {
						type = wpbingo.settings.select_filter_3;
					}
					result += '<div class="variants-wrapper product-form__item '+ type +'" data-edit_variants-variant-option="' + optionIndex + '">';
					result += '<label class="variants__label">' + option.name + ': <span></span></label>';
					result += '<div class="variants__options">';
					for (var j = 0; j < option.values.length; j ++) {
						var value = option.values[j];
						var isDisable = true;
						var colorAttribute = '';
						// CHECK Product option is available or disabled
						for (var k = 0; k < this.productVariants.length; k ++) {
							var variantCondition = this.productVariants[k];
							if (variantCondition.available) {
								if (i == 0 && variantCondition.option1 === value) {
									isDisable = false;
									break;
								} else if (i == 1 && variantCondition.option2 === value && variantCondition.option1 == currentVariant.option1) {
									isDisable = false;
									break;
								} else if (i == 2 && variantCondition.option3 === value && variantCondition.option2 == currentVariant.option2 && variantCondition.option1 == currentVariant.option1) {
									isDisable = false;
									break;
								}
							}
						}
						// RENDER Product option button
						result += '<div class="single-option-selector">';
						result += '<input type="radio" data-single-option-button';
						result += currentVariant.options[i] === value ? ' checked ' : ' ';
						if (isDisable) {
							result += 'disabled="disabled"';
						}
						result += 'value="' + _.escape(value) + '" data-index="option' + optionIndex + '" name="option' + option.position + '" ';
						result += 'class="js-edit_variant-option-selector';
						if (isDisable) {
							result += ' disabled';
						}
						result += '" id="edit_variants-product-option-' + i + '-' + value.toLowerCase() + '">';
						result += '<label class="' + value + '" data-toggle="tooltip" title="' + value + '" for="edit_variants-product-option-' + i + '-' + value.toLowerCase() + '" ' + colorAttribute;
						if (isDisable) {
							result += ' class="disabled"';
						}
						result += '>' + value + '<span class="tool-tip">' + value + '</span></label>';
						result += '</div>';
					}
					result += '</div>';
					result += '</div>';
				}
			}
			return result;
		},
		createImageCarousel: function(product) {
			if(product.media.length > 1){
				$(selectors.EditVariant).find(selectors.EditVariantImages).slick({
					infinite: false,
					rows: 0,
					fade: true,
					rtl : wpbingo.rtl_slick()
				});
			}
		},
		getCurrentOptions: function() {
			var currentOptions = _.map(
				$(selectors.EditVariantVariant, selectors.EditVariantContainer), function(element) {
					var $element = $(element);
					var type = $element.attr('type');
					var currentOption = {};
					if (type === 'radio' || type === 'checkbox') {
						if ($element[0].checked) {
							currentOption.value = $element.val();
							currentOption.index = $element.data('index');
							return currentOption;
						} else {
							return false;
						}
					} else {
						currentOption.value = $element.val();
						currentOption.index = $element.data('index');
						return currentOption;
					}
				}
			);
			currentOptions = _.compact(currentOptions);
			return currentOptions;
		},
		getVariantFromOptions: function() {
			var selectedValues = this.getCurrentOptions();
			var variants = this.productVariants;
			var found = _.find(variants, function(variant) {
				return selectedValues.every(function(values) {
					return _.isEqual(variant[values.index], values.value);
				});
			});
			return found;
		},
		updateVariantsButton: function () {
			var selectedValues = this.getCurrentOptions();
			var variants = this.productVariants;
			for (var i = 2; i <= 3; i++) {
				if ($('[data-edit_variants-variant-option="' + i + '"]', selectors.EditVariantContainer).length) {
					$('[data-edit_variants-variant-option="' + i + '"] ' + selectors.EditVariantVariant, selectors.EditVariantContainer).each(function() {
						var $self = $(this);
						var optionValue = $self.val();
						var foundIndex;
						if (i === 2) {
							foundIndex = _.findIndex(variants, function(variant) {
								variant.option1 = variant.option1.toString();
								selectedValues[0].value = selectedValues[0].value.toString();
								variant.option2 = variant.option2.toString();
								optionValue = optionValue.toString();
								return variant.option1 === selectedValues[0].value &&
								variant.option2 === optionValue &&
								variant.available === true;
							});
							
						} else if (i === 3) {
							foundIndex = _.findIndex(variants, function(variant) {
								variant.option1 = variant.option1.toString();
								variant.option2 = variant.option2.toString();
								variant.option3 = variant.option3.toString();
								selectedValues[0].value = selectedValues[0].value.toString();
								selectedValues[1].value = selectedValues[1].value.toString();
								optionValue = optionValue.toString();
								return variant.option1 === selectedValues[0].value && variant.option2 === selectedValues[1].value &&
								variant.option3 === optionValue &&
								variant.available === true;
							});
						}
						if (foundIndex !== -1) {
							$self.removeAttr('disabled', 'disabled').removeClass('disabled');
							$self.next('label').removeClass('disabled');
						} else {
							$self.attr('disabled', 'disabled').addClass('disabled');
							$self.next('label').addClass('disabled');
						}
					});
				}
			}
		},
		updateVariantsButtonDisabed: function() {
			for (var i = 2; i <= 3; i++) {
				if ($('[data-edit_variants-variant-option="' + i + '"]', selectors.EditVariantContainer).length) {
					var isUpdate = false;
					$('[data-edit_variants-variant-option="' + i + '"] ' + selectors.EditVariantVariant, selectors.EditVariantContainer).each(function() {
						var $element = $(this);
						var type = $element.attr('type');
						if (type === 'radio' || type === 'checkbox') {
							if (this.checked && $element.hasClass('disabled')) {
								$element.prop('checked', false);
								isUpdate = true;
								return false;
							}
						}
					});
					$('[data-edit_variants-variant-option="' + i + '"] ' + selectors.EditVariantVariant, selectors.EditVariantContainer).each(function() {
						var $element = $(this);
						var type = $element.attr('type');
						if (isUpdate && (type === 'radio' || type === 'checkbox') && !$element.hasClass('disabled')) {
							$element.prop('checked', true);
							isUpdate = false;
							$element.trigger('change');
							return false;
						}
					});
				}
			}
		},
		updateMasterSelect: function(variant) {
			if (variant) {
				$(selectors.originalSelectorId, selectors.EditVariantContainer).val(variant.id);
			}
		},
		updateLabelvariant: function(variant) {
			var $element = $('.edit_variant-cart-container .content_product_detail .variants-wrapper')
			$($element).each(function() {
				var $this = $(this);
				var value = $('input:checked',$this).attr('value');
				$('.variants__label span',$this).html(value);
			});
		},
		updateMedia: function(variant) {
			if (variant && variant.featured_media && variant.featured_media.id) {
				$('.slick-carousel__item',selectors.EditVariantContainer).removeClass('show');
				$(selectors.EditVariantImages, selectors.EditVariantContainer).find('.edit_variant-images__item').each(function() {
					var imageID = $(this).data('media-id');
					if (variant.featured_media.id == imageID) {
						$(this).closest('.slick-carousel__item').addClass('show');
						var slickIndex = $(this).closest('.slick-carousel__item').data('slick-index');
						if (slickIndex !== undefined && slickIndex !== null) {
							$(selectors.EditVariantImages, selectors.EditVariantContainer).slick('slickGoTo', slickIndex);
						}
					}
				});
			}
		},

		updatePrice: function(variant) {
			var moneyFormat = wpbingo.strings.moneyFormat;
			if (!variant) {
				$(selectors.EditVariantProductPrice, selectors.EditVariantContainer).addClass('d-none');
				$(selectors.EditVariantProductPriceCompare, selectors.EditVariantContainer).addClass('d-none');
			} else {
				$(selectors.EditVariantProductPrice, selectors.EditVariantContainer).removeClass('d-none');
				$(selectors.EditVariantProductPriceCompare, selectors.EditVariantContainer).removeClass('d-none');
				$(selectors.EditVariantProductPrice, selectors.EditVariantContainer).html(
					wpbingo.Currency.formatMoney(variant.price, moneyFormat)
				);
				if (variant.compare_at_price > variant.price) {
					$(selectors.EditVariantProductPriceCompare, selectors.EditVariantContainer).html(
						wpbingo.Currency.formatMoney(variant.compare_at_price, moneyFormat)
					).removeClass('d-none');
					$(selectors.EditVariantProductPrice, selectors.EditVariantContainer).addClass('on-sale');
				} else {
					$(selectors.EditVariantProductPriceCompare, selectors.EditVariantContainer).addClass('d-none');
					$(selectors.EditVariantProductPrice, selectors.EditVariantContainer).removeClass('on-sale');
				}
			}
			if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
		},

		updateProductAvaiable: function(variant) {
			var classActive = 'product-avaiable--active';
			var translations = wpbingo.strings;
			$(selectors.EditVariantAvaiable, selectors.EditVariantContainer).removeClass(classActive);
			if (variant) {
				if (variant.available) {
					$(selectors.EditVariantQty, selectors.EditVariantContainer).removeClass('d-none');
					$(selectors.EditVariantAvaiableInStock, selectors.EditVariantContainer).addClass(classActive);
				} else {
					$(selectors.EditVariantQty, selectors.EditVariantContainer).addClass('d-none');
					$(selectors.EditVariantAvaiableOutStock, selectors.EditVariantContainer).addClass(classActive);
				}
				// Button add to cart
				if (variant.available) {
					$(selectors.EditVariantContainer).find('.btn--add-to-cart')
						.removeClass('disabled')
						.prop('disabled', false);
					$(selectors.EditVariantContainer).find('.btn--add-to-cart .btn__text').html(translations.addToCart);
				} else {
					$(selectors.EditVariantContainer).find('.btn--add-to-cart')
						.addClass('disabled')
						.prop('disabled', true);
					$(selectors.EditVariantContainer).find('.btn--add-to-cart .btn__text').html(translations.soldOut);
				}
			} else {
				$(selectors.EditVariantQty, selectors.EditVariantContainer).addClass('d-none');
				$(selectors.EditVariantContainer).find('.btn--add-to-cart')
					.addClass('disabled')
					.prop('disabled', true);
				$(selectors.EditVariantContainer).find('.btn--add-to-cart .btn__text').html(translations.unavailable);
			}
		},

		updateDetailsLink: function(variant) {
			if (variant) {
				var productURL = $(selectors.EditVariantDetailsURL, selectors.EditVariantContainer).data('url') + '?variant=' + variant.id;
				$(selectors.EditVariantDetailsURL, selectors.EditVariantContainer).removeClass('d-none').attr('href', productURL);
			} else {
				$(selectors.EditVariantDetailsURL, selectors.EditVariantContainer).addClass('d-none');
			}
		},

		onVariantChange: function(id_variant) {
			var variant = this.getVariantFromOptions();
			if ($('[data-single-option-button]', selectors.EditVariantContainer).length) {
				this.updateVariantsButton();
				if (!variant || !variant.available) {
					this.updateVariantsButtonDisabed();
					return;
				}
			}
			setTimeout(function(){
				if (variant.id != id_variant){
					$('.btn--add-to-cart',selectors.EditVariantContainer).prop('disabled', false);
				}else{
					$('.btn--add-to-cart',selectors.EditVariantContainer).prop('disabled', true);
				}
			}, 100);
			this.updateMasterSelect(variant);
			this.updateLabelvariant(variant);
			this.updateMedia(variant);
			this.updatePrice(variant);
			this.updateProductAvaiable(variant);
			this.updateDetailsLink(variant);
			this.currentVariant = variant;
		}
	});
	return EditVariant;
})();
var ajaxCartPage = (function(module, $) {
	'use strict';
	// Public functions
	var init, loadCart;
	// Private general variables
	var settings, isUpdating, $body;
	// Private plugin variables
	var $formContainer,
		$cartCountSelector,
		$cartCostSelector,
		$cartContainer;
	// Private functions
	var initializeEvents,
		updateCountPrice,
		itemAddedCallback,
		itemErrorCallback,
		cartUpdateCallback,
		buildCart,
		cartCallback,
		adjustCart,
		adjustCartCallback,
		validateQty;
	/*============================================================================
		Initialise the plugin and define global options
	==============================================================================*/
	init = function(options) {
		// Default settings
		settings = {
			cartContainer: '[data-cartpage-container]',
			cartCostSelector: '.cart-total__subtotal-price',
			cartRemoveSelector: '.cart-product-info__btn--remove',
			moneyFormat: '${{amount}}',
			disableAjaxCart: false,
			cartTemplate: '#cart-form-template'
		};

		if (wpbingo.strings.moneyFormat !== undefined) {
			settings.moneyFormat = wpbingo.strings.moneyFormat;
		}

		// Override defaults with arguments
		$.extend(settings, options);

		// Select DOM elements
		$cartContainer = $(settings.cartContainer);
		$cartCostSelector = $(settings.cartCostSelector);

		$body = $('body');
		isUpdating = false;
		initializeEvents();
		adjustCart();
	};

	initializeEvents = function() {
		$body.on('click', settings.cartRemoveSelector, function(e) {
			e.preventDefault();
			if (isUpdating) {
				return;
			}
			var $el = $(this),
				line = $el.data('line');
			if (line) {
				$('.item-cart[data-line="' + line + '"]').addClass('is-loading');
				isUpdating = true;
				setTimeout(function() {
					ShopifyAPI.changeItem(line, 0, adjustCartCallback);
				}, 250);
			}
		});
	};

	loadCart = function() {
		ShopifyAPI.getCart(cartUpdateCallback);
	};
	updateCountPrice = function(cart) {
		if ($cartCostSelector) {
			$cartCostSelector.html(
				wpbingo.Currency.formatMoney(cart.total_price, settings.moneyFormat)
			);
		}
	};
	cartUpdateCallback = function(cart, added) {
		updateCountPrice(cart);
		buildCart(cart);
		if(cart.item_count > 0) {
			$('.page-cart .content-cart_page').removeClass('hidden');
			$('.page-cart .page-cart__header').removeClass('hidden');
			$('.page-cart .page-cart-empty').addClass('hidden');
		}else{
			$('.page-cart .content-cart_page').addClass('hidden');
			$('.page-cart .page-cart__header').addClass('hidden');
			$('.page-cart .page-cart-empty').removeClass('hidden');
		}
	};

	buildCart = function(cart,edit_variant) {
		$cartContainer.empty();
		// Show empty cart
		if (cart.item_count === 0) {
			$cartContainer.append(
				'<p class="cart-empty-message">' +
				wpbingo.strings.cartEmpty +
				'</p>\n' +
				'<p class="cookie-message">' +
				wpbingo.strings.cartCookies +
				'</p>'
			);
			cartCallback(cart);
			$('.js-drawer .drawer__title .count').text('0');
			$('.shipping-bar-cart').addClass('hidden');
			return;
		}
		var items = [],
			item = {},
			data = {},
			source = $(settings.cartTemplate).html();
		var template = Handlebars.compile(source);
		$.each(cart.items, function(index, cartItem) {
			var prodImg;
			var unitPrice = null;
			var disabled = '';
            var variant_id = cartItem.variant_id;
			var count = $('#count_quantity [data-variant_id="'+variant_id+'"]').data('count_quantity');
			if( cartItem.quantity == count ){
				disabled = 'disabled';
			}
			if (cartItem.image !== null) {
				prodImg = cartItem.image.replace(/(\.[^.]*)$/, '_120x$1').replace('http:', '');
			} else {
				prodImg = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
			}
			if (cartItem.properties !== null) {
				$.each(cartItem.properties, function(key, value) {
					if (key.charAt(0) === '_' || !value) {
						delete cartItem.properties[key];
					}
				});
			}
			if (cartItem.properties !== null) {
				$.each(cartItem.properties, function(key, value) {
					if (key.charAt(0) === '_' || !value) {
						delete cartItem.properties[key];
					}
				});
			}
			if (cartItem.line_level_discount_allocations.length !== 0) {
				for (var discount in cartItem.line_level_discount_allocations) {
					var amount =  cartItem.line_level_discount_allocations[discount].amount;
					cartItem.line_level_discount_allocations[
						discount
					].formattedAmount = wpbingo.Currency.formatMoney(
						amount,
						settings.moneyFormat
					);
				}
			}
			if (cart.cart_level_discount_applications.length !== 0) {
				for (var cartDiscount in cart.cart_level_discount_applications) {
					var cartAmount =  cart.cart_level_discount_applications[cartDiscount].total_allocated_amount;
					cart.cart_level_discount_applications[cartDiscount].formattedAmount = wpbingo.Currency.formatMoney(
						cartAmount,
						settings.moneyFormat
					);
				}
			}
			if (cartItem.unit_price_measurement) {
				unitPrice = {
					addRefererenceValue:
					cartItem.unit_price_measurement.reference_value !== 1,
					price: wpbingo.Currency.formatMoney(cartItem.unit_price,settings.moneyFormat),
					reference_value: cartItem.unit_price_measurement.reference_value,
					reference_unit: cartItem.unit_price_measurement.reference_unit
				};
			}
		  // Create item's data object and add to 'items' array
			item = {
				key: cartItem.key,
				line: index + 1, // Shopify uses a 1+ index in the API
				url: cartItem.url,
				img: prodImg,
				name: cartItem.product_title,
				variation: cartItem.variant_title,
				variant: cartItem.variant_title === null ? false : true,
				options:cartItem.options_with_values,
				variant_id: cartItem.variant_id,
				price: wpbingo.Currency.formatMoney(
					cartItem.price,
					settings.moneyFormat
				),
				discountprice: wpbingo.Currency.formatMoney(
					cartItem.original_line_price,
					settings.moneyFormat
				),
				finalPrice: wpbingo.Currency.formatMoney(
					cartItem.final_line_price,
					settings.moneyFormat
				),
				handle:cartItem.handle,
				properties: cartItem.properties,
				itemAdd: cartItem.quantity + 1,
				itemMinus: cartItem.quantity - 1,
				itemQty: cartItem.quantity,
				discounts: cartItem.line_level_discount_allocations,
				discountsApplied:cartItem.line_level_discount_allocations.length === 0 ? false : true,
				vendor: cartItem.vendor,
				unitPrice: unitPrice,
				disabled:disabled
			};
			items.push(item);
			wpbingo.discount_single();
		});
		// Gather all cart data and add to DOM
		data = {
			items: items,
			note: cart.note,
			totalPrice: wpbingo.Currency.formatMoney(
				cart.total_price,
				settings.moneyFormat
			),
			cartDiscounts: cart.cart_level_discount_applications,
			cartDiscountsApplied:cart.cart_level_discount_applications.length === 0 ? false : true
		};
		$cartContainer.append(template(data));
		cartCallback(cart);
		$('.shipping-bar-cart').removeClass('hidden');
		if($('.shipping-bar-cart').length) {
			var price_shipping_bar 	= $('.shipping-bar-cart').data("price_shipping_bar");
			if(price_shipping_bar > cart.total_price && price_shipping_bar != 0){
				var minus_spend 		= price_shipping_bar - cart.total_price;
				var spend 				= wpbingo.Currency.formatMoney(minus_spend,settings.moneyFormat);
				var percent				= cart.total_price/price_shipping_bar*100;
				$('.shipping-bar-cart .title-spend .spend').html(spend);
				$('.shipping-bar-cart .shipping-progress').css("width",percent+"%");
				$('.shipping-bar-cart .title-shipping').addClass('hide');
				$('.shipping-bar-cart .title-spend').removeClass('hide');
				$('.shipping-bar-cart').removeClass('full');
				$('.shipping-bar-cart .shipping-progress').removeClass('fire-done');
				$('#fire_work').addClass('hide');
			}else {
				$('.shipping-bar-cart .title-shipping').removeClass('hide');
				$('.shipping-bar-cart .title-spend').addClass('hide');
				$('.shipping-bar-cart .shipping-progress').css("width","100%");
				$('.shipping-bar-cart').addClass('full');
				if(!$('.shipping-bar-cart .shipping-progress').hasClass('fire-done')){
					$('.shipping-bar-cart .shipping-progress').addClass('fire');
				}
				if($('.shipping-bar-cart .shipping-progress').hasClass('fire')){
					$('#fire_work').removeClass('hide');
					confettiLoop();
				}
				setTimeout(function() {
					$('.shipping-bar-cart .shipping-progress').addClass('fire-done');
					$('.shipping-bar-cart .shipping-progress').removeClass('fire');
				},100);
				setTimeout(function() {
					$('#fire_work').addClass('hide');
				},5000);
			}
		}
		$('.page-cart .pre_order-cart >span').each(function(){
			var id = $(this).data('handle');
			for (var i in data.items) {
				if(data.items[i].variant_id == id) {
					$('.page-cart .item-cart[data-line="'+data.items[i].line+'"] .pre_order').removeClass('hidden');
				}
			}
		});
		if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
	};
	
	cartCallback = function(cart) {
		if (window.Shopify && Shopify.StorefrontExpressButtons) {
			Shopify.StorefrontExpressButtons.initialize();
		}
	};

	adjustCart = function() {
		$body.on('click', '#cart-form .ajaxcart__qty-adjust', function() {
			if (isUpdating) {return;}
			var $el = $(this),
				line = $el.data('line'),
				$qtySelector = $el.siblings('.ajaxcart__qty-num'),
				qty = parseInt($qtySelector.val().replace(/\D/g, ''));
			qty = validateQty(qty);
			if ($el.hasClass('ajaxcart__qty--plus')) {
				qty += 1;
			} else {
				qty -= 1;
				if (qty <= 0) qty = 0;
			}
			if (line) {
				updateQuantity(line, qty);
			} else {
				$qtySelector.val(qty);
			}
		});
		$body.on('change', '#cart-form .ajaxcart__qty-num', function() {
			if (isUpdating) {return;}
			var id = $(this).data('variant_id');
			var count = $('#count_quantity [data-variant_id="'+id+'"]').data('count_quantity');
			var $el = $(this),
				line = $el.data('line'),
				qty = parseInt($el.val().replace(/\D/g, ''));
			qty = validateQty(qty);
			if(qty >= count){
				qty = count;
				$el.val(qty);
			}
			if (line) {
				updateQuantity(line, qty);
			}
		});
		$body.on('submit', '#cart-form ', function(evt) {
			if (isUpdating) {
				evt.preventDefault();
			}
		});
		$body.on('focus', '#cart-form .ajaxcart__qty-adjust', function() {
			var $el = $(this);
			setTimeout(function() {
				$el.select();
			}, 50);
		});
		function updateQuantity(line, qty) {
			isUpdating = true;
			var $row = $('#cart-form .item-cart[data-line="' + line + '"]').addClass('is-loading');
			if (qty === 0) {
				$row.parent().addClass('is-removed');
			}
			setTimeout(function() {
				ShopifyAPI.changeItem(line, qty, adjustCartCallback);
			}, 250);
		}
	};
	adjustCartCallback = function(cart) {
		updateCountPrice(cart);
		ajaxCart.load();
		setTimeout(function() {
			ShopifyAPI.getCart(buildCart);
			isUpdating = false;
			if(cart.item_count > 0) {
				$('.page-cart .content-cart_page').removeClass('hidden');
				$('.page-cart .page-cart__header').removeClass('hidden');
				$('.page-cart .page-cart-empty').addClass('hidden');
			}else{
				$('.page-cart .content-cart_page').addClass('hidden');
				$('.page-cart .page-cart__header').addClass('hidden');
				$('.page-cart .page-cart-empty').removeClass('hidden');
			}
		}, 150);
	};
	validateQty = function(qty) {
		if (parseFloat(qty) === parseInt(qty) && !isNaN(qty)) {
		// We have a valid number!
		} else {
		qty = 1;
		}
		return qty;
	};
	module = {
		init: init,
		load: loadCart
	};
	return module;
})(ajaxCartPage || {}, jQuery);
wpbingo.ajax_cartpage = function() {
	if ($('body').hasClass('template-cart') ) {
		ajaxCartPage.init();
		ajaxCartPage.load();
	}
};
wpbingo.ajax_blogpage = (function() {
	 var ajaxBreadcrumbs,
		ajaxPaging,
		ajaxPagingportfolio,
		ajaxLoadMore,
		ajaxLoadMoreportfolio,
		ajaxSidebar;
	var init = function() {
		ajaxPaging();
		ajaxPagingportfolio();
		ajaxLoadMore();
		ajaxLoadMoreportfolio();
		ajaxBreadcrumbs();
		ajaxSidebar();
	};
	ajaxLoadMore = function() {
		if ( $('.page-blog .pagination-ajax-blog-loadmore').length ) {
			$('.page-blog .pagination-ajax-blog-loadmore').on('click', 'a', function(e) {
				e.preventDefault();
				var pageURL 	= $(this).attr('href');
				var newTitle 	= $(this).attr('title');
				var URL_array 	= $(this).attr('href').match(/page=\d+/g);
				var curret		= parseInt(URL_array[0].match(/\d+/g));
				$(this).addClass('active');
				$("#pre-loading").addClass('load-product');
				$('#pre-loading .pre-loading__bar').css({"width":"40%"});
				var offset = $(this).offset().top;
				if (pageURL) {
					$.ajax({
						type: 'get',
						url: pageURL,
						success: function(data) {	
							document.title = newTitle;
							$(".page-blog .article__list").append($(data).find(".page-blog .article__list").html());
							$('.page-blog .pagination-ajax-blog-loadmore').replaceWith($(data).find('.page-blog .pagination-ajax-blog-loadmore'));
							$('#pre-loading .pre-loading__bar').css({"width":"100%"});
							$('body,html').animate({
								scrollTop: offset
							}, 600);
							setTimeout(function() { 
								$('#pre-loading .pre-loading__bar').css({"width":"0"});
								$("#pre-loading").removeClass('load-product');
							}, 500);
							ajaxBreadcrumbs();
							ajaxSidebar();
							ajaxLoadMore();
							wpbingo.christmas_snow();
							$(this).removeClass('active');
						},
						error: function(xhr, text) {
							console.log(text); 
						}
					});
				}
			});
		}
	};
	ajaxPaging = function() {
		if ( $('.page-blog .pagination-ajax-blog').length ) {
			$('.page-blog .pagination-ajax-blog').on('click', 'a', function(e) {
				e.preventDefault();
				var pageURL = $(this).attr('href');
				var newTitle = $(this).closest('.pagination-ajax-blog').attr('title');
				History.pushState({
				  param: Shopify.queryParams
				}, pageURL, pageURL);
				$("#pre-loading").addClass('load-product');
				$('#pre-loading .pre-loading__bar').css({"width":"40%"});		
				if (pageURL) {
					$.ajax({
						type: 'get',
						url: pageURL,
						success: function(data) {	
							document.title = newTitle;
							$('.page-blog').replaceWith($(data).find('.page-blog'));
							$('body,html').animate({
								scrollTop: $('.header').height() + $('.wpbingo-breadcrumbs').height()
							}, 600);							
							$('#pre-loading .pre-loading__bar').css({"width":"100%"});
							setTimeout(function() { 
								$('#pre-loading .pre-loading__bar').css({"width":"0"});
								$("#pre-loading").removeClass('load-product');
							}, 500);
							ajaxBreadcrumbs();
							ajaxSidebar();
							ajaxPaging();
						},
						error: function(xhr, text) {
							console.log(text);
						}
					});
				}
			});
		};
	};
	ajaxLoadMoreportfolio = function() {
		if ( $('.page-portfolio .pagination-ajax-blog-loadmore').length ) {
			$('.page-portfolio .pagination-ajax-blog-loadmore').on('click', 'a', function(e) {
				e.preventDefault();
				var pageURL 	= $(this).attr('href');
				var newTitle 	= $(this).attr('title');
				var URL_array 	= $(this).attr('href').match(/page=\d+/g);
				var curret		= parseInt(URL_array[0].match(/\d+/g));
				$(this).addClass('active');
				$("#pre-loading").addClass('load-product');
				$('#pre-loading .pre-loading__bar').css({"width":"40%"});
				if (pageURL) {
					$.ajax({
						type: 'get',
						url: pageURL,
						success: function(data) {	
							document.title = newTitle;
							$(".page-portfolio .article__list").append($(data).find(".page-portfolio .article__list").html());
							$('.page-portfolio .pagination-ajax-blog-loadmore').replaceWith($(data).find('.page-portfolio .pagination-ajax-blog-loadmore'));
							$('#pre-loading .pre-loading__bar').css({"width":"100%"});
							setTimeout(function() { 
								$('#pre-loading .pre-loading__bar').css({"width":"0"});
								$("#pre-loading").removeClass('load-product');
							}, 500);
							ajaxBreadcrumbs();
							ajaxLoadMoreportfolio();
							wpbingo.christmas_snow();
							$(this).removeClass('active');
						},
						error: function(xhr, text) {
							console.log(text);
						}
					});
				}
			});
		}
	};
	ajaxPagingportfolio = function() {
		if ( $('.page-portfolio .pagination-ajax-blog').length ) {
			$('.page-portfolio .pagination-ajax-blog').on('click', 'a', function(e) {
				e.preventDefault();
				var pageURL = $(this).attr('href');
				var newTitle = $(this).closest('.pagination-ajax-blog').attr('title');
				History.pushState({
				  param: Shopify.queryParams
				}, pageURL, pageURL);
				$("#pre-loading").addClass('load-product');
				$('#pre-loading .pre-loading__bar').css({"width":"40%"});		
				if (pageURL) {
					$.ajax({
						type: 'get',
						url: pageURL,
						success: function(data) {	
							document.title = newTitle;
							$('.page-portfolio').replaceWith($(data).find('.page-portfolio'));
							$('body,html').animate({
								scrollTop: $('.header').height() + $('.wpbingo-breadcrumbs').height()
							}, 600);							
							$('#pre-loading .pre-loading__bar').css({"width":"100%"});
							setTimeout(function() { 
								$('#pre-loading .pre-loading__bar').css({"width":"0"});
								$("#pre-loading").removeClass('load-product');
							}, 500);
							ajaxBreadcrumbs();
							ajaxPagingportfolio();
						},
						error: function(xhr, text) {
							console.log(text);
						}
					});
				}
			});
		};
	};
	ajaxBreadcrumbs = function() {
		if ( $('.wpbingo-breadcrumbs .wpbingo-blog-list').length ) {
			var $categories_blog = $('.wpbingo-blog-list');
			$($categories_blog).on('click', 'a', function(e){
				e.preventDefault();
				var pageURL = $(this).attr('href');
				var newTitle = $(this).attr('title');
				$(this).closest('.item-blog').addClass('active');
				History.pushState({
				  param: Shopify.queryParams
				}, pageURL, pageURL);	
				delete Shopify.queryParams.page;
				$("#pre-loading").addClass('load-product');
				$('#pre-loading .pre-loading__bar').css({"width":"40%"});
				$.ajax({
					type: 'get',
					url: pageURL,
					success: function(data) {
						document.title = newTitle;			
						$('.page-blog').replaceWith($(data).find('.page-blog'));
						$('.page-portfolio').replaceWith($(data).find('.page-portfolio'));
						$('.wpbingo-breadcrumbs .wpbingo-blog-list').replaceWith($(data).find('.wpbingo-breadcrumbs .wpbingo-blog-list'));			
						$('#pre-loading .pre-loading__bar').css({"width":"100%"});
						setTimeout(function() { 
							$('#pre-loading .pre-loading__bar').css({"width":"0"});
							$("#pre-loading").removeClass('load-product');
						}, 500);
						ajaxBreadcrumbs();
						ajaxSidebar();
						ajaxPaging();
						ajaxPagingportfolio();
						ajaxLoadMore();
						ajaxLoadMoreportfolio();
					},
					error: function(xhr, text) {
						console.log(text);
					}
				});			
				$('body,html').animate({
					scrollTop: $('.header').height() + $('.wpbingo-breadcrumbs').height()
				}, 600);
			});
		}
	};
	ajaxSidebar = function() {
		if ( $('.page-blog .blog-sidebar .list-category').length ) {
			var $categories_blog = $('.blog-sidebar .list-category');
			$($categories_blog).on('click', 'a', function(e){
				e.preventDefault();
				var pageURL = $(this).attr('href');
				var newTitle = $(this).attr('title');
				$(this).closest('li').addClass('active');
				History.pushState({
				  param: Shopify.queryParams
				}, pageURL, pageURL);	
				delete Shopify.queryParams.page;
				$("#pre-loading").addClass('load-product');
				$('#pre-loading .pre-loading__bar').css({"width":"40%"});
				$.ajax({
					type: 'get',
					url: pageURL,
					success: function(data) {
						document.title = newTitle;			
						$('.page-blog').replaceWith($(data).find('.page-blog'));
						$('.wpbingo-breadcrumbs .wpbingo-blog-list').replaceWith($(data).find('.wpbingo-breadcrumbs .wpbingo-blog-list'));			
						$('#pre-loading .pre-loading__bar').css({"width":"100%"});
						setTimeout(function() { 
							$('#pre-loading .pre-loading__bar').css({"width":"0"});
							$("#pre-loading").removeClass('load-product');
						}, 500);
						ajaxBreadcrumbs();
						ajaxSidebar();
						ajaxPaging();
						ajaxLoadMore();
					},
					error: function(xhr, text) {
						console.log(text);
					}
				});			
				$('body,html').animate({
					scrollTop: $('.header').height() + $('.wpbingo-breadcrumbs').height()
				}, 600);
			});
		}
	}
	return init;
})();
wpbingo.checkbox_terms_conditions = function() {
	if ( $(".ajaxcart_terms_conditions").length > 0 ) {
		if ($(".agree_terms_conditions").is(":checked")) {
		   $('[name="checkout"], [name="goto_pp"], [name="goto_gc"]').prop('disabled', false);
		} else {
			$('[name="checkout"], [name="goto_pp"], [name="goto_gc"]').prop('disabled', true);
		}
		setTimeout(function() {
			if ($(".agree_terms_conditions").is(":checked")) {
			   $('[data-shopify="payment-button"] button').prop('disabled', false);
			} else {
				$('[data-shopify="payment-button"] button').prop('disabled', true);
			}
		},1000);
		$("body").on(
			"click",
			'.agree_terms_conditions',
			function () {
				if ($(this).is(":checked")) {
					$('body').find('.agree_terms_conditions').each(function() {
						$(this).attr("checked", "checked");
					});
				   $('[data-shopify="payment-button"] button, [name="checkout"], [name="goto_pp"], [name="goto_gc"]').prop('disabled', false);
				} else {
					$('body').find('.agree_terms_conditions').each(function() {
						$(this).removeAttr('checked');
					});
					$('[data-shopify="payment-button"] button, [name="checkout"], [name="goto_pp"], [name="goto_gc"]').prop('disabled', true);
				}
			}
		);
		$('.content_terms_conditions [data-close-terms_conditions]').on('click', function(e) {
			$('.content_terms_conditions').removeClass('show');
			setTimeout(function() {
				$('.content_terms_conditions').removeClass('active');
			},300);
		});
		$('.ajaxcart_terms_conditions a').on('click', function(e) {
			e.preventDefault();
			$('.content_terms_conditions').addClass('active');
			setTimeout(function() {
				$('.content_terms_conditions').addClass('show');
			},300);
		});
	}
};
wpbingo.check_width_megamenu = function() {
	if( $('.menu-dropdown__content--megamenu.width_custom_pos').length > 0 ){
		$('.menu-dropdown__content--megamenu.width_custom_pos').each(function(){
			var left = $(this).offset().left;
			var width_left = $(this).width() + left;
			var $parent = $(this).closest('.menu-dropdown--mega');
			$parent.addClass('position-relative');
			if( width_left >= $(window).width() ){
				$parent.addClass('width_custom_pos_right');
			}
		});
	}
}
wpbingo.slick_mobile = function() {
	if ($(window).width() < 767) {
		$('.bwp-load-slick-mobile').each(function() {
			$(this).slick({
				infinite: true,
				slidesToShow: $(this).data('col1'),
				slidesToScroll: $(this).data('col1'),
				arrows : $(this).data('nav'),
				dots : $(this).data('dot'),
				autoplay: $(this).data('autoplay'),
				autoplaySpeed: 5000,
				rtl : wpbingo.rtl_slick(),
				responsive: [
					{
						breakpoint: 480,			  
						settings: {
							slidesToShow: $(this).data("col2"),
							slidesToScroll: $(this).data("col2"),
						}
					}
				]
			});
		});
	}
}
wpbingo.accordion_footer = function() {
	if ( $('.footer-center').hasClass('accordion') && ($(window).width() < 767) ) {
		$('.accordion .content-toggle').each(function() {
			var toggle = $('.footer-block',$(this));
			$('.title-footer',$(this)).on('click', function() {
				var $parent = $(this).closest('.content-toggle');
				$parent.toggleClass('active');
				toggle.slideToggle();
			});
		});
	}
}
wpbingo.product_tab = function() {
	if ($('.wpbingo-section--product-tabs-grid').length > 0) {
		$('.wpbingo-section--product-tabs-grid .product-tabs__nav-link').each(function() {
			$(this).on('click',function(){
				var $parent = $(this).closest('.menu-dropdown');
				var $text = $(this).text();
				$('span',$parent).text($text);
			});
		});
	}
}
wpbingo.banner_video = function() {
	if ($('.wpbingo-button-video').length > 0) {
		$('.wpbingo-button-video .button-video').each(function() {
			$(this).on('click',function(){
				var $parent = $(this).closest('.wpbingo-button-video');
				$('.video-wrapper',$parent).addClass("active");
				setTimeout(function(){
					$('.video-wrapper',$parent).addClass("show");
				}, 100);
			});
		});
		$('.wpbingo-button-video .close-video').each(function() {
			$(this).on('click',function(){
				var $parent = $(this).closest('.wpbingo-button-video');
				setTimeout(function(){
					$('.video-wrapper',$parent).removeClass("active");
				}, 300);
				$('.video-wrapper',$parent).removeClass("show");
			});
		});
	}
}
wpbingo.christmas_snow = function() {
	if($('.frame-snow').length > 0){
		var flake = window.routes.svg_christmas;
		var random_num1, random_num2, random_num3, snow, snow_x, snow_y, doc_height, doc_width, interval, wind;
		doc_height = $(document).height();
		doc_width = $(document).width();
		wind = 0;
		$(window).resize(function() {
			doc_height = $(document).height();
			doc_width = $(document).width();
		})
		$('.frame-snow').css({"height":doc_height+"px"});
		interval = setInterval(function() {
			random_num1 = Math.round(Math.random() * 100);
			random_num2 = Math.round(Math.random() * 100);
			random_num3 = Math.floor(Math.random() * 30) + Math.round(doc_height / 1000);
			create_flake();
		}, 100);
		interval = setInterval(function() {
			doc_height = $(document).height();
			destroy_flake();
		}, 10);
		function create_flake() {
			var snow_flake = '<div class="snow" style="left:' + random_num1 + '%;transform:scale(' + (random_num2 / 50) + '); animation-duration:' + (random_num3) + 's"><img src="'+ flake +'"/></div>';
			$(snow_flake).appendTo('.frame-snow');
		}
		function destroy_flake() {
			snow = $('.frame-snow .snow');
			snow.each(function() {
				snow_y = $(this).offset().top;
				snow_x = $(this).offset().left;
				if (snow_y > (doc_height + 200)) {
					$(this).remove();
				}
				if (snow_x > (doc_width + 200)) {
					$(this).remove();
				}
			});
		}
	}
}
wpbingo.address_delete = function() {
	$('.address-delete').on('click', function() {
		var $el = $(this);
		var target = $el.data('target');
		var confirmMessage = $el.data('confirm-message');
		if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
			Shopify.postLink(target, {
				parameters: { _method: 'delete' }
			});
		}
	});
}
wpbingo.change_head = function() {
	if( wpbingo.settings.show_come_back ){
		var title = $(document).attr("title");
		if( $('#before-you-leave').length > 0 ){
			var data_time = $('#before-you-leave').data('time');
			var time = data_time*60*1000;
		}
		function change_in() {
			change_out1 = function () {};
			change_out2 = function () {};
			if( $('#before-you-leave').length > 0 && !$('#before-you-leave').hasClass('active') && !$('#before-you-leave').hasClass('hiden') ){
				$('#before-you-leave').addClass('hiden');
			}
			$(document).attr("title", title);
		}
		document.addEventListener('visibilitychange', function (event) {
			if (document.hidden) {
				change_out2 = function () {
					$(document).attr("title", wpbingo.strings.come_back);
					setTimeout(function() { 
						change_out1();
					}, 500);
				};
				change_out1 = function () {
					$(document).attr("title", wpbingo.strings.forget);
					setTimeout(function() { 
						change_out2();
					}, 500);
				};
				if( $('#before-you-leave').length > 0 && $('#before-you-leave').hasClass('hiden') ){
					$('#before-you-leave').removeClass('hiden');
				}
				setTimeout(function() {
					if( $('#before-you-leave').length > 0 && !$('#before-you-leave').hasClass('active') && !$('#before-you-leave').hasClass('hiden') ){
						$('#before-you-leave').addClass('active');
					}
				}, time);
				change_out1();
			} else {
				change_in();
			}
		});
	}
}
wpbingo.before_you_leave = function() {
	if( $('#before-you-leave').length > 0 ){
		var data_time = $('#before-you-leave').data('time');
		var time = data_time*60*1000;
		$('#before-you-leave [data-close-you-leave]').on('click', function() {
			$('#before-you-leave').removeClass('active');
			$('#before-you-leave').addClass('hiden');
		});
		window.addEventListener('mouseover', function (event) {
			if( $('#before-you-leave').length > 0 && !$('#before-you-leave').hasClass('active') && !$('#before-you-leave').hasClass('hiden') ){
				$('#before-you-leave').addClass('hiden');
			}
		});
		window.addEventListener('blur', function (event) {
			if( $('#before-you-leave').length > 0 && $('#before-you-leave').hasClass('hiden') ){
				$('#before-you-leave').removeClass('hiden');
			}
			setTimeout(function() {
				if( $('#before-you-leave').length > 0 && !$('#before-you-leave').hasClass('active') && !$('#before-you-leave').hasClass('hiden') ){
					$('#before-you-leave').addClass('active');
				}
			}, time);
		});
	}
}
wpbingo.product_result_count = function() {
	if( $('#product_result_count').length > 0 ){
		var $text = $('#product_result_count').text();
		$('#main-collection-filters .page-collection-header .product_result_count').html($text);
	}
}
wpbingo.popup_product_card = function() {
	if($(".product-card .btn-select").length){
		$(".product-card .btn-select").on( "click", function(e) {
			e.preventDefault();
			if($(".product-card .product-card_popup").hasClass('active')){
				$(".product-card .product-card_popup").removeClass('active');
				$(".product-card .btn-select").removeClass('hide');
			}
			var $parent = $(this).closest('.product-card');
			if(!$(".product-card_popup",$parent).hasClass('active')){
				$(".product-card_popup",$parent).addClass('active');
				$(".btn-select",$parent).addClass('hide');
			}
		});
		$(window).on("click.Bst", function(event){
			var $box = $('.product-card .product-card_popup');
			var $box2 = $('.product-card .product-card__form');
			if ( $box.has(event.target).length == 0 && !$box.is(event.target) && $box2.has(event.target).length == 0 && !$box2.is(event.target) ) {
				var $parent = $('.product-card');
				if($(".product-card_popup",$parent).hasClass('active')){
					$(".product-card_popup",$parent).removeClass('active');
					$(".btn-select",$parent).removeClass('hide');
				}
			}
		});
	}
}
wpbingo.widget_collapsible = function() {
    $(".bwp-widget-collapsible .card-link").on( "click", function(e) {
        e.preventDefault();
        var $parent = $(this).closest('.card');
        if($parent.hasClass('active')){
            $parent.removeClass('active');
            $('.collapse-body',$parent).slideUp();
        }else{
            $(".bwp-widget-collapsible .card").removeClass('active');
            $('.bwp-widget-collapsible .collapse-body').slideUp();
            $parent.addClass('active');
            $('.collapse-body',$parent).slideDown();
        }
    });
}
wpbingo.search_form = function() {
	$('.close-search-form', $('.header__search-form')).on('click', function(event) {
		var $parent = $(this).closest('.header__search-form');
		$(this).css("display", "none");
		$('.predictive-search-content',$parent).css("display", "none");
	});
}
wpbingo.init = function() {
	wpbingo.initializeEvents();
	wpbingo.setBreakpoints();
	wpbingo.cartInit();
	wpbingo.collectionPages();
	wpbingo.slideshow();
	wpbingo.slickCarousel();
	wpbingo.countdown();
	wpbingo.countdown_single();
	wpbingo.sticky_product();
	wpbingo.sticky_header();
	wpbingo.lookbook();
	wpbingo.click_button();
	wpbingo.click_atribute_image();
	wpbingo.active_form_login();
	wpbingo.cookieConsent();
	wpbingo.newsletter();
	wpbingo.verify_popup();
	wpbingo.header_campar();
	wpbingo.customNumberInput();
	wpbingo.zoom_thumb();
	wpbingo.sale_nofication();
	wpbingo.discount_single();
	wpbingo.pick_up();
	wpbingo.time_estimated_delivery();
	wpbingo.countActiveSidebar();
	wpbingo.toggleSidebar();
	wpbingo.sidebarCollection();
	wpbingo.ajax_cartpage();
	wpbingo.ajax_blogpage();
	wpbingo.checkbox_terms_conditions();
	wpbingo.check_width_megamenu();
	wpbingo.slick_mobile();
	wpbingo.accordion_footer();
	wpbingo.product_tab();
	wpbingo.banner_video();
	wpbingo.christmas_snow();
	wpbingo.address_delete();
	wpbingo.change_head();
	wpbingo.before_you_leave();
	wpbingo.popup_product_card();
	wpbingo.product_result_count();
    wpbingo.widget_collapsible();
    wpbingo.search_form();
	new wpbingo.update_variant_cartpage('.js-edit_variants');
	if (wpbingo.settings.enableGiftCard) {
		new wpbingo.gift_wrap('.js-giftcard');
	}
	if (wpbingo.settings.enableQuickView) {
		new wpbingo.QuickView('.js-quickview');
	}
	if ($('body').hasClass('template-product') ) {
		var $element = $(".product-single");
		var _data = $element.data();
		if(_data.layout_thumb !="slider"){
			$('.product-media__wrapper--video iframe').css("width",$(".product-single__main-media .mfp-image").width());
			$('.product-media__wrapper--video iframe').css("height",$(".product-single__main-media .mfp-image").height());
			$('.js-product-media-item model-viewer').css("width",$(".js-product-media").width());
			$('.js-product-media-item model-viewer').css("height",$(".mfp-image").height());
		}
	}
};
//firework
const confetti = document.getElementById('fire_work');
const confettiCtx = confetti.getContext('2d');
let container, confettiElements = [], clickPosition;
rand = (min, max) => Math.random() * (max - min) + min;
const confettiParams = {
    number: 200,
    size: { x: [5, 10], y: [10, 10] },
    initSpeed: 100,
    gravity: 0.9,
    drag: 0.5,
    terminalVelocity: 6,
    flipSpeed: 0.07,
};
const colors = [
    { front : '#3B870A', back: '#235106' },
    { front : '#B96300', back: '#6f3b00' },
    { front : '#E23D34', back: '#88251f' },
    { front : '#CD3168', back: '#7b1d3e' },
    { front : '#664E8B', back: '#3d2f53' },
    { front : '#394F78', back: '#222f48' },
    { front : '#008A8A', back: '#005353' },
];
setupCanvas();
updateConfetti();
window.addEventListener('resize', () => {
    setupCanvas();
    hideConfetti();
});
function Conf() {
    this.randomModifier = rand(-1, 1);
    this.colorPair = colors[Math.floor(rand(0, colors.length))];
    this.dimensions = {
        x: rand(confettiParams.size.x[0], confettiParams.size.x[1]),
        y: rand(confettiParams.size.y[0], confettiParams.size.y[1]),
    };
    this.position = {
        x: clickPosition[0],
        y: clickPosition[1]
    };
    this.rotation = rand(0, 2 * Math.PI);
    this.scale = { x: 1, y: 1 };
    this.velocity = {
        x: rand(-confettiParams.initSpeed, confettiParams.initSpeed) * 0.4,
        y: rand(-confettiParams.initSpeed, confettiParams.initSpeed)
    };
    this.flipSpeed = rand(0.2, 1.5) * confettiParams.flipSpeed;
    if (this.position.y <= container.h) {
        this.velocity.y = -Math.abs(this.velocity.y);
    }
    this.terminalVelocity = rand(1, 1.5) * confettiParams.terminalVelocity;
    this.update = function () {
        this.velocity.x *= 0.98;
        this.position.x += this.velocity.x;

        this.velocity.y += (this.randomModifier * confettiParams.drag);
        this.velocity.y += confettiParams.gravity;
        this.velocity.y = Math.min(this.velocity.y, this.terminalVelocity);
        this.position.y += this.velocity.y;

        this.scale.y = Math.cos((this.position.y + this.randomModifier) * this.flipSpeed);
        this.color = this.scale.y > 0 ? this.colorPair.front : this.colorPair.back;
    }
}
function updateConfetti () {
    confettiCtx.clearRect(0, 0, container.w, container.h);
    confettiElements.forEach((c) => {
        c.update();
        confettiCtx.translate(c.position.x, c.position.y);
        confettiCtx.rotate(c.rotation);
        const width = (c.dimensions.x * c.scale.x);
        const height = (c.dimensions.y * c.scale.y);
        confettiCtx.fillStyle = c.color;
        confettiCtx.fillRect(-0.5 * width, -0.5 * height, width, height);
        confettiCtx.setTransform(1, 0, 0, 1, 0, 0)
    });
    confettiElements.forEach((c, idx) => {
        if (c.position.y > container.h ||
            c.position.x < -0.5 * container.x ||
            c.position.x > 1.5 * container.x) {
            confettiElements.splice(idx, 1)
        }
    });
    window.requestAnimationFrame(updateConfetti);
}
function setupCanvas() {
    container = {
        w: confetti.clientWidth,
        h: confetti.clientHeight
    };
    confetti.width = container.w;
    confetti.height = container.h;
}
function addConfetti(e) {
    const canvasBox = confetti.getBoundingClientRect();
    if (e) {
        clickPosition = [
            e.clientX - canvasBox.left,
            e.clientY - canvasBox.top
        ];
    } else {
        clickPosition = [
            canvasBox.width * Math.random(),
            canvasBox.height * Math.random()
        ];
    }
    for (let i = 0; i < confettiParams.number; i++) {
        confettiElements.push(new Conf())
    }
}
function hideConfetti() {
    confettiElements = [];
    window.cancelAnimationFrame(updateConfetti)
}
function confettiLoop() {
	for (let i = 0; i < 8; i++) {
        addConfetti();
    }
}

//wishlist
const LOCAL_STORAGE_WISHLIST_KEY = 'shopify-wishlist';
const LOCAL_STORAGE_DELIMITER = ',';
const BUTTON_ACTIVE_CLASS = 'active';
const GRID_LOADED_CLASS = 'loaded';

const selectors = {
  button: '.button-wishlist >button',
  grid: '[grid-wishlist]',
  productCard: '.product-content-card',
};

document.addEventListener('DOMContentLoaded', () => {
	initButtons();
	initGrid();
	const wishlist = getWishlist();
	$('[data-count-wishlist] .count').html(wishlist.length);
		if (wishlist.length === 0) {
	$('[data-count-wishlist] .count').hide();
	} else {
	$('[data-count-wishlist] .count').show();
	}

});

document.addEventListener('shopify-wishlist:updated', (event) => {
	initGrid();
});

const fetchProductCardHTML = (handle) => {
  const productTileTemplateUrl = `/products/${handle}?view=wishlist`;
  return fetch(productTileTemplateUrl)
  .then((res) => res.text())
  .then((res) => {
    const text = res;
    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(text, 'text/html');
    const productCard = htmlDocument.documentElement.querySelector(selectors.productCard);
    return productCard.outerHTML;
  })
  .catch((err) => console.error(`[Shopify Content] Failed to load content for handle: ${handle}`, err));
};

const setupGrid = async (grid) => {
	const wishlist = getWishlist();
	const requests = wishlist.map(fetchProductCardHTML);
	const responses = await Promise.all(requests);
	const wishlistProductCards = responses.join('');
	grid.innerHTML = wishlistProductCards;
	grid.classList.add(GRID_LOADED_CLASS);
	initButtons();
	initButtonsCompare();
	wpbingo.countdown();
	wpbingo.click_atribute_image();
	if( $('.bwp_currency').length > 0 && wishlist.length > 0 ){ Currency.Currency_customer(true); }
	ajaxCart.init();
	const event = new CustomEvent('shopify-wishlist:init-product-grid', {
		detail: { wishlist: wishlist }
	});
	document.dispatchEvent(event);
	$('.wishlist__grid').removeClass('loading_wishlist');
	if( wishlist.length > 0 ){
		$('.wishlist_empty').addClass('hidden');
	}else{
		$('.wishlist_empty').removeClass('hidden');
	}
};

const setupButtons = (buttons) => {
	buttons.forEach((button) => {
		const productHandle = button.dataset.productHandle || false;
		if (!productHandle) return;
		if (wishlistContains(productHandle)) button.classList.add(BUTTON_ACTIVE_CLASS);		
		button.addEventListener('click', () => {
			const timeWishlist = setTimeout(loadWishlist, 1000);
			updateWishlist(productHandle);
			button.classList.add('load-wishlist');
			function loadWishlist() {
				button.classList.remove('load-wishlist');
				button.classList.toggle(BUTTON_ACTIVE_CLASS);
				if($(button).hasClass('active')){
					var $parent = button.closest('.button-wishlist');
					$parent.setAttribute('data-title',window.strings.remove_wishlist);
				}else{
					var $parent = button.closest('.button-wishlist');
					$parent.setAttribute('data-title',window.strings.wishlist);
				}
			}
		});
	});
};
const initGrid = () => {
	const grid = document.querySelector(selectors.grid) || false;
	if (grid) setupGrid(grid);
};
const initButtons = ($element) => {
	if($element){
		const parentElement = document.querySelector($element);
		let buttons = parentElement.querySelectorAll(selectors.button) || [];
		if (buttons.length) setupButtons(buttons);
		else return;
	}else{
		const buttons = document.querySelectorAll(selectors.button) || [];
		if (buttons.length) setupButtons(buttons);
		else return;
	}
	const event = new CustomEvent('shopify-wishlist:init-buttons', {
		detail: { wishlist: getWishlist() }
	});
	document.dispatchEvent(event);
	$(selectors.button).each(function(event){
		if($(this).hasClass('active')){
			var $parent = $(this).closest('.button-wishlist');
			$parent.attr('data-title',window.strings.remove_wishlist);
		}else{
			var $parent = $(this).closest('.button-wishlist');
			$parent.attr('data-title',window.strings.wishlist);
		}
	});
};
const getWishlist = () => {
	const wishlist = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY) || false;
	if (wishlist) return wishlist.split(LOCAL_STORAGE_DELIMITER);
	return [];
};
const setWishlist = (array) => {
	const wishlist = array.join(LOCAL_STORAGE_DELIMITER);
	if (array.length) localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, wishlist);
	else localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);
	const event = new CustomEvent('shopify-wishlist:updated', {
		detail: { wishlist: array }
	});
	document.dispatchEvent(event);
	return wishlist;
};
const updateWishlist = (handle) => {
	const wishlist = getWishlist();
	const indexInWishlist = wishlist.indexOf(handle);
	if (indexInWishlist === -1) 
		wishlist.push(handle);
	else 
		wishlist.splice(indexInWishlist, 1);
	$('[data-count-wishlist] .count').html(wishlist.length);
	if (wishlist.length === 0) {
	$('[data-count-wishlist] .count').hide();
	} else {
	$('[data-count-wishlist] .count').show();
	}

	return setWishlist(wishlist);
};
const wishlistContains = (handle) => {
	const wishlist = getWishlist();
	return wishlist.includes(handle);
};
const resetWishlist = () => {
	return setWishlist([]);
};

//compare
const LOCAL_STORAGE_COMPARE_KEY = 'shopify-compare';
const LOCAL_STORAGE_DELIMITER_COMPARE = ',';
const BUTTON_ACTIVE_CLASS_COMPARE = 'active';
const GRID_LOADED_CLASS_COMPARE = 'loaded';
const selectorscompare = {
	button: '.button-compare >button',
	remove: '.remove-compare >button',
	grid: '[grid-compare]',
	table: '.compare__table',
	productCard: '.product-content-compare',
};
document.addEventListener('DOMContentLoaded', () => {
	initButtonsCompare();
	initGridCompare();
	const compare = getCompare();
	if(compare.length === 0){
		$(selectorscompare.table).removeClass(GRID_LOADED_CLASS_COMPARE);
	}else{
		$(selectorscompare.table).addClass(GRID_LOADED_CLASS_COMPARE);
		$('.show-compare .count',selectorscompare.table).html(compare.length);
	}
});
document.addEventListener('shopify-compare:updated', (event) => {
	initGridCompare();
});
const fetchProductCardHTMLCOMPARE = (handle) => {
	const productTileTemplateUrl = `/products/${handle}?view=compare`;
	return fetch(productTileTemplateUrl)
	.then((res) => res.text())
	.then((res) => {
		const text = res;
		const parser = new DOMParser();
		const htmlDocument = parser.parseFromString(text, 'text/html');
		const productCard = htmlDocument.documentElement.querySelector(selectorscompare.productCard);
		return productCard.outerHTML;
	})
	.catch((err) => console.error(`[Shopify Content] Failed to load content for handle: ${handle}`, err));
};
const setupGridCompare = async (grid) => {
	const compare = getCompare();
	const requests = compare.map(fetchProductCardHTMLCOMPARE);
	if(requests){
		$.each( requests, function( key, result ){
			result.then(
				function(value) {
					const productRemove = new DOMParser().parseFromString(value, 'text/html').querySelector('.clone-remove-compare').innerHTML;
					$(".remove-button",selectorscompare.table).append('<li>'+productRemove+'</li>');
				},
				function(error) {
					console.log(error);
			});
		});
		$.each( requests, function( key, result ){
			result.then(
				function(value) {
					const productName = new DOMParser().parseFromString(value, 'text/html').querySelector('.clone-compare-title').innerHTML;
					$(".compare-name",selectorscompare.table).append('<li>'+productName+'</li>');
				},
				function(error) {
					console.log(error);
				});
		});
		$.each( requests, function( key, result ){
			result.then(
				function(value) {
					const productImage = new DOMParser().parseFromString(value, 'text/html').querySelector('.clone-compare-image').innerHTML;
					$(".compare-image",selectorscompare.table).append('<li>'+productImage+'</li>');
				},
				function(error) {
					console.log(error);
				});
		});
		$.each( requests, function( key, result ){
			result.then(
				function(value) {
					const productVariants = new DOMParser().parseFromString(value, 'text/html').querySelector('.clone-compare-card__content').innerHTML;
					$(".compare-variants",selectorscompare.table).append('<li>'+productVariants+'</li>');
				},
				function(error) {
					console.log(error);
				});
		});
		$.each( requests, function( key, result ){
			result.then(
				function(value) {
					const productAvailability = new DOMParser().parseFromString(value, 'text/html').querySelector('.clone-compare-inventory').innerHTML;
					$(".compare-availability",selectorscompare.table).append('<li>'+productAvailability+'</li>');
				},
				function(error) {
					console.log(error);
				});
		});
		$.each( requests, function( key, result ){
			result.then(
				function(value) {
					const productPrice = new DOMParser().parseFromString(value, 'text/html').querySelector('.clone-compare-price').innerHTML;
					$(".compare-price",selectorscompare.table).append('<li>'+productPrice+'</li>');
				},
				function(error) {
					console.log(error);
				});
		});
		$.each( requests, function( key, result ){
			result.then(
				function(value) {
					const productAtc = new DOMParser().parseFromString(value, 'text/html').querySelector('.clone-compare-atc').innerHTML;
					$(".compare-atc",selectorscompare.table).append('<li>'+productAtc+'</li>');
				},
				function(error) {
					console.log(error);
				});
		});	
	}
	const responses = await Promise.all(requests);
	const compareProductCards = responses.join('');
	wpbingo.click_atribute_image();
	if(compare.length > 0 && $('.bwp_currency').length > 0){
		if( $('.bwp_currency').length > 0){ Currency.Currency_customer(true); }
	}
	removeCompare();
	const event = new CustomEvent('shopify-compare:init-product-grid', {
		detail: { compare: compare }
	});
	document.dispatchEvent(event);
};
const setupButtonsCompare = (buttons) => {
	buttons.forEach((button) => {
		const productHandle = button.dataset.productHandle || false;
		if (!productHandle) return;
		if (compareContains(productHandle)) button.classList.add(BUTTON_ACTIVE_CLASS_COMPARE);
		button.addEventListener('click', () => {
			if(!$(button).hasClass('active')){
				$('.content-compare',selectorscompare.table).addClass('active');
				$('.content',selectorscompare.table).addClass('load-compare');
			}
			const timeCompare = setTimeout(loadCompare, 1000);
			updateCompare(productHandle);
			button.classList.add('load-compare');
			function loadCompare() {
				button.classList.remove('load-compare');
				$('.content',selectorscompare.table).removeClass('load-compare');
				button.classList.toggle(BUTTON_ACTIVE_CLASS_COMPARE);
				if($(button).hasClass('active')){
					var $parent = button.closest('.button-compare');
					$parent.setAttribute('data-title',window.strings.remove_compare);
				}else{
					var $parent = button.closest('.button-compare');
					$parent.setAttribute('data-title',window.strings.compare);
				}
			}
			return ;
		});
	});
};
const removeButtonsCompare = (buttons) => {
	buttons.forEach((remove) => {
		const productHandle = remove.dataset.productHandle || false;
		if (!productHandle) return;
		if (compareContains(productHandle)) remove.classList.add(BUTTON_ACTIVE_CLASS_COMPARE);
		remove.addEventListener('click', () => {
			const timeCompare = setTimeout(loadCompare, 1000);
			updateCompare(productHandle);
			$('.content',selectorscompare.table).addClass('load-compare');
			function loadCompare() {
				$('.content',selectorscompare.table).removeClass('load-compare');
				var handle = remove.getAttribute('data-product-handle');
				$('.button-compare >button[data-product-handle='+handle+']').removeClass(BUTTON_ACTIVE_CLASS_COMPARE);
				$(selectorscompare.button).each(function(event){
					if($(this).hasClass('active')){
						var $parent = $(this).closest('.button-compare');
						$parent.attr('data-title',window.strings.remove_compare);
					}else{
						var $parent = $(this).closest('.button-compare');
						$parent.attr('data-title',window.strings.compare);
					}
				});
			}
		});
	});
}
const initGridCompare = () => {
	const grid = document.querySelector(selectorscompare.grid) || false;
	if (grid){
		$(".remove-button",selectorscompare.table).empty();
		$(".compare-name",selectorscompare.table).empty();
		$(".compare-image",selectorscompare.table).empty();
		$(".compare-variants",selectorscompare.table).empty();
		$(".compare-availability",selectorscompare.table).empty();
		$(".compare-price",selectorscompare.table).empty();
		$(".compare-atc",selectorscompare.table).empty();
		$(".remove-button",selectorscompare.table).append('<li class="label"></li>');
		$(".compare-name",selectorscompare.table).append('<li class="label">'+$('.compare-name').data("label")+'</li>');
		$(".compare-image",selectorscompare.table).append('<li class="label"></li>');
		$(".compare-variants",selectorscompare.table).append('<li class="label">'+$('.compare-variants').data("label")+'</li>');
		$(".compare-availability",selectorscompare.table).append('<li class="label">'+$('.compare-availability').data("label")+'</li>');
		$(".compare-price",selectorscompare.table).append('<li class="label">'+$('.compare-price').data("label")+'</li>');
		$(".compare-atc",selectorscompare.table).append('<li class="label"></li>');
		setupGridCompare(grid);
	}
	$(".compare__table .hide-compare").on( "click", function() {
		if($(".compare__table .content-compare").hasClass('active')){
			$(".compare__table .content-compare").removeClass('active');	
		}
	});
	$(".compare__table .show-compare").on( "click", function() {
		if(!$(".compare__table .content-compare").hasClass('active')){
			$(".compare__table .content-compare").addClass('active');	
		}
	});
};
const initButtonsCompare = ($element) => {
	if($element){
		const parentElement = document.querySelector($element);
		let buttons = parentElement.querySelectorAll(selectorscompare.button) || [];
		if (buttons.length){
			setupButtonsCompare(buttons);
		}else return;
	}else{
		const buttons = document.querySelectorAll(selectorscompare.button) || [];
		if (buttons.length){
			setupButtonsCompare(buttons);
		}else return;	
	}
	const event = new CustomEvent('shopify-compare:init-buttons', {
		detail: { compare: getCompare() }
	});
	document.dispatchEvent(event);
	$(selectorscompare.button).each(function(event){
		if($(this).hasClass('active')){
			var $parent = $(this).closest('.button-compare');
			$parent.attr('data-title',window.strings.remove_compare);
		}else{
			var $parent = $(this).closest('.button-compare');
			$parent.attr('data-title',window.strings.compare);
		}
	});
};
const removeCompare = () => {
	const buttons = document.querySelectorAll(selectorscompare.remove) || [];
	if (buttons.length){
		removeButtonsCompare(buttons);
	}
	else return;
	const event = new CustomEvent('shopify-compare:init-buttons', {
		detail: { compare: getCompare() }
	});
	document.dispatchEvent(event);
};
const getCompare = () => {
	const compare = localStorage.getItem(LOCAL_STORAGE_COMPARE_KEY) || false;
	if (compare) return compare.split(LOCAL_STORAGE_DELIMITER_COMPARE);
	return [];
};
const setCompare = (array) => {
	const compare = array.join(LOCAL_STORAGE_DELIMITER_COMPARE);
	if (array.length) localStorage.setItem(LOCAL_STORAGE_COMPARE_KEY, compare);
		else localStorage.removeItem(LOCAL_STORAGE_COMPARE_KEY);
		const event = new CustomEvent('shopify-compare:updated', {
		detail: { compare: array }
	});
	document.dispatchEvent(event);
	return compare;
};
const updateCompare = (handle) => {
	const compare = getCompare();
	const indexInCompare = compare.indexOf(handle);
	const table = document.querySelector(selectorscompare.table);
	if (indexInCompare === -1) {
		compare.push(handle);
	}else{
		compare.splice(indexInCompare, 1);
	}
	if(compare.length === 0){
		table.classList.remove(GRID_LOADED_CLASS_COMPARE);
	}else{
		table.classList.add(GRID_LOADED_CLASS_COMPARE);
		$('.show-compare .count',selectorscompare.table).html(compare.length);
	}
	return setCompare(compare);
};
const compareContains = (handle) => {
	const compare = getCompare();
	return compare.includes(handle);
};
const resetCompare = () => {
	return setCompare([]);
};

$(document).ready(function() {
	wpbingo.init();
	var sections = new wpbingo.Sections();
	sections.register('product-template', wpbingo.Product);
	sections.register('header-section', wpbingo.HeaderSection);
	sections.register('header-topbar-section', wpbingo.HeaderSection);
	sections.register('product-recommendations', wpbingo.ProductRecommendations);
	sections.register('login-register', wpbingo.LoginRegister);
	sections.register('search', wpbingo.Search);
	if ($('body').hasClass('template-product') ) {
		sections.register('product-template', Shopify.Products.showRecentlyViewed());
		sections.register('product-template', Shopify.Products.recordRecentlyViewed());
		var $element = $(".product-single");
		var _data = $element.data();
		if(_data.layout_thumb =="slider"){
			$('.product-media__wrapper--video iframe').css("width",$(".product-single__main-media #slick-slide11 .mfp-image").width());
			$('.product-media__wrapper--video iframe').css("height",$(".product-single__main-media #slick-slide11 .mfp-image").height());
			$('.js-product-media-item model-viewer').css("width",$(".product-single__main-media #slick-slide11 .mfp-image").width());
			$('.js-product-media-item model-viewer').css("height",$(".product-single__main-media #slick-slide11 .mfp-image").height());
		}
	}
	$('#pre-loading').addClass('loading-done');
	setTimeout(function() {
		$('#pre-loading').removeClass('loading-done');
		$('#pre-loading').removeClass('loading-page');
	}, 1300);
	if (window.Shopify.designMode) {
		$('body').addClass('designMode_active');
		document.addEventListener('shopify:section:load', function(event) {
			var sectionId = '.wpbingo-section--'+event.detail.sectionId;
			if ($('.js-carousel',sectionId).length > 0) {
				wpbingo.elementslickCarousel($('.js-carousel',sectionId));
			}
			if ($('[data-countdown]',sectionId).length > 0) {
				wpbingo.countdown();
			}
			if ($('.custom-product-card',sectionId).length > 0) {
				$('.custom-product-card',sectionId).addClass('active');
			}else{
				$('.custom-product-card').removeClass('active');
			}
		});
		document.addEventListener('shopify:section:select', function(event) {
			var sectionId = '.wpbingo-section--'+event.detail.sectionId;
			if ($('.custom-product-card',sectionId).length > 0) {
				$('.custom-product-card',sectionId).addClass('active');
			}else{
				$('.custom-product-card').removeClass('active');
			}
		});
		document.addEventListener('shopify:block:select', function (event) {
			var id = $('#'+event.detail.blockId+'');
			if (id.length > 0) {
				if ($('.js-carousel',sectionId).length > 0) {
					wpbingo.elementslickCarousel($('.js-carousel',sectionId));
				}
				$('.block-card-mobi').removeClass('active');
				$('.product-card__buttons').addClass('hidden');
				id.addClass('active');
			}else{
				$('.block-card-mobi').removeClass('active');
				$('.product-card__buttons').removeClass('hidden');
			}
		});
	}
});

(function () {
  // Store original positions and styles for nector widget
  let nectorOriginal = {
    parent: null,
    nextSibling: null,
    containerStyles: null,
    btnContainerStyles: null,
    btnStyles: null,
    svgStyles: null
  };
  
  let nectorReady = false;
  let isScrolling = false;
  let scrollTimeout = null;

  function saveNectorStyles(nector) {
    if (!nector || nectorReady) return;
    
    nectorOriginal.parent = nector.parentNode;
    nectorOriginal.nextSibling = nector.nextSibling;
    
    // Save container styles
    nectorOriginal.containerStyles = {
      position: nector.style.position || '',
      bottom: nector.style.bottom || '',
      left: nector.style.left || '',
      right: nector.style.right || '',
      marginRight: nector.style.marginRight || '',
      top: nector.style.top || '',
      width: nector.style.width || '',
      height: nector.style.height || '',
      zIndex: nector.style.zIndex || ''
    };
    
    // Find and save inner elements' styles
    const nectorBtnContainer = nector.querySelector('.nector-btn-container');
    if (nectorBtnContainer) {
      nectorOriginal.btnContainerStyles = {
        borderRadius: nectorBtnContainer.style.borderRadius || '',
        border: nectorBtnContainer.style.border || '',
        padding: nectorBtnContainer.style.padding || '',
        margin: nectorBtnContainer.style.margin || ''
      };
    }
    
    const nectorBtn = nector.querySelector('.nector-btn');
    if (nectorBtn) {
      nectorOriginal.btnStyles = {
        display: nectorBtn.style.display || '',
        justifyContent: nectorBtn.style.justifyContent || '',
        alignItems: nectorBtn.style.alignItems || '',
        flexDirection: nectorBtn.style.flexDirection || '',
        width: nectorBtn.style.width || '',
        height: nectorBtn.style.height || '',
        backgroundColor: nectorBtn.style.backgroundColor || ''
      };
      
      const svgElement = nectorBtn.querySelector('svg');
      if (svgElement) {
        nectorOriginal.svgStyles = {
          fontSize: svgElement.style.fontSize || '',
          width: svgElement.style.width || '',
          height: svgElement.style.height || '',
          fill: svgElement.style.fill || ''
        };
      }
    }
    
    nectorReady = true;
  }

  function setupNectorStickyMove() {
    const stickyBar = document.querySelector(".sticky-cart-single");
    const content = stickyBar?.querySelector(".content");

    if (!stickyBar || !content) return;

    // Initial check for nector widget
    const nector = document.getElementById("nector-rewards-widget-container") ||
                   document.querySelector(".nector-rewards-widget-container");

    // Save styles only once
    if (nector && !nectorReady) saveNectorStyles(nector);

    // Throttled scroll handler
    function handleScroll() {
      if (isScrolling) return;
      isScrolling = true;
      
      requestAnimationFrame(() => {
        const isSticky = stickyBar.classList.contains("sticky");
        const currentNector = document.getElementById("nector-rewards-widget-container") ||
                             document.querySelector(".nector-rewards-widget-container");

        // ===== STICKY MODE =====
        if (isSticky) {
          // Move Nector widget into sticky bar
          if (currentNector && nectorReady && content.firstChild !== currentNector) {
            content.insertBefore(currentNector, content.firstChild);
            
            // Apply sticky bar styles
            currentNector.style.position = "relative";
            currentNector.style.bottom = "0";
            currentNector.style.left = "0";
            currentNector.style.right = "auto";
            currentNector.style.marginRight = "8px";
            currentNector.style.top = "auto";
            currentNector.style.zIndex = "auto";
            
            // Apply nector specific styles
            const nectorBtnContainer = currentNector.querySelector('.nector-btn-container');
            if (nectorBtnContainer) {
              nectorBtnContainer.style.borderRadius = '6px';
            }
            
            const nectorBtn = currentNector.querySelector('.nector-btn');
            if (nectorBtn) {
              nectorBtn.style.display = 'flex';
              nectorBtn.style.justifyContent = 'center';
              nectorBtn.style.alignItems = 'center';
              nectorBtn.style.height = '45px';
              
              const svgElement = nectorBtn.querySelector('svg');
              if (svgElement) {
                svgElement.style.fontSize = '22px';
              }
            }
          }
        }
        // ===== NORMAL FLOATING MODE =====
        else {
          // Restore Nector widget to original position
          if (currentNector && nectorReady && nectorOriginal.parent && 
              !nectorOriginal.parent.contains(currentNector)) {
            
            // Restore to original position
            if (nectorOriginal.nextSibling && nectorOriginal.nextSibling.parentNode) {
              nectorOriginal.parent.insertBefore(currentNector, nectorOriginal.nextSibling);
            } else {
              nectorOriginal.parent.appendChild(currentNector);
            }
            
            // Restore styles
            if (nectorOriginal.containerStyles) {
              Object.keys(nectorOriginal.containerStyles).forEach(key => {
                currentNector.style[key] = nectorOriginal.containerStyles[key];
              });
            }
            
            // Restore inner elements' styles
            if (nectorOriginal.btnContainerStyles) {
              const nectorBtnContainer = currentNector.querySelector('.nector-btn-container');
              if (nectorBtnContainer) {
                Object.keys(nectorOriginal.btnContainerStyles).forEach(key => {
                  nectorBtnContainer.style[key] = nectorOriginal.btnContainerStyles[key];
                });
              }
            }
            
            if (nectorOriginal.btnStyles) {
              const nectorBtn = currentNector.querySelector('.nector-btn');
              if (nectorBtn) {
                Object.keys(nectorOriginal.btnStyles).forEach(key => {
                  nectorBtn.style[key] = nectorOriginal.btnStyles[key];
                });
                
                if (nectorOriginal.svgStyles) {
                  const svgElement = nectorBtn.querySelector('svg');
                  if (svgElement) {
                    Object.keys(nectorOriginal.svgStyles).forEach(key => {
                      svgElement.style[key] = nectorOriginal.svgStyles[key];
                    });
                  }
                }
              }
            }
          }
        }
        
        isScrolling = false;
      });
    }

    // Use throttled scroll handler
    window.addEventListener("scroll", function() {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 50);
    }, { passive: true });

    // Initial check
    setTimeout(handleScroll, 100);
  }

  // ===== WATCH FOR 3RD PARTY LOAD =====
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const nector = document.getElementById("nector-rewards-widget-container") ||
                       document.querySelector(".nector-rewards-widget-container");
        
        if (nector && !nectorReady) {
          setupNectorStickyMove();
          observer.disconnect();
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Run once in case already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNectorStickyMove);
  } else {
    setupNectorStickyMove();
  }
})();


// WhatsApp link setup
document.addEventListener("DOMContentLoaded", function () {
  const link = document.getElementById("whatsapp-link");

  if (!link) return;

  // If it's a product page, Shopify exposes this
  if (window.meta && meta.product) {
    const title = meta.product.handle;
    const url = window.location.href;
    const msg = `Hi I want more information about this product:\n${title}\n${url}`;
    link.href = "https://wa.me/919227100828?text=" + encodeURIComponent(msg);
  } else {
    // Other pages
    const msg = `Hi I want more information about your products ${window.location.href}`;
    link.href = "https://wa.me/919227100828?text=" + encodeURIComponent(msg);
  }
});

// WhatsApp sticky movement
window.addEventListener("scroll", function () {
  const stickyBar = document.querySelector(".sticky-cart-single");
  const whatsapp = document.getElementById("whatsapp-btn");

  if (!stickyBar || !whatsapp) return;

  if (stickyBar.classList.contains("sticky")) {
    // move into sticky bar
    stickyBar.querySelector(".content").appendChild(whatsapp);
    whatsapp.style.position = "relative";
    whatsapp.style.bottom = "0";
    whatsapp.style.left = "0";
    whatsapp.style.marginLeft = "10px";
  } else {
    // move back to floating
    document.body.appendChild(whatsapp);
    whatsapp.style.position = "fixed";
    whatsapp.style.bottom = "20px";
    whatsapp.style.left = "20px";
  }
});

function replaceSnizeButtonText() {
  if (window.innerWidth <= 820) {
    document.querySelectorAll(
      "#snize_results.snize-mobile-design.snize-new-version #snize-search-results-grid-mode .snize-button"
    ).forEach(function (btn) {
      btn.textContent = "❯";
    });
  }
}
document.addEventListener("DOMContentLoaded", replaceSnizeButtonText);
document.addEventListener("snize:loaded", replaceSnizeButtonText);

(function waitForSlick() {
  if (window.innerWidth > 1024) return;

  var checkInterval = setInterval(function() {
    var $sliders = $('.js-product-media-group.slick-initialized');
    if ($sliders.length > 0) {
      clearInterval(checkInterval);

      function applyBar($slider, $bar, current, total) {
        var fillWidth = 100 / total;
        $bar.css({
          'width': fillWidth + '%',
          'transform': 'translateX(' + (current * 100) + '%)'
        });
      }

      $sliders.each(function() {
        var $slider = $(this);
        var $bar = $slider
          .closest('.product-single__main-media')
          .find('.slider-track-fill');

        // Set initial position instantly (no transition)
        $bar.css('transition', 'none');
        applyBar($slider, $bar, 0, $slider.slick('getSlick').slideCount);
        setTimeout(function() {
          $bar.css('transition', 'transform 0.2s ease');
        }, 50);

        $slider.off('beforeChange.progressBar');
        $slider.on('beforeChange.progressBar', function(e, slick, currentSlide, nextSlide) {
          applyBar($slider, $bar, nextSlide, slick.slideCount);
        });
      });

      // For variant switches
      $(document).off('init.progressBar', '.js-product-media-group');
      $(document).on('init.progressBar', '.js-product-media-group', function(e, slick) {
        var $slider = $(this);
        var $bar = $slider
          .closest('.product-single__main-media')
          .find('.slider-track-fill');
        applyBar($slider, $bar, 0, slick.slideCount);

        $slider.off('beforeChange.progressBar');
        $slider.on('beforeChange.progressBar', function(e, slick, currentSlide, nextSlide) {
          applyBar($slider, $bar, nextSlide, slick.slideCount);
        });
      });
    }
  }, 200);

  setTimeout(function() { clearInterval(checkInterval); }, 10000);
})();
let modelLoaded = false;

function show3DModelPopup() {
  const overlay = document.getElementById("model-popup-overlay");
  const iframe = document.getElementById("model-iframe");
  
  // Get product code from data attribute
  const productCode = document.querySelector('.view-3d-model-btn-wrapper').getAttribute('data-product-code');
  
  if (!productCode) {
    console.error('Product code not found');
    return;
  }
  
  const MODEL_URL = `https://ijewel3d.com/drive/files/${productCode}/embedded?slug=${productCode}&isTitle=false&isAutoplay=true&isEnabledZoom=false&isShare=false`;

  // Load iframe only first time
  if (!modelLoaded) {
    iframe.src = MODEL_URL;
    modelLoaded = true;
  } else {
    // If already loaded, just show the popup
    overlay.style.visibility = "visible";
    overlay.style.opacity = "1";
    document.body.style.overflow = "hidden";
  }

  overlay.style.visibility = "visible";
  overlay.style.opacity = "1";
  document.body.style.overflow = "hidden";
}

function close3DModelPopup() {
  const overlay = document.getElementById("model-popup-overlay");

  overlay.style.opacity = "0";
  overlay.style.visibility = "hidden";
  document.body.style.overflow = "auto";
}

/* Close when clicking outside */
document
  .getElementById("model-popup-overlay")
  .addEventListener("click", function (e) {
    if (e.target === this) close3DModelPopup();
  });

/* Close with Escape key */
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") close3DModelPopup();
});

/* Optional: preload iframe after page load (faster first open) */
window.addEventListener("load", function () {
  const view3dWrapper = document.querySelector('.view-3d-model-btn-wrapper');
  if (view3dWrapper) {
    const productCode = view3dWrapper.getAttribute('data-product-code');
    if (productCode) {
      const iframe = document.getElementById("model-iframe");
      const MODEL_URL = `https://ijewel3d.com/drive/files/${productCode}/embedded?slug=${productCode}&isTitle=false&isAutoplay=true&isEnabledZoom=false&isShare=false`;
      iframe.src = MODEL_URL;
      modelLoaded = true;
    }
  }
});
