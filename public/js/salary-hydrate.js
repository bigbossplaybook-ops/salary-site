// Boss Playbook — client-side salary hydration.
// Refreshes the static wage figures from the live salary API on page load so
// numbers stay current without a rebuild. Fails silently when the API has no
// coverage for the page's occupation/location (e.g. executive titles), leaving
// the build-time figures in place.
(function () {
  var root = document.querySelector("[data-occupation][data-location]");
  if (!root) return;

  var API = "https://web-production-d6bdb.up.railway.app/salary";
  var occupation = root.getAttribute("data-occupation");
  var location = root.getAttribute("data-location");

  var fmt = function (n) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);
    } catch (e) {
      return "$" + Math.round(n).toLocaleString();
    }
  };

  fetch(API + "?occupation=" + encodeURIComponent(occupation) + "&location=" + encodeURIComponent(location))
    .then(function (res) {
      if (!res.ok) throw new Error("no coverage");
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.wages) return;
      document.querySelectorAll("[data-salary]").forEach(function (el) {
        var key = el.getAttribute("data-salary");
        var value = data.wages[key];
        if (typeof value === "number" && isFinite(value)) {
          el.textContent = fmt(value);
          el.setAttribute("data-hydrated", "true");
        }
      });
    })
    .catch(function () {
      /* static figures remain authoritative */
    });
})();
