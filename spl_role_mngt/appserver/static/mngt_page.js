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
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/dropdownview",
    "splunkjs/mvc/simplexml/ready!"
],
function
(
	_,
	_,
        mvc, 
        SearchManager, 
        DropdownView, 
)
{

	// Instantiate components

	var list_role = [];
        var auth = false;

        var deleg_search = new SearchManager(
        {
                id: "search_deleg",
                search: "| inputlookup delegation.csv | table *",
                preview: false,
                cache: true,
                timeout: "60"
        }
        );

        var results_deleg = deleg_search.data("results");

        results_deleg.on("data", function() {

                var rows = results_deleg.data().rows;
                for(var i = 0; i < rows.length; i++) {
                        var values = rows[i];
                        var value = values[1];
                        if (value == $C.USERNAME ) {
                          auth = true;
                          var res = values[0].split(":");
                          for(var j = 0; j < res.length; j++) {
                                list_role.push(res[j]);
                          }
                        }
                }
	

	if ( auth !== false ) {


   	var user_search = new SearchManager(
	{
        	id: "search_users",
        	search: "| inputlookup user.csv | table *",
        	preview: false,
        	cache: true,
		timeout: "60"
    	}
	);


	var mydropdownuser = new DropdownView(
	{
    		id: "users_list",
        	managerid: "search_users",
		labelField: "idrh",
		valueField: "idrh",
		showClearButton: false,
        	el: $("#users_list")
        }
	).render();


	mydropdownuser.on("change", function() 
	{
		var cur_list = JSON.parse(JSON.stringify( list_role )); // Javascript is shit to clone object
		$("#current_roles").empty();
		$("#dispo_roles").empty();
		var selected_user = mydropdownuser.settings.get("value");
		
		var results = user_search.data("results");

		results.on("data", function() {
			
			var rows = results.data().rows;
			for(var i = 0; i < rows.length; i++) {
				var values = rows[i];
	                	var value = values[1];
        	        	if (value == selected_user) {
					var res = values[4].split(":");
                        			for(var j = 0; j < res.length; j++) {
						var pos = cur_list.indexOf(res[j])
						if (pos >= 0) {    
						$("#current_roles").append($("<li class='ui-widget-content selectable'>").text(res[j]));
						var delete_item = cur_list.splice(pos,1);
						}
						else {
						$("#current_roles").append($("<li class='ui-widget-content  >").text(res[j]));
						}
					
                        		}
				}
			}
			
			for (var j = 0; j < cur_list.length; j++) {
	        	        $("#dispo_roles").append($("<li class='ui-widget-content selectable'>").text(cur_list[j]));
        	        }

		});



	
    	});
	$(function() {
    	$( ".paramsnav" ).selectable();
	  });

	$( "#current_roles" ).on("click","li.selectable", function(event) {    

		$(this).appendTo("#dispo_roles");
		$(this).removeClass('ui-selected');

    	});
	
	$( "#dispo_roles" ).on("click","li.selectable", function(event) {

                $(this).appendTo("#current_roles");
		$(this).removeClass('ui-selected');

        });

	}
     else {
	
	$("#select").remove();
	$("#users_list").remove();
	$("#current_roles").remove();
	$("#dispo_roles").remove();	
     }
     
   });

});
