(function () {
  if (Axis.verified()) { location.replace("page.html"); return; }

  var gate = document.getElementById("gate");
  var form = document.getElementById("f");
  var input = document.getElementById("k");
  var msg = document.getElementById("msg");

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // ---- one-hour lockout after an unverified visit to a protected page ----
  var tick = null;
  function showLock() {
    var left = Axis.lockLeft();
    if (left <= 0) {
      if (tick) { clearInterval(tick); tick = null; }
      input.disabled = false;
      msg.textContent = "";
      input.focus();
      return;
    }
    var s = Math.ceil(left / 1000);
    input.disabled = true;
    msg.textContent = "locked: not verified. try again in " + pad(Math.floor(s / 60)) + ":" + pad(s % 60);
  }
  if (Axis.lockLeft() > 0) { gate.classList.add("locked"); showLock(); tick = setInterval(showLock, 1000); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (Axis.lockLeft() > 0) return;
    Axis.check(input.value).then(function (ok) {
      if (ok) {
        Axis.verify(input.value);
        msg.textContent = "verified.";
        gate.classList.add("out");
        setTimeout(function () { location.href = "page.html"; }, 450);
      } else {
        input.value = "";
        msg.textContent = "denied";
        gate.classList.remove("bad");
        void gate.offsetWidth;
        gate.classList.add("bad");
        setTimeout(function () { msg.textContent = ""; gate.classList.remove("bad"); }, 1500);
        input.focus();
      }
    });
  });

  // ---- letter to the school ----
  var school = document.getElementById("school");
  function openSchool() { school.hidden = false; document.getElementById("schoolX").focus(); }
  function closeSchool() { school.hidden = true; }
  document.getElementById("schoolBtn").addEventListener("click", openSchool);
  document.getElementById("schoolX").addEventListener("click", closeSchool);
  school.addEventListener("click", function (e) { if (e.target === school) closeSchool(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSchool(); });
})();
