/*global describe, it*/
var should = require("should"),
    _ = require("underscore");

var serialize = require("../").serialize;
var deserialize = require("../").deserialize;
var declarePersistable = require("../").declarePersistable;

(function () {
    "use strict";


    function Color(colorName) {
        this.name = colorName;
    };

    function Vehicule() {
        this.brand = "Fiat";
        this.price = 10000.05;
        this.color = new Color("blue");
        this.created_on= new Date();
    }
    declarePersistable(Vehicule);
    declarePersistable(Color);


    describe("persistence ", function () {

        it("should persist a simple javascript object", function () {

            var vehicule = { name: "GM" };
            var serializationString = serialize(vehicule);
            //xx console.log(serializationString);
            var reconstructedObject = deserialize(serializationString);

            reconstructedObject.should.eql(vehicule);

        });

        it("should persist a simple object", function () {
            var vehicule = new Vehicule();

            vehicule.brand = "Renault";
            vehicule.price = 95000;
            vehicule.created_on = new Date("1949/05/05");

            vehicule.should.be.instanceOf(Vehicule);

            var serializationString = serialize(vehicule);
            //xx console.log(serializationString);
            var reconstructedObject = deserialize(serializationString);

            reconstructedObject.should.eql(vehicule);
            reconstructedObject.should.be.instanceOf(Vehicule);

        });

        it("should persist a simple containing an array", function () {
            var vehicule = new Vehicule();
            vehicule.passengers =["Joe","Jack"];
            var serializationString = serialize(vehicule);
            //xx console.log(serializationString);
            var reconstructedObject = deserialize(serializationString);

            reconstructedObject.should.eql(vehicule);

        });

        it("should persist a array of persistable object", function () {

            var vehicules = [ new Vehicule(), new Vehicule() ];

            vehicules[0].brand = "Renault";
            vehicules[0].price = 95000;
            vehicules[0].created_on = new Date("1949/05/05");

            var serializationString = serialize(vehicules);
            //xx console.log(serializationString);
            var reconstructedObject = deserialize(serializationString);
            reconstructedObject.should.eql(vehicules);
        });

        it("should persist a array containing two elements pointing to the  same object ", function () {

            var the_vehicule = new Vehicule();
            the_vehicule.brand = "Citroen";
            the_vehicule.price = 95000;
            the_vehicule.created_on = new Date("1949/05/05");

            var vehicules = [ the_vehicule,the_vehicule ];

            vehicules[0].should.equal(vehicules[1]);

            var serializationString = serialize(vehicules);

            should(the_vehicule.____index).eql(undefined);

            var expected  = '[['+
                    '{"c":"Vehicule","d":{"brand":"Citroen","price":95000,"color":{"o":1},"created_on":{"d":"1949-05-04T22:00:00.000Z"}}},' +
                    '{"c":"Color","d":{"name":"blue"}}' +
                    '],'+'{"a":[{"o":0},{"o":0}]}]';

            serializationString.should.eql(expected);

            //xx console.log(serializationString);
            var reconstructedObject = deserialize(serializationString);

            reconstructedObject.length.should.eql(2);
            reconstructedObject[0].should.equal(reconstructedObject[1]);
            reconstructedObject.should.eql(vehicules);


        });

        it("should persist a shared object only once", function () {

            function Person(name) {
                this.name= name;
                this.parent = null;
                this.children = [];
            }

            declarePersistable(Person);

            Person.prototype.addChild = function(name) {
                var child = new Person(name);
                child.parent = this;
                this.children.push(child);
                return child;
            };

            var mark = new Person("mark"),
               valery = mark.addChild("valery"),
               edgar = mark.addChild("edgar");

            valery.parent.should.equal(mark);
            edgar.parent.should.equal(mark);

            should(function(){
                JSON.stringify(mark);
            }).throwError();   // Circular

            var serializationString = serialize(mark);
            //xx console.log(serializationString);

            var mark_reloaded = deserialize(serializationString);

            mark_reloaded.name.should.eql("mark");
            mark_reloaded.children.length.should.eql(2);
            mark_reloaded.should.be.instanceOf(Person);
            mark_reloaded.children[0].should.be.instanceOf(Person);
            mark_reloaded.children[1].should.be.instanceOf(Person);

            mark_reloaded.children[0].parent.should.equal(mark_reloaded);
            mark_reloaded.children[1].parent.should.equal(mark_reloaded);
            mark_reloaded.children[0].name.should.eql("valery");
            mark_reloaded.children[1].name.should.eql("edgar");

        });
    });

}());
