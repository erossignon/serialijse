/*global exports,require*/
var lib = require("./lib/serialijse");
exports.serialize = lib.serialize;
exports.deserialize = lib.deserialize;
exports.serializeZ = lib.serializeZ;
exports.deserializeZ = lib.deserializeZ;
exports.declarePersistable = lib.declarePersistable;
