'use strict';
(function () {
  var SOURCE = 'https://iptv-org.github.io/iptv/index.m3u';
  var lists = [{id:'default', name:'IPTV.org', url:SOURCE}], active = 'default', loadId = 0, manual = [], panelMode = 'list', editingId = null;
  try {
    var storedChannels = JSON.parse(localStorage.getItem('freetv.manualChannels') || '[]');
    if (Array.isArray(storedChannels)) manual = storedChannels.filter(function (c) { return c && typeof c.name === 'string' && /^https?:\/\/[^\s]+$/i.test(c.url); });
  } catch (e) {}
  try {
    var stored = JSON.parse(localStorage.getItem('freetv.lists') || 'null');
    if (Array.isArray(stored)) stored.forEach(function (list) {
      if (list && list.id === 'default' && typeof list.name === 'string' && /^https?:\/\/[^\s]+$/i.test(list.url)) { lists[0] = list; return; }
      if (list && typeof list.id === 'string' && list.id !== 'default' && typeof list.name === 'string' && /^https?:\/\//i.test(list.url) && !lists.some(function (item) { return item.id === list.id; })) lists.push(list);
    });
    var previousList = localStorage.getItem('freetv.activeList');
    if (previousList === 'manual' || lists.some(function (list) { return list.id === previousList; })) active = previousList;
  } catch (e) {}
  try {
    if (localStorage.getItem('freetv.mexicoSeeded') !== '1') {
      var mexicoUrl = 'https://raw.githubusercontent.com/CharlieII/IPTV_mexico/refs/heads/main/lista.m3u';
      var mexico = lists.filter(function (list) { return list.url === mexicoUrl; })[0];
      if (!mexico) { mexico = {id:'mexico-charlie',name:'IPTV México',url:mexicoUrl}; lists.push(mexico); }
      active = mexico.id;
      localStorage.setItem('freetv.lists', JSON.stringify(lists));
      localStorage.setItem('freetv.activeList', active);
      localStorage.setItem('freetv.mexicoSeeded', '1');
    }
  } catch (e) {}
  var all = [], filtered = [], current = null, page = 0, onlyFavorites = false, pageSize = 50;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem('freetv.favorites') || '{}') || {}; } catch (e) {}
  function el(id) { return document.getElementById(id); }
  function selectedList() { return lists.filter(function (list) { return list.id === active; })[0]; }
  function persistLists() {
    try { localStorage.setItem('freetv.lists', JSON.stringify(lists)); localStorage.setItem('freetv.activeList', active); return true; }
    catch (e) { el('list-error').textContent = 'No se pudo guardar. El almacenamiento de la TV está lleno o no está disponible.'; return false; }
  }
  function renderLists() {
    el('playlist').textContent = '';
    lists.forEach(function (list) { var option = document.createElement('option'); option.value = list.id; option.textContent = list.name; el('playlist').appendChild(option); });
    var mine = document.createElement('option'); mine.value = 'manual'; mine.textContent = 'Mis canales (' + manual.length + ')'; el('playlist').appendChild(mine);
    el('playlist').value = active; el('remove-list').disabled = active === 'default' || active === 'manual';
    el('edit-list').disabled = active === 'manual';
  }
  function persistManual() {
    try { localStorage.setItem('freetv.manualChannels', JSON.stringify(manual)); return true; }
    catch (e) { el('list-error').textContent = 'No se pudo guardar el canal. Revisa el almacenamiento de la TV.'; return false; }
  }
  function openPanel(mode) {
    if (mode === 'edit' && active === 'manual') return;
    editingId = mode === 'edit' ? active : null;
    panelMode = mode; el('list-error').textContent = ''; el('list-name').value = ''; el('list-url').value = '';
    el('panel-title').textContent = mode === 'channel' ? 'Agregar canal manual' : mode === 'edit' ? 'Editar lista' : 'Mis listas';
    el('submit-list').textContent = mode === 'edit' ? 'Guardar cambios' : 'Agregar y abrir';
    if (editingId) { el('list-name').value = selectedList().name; el('list-url').value = selectedList().url; }
    el('list-url').placeholder = mode === 'channel' ? 'https://ejemplo.com/canal.m3u8' : 'https://ejemplo.com/lista.m3u';
    el('remove-list').hidden = mode === 'channel'; el('list-panel').hidden = false; el('list-name').focus();
  }
  function closeLists() { el('list-panel').hidden = true; el('manage').focus(); }
  function parse(text) {
    var channels = [], info = null;
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (line.indexOf('#EXTINF:') === 0) {
        var comma = line.indexOf(',', line.lastIndexOf('"') + 1);
        if (comma < 0) comma = line.indexOf(',');
        var group = /group-title="([^"]*)"/.exec(line);
        var logo = /tvg-logo\s*=\s*["']([^"']*)["']/i.exec(line);
        info = { name: line.slice(comma + 1).trim() || 'Canal', group: group ? group[1] : 'Otros', logo:logo && /^https?:\/\/[^\s]+$/i.test(logo[1]) ? logo[1] : '' };
      } else if (/^https?:\/\//i.test(line) && info) {
        info.url = line; channels.push(info); info = null;
      }
    });
    return channels;
  }
  function request(url, done, fail) {
    var xhr = new XMLHttpRequest(); xhr.open('GET', url, true); xhr.timeout = 20000;
    xhr.onload = function () { if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText)) done(xhr.responseText); else fail(); };
    xhr.onerror = xhr.ontimeout = fail; xhr.send();
  }
  function load() {
    var token = ++loadId, list = selectedList();
    all = []; el('group').value = ''; el('search').value = ''; render();
    if (active === 'manual') {
      applyChannels(manual.map(function (c) { return {name:c.name,url:c.url,group:'Mis canales',manual:true}; }));
      el('message').textContent = manual.length ? 'Selecciona un canal para reproducirlo.' : 'Aún no tienes canales. Usa Agregar canal para guardar un enlace .m3u8.';
      return;
    }
    el('status').textContent = 'Actualizando catálogo…';
    request(list.url, function (text) { if (token === loadId) apply(text, false); }, function () {
      if (token !== loadId) return;
      if (list.id !== 'default') { el('status').textContent = 'No se pudo cargar ' + list.name + '. Revisa su URL o prueba otra lista.'; return; }
      if (list.url !== SOURCE) { el('status').textContent = 'No se pudo cargar la lista. Revisa su URL.'; return; }
      request('playlist.m3u', function (text) { if (token === loadId) apply(text, true); }, function () { if (token === loadId) el('status').textContent = 'No se pudo cargar la lista. Pulsa Actualizar lista.'; });
    });
  }
  function apply(text, bundled) {
    var parsed = parse(text);
    if (!parsed.length) { el('status').textContent = 'La lista no contiene canales válidos.'; return; }
    applyChannels(parsed);
    el('message').textContent = bundled ? 'Se usa la copia incluida: no se pudo actualizar la lista.' : 'Catálogo actualizado. La disponibilidad depende de cada canal y de tu región.';
  }
  function applyChannels(parsed) {
    all = parsed;
    el('group').textContent = '';
    var option = document.createElement('option'); option.value = ''; option.textContent = 'Todas las categorías'; el('group').appendChild(option);
    var groups = {}; all.forEach(function (c) { groups[c.group] = true; });
    Object.keys(groups).sort().forEach(function (g) { var o = document.createElement('option'); o.value = g; o.textContent = g; el('group').appendChild(o); });
    filter();
  }
  function filter() {
    var query = el('search').value.toLowerCase(), group = el('group').value;
    filtered = all.filter(function (c) { return (!query || c.name.toLowerCase().indexOf(query) >= 0) && (!group || c.group === group) && (!onlyFavorites || saved[c.url]); });
    page = 0; render();
  }
  function render() {
    el('channels').textContent = '';
    filtered.slice(page * pageSize, (page + 1) * pageSize).forEach(function (c) {
      var b = document.createElement('button'); b.className = 'channel';
      var badge = document.createElement('span'); badge.className = 'channel-badge'; badge.setAttribute('aria-hidden','true');
      var initials = document.createElement('span'); initials.className = 'channel-initials'; initials.textContent = c.name.slice(0,2).toUpperCase(); badge.appendChild(initials);
      if (c.logo) {
        var img = document.createElement('img'); img.alt = ''; img.className = 'channel-logo'; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
        img.onload = function () { initials.hidden = true; };
        img.onerror = function () { img.hidden = true; initials.hidden = false; };
        img.src = c.logo; badge.appendChild(img);
      }
      b.appendChild(badge);
      var details = document.createElement('span'); details.className = 'channel-details';
      var name = document.createElement('span'); name.className = 'channel-name'; name.textContent = (saved[c.url] ? '★ ' : '') + c.name; details.appendChild(name);
      var small = document.createElement('small'); small.textContent = c.group; details.appendChild(small); b.appendChild(details);
      b.onclick = function () { play(c); }; el('channels').appendChild(b);
    });
    el('status').textContent = filtered.length + ' canales';
    el('page').textContent = (page + 1) + ' / ' + Math.max(1, Math.ceil(filtered.length / pageSize));
    el('previous').disabled = page === 0; el('next').disabled = (page + 1) * pageSize >= filtered.length;
  }
  function play(c) {
    current = c; el('title').textContent = c.name; el('message').textContent = 'Conectando…';
    var v = el('video'); v.pause(); v.src = c.url; v.load();
    var promise = v.play(); if (promise && promise.catch) promise.catch(function () { el('message').textContent = 'No se pudo iniciar. Prueba con los controles del video o selecciona otro canal.'; });
    el('save').textContent = saved[c.url] ? 'Quitar favorito' : 'Guardar favorito';
    el('remove-channel').hidden = !c.manual;
  }
  el('video').onplaying = function () { el('message').textContent = 'Reproduciendo. Puedes activar pantalla completa.'; };
  el('video').onerror = function () { el('message').textContent = 'Canal no disponible o formato incompatible con esta TV. Prueba otro canal.'; };
  el('search').oninput = filter; el('group').onchange = filter;
  el('refresh').onclick = load;
  el('playlist').onchange = function () { active = this.value; persistLists(); renderLists(); load(); };
  el('manage').onclick = function () { openPanel('list'); };
  el('edit-list').onclick = function () { openPanel('edit'); };
  el('add-channel').onclick = function () { openPanel('channel'); };
  el('close-lists').onclick = closeLists;
  el('list-form').onsubmit = function (e) {
    e.preventDefault();
    var name = el('list-name').value.trim(), url = el('list-url').value.trim();
    if (!name || !/^https?:\/\/[^\s]+$/i.test(url)) { el('list-error').textContent = 'Escribe un nombre y una URL que empiece por http:// o https://.'; return; }
    if (panelMode === 'channel') {
      if (manual.some(function (c) { return c.url === url; })) { el('list-error').textContent = 'Este canal ya está guardado en Mis canales.'; return; }
      manual.push({name:name,url:url});
      if (!persistManual()) { manual.pop(); return; }
      active = 'manual'; persistLists(); onlyFavorites = false; el('favorites').textContent = 'Favoritos';
      renderLists(); closeLists(); load(); return;
    }
    if (lists.some(function (list) { return list.url === url && list.id !== editingId; })) { el('list-error').textContent = 'Esta URL ya está guardada.'; return; }
    if (panelMode === 'edit') {
      var index = -1;
      lists.forEach(function (list, i) { if (list.id === editingId) index = i; });
      if (index < 0) { el('list-error').textContent = 'La lista ya no existe.'; return; }
      var original = lists[index]; lists[index] = {id:original.id,name:name,url:url};
      if (!persistLists()) { lists[index] = original; return; }
      renderLists(); closeLists(); load(); return;
    }
    var before = active;
    active = 'list-' + Date.now(); lists.push({id:active, name:name, url:url});
    if (!persistLists()) { lists.pop(); active = before; return; }
    renderLists(); el('list-name').value = ''; el('list-url').value = ''; closeLists(); load();
  };
  el('remove-list').onclick = function () {
    if (active === 'default' || active === 'manual') return;
    var before = lists.slice(), previous = active;
    lists = lists.filter(function (list) { return list.id !== active; }); active = 'default';
    if (!persistLists()) { lists = before; active = previous; return; }
    renderLists(); closeLists(); load();
  };
  el('remove-channel').onclick = function () {
    if (!current || !current.manual) return;
    var before = manual.slice(), url = current.url;
    manual = manual.filter(function (c) { return c.url !== url; });
    if (!persistManual()) { manual = before; el('message').textContent = 'No se pudo eliminar el canal.'; return; }
    el('video').pause(); el('video').removeAttribute('src'); el('video').load(); current = null;
    el('title').textContent = 'Selecciona un canal'; el('remove-channel').hidden = true;
    renderLists(); if (active === 'manual') load(); el('add-channel').focus();
  };
  el('favorites').onclick = function () { onlyFavorites = !onlyFavorites; this.textContent = onlyFavorites ? 'Ver todos' : 'Favoritos'; filter(); };
  el('save').onclick = function () { if (!current) return; if (saved[current.url]) delete saved[current.url]; else saved[current.url] = true; try { localStorage.setItem('freetv.favorites', JSON.stringify(saved)); } catch (e) {} this.textContent = saved[current.url] ? 'Quitar favorito' : 'Guardar favorito'; render(); };
  el('previous').onclick = function () { if (page > 0) { page--; render(); } };
  el('next').onclick = function () { if ((page + 1) * pageSize < filtered.length) { page++; render(); } };
  function isFullscreen() {
    return document.body.classList.contains('player-fullscreen') || document.fullscreenElement || document.webkitFullscreenElement;
  }
  var exitFocus = null;
  function cancelExit() {
    el('exit-panel').hidden = true;
    if (exitFocus && exitFocus.getClientRects().length) exitFocus.focus(); else el('refresh').focus();
  }
  el('cancel-exit').onclick = cancelExit;
  el('confirm-exit').onclick = function () { window.close(); };
  function enterFullscreen() {
    if (!current) { el('message').textContent = 'Selecciona un canal primero.'; return; }
    document.body.classList.add('player-fullscreen');
    el('video').focus();
  }
  el('fullscreen').onclick = enterFullscreen;
  el('fullscreen-icon').onclick = enterFullscreen;
  el('preview-fullscreen').onclick = enterFullscreen;
  window.addEventListener('keydown', function (e) {
    if (e.keyCode === 461 || e.keyCode === 27) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      if (!el('exit-panel').hidden) { cancelExit(); return; }
      if (!el('list-panel').hidden) { closeLists(); return; }
      if (isFullscreen()) {
        document.body.classList.remove('player-fullscreen');
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
        el('fullscreen').focus();
      } else {
        exitFocus = document.activeElement;
        el('exit-panel').hidden = false;
        el('cancel-exit').focus();
      }
      return;
    }
    if (!el('exit-panel').hidden) {
      if (e.keyCode === 37 || e.keyCode === 39 || e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 9) {
        e.preventDefault();
        (document.activeElement === el('cancel-exit') ? el('confirm-exit') : el('cancel-exit')).focus();
      }
      return;
    }
    if (!isFullscreen() && document.activeElement === el('video') && e.keyCode === 13) {
      e.preventDefault(); enterFullscreen(); return;
    }
    if (e.keyCode < 37 || e.keyCode > 40 || isFullscreen()) return;
    if (document.activeElement.tagName === 'INPUT' && (e.keyCode === 40 || e.keyCode === 38)) {
      if (!el('list-panel').hidden) {
        var fields = Array.prototype.slice.call(el('list-panel').querySelectorAll('input,button:not(:disabled)'));
        var fieldIndex = fields.indexOf(document.activeElement), target = fields[fieldIndex + (e.keyCode === 40 ? 1 : -1)];
        if (target) { target.focus(); e.preventDefault(); }
      } else if (e.keyCode === 40) { var first = document.querySelector('.channel'); if (first) { first.focus(); e.preventDefault(); } }
      return;
    }
    if (/INPUT|SELECT|VIDEO/.test(document.activeElement.tagName)) return;
    var scope = el('list-panel').hidden ? document : el('list-panel');
    var nodes = Array.prototype.slice.call(scope.querySelectorAll('button:not(:disabled),input,select')).filter(function (node) { return node.getClientRects().length > 0; });
    var active = document.activeElement, rect = active.getBoundingClientRect(), best = null, score = Infinity;
    nodes.forEach(function (n) {
      if (n === active) return;
      var r = n.getBoundingClientRect(), dx = r.left + r.width / 2 - rect.left - rect.width / 2, dy = r.top + r.height / 2 - rect.top - rect.height / 2;
      var horizontal = e.keyCode === 37 || e.keyCode === 39;
      var forward = e.keyCode === 37 ? -dx : e.keyCode === 39 ? dx : e.keyCode === 38 ? -dy : dy;
      var distance = forward + Math.abs(horizontal ? dy : dx) * 4;
      if (forward > 1 && distance < score) { best = n; score = distance; }
    });
    if (best) { best.focus(); e.preventDefault(); }
  }, true);
  renderLists(); load(); el('refresh').focus();
}());
