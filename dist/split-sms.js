(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.splitter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var gsmValidator = require('./gsmvalidator');

function isHighSurrogate(code) {
  return code >= 0xD800 && code <= 0xDBFF;
}

module.exports.split = function (message, options) {
  options = options || { supportShiftTables: false, summary: false };

  if (message === '') {
    return {
      parts: [{
        content: options.summary ? undefined : '',
        length: 0,
        bytes: 0
      }],
      totalLength: 0,
      totalBytes: 0
    };
  }

  var messages = [];
  var length = 0;
  var bytes = 0;
  var totalBytes = 0;
  var totalLength = 0;
  var messagePart = '';

  function bank() {
    var msg = {
      content: options.summary ? undefined : messagePart,
      length: length,
      bytes: bytes
    };
    messages.push(msg);

    totalLength += length;
    length = 0;
    totalBytes += bytes;
    bytes = 0;
    messagePart = '';
  }

  function validateCharacter(character) {
    if (options.supportShiftTables) {
      return gsmValidator.validateCharacterWithShiftTable(character);
    }
    return gsmValidator.validateCharacter(character);
  }

  function validateExtendedCharacter(character) {
    if (options.supportShiftTables) {
      return gsmValidator.validateExtendedCharacterWithShiftTable(character);
    }
    return gsmValidator.validateExtendedCharacter(character);
  }

  for (var i = 0, count = message.length; i < count; i++) {
    var c = message.charAt(i);

    if (!validateCharacter(c)) {
      if (isHighSurrogate(c.charCodeAt(0))) {
        i++;
      }
      c = '\u0020';
    } else if (validateExtendedCharacter(c)) {
      if (bytes === 152) bank();
      bytes++;
    }

    bytes++;
    length++;

    if (!options.summary) messagePart += c;

    if (bytes === 153) bank();
  }

  if (bytes > 0) bank();

  if (messages[1] && totalBytes <= 160) {
    return {
      parts: [{
        content: options.summary ? undefined : messages[0].content + messages[1].content,
        length: totalLength,
        bytes: totalBytes
      }],
      totalLength: totalLength,
      totalBytes: totalBytes
    };
  }

  return {
    parts: messages,
    totalLength: totalLength,
    totalBytes: totalBytes
  };
};

},{"./gsmvalidator":2}],2:[function(require,module,exports){
// '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ\x20!"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà\f^{}\\[~]|€'
var GSM_charCodes = [
  10,12,13,32,33,34,35,36,
  37,38,39,40,41,42,43,44,
  45,46,47,48,49,50,51,52,
  53,54,55,56,57,58,59,60,
  61,62,63,64,65,66,67,68,
  69,70,71,72,73,74,75,76,
  77,78,79,80,81,82,83,84,
  85,86,87,88,89,90,91,92,
  93,94,95,97,98,99,100,101,
  102,103,104,105,106,107,108,
  109,110,111,112,113,114,115,
  116,117,118,119,120,121,122,
  123,124,125,126,161,163,164,
  165,167,191,196,197,198,199,
  201,209,214,216,220,223,224,
  228,229,230,232,233,236,241,
  242,246,248,249,252,915,916,
  920,923,926,928,931,934,936,
  937,8364
];

// '\f|^€{}[~]\\'
var GSMe_charCodes = [12,91,92,93,94,123,124,125,126,8364];

// '@£$¥€éùıòÇ\nĞğ\rÅåΔ_ΦΓΛΩΠΨΣΘΞŞşßÉ\x20!"#¤%&\'()*+,-./0123456789:;<=>?İABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§çabcdefghijklmnopqrstuvwxyzäöñüà\f^{}\[~]|'
var GSM_TR_charCodes = [
    10,12,13,32,33,34,35,36,
    37,38,39,40,41,42,43,44,
    45,46,47,48,49,50,51,52,
    53,54,55,56,57,58,59,60,
    61,62,63,64,65,66,67,68,
    69,70,71,72,73,74,75,76,
    77,78,79,80,81,82,83,84,
    85,86,87,88,89,90,91,92,
    93,94,95,97,98,99,100,101,
    102,103,104,105,106,107,108,
    109,110,111,112,113,114,115,
    116,117,118,119,120,121,122,
    123,124,125,126,163,164,165,
    167,196,197,199,201,209,214,
    220,223,224,228,229,231,233,
    241,242,246,249,252,286,287,
    304,305,350,351,915,916,920,
    923,926,928,931,934,936,937,
    8364
];

// '\f^{}\[~]|'
var GSMe_TR_charCodes = [12,91,92,93,94,123,124,125,126,286,287,304,305,350,351,8364];

// '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ\x20!"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüàç\f^{}\\[~]|ÁÍÓÚá€íóú'
var GSM_ES_charCodes = [
    10,12,13,32,33,34,35,36,
    37,38,39,40,41,42,43,44,
    45,46,47,48,49,50,51,52,
    53,54,55,56,57,58,59,60,
    61,62,63,64,65,66,67,68,
    69,70,71,72,73,74,75,76,
    77,78,79,80,81,82,83,84,
    85,86,87,88,89,90,91,92,
    93,94,95,97,98,99,100,101,
    102,103,104,105,106,107,108,
    109,110,111,112,113,114,115,
    116,117,118,119,120,121,122,
    123,124,125,126,161,163,164,
    165,167,191,193,196,197,198,
    199,201,205,209,211,214,216,
    218,220,223,224,225,228,229,
    230,231,232,233,236,237,241,
    242,243,246,248,249,250,252,
    915,916,920,923,926,928,931,
    934,936,937,8364
];

// 'ç\f^{}\\[~]|ÁÍÓÚá€íóú'
var GSMe_ES_charCodes = [12,91,92,93,94,123,124,125,126,193,205,211,218,225,231,237,243,250,8364];

// '@£$¥êéúíóç\nÔô\rÁáΔ_ªÇÀ∞^\\€Ó|ÂâÊÉ\x20!"#º%&\'()*+,-./0123456789:;<=>?ÍABCDEFGHIJKLMNOPQRSTUVWXYZÃÕÚÜ§~abcdefghijklmnopqrstuvwxyzãõ`üà\fΦΓ^ΩΠΨΣΘ{}\\[~]|'
var GSM_PT_charCodes = [
    10,12,13,32,33,34,35,36,
    37,38,39,40,41,42,43,44,
    45,46,47,48,49,50,51,52,
    53,54,55,56,57,58,59,60,
    61,62,63,64,65,66,67,68,
    69,70,71,72,73,74,75,76,
    77,78,79,80,81,82,83,84,
    85,86,87,88,89,90,91,92,
    93,94,95,96,97,98,99,100,
    101,102,103,104,105,106,107,108,
    109,110,111,112,113,114,115,116,
    117,118,119,120,121,122,123,124,
    125,126,163,165,167,170,186,192,
    193,194,195,199,201,202,205,211,
    212,213,218,220,224,225,226,227,
    231,233,234,237,242,243,244,245,
    250,252,915,916,920,928,931,934,
    936,937,8364,8734
];

// '\fΦΓ^ΩΠΨΣΘ{}\\[~]|'
var GSMe_PT_charCodes = [
    12,91,92,93,94,123,124,125,
    126,193,194,195,202,205,211,212,
    213,218,225,226,227,231,234,237,
    242,243,245,250,915,920,928,931,
    934,936,937,8364
];

function existsInArray(code, array) {
  var len = array.length;
  var i = 0;
  while (i < len) {
    var e = array[i];
    if (code === e) return true;
    i++;
  }
  return false;
}

function validateCharacter(character) {
    return existsInArray(character.charCodeAt(0), GSM_charCodes);
}
function validateCharacterWithShiftTable(character) {
  var charCodes = GSM_charCodes.concat(GSM_TR_charCodes, GSM_ES_charCodes, GSM_PT_charCodes);
  return existsInArray(character.charCodeAt(0), charCodes);
}

function validateMessageInCharCodesList(message, charCodes) {
  for (var i = 0; i < message.length; i++) {
    if (!existsInArray(message.charCodeAt(i), charCodes))
      return false;
  }

  return true;
}
function validateMessage(message) {
  return validateMessageInCharCodesList(message, GSM_charCodes);
}
function validateMessageWithShiftTable(message) {
  var charCodes = [GSM_charCodes, GSM_TR_charCodes, GSM_ES_charCodes, GSM_PT_charCodes];
  for (var i = 0; i < charCodes.length; i++) {
    if (validateMessageInCharCodesList(message, charCodes[i]))
      return true;
  }

  return false;
}

function validateExtendedCharacter(character) {
  return existsInArray(character.charCodeAt(0), GSMe_charCodes);
}
function validateExtendedCharacterWithShiftTable(character) {
    var charCodes = GSMe_charCodes.concat(GSMe_TR_charCodes, GSMe_ES_charCodes, GSMe_PT_charCodes);
    return existsInArray(character.charCodeAt(0), charCodes);
}
function getUnicodeCharacters(message, supportShiftTables) {
  var unicodeCharacters = [];
  for (var i = 0; i < message.length; i++) {
    if (supportShiftTables) {
      if (!validateCharacterWithShiftTable(message[i])) {
        unicodeCharacters.push(message[i]);
      }
    } else if (!validateCharacter(message[i])) {
      unicodeCharacters.push(message[i]);
    }
  }
  return unicodeCharacters;
}

module.exports.validateCharacter = validateCharacter;
module.exports.validateCharacterWithShiftTable = validateCharacterWithShiftTable;
module.exports.validateMessage = validateMessage;
module.exports.validateMessageWithShiftTable = validateMessageWithShiftTable;
module.exports.validateExtendedCharacter = validateExtendedCharacter;
module.exports.validateExtendedCharacterWithShiftTable = validateExtendedCharacterWithShiftTable;
module.exports.getUnicodeCharacters = getUnicodeCharacters;
},{}],3:[function(require,module,exports){
var gsmValidator = require('./gsmvalidator'),
    gsmSplitter = require('./gsmsplitter'),
    unicodeSplitter = require('./unicodesplitter');

function calculateRemaining(parts, singleBytes, multiBytes, charBytes) {
  var max = parts.length === 1 ? singleBytes : multiBytes;
  return (max - parts[parts.length - 1].bytes) / charBytes;
}

var UNICODE = module.exports.UNICODE = 'Unicode';
var GSM = module.exports.GSM = 'GSM';

module.exports.split = function (message, options) {
  var characterSet = options && options.characterset;

  options = {
    summary: options && options.summary,
    supportShiftTables: options && options.supportShiftTables
  };

  function validateMessage(message) {
    if (options.supportShiftTables) {
      return gsmValidator.validateMessageWithShiftTable(message);
    }
    return gsmValidator.validateMessage(message);
  }

  var isGsm = (characterSet === undefined && validateMessage(message)) || characterSet === GSM;
  var splitResult, singleBytes, multiBytes, charBytes;

  if (isGsm) {
    splitResult = gsmSplitter.split(message, options);
    singleBytes = 160;
    multiBytes = 153;
    charBytes = 1;
  } else {
    splitResult = unicodeSplitter.split(message, options);
    singleBytes = 140;
    multiBytes = 134;
    charBytes = 2;
  }

  var remainingInPart = calculateRemaining(splitResult.parts, singleBytes, multiBytes, charBytes);

  return {
    characterSet: isGsm ? GSM : UNICODE,
    parts: splitResult.parts,
    bytes: splitResult.totalBytes,
    length: splitResult.totalLength,
    remainingInPart: remainingInPart,
    unicodeCharacters: !isGsm ? gsmValidator.getUnicodeCharacters(message, options.supportShiftTables) : []
  };
};

},{"./gsmsplitter":1,"./gsmvalidator":2,"./unicodesplitter":4}],4:[function(require,module,exports){
function isHighSurrogate(code) {
  return code >= 0xD800 && code <= 0xDBFF;
}

module.exports.split = function (message, options) {
  options = options || { summary: false };

  if (message === '') {
    return {
      parts: [{
        content: options.summary ? undefined : '',
        length: 0,
        bytes: 0
      }],
      totalLength: 0,
      totalBytes: 0
    };
  }

  var messages = [];
  var length = 0;
  var bytes = 0;
  var totalBytes = 0;
  var totalLength = 0;
  var partStart = 0;

  function bank(partEnd) {
    var msg = {
      content: options.summary ? undefined : (partEnd ? message.substring(partStart, partEnd + 1) : message.substring(partStart)),
      length: length,
      bytes: bytes
    };
    messages.push(msg);

    partStart = partEnd + 1;

    totalLength += length;
    length = 0;
    totalBytes += bytes;
    bytes = 0;
  }

  for (var i = 0, count = message.length; i < count; i++) {

    var code = message.charCodeAt(i);
    var highSurrogate = isHighSurrogate(code);

    if (highSurrogate) {
      if (bytes === 132) bank(i - 1);
      bytes += 2;
      i++;
    }

    bytes += 2;
    length++;

    if (bytes === 134) bank(i);
  }

  if (bytes > 0) bank();

  if (messages[1] && totalBytes <= 140) {
    return {
      parts: [{
        content: options.summary ? undefined : message,
        length: totalLength,
        bytes: totalBytes
      }],
      totalLength: totalLength,
      totalBytes: totalBytes
    };
  }

  return {
    parts: messages,
    totalLength: totalLength,
    totalBytes: totalBytes
  };
};

},{}]},{},[3])(3)
});
