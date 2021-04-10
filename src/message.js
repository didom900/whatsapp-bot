if (!window.Store) {
    (function() {
        function getStore(modules) {
            let foundCount = 0;
            let neededObjects = [
                { id: "Store", conditions: (module) => (module.Chat && module.Msg) ? module : null },
                { id: "Wap", conditions: (module) => (module.createGroup) ? module : null },
                { id: "MediaCollection", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.processFiles !== undefined) ? module.default : null },
                { id: "WapDelete", conditions: (module) => (module.sendConversationDelete && module.sendConversationDelete.length == 2) ? module : null },
                { id: "Conn", conditions: (module) => (module.default && module.default.ref && module.default.refTTL) ? module.default : null },
                { id: "WapQuery", conditions: (module) => (module.queryExist) ? module : null },
                { id: "ProtoConstructor", conditions: (module) => (module.prototype && module.prototype.constructor.toString().indexOf('binaryProtocol deprecated version') >= 0) ? module : null },
                { id: "UserConstructor", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null }
            ];

            for (let idx in modules) {
                if ((typeof modules[idx] === "object") && (modules[idx] !== null)) {
                    let first = Object.values(modules[idx])[0];
                    if ((typeof first === "object") && (first.exports)) {
                        for (let idx2 in modules[idx]) {
                            let module = modules(idx2);
                            if (!module) {
                                continue;
                            }

                            neededObjects.forEach((needObj) => {
                                if(!needObj.conditions || needObj.foundedModule) return;
                                let neededModule = needObj.conditions(module);
                                if(neededModule !== null) {
                                    foundCount++;
                                    needObj.foundedModule = neededModule;
                                }
                            });

                            if(foundCount == neededObjects.length) {
                                break;
                            }
                        }

                        let neededStore = neededObjects.find((needObj) => needObj.id === "Store");
                        window.Store = neededStore.foundedModule ? neededStore.foundedModule : {};
                        neededObjects.splice(neededObjects.indexOf(neededStore), 1);
                        neededObjects.forEach((needObj) => {
                            if(needObj.foundedModule) {
                                window.Store[needObj.id] = needObj.foundedModule;
                            }
                        });

                        return window.Store;
                    }
                }
            }
        }

        webpackJsonp([], {'parasite': (x, y, z) => getStore(z)}, 'parasite');
    })();
}

window.MESSAGE = {
    components: {}
};

window.MESSAGE.welcome = "Bienvenid@ al *Bot de Audara*, seleccione por favor una opcíón de la siguiente lista.\n\n";
window.MESSAGE.list = "*1:* Contactar a un asesor de servicio.\n*2:* Salir.";
window.MESSAGE.inactivity = "_La conversación se acaba de cerrar por inactividad._";
window.MESSAGE.end_conv = "_Acabas de finalizar la conversación._";
window.MESSAGE.completeAgent = "_El agente finalizó la conversación._";
window.MESSAGE.validateRating = "_La calificación se debe indicar en un valor numerico_";
window.MESSAGE.regard = "_La conversación ha finalizado_ \n_Gracias por comunicarte con nosotros_";