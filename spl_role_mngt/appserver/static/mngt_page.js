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
	
	function rest_save_csv(user_dict,lk_name) {
		
		
		// Back to csv
		var fields = Object.keys(user_dict[0]);
		var array = Object.values(user_dict);
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
			var key4 = "service";
			
			var obj = {};
			obj[key1] = id;
			obj[key2] = key.idrh;
		    obj[key3] = key.prenom+" "+key.nom+" ("+key.idrh+")";
			obj[key4] = key.service;
			
			list.push(obj);
			id = id + 1;
		
		});
			
		return list;
		
	}
	
	function fill_add_user_role() {	
		
		var tmp_array = get_available_roles();
	
		
		tmp_array.forEach(function(element) {
				
				$("#add_user_dispo_roles").append($("<li class='ui-widget-content selectable'>").text(element));
			
		});
		
	}
	
	function get_available_roles() {
		
		var rt_list_roles = [];
		
		c_list_roles = lk_delegation_dict[lk_delegation_dict.findIndex((obj => obj.idrh == $C.USERNAME))].roles.split(":");
		
		c_list_roles.forEach(function(element) {
		
								
								if (all_roles.indexOf(element) != -1) {
									
									if (element !== "__ALL__") {
									rt_list_roles.push(element);
									}
								}
								else if (element !== "__ALL__") {
									cl("Role:"+element+" présent dans delegation.csv mais non définit dans authorize.conf");
									}
								
								
		
							});
		
		// admin & admin_limited
		if (c_list_roles.includes("__ALL__")){
			rt_list_roles = [];
			rt_list_roles = JSON.parse(JSON.stringify(all_roles));
		}
		
		return rt_list_roles;
		
	}
	
	function get_all_roles(){
		
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
									fill_add_user_role();
								});
								
							});
						});
				
	}
	
	function fill_mail(){
		
		if($("#idrh").val().startsWith('x')){
			$("#email").val("");
			poste="-prestataire@labanquepostale.fr";
			$("#email").val($("#prenom").val()+'.'+$("#nom").val()+poste);
			$("#email").trigger('input');
		}
		else if($("#idrh").val().startsWith('p')){
			$("#email").val("");
			poste="@labanquepostale.fr";
			$("#email").val($("#prenom").val()+'.'+$("#nom").val()+poste);
			$("#email").trigger('input');
		}
		else {
			$("#email").val("");
		}
	}
	
	$(function() {

				$( ".paramsnav" ).selectable();
		});
		
	// initial load:
	get_all_roles();
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
			
			var cur_list_role = lk_users_dict[lk_users_dict.findIndex((obj => obj.idrh == selected_user))].roles.split(":");
			var available_role = get_available_roles();  
			
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

	$( "#current_roles" ).on("click","li.selectable", function(event) {

		$(this).appendTo("#dispo_roles");
		$(this).removeClass('ui-selected');
		

		cur_options = [];

		$('.current li').each(function() {
				cur_options.push($(this).text());
		});
		
		var selected_user = drop_user.select2('data').idrh;
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
		
		var selected_user = drop_user.select2('data').idrh;
		objIndex = lk_users_dict.findIndex((obj => obj.idrh == selected_user));
		lk_users_dict[objIndex].roles = cur_options.join(":");

	});
	
	$( "#add_user_dispo_roles" ).on("click","li.selectable", function(event) {

		$(this).appendTo("#add_user_current_roles");
		$(this).removeClass('ui-selected');

	});
	
	$( "#add_user_current_roles" ).on("click","li.selectable", function(event) {

		$(this).appendTo("#add_user_dispo_roles");
		$(this).removeClass('ui-selected');

	});

	$( "#save_role" ).on("click", function( event ) {

		event.preventDefault();
		rest_save_csv(lk_users_dict,"user.csv");
		
	});
	
	$( "#add_user" ).on("click", function( event ) {
			
			event.preventDefault();
	
			var re_mail = RegExp('^[\\w-]+\\.[\\w-]+@labanquepostale\\.fr$');
			var re_nom = RegExp('[^\\w-]','g');
			var re_service = RegExp('[^\\w\\d/]','g');
			var re_idrh = RegExp('[^\\w\\d]','g');
			//get form data dict format
			var all_forms_data = $("#add_user_form").serializeArray();
			var new_user = {};
			for (var i = 0; i < all_forms_data.length; i++){
				new_user[all_forms_data[i]['name']] = all_forms_data[i]['value'];
				
				// Check empty 
				if(all_forms_data[i]['value'] == ""){
					alert(all_forms_data[i]['name']+" ne peut pas ête vide !!");
					return;
				}
				
				//Bad input
				switch (all_forms_data[i]['name']) {
					
					case 'idrh':
								if(re_idrh.test(all_forms_data[i]['value'])){alert(all_forms_data[i]['name']+": Liste des caractères autorisés:\n [a-z] [A-Z] [0-9]");return;}
								break;
					case 'nom':
					case 'prenom':
							if(re_nom.test(all_forms_data[i]['value'])){alert(all_forms_data[i]['name']+": Liste des caractères autorisés:\n [a-z] [A-Z] -");return;}
							break;
					case 'email':
							if(re_mail.test(all_forms_data[i]['value']) == false){alert(all_forms_data[i]['name']+": Format de l'email non valide \n prenom.nom@labanquepostale.fr ou prenom.nom-prestataire@labanquepostale.fr");return;}
							break;	
					case 'service':
							if(re_service.test(all_forms_data[i]['value'])){alert(all_forms_data[i]['name']+": Liste des caractères autorisés:\n [a-z] [A-Z] [0-9] /");return;}
							break;
				}
				
				
			}
			
			
			//Check: user exists
			if (lk_users_dict.findIndex((obj => obj.idrh == new_user["idrh"])) != -1) {
				alert("L'utilisateur "+new_user["idrh"]+" existe déjà !!");
				$("#idrh").val("");
				return;
			}
		
			
			//Get roles
			cur_options = [];
			
			$('#add_user_current_roles li').each(function() {
				cur_options.push($(this).text());
			});
			
			
			
			if(cur_options.length == 0){
				alert("L'utilisateur n'a aucun rôle attribué");
				return;
			}
				
			
			
			new_user["roles"] = cur_options.join(":");
			
			// Push dans lk 
			lk_users_dict.push(new_user);
			
			// Reload user list
			drop_user.select2({
				data: s2_fill_user_list()
			});
			
			// Clear
			$("#add_user_form").trigger("reset");
			$("#add_user_current_roles").empty();
			$("#add_user_dispo_roles").empty();
			
			fill_add_user_role();
			
			
		
	});
	
	$( "#cancel" ).on("click", function( event ) {
		
		csv = rest_load_csv("user.csv");
		lk_users_dict  =  csv_2_dict(csv);
		drop_user.select2({
				data: s2_fill_user_list()
			});
		$('#top_user_list').val(null);
		// Clear add form
		$("#add_user_form").trigger("reset");
		$("#add_user_current_roles").empty();
		$("#add_user_dispo_roles").empty();
		// Clear roles
		$("#current_roles").empty();
		$("#dispo_roles").empty();
		
	});
	
	$( "#copy_user" ).on("click", function( event ) {
		
		// Clear
		$("#add_user_form").trigger("reset");
		$("#add_user_current_roles").empty();
		$("#add_user_dispo_roles").empty();
		
		// Get values:
		var objIndex = lk_users_dict.findIndex((obj => obj.idrh == drop_user.select2('data').idrh));
		var available_role = get_available_roles();  
		var cur_list_role = lk_users_dict[objIndex].roles.split(":");
				
		
		// Fill service
		$("#service").val(lk_users_dict[objIndex].service);
		// Fill roles
		cur_list_role.forEach(function(element) {
				
			var pos = available_role.indexOf(element); // >0 si dans liste auth
			
			if (pos != -1 ) {
				$("#add_user_current_roles").append($("<li class='ui-widget-content selectable'>").text(element));
				var delete_item = available_role.splice(pos,1);
				}
			

		});
			
		available_role.forEach(function(element) {
			$("#add_user_dispo_roles").append($("<li class='ui-widget-content selectable '>").text(element));
		});	
		
	});
	
	$('#nom').on('input', function() { 
	
		
		var int = 7;
		var el = document.getElementById('nom');
		el.style.width = ((el.value.length+2) * int) + 'px'
		fill_mail();
		
	});
	
	$('#prenom').on('input', function() { 
	
		var int = 7;
		var el = document.getElementById('prenom');
		el.style.width = ((el.value.length+2) * int) + 'px'
		fill_mail();
		
	});
	
	$('#idrh').on('input', function() { 
	
		var int = 7;
		var el = document.getElementById('idrh');
		el.style.width = ((el.value.length+2) * int) + 'px'
		fill_mail();
		
	});
	
	$('#service').on('input', function() { 
	
		var int = 7;
		var el = document.getElementById('service');
		el.style.width = ((el.value.length+2) * int) + 'px'
		
		
	});

	$("#email").on('input', function() {
		
		var int = 7;
		var el = document.getElementById('email');
		el.style.width = ((el.value.length+2) * int) + 'px'
		
		
	}).trigger('input');

});




