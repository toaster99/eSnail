module.exports = function(app,express,db)
{
	//Main routes
	app.get('/', function(req,res)
	{
		res.render('index');
	});



}