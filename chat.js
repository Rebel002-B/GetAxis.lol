(function () {
  if (!Axis.verified()) { Axis.lock(); location.replace("Index.html"); return; }
  var back = document.getElementById("back");
  back.addEventListener("click", function (e) { e.preventDefault(); location.href = back.getAttribute("href"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") back.click(); });
})();
