const stackTrace = require("stack-trace");
const crypto = require("crypto");

(function (exports) {
    "use strict";
    var assert = require("assert");
    var g_classInfos = {};

    // note: phantomjs may not define  Object.assign by default so we need the pony fill
    var objectAssign = Object.assign || require("object-assign");

    var isFunction = function (obj) {
        return typeof obj === 'function' || obj.prototype;
    };


    function merge_options(options1,options2) {
       return  objectAssign({},options1, options2);
    }
    function serializeObject(context, object, rawData , global_options ) {

        assert(!rawData.hasOwnProperty("d"));

        rawData.d = {};

        var options = global_options || {};
        if (object.constructor && object.constructor.serialijseOptions) {
            options = merge_options(options,object.constructor.serialijseOptions);
        }
        if (options.ignored) {
            options.ignored = (options.ignored instanceof Array) ? options.ignored : [options.ignored];
        }

        for (var property in object) {
            if (isPropertyPersistable(object, property, options)) {
                if (object[property] !== null) {
                    rawData.d[property] = _serialize(context,object[property], options);
                }
            }
        }
    }

    function deserializeObject(context, object_id, object_definition) {

        var classInfo = this;

        var object = new classInfo.constructor();
        context.cache[object_id] = object;

        var rawData = object_definition.d;
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
        if ("object" === typeof node) {
            return deserialize_node(context,node);
        }
        return node;
    }

    function generateUniqueClassName(constructor) {
        const className =  constructor.prototype.constructor.name || constructor.name;
        const trace = stackTrace.get();
        const fileNameOfCaller = trace[2].getFileName()
        // Generates a hash from the file name where declarePersistable was called to be appended to the class name to mitigate collisions of class names
        const hashedfileNameOfCaller = crypto
            .createHash('sha256')
            .update(fileNameOfCaller)
            .digest('hex');
        
        return `${className} (${hashedfileNameOfCaller})`;
    }

    function declarePersistable(constructor, name, serializeFunc, deserializeFunc) {
        let className
        if (name) {
            className = name;
        } else {
            className = generateUniqueClassName(constructor);
            constructor.uniqueClassName = className
        }

        

        serializeFunc = serializeFunc || serializeObject;
        deserializeFunc = deserializeFunc || deserializeObject;



        if (g_classInfos.hasOwnProperty(className)) {
            console.warn("declarePersistable warning: declarePersistable : class " + className + " already registered");
        }
        if (!(constructor instanceof Function) && !constructor.prototype) {
            throw new Error("declarePersistable: Cannot find constructor for " + className);
        };

        g_classInfos[className] = {
            constructor: constructor,
            serializeFunc: serializeFunc,
            deserializeFunc: deserializeFunc
        };
    }


    function declareTypedArrayPersistable(typeArrayName) {

        if (!global[typeArrayName]) {
            console.log("warning : " + typeArrayName + " is not supported in this environment");
            return;
        }

        var constructor = global[typeArrayName];
        // repair constructor name if any
        if(!constructor.name) {
            constructor.name = typeArrayName;
        }
        // if (!(constructor instanceof Function)) {
        //     a = new constructor();
        //     throw new Error("warning : " + typeArrayName + " is not supported FULLY FILLY in this environment"   +typeof constructor,typeof constructor.constructor);
        // }
        declarePersistable(constructor, typeArrayName, serializeTypedArray, deserializeTypedArray);

    }
    declarePersistable(Object, "Object", serializeObject, deserializeObject);
    declareTypedArrayPersistable("Float32Array");
    declareTypedArrayPersistable("Uint32Array");
    declareTypedArrayPersistable("Uint16Array");
    declareTypedArrayPersistable("Uint8Array");
    declareTypedArrayPersistable("Int32Array");
    declareTypedArrayPersistable("Int16Array");
    declareTypedArrayPersistable("Int8Array");

    /**
     * returns true if the property is persistable.
     * @param obj
     * @param propertyName
     * @returns {boolean}
     */
    function isPropertyPersistable(obj, propertyName ,options) {
        if (!obj.hasOwnProperty(propertyName)) {
            return false;
        }
        if (propertyName === '____index') {
            return false;
        }
        if (options && options.ignored) {

            for (var i = 0; i < options.ignored.length; i++) {
                var o = options.ignored[i];
                if (typeof o === "string") {
                    if (o === propertyName) {
                        return false;
                    }
                } else if (o instanceof RegExp) {
                    if (propertyName.match(o)) {
                        return false;
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

    function extract_object_classname(object) {
        var classNameWithHash = object.constructor.uniqueClassName
        if (classNameWithHash) {
            return classNameWithHash
        }
        var className =  object.constructor.name;
        if (className) {
            return className;
        }
        if(object instanceof Float32Array) { return "Float32Array"; }
        if(object instanceof Uint32Array) { return "Uint32Array"; }
        if(object instanceof Uint16Array) { return "Uint16Array"; }
        if(object instanceof Uint8Array) { return "Uint8Array"; }
        if(object instanceof Int32Array) { return "Int32Array"; }
        if(object instanceof Int16Array) { return "Int16Array"; }
        if(object instanceof Int8Array) { return "Int8Array"; }
    }

    function _serialize_object(context, serializingObject, object , options) {

        assert(context);
        assert(object !== undefined);

        if (object === null) {
            serializingObject.o = null;
            return;
        }


        var className =extract_object_classname(object), s, id;

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
            console.log(object);
            throw new Error("class " + className + " is not registered in class Factory - deserialization will not be possible");
        }

        // check if the object has already been serialized
        id = find_object(context,object);

        if (id === -1) { // not found
            // object hasn't yet been serialized
            s = {c: className };
            id = add_object_in_index(context,object, s);
            g_classInfos[className].serializeFunc(context,object, s, options);

        }
        serializingObject.o = id;
        return serializingObject;
    }

    function _serialize(context, object, options ) {

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
                _serialize_object(context,serializingObject, object, options);
                break;
            default:
                throw new Error("invalid typeof " + typeof object + " " + JSON.stringify(object, null, " "));
        }

        return serializingObject;
    }

    /**
     *
     * @param object            {object} object to serialize
     * @param [options]         {object} optional options
     * @param [options.ignored] {string|regexp|Array<string|regexp>} pattern for field to not serialize
     * @return {string}
     */
    function serialize(object,options) {

        assert(object !== undefined, "serialize: expect a valid object to serialize ");

        var context = {
            index: [],
            objects: []
        };

        var obj = _serialize(context, object, options);

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

