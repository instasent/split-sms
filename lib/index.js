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
