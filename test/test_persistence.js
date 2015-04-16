/*global describe, it*/
var Should;
if(typeof require !== "undefined") {
    Should = require("should");

    var serialijse = require("../");
} else {
}
Should(true).eql(true);

var serialize = serialijse.serialize;
var deserialize = serialijse.deserialize;
var declarePersistable = serialijse.declarePersistable;
var serializeZ = serialijse.serializeZ;
var deserializeZ = serialijse.deserializeZ;

(function () {




    "use strict";

    function Color(colorName) {
        this.name = colorName;
    }

    function Vehicule() {
        this.brand = "Fiat";
        this.price = 10000.05;
        this.color = new Color("blue");
        this.created_on= new Date("04 May 1956 GMT");
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
            vehicule.created_on = new Date("04 May 1949 22:00:00 GMT");

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
            vehicules[0].created_on = new Date("Wed, 04 May 1949 22:00:00 GMT");

            var serializationString = serialize(vehicules);
            //xx console.log(serializationString);
            var reconstructedObject = deserialize(serializationString);
            reconstructedObject.should.eql(vehicules);
        });

        it("should persist a array containing two elements pointing to the  same object ", function () {

            var the_vehicule = new Vehicule();
            the_vehicule.brand = "Citroen";
            the_vehicule.price = 95000;
            the_vehicule.created_on = new Date("Wed, 04 May 1949 22:00:00 GMT");

            var vehicules = [ the_vehicule,the_vehicule ];

            vehicules[0].should.equal(vehicules[1]);

            var serializationString = serialize(vehicules);

            Should(the_vehicule.____index).eql(undefined);

            var expected  = '[['+
                    '{"c":"Vehicule","d":{"brand":"Citroen","price":95000,"color":{"o":1},"created_on":{"d":-651981600000}}},' +
                    '{"c":"Color","d":{"name":"blue"}}' +
                    '],'+'{"a":[{"o":0},{"o":0}]}]';

            serializationString.should.eql(expected);

            //xx console.log(serializationString);
            var reconstructedObject = deserialize(serializationString);

            reconstructedObject.length.should.eql(2);
            reconstructedObject[0].should.equal(reconstructedObject[1]);
            reconstructedObject.should.eql(vehicules);


        });

        it("should not persist property defined in class prototype",function () {

            function Rectangle() {
                this.width = 10;
                this.height = 20;
                Object.defineProperty(this,"area",{
                   get: function() {
                       return this.width * this.height;
                   }
                });
            }
            Rectangle.prototype.__defineGetter__("perimeter",function(){
                return (this.width + this.height)*2.0;
            });
            declarePersistable(Rectangle);


            var rect1 = new Rectangle();
            rect1.width = 100;
            rect1.height= 2;
            rect1.area.should.equal(200);
            rect1.perimeter.should.equal(204);

            var serializationString = serialize(rect1);
            //xx console.log(serializationString);

            var rect2 = deserialize(serializationString);
            rect2.area.should.equal(200);
            rect2.perimeter.should.equal(204);

        });

        it("testing compression impact ",function(done){

            var vehicules = [new Vehicule(),new Vehicule(),new Vehicule()];

            var uncompressed_serializationString = serialize(vehicules);

            serializeZ(vehicules,function(err,buffer){
                var serializationString = buffer.toString("base64");

                var compression_ratio = Math.round(100.0- 100.0*(buffer.length/uncompressed_serializationString.length));
                console.log("           = ", uncompressed_serializationString.length,  "compressed =",buffer.length," ratio ", compression_ratio,"%");
                deserializeZ(buffer,function(err,reconstructedObject){
                    done(err);
                    reconstructedObject.should.eql(vehicules);
                });

            });
        });

        it("should persist object with boolean", function(done) {

            var vehicule = new Vehicule();
            vehicule.requireServicing = true;

            var serializationString = serialize(vehicule);
            //xx console.log(serializationString);
            var reconstructedObject = deserialize(serializationString);
            reconstructedObject.should.eql(vehicule);

            done();
        });

        it("should persist an object with a undefined property",function(done){

            var vehicule = new Vehicule();
            vehicule.serviceDate = [ null, new Date("2013/01/02")];

            // try to mess with the serialisation algo by adding a fake null property
            vehicule.toto = null;
            var serializationString = serialize(vehicule);

            // delete it as it should not interfer
            delete vehicule.toto;

            var reconstructedObject = deserialize(serializationString);
            reconstructedObject.should.eql(vehicule);

            done();
        });

        it("should deserialize from an already parsed JSON string",function(done) {

            var vehicule = new Vehicule();

            var serializationString = serialize(vehicule);

            var json_obj = JSON.parse(serializationString);

            var reconstructedObject = deserialize(json_obj);
            reconstructedObject.should.eql(vehicule);

          done();

        });

        it("unlike JSON.stringify/parse, it should serialize a standard object and preserve date",function(){


            var some_object = {
                the_date: new Date()
            };

            some_object.the_date.should.be.instanceOf(Date);
            var serializationString = serialize(some_object);

            var reconstructedObject = deserialize(serializationString);

            reconstructedObject.the_date.should.be.instanceOf(Date);

            reconstructedObject.the_date.should.eql(some_object.the_date);

            reconstructedObject.should.eql(some_object);

            reconstructedObject.should.eql(some_object);

        });


        it("unlike JSON.stringify/parse, it should persist object that contains cyclic object value", function () {

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

            var mark   = new Person("mark"),
                valery = mark.addChild("valery"),
                edgar  = mark.addChild("edgar");

            valery.parent.should.equal(mark);
            edgar.parent.should.equal(mark);

            Should(function(){
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
