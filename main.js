const request = require("request");
const htmlparser = require("htmlparser2");
const domutils = require("htmlparser2").DomUtils;

const date = "10.04.2019";
const phpsessid = "3c010917b10e69b3df1a855e70585a30";
const simpleSAMLAuthToken = "_4d175f8d38ab9f162a9b5cd8708a155ac232200c5f";

const area = 30000;
const minSize = 5;

const maxSize = 12;
const startTime = 9*60;
let currentTime = startTime;
const timeInterval = 15;

let rooms = {};

function timeToString(time) {
  let h = Math.floor(time / 60);
  let m = time % 60;
  let s = "";
  if (h < 10) {
    s += "0" + h + ":";
  } else {
    s += h + ":";
  }
  if (m == 0) {
    s += "00";
  } else if (m < 10) {
    s += "0" + m;
  } else s += m;

  return s;
}

function scanTable(table, time) {
  for (let i = 0; i < table.length; i++) {
    if (table[i].type == "tag") {
      if (parseInt(table[i].children[3].children[0].data) <= maxSize) {
        if (rooms.hasOwnProperty(table[i].children[1].attribs.title)) {
          rooms[table[i].children[1].attribs.title].push(time);
        } else {
          rooms[table[i].children[1].attribs.title] = [];
          rooms[table[i].children[1].attribs.title].push(time);
        }
        console.log(table[i].children[1].attribs.title);
      }
    }
  }
}

function printRoomTimes() {
  for (let k in rooms) {
    if (rooms.hasOwnProperty(k)) {
      let s = k + ": ";
      while (s.length < 16) {
        s += " ";
      }
      for (let t = startTime; t <= currentTime; t += timeInterval) {
        if (t % 60 == 0) {
          s += "|";
        }
        if (rooms[k].includes(t)) {
          s += "X";
        } else {
          s += " ";
        }
      }
      console.log(s);
    }
  }
}

function crawl() {

  if (currentTime >= 20*60) {
    printRoomTimes();
    return 0;
  }

  let headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0.1 Safari/604.3.5",
    "Cookie":
    "PHPSESSID=" + phpsessid + ";SimpleSAMLAuthToken=" + simpleSAMLAuthToken
  };

  let form = "start=" + timeToString(currentTime) + "&duration=" + timeToString(timeInterval) + "&preset_date=" + date + "&area=" + area + "&building=&roomtype=NONE&size=" + minSize + "&new_equipment=&preformsubmit=1";

  let options = {
    url: "https://tp.uio.no/ntnu/rombestilling/",
    method: "POST",
    headers: headers,
    form: form
  };

  let currCurrTime = currentTime;

  let handler = new htmlparser.DomHandler(function(err, dom) {
    if (err) {
      console.log(err);
    } else {
      try {
        let roomsTable = domutils.find(e => e.attribs && e.attribs.class === "possible-rooms-table", dom, true, 1);
        roomsTable = domutils.find(e => e.name === "tbody", roomsTable, true, 1);
        roomsTable = domutils.find(e => e.name === "tr", roomsTable, true, 1024);
        scanTable(roomsTable, currCurrTime);
      } catch(e) {
        console.log(e);
      }
    }
  });

  request(options, function (err, res, bod) {
    if (!err && res.statusCode == 200) {
      reqBody = bod;

      let parser = new htmlparser.Parser(handler);
      parser.write(reqBody);
      parser.end();
    }
  });

  currentTime += timeInterval;
  setTimeout(crawl, 500);

}

crawl();
