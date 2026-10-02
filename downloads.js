(function () {
  if (!Axis.verified()) { Axis.lock(); location.replace("Index.html"); return; }
  var back = document.getElementById("back");
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") back.click(); });
})();
