/*
	Proxy Enums
	Alan Thales, 09/2015
*/
var DbProxies = (function() {
  return {
    LOCALSTORAGE: 0,
    SQLITE: 1,
    RESTFUL: 2
  };
})();

if (typeof module === "object" && module.exports) {
  module.exports.DbProxies = DbProxies;
}
