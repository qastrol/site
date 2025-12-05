


(function () {
  function getFilesFor(normalizedName) {
    if (typeof window.alertsLinks === 'undefined') return [];
    return window.alertsLinks[normalizedName] || [];
  }

  function hasPreview(normalizedName) {
    const files = getFilesFor(normalizedName);
    return files.length > 0;
  }

  window.getAlertsFiles = getFilesFor;
  window.hasAlertPreview = hasPreview;
})();
