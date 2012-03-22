var rows = [];
var terms = ["schoolname", "schoolnumber", "omnibussurvey", "pd", "rla", "stem", "tle", "dst", "nctctfa", "ncvps", "strategicstaffing", "ntsp"];

var getURLParameter = function(name) {
    return decodeURIComponent((RegExp('[?|&]' + name + '=' + '(.+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
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

var parseGoogleSpreadsheet = function (json) {
    for (var i = 0; i < json.feed.entry.length; i++) {
        var line = parseLine(json.feed.entry[i]);
        rows.push(line);
    }
};

var buildCheckedTextbox = function(data) {
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    $(checkbox).click(function(){return false;});
    if (data === "X") {
        checkbox.checked = "True";
    }
    return checkbox;
};

var collectByLeaName = function() {
    var LEAs = {};
    for (var i = 0; i < rows.length; i++) {
        var leaname = rows[i].leaname;
        delete rows[i].leaname;
        if (LEAs.hasOwnProperty(leaname) === false) {
            LEAs[leaname] = [rows[i]];
        } else {
            LEAs[leaname].push(rows[i]);
        }
    }
    return LEAs;
};

var render = function() {
    var rows_by_LEAname = collectByLeaName();
    var data_table = document.getElementById('data_table');

    for(var leaname in rows_by_LEAname) {
        var row_color = "white";

        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.style.border = "0px";
        td.colSpan = 12;
        var leaNameText = document.createElement('h2');
        leaNameText.style.color = "#466089";
        leaNameText.appendChild(document.createTextNode(leaname + ' Schools'));
        td.appendChild(leaNameText);
        tr.appendChild(td);
        data_table.appendChild(tr);

        for (var i = 0; i < rows_by_LEAname[leaname].length; i++) {
            var tr = document.createElement('tr');

            if (row_color === "white") {
                row_color = "grey";
            } else {
                tr.style.background = "#d2d2d2"
                row_color = "white";
            }
    
            var schoolname = document.createElement('td');
            var hTag = document.createElement('h3');
            hTag.appendChild(document.createTextNode(rows_by_LEAname[leaname][i].schoolname));
            schoolname.appendChild(hTag);
            tr.appendChild(schoolname);
    
            var schoolnumber = document.createElement('td');
            var hTag = document.createElement('h3');
            hTag.appendChild(document.createTextNode(rows_by_LEAname[leaname][i].schoolnumber));
            schoolnumber.appendChild(hTag);
            tr.appendChild(schoolnumber);
    
            var omnibussurvey = document.createElement('td');
            omnibussurvey.className = "centercell"
            omnibussurveyCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].omnibussurvey);
            omnibussurvey.appendChild(omnibussurveyCheckbox);
            tr.appendChild(omnibussurvey);
    
            var pd = document.createElement('td');
            pd.className = "centercell"
            pdCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].pd);
            pd.appendChild(pdCheckbox);
            tr.appendChild(pd);
    
            var rla = document.createElement('td');
            rla.className = "centercell"
            rlaCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].rla);
            rla.appendChild(rlaCheckbox);
            tr.appendChild(rla);
    
            var stem = document.createElement('td');
            stem.className = "centercell"
            stemCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].stem);
            stem.appendChild(stemCheckbox);
            tr.appendChild(stem);
    
            var tle = document.createElement('td');
            tle.className = "centercell"
            tleCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].tle);
            tle.appendChild(tleCheckbox);
            tr.appendChild(tle);
    
            var dst = document.createElement('td');
            dst.className = "centercell"
            dstCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].dst);
            dst.appendChild(dstCheckbox);
            tr.appendChild(dst);
    
            var nctctfa = document.createElement('td');
            nctctfa.className = "greenborder leftborder topborder bottomborder centercell"
            nctctfaCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].nctctfa);
            nctctfa.appendChild(nctctfaCheckbox);
            tr.appendChild(nctctfa);
    
            var ncvps = document.createElement('td');
            ncvps.className = "greenborder topborder bottomborder centercell"
            ncvpsCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].ncvps);
            ncvps.appendChild(ncvpsCheckbox);
            tr.appendChild(ncvps);
    
            var strategicstaffing = document.createElement('td');
            strategicstaffing.className = "greenborder topborder bottomborder centercell"
            strategicstaffingCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].strategicstaffing);
            strategicstaffing.appendChild(strategicstaffingCheckbox);
            tr.appendChild(strategicstaffing);
    
            var ntsp = document.createElement('td');
            ntsp.className = "greenborder topborder bottomborder rightborder centercell"
            ntspCheckbox = buildCheckedTextbox(rows_by_LEAname[leaname][i].ntsp);
            ntsp.appendChild(ntspCheckbox);
            tr.appendChild(ntsp);
    
            data_table.appendChild(tr);
        }
    }
};

