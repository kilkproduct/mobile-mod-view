(function(p) {
    "use strict";

    function start() {
        console.log("[Mobile Mod View] TEST LOADED");
    }

    function stop() {
        console.log("[Mobile Mod View] TEST UNLOADED");
    }

    p.default = {
        onLoad: start,
        onUnload: stop
    };

    Object.defineProperty(p, "__esModule", {
        value: true
    });

    return p;
})({});
