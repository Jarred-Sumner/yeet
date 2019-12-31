require("@babel/register")({
  // Setting this will remove the currently hooked extensions of `.es6`, `.es`, `.jsx`, `.mjs`
  // and .js so you'll have to add them back if you want them to be used again.
  extensions: [".es6", ".es", ".jsx", ".js", ".mjs", ".tsx", ".ts"],

  // Setting this to false will disable the cache.
  cache: true,
  ignore: ["react-native"]
});

const slugify = require("slugify");

const ORDERING = [
  "748",
  "1264",
  "1457",
  "1377",
  "1432",
  "1463",
  "1444",
  "1398",
  "1449",
  "1421",
  "1447",
  "1375",
  "1446",
  "1386",
  "1441",
  "1280",
  "793",
  "1442",
  "1456",
  "1426",
  "1465",
  "1436",
  "745",
  "1418",
  "1408",
  "1424",
  "1240",
  "1404",
  "1435",
  "1464",
  "1417",
  "1437",
  "1429",
  "1285",
  "1439",
  "1350",
  "1454",
  "1156",
  "1430",
  "1251",
  "809",
  "1420",
  "1369",
  "1455",
  "1428",
  "1155",
  "758",
  "1415",
  "1304",
  "1462",
  "1450",
  "1334",
  "742",
  "1308",
  "1367",
  "1393",
  "1443",
  "1269",
  "1399",
  "1470",
  "1427",
  "1354",
  "1281",
  "1413",
  "1391",
  "1346",
  "1451",
  "1433",
  "1359",
  "1390",
  "1320",
  "1453",
  "937",
  "1466",
  "1397",
  "909",
  "798",
  "1116",
  "759",
  "1412",
  "1348",
  "1329",
  "929",
  "961",
  "1473",
  "1277",
  "1395",
  "1336",
  "1445",
  "1170",
  "1364",
  "1204",
  "1401",
  "979",
  "1173",
  "1384",
  "1372",
  "1333",
  "1389",
  "1385",
  "1452",
  "1438",
  "997",
  "812",
  "1004",
  "1316",
  "1138",
  "863",
  "1468",
  "1283",
  "1002",
  "1379",
  "1321",
  "1311",
  "1434",
  "1182",
  "1396",
  "1460",
  "1402",
  "1168",
  "846",
  "1260",
  "1362",
  "848",
  "1015",
  "1400",
  "844",
  "1265",
  "1091",
  "1355",
  "832",
  "1328",
  "752",
  "1414",
  "1326",
  "1467",
  "1287",
  "1419",
  "769",
  "1366",
  "1353",
  "1469",
  "1357",
  "1080",
  "602",
  "1458",
  "1409",
  "1279",
  "1373",
  "1461",
  "1293",
  "1224",
  "1257",
  "892",
  "1342",
  "1158",
  "988",
  "1323",
  "1255",
  "771",
  "1064",
  "1229",
  "1440",
  "1140",
  "1459",
  "1410",
  "1394",
  "816",
  "1337",
  "1286",
  "1261",
  "808",
  "883",
  "1327",
  "1371",
  "1416",
  "797",
  "1361",
  "1099",
  "1238",
  "1296",
  "786",
  "1422",
  "882",
  "1209",
  "1101",
  "835",
  "1338",
  "1097",
  "1226",
  "1448",
  "1104",
  "910",
  "1306",
  "1322",
  "1431",
  "1356",
  "1345",
  "1174",
  "1403",
  "894",
  "913",
  "1151",
  "1236",
  "737",
  "1411",
  "1036",
  "887",
  "485",
  "1275",
  "1388",
  "1136",
  "1472",
  "1056",
  "1057",
  "1405",
  "1205",
  "763",
  "1365",
  "1297",
  "1192",
  "1073",
  "1113",
  "1127",
  "792",
  "829",
  "1267",
  "1295",
  "1034",
  "1425",
  "1084",
  "1221",
  "1252",
  "1383",
  "854",
  "928",
  "1172",
  "1314",
  "1303",
  "919",
  "885",
  "1244",
  "1248",
  "802",
  "960",
  "873",
  "1075",
  "851",
  "1381",
  "1289",
  "1305",
  "1223",
  "1024",
  "1307",
  "1077",
  "1313",
  "1154",
  "1301",
  "920",
  "1218",
  "1178",
  "1190",
  "1092",
  "777",
  "1278",
  "1471",
  "998",
  "678",
  "209",
  "586",
  "903",
  "1000",
  "1376",
  "1310",
  "1349",
  "713",
  "1048",
  "1407",
  "138",
  "938",
  "869",
  "1186",
  "1039",
  "807",
  "581",
  "1263",
  "1135",
  "1222",
  "1185",
  "1368",
  "1131",
  "1137",
  "1291",
  "1339",
  "624",
  "1133",
  "1193",
  "1118",
  "828",
  "1086",
  "1423",
  "1145",
  "704",
  "1171",
  "813",
  "1152",
  "1100",
  "1147",
  "955",
  "584",
  "830",
  "1360",
  "1110",
  "991",
  "1216",
  "943",
  "721",
  "1232",
  "833",
  "843",
  "925",
  "922",
  "727",
  "837",
  "1351",
  "1266",
  "1382",
  "424",
  "1312",
  "890",
  "1317",
  "1203",
  "2",
  "800",
  "818",
  "1214",
  "1299",
  "975",
  "1374",
  "440",
  "1217",
  "1220",
  "1243",
  "357",
  "1276",
  "1215",
  "1392",
  "1184",
  "1284",
  "1187",
  "875",
  "1130",
  "643",
  "789",
  "1259",
  "1029",
  "739",
  "951",
  "1041",
  "944",
  "949",
  "942",
  "1387",
  "1028",
  "1167",
  "1071",
  "1128",
  "950",
  "1115",
  "799",
  "570",
  "125",
  "1237",
  "1347",
  "865",
  "859",
  "1231",
  "173",
  "1013",
  "1089",
  "1300",
  "1249",
  "1132",
  "1206",
  "1208",
  "1331",
  "1183",
  "168",
  "750",
  "824",
  "1258",
  "598",
  "1148",
  "719",
  "995",
  "761",
  "1298",
  "1180",
  "1030",
  "1233",
  "971",
  "840",
  "849",
  "1033",
  "831",
  "1093",
  "794",
  "1341",
  "867",
  "631",
  "1198",
  "1067",
  "825",
  "1125",
  "1242",
  "1060",
  "1124",
  "880",
  "1109",
  "1302",
  "1380",
  "1271",
  "1191",
  "1165",
  "911",
  "672",
  "1292",
  "1239",
  "870",
  "1343",
  "1210",
  "723",
  "1117",
  "1288",
  "1040",
  "839",
  "930",
  "1003",
  "993",
  "895",
  "1112",
  "1159",
  "1026",
  "1352",
  "19",
  "1027",
  "425",
  "795",
  "558",
  "878",
  "934",
  "1045",
  "1219",
  "142",
  "1141",
  "1262",
  "1049",
  "1358",
  "957",
  "879",
  "1055",
  "1340",
  "1294",
  "891",
  "559",
  "872",
  "1335",
  "326",
  "815",
  "1253",
  "1177",
  "1005",
  "1256",
  "1318",
  "574",
  "595",
  "718",
  "483",
  "1098",
  "933",
  "29",
  "127",
  "1378",
  "1315",
  "1370",
  "918",
  "1120",
  "162",
  "702",
  "1143",
  "560",
  "917",
  "1072",
  "901",
  "589",
  "749",
  "714",
  "1149",
  "190",
  "1324",
  "756",
  "898",
  "14",
  "735",
  "959",
  "1162",
  "651",
  "1007",
  "996",
  "1194",
  "1202",
  "1160",
  "1270",
  "668",
  "1245",
  "1211",
  "935",
  "1121",
  "1282",
  "250",
  "1126",
  "791",
  "1228",
  "1207",
  "687",
  "893",
  "1344",
  "61",
  "45",
  "1146",
  "939",
  "820",
  "1319",
  "1066",
  "994",
  "915",
  "1227",
  "682",
  "150",
  "965",
  "1085",
  "1042",
  "1181",
  "826",
  "1199",
  "1046",
  "554",
  "1196",
  "801",
  "1010",
  "969",
  "1406",
  "888",
  "707",
  "671",
  "1065",
  "1325",
  "143",
  "754",
  "989",
  "902",
  "1290",
  "367",
  "1114",
  "1023",
  "1059",
  "964",
  "1163",
  "858",
  "324",
  "293",
  "1142",
  "1",
  "1157",
  "695",
  "60",
  "785",
  "176",
  "1053",
  "1176",
  "1096",
  "1254",
  "860",
  "1200",
  "1189",
  "973",
  "1332",
  "1105",
  "1020",
  "1088",
  "1037",
  "963",
  "1047",
  "904",
  "1107",
  "1230",
  "164",
  "1119",
  "1225",
  "1069",
  "575",
  "530",
  "999",
  "1111",
  "1061",
  "775",
  "923",
  "1201",
  "193",
  "864",
  "473",
  "15",
  "597",
  "1050",
  "788",
  "1153",
  "980",
  "1250",
  "805",
  "715",
  "974",
  "644",
  "110",
  "590",
  "1213",
  "665",
  "953",
  "941",
  "466",
  "726",
  "900",
  "1273",
  "983",
  "778",
  "970",
  "1363",
  "563",
  "932",
  "803",
  "1246",
  "122",
  "722",
  "194",
  "1268",
  "784",
  "945",
  "1274",
  "841",
  "203",
  "3",
  "1012",
  "772",
  "1197",
  "1330",
  "1139",
  "498",
  "9",
  "1108",
  "1102",
  "538",
  "730",
  "106",
  "58",
  "1095",
  "565",
  "1044",
  "446",
  "131",
  "1164",
  "990",
  "874",
  "403",
  "766",
  "768",
  "1129",
  "1247",
  "1043",
  "1054",
  "421",
  "362",
  "705",
  "497",
  "1272",
  "1161",
  "689",
  "834",
  "1106",
  "1166",
  "416",
  "677",
  "225",
  "804",
  "1011",
  "967",
  "853",
  "653",
  "1016",
  "1052",
  "1021",
  "1068",
  "921",
  "648",
  "852",
  "1103",
  "773",
  "927",
  "956",
  "1025",
  "418",
  "361",
  "568",
  "907",
  "1038",
  "1195",
  "701",
  "986",
  "191",
  "276",
  "966",
  "428",
  "636",
  "599",
  "946",
  "248",
  "889",
  "537",
  "553",
  "1241",
  "886",
  "876",
  "1079",
  "375",
  "1309",
  "720",
  "972",
  "1074",
  "1019",
  "507",
  "1169",
  "649",
  "838",
  "952",
  "931",
  "897",
  "711",
  "806",
  "1022",
  "954",
  "896",
  "940",
  "908",
  "968",
  "1150",
  "868",
  "1144",
  "703",
  "746",
  "605",
  "1188",
  "637",
  "862",
  "646",
  "1051",
  "217",
  "82",
  "958",
  "936",
  "627",
  "199",
  "396",
  "787",
  "448",
  "856",
  "582",
  "291",
  "1179",
  "585",
  "1063",
  "774",
  "776",
  "1078",
  "38",
  "395",
  "1082",
  "770",
  "850",
  "976",
  "578",
  "463",
  "1212",
  "822",
  "1058",
  "295",
  "699",
  "197",
  "284",
  "669",
  "914",
  "861",
  "1018",
  "4",
  "688",
  "94",
  "5",
  "762",
  "857",
  "744",
  "147",
  "65",
  "562",
  "1175",
  "12",
  "532",
  "612",
  "504",
  "614",
  "306",
  "738",
  "198",
  "641",
  "866",
  "783",
  "505",
  "724",
  "982",
  "290",
  "751",
  "266",
  "1134",
  "69",
  "790",
  "1070",
  "419",
  "608",
  "588",
  "26",
  "1234",
  "1008",
  "334",
  "1083",
  "747",
  "992",
  "628",
  "321",
  "1014",
  "740",
  "177",
  "154",
  "706",
  "136",
  "583",
  "300",
  "159",
  "782",
  "1076",
  "336",
  "471",
  "760",
  "679",
  "905",
  "1123",
  "536",
  "819",
  "796",
  "348",
  "676",
  "984",
  "916",
  "373",
  "259",
  "755",
  "130",
  "153",
  "673",
  "767",
  "272",
  "354",
  "23",
  "75",
  "615",
  "765",
  "686",
  "140",
  "604",
  "187",
  "670",
  "625",
  "1122",
  "387",
  "518",
  "633",
  "8",
  "275",
  "725",
  "216",
  "884",
  "411",
  "658",
  "657",
  "947",
  "317",
  "675",
  "292",
  "345",
  "827",
  "716",
  "472",
  "349",
  "1031",
  "1094",
  "30",
  "855",
  "304",
  "741",
  "1235",
  "467",
  "708",
  "1001",
  "642",
  "591",
  "287",
  "881",
  "360",
  "557",
  "926",
  "277",
  "344",
  "301",
  "444",
  "10",
  "728",
  "269",
  "84",
  "757",
  "205",
  "733",
  "580",
  "335",
  "160",
  "364",
  "509",
  "540",
  "683",
  "601",
  "146",
  "877",
  "172",
  "709",
  "274",
  "117",
  "397",
  "450",
  "219",
  "21",
  "781",
  "987",
  "1090",
  "906",
  "119",
  "847",
  "810",
  "1035",
  "261",
  "566",
  "302",
  "474",
  "16",
  "312",
  "499",
  "394",
  "486",
  "1032",
  "512",
  "365",
  "978",
  "54",
  "985",
  "729",
  "1006",
  "539",
  "534",
  "977",
  "587",
  "480",
  "372",
  "303",
  "693",
  "821",
  "244",
  "62",
  "743",
  "179",
  "186",
  "169",
  "1087",
  "196",
  "36",
  "845",
  "495",
  "40",
  "780",
  "273",
  "515",
  "516",
  "542",
  "700",
  "545",
  "680",
  "145",
  "347",
  "135",
  "469",
  "382",
  "443",
  "451",
  "99",
  "224",
  "237",
  "561",
  "692",
  "528",
  "531",
  "674",
  "121",
  "104",
  "95",
  "105",
  "734",
  "924",
  "962",
  "134",
  "254",
  "258",
  "44",
  "567",
  "630",
  "550",
  "6",
  "912",
  "592",
  "247",
  "350",
  "596",
  "489",
  "37",
  "691",
  "18",
  "388",
  "617",
  "697",
  "151",
  "233",
  "200",
  "753",
  "115",
  "368",
  "460",
  "278",
  "645",
  "453",
  "572",
  "429",
  "128",
  "329",
  "120",
  "89",
  "340",
  "764",
  "152",
  "521",
  "167",
  "981",
  "482",
  "477",
  "609",
  "271",
  "823",
  "948",
  "613",
  "313",
  "316",
  "25",
  "129",
  "279",
  "7",
  "666",
  "331",
  "337",
  "35",
  "623",
  "64",
  "811",
  "174",
  "647",
  "116",
  "358",
  "519",
  "564",
  "731",
  "712",
  "717",
  "322",
  "24",
  "379",
  "484",
  "399",
  "1017",
  "308",
  "320",
  "899",
  "268",
  "1081",
  "529",
  "654",
  "206",
  "386",
  "611",
  "626",
  "171",
  "202",
  "229",
  "655",
  "98",
  "155",
  "640",
  "180",
  "488",
  "74",
  "1009",
  "189",
  "374",
  "547",
  "48",
  "632",
  "690",
  "46",
  "413",
  "520",
  "78",
  "435",
  "423",
  "13",
  "369",
  "285",
  "694",
  "333",
  "282",
  "318",
  "635",
  "426",
  "319",
  "256",
  "183",
  "634",
  "249",
  "311",
  "410",
  "204",
  "298",
  "383",
  "431",
  "610",
  "629",
  "404",
  "817",
  "124",
  "556",
  "661",
  "141",
  "288",
  "351",
  "452",
  "508",
  "618",
  "371",
  "400",
  "401",
  "549",
  "264",
  "606",
  "137",
  "294",
  "123",
  "325",
  "698",
  "548",
  "576",
  "871",
  "270",
  "296",
  "393",
  "465",
  "541",
  "652",
  "181",
  "552",
  "57",
  "577",
  "240",
  "63",
  "328",
  "161",
  "506",
  "513",
  "736",
  "422",
  "59",
  "620",
  "227",
  "283",
  "260",
  "363",
  "544",
  "178",
  "571",
  "246",
  "656",
  "710",
  "650",
  "1062",
  "263",
  "251",
  "307",
  "34",
  "39",
  "438",
  "70",
  "732",
  "323",
  "414",
  "594",
  "281",
  "43",
  "427",
  "406",
  "696",
  "370",
  "593",
  "87",
  "27",
  "385",
  "226",
  "101",
  "454",
  "280",
  "494",
  "685",
  "842",
  "490",
  "659",
  "90",
  "195",
  "76",
  "543",
  "77",
  "836",
  "779",
  "341",
  "185",
  "346",
  "170",
  "616",
  "639",
  "327",
  "600",
  "437",
  "81",
  "113",
  "533",
  "201",
  "380",
  "524",
  "573",
  "603",
  "31",
  "441",
  "228",
  "359",
  "814",
  "51",
  "522",
  "457",
  "49",
  "527",
  "243",
  "255",
  "619",
  "232",
  "72",
  "80",
  "88",
  "459",
  "638",
  "265",
  "305",
  "342",
  "607",
  "621",
  "502",
  "73",
  "109",
  "33",
  "579",
  "86",
  "535",
  "68",
  "67",
  "188",
  "55",
  "475",
  "235",
  "236",
  "356",
  "503",
  "514",
  "103",
  "32",
  "510",
  "681",
  "50",
  "17",
  "299",
  "192",
  "338",
  "381",
  "267",
  "297",
  "83",
  "286",
  "449",
  "526",
  "667",
  "500",
  "664",
  "166",
  "442",
  "309",
  "213",
  "41",
  "390",
  "252",
  "66",
  "684",
  "569",
  "144",
  "238",
  "660",
  "430",
  "496",
  "517",
  "366",
  "214",
  "92",
  "108",
  "479",
  "257",
  "511",
  "662",
  "102",
  "433",
  "231",
  "242",
  "402",
  "262",
  "436",
  "47",
  "481",
  "107",
  "28",
  "91",
  "118",
  "52",
  "42",
  "93",
  "434",
  "114",
  "445",
  "417",
  "622",
  "85",
  "439",
  "79"
];

globalThis.__DEV__ = true;

const path = require("path");
const fs = require("fs");
const {
  fromPairs,
  flatMap,
  first,
  isEmpty,
  uniq,
  compact,
  flatten,
  get,
  isArray,
  map
} = require("lodash");

const MEME_JSON_PATH = path.resolve(
  __dirname,
  "../../memes/db.normalized.json"
);
const MEME_IMAGE_DIR = path.resolve(__dirname, "../../memes/cropped");
const getMemeImageData = filename =>
  require(path.join(MEME_IMAGE_DIR, filename + ".json"));

const MEMES_LIST = require(MEME_JSON_PATH);
const REMOTE_IMAGE_PATH = `https://yeet-store.s3.amazonaws.com/cropped`;
const THUMBNAIL_IMAGE_PATH = `https://yeet-store.s3.amazonaws.com/cropped-thumbnails`;

const THUMBNAIL_IMAGE_SIZE = {
  width: 200,
  height: 200
};

const getImageUri = entry =>
  encodeURI(REMOTE_IMAGE_PATH + "/" + entry.imeSlike);
const getThumbnailUrl = entry =>
  encodeURI(
    THUMBNAIL_IMAGE_PATH + "/" + entry.imeSlike.replace(".jpg", "_s.jpg")
  );

globalThis.__fbBatchedBridgeConfig = {};
globalThis.SCREEN_DIMENSIONS = {
  width: 375,
  height: 812
};

globalThis.TOP_Y = 24;

const {
  scaleToWidth: _scaleToWidth,
  scaleToHeight: _scaleToHeight,
  intersectRect,
  scaleRectByFactor
} = require(path.resolve(__dirname, "../src/lib/Rect.tsx"));

const scaleToWidth = (width, dimensions) =>
  _scaleToWidth(width, dimensions, value => value);

const scaleToHeight = (width, dimensions) =>
  _scaleToHeight(width, dimensions, value => value);

const {
  buildImageBlock,
  PostFormat,
  PostLayout,
  TextTemplate,
  TextBorderType
} = require(path.resolve(__dirname, "../src/lib/buildPost.tsx"));

const createExportableImageBlock = (entry, scaledImageSize, imageSize) => {
  return {
    type: "image",
    format: PostFormat.sticker,
    dimensions: {
      x: scaledImageSize.x,
      y: scaledImageSize.y,
      width: scaledImageSize.width,
      height: scaledImageSize.height,
      maxX: scaledImageSize.width,
      maxY: scaledImageSize.height
    },
    id: normalizeID(entry.imeSlike),
    contentId: normalizeID(entry.imeSlike),
    viewTag: -1,
    layout: PostLayout.text,
    frame: imageSize,
    value: {
      width: imageSize.width,
      height: imageSize.height,
      source: "meme",
      mimeType: "image/jpeg",
      uri: getImageUri(entry),
      duration: 0
    }
  };
};

const ALIGN_MAP = {
  "0": "left",
  "1": "center",
  "2": "right"
};

const OUTLINE_MAP = {
  "0": TextBorderType.hidden,
  "1": TextBorderType.stroke,
  "2": TextBorderType.stroke,
  "3": TextBorderType.stroke,
  "4": TextBorderType.stroke,
  "5": TextBorderType.solid
};

const percentToPx = (value, size) => (parseInt(value) / 100.0) * size.width;

const normalizeFontSize = (fontSize, size) => {
  return (
    {
      "1": 14,
      "2": 16,
      "3": 18,
      "4": 18,
      "5": 24,
      "6": 24,
      "7": 32
    }[fontSize] || 18
  );
};

const getLayout = (_textEntries, imageBlock, size, xPadding, yPadding) => {
  const textEntries = _textEntries.map(entry => ({
    ...entry,
    rect: {
      x: parseInt(entry.x),
      y: parseInt(entry.y),
      width: parseInt(entry.w),
      height: parseInt(
        entry.h ||
          (entry.maxLines || 1) * normalizeFontSize(entry.fontSize || "3", size)
      )
    }
  }));

  const isTrimmedImage =
    imageBlock.dimensions.x > 2 || imageBlock.dimensions.y > 2;

  const textBlockEntries = textEntries.filter(
    ({ rect }) => !intersectRect(rect, imageBlock.dimensions)
  );

  const textNodes = textEntries
    .filter(({ rect }) => intersectRect(rect, imageBlock.dimensions))
    .map(entry => {
      const block = createExportableTextBlock(entry, size);

      return createExportableTextNode(
        block,
        entry,
        1.0,
        imageBlock,
        size,
        xPadding,
        yPadding
      );
    });

  if (textBlockEntries.length === 0 || !isTrimmedImage) {
    return {
      layout: PostLayout.media,
      blocks: [[imageBlock]],
      nodes: textNodes
    };
  }

  const [
    {
      rect: { x, y }
    }
  ] = textBlockEntries;

  const textPosition = {
    horizontally: {
      before: x < imageBlock.dimensions.x,
      after: x > imageBlock.dimensions.x
    },
    vertically: {
      before: y < imageBlock.dimensions.y,
      after: y > imageBlock.dimensions.y
    }
  };

  const _createExportableTextBlock = block =>
    createExportableTextBlock(block, size);
  const textBlocks = textBlockEntries.map(_createExportableTextBlock);

  const hasMultipleTextInputs = textBlocks.length > 1;

  if (!hasMultipleTextInputs && textPosition.vertically.before) {
    return {
      layout: PostLayout.textMedia,
      blocks: [textBlocks, [imageBlock]],
      nodes: textNodes
    };
  } else if (!hasMultipleTextInputs && textPosition.vertically.after) {
    return {
      layout: PostLayout.mediaText,
      blocks: [[imageBlock], textBlocks],
      nodes: textNodes
    };
  } else if (!hasMultipleTextInputs && textPosition.horizontally.before) {
    return {
      layout: PostLayout.horizontalTextMedia,
      blocks: [[textBlocks[0], imageBlock]],
      nodes: textNodes
    };
  } else if (!hasMultipleTextInputs && textPosition.horizontally.after) {
    return {
      layout: PostLayout.horizontalMediaText,
      blocks: [[imageBlock, textBlocks[0]]],
      nodes: textNodes
    };
  }

  const isAllSameX =
    uniq(textBlockEntries.map(({ rect: { x } }) => x)).length ===
    textBlocks.length;

  const isAllSameY =
    uniq(textBlockEntries.map(({ rect: { y } }) => y)).length ===
    textBlocks.length;

  if (isAllSameX && textPosition.horizontally.before) {
    return {
      layout: PostLayout.horizontalTextMedia,
      blocks: [textBlocks, [imageBlock]],
      nodes: textNodes
    };
  } else if (isAllSameX && textPosition.horizontally.after) {
    return {
      layout: PostLayout.horizontalMediaText,
      blocks: [textBlocks, [imageBlock]],
      nodes: textNodes
    };
  } else if (isAllSameY && textPosition.vertically.after) {
    return {
      layout: PostLayout.verticalMediaText,
      blocks: [textBlocks, [imageBlock]],
      nodes: textNodes
    };
  } else if (isAllSameY && textPosition.vertically.before) {
    return {
      layout: PostLayout.verticalTextMedia,
      blocks: [textBlocks, [imageBlock]],
      nodes: textNodes
    };
  } else {
    return {
      layout: PostLayout.media,
      blocks: [[imageBlock]],
      nodes: textEntries.map(entry => {
        const block = createExportableTextBlock(entry, size);

        return createExportableTextNode(
          block,
          entry,
          1.0,
          imageBlock,
          size,
          xPadding,
          yPadding
        );
      })
    };
  }
};

const createExportableTextBlock = (entry, size) => {
  const {
    text: id,
    x: _x,
    y: _y,
    w: _w,
    fontSize: _fontSize = "14",
    align: _align,
    colorIn: color = "#fff",
    colorOut: backgroundColor,
    maxLines: numberOfLines,
    outline: _outline,
    upperCase
  } = entry;
  const fontSize = normalizeFontSize(_fontSize, size);
  const textAlign = ALIGN_MAP[_align];
  const border = OUTLINE_MAP[_outline];
  const template = TextTemplate.basic;

  const width = _w ? percentToPx(_w, size) : undefined;

  return {
    type: "text",
    format: PostFormat.sticker,
    viewTag: -1,
    layout: PostLayout.text,
    template,
    contentId: normalizeID(id),
    id: normalizeID(id),
    value: "",
    frame: {
      x: 0,
      y: 0,
      width: width
    },
    config: {
      border,
      overrides: {
        backgroundColor,
        color,
        fontSize,
        textTransform: upperCase === "t" ? "uppercase" : undefined,
        numberOfLines: numberOfLines ? parseInt(numberOfLines) : undefined,
        maxWidth: width,
        textAlign
      }
    }
  };
};

const normalizeID = text => slugify(text);

const TOP_TEXT_ID = "top-text";
const BOTTOM_TEXT_ID = "bottom-text";

const createOldTextBlock = isTop => {
  const id = isTop ? TOP_TEXT_ID : BOTTOM_TEXT_ID;

  return {
    type: "text",
    format: PostFormat.sticker,
    viewTag: -1,
    layout: PostLayout.text,
    template: TextTemplate.bigWords,
    contentId: id,
    id,
    value: "",
    frame: {
      x: 0,
      y: 0
    },
    config: {
      border: TextBorderType.stroke,
      overrides: {
        textAlign: "center",
        color: "white",
        backgroundColor: "black"
      }
    }
  };
};

const createOldTextNode = (size, isTop) => {
  const block = createOldTextBlock(isTop);
  const y = isTop ? 16 : size.height - 16 - 32;

  return {
    block,
    frame: {
      x: 0,
      y: 0,
      width: size.width
    },
    viewTag: -1,
    position: {
      x: 0,
      y,
      scale: 1.0,
      rotate: 0
    }
  };
};

const createExportableTextNode = (
  block,
  caption,
  _scale = 1.0,
  imageBlock,
  size,
  xPadding = 0,
  yPadding = 0
) => {
  const {
    x: _x,
    y: _y,
    w: _width,
    h,
    maxLines,
    fontSize,
    rotation: _rotate
  } = caption;
  const x = Math.max(
    0,
    Math.min(
      parseInt(_x) -
        imageBlock.dimensions.x +
        (size.width - imageBlock.dimensions.width) / 2 -
        0,
      imageBlock.dimensions.width
    )
  );
  let y = Math.max(
    normalizeFontSize(fontSize, size) * 1.5,
    Math.min(
      parseInt(_y) -
        imageBlock.dimensions.y +
        (size.height - imageBlock.dimensions.height),
      imageBlock.dimensions.height
    )
  );

  const width = parseInt(_width);

  block.format = PostFormat.sticker;

  let rotate = 0;

  if (_rotate && typeof parseInt(_rotate) === "number") {
    rotate = parseFloat(_rotate) * (Math.PI / 180);
  }

  return {
    block,
    frame: {
      x: (width + x) / 2,
      y
    },
    viewTag: -1,
    position: {
      x: (width + x) / 2,
      y,
      scale: 1.0,
      rotate
    }
  };
};

const ARTICLES = ["a", "the", "and", "or", "but", "whence", "of"];

const convertEntry = entry => {
  let { backgroundColor, rectangle: _rectangle, size } = getMemeImageData(
    entry.imeSlike
  );
  let xPadding = 0;
  let yPadding = 0;
  if (_rectangle.x > 0 && _rectangle.x * 2 + _rectangle.width === size.width) {
    xPadding = _rectangle.x;
    size.x = 0;

    _rectangle.x = 0;
    _rectangle.width = size.width;
  }

  if (
    _rectangle.y > 0 &&
    _rectangle.y * 2 + _rectangle.height === size.height
  ) {
    yPadding = _rectangle.y;
    size.y = 0;
    _rectangle.y = 0;
    _rectangle.height = size.height;
  }

  const { isModernMeme = false, searchTags = "" } = entry;
  const keywords = uniq(
    compact(
      flatten(searchTags)
        .join("")
        .trim()
        .split(" ")
    )
      .map(word =>
        word
          .toLowerCase()
          .replace(/["']+/gm, "")
          .trim()
      )
      .filter(text => !isEmpty(text))
      .filter(text => !ARTICLES.includes(text))
  );

  const captionsList = get(entry, "captionList.caption");
  const hasTextCaptions =
    !!get(captionsList, "[0].multiText.text") ||
    !!get(captionsList, "[0].multiText[0].text") ||
    !!get(captionsList, "multiText[0].text") ||
    !!get(captionsList, "multiText.text");

  const hasAncientMemeCaptions =
    !!get(captionsList, "[0].textUp") ||
    !!get(captionsList, "textUp") ||
    !!get(captionsList, "[0].textDown") ||
    !!get(captionsList, "textDown");

  const imageBlock = createExportableImageBlock(entry, _rectangle, _rectangle);

  if (hasTextCaptions) {
    let captions = [];

    if (isArray(entry.captionList.caption)) {
      entry.captionList.caption.forEach(list => {
        if (isArray(list.multiText)) {
          if (list.multiText.length > captions.length) {
            captions = list.multiText;
          }
        } else if (
          typeof list.multiText === "object" &&
          captions.length === 0
        ) {
          captions = [list.multiText];
        }
      });
    } else {
      const list = entry.captionList.caption;
      if (isArray(list.multiText)) {
        if (list.multiText.length > captions.length) {
          captions = list.multiText;
        }
      } else if (typeof list.multiText === "object" && captions.length === 0) {
        captions = [list.multiText];
      }
    }

    // const strings = [];
    const strings = uniq(
      isArray(entry.captionList.caption)
        ? flatMap(entry.captionList.caption, caption => {
            return caption.multiText;
          })
            .filter(entry => !isEmpty(entry.text))
            .map(entry =>
              entry.text
                .trim()
                .replace(/['"]+/gm, "")
                .trim()
            )
            .filter(text => !isEmpty(text))
        : []
    );

    const exampleList = isArray(entry.captionList.caption)
      ? map(entry.captionList.caption, "multiText")
      : [[entry.captionList.caption.multiText]];

    const examples = {};

    exampleList.forEach((_rows, index) => {
      const rows = isArray(_rows) ? _rows : [_rows];

      const ids = captions.map(entry => normalizeID(entry.text));

      rows.map(captionGroup => {
        if (isArray(captionGroup)) {
          return normalizeID(captionGroup[0].text);
        } else {
          return normalizeID(captionGroup.text);
        }
      });

      rows.forEach((row, _index) => {
        if (!examples[ids[_index]]) {
          examples[ids[_index]] = [];
        }

        examples[ids[_index]].push(row.text);
      });
    });

    const textEntries = captions;

    let { layout, blocks, nodes } = getLayout(
      textEntries,
      imageBlock,
      size,
      xPadding,
      yPadding
    );

    blocks = blocks.map(blockList =>
      blockList.map(block => ({
        ...block,
        format: PostFormat.post,
        template: TextTemplate.post,
        layout,
        config: {
          ...(block.config || {}),
          overrides: {
            ...get(block, "config.overrides", {}),
            maxWidth: undefined,
            fontSize: undefined
          }
        }
      }))
    );

    const bounds = {
      ...size,
      x: xPadding,
      y: yPadding,
      maxX: size.width,
      maxY: size.height,
      minX: 0,
      minY: 0
    };

    return {
      blocks,
      nodes,
      backgroundColor,
      layout,
      examples,

      keywords,
      strings,
      bounds,
      source_url: getThumbnailUrl(entry),
      rank: ORDERING.indexOf(String(entry.id))
    };
  } else if (hasAncientMemeCaptions) {
    const strings = uniq(
      flatMap(entry.captionList.caption, caption => {
        let up = caption.textUp;

        if (typeof up === "object") {
          up = up._text;
        }

        let down = caption.textDown;

        if (typeof down === "object") {
          down = down._text;
        }

        return [up, down];
      })
    )
      .filter(text => !isEmpty(text))
      .map(text => {
        return text
          .trim()
          .replace(/['"]+/gm, "")
          .trim();
      })
      .filter(text => !isEmpty(text));

    const bounds = {
      ...size,
      x: 20,
      y: 20,
      maxX: size.width,
      maxY: size.height,
      minX: 0,
      minY: 0
    };

    const examples = {
      [TOP_TEXT_ID]: [],
      [BOTTOM_TEXT_ID]: []
    };

    uniq(
      map(entry.captionList.caption, caption => {
        let up = caption.textUp;

        if (typeof up === "object") {
          up = up._text;
        }

        let down = caption.textDown;

        if (typeof down === "object") {
          down = down._text;
        }

        return [up, down];
      })
    ).forEach(([topTextExample, bottomTextExample]) => {
      if (!isEmpty(topTextExample)) {
        examples[TOP_TEXT_ID].push(topTextExample);
      }

      if (!isEmpty(bottomTextExample)) {
        examples[BOTTOM_TEXT_ID].push(bottomTextExample);
      }
    });

    return {
      blocks: [[imageBlock]],
      nodes: [createOldTextNode(false, size), createOldTextBlock(true, size)],
      backgroundColor,
      layout: PostLayout.media,
      examples,
      keywords,
      strings,
      bounds,
      source_url: getThumbnailUrl(entry),
      rank: ORDERING.indexOf(String(entry.id))
    };
  } else if (typeof captionsList === "undefined") {
    const bounds = {
      ...size,
      maxX: size.width,
      maxY: size.height,
      minX: 0,
      minY: 0
    };

    return {
      blocks: [[imageBlock]],
      nodes: [],
      examples: {},
      backgroundColor,
      layout: PostLayout.media,
      keywords,
      strings: [],
      bounds,
      source_url: getThumbnailUrl(entry),
      rank: ORDERING.indexOf(String(entry.id))
    };
  } else {
    return null;
  }
};

const posts = fromPairs(
  Object.entries(MEMES_LIST)
    .map(([id, entry]) => {
      return [id, convertEntry(entry)];
    })
    .filter(([id, entry]) => !!entry)
);

console.log(JSON.stringify(posts, null, 2));
