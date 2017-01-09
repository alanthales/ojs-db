/*
	Util functions
	Alan Thales, 05/2016
*/
var OjsUtils = (function() {
	'use strict';

	/**
	 * Taken from the crypto-browserify module
	 * https://github.com/dominictarr/crypto-browserify
	 * NOTE: Math.random() does not guarantee "cryptographic quality" but we actually don't need it
	 */
	var randomBytes = function(size) {
		var bytes = new Array(size),
			i = 0, r;

		for (; i < size; i++) {
			if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
			bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
		}

		return bytes;
	};

	/**
	 * Taken from the base64-js module
	 * https://github.com/beatgammit/base64-js/
	 */
	var byteArrayToBase64 = function(uint8) {
		var lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
			extraBytes = uint8.length % 3,  // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length, i;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += "==";
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += "=";
				break;
		}

		return output;
	};
	
	return {
		newId: function() {
			var now = (new Date()).getTime();
			if (performance && performance.now) {
				now = parseInt(performance.now().toString().replace('.', ''));
			}
			return now;
		},

		uuid: function(len) {
			return byteArrayToBase64(randomBytes(Math.ceil(Math.max(8, len * 2)))).replace(/[+\/]/g, "").slice(0, len);
		},
		
		cloneObject: function(obj) {
			var out, i, len;
			
			if (!obj || obj instanceof Date) {
				return obj;
			}
			
			if (obj instanceof ArrayMap) {
				out = new ArrayMap();
			} else if (obj instanceof SimpleDataSet) {
				out = new SimpleDataSet();
			} else if (obj instanceof ChildRecord) {                
				out = new ChildRecord();
			}
			
			if (Object.prototype.toString.call(obj) === "[object Array]") {
				out = out || []; i = 0; len = obj.length;
				for ( ; i < len; i++ ) {
					out[i] = this.cloneObject(obj[i]);
				}
				return out;
			}
			
			if (typeof obj === "object") {
				out = out || {};
				for ( i in obj ) {
					if (obj.hasOwnProperty(i)) {
						out[i] = this.cloneObject(obj[i]);
					}
				}
				return out;
			}
			
			return obj;
		},
		
		cloneProperties: function(source, dest) {
			for (var prop in source) {
				if (source.hasOwnProperty(prop)) {
					dest[prop] = source[prop];
				}
			}
		}
	};
})();