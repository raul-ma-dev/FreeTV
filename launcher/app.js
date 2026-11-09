'use strict';
(function () {
  var bridges = [], items = [], columns = 4;
  function el(id) { return document.getElementById(id); }
  function focusItem(item) {
    item.focus();
    if (item.parentNode === el('apps')) {
      var container = el('apps');
      var top = item.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      if (top < container.scrollTop) container.scrollTop = top;
      else if (top + item.offsetHeight > container.scrollTop + container.clientHeight) container.scrollTop = top + item.offsetHeight - container.clientHeight;
    }
  }
  function call(uri, payload, done) {
    var bridge = new PalmServiceBridge(); bridges.push(bridge);
    bridge.onservicecallback = function (raw) {
      var result; try { result = JSON.parse(raw); } catch (e) { result = {errorText: raw}; }
      var index = bridges.indexOf(bridge); if (index >= 0) bridges.splice(index, 1);
      done(result);
    };
    bridge.call(uri, JSON.stringify(payload));
  }
  function rootCall(uri, payload, done) {
    // Only fixed internal Luna URIs and JSON payloads; quote as shell arguments.
    function quote(value) { return "'" + value.replace(/'/g, "'\\''") + "'"; }
    call('luna://org.webosbrew.hbchannel.service/exec', {command:'luna-send -n 1 ' + quote(uri) + ' ' + quote(JSON.stringify(payload))}, function (outer) {
      var result; try { result = JSON.parse(outer.stdoutString); } catch (e) { result = outer; }
      done(result);
    });
  }
  function launch(id) {
    el('status').textContent = 'Abriendo…';
    rootCall('luna://com.webos.applicationManager/launch', {id:id}, function (result) {
      el('status').textContent = result.returnValue ? 'Aplicaciones y entradas' : 'No se pudo abrir: ' + (result.errorText || id);
    });
  }
  function symbol(app) {
    var paths = {
      tv: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 22h8M12 18v4"/>',
      globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
      music: '<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>',
      photo: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="M3 17l6-6 4 4 3-3 5 5"/>',
      search: '<circle cx="10" cy="10" r="7"/><path d="M15 15l6 6"/>',
      hdmi: '<path d="M4 6h16v10l-4 4H8l-4-4zM8 6V3m4 3V3m4 3V3M8 11h8"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
      book: '<path d="M12 5v16M12 5C8 2 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-6-2-10 1z"/>',
      share: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M3 22h18M8 17l4-4 4 4"/>',
      bell: '<path d="M5 16h14l-2-4V8a5 5 0 0 0-10 0v4zM10 20h4"/>'
    };
    var key = app.input ? 'hdmi' : /browser/.test(app.id) ? 'globe' : /music/.test(app.id) ? 'music' : /photo/.test(app.id) ? 'photo' : /voice/.test(app.id) ? 'search' : /guide/.test(app.id) ? 'book' : /miracast/.test(app.id) ? 'share' : /notification/.test(app.id) ? 'bell' : /livetv/.test(app.id) ? 'tv' : 'grid';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[key] + '</svg>';
  }
  function render(apps) {
    el('apps').textContent = ''; items = [];
    apps.forEach(function (app) {
      var button = document.createElement('button'), label = document.createElement('span');
      button.className = app.input ? 'input-card' : 'app-card';
      label.className = 'app-symbol'; label.innerHTML = symbol(app); button.appendChild(label);
      var type = document.createElement('span'); type.className = 'app-type'; type.textContent = app.input ? 'ENTRADA' : 'APP'; button.appendChild(type);
      var name = document.createElement('span'); name.className = 'app-name'; name.textContent = app.title; button.appendChild(name);
      button.title = app.title; button.onclick = function () { launch(app.id); };
      el('apps').appendChild(button); items.push(button);
    });
    items.push(el('refresh'), el('exit')); if (items[0]) focusItem(items[0]);
  }
  function load() {
    el('status').textContent = 'Cargando aplicaciones…';
    rootCall('luna://com.webos.applicationManager/listApps', {}, function (result) {
      if (!result.apps) { el('status').textContent = 'No se pudo consultar el catálogo. Comprueba Homebrew Channel y su estado root.'; return; }
      var apps = result.apps.filter(function (app) { return app.visible && app.id !== 'com.freetv.lighthome'; });
      apps.sort(function (a,b) { return a.title.localeCompare(b.title); });
      // Input apps are hidden in the system catalog but can be launched directly.
      result.apps.forEach(function (app) { if (/^com\.webos\.app\.hdmi[1-4]$/.test(app.id)) apps.push({id:app.id,title:app.title || app.id.split('.').pop().toUpperCase(),input:true}); });
      render(apps); el('status').textContent = apps.length + ' accesos · Aplicaciones y entradas';
    });
  }
  function clock() {
    var date = new Date(), days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'], months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    el('clock').textContent = ('0'+date.getHours()).slice(-2)+':'+('0'+date.getMinutes()).slice(-2);
    el('date').textContent = days[date.getDay()] + ', ' + date.getDate() + ' de ' + months[date.getMonth()];
  }
  el('refresh').onclick = load; el('exit').onclick = function () { window.close(); };
  window.addEventListener('keydown', function (event) {
    if (event.keyCode === 461 || event.keyCode === 27) { event.preventDefault(); window.close(); return; }
    var index = items.indexOf(document.activeElement), next = index;
    if (event.keyCode === 37) next--; else if (event.keyCode === 39) next++;
    else if (event.keyCode === 38) next -= columns; else if (event.keyCode === 40) next += columns; else return;
    event.preventDefault(); next = Math.max(0,Math.min(items.length-1,next)); if(items[next]) focusItem(items[next]);
  }, true);
  clock(); setInterval(clock,60000); load();
}());
