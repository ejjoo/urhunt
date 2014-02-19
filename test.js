var request = require('request')
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');

var lg = console.log;
var defaultUrl = "http://sumai.ur-net.go.jp";
var cities = [
	'http://www.ur-net.go.jp/kanto/search/search_area_tokyo.html',
	'http://www.ur-net.go.jp/kanto/search/search_area_kanagawa.html'
];

function getAreasUrlInCity(cityUrl, cb) {
	request.get(cityUrl, function (err, response, body) {
		if (err) {
			throw err;
		}

		console.log("received city data.")
		$ = cheerio.load(body);
		var urls = [];
		$(".arrow_sq > a").each(function() {
			var href = this.attr('href');
			var url = "http://www.ur-net.go.jp/" + href.substring(6, href.length);
			urls.push(url);
		});
		cb(urls);
	});
}


function getBuildingUrlInArea(areaUrl, cb) {
	console.log(areaUrl);
	request.get(areaUrl, function (err, response, body) {
		if (err) {
			throw err;
		}

		$ = cheerio.load(body);

		var buildingUrls = [];
		$(".link_sumai > a").each(function() {
			buildingUrls.push(this.attr('href'));
		});
		cb(null, buildingUrls);
	});
}


var Building = {
	addHouse: function(house) {
		this.houses.push(house);
	},
	addTraffics: function(traffic) {
		this.traffics.push(traffic);
	},
	create: function() {
		function Obj(){
			this.name = "";
			this.url = "";
			this.imageUrl = "";
			this.mapImageUrl = "";
			this.houses = [];
			this.traffics = [];
		};
		Obj.prototype = Building;
		return new Obj();
	}
}


var House = {
	no: 0,
	floor: 0,
	type: "",
	size: 0,
	monthlyFee: 0,
	maintainanceFee: 0,
	established: "",

	indexToKey: function(index) {
		var tb = [
			"no", "floor", "type", "size", "monthlyFee", "maintainanceFee", "established"
		];
		return tb[index];
	},
	init: function() {
		var f = this.floor.match(/\d+/g);
		this.floor = f[0] + "/" + f[1];

		var match = this.monthlyFee.match(/\d+/g);
		this.monthlyFee |= parseInt(match[0] + match[1]);
		this.maintainanceFee == parseInt(this.maintainanceFee);
	},
	create: function() {
		function Obj(){};
		Obj.prototype = House;
		return new Obj();
	}
}


function getBuilding(buildingUrl, cb) {
	request.get(buildingUrl, function (err, response, body) {
		if (err) {
			throw err;
		}

		$ = cheerio.load(body);
		var building = Building.create();
		building.url = buildingUrl;
		building.imageUrl = defaultUrl + $(".contents_left > img").attr("src");
		building.mapImageUrl = defaultUrl + $("#gstartId1 > img").attr("src");
		var buildingInfoMeta = $(".contents_middle");
		building.address = buildingInfoMeta.find("td").html();
		console.log(building.address);
		buildingInfoMeta.find("ul").find("li").each(function(i) {
			var v = this.text().trim();
			if (v != "" && i < 5) {				
				building.addTraffics(v);
			}
		})

		var selector = $(".housing_complex_table > tr").next();
		selector.each(function(index) {
			if (index % 3 == 0) {
				var house = House.create();
				house.imageUrl = this.find("img").attr("src");
				this.find(".h60").each(function(index) {
					house[House.indexToKey(index)] = this.text().trim();
				});
				house.init();
				building.addHouse(house);
			}
		});

		var isOk = false;
		for (var i in building.houses) { 
			var house = building.houses[i];
			if (parseInt(house.monthlyFee) + parseInt(house.maintainanceFee) <= 160000) {
				isOk = true;
			}
		}

		if (building.houses.length == 0 || isOk == false) {
			cb(null, null);
		}
		else {
			cb(null, building);
		}
	});
}


var fs = require('fs');
var ejs = require('ejs');
/*
var buildings = [];
for (var i in cities) {
	eachAreaUrlInCity(cities[i], function(areaUrl) {
		eachBuildingInArea(areaUrl, function(buildingUrl) {
			getBuilding(buildingUrl, function(building) {
				buildings.push(building);
			});
		});
	});
}
*/

var testArea = 'http://www.ur-net.go.jp/akiya/kanagawa/list_a06.html';
var testBuilding = 'http://sumai.ur-net.go.jp/chintai/s/danchi/1020689.html';
getAreasUrlInCity('http://www.ur-net.go.jp/kanto/search/search_area_tokyo.html', function(testAreas) {
	async.map(testAreas, getBuildingUrlInArea, function(err, result) {	
		var buildingUrls = [];
		for (var i in result) {
			for (var j in result[i]) {
				buildingUrls.push(result[i][j]);;
			}
		}
		async.map(buildingUrls, getBuilding, function(err, result) {
			if (err) {
				throw(err);
			}
			fs.readFile('./template.html', 'utf8', function(error, data) {
				fs.writeFile('./result.html', ejs.render(data, {buildings: result}));
			});	
		})
	});
});