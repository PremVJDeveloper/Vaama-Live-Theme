(function () {
  'use strict';

  var RECENT_KEY  = 'csp_recent_searches';
  var HISTORY_KEY = 'csp_product_history';
  var MAX_RECENT  = 6;
  var MAX_HISTORY = 6;
  var debounceTimer = null;

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function debounce(fn, ms) { clearTimeout(debounceTimer); debounceTimer = setTimeout(fn, ms); }
  function getRecent()  { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch(e) { return []; } }
  function getHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { return []; } }
  function saveRecent(q) {
    var list = getRecent();
    list = [q].concat(list.filter(function(i){ return i !== q; })).slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  }

  // ── Backdrop ─────────────────────────────────
  var _backdrop = null;
  function getBackdrop() {
    if (_backdrop) return _backdrop;
    _backdrop = document.createElement('div');
    _backdrop.className = 'csp-backdrop--desktop';
    document.body.appendChild(_backdrop);
    _backdrop.addEventListener('click', function() { closeAllDesktop(); });
    return _backdrop;
  }
  function closeAllDesktop() {
    document.querySelectorAll('.csp-panel--desktop').forEach(function(p){ p.classList.remove('is-open'); });
    var bd = document.querySelector('.csp-backdrop--desktop');
    if (bd) bd.classList.remove('is-active');
  }

  // ── Trending HTML builder ─────────────────────
  function buildTrendingHTML(data) {
    if (!data || !data.length) return '';
    return data.map(function(item) {
      return '<li class="csp-trending-item">' +
        '<a href="' + esc(item.url || '#') + '" class="csp-trending-link">' +
          '<span class="csp-trending-icon">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28365b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>' +
              '<polyline points="17 6 23 6 23 12"></polyline>' +
            '</svg>' +
          '</span>' +
          '<span class="csp-trending-label">' + esc(item.label) + '</span>' +
          (item.image ? '<img class="csp-trending-thumb" src="' + esc(item.image) + '" alt="' + esc(item.label) + '" loading="lazy" width="42" height="42">' : '') +
        '</a>' +
      '</li>';
    }).join('');
  }

  // ── Suggested product HTML builder ───────────
  function buildSuggestedHTML(data) {
    if (!data || !data.length) return '';
    return data.map(function(p) {
      return '<a href="' + esc(p.url) + '" class="csp-product-card">' +
        '<div class="csp-product-card__img">' +
          (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy">' : '') +
        '</div>' +
        '<div class="csp-product-card__body">' +
          '<p class="csp-product-card__name">' + esc(p.title) + '</p>' +
          '<p class="csp-product-card__price">' + esc(p.price) + '</p>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  // ── SearchBar class ───────────────────────────
  function SearchBar(bar) {
    this.bar       = bar;
    this.loc       = bar.classList.contains('custom-search-bar--mobile') ? 'mobile' : 'desktop';
    this.panel     = bar.querySelector('.csp-panel');
    this.isOpen    = false;
    this._guard    = false;

    if (!this.panel) { console.warn('[CSP] no panel in', bar); return; }

    this._populateStatic();
    this._renderRecent();
    this._renderHistory();
    this._bind();
  }

  SearchBar.prototype = {
    el: function(id) {
      return this.panel.querySelector('#Csp' + id + '--' + this.loc);
    },

    // ── Populate trending + suggested from window globals ──
    _populateStatic: function() {
      var trending  = window.CspTrendingData  || [];
      var suggested = window.CspSuggestedData || [];
      var loc = this.loc;

      // Trending
      var tList = this.el('TrendingList');
      var tSec  = this.el('TrendingSection');
      if (tList) {
        var html = buildTrendingHTML(trending);
        if (html) {
          tList.innerHTML = html;
          if (tSec) tSec.style.display = 'block';
        } else {
          if (tSec) tSec.style.display = 'none';
        }
      }

      // Suggested
      var sList = this.el('SuggestedList');
      var sSec  = this.el('SuggestedSection');
      if (sList) {
        var shtml = buildSuggestedHTML(suggested);
        if (shtml) {
          sList.innerHTML = shtml;
          if (sSec) sSec.style.display = 'block';
        } else {
          if (sSec) sSec.style.display = 'none';
        }
      }
    },

    _renderRecent: function() {
      var sec  = this.el('RecentSection');
      var cont = this.el('RecentChips');
      if (!cont) return;
      var list = getRecent();
      if (!list.length) { if (sec) sec.style.display = 'none'; return; }
      if (sec) sec.style.display = 'block';
      cont.innerHTML = list.map(function(t) {
        return '<a href="/search?type=product&q=' + encodeURIComponent(t) + '" class="csp-chip">' + esc(t) + '</a>';
      }).join('');
    },

    _renderHistory: function() {
      var sec   = this.el('HistorySection');
      var track = this.el('HistoryTrack');
      if (!track) return;
      var list = getHistory();
      if (!list.length) { if (sec) sec.style.display = 'none'; return; }
      if (sec) sec.style.display = 'block';
      track.innerHTML = list.map(function(item) {
        return '<a href="' + esc(item.url) + '" class="csp-history-card">' +
          '<div class="csp-history-card__img">' +
            (item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy">' : '') +
          '</div>' +
          '<p class="csp-history-card__title">' + esc(item.title) + '</p>' +
        '</a>';
      }).join('');
    },

    _bind: function() {
      var self = this;
      var bar = this.bar, panel = this.panel, loc = this.loc;

      // Mobile trigger
      var trigger = bar.querySelector('.mobile-search-trigger');
      if (trigger) {
        trigger.addEventListener('click', function(e) {
          e.stopPropagation();
          self._open();
          setTimeout(function() {
            var mi = panel.querySelector('.csp-mobile-input');
            if (mi) mi.focus();
          }, 350);
        });
      }

      // Desktop input — open on focus only, block the click from propagating
      var inputs = bar.querySelectorAll('.custom-search-bar__input, .csp-mobile-input');
      inputs.forEach(function(input) {
        input.addEventListener('input', function() {
          var wrap = bar.querySelector('.search-placeholder-wrap');
          if (wrap) wrap.style.opacity = input.value.length ? '0' : '';
        });

        if (loc === 'desktop') {
          // Intercept the mousedown BEFORE focus fires — stopPropagation here
          // so the document click listener never sees this event
          input.addEventListener('mousedown', function(e) {
            e.stopPropagation();
          });
          input.addEventListener('focus', function(e) {
            if (!self.isOpen) self._open();
          });
        }
        input.addEventListener('input', function(e) {
          var val = e.target.value;
          self._syncInputs(val);
          self._toggleClear(val);
          debounce(function() { self._onType(val.trim()); }, 280);
        });
      });

      // Block ALL events inside panel from reaching document
      panel.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        if (e.target.tagName !== 'INPUT') e.preventDefault();
      });
      panel.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      panel.addEventListener('wheel', function(e) {
        // Allow panel to scroll but stop propagation to body
        e.stopPropagation();
      }, { passive: true });

      // Close buttons
      panel.querySelectorAll('.csp-close-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          self._close();
        });
      });

      // Clear buttons
      bar.querySelectorAll('.custom-search-bar__clear, .csp-mobile-clear').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          self._setVal('');
          self._toggleClear('');
          self._showInitial();
              // Reset placeholder opacity when cleared
    var wrap = bar.querySelector('.search-placeholder-wrap');
    if (wrap) wrap.style.opacity = '';

        });
      });

      // Forms
      bar.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function(e) { self._onSubmit(e); });
      });

      // ESC
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') self._close();
      });

      // Click outside — desktop only
      // Use mousedown not click, so it fires before focus on other elements
      if (loc === 'desktop') {
        document.addEventListener('mousedown', function(e) {
          if (self.isOpen && !bar.contains(e.target) && !panel.contains(e.target)) {
            self._close();
          }
        });
      }
    },

    _open: function() {
      var self = this;
      this.isOpen = true;
      this.panel.classList.add('is-open');

      // Lock BOTH html and body — Shopify themes can scroll either one
      var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      // Compensate for scrollbar disappearing to prevent layout jump
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px';
        // Also compensate fixed header
        var header = document.querySelector('.bwp-header');
        if (header) header.style.paddingRight = scrollbarWidth + 'px';
      }

      if (this.loc === 'desktop') {
        getBackdrop().classList.add('is-active');
      }

      this._renderRecent();
      this._renderHistory();

      if (this._getVal().length > 0) {
        this._onType(this._getVal());
      } else {
        this._showInitial();
      }
    },

    _close: function() {
      this.isOpen = false;
      this.panel.classList.remove('is-open');

      // Blur the input so clicking the bar again re-triggers focus → open
      var input = this.bar.querySelector('.custom-search-bar__input, .csp-mobile-input');
      if (input) input.blur();

      // Restore scroll on both
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      var header = document.querySelector('.bwp-header');
      if (header) header.style.paddingRight = '';

      if (this.loc === 'desktop') {
        var bd = document.querySelector('.csp-backdrop--desktop');
        if (bd) bd.classList.remove('is-active');
      }
    },
    _getVal: function() {
      var i = this.bar.querySelector('.custom-search-bar__input, .csp-mobile-input');
      return i ? i.value : '';
    },
    _setVal: function(v) {
      this.bar.querySelectorAll('.custom-search-bar__input, .csp-mobile-input').forEach(function(i){ i.value = v; });
    },
    _syncInputs: function(v) {
      this.bar.querySelectorAll('.custom-search-bar__input, .csp-mobile-input').forEach(function(i){ if(i.value!==v) i.value=v; });
    },
    _toggleClear: function(v) {
      this.bar.querySelectorAll('.custom-search-bar__clear, .csp-mobile-clear').forEach(function(b){
        b.style.display = v.length ? 'flex' : 'none';
        
      });
        var searchIcon = this.bar.querySelector('.search-icon-inline');
          if (searchIcon) searchIcon.style.display = v.length ? 'none' : '';
    },

    _showInitial: function() {
      var pred = this.el('Predictive');
      var init = this.el('Initial');
      if (pred) pred.style.display = 'none';
      if (init) init.style.display = 'block';
    },
    _showPredictive: function() {
      var pred = this.el('Predictive');
      var init = this.el('Initial');
      if (pred) pred.style.display = 'block';
      if (init) init.style.display = 'none';
    },

    _onType: function(query) {
      if (!query) { this._showInitial(); return; }
      if (query.length < 2) return;
      this._fetchPredictive(query);
    },

    _fetchPredictive: function(query) {
      var self = this;
      var url = '/search/suggest.json?q=' + encodeURIComponent(query) +
        '&resources[type]=product,query,collection,page&resources[limit]=10' +
        '&resources[options][unavailable_products]=last' +
        '&resources[options][fields]=title,vendor,product_type,variants.title,tag';
      fetch(url)
        .then(function(r){ return r.json(); })
        .then(function(data) {
          var r = data.resources.results;
          self._renderPredictive(r.queries||[], r.products||[], r.collections||[], r.pages||[], query);
        })
        .catch(function(err){ console.error('[CSP]', err); });
    },

    _renderPredictive: function(suggestions, products, collections, pages, query) {
      if (!suggestions.length && !products.length) { this._showInitial(); return; }
      this._showPredictive();

      // Suggestions
      var sugSec = this.el('SuggestSection');
      var sugEl  = this.el('SuggestList');
      if (sugEl) {
        if (suggestions.length) {
          if (sugSec) sugSec.style.display = 'block';
          sugEl.innerHTML = suggestions.slice(0, 6).map(function(s) {
            return '<a href="/search?type=product&q=' + encodeURIComponent(s.text) + '" class="csp-suggest-link">' + esc(s.text) + '</a>';
          }).join('');
        } else {
          if (sugSec) sugSec.style.display = 'none';
        }
      }

      // Categories
      var catSec = this.el('CatSection');
      var catEl  = this.el('CatList');
      if (catEl) {
        if (collections.length) {
          if (catSec) catSec.style.display = 'block';
          catEl.innerHTML = collections.slice(0, 4).map(function(c) {
            return '<a href="' + esc(c.url) + '" class="csp-suggest-link csp-suggest-link--cat">' + esc(c.title) + '</a>';
          }).join('');
        } else {
          if (catSec) catSec.style.display = 'none';
        }
      }

      // Pages
      var pgSec = this.el('PagesSection');
      var pgEl  = this.el('PagesList');
      if (pgEl) {
        if (pages.length) {
          if (pgSec) pgSec.style.display = 'block';
          pgEl.innerHTML = pages.slice(0, 5).map(function(p) {
            return '<a href="' + esc(p.url) + '" class="csp-suggest-link csp-suggest-link--page">' +
              '<span class="csp-page-icon">ⓘ</span>' + esc(p.title) + '</a>';
          }).join('');
        } else {
          if (pgSec) pgSec.style.display = 'none';
        }
      }

      // Products
      var prodSec = this.el('ProductSection');
      var prodEl  = this.el('ProductList');
      if (prodEl) {
        if (products.length) {
          if (prodSec) prodSec.style.display = 'block';
          prodEl.innerHTML = products.slice(0, 9).map(function(p) {
            var desc = p.body_html ? p.body_html.replace(/<[^>]*>/g,'').trim().slice(0,80) + '…' : '';
            var cmp = (p.compare_at_price_max && p.compare_at_price_max > p.price)
              ? '<span class="csp-card__compare">' + esc(p.compare_at_price_max_formatted||'') + '</span>' : '';
            return '<a href="' + esc(p.url) + '" class="csp-product-card">' +
              '<div class="csp-product-card__img">' +
                (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy">' : '') +
              '</div>' +
              '<div class="csp-product-card__body">' +
                '<p class="csp-product-card__name">' + esc(p.title) + '</p>' +
                (desc ? '<p class="csp-product-card__desc">' + esc(desc) + '</p>' : '') +
                '<div class="csp-product-card__prices">' +
                  '<span class="csp-product-card__price">' + p.price + '</span>' + cmp +
                '</div>' +
              '</div>' +
            '</a>';
          }).join('');
        } else {
          if (prodSec) prodSec.style.display = 'none';
        }
      }

      // Footer
      var footEl  = this.el('Footer');
      var vaEl    = this.el('ViewAll');
      var cntEl   = this.el('Count');
      if (footEl) footEl.style.display = products.length ? 'block' : 'none';
      if (vaEl)   vaEl.href = '/search?type=product&q=' + encodeURIComponent(query);
      if (cntEl)  cntEl.textContent = products.length;
    },

    _onSubmit: function(e) {
      var query = this._getVal().trim();
      if (!query) { e.preventDefault(); return; }
      saveRecent(query);
      if (/^\d+$/.test(query)) {
        e.preventDefault();
        var p = parseInt(query);
        window.location.href = '/search?type=product&q=filter.v.price.gte=' +
          Math.floor(p*0.8) + '&filter.v.price.lte=' + Math.ceil(p*1.2) + '&sort_by=price-ascending';
      }
    }
  };

  // ── Product view tracking ─────────────────────
  function trackProductView() {
    if (!window.location.pathname.includes('/products/')) return;
    var jsonEl = document.querySelector('[data-product-json]');
    if (!jsonEl) return;
    try {
      var product = JSON.parse(jsonEl.textContent || jsonEl.innerHTML);
      var item = {
        id:    product.id,
        title: product.title,
        url:   window.location.pathname,
        image: product.featured_image || null,
        price: (window.Shopify && window.Shopify.formatMoney)
          ? window.Shopify.formatMoney(product.price)
          : '\u20B9' + (product.price/100).toFixed(2)
      };
      var list = getHistory();
      list = [item].concat(list.filter(function(i){ return i.id !== item.id; })).slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch(e) { console.error('[CSP] track:', e); }
  }

  // ── Boot ─────────────────────────────────────
  function init() {
    // Wait a tick so window.CspTrendingData is definitely set
    setTimeout(function() {
      document.querySelectorAll('.custom-search-bar').forEach(function(bar) {
        new SearchBar(bar);
      });
    }, 0);
    trackProductView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();