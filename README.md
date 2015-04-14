serialijse
==========

serialize and deserialize javascript object, preserve your object model. persistance and serialization in javascript and nodejs.


[![Build Status](https://travis-ci.org/erossignon/serialijse.svg?branch=master)](https://travis-ci.org/erossignon/serialijse)
[![Coverage Status](https://img.shields.io/coveralls/erossignon/serialijse.svg)](https://coveralls.io/r/erossignon/serialijse)
[![Code Climate](https://codeclimate.com/github/erossignon/serialijse.png)](https://codeclimate.com/github/erossignon/serialijse)

[![NPM](https://nodei.co/npm/serialijse.png)](https://nodei.co/npm/serialijse/)
[![browser support](https://ci.testling.com/erossignon/serialijse.png)](https://ci.testling.com/erossignon/serialijse)


Intro
=====

serialijse is an simple persistence framework for JavaScript that overcomes two main limitation of JSON persistence:

- serialijse deals well with cyclic objects.
- serialijse preserve object class upon deserialization.
  
serialijse can be used in nodejs or in the browser. It makes possible to pass data accross the network
and recreate on the client side the same rich object model that exists on the server side.
 
installation
============

Using serialijse in nodejs
--------------------------

````sh
npm install serialijse
````


Using serialijse in browser
----------------------------

* install serialijse component: 
````sh
bower install serialijse
````

* in your html file: 
```html
<script src="components/serialijse/dist/serialijse.bundle.js">

<script>
var serialize = serialijse.serialize;
var deserialize = serialijse.deserialize;
var declarePersistable = serialijse.declarePersistable;
var serializeZ = serialijse.serializeZ;
var deserializeZ = serialijse.deserializeZ;

var vehicule = new Vehicule();
...
var serializationString = serialize(vehicule);
...
var reconstructedObject = deserialize(serializationString);

</script>
```
Examples
========


```javascript   
// var s = require("serialijse");
var s = require("./index.js");
var assert = require("assert");


// testing serialization of a simple javascript object with date
function testing_javascript_serialization_object_with_date() {

    var o = {
        date: new Date(),
        name: "foo"
    };
    console.log(o.name, o.date.toISOString());

    // JSON will fail as JSON doesn't preserve dates
    try {
        var jstr = JSON.stringify(o);
        var jo = JSON.parse(jstr);
        console.log(jo.name, jo.date.toISOString());
    } catch (err) {
        console.log(" JSON has failed to preserve Date during stringify/parse ");
        console.log("  and has generated the following error message", err.message);
    }
    console.log("");



    var str = s.serialize(o);
    var so = s.deserialize(str);
    console.log(" However Serialijse knows how to preserve date during serialization/deserialization :");
    console.log(so.name, so.date.toISOString());
    console.log("");
}
testing_javascript_serialization_object_with_date();


// serializing a instance of a class
function testing_javascript_serialization_instance_of_a_class() {

    function Person() {
        this.firstName = "Joe";
        this.lastName = "Doe";
        this.age = 42;
    }

    Person.prototype.fullName = function () {
        return this.firstName + " " + this.lastName;
    };


    // testing serialization using  JSON.stringify/JSON.parse
    var o = new Person();
    console.log(o.fullName(), " age=", o.age);

    try {
        var jstr = JSON.stringify(o);
        var jo = JSON.parse(jstr);
        console.log(jo.fullName(), " age=", jo.age);

    } catch (err) {
        console.log(" JSON has failed to preserve the object class ");
        console.log("  and has generated the following error message", err.message);
    }
    console.log("");

    // now testing serialization using serialijse  serialize/deserialize
    s.declarePersistable(Person);
    var str = s.serialize(o);
    var so = s.deserialize(str);

    console.log(" However Serialijse knows how to preserve object classes serialization/deserialization :");
    console.log(so.fullName(), " age=", so.age);
}
testing_javascript_serialization_instance_of_a_class();


// serializing an object with cyclic dependencies
function testing_javascript_serialization_objects_with_cyclic_dependencies() {

    var Mary = { name: "Mary", friends: [] };
    var Bob = { name: "Bob", friends: [] };

    Mary.friends.push(Bob);
    Bob.friends.push(Mary);

    var group = [ Mary, Bob];
    console.log(group);

    // testing serialization using  JSON.stringify/JSON.parse
    try {
        var jstr = JSON.stringify(group);
        var jo = JSON.parse(jstr);
        console.log(jo);

    } catch (err) {
        console.log(" JSON has failed to manage object with cyclic deps");
        console.log("  and has generated the following error message", err.message);
    }

    // now testing serialization using serialijse  serialize/deserialize
    var str = s.serialize(group);
    var so = s.deserialize(str);
    console.log(" However Serialijse knows to manage object with cyclic deps !");
    console.log(so);
    assert(so[0].friends[0] == so[1]); // Mary's friend is Bob
}
testing_javascript_serialization_objects_with_cyclic_dependencies();
   
   
```
