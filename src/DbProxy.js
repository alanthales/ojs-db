/*
    Proxy Enums
    Alan Thales, 09/2015
*/
var DbProxies = (function() {
    return {
        LOCALSTORAGE: 0,
        SQLITE: 1
    }
})();


/*
    DbProxy Parent Class
    Autor: Alan Thales, 09/2015
*/
var DbProxy = (function() {
    function CreateProxy() {}
    return CreateProxy;
})();
