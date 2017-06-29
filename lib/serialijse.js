(function (exports) {
    "use strict";
    var assert = require("assert");
    var g_classInfos = {};

    var isFunction = function (obj) {
        return typeof obj === 'function';
    };


    function serializeObject(context, object, rawData ) {

        assert(!rawData.hasOwnProperty("d"));

        rawData.d = {};

        for (var property in object) {
            if (isPropertyPersistable(object, property)) {
                if (object[property] !== null) {
                    rawData.d[property] = _serialize(context,object[property]);
                }
            }
        }
    }

    function deserializeObject(context, object_id, object_definition) {

        var classInfo = this;

        var object = new classInfo.constructor();
        context.cache[object_id] = object;

        const rawData = object_definition.d;
        if (!rawData) {
            return; // no properties
        }

        for (var property in rawData) {
            if (rawData.hasOwnProperty(property)) {
                try {
                    object[property] = deserialize_node_or_value(context,rawData[property]);
                }
                catch (err) {
                    console.log(" property : ", property);
                    console.log(err);
                    throw err;
                }
            }
        }

        return object;

    }

    function serializeTypedArray(context,typedArray,rawData) {
        rawData.a = new Buffer(typedArray.buffer).toString("base64");
    }

    function deserializeTypedArray(context, object_id, rawData) {

        var classInfo = this;
        assert(typeof rawData.a === "string");
        var buf = Buffer.from(rawData.a,"base64");
        var tmp = new Uint8Array(buf);
        var obj = new classInfo.constructor(tmp.buffer);
        context.cache[object_id] = obj;

        return obj;
    }

    function deserialize_node_or_value(context,node) {
        assert(context);
        assert(node);
        if ("object" === typeof node) {
            return deserialize_node(context,node);
        }
        return node;
    }

    function declarePersistable(constructor, name, serializeFunc, deserializeFunc) {
        var className = constructor.prototype.constructor.name;

        serializeFunc = serializeFunc || serializeObject;
        deserializeFunc = deserializeFunc || deserializeObject;

        if (name) {
            className = name;
        }

        if (g_classInfos.hasOwnProperty(className)) {
            console.warn("warning: declarePersistable : class " + className + " already registered");
        }
        g_classInfos[className] = {
            constructor: constructor,
            serializeFunc: serializeFunc,
            deserializeFunc: deserializeFunc
        };
    }


    declarePersistable(Object, "Object", serializeObject, deserializeObject);
    declarePersistable(Float32Array, "Float32Array", serializeTypedArray, deserializeTypedArray);
    declarePersistable(Float64Array, "Float64Array", serializeTypedArray, deserializeTypedArray);
    declarePersistable(Uint32Array, "Uint32Array", serializeTypedArray, deserializeTypedArray);
    declarePersistable(Uint16Array, "Uint16Array", serializeTypedArray, deserializeTypedArray);
    declarePersistable(Uint8Array, "Uint8Array", serializeTypedArray, deserializeTypedArray);
    declarePersistable(Int32Array, "Int32Array", serializeTypedArray, deserializeTypedArray);
    declarePersistable(Int16Array, "Int16Array", serializeTypedArray, deserializeTypedArray);
    declarePersistable(Int8Array, "Int8Array", serializeTypedArray, deserializeTypedArray);

    /**
     * returns true if the property is persistable.
     * @param obj
     * @param propertyName
     * @returns {boolean}
     */
    function isPropertyPersistable(obj, propertyName) {
        if (!obj.hasOwnProperty(propertyName)) {
            return false;
        }
        if (propertyName === '____index') {
            return false;
        }
        if (obj.constructor && obj.constructor.serialijseOptions) {
            //
            var options = obj.constructor.serialijseOptions;
            if (options.ignored) {
                options.ignored = (options.ignored instanceof Array) ? options.ignored : [options.ignored];

                for (var i = 0; i < options.ignored.length; i++) {
                    var o = options.ignored[i];
                    if (typeof o === "string") {
                        if (o === propertyName) {
                            return false;
                        }
                    } else if (o instanceof RegExp) {
                        if (propertyName.match(o)) {
                            return false
                        }
                    }
                }
            }
        }
        return true;
    }

    function find_object(context,obj) {
        if (obj.____index !== undefined) {
            assert(context.objects[obj.____index] === obj);
            return obj.____index;
        }
        return -1;
    }

    function add_object_in_index(context, obj, serializing_data) {
        var id = context.index.length;
        obj.____index = id;
        context.index.push(serializing_data);
        context.objects.push(obj);
        return id;
    }

    function _serialize_object(context, serializingObject, object) {

        assert(context);
        assert(object !== undefined);

        if (object === null) {
            serializingObject.o = null;
            return;
        }


        var className = object.constructor.name, s, id;

        // j => json object to follow
        // d => date
        // a => array
        // o => class  { c: className d: data }
        // o => null
        // @ => already serialized object

        if (className === "Array") {
            serializingObject["a"] = object.map(_serialize.bind(null,context));
            return;
        }
        if (className === "Date") {
            serializingObject["d"] = object.getTime();
            return;
        }
        if (className !== "Object" && !g_classInfos.hasOwnProperty(className)) {
            throw new Error("class " + className + " is not registered in class Factory - deserialization will not be possible");
        }

        // check if the object has already been serialized
        id = find_object(context,object);

        if (id === -1) { // not found
            // object hasn't yet been serialized
            s = {c: className };
            id = add_object_in_index(context,object, s);
            g_classInfos[className].serializeFunc(context,object, s);

        }
        serializingObject.o = id;
        return serializingObject;
    }

    function _serialize(context, object) {

        assert(context);
        if (object === undefined) {
            return undefined;
        }

        var serializingObject = {};

        switch (typeof object) {
            case 'number':
            case 'boolean':
            case 'string':
                // basic type
                return object;
            case 'object':
                _serialize_object(context,serializingObject, object);
                break;
            default:
                throw new Error("invalid typeof " + typeof object + " " + JSON.stringify(object, null, " "));
        }

        return serializingObject;
    }

    function serialize(object) {

        assert(object !== undefined, "serialize: expect a valid object to serialize ");

        var context = {
            index: [],
            objects: []
        };

        var obj = _serialize(context, object);

        // unset temporary ___index properties
        context.objects.forEach(function (e) {
            delete e.____index;
        });

        return JSON.stringify([context.index, obj]);// ,null," ");
    }


    function deserialize_node(context, node) {
        assert(context);
        // special treatment
        if (!node) {
            return null;
        }

        if (node.hasOwnProperty("d")) {
            return new Date(node.d);
        } else if (node.hasOwnProperty("j")) {
            return node.j;
        } else if (node.hasOwnProperty("o")) {

            var object_id = node.o;

            if (object_id === null) {
                return null;
            }
            // check if this object has already been de-serialized
            if (context.cache[object_id] !== undefined) {
                return context.cache[object_id];
            }
            var serializing_data = context.index[object_id];

            var cache_object = _deserialize_object(context, serializing_data, object_id);
            assert(context.cache[object_id] === cache_object);
            return cache_object;

        } else if (node.hasOwnProperty("a")) {
            // return _deserialize_object(node.o);
            return node.a.map(deserialize_node_or_value.bind(null,context));
        }
        throw new Error("Unsupported deserialize_node" + JSON.stringify(node));
    }

    function _deserialize_object(context, object_definition, object_id) {

        assert(object_definition.c);

        var className = object_definition.c;
        var classInfo = g_classInfos[className];

        if (!classInfo) {
            throw new Error(" Cannot find constructor to deserialize class of type " + className + ". use declarePersistable(Constructor)");
        }
        var constructor = classInfo.constructor;
        assert(isFunction(constructor));

        var obj = classInfo.deserializeFunc(context,object_id, object_definition);

        if (constructor && constructor.serialijseOptions) {
            // onDeserialize is called immediately after object has been created
            if (constructor.serialijseOptions.onDeserialize) {
                constructor.serialijseOptions.onDeserialize(obj);
            }
            // onPostDeserialize call is postponed after the main object has been fully de-serializednpm
            if (constructor.serialijseOptions.onPostDeserialize) {
                context.postDeserialiseActions.push(obj);
            }
        }
        return obj;
    }

    function deserialize(serializationString) {

        var data;
        if (typeof serializationString === 'string') {
            data = JSON.parse(serializationString);
        } else if (typeof serializationString === 'object') {
            data = serializationString;
        }
        if (!(data instanceof Array) ) {
            throw new Error("Invalid Serialization data");
        }
        if (data.length !== 2) {
            throw new Error("Invalid Serialization data");
        }

        var rawObject = data[1];
        var context = {
            index : data[0],
            cache : [],
            postDeserialiseActions: []
        };

        var deserializedObject = deserialize_node(context, rawObject);

        context.postDeserialiseActions.forEach(function (o) {
            o.constructor.serialijseOptions.onPostDeserialize(o);
        });

        return deserializedObject;
    }

    exports.deserialize = deserialize;
    exports.serialize = serialize;
    exports.declarePersistable = declarePersistable;

    exports.serializeZ = function (obj, callback) {
        var zlib = require("zlib");
        var str = serialize(obj);
        zlib.deflate(str, function (err, buff) {
            if (err) {
                return callback(err);
            }
            callback(null, buff);
        });
    };

    exports.deserializeZ = function (data, callback) {
        var zlib = require("zlib");
        zlib.inflate(data, function (err, buff) {
            if (err) {
                return callback(err);
            }
            callback(null, deserialize(buff.toString()));
        });
    };


})(typeof exports === 'undefined' ? this['serialijse'] = {} : exports);

