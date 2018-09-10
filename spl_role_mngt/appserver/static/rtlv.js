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
	console.log("start");
	
	
}