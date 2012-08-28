var db           = "https://spreadsheets.google.com/feeds/list/0AnZsJpNttyrZdElvZ0tXRXZIWHdkR2xTbkpnZmNJa1E/";
var terms        = ["leaname", "leano", "superintendentfirst", "superintendentlast", "superemail", "phoneofficearea", "phoneofficeexch", "phoneofficeline", "learegion", "leadcoordinatorname", "leadcoordinatortitle", "leadcoordinatoremail", "leadcoordinatorphone", "addressline1", "addressline2", "city", "state", "zipcode5"];
var contactTerms = ["learegion", "leaname", "leano", "schoolname", "schoolnumber", "principalfirstname", "principallastname", "principalemail", "schoperationalstatusdesc", "phoneofficearea", "phoneofficeexch", "phoneofficeline", "addressline1", "addressline2", "city", "state", "zipcode5"];

var parseCharterSpreadsheet = function(data) {
	var view    = window.app.charterDB;
	var feed    = data.feed;
	var entries = feed.entry || [];
	var data    = new Array();

	for (var i = 0; i < entries.length; i++) {
		var option   = document.createElement('option');
		option.value = i;
		option.text  = entries[i].title.$t;
		$("#select-charterschl").append(option);

		var line = parseLine(entries[i]);
		data.push(line);
	}

	view.model.finishedLoading(data);
};

var parseLEASpreadsheet = function(data) {
	var view    = window.app.leaDB;
	var feed    = data.feed;
	var entries = feed.entry || [];
	var data    = new Array();

	for (var i = 0; i < entries.length; i++) {
		var option   = document.createElement('option');
		option.value = i;
		option.text  = entries[i].title.$t;
		$("#select-leaschl").append(option);

		var line = parseLine(entries[i]);
		data.push(line);
	}

	view.model.finishedLoading(data);
};

var parseContactSpreadsheet = function(data) {
	var view    = window.app.schoolDB;
	var feed    = data.feed;
	var entries = feed.entry || [];
	var data    = new Array();
	var regions = new Array('All');
	var schools = new Array('All');

	for (var i = 0; i < entries.length; i++) {
		var line = parseContactLine(entries[i]);
		line.learegion = entries[i].title.$t;
		data.push(line);

		schools.push(line.leaname);
		regions.push(entries[i].title.$t);
	}

	schools = $.distinct(schools);
	regions = $.distinct(regions);

	for (var i = 0; i < schools.length; i++) {
		var option   = document.createElement('option');
		option.value = i;
		option.text  = schools[i];
		$("#select-schoolcontactdb").append(option);
	}

	for (var i = 0; i < regions.length; i++) {
		var option   = document.createElement('option');
		option.value = i;
		option.text  = regions[i];
		$("#select-schoolcontactdb-region").append(option);
	}

	view.model.finishedLoading(data);
};

var parseContactLine = function(entry) {
    var parsed_line = {};

    //Handle "Title"
    parsed_line["leaname"] = entry.title.$t;

    //Handle "Content"
    var all_terms_or_as_regex = "(" + contactTerms.join("|") + ")";
    for (var i = 0; i < contactTerms.length; i++) {
        var pattern = contactTerms[i] + ": ((.*?), " + all_terms_or_as_regex + "|.*)";
        regex_to_run = new RegExp(pattern,"g");
        var match = regex_to_run.exec(entry.content.$t);
        if (match === null) {
            continue;
        }
        if (match[2] === undefined) {
            parsed_line[contactTerms[i]] = match[1] || "N/A";
        } else {
            parsed_line[contactTerms[i]] = match[2] || "N/A";
        }
    }
    return parsed_line;
};

var parseLine = function(entry) {
    var parsed_line = {};

    //Handle "Title"
    parsed_line["leaname"] = entry.title.$t;

    //Handle "Content"
    var all_terms_or_as_regex = "(" + terms.join("|") + ")";
    for (var i = 0; i < terms.length; i++) {
        var pattern = terms[i] + ": ((.*?), " + all_terms_or_as_regex + "|.*)";
        regex_to_run = new RegExp(pattern,"g");
        var match = regex_to_run.exec(entry.content.$t);
        if (match === null) {
            continue;
        }
        if (match[2] === undefined) {
            parsed_line[terms[i]] = match[1];
        } else {
            parsed_line[terms[i]] = match[2];
        }
    }
    return parsed_line;
};

var SingleModel = Backbone.Model.extend({
	defaults: {
		gid: '0',
		name: 'contacts',
		title: 'Contacts',
		data: new Array(),
		loaded: false
	},
	initialize: function() {
		return this;
	},
	loadDB: function(callback) {
		var script = document.createElement('script');
		script.src = db + this.get('gid') + '/public/basic?alt=json-in-script&callback=' + callback;
		document.body.appendChild(script);
	},
	finishedLoading: function(data) {
		this.set('data', data);
		this.set('loaded', true);
	}
});

var CharterSchoolDBView = Backbone.View.extend({
	tagName:   "section",
	id:        "charterdb",
	className: "contacts-db",
	template:  $("#single-template").html(),
	events:{
		"click .btn.btn-primary" : "generate"
	},
	initialize: function() {
		this.model = new SingleModel({name: 'charterschl', title: 'Charter School Contact Database', gid: '2'});

		_.bindAll(this, "loaded");
		this.model.bind("change:loaded", this.loaded);

		var templ = _.template(this.template);
		this.$el.html(templ(this.model.toJSON()));
	},
	loaded: function() {
		var that = this;

		this.$el.find('select').select2({width: 'resolve'});
		this.$el.find('select').on('change', function() {
			that.hideInfo();
		});

		this.$el.find('.loader').hide();
		this.$el.find('.form-input').fadeIn();
	},
	generate: function() {
		var selected = this.$el.find('select').val();
		var info     = this.model.get('data')[selected];

		var wrap = this.$el.find('.info-wrap');
		wrap.find('.name').text(info.superintendentfirst + ' ' + info.superintendentlast);
		wrap.find('.phone').text('(' + info.phoneofficearea + ') ' + info.phoneofficeexch + '-' + info.phoneofficeline);
		wrap.find('.email').html('<a href="mailto:' + info.superemail + '">' + info.superemail + '</a>');
		
		wrap.find('.leanum').text('LEA No: ' + info.leano);
		wrap.find('.learegion').text('LEA Region: ' + info.learegion);

		wrap.find('.address1').text(info.addressline1);
		wrap.find('.address2').text(info.addressline2);
		wrap.find('.addressinfo').text(info.city + ', ' + info.state + ' ' + info.zipcode5);

		wrap.slideDown();
	},
	hideInfo: function() {
		this.$el.find('.info-wrap').fadeOut();
	}
});

var LEADBView = Backbone.View.extend({
	tagName:   "section",
	id:        "leadb",
	className: "contacts-db",
	template:  $("#single-template").html(),
	events:{
		"click .btn.btn-primary" : "generate"
	},
	initialize: function() {
		this.model = new SingleModel({name: 'leaschl', title: 'LEA Contact Database', gid: '1'});

		_.bindAll(this, "loaded");
		this.model.bind("change:loaded", this.loaded);

		var templ = _.template(this.template);
		this.$el.html(templ(this.model.toJSON()));
	},
	loaded: function() {
		var that = this;

		this.$el.find('select').select2({width: 'resolve'});
		this.$el.find('select').on('change', function() {
			that.hideInfo();
		});

		this.$el.find('.loader').hide();
		this.$el.find('.form-input').fadeIn();
	},
	generate: function() {
		var selected = this.$el.find('select').val();
		var info     = this.model.get('data')[selected];

		var wrap = this.$el.find('.info-wrap');
		wrap.find('.name').text(info.superintendentfirst + ' ' + info.superintendentlast);
		wrap.find('.phone').text('(' + info.phoneofficearea + ') ' + info.phoneofficeexch + '-' + info.phoneofficeline);
		wrap.find('.email').html('<a href="mailto:' + info.superemail + '">' + info.superemail + '</a>');
		
		wrap.find('.leanum').text('LEA No: ' + info.leano);
		wrap.find('.learegion').text('LEA Region: ' + info.learegion);

		wrap.find('.address1').text(info.addressline1);
		wrap.find('.address2').text(info.addressline2);
		wrap.find('.addressinfo').text(info.city + ', ' + info.state + ' ' + info.zipcode5);

		wrap.slideDown();
	},
	hideInfo: function() {
		this.$el.find('.info-wrap').fadeOut();
	}
});

var SchoolContactDBView = Backbone.View.extend({
	tagName:   "section",
	id:        "schoolcontactdb",
	className: "contacts-db",
	template:  $("#double-template").html(),
	events:{
		"click .btn.btn-primary" : "generate"
	},
	initialize: function() {
		this.model = new SingleModel({name: 'schoolcontactdb', title: 'School Contact Database', gid: '3'});
		this.model.set('tableInitialized', false);

		_.bindAll(this, "loaded");
		this.model.bind("change:loaded", this.loaded);

		var templ = _.template(this.template);
		this.$el.html(templ(this.model.toJSON()));
	},
	loaded: function() {
		var that = this;

		this.$el.find('select').select2({width: 'resolve'});
		this.$el.find('select').on('change', function() {
			that.changeSelect(this);
		});

		this.$el.find('.loader').hide();
		this.$el.find('.form-input').fadeIn();
	},
	generate: function() {
		var school = $(this.el).find('select.schools option:selected').text();
		var region = $(this.el).find('select.regions option:selected').text();
		var wrap   = $(this.el).find('.info-wrap');
		var data   = this.model.get('data');

		var results = new Array();

		if (school != 'All') {
			for (var i = 0; i < data.length; i++) {
				if (data[i].leaname == school) results.push(data[i]);
			}
		} else if (school == 'All' && region != 'All') {
			for (var i = 0; i < data.length; i++) {
				if (data[i].learegion == region) results.push(data[i]);
			}
		} else {
			results = data;
		}

		if (this.model.get('tableInitialized') == false) {
			this.initializeTable();
			this.model.set('tableInitialized', true);
		}

		$("#table-schoolcontactdb").dataTable().fnClearTable();

		for (var i = 0; i < results.length; i++) {
			var temp = results[i];
			$('#table-schoolcontactdb').dataTable().fnAddData([temp['learegion'] || 'N/A', temp['leaname'] || 'N/A', temp['leano'] || 'N/A', temp['schoolname'] || 'N/A', temp['schoolnumber'] || 'N/A', temp['principalfirstname'] || 'N/A', temp['principallastname'] || 'N/A', temp['principalemail'] || 'N/A', temp['schoperationalstatusdesc'] || 'N/A', temp['phoneofficearea'] || 'N/A', temp['phoneofficeexch'] || 'N/A', temp['phoneofficeline'] || 'N/A', temp['addressline1'] || 'N/A', temp['addressline2'] || 'N/A', temp['city'] || 'N/A', temp['state'] || 'N/A', temp['zipcode5'] || 'N/A']);
		}

		wrap.slideDown();

	},
	changeSelect: function(obj) {
		$(this.el).find('select').not('#' + $(obj).attr('id')).select2("val", "All");
	},
	hideInfo: function() {
		$(this.el).find('select').select2("val", "All");
		this.$el.find('.info-wrap').fadeOut();
		if (this.model.get('tableInitialized') == true) {
			console.log('clearing table');
			$("#table-schoolcontactdb").dataTable().fnClearTable();
		}
	},
	initializeTable: function() {
		$('#table-schoolcontactdb').dataTable({
			"aoColumns": [
				{"sTitle": "LEA Region"},
				{"sTitle": "LEA Name"},
				{"sTitle": "LEA No"},
				{"sTitle": "School Name"},
				{"sTitle": "School Number"},
				{"sTitle": "Principal First Name"},
				{"sTitle": "Principal Last Name"},
				{"sTitle": "Principal Email"},
				{"sTitle": "Sch Operational Status Desc"},
				{"sTitle": "Phone Office Area"},
				{"sTitle": "Phone Office Exch"},
				{"sTitle": "Phone Office Line"},
				{"sTitle": "Address Line 1"},
				{"sTitle": "Address Line 2"},
				{"sTitle": "City"},
				{"sTitle": "State"},
				{"sTitle": "Zip"}
			]
		});
	}
});

var Workspace = Backbone.Router.extend({
	routes: {
		"": "homepage",
		"*action": "switchDB",
	},
	homepage:function() {
		window.location = "#charterdb";
	},
	switchDB: function(db) {
		// Reset all forms
		AppController.charterDB.hideInfo();
		AppController.leaDB.hideInfo();
		AppController.schoolDB.hideInfo();

		switch (db) {
			case 'charterdb':
				var charter = AppController.charterDB.model;
				if (!charter.get('loaded')) charter.loadDB('parseCharterSpreadsheet');
				break;

			case 'leadb':
				var lea = AppController.leaDB.model;
				if (!lea.get('loaded')) lea.loadDB('parseLEASpreadsheet');
				break;

			case 'schoolcontactdb':
				var contacts = AppController.schoolDB.model;
				if (!contacts.get('loaded')) contacts.loadDB('parseContactSpreadsheet');
				break;

			default:
				break;
		}

		$('#tabs li').removeClass('selected');
		$('#tabs .' + db).addClass('selected');
	}
});

var AppController = {
	init: function() {
		this.view = $("#contactdbs");

		this.charterDB = new CharterSchoolDBView();
		this.leaDB     = new LEADBView();
		this.schoolDB  = new SchoolContactDBView();

		this.view.append(this.charterDB.el);
		this.view.append(this.leaDB.el);
		this.view.append(this.schoolDB.el);

		var router = new Workspace();
		Backbone.history.start();

		return this;
	}
};