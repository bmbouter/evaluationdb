var db    = "https://spreadsheets.google.com/feeds/list/0AnZsJpNttyrZdElvZ0tXRXZIWHdkR2xTbkpnZmNJa1E/";
var terms = ["leaname", "leano", "superintendentfirst", "superintendentlast", "superemail", "phoneofficearea", "phoneofficeexch", "phoneofficeline", "learegion", "leadcoordinatorname", "leadcoordinatortitle", "leadcoordinatoremail", "leadcoordinatorphone", "addressline1", "addressline2", "city", "state", "zipcode5"];


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

var parseLine = function(entry) {
    var parsed_line = {}

    //Handle "Title"
    parsed_line["leaname"] = entry.title.$t

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
	tagName:   "div",
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

		this.model.loadDB('parseCharterSpreadsheet');
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

var AppController = {
	init: function() {
		this.view = $("#contactdbs");

		this.charterDB = new CharterSchoolDBView();
		
		this.view.append(this.charterDB.el);

		return this;
	}
};