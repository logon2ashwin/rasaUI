module.exports ={
	newtask:function(data){
		console.log("task sync");
		var Projecttask = require("../models/projecttasks").getModel();
		Projecttask.find({projectid:data.project})
	    .exec(function (err, projecttask) {
	    	console.log(data._id);
	    	if(projecttask.length > 0){
	    		var existsprojecttask = projecttask[0];
	    		var newid = projecttask[0].created.length + projecttask[0].inprogress.length + projecttask[0].completed.length;
	    		existsprojecttask.created.push({
	    				id:newid,
	    				name:"New Task",
						desc:data.title,
						event_id:data._id,
						created_at:new Date()
	    			});
	    		Projecttask.findOneAndUpdate({projectid: data.project},existsprojecttask,{}, function(err, content){});
	    	}
	    	else{
	    		var newprojecttask = new Projecttask({
	    			created:[{
	    				id:1,
	    				name:"New Task",
						desc:data.title,
						event_id:data._id,
						created_at:new Date()
	    			}],
	    			inprogress:[{}],
	    			completed:[{}],
	    			projectid:data.project
	    		});
	    		console.log(newprojecttask);
	    		newprojecttask.save(function (err,data) {
	    			console.log(err);
	    			console.log(data);
	    		});
	    	}
	    })
	},
	updatetask:function(data){
		
		console.log("update task details");

		var Projecttask = require("../models/projecttasks").getModel();
		Projecttask.find({projectid:data.project})
	    .exec(function (err, projecttask) {
	    	if(projecttask.length > 0){
	    		var existsprojecttask = projecttask[0];
	    		var isfound = false;

	    		function searchinarray(tasks,status,inputlength,data){
	    			var currenttask = tasks[inputlength];
	    			if(inputlength>=0){
	    				if(currenttask.event_id){
	    					if(currenttask.event_id.equals(data._id)){
	    						currenttask.desc = data.title;
	    						isfound = true;
	    						Projecttask.findOneAndUpdate({projectid: data.project},existsprojecttask,{}, function(err, content){});
	    					}
	    					else{
	    						inputlength = inputlength - 1;
		    					console.log("called else block");
		    					searchinarray(tasks,status,inputlength,data);
	    					}
	    				}
	    				else{
	    					inputlength = inputlength - 1;
	    					console.log("called else block");
	    					searchinarray(tasks,status,inputlength,data);
	    				}
	    			}
	    			else{
	    				if(status=='created'){
	    					console.log(isfound);
	    					if(!isfound){
	    						searchinarray(existsprojecttask.inprogress,"inprogress",existsprojecttask.inprogress.length - 1,data);
	    					}
	    				}
	    				else if(status=='inprogress'){
	    					if(!isfound){
	    						searchinarray(existsprojecttask.completed,"completed",existsprojecttask.completed.length - 1,data);
	    					}
	    				}
	    				else if(status=='completed'){}
	    			}
	    		}

	    		searchinarray(existsprojecttask.created,"created",existsprojecttask.created.length - 1,data);
	    	}
	    	else{
				var newprojecttask = new Projecttask({
	    			created:[{
	    				id:1,
	    				name:"New Task",
						desc:data.title,
						event_id:String(data._id),
						created_at:new Date()
	    			}],
	    			inprogress:[{}],
	    			completed:[{}],
	    			projectid:data.project
	    		});
	    		console.log(newprojecttask);
	    		newprojecttask.save(function (err,data) {});
	    	}
	    })
	},
	removetask:function(data){
		var Projecttask = require("../models/projecttasks").getModel();
		Projecttask.find({projectid:data.project})
	    .exec(function (err, projecttask) {
	    	if(projecttask.length > 0){
	    		var existsprojecttask = projecttask[0];
	    		var isfound = false;

	    		function searchinarray(tasks,status,inputlength,data){
	    			var currenttask = tasks[inputlength];
	    			if(inputlength>=0){
	    				if(currenttask.event_id){
	    					if(currenttask.event_id.equals(data._id)){
	    						tasks.splice(inputlength,1);
	    						Projecttask.findOneAndUpdate({projectid: data.project},existsprojecttask,{}, function(err, content){});
	    					}
	    					else{
	    						inputlength = inputlength - 1;
		    					console.log("called else block");
		    					searchinarray(tasks,status,inputlength,data);
	    					}
	    				}
	    				else{
	    					inputlength = inputlength - 1;
	    					console.log("called else block");
	    					searchinarray(tasks,status,inputlength,data);
	    				}
	    			}
	    			else{
	    				if(status=='created'){
	    					console.log(isfound);
	    					if(!isfound){
	    						searchinarray(existsprojecttask.inprogress,"inprogress",existsprojecttask.inprogress.length - 1,data);
	    					}
	    				}
	    				else if(status=='inprogress'){
	    					if(!isfound){
	    						searchinarray(existsprojecttask.completed,"completed",existsprojecttask.completed.length - 1,data);
	    					}
	    				}
	    				else if(status=='completed'){}
	    			}
	    		}

	    		searchinarray(existsprojecttask.created,"created",existsprojecttask.created.length - 1,data);
	    	}
	    })
	}
}