(function () {
  if (!Axis.verified()) { Axis.lock(); location.replace("Index.html"); return; }

  var tabInput = document.getElementById("tabname");
  tabInput.value = Axis.getTitle();
  tabInput.addEventListener("input", function () { Axis.setTitle(tabInput.value); });
  tabInput.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === "Escape") tabInput.blur(); e.stopPropagation(); });

  // Pacman is omitted: Data/pacman/ does not exist.
  var GAMES = [
    { n: "2048",             f: "2048.html",             c: "puzzle", s: "360x520" },
    { n: "Bowling",          f: "bowling.html",          c: "arcade", s: "360x530" },
    { n: "Dino",             f: "Dino.html",             c: "arcade", s: "600x530" },
    { n: "Doodle Jump",      f: "doodle-jump.html",      c: "arcade", s: "370x530" },
    { n: "Duck Duck",        f: "duck.html",             c: "action", s: "750x550" },
    { n: "Flappy",           f: "flappy.html",           c: "arcade", s: "370x530" },
    { n: "Geometry",         f: "geometry.html",         c: "action", s: "750x550" },
    { n: "Granny",           f: "Granny.html",           c: "action", s: "960x600" },
    { n: "Mario",            f: "mario.html",            c: "action", s: "750x550" },
    { n: "Merge Fruit",      f: "merge-fruit.html",      c: "puzzle", s: "400x534" },
    { n: "Pong",             f: "pong.html",             c: "arcade", s: "750x620" },
    { n: "Snake",            f: "snake-google.html",     c: "arcade", s: "550x550" },
    { n: "Solitaire",        f: "solitaire.html",        c: "puzzle", s: "600x530" },
    { n: "Space Invaders",   f: "space-invaders.html",   c: "action", s: "750x550" },
    { n: "Spacebar Clicker", f: "spacebar.html",         c: "arcade", s: "750x520" },
    { n: "Stack",            f: "stack.html",            c: "puzzle", s: "360x520" },
    { n: "Stacker",          f: "stacker.html",          c: "puzzle", s: "400x520" },
    { n: "The Last Spartan", f: "the-last-spartan.html", c: "action", s: "750x550" },
    { n: "Timberman",        f: "timberman.html",        c: "arcade", s: "340x559" },
    { n: "Ultrakill",        f: "ultrakill.html",        c: "action", s: "1280x720" }
  ];

  var listEl = document.getElementById("list");
  var emptyEl = document.getElementById("empty");
  var countEl = document.getElementById("count");
  var resumeEl = document.getElementById("resume");
  var bar = document.getElementById("bar");
  var q = document.getElementById("q");
  var cat = "all";
  var sel = 0;
  var rows = [];

  function pad(i) { return (i < 10 ? "0" : "") + i; }
  function href(g) { return "Data/" + g.f; }

  function lastPlayed() {
    try {
      var f = localStorage.getItem("axisLast");
      return GAMES.filter(function (g) { return g.f === f; })[0] || null;
    } catch (e) { return null; }
  }

  function render() {
    var term = q.value.trim().toLowerCase();
    rows = GAMES.filter(function (g) {
      return (cat === "all" || g.c === cat) && (!term || g.n.toLowerCase().indexOf(term) !== -1);
    });
    if (sel >= rows.length) sel = Math.max(0, rows.length - 1);
    listEl.textContent = "";
    rows.forEach(function (g, i) {
      var li = document.createElement("li");
      li.style.setProperty("--i", i);
      var a = document.createElement("a");
      a.href = href(g);
      if (i === sel) a.className = "sel";
      var n = document.createElement("span"); n.className = "n"; n.textContent = pad(GAMES.indexOf(g) + 1);
      var t = document.createElement("span"); t.className = "t"; t.textContent = g.n;
      var m = document.createElement("span"); m.className = "m"; m.textContent = g.c + " / " + g.s;
      a.appendChild(n); a.appendChild(t); a.appendChild(m);
      a.addEventListener("click", function () { remember(g); });
      a.addEventListener("mouseenter", function () { sel = i; mark(); });
      li.appendChild(a);
      listEl.appendChild(li);
    });
    emptyEl.hidden = rows.length > 0;
    countEl.textContent = rows.length + " / " + GAMES.length;
  }

  function mark() {
    var links = listEl.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) links[i].classList.toggle("sel", i === sel);
  }

  function remember(g) {
    try { localStorage.setItem("axisLast", g.f); } catch (e) {}
  }

  function launch() {
    var g = rows[sel];
    if (!g) return;
    remember(g);
    document.body.classList.add("leaving");
    setTimeout(function () { location.href = href(g); }, 220);
  }

  var clockEl = document.getElementById("clock");
  var t0 = Date.now();
  setInterval(function () {
    var s = Math.floor((Date.now() - t0) / 1000);
    clockEl.textContent = "session " + pad(Math.floor(s / 60) % 100) + ":" + pad(s % 60);
  }, 1000);

  var last = lastPlayed();
  if (last) {
    resumeEl.hidden = false;
    resumeEl.appendChild(document.createTextNode("resume: "));
    var ra = document.createElement("a");
    ra.href = href(last);
    ra.textContent = last.n;
    resumeEl.appendChild(ra);
  }

  bar.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-cat]");
    if (!b) return;
    cat = b.getAttribute("data-cat");
    var bs = bar.querySelectorAll("button");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", bs[i] === b ? "true" : "false");
    sel = 0;
    render();
  });

  q.addEventListener("input", function () { sel = 0; render(); });
  q.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { launch(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); q.blur(); move(1); }
    else if (e.key === "Escape") { q.blur(); }
  });

  function move(d) {
    if (!rows.length) return;
    sel = (sel + d + rows.length) % rows.length;
    mark();
    var el = listEl.querySelectorAll("a")[sel];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }

  document.addEventListener("keydown", function (e) {
    if (e.target === q || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "/") { e.preventDefault(); q.focus(); }
    else if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") { launch(); }
  });

  render();
})();
