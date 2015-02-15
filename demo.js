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
    assert(so[0].friends[0] === so[1]); // Mary's friend is Bob
}
testing_javascript_serialization_objects_with_cyclic_dependencies();


