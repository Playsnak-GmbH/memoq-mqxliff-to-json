"use strict";

const mqxliff = require("mqxliff");
const fs = require('fs');
const path = require('path');
const FileHound = require('filehound');
const log = require('console-emoji')

const folder = __dirname + "/data/";
const exportfolder = __dirname + "/exports/";
const majorv_regx = /mq:majorversion="(\d*?)"/;
const minorrv_regx = /mq:minorversion="(\d*?)"/;

console.log(" * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * ");
console.log(" *                                                                 * ");
console.log(" *               __                    __                          * ");
console.log(" *              |__)| _    _ _  _ |   / _  _ |_ |__|               * ");
console.log(" *              |   |(_|\\/_)| )(_||(  \\__)||||_)|  |               *");
console.log(" *                      /                                          * ");
console.log(" *                                                                 * ");
console.log(" *                                                                 * ");
console.log(" *                     Memoq to JSON Convertor                     * ");
console.log(" *                                                                 * ");
console.log(" *                                                                 * ");
console.log(" * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * \r\n \r\n");

const files = FileHound.create()
  .depth(0)
  .paths(folder)
  .ext('mqxliff')
  .findSync();

files.forEach((file, index) => {
  log("Converting: " + path.parse(file.split('\\').pop()).name, 'yellow');
  fs.readFile(file, function (err, data) {
    var tdoc = mqxliff(data);
    var majorv = data.toString().match(majorv_regx);
    var minorrv = data.toString().match(minorrv_regx);
    var info = tdoc.info();
    var json = {}
    json = info;
    json["translation_version"] = majorv[1] + "." + minorrv[1];
    json["lastupdate_timestamp"] = Date();
    for (var i = 0; i != info.tuCount; ++i) {
      var tu = tdoc.getTU(i);
      var srcRichPrinted = richToStr(tu.srcRich());
      var trgRichPrinted = richToStr(tu.trgRich());
      if (i !== 0){
        json[srcRichPrinted] = trgRichPrinted;
      }
    }
    fs.writeFile(exportfolder + path.parse(file.split('\\').pop()).name + ".json",  decodeURIComponent(JSON.stringify(json, null, 4)), function (err) {
      log(path.parse(file.split('\\').pop()).name + " has been converted! ", 'ok');
    });
  });
});


function printFmtChange(prev, curr) {
  var res = "";
  if (!prev.bold && curr.bold) res += "[b]";
  if (prev.bold && !curr.bold) res += "[/b]";
  if (!prev.italic && curr.italic) res += "[i]";
  if (prev.italic && !curr.italic) res += "[/i]";
  if (!prev.underlined && curr.underlined) res += "[u]";
  if (prev.underlined && !curr.underlined) res += "[/u]";
  if (!prev.subscript && curr.subscript) res += "[sub]";
  if (prev.subscript && !curr.subscript) res += "[/sub]";
  if (!prev.superscript && curr.superscript) res += "[sup]";
  if (prev.superscript && !curr.superscript) res += "[/sup]";
  return res;
}

function printTag(cont) {
  var res = "[";
  if (cont.type == "CloseTag") res += "/";
  res += cont.name;
  for (var i = 0; i < cont.attrs.length; ++i) {
    res += " ";
    res += cont.attrs[i].attr;
    res += "='";
    res += cont.attrs[i].val;
    res += "'";
  }
  if (cont.type == "EmptyTag") res += "/";
  res += "]";
  return res;
}

function richToStr(ranges) {
  var res = "";
  var allOff = { bold: false, italic: false, underlined: false, subscript: false, superscript: false };
  var prev = allOff;
  for (var i = 0; i < ranges.length; ++i) {
    var range = ranges[i];
    res += printFmtChange(prev, range);
    for (var j = 0; j != range.content.length; ++j) {
      var cont = range.content[j];
      if (cont.type == "Text") res += cont.text;
      else if (cont.type == "StructuralTag") res += "{}";
      else res += printTag(cont);
    }
    prev = range;
  }
  res += printFmtChange(prev, allOff);
  return res;
}
