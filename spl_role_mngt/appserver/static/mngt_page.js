require.config({
    waitSeconds: 0,
    paths: {
        'jquery-ui': '../app/spl_role_mngt/js/contrib/jquery-1.11.1.ui.min',
        'jquery': '../app/spl_role_mngt/js/contrib/jquery-1.12.1.min',
    },
    shim: {
	"jquery": {},
        "jquery_ui": {
            deps: ["jquery"]
        }
    }
});

require(
[
    "jquery",
    "jquery-ui",
    "splunkjs/mvc",
    "splunkjs/mvc/dropdownview",
    "splunkjs/mvc/multidropdownview",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/simplexml/ready!"
],
function
(
	_,
	_,
        mvc, 
        DropdownView, 
	MultiDropdownView,
	SearchManager
)
{

	
	// Global
	var lk_users_dict = [];
	var lk_delegation_dict = [];

	function get_all_roles() {

		var rt_list;
		// | rest /services/authorization/roles | table titles


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
	
	function fill_user_list(user_dict) {
		
		var list = [] ;
		user_dict.forEach(function(key) {
			
			var key1 = "label";
			var key2 = "value";
			var obj = {};
			obj[key1] = key.idrh+" ("+key.prenom+" "+key.nom+")";
			obj[key2] = key.idrh;
			list.push(obj);
		
		});
			
		mydropdownuser.settings.set("choices", list);
	}
	

	var mydropdownuser = new DropdownView(
        {
                id: "users_list",
                showClearButton: false,
                el: $("#users_list")
				
        }).render();
	
	// initial load:
	csv = rest_load_csv("user.csv");
    lk_users_dict  =  csv_2_dict(csv);
	csv = rest_load_csv("delegation.csv");
	lk_delegation_dict  =  csv_2_dict(csv);
	
	fill_user_list(lk_users_dict);

	mydropdownuser.on("change", function()
        {
			var selected_user = mydropdownuser.settings.get("value");
			var cur_list_role = lk_users_dict[lk_users_dict.findIndex((obj => obj.idrh == selected_user))].roles.split(":");
			var available_role =  lk_delegation_dict[lk_delegation_dict.findIndex((obj => obj.user == $C.USERNAME))].roles.split(":");   
			
			$("#current_roles").empty();
					$("#dispo_roles").empty();
			cur_list_role.forEach(function(element) {
				var pos = available_role.indexOf(element); // >0 si dans liste auth
				if (pos >= 0) {
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
		
		var selected_user = mydropdownuser.settings.get("value");
		objIndex = lk_users_dict.findIndex((obj => obj.idrh == selected_user));
		lk_users_dict[objIndex].roles = cur_options.join(":");

	});

	$( "#dispo_roles" ).on("click","li.selectable", function(event) {

		$(this).appendTo("#current_roles");
		$(this).removeClass('ui-selected');
		
		cur_options = [];

		$('.current li').each(function() {
				cur_options.push($(this).text());
		});
		
		var selected_user = mydropdownuser.settings.get("value");
		objIndex = lk_users_dict.findIndex((obj => obj.idrh == selected_user));
		lk_users_dict[objIndex].roles = cur_options.join(":");

	});


	$( "#save_role" ).on("click", function( event ) {

        event.preventDefault();
		$("#save_role").text("Saving....");

		// Back to csv
		var fields = Object.keys(lk_users_dict[0]);
		var array = Object.values(lk_users_dict);
		var csv = [];
		csv.push(fields);
		for (var line of array) {
			csv.push(fields.map(key => line[key]));
		}

		var json = JSON.stringify(csv);

		data = {"lookup_file":"user.csv",
                "namespace"  :"spl_role_mngt",
			    "contents"   : json};

		url = Splunk.util.make_full_url("/splunkd/__raw/services/data/lookup_edit/lookup_contents");

		$.ajax({
				url: url,
				type: 'POST',
				data: data,

							success: function () {
									$("#save_role").text("Sauvegarder");
									console.log("user.csv saved");
									}
		});

    });


});




