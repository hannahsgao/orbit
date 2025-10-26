"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenStore = void 0;
var InMemoryTokenStore = /** @class */ (function () {
    function InMemoryTokenStore() {
        this.store = new Map();
    }
    InMemoryTokenStore.prototype.get = function (userId) {
        return this.store.get(userId);
    };
    InMemoryTokenStore.prototype.set = function (userId, tokens) {
        this.store.set(userId, tokens);
    };
    InMemoryTokenStore.prototype.clear = function (userId) {
        this.store.delete(userId);
    };
    return InMemoryTokenStore;
}());
exports.tokenStore = new InMemoryTokenStore();
