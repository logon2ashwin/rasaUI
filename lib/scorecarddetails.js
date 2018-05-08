module.exports = {
	sendscorecard:function(req,res,data,type){
		var matchID = "none";
		if(type == 'http'){
			matchID = req.params.id;
		}
		else{
			matchID = data.matchID;
		}


		console.log("MATCH ID",matchID);
		console.log("TYPE",type);

		if(matchID!='none'){
			data.match.findOne({'_id':matchID})
            .populate('team_1.teamid')
            .populate('team_2.teamid')
            .populate('tournament')
            .exec(function(err,match){
                if (err) {
                    if(type == 'http'){
                        res.send({"status":"error"});
                    }
                    else{
                      if(typeof req.app!="undefined"){
                    	   var io = req.app.get('socketio');
                         io.sockets.emit({"status":"error"});
                      }
                      else{
                        var io = data.socketio;
                        io.sockets.emit({"status":"error"});
                      }
                        
                    }
                }else{

                    //console.log(req.params.id);
                    console.log(new Date());
                    
                    var response = {};
                    response.match = {};
                    if(match){
                        response.match = match;

                        var scoreoptions = {};
                        scoreoptions.match_id = matchID;

                        if(match.team_1.status == true){
                            scoreoptions.team = match.team_1.teamid._id;
                            scoreoptions.balls = match.team_1.balls;
                            scoreoptions.overs = match.team_1.overs;
                        }
                        else{
                            scoreoptions.team = match.team_2.teamid._id;
                            scoreoptions.balls = match.team_2.balls;
                            scoreoptions.overs = match.team_2.overs;   
                        }
                        response.reqrunrate = 0;
                        if(match.team_1.battingcompleted){
                          var targetscore = match.team_2.targetscore;
                          var currentscore = match.team_2.scores;
                          var currentover = match.team_2.overs;
              
                          if (match.team_2.balls == 0) {
                            //response.reqrunrate = ((targetscore - currentscore) / (match.team_2.totalovers - currentover));
                            response.reqrunrate = ((currentscore) / (currentover));
                          } else {
                            //response.reqrunrate = (currentscore) / (((match.team_2.totalovers * 6) - ((currentover * 6) + match.team_2.balls)) / 6);
                            response.reqrunrate = (currentscore) / ((((currentover * 6) + match.team_2.balls)) / 6);
                          }


                          if(match.scoreupdate=='auto'){
                            response.reqrunrate = parseFloat(match.team_2.runrate);
                          }


                        }else if(match.team_2.battingcompleted){
                          var targetscore = match.team_1.targetscore;
                          var currentscore = match.team_1.scores;
                          var currentover = match.team_1.overs;
              
                          if (match.team_1.balls == 0) {
                            //response.reqrunrate = (targetscore - currentscore) / (match.team_1.totalovers - currentover);
                            response.reqrunrate = ((currentscore) / (currentover));
                          } else {
                            //response.reqrunrate = (targetscore - currentscore) / (((match.team_1.totalovers * 6) - ((currentover * 6) + match.team_1.balls)) / 6);
                            response.reqrunrate = (currentscore) / ((((currentover * 6) + match.team_1.balls)) / 6);
                          }

                          if(match.scoreupdate=='auto'){
                            response.reqrunrate = parseFloat(match.team_1.runrate);
                          }

                        }

                        response.innings = {};

                        if(typeof match.team_1.toss !='undefined' || typeof match.team_1.toss!='undefined'){
                          if(match.team_1.toss || match.team_2.toss){
                            if(!match.team_1.battingcompleted && !match.team_2.battingcompleted){
                              if(match.team_1.status){
                                response.innings.current = "1";
                                response.innings.first = "team1";
                                response.innings.second = "team2";
                              }
                              else{
                                response.innings.current = "1";
                                response.innings.first = "team2";
                                response.innings.second = "team1";
                              }
                            }
                            else{
                              if(match.team_1.battingcompleted){
                                response.innings.current = "2";
                                response.innings.first = "team1";
                                response.innings.second = "team2";
                              }
                              else{
                                response.innings.current = "2";
                                response.innings.first = "team2";
                                response.innings.second = "team1"; 
                              }

                              if(match.team_1.battingcompleted && match.team_2.battingcompleted){
                                response.innings.current = "completed"
                              }
                              
                            }

                            if(match.scoreupdate=='auto'){
                              response.innings.first = match.innings.first;
                              response.innings.second = match.innings.second;
                              response.innings.third = match.innings.third;
                              response.innings.fourth = match.innings.fourth;
                            }
                          }
                          else{
                            response.innings.current = "0";
                            response.innings.first = "none";
                            response.innings.second = "none";
                          }
                        }
                        else{
                          response.innings.current = "0";
                          response.innings.first = "none";
                          response.innings.second = "none";
                        }

                        if(response.match.scoreupdate == 'auto'){
                          
                          response.match.team_1.scorecard = response.match.team_1.scorecard_auto;
                          response.match.team_2.scorecard = response.match.team_2.scorecard_auto;

                          response.match.team_1.bowler_scorecard = response.match.team_1.bowler_scorecard_auto;
                          response.match.team_2.bowler_scorecard = response.match.team_2.bowler_scorecard_auto;

                        }


                        response.reqrunrate = response.reqrunrate.toFixed(2);

                        console.log("score options");
                        console.log(scoreoptions);

                        getscores(req,res,response.match,data,scoreoptions,function(req,res,err,scores){
                            if (err) {
                                if(type == 'http'){
                                    res.send({"status":"error"});
                                }
                                else{

                                  if(typeof req.app!="undefined"){
                                     var io = req.app.get('socketio');
                                     io.sockets.emit({"status":"error"});
                                  }
                                  else{
                                    var io = data.socketio;
                                    io.sockets.emit({"status":"error"});
                                  }

                                  
                                }
                            }
                            else {
                               var results = {
                                "event":{},
                                "_id":0
                               };


                               if(scores.length>0){
                                   results = scores[scores.length - 1]; 
                               }
                              
                               if(typeof results.event.dot=='undefined'){
                                  results.event.dot = 0;
                               }

                               if(typeof results.event.six=='undefined'){
                                  results.event.six = 0;
                               }

                               if(typeof results.event.four=='undefined'){
                                  results.event.four = 0;
                               }

                               if(typeof results.event.three=='undefined'){
                                  results.event.three = 0;
                               }

                               if(typeof results.event.two=='undefined'){
                                  results.event.two = 0;
                               }

                               if(typeof results.event.one=='undefined'){
                                  results.event.one = 0;
                               }

                               if(typeof results.event.dot=='undefined'){
                                  results.event.dot = 0;
                               }

                               if(typeof results.event.noball=='undefined'){
                                  results.event.noball = 0;
                               }


                               if(typeof results.event.freehit=='undefined'){
                                  results.event.freehit = 0;
                               }

                               if(typeof results.event.wide=='undefined'){
                                  results.event.wide = 0;
                               }

                               if(typeof results.event.leg_bye=='undefined'){
                                  results.event.leg_bye = 0;
                               }


                               if(typeof results.event.bye=='undefined'){
                                  results.event.bye = 0;
                               }

                               if(typeof results.event.wicket=='undefined'){
                                  results.event.wicket = 0;
                               }


                               if(typeof results.event.wicket_type=='undefined'){
                                  results.event.wicket_type = "";
                               }


                               if(typeof results.event.wicket_notes=='undefined'){
                                  results.event.wicket_notes = "";
                               }

                               response.scores = results;

                               var commentaryoptions = {
                                  match_id:matchID
                                }

                                if(response.innings.current == "1"){
                                  if(response.innings.first == "team1"){
                                    commentaryoptions.over = response.match.team_1.overs;
                                  }
                                  if(response.innings.first == "team2"){
                                    commentaryoptions.over = response.match.team_2.overs; 
                                  }  
                                }

                                if(response.innings.current == "2"){
                                  if(response.innings.second == "team1"){
                                    commentaryoptions.over = response.match.team_1.overs;
                                  }
                                  if(response.innings.second == "team2"){
                                    commentaryoptions.over = response.match.team_2.overs; 
                                  }  
                                }

                               data.Commentaries.find(commentaryoptions)
                               .sort({balls: -1})
                                .exec(function (err, commentaryresults) {
                                  if (!err) {
                                    response.commentary = commentaryresults;
                                    if(type == 'http'){
                                      res.send({"status":"success","results":response})
                                    }
                                    else{
                                      if(typeof req.app!="undefined"){
                                          var io = req.app.get('socketio');
                                          console.log("Emit socket io");
                                          io.emit("scorecard",{
                                              "status":"success",
                                              "results":response
                                          });
                                        }
                                        else{
                                          var io = data.socketio;
                                          console.log("Emit socket io");
                                          io.emit("scorecard",{
                                              "status":"success",
                                              "results":response
                                          });
                                        }
                                    }
                                    
                                  } else {
                                    if(type == 'http'){
                                      res.send({"status":"error"});
                                    }
                                    else{
                                      if(typeof req.app!="undefined"){
                                          var io = req.app.get('socketio');
                                          console.log("Emit socket io");
                                          io.sockets.emit({"status":"error"});
                                        }
                                        else{
                                          var io = data.socketio;
                                          console.log("Emit socket io");
                                          io.sockets.emit({"status":"error"});
                                        }
                                    }
                                  }
                                })                               
                            }
                        })

                        /*data.scores.find(scoreoptions)
                        .populate('batsman_id')
                        .populate('bowler_id')
                        .populate('active_batsman')
                        .populate('active_bowler')
                        .populate('team')
                        .exec(function (err, scores) {
                            
                        })*/
                    }
                    else{
                        res.send({"status":"no_results","results":response});
                    }
                }
            })		
		}
		else{

		}

    function getscores(req,res,match,data,scoreoptions,callback){
    if(match.scoreupdate == 'auto'){
      data.scoresauto.find(scoreoptions)
      .populate('team')
      .exec(function (err, scores) {
        callback(req,res,err,scores);
      })
    }
    else{
      data.scores.find(scoreoptions)
      .populate('batsman_id')
      .populate('bowler_id')
      .populate('active_batsman')
      .populate('active_bowler')
      .populate('team')
      .exec(function (err, scores) {
        callback(req,res,err,scores);
      })  
    }
  }
		
	}  
}