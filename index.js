"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./build/ojs-db.js");
} else {
  module.exports = require("./build/ojs-db.min.js");
}
