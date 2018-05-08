module.exports = {
	init:function(socket){
		
		var cron = require('node-cron');
		var autogenerateservice = require('../services/autogenerate.js');

		cron.schedule('* */1 * * *', function(){
		  console.log("autogenerate match cron job");
		  autogenerateservice.matches(socket,function(data){});
		});

		cron.schedule('*/10 * * * * *', function(){
		  console.log("autogenerate scores cron job");
		  autogenerateservice.scores(socket,function(data){});
		});
	}
}

