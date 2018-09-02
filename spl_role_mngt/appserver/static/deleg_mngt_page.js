require.config({
    waitSeconds: 0,
    paths: {
        'jquery-ui': '../app/spl_role_mngt/js/contrib/jquery-1.11.1.ui.min',
        'jquery': '../app/spl_role_mngt/js/contrib/jquery-1.12.1.min',
	'select2': '../app/spl_role_mngt/js/contrib/select2.min'
    },
    shim: {
	"jquery": {},
        "jquery_ui": {
            deps: ["jquery"],
        },
	"select2": {},
    }
});

require(
[
    "select2",
    "jquery",
    "jquery-ui",
    "splunkjs/mvc",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/simplexml/ready!"
],
function
(
	_,
	_,
	_,
        mvc, 
	SearchManager
)
{

	// Global
	var lk_users_dict = [];
	var lk_delegation_dict = [];
	var all_roles = [];
	
	function cl(msg) {
		console.log(msg);
	}
	
	function rest_save_csv(dict,lk_name) {
		
		
		// Back to csv
		var fields = Object.keys(dict[0]);
		var array = Object.values(dict);
		var csv = [];
		csv.push(fields);
		for (var line of array) {
			csv.push(fields.map(key => line[key]));
		}

		var json = JSON.stringify(csv);

		data = {"lookup_file":lk_name,
                "namespace"  :"spl_role_mngt",
			    "contents"   : json};

		url = Splunk.util.make_full_url("/splunkd/__raw/services/data/lookup_edit/lookup_contents");

		$.ajax({
				url: url,
				type: 'POST',
				data: data,

							success: function () {
										return true;
									}
		});
	
		
	}
	
	function rest_load_csv(lookup) {	
	
		var data_ret = [];
		var jrequest = {"lookup_file":lookup,
							"namespace"  :"spl_role_mngt",
							"header_only": false,
							"lookup_type": "csv"};

		url = Splunk.util.make_full_url("/splunkd/__raw/services/data/lookup_edit/lookup_contents", jrequest);

		$.ajax({
		   url: url,
		   async: false,
		   cache: false,
				
				success: function (data) {

					// Data could not be loaded
					if (data === null) {
						console.error('JSON of lookup table could not be loaded (got an empty value)');
						data_ret = null ;
						}

					// Data can be loaded
					else {
					data_ret = data ;
					}
				}
				
		});
		
		return data_ret;

	}

	function csv_2_dict(csv) {
		
		var dict = [] ;
		var headers = csv[0];

		for(var i = 1; i < csv.length; i++) {
			 var obj = {};
			 var currentline = csv[i];
			 for(var j=0;j<headers.length;j++){
				 obj[headers[j]] = currentline[j];
			 }
			 dict.push(obj); 
		}
		return dict;
	}
	
	function s2_fill_user_list() {
		
		var list = [] ;
		var id=0;
		lk_users_dict.forEach(function(key) {
			
			var key1 = "id";
			var key2 = "idrh";
			var key3 = "text";
			
			
			var obj = {};
			obj[key1] = id;
			obj[key2] = key.idrh;
		    obj[key3] = key.prenom+" "+key.nom+" ("+key.idrh+")";
			
			list.push(obj);
			id = id + 1;
		
		});
			
		return list;
		
	}
	
	
	function fetch_all_roles(){
		
		var myservice = mvc.createService();
		var searchQuery = "rest /services/authorization/roles | table title";
		myservice.search(
					  searchQuery,
					  {exec_mode: "blocking"},
					  function(err, job) {
							job.fetch(function(err){
							  job.results({}, function(err, results) {
									results.rows.forEach(function(element){
										all_roles.push(element[0]);
									});
								});
								
							});
						});
				
	}
		
	function get_all_roles() {
			return all_roles;
	}
	
	// initial load:
	fetch_all_roles();
	csv = rest_load_csv("user.csv");
    lk_users_dict  =  csv_2_dict(csv);
	csv = rest_load_csv("delegation.csv");
	lk_delegation_dict  =  csv_2_dict(csv);
	
	
	var drop_user = $('#top_user_list');
		
	drop_user.select2({
		 placeholder: "Selectionner un utilisateur",
		 data: s2_fill_user_list(),
		 dropdownAutoWidth: true,
		 width: 'auto',
		 allowClear: true
	});
	
	$('#top_user_list').on("change", function (e) {
		
			// "On change" fires si item supprimé ...dans cas added est remplacé par removed 
			if(e.hasOwnProperty("added")){
			
			var selected_user = e.added.idrh;
			var cur_list_role = [];
			
			if (lk_delegation_dict.findIndex((obj => obj.idrh == selected_user)) != -1) {
				cur_list_role = lk_delegation_dict[lk_delegation_dict.findIndex((obj => obj.idrh == selected_user))].roles.split(":");
			}
			
			var available_role = get_all_roles();  
			
			$("#current_roles").empty();
			$("#dispo_roles").empty();
			
			cur_list_role.forEach(function(element) {
				
				var pos = available_role.indexOf(element); // >0 si dans liste auth
				
				if (pos != -1 ) {
					$("#current_roles").append($("<li class='ui-widget-content selectable'>").text(element));
					var delete_item = available_role.splice(pos,1);
					}
				else {
					$("#current_roles").append($("<li class='ui-widget-content forbiden'>").text(element));
					}

			});
			
			available_role.forEach(function(element) {
				$("#dispo_roles").append($("<li class='ui-widget-content selectable '>").text(element));
			});	
			}
		});

	$(function() {

				$( ".paramsnav" ).selectable();
		});

	$( "#current_roles" ).on("click","li.selectable", function(event) {

		$(this).appendTo("#dispo_roles");
		$(this).removeClass('ui-selected');
		

		cur_options = [];

		$('.current li').each(function() {
				cur_options.push($(this).text());
		});
		
		var selected_user = drop_user.select2('data').idrh;
		objIndex = lk_delegation_dict.findIndex((obj => obj.idrh == selected_user));
		
		if(objIndex != -1) {
			lk_delegation_dict[objIndex].roles = cur_options.join(":");
		}
		else {
			new_user = {};
			new_user["idrh"] = selected_user;
			new_user["roles"] = cur_options.join(":");
			lk_delegation_dict.push(new_user);
		}
		
		cl(lk_delegation_dict);
	});

	$( "#dispo_roles" ).on("click","li.selectable", function(event) {

		$(this).appendTo("#current_roles");
		$(this).removeClass('ui-selected');
		
		cur_options = [];

		$('.current li').each(function() {
				cur_options.push($(this).text());
		});
		
		var selected_user = drop_user.select2('data').idrh;
		objIndex = lk_delegation_dict.findIndex((obj => obj.idrh == selected_user));
		
		if(objIndex != -1) {
			lk_delegation_dict[objIndex].roles = cur_options.join(":");
		}
		else {
			new_user = {};
			new_user["idrh"] = selected_user;
			new_user["roles"] = cur_options.join(":");
			lk_delegation_dict.push(new_user);
		}

	});
	

	$( "#save_role" ).on("click", function( event ) {

		event.preventDefault();
		rest_save_csv(lk_delegation_dict,"delegation.csv");
		
	});
	
	
	$( "#cancel" ).on("click", function( event ) {
		
		csv = rest_load_csv("user.csv");
		lk_users_dict  =  csv_2_dict(csv);
		csv = rest_load_csv("delegation.csv");
		lk_delegation_dict  =  csv_2_dict(csv);
		drop_user.select2({
				data: s2_fill_user_list()
			});
		$('#top_user_list').val("");
		// Clear roles
		$("#current_roles").empty();
		$("#dispo_roles").empty();
		
	});	
	
});




