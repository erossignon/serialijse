serialijse
==========

serialize and deserialize javascript object, preserve your object model


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



Examples
========

```javascript   
   var o = { date: new Date(); }    
```

```javascript   
   var s = require("serizlvar o = { date: new Date(); }    
```
