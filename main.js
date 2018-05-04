let request = require("request");
let htmlparser = require("htmlparser2");

const maxSize = 10;
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

let date = "2018-05-05";

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

  if (currentTime > 22*60) {
    printRoomTimes();
    return 0;
  }

  let headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0.1 Safari/604.3.5",
    "Cookie": "SimpleSAMLAuthToken=_345b26f88bd3bd5e23ba5465301041039004e8c274;PHPSESSID=7e3c47c06bd33387ead0dda62e7dfb16"
  };

  let form = "start=" + timeToString(currentTime) + "&duration=" + timeToString(timeInterval) + "&preset_date=" + date + "&area=30000&building=&roomtype=NONE&size=5&new_equipment=&preformsubmit=1";

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
      scanTable(dom[4].children[3].children[3].children[1].children[3].children[1].children[1].children[17].children[1].children[1].children[3].children, currCurrTime);//.children[1].children[1]);
    }
  });

  request(options, function (err, res, bod) {
    if (!err && res.statusCode == 200) {
      //console.log(bod);
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
