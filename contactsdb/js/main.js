$(document).ready(function() {
	window.app = AppController.init({});
});

// Code from: http://stackoverflow.com/questions/5381621/jquery-function-to-get-all-unique-elements-from-an-array
$.extend({
    distinct : function(anArray) {
       var result = [];
       $.each(anArray, function(i,v){
           if ($.inArray(v, result) == -1) result.push(v);
       });
       return result;
    }
});