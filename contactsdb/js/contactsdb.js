var db           = "https://spreadsheets.google.com/feeds/list/0AnZsJpNttyrZdElvZ0tXRXZIWHdkR2xTbkpnZmNJa1E/";
var terms        = ["leaname", "leano", "schoolleadershipfirst", "schoolleadershiplast", "superemail", "superintendenttitle", "phoneofficearea", "phoneofficeexch", "phoneofficeline", "learegion", "leadrtttcoordinatorname", "leadrtttcoordinatortitle", "leadrtttcoordinatoremail", "leadrtttcoordinatorphone", "addressline1", "addressline2", "city", "state", "zipcode5"];
var contactTerms = ["learegion", "leaname", "leano", "schoolname", "schoolnumber", "principalfirstname", "principallastname", "principalemail", "schoperationalstatusdesc", "phoneofficearea", "phoneofficeexch", "phoneofficeline", "addressline1", "addressline2", "city", "state", "zipcode5"];

var parseCharterSpreadsheet = function(data) {
	var view    = window.app.charterDB;
	var feed    = data.feed;
	var entries = feed.entry || [];
	var data    = new Array();

	$("#select-charterschl").append("<option value='select'>Select...</option>");

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

	$("#select-leaschl").append("<option value='select'>Select...</option>");

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
	var schools = new Array('All');

	for (var i = 0; i < entries.length; i++) {
		var line = parseContactLine(entries[i]);
		line.learegion = entries[i].title.$t;
		data.push(line);

		schools.push(line.leaname);
	}

	schools = $.distinct(schools);

	for (var i = 0; i < schools.length; i++) {
		var option   = document.createElement('option');
		option.value = i;
		option.text  = schools[i];
		$("#select-schoolcontactdb").append(option);
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
		"change select" : "generate"
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
		wrap.find('.leadrttname').text(info.leadrtttcoordinatorname || '-');
		wrap.find('.leadrtttitle').text(info.leadrtttcoordinatortitle || '-');
		wrap.find('.leadrttemail').text(info.leadrtttcoordinatoremail || '-');
		wrap.find('.leadrttphone').text(info.leadrtttcoordinatorphone || '-');

		wrap.find('.name').text(info.schoolleadershipfirst + ' ' + info.schoolleadershiplast);
		wrap.find('.title').text(info.superintendenttitle);
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
		"change select" : "generate"
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
		wrap.find('.leadrttname').text(info.leadrtttcoordinatorname || '-');
		wrap.find('.leadrtttitle').text(info.leadrtttcoordinatortitle || '-');
		wrap.find('.leadrttemail').text(info.leadrtttcoordinatoremail || '-');
		wrap.find('.leadrttphone').text(info.leadrtttcoordinatorphone || '-');

		wrap.find('.name').text(info.schoolleadershipfirst + ' ' + info.schoolleadershiplast);
		wrap.find('.title').text(info.superintendenttitle);
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
		"change select" : "generate"
	},
	initialize: function() {
		this.model = new SingleModel({name: 'schoolcontactdb', title: 'School Contact Database', gid: '3'});

		_.bindAll(this, "loaded");
		this.model.bind("change:loaded", this.loaded);

		var templ = _.template(this.template);
		this.$el.html(templ(this.model.toJSON()));
	},
	loaded: function() {
		this.$el.find('select').select2({width: 'resolve'});
		this.resetSchoolSelect();

		this.$el.find('.loader').hide();
		this.$el.find('.form-input').fadeIn();
	},
	generate: function(obj) {
		var school  = $(this.el).find('select.schools option:selected').text();
		var wrap    = $(this.el).find('.info-wrap');
		var data    = this.model.get('data');

		var results = new Array();

		if (school != 'All') {
			for (var i = 0; i < data.length; i++) {
				if (data[i].leaname == school) results.push(data[i]);
			}
		} else {
			results = data;
		}

		// This will take care of the first select being changed
		if (obj.currentTarget.id == 'select-schoolcontactdb') {
			wrap.fadeOut();

			// Let's update the second select with all the schools in the selected LEA
			$('#select-schoolcontactdb-school').empty();
			$('#select-schoolcontactdb-school').append("<option value='select'>Select...</option>");

			for (var i = 0; i < results.length; i++) {
				var opt   = document.createElement('option');
				opt.value = results[i].schoolnumber;
				opt.text  = results[i].schoolname;

				$('#select-schoolcontactdb-school').append(opt);
			};

			$('select.school-names').select2('enable');
			$('select.school-names').select2('val', 'Select...');
		} else {
			wrap.fadeOut();

			var answer;
			var number = $(this.el).find('select.school-names option:selected').val();

			for (var i = 0; i < results.length; i++) {
				if (results[i].schoolnumber == number) {
					answer = results[i];
				}
			}

			wrap.find('.name').text(answer.principalfirstname + ' ' + answer.principallastname);
			wrap.find('.phone').text('(' + answer.phoneofficearea + ') ' + answer.phoneofficeexch + '-' + answer.phoneofficeline);
			wrap.find('.email').html('<a href="mailto:' + answer.principalemail + '">' + answer.principalemail + '</a>');
			
			wrap.find('.leanum').text('LEA No: ' + answer.leano);
			wrap.find('.learegion').text('LEA Region: ' + answer.learegion);

			wrap.find('.address1').text(answer.addressline1);
			wrap.find('.address2').text(answer.addressline2 || '-');
			wrap.find('.addressinfo').text(answer.city + ', ' + answer.state + ' ' + answer.zipcode5);

			wrap.slideDown();
		}
	},
	hideInfo: function() {
		$(this.el).find('select').select2("val", "All");
		this.$el.find('.info-wrap').fadeOut();
	},
	resetSchoolSelect: function() {
		var select = $('select.school-names');
		select.empty();
		select.select2('disable');
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

		if (!this.charterDB.model.get('loaded')) this.charterDB.model.loadDB('parseCharterSpreadsheet');
		if (!this.leaDB.model.get('loaded')) this.leaDB.model.loadDB('parseLEASpreadsheet');
		if (!this.schoolDB.model.get('loaded')) this.schoolDB.model.loadDB('parseContactSpreadsheet');

		this.view.append(this.charterDB.el);
		this.view.append(this.leaDB.el);
		this.view.append(this.schoolDB.el);

		var router = new Workspace();
		Backbone.history.start();

		return this;
	}
};