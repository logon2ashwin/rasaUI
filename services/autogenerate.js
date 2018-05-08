module.exports = {
	matches:function(socket,callback){
	
	var request = require('request');
    var utils = require("../services/utils");

    var teams = require("../models/activeteams").getModel();
    var tour = require("../models/tournaments").getModel();
    var match = require("../models/matchlists").getModel();
    var scoresauto = require("../models/scoresauto").getModel();
    var scores = require("../models/scores").getModel();
    var Commentaries = require("../models/commentary").getModel();
    var Scorecarddetails = require('../lib/scorecarddetails');

    var HOMEDOMAIN = "http://www.espncricinfo.com";

		var FEEDS_URL = "http://static.cricinfo.com/rss/livescores.xml";
    		var parseString = require('xml2js').parseString;
    		const cheerio = require('cheerio');
    		var livescores  = [];

    		request({
                        "url":FEEDS_URL,
                        "jar":true
                    }, function (error, response, body) {
    			if(!error){
					parseString(body, function (err, result) {
						//console.log(result.rss);
						if(result.rss.channel.length>0){
							var livescores = result.rss.channel[0].item;
							getscorecarddetails(livescores);	
							callback({"status":"success","results":result});
						}
						else{
							callback({"status":"no livescore found"})		
						}
    					
					});
    			}
    			else{
    				callback({"status":"error in fetch"})
    			}
    		})

    		//Get Scorecard Details
    		function getscorecarddetails(scores){
    			if(scores.length>0){
    				var currentscore = scores.pop();

    				//Score Card Details
    				request(currentscore.link[0], function (scoreerror, scoreresponse, scorebody) {
    					if(!scoreerror){
    						const $ = cheerio.load(scorebody);
    						//console.log($('.game-details.header').text());

    						var fullheaderdetails = $('.game-details.header').text().split(' at ');
    						
    						var tournamentdetails = {};
    						var matchdetails = {};
                            matchdetails.current_match_status = $('.game-time').text().toLowerCase();

    						if(fullheaderdetails[0].split(',').length>1){
    							tournamentdetails.name = fullheaderdetails[0].split(',')[1];
    						}
    						else{
    							tournamentdetails.name = fullheaderdetails[0]
    						}
    					

    						// Get team1 details 
    						var team1details = {
                                team_name:$('.team-name.app_partial >.long-name').eq(0).text(),
    							short_name:$('.team-name.app_partial >.short-name').eq(0).text(),
    							alias:$('.team-name.app_partial >.abbrev').eq(0).text(),
    							country:""
    						};

    						// Get team2 details 
    						var team2details = {
    							team_name:$('.team-name.app_partial >.long-name').eq(1).text(),
                                short_name:$('.team-name.app_partial >.short-name').eq(1).text(),
    							alias:$('.team-name.app_partial >.abbrev').eq(1).text(),
    							country:""
    						};


                            try{
                                if(($('.game-details.header').text().split(' at ')[1]).split(",")[1].indexOf('-')>-1){
                                    matchdetails.match_type = "test";
                                }
                                else{
                                    matchdetails.match_type = "limited_over";
                                }
                            }
                            catch(e){

                            }
                            
                            //console.log("match_type");
    						//console.log(matchdetails.match_type);

                           try{



    						
    						//console.log($('.team-logo').eq(0).attr('data-src'));

    						var team1flagurl = $('.team-logo').eq(0).attr('data-src').split('&');

    						


    						if(team1flagurl.length>0){
    							team1details.flag = team1flagurl[0]+"?&w=200&h=200";
    						}
    						else{
    							team1details.flag = team1flagurl+"?&w=200&h=200";
    						}

    						

    						var team2flagurl = $('.team-logo').eq(3).attr('data-src').split('&');

    						if(team2flagurl.length>0){
    							team2details.flag = team2flagurl[0]+"?&w=200&h=200";
    						}
    						else{
    							team2details.flag = team2flagurl+"?&w=200&h=200";
    						}

                        }
                        catch(e){
                            
                        }


    						// Get Match data like match details and venue	 
    						matchdetails.match_venue = $('.stadium-details>h4>a').attr('name');	
    						matchdetails.match_details = fullheaderdetails[0].split(',')[0];
    						matchdetails.auto_match_link = currentscore.link[0];
    						matchdetails.auto_match_guid = currentscore.guid[0];
                            matchdetails.scoreupdate = "auto";

    						//Get cricinfo unique match ID
    						var spliturl = matchdetails.auto_match_guid.split('/');
    						if(spliturl.length>0){
    							matchdetails.auto_match_id = spliturl[spliturl.length - 1].split('.')[0]
    						}
         


                            //console.log(matchdetails.auto_match_id);
                            //console.log(matchdetails.auto_match_guid);

                            if(utils.isvalidData(tournamentdetails.name) && utils.isvalidData(team1details.team_name) 
                                && utils.isvalidData(team2details.team_name) && utils.isvalidData(team1details.alias) 
                                && utils.isvalidData(team2details.alias) && utils.isvalidData(matchdetails.match_type)){

                                tour.findOneAndUpdate({ tournament_name: tournamentdetails.name},{
                                    tournament_name:tournamentdetails.name,
                                    overs:0
                                },{ upsert: true, new: true }, function (err, updatetour) {
                                    if(!err){
                                        matchdetails.tournament = updatetour._id;
                                        teams.findOneAndUpdate({ team_name: team1details.team_name}, team1details, { upsert: true, new: true }, function (err, team1res) {
                                            
                                            matchdetails.team_1 = {};   
                                            matchdetails.team_1.teamid =  team1res._id;
                                            matchdetails.team_1.status =  false;

                                            if(!err){
                                                teams.findOneAndUpdate({ team_name: team2details.team_name}, team2details, { upsert: true, new: true }, function (err, team2res) {
                                                    if(!err){

                                                        matchdetails.team_2 = {};
                                                        matchdetails.team_2.teamid =  team2res._id;
                                                        matchdetails.team_2.status =  false;

                                                        //console.log(matchdetails);

                                                        match.findOneAndUpdate({
                                                            "auto_match_id": matchdetails.auto_match_id
                                                        }, matchdetails, { upsert: true, new: true }, function (err, outmatch) {
                                                            if(!err){
                                                                //console.log("Tournament Details added");
                                                                getscorecarddetails(scores);
                                                            }                                                                   
                                                        });
                                                    }       
                                                })
                                            }

                                        })

                                        //getscorecarddetails(scores);      
                                    }else{
                                        console.log("error in create tournament");
                                    }
                                });
                            }
                            else{
                                console.log("tournament data not available");
                                getscorecarddetails(scores);
                            }

    						//console.log(tournamentdetails);

    					}
    					else{

    					}
    				})
    			}
    			else{

                    //After recursive end 
    				console.log("match update processed");
    			}
			}
	},
	scores:function(socket,callback){
		var request = require('request');
    	var utils = require("../services/utils");

	    var teams = require("../models/activeteams").getModel();
	    var tour = require("../models/tournaments").getModel();
	    var match = require("../models/matchlists").getModel();
	    var scoresauto = require("../models/scoresauto").getModel();
	    var scores = require("../models/scoresauto").getModel();
	    var Commentaries = require("../models/commentary").getModel();
	    var Scorecarddetails = require('../lib/scorecarddetails');

	    var HOMEDOMAIN = "http://www.espncricinfo.com";

		const cheerio = require('cheerio');

            match.find({
                "scoreupdate":"auto"
                //"auto_match_id":"1118576"
            })
            .populate('team_1.teamid')
            .populate('team_2.teamid')
            .populate('tournament')
            .exec(function(err,autogeneratedmatches){
                if(!err){
                    var updatescoresdata = JSON.parse(JSON.stringify(autogeneratedmatches));

                    updatescores(updatescoresdata);

                    callback({"status":"success","data":autogeneratedmatches});
                }
                else{
                    callback({"status":"error"});
                }
            })

            function updatescores(autogeneratedmatches){
                
               console.log("match score - ",autogeneratedmatches.length);

                if(autogeneratedmatches.length>0){

                    var currentgeneratedmatches = autogeneratedmatches.pop();
                    
                   console.log(currentgeneratedmatches.auto_match_id);

                    request({
                        "url":currentgeneratedmatches.auto_match_link,
                        "jar":true
                    }, function (scoreerror, scoreresponse, scorebody) {
                        if(!scoreerror){
                        var $ = cheerio.load(scorebody);

                        var toss_statement = $('.match-detail-container >.match-detail--item>.match-detail--right').eq(1).text();
                        var team1details = currentgeneratedmatches.team_1.teamid;
                        var team2details = currentgeneratedmatches.team_2.teamid;
                        var currentinnings = $('.sub-module.current-inning').find('header > h1').text().toLowerCase();
                        var matchdetails = {};

                        var scoredetails  = {};
                        scoredetails.match_id = currentgeneratedmatches._id;

                        currentgeneratedmatches.current_match_status = $('.game-time').text().toLowerCase();

                       console.log(toss_statement);

                        //update toss for match
                        if(toss_statement.indexOf("elected")>-1){
                            var updateteamtoss = {};

                            if(toss_statement.indexOf(team1details.team_name)>-1 || toss_statement.indexOf(team1details.short_name)>-1 || toss_statement.indexOf(team1details.alias)>-1){
                                currentgeneratedmatches.team_1.toss = true;
                                currentgeneratedmatches.team_2.toss = false;
                            }
                            else if(toss_statement.indexOf(team2details.team_name)>-1 || toss_statement.indexOf(team2details.short_name)>-1 || toss_statement.indexOf(team2details.alias)>-1){
                                currentgeneratedmatches.team_1.toss = false;
                                currentgeneratedmatches.team_2.toss = true;
                            }
                        }

                        if(currentgeneratedmatches.current_match_status == 'live'){
                            if(currentinnings.indexOf(team1details.team_name)>-1){
                                currentgeneratedmatches.team_1.teamid.status = true;
                                currentgeneratedmatches.team_2.teamid.status = false;
                            }

                            if(currentinnings.indexOf(team2details.team_name)>-1){
                                currentgeneratedmatches.team_1.teamid.status = false;
                                currentgeneratedmatches.team_2.teamid.status = true;
                            }

                            currentgeneratedmatches.innings = {};                            

                        }

                        function setinnings(innings,team,currentgeneratedmatches){
                                if(innings == 0){
                                    currentgeneratedmatches.innings.first = team;    
                                }
                                else if(innings == 1){
                                   // console.log("first",innings);
                                    if(currentgeneratedmatches.match_type=='limited_over'){
                                        if(currentgeneratedmatches.innings.first == 'team1'){
                                            currentgeneratedmatches.team_2.targetscore = currentgeneratedmatches.team_1.scores;
                                            currentgeneratedmatches.team_2.totalovers = currentgeneratedmatches.team_1.overs;
                                            currentgeneratedmatches.team_1.battingcompleted = true;

                                        }
                                        else{
                                            currentgeneratedmatches.team_1.targetscore = currentgeneratedmatches.team_2.scores;
                                            currentgeneratedmatches.team_1.totalovers = currentgeneratedmatches.team_2.overs;
                                            currentgeneratedmatches.team_2.battingcompleted = true;
                                        }                                   
                                    }
                                    
                                    currentgeneratedmatches.innings.second = team;
                                }
                                else if(innings == 2){
                                    currentgeneratedmatches.innings.third = team;
                                }
                                else if(innings == 3){
                                    currentgeneratedmatches.innings.fourth = team;
                                }
                        }


                        function updatescorecard(currentgeneratedmatches,scorecardurl){

                            request({
                                "url":scorecardurl,
                                "jar":true
                            }, function (scorecarderror, scorecardresponse, scorecardbody) {
                                var $ = cheerio.load(scorecardbody);
                                
                                currentgeneratedmatches.team_1.scorecard_auto = [];
                                currentgeneratedmatches.team_2.scorecard_auto = [];

                                currentgeneratedmatches.team_1.bowler_scorecard_auto = [];
                                currentgeneratedmatches.team_2.bowler_scorecard_auto = [];

                                currentgeneratedmatches.team_1.fall_of_wickets = [];
                                currentgeneratedmatches.team_2.fall_of_wickets = [];

                                console.log("initialize update scorecard");

                                //console.log($(".sub-module.scorecard").text());

                                //Scorecard Details


                                var innings_count = {
                                	team_1:1,
                                	team_2:1
                                }

                                $(".sub-module.scorecard").each(function(i){
                                    var currentteam = $(this).find("H2").text();

                                    //console.log("batting scorecard");
                                     
                                    //console.log(currentteam);

                                    if(currentgeneratedmatches.match_type == 'test'){
                                    	if(currentteam.indexOf('1st')>-1){
                                    		innings_count.team_1 = 1;
                                    	}
                                    	else if(currentteam.indexOf('2nd')>-1){
                                    		innings_count.team_1 = 2;
                                    	}
                                    }

                                    if(currentteam.indexOf(team1details.team_name)>-1 || currentteam.indexOf(team1details.short_name)>-1 || currentteam.indexOf(team1details.alias)>-1){

                                       // console.log("Team 1 scorecard start");

                                        //Set innings 
                                        setinnings(i,"team1",currentgeneratedmatches);

                                        

                                        var matchsegment = $(this).find('.flex-row>.wrap.header>.cell.runs').eq(1).text();

                                        //Batting Scorecard
                                         $(this).find(".flex-row>.wrap.batsmen").each(function(){
                                            var randomplayerid = Math.floor(Math.random() * (1000000 - 999999 + 1)) + 1000000;

                                            var batsmanscorecard1 = {
                                                "innings":innings_count.team_1,
                                                "player_id":randomplayerid,
                                                "player_name":$(this).find(".cell.batsmen").text(),
                                                "score":$(this).find(".cell.runs").eq(0).text(),
                                                "wicket_notes":$(this).find(".cell.commentary").text()
                                            };

                                            if(matchsegment == "M"){
                                            	batsmanscorecard1.balls = $(this).find(".cell.runs").eq(2).text();
                                            	batsmanscorecard1.fours = $(this).find(".cell.runs").eq(3).text();
                                            	batsmanscorecard1.sixes = $(this).find(".cell.runs").eq(4).text();
                                            	batsmanscorecard1.strike_rate = $(this).find(".cell.runs").eq(5).text();
                                            }
                                            else{
                                            	batsmanscorecard1.balls = $(this).find(".cell.runs").eq(1).text();
                                            	batsmanscorecard1.fours = $(this).find(".cell.runs").eq(2).text();
                                            	batsmanscorecard1.sixes = $(this).find(".cell.runs").eq(3).text();
                                            	batsmanscorecard1.strike_rate = $(this).find(".cell.runs").eq(4).text();
                                            }


                                            //console.log(batsmanscorecard1);

                                            if(batsmanscorecard1.wicket_notes!='not out' && batsmanscorecard1.wicket_notes!='retired hurt'){
                                                batsmanscorecard1.wicket = 1;
                                            }
                                            else{
                                                batsmanscorecard1.wicket = 0;
                                            }

                                            if(batsmanscorecard1.wicket_notes == 'not out'){
                                                batsmanscorecard1.playing = true;
                                            }

                                            currentgeneratedmatches.team_1.scorecard_auto.push(batsmanscorecard1);
                                         })


                                         //Fall of wickets

                                         $(this).find('.flex-row>.wrap.dnb>.cell').each(function(){
                                            if($(this).find('span').text().indexOf('wicket')>-1){
                                                //console.log($(this).text());
                                                if($(this).text()!=null){
                                                    var fall_of_wickets_details = $(this).text().split(':')[1];
                                                    var fall_of_wickets_list = fall_of_wickets_details.split('),');

                                                    fall_of_wickets_list.forEach(function(data){
                                                        console.log(data);
                                                        var temp = {
                                                            "innings":innings_count.team_1,
                                                            "player_name": data.split('(')[1].split(',')[0],
                                                            "overs":data.split('(')[1].split(',')[1].replace(' ','').split(' ')[0].split('.')[0],
                                                            "balls":data.split('(')[1].split(',')[1].replace(' ','').split(' ')[0].split('.')[1],
                                                            "wicket_position": data.split('(')[0].split(' ').join('').split('-')[0],
                                                            "score": data.split('(')[0].split(' ').join('').split('-')[1]
                                                        }

                                                        /*console.log("TEAM 1 FALL OF WICKET");
                                                        console.log(temp);*/

                                                        currentgeneratedmatches.team_1.fall_of_wickets.push(temp);

                                                    })

                                                }
                                            }
                                        })

                                        //console.log(currentgeneratedmatches.team_1.fall_of_wickets);

                                         //Bowling Scorecard
                                         $(this).find(".scorecard-section tbody tr").each(function(data, element){
                                              var bowlerscorecard1 = {
                                                "innings":innings_count.team_1,
                                                player_name: $(this).find('td').eq(0).text(),
                                                overs:$(this).find('td').eq(2).text(),
                                                maiden:$(this).find('td').eq(3).text(),
                                                runs: $(this).find('td').eq(4).text(),
                                                numberofwickets:$(this).find('td').eq(5).text(),
                                                economy:$(this).find('td').eq(6).text(),
                                                dots:$(this).find('td').eq(7).text(),
                                                fours:$(this).find('td').eq(8).text(),
                                                sixes:$(this).find('td').eq(9).text(),
                                                wide:$(this).find('td').eq(10).text(),
                                                noball:$(this).find('td').eq(11).text()
                                              }

                                              if(typeof bowlerscorecard1.overs!="undefined"){
                                                if(bowlerscorecard1.overs!=null){
                                                    bowlerscorecard1.balls = parseInt(bowlerscorecard1.overs.split(".")[0])*6 + parseInt(bowlerscorecard1.overs.split(".")[1]);
                                                }
                                              }

                                              currentgeneratedmatches.team_1.bowler_scorecard_auto.push(bowlerscorecard1); 

                                         })

                                         //Total Scorecard
                                         var totalscorecard1 = $(this).find('.wrap.total > .cell').eq(1).text();
                                         var totalextras1 = $(this).find('.flex-row>.wrap.extras>.cell').eq(1).text();

                                         //console.log(totalscorecard1);

                                         if(innings_count.team_1 == 1){
                                         	if(totalscorecard1.indexOf('all out')>-1){
	                                            currentgeneratedmatches.team_1.scores = totalscorecard1.split('(')[0].replace(" all out ","");
	                                            currentgeneratedmatches.team_1.wickets = 10;
	                                         }
	                                         else{
	                                            currentgeneratedmatches.team_1.scores = totalscorecard1.split('(')[0].split('/')[0];
	                                            currentgeneratedmatches.team_1.wickets = totalscorecard1.split('(')[0].split('/')[1];
	                                         }

	                                         currentgeneratedmatches.team_1.overs = totalscorecard1.split('(')[1].split(',')[0].split(" ")[0].split('.')[0];

	                                         if(totalscorecard1.split('(')[1].split(',')[0].split(" ")[0].split('.').length>1){
	                                            currentgeneratedmatches.team_1.balls = totalscorecard1.split('(')[1].split(',')[0].split(" ")[0].split('.')[1];
	                                         }
	                                         else{
	                                            currentgeneratedmatches.team_1.balls = 0;
	                                         }

                                             //Extras

                                             var allextras = totalextras1.split(' (')[1].replace(')','').split(',');

                                             console.log("TEAM 1 EXTRAS innings 1");
                                             console.log(allextras);

                                             if(typeof allextras!="undefined"){
                                                currentgeneratedmatches.team_1.byes = 0;
                                                currentgeneratedmatches.team_1.legbyes = 0;
                                                currentgeneratedmatches.team_1.wide = 0;
                                                currentgeneratedmatches.team_1.noball = 0;
                                                 allextras.forEach(function(extras,index){
                                                    if(index!=0){
                                                        extras = extras.replace(' ','');
                                                    }
                                                    var extras_title = extras.split(' ')[0];
                                                    var extras_value = extras.split(' ')[1];

                                                    if(extras_title == 'b'){
                                                        currentgeneratedmatches.team_1.byes = extras_value;
                                                    }
                                                    if(extras_title == 'lb'){
                                                        currentgeneratedmatches.team_1.legbyes = extras_value;
                                                    }
                                                    if(extras_title == 'w'){
                                                        currentgeneratedmatches.team_1.wide = extras_value;
                                                    }
                                                    if(extras_title == 'nb'){
                                                        currentgeneratedmatches.team_1.noball = extras_value;
                                                    }
                                                 });
                                             }


	                                         try{
	                                            currentgeneratedmatches.team_1.runrate = totalscorecard1.split('(')[1].split(',')[1].replace(')','').replace('RR: ','').replace(' ','');
	                                         }
	                                         catch(e){
	                                            
	                                         }
                                         }
                                         else if(innings_count.team_1 == 2){
	                                         if(totalscorecard1.indexOf('all out')>-1){
	                                            currentgeneratedmatches.team_1.second_innings_scores = totalscorecard1.split('(')[0].replace(" all out ","");
	                                            currentgeneratedmatches.team_1.second_innings_wickets = 10;
	                                         }
	                                         else{
	                                            currentgeneratedmatches.team_1.second_innings_scores = totalscorecard1.split('(')[0].split('/')[0];
	                                            currentgeneratedmatches.team_1.second_innings_wickets = totalscorecard1.split('(')[0].split('/')[1];
	                                         }

	                                         currentgeneratedmatches.team_1.second_innings_overs = totalscorecard1.split('(')[1].split(',')[0].split(" ")[0].split('.')[0];

	                                         if(totalscorecard1.split('(')[1].split(',')[0].split(" ")[0].split('.').length>1){
	                                            currentgeneratedmatches.team_1.second_innings_balls = totalscorecard1.split('(')[1].split(',')[0].split(" ")[0].split('.')[1];
	                                         }
	                                         else{
	                                            currentgeneratedmatches.team_1.second_innings_balls = 0;
	                                         }



                                             //Extras
                                             var allextras = totalextras1.split(' (')[1].replace(')','').split(',');

                                             console.log("TEAM 1 EXTRAS innings 2");
                                             console.log(allextras);   

                                             if(typeof allextras!="undefined"){
                                                currentgeneratedmatches.team_1.second_innings_byes = 0;
                                                currentgeneratedmatches.team_1.second_innings_legbyes = 0;
                                                currentgeneratedmatches.team_1.second_innings_wide = 0;
                                                currentgeneratedmatches.team_1.second_innings_noball = 0;

                                                allextras.forEach(function(extras,index){
                                                    if(index!=0){
                                                        extras = extras.replace(' ','');
                                                    }
                                                    var extras_title = extras.split(' ')[0];
                                                    var extras_value = extras.split(' ')[1];

                                                    if(extras_title == 'b'){
                                                        currentgeneratedmatches.team_1.second_innings_byes = extras_value;
                                                    }
                                                    if(extras_title == 'lb'){
                                                        currentgeneratedmatches.team_1.second_innings_legbyes = extras_value;
                                                    }
                                                    if(extras_title == 'w'){
                                                        currentgeneratedmatches.team_1.second_innings_wide = extras_value;
                                                    }
                                                    if(extras_title == 'nb'){
                                                        currentgeneratedmatches.team_1.second_innings_noball = extras_value;
                                                    }
                                                });

                                            }

	                                         try{
	                                            currentgeneratedmatches.team_1.runrate = totalscorecard1.split('(')[1].split(',')[1].replace(')','').replace('RR: ','').replace(' ','');
	                                         }
	                                         catch(e){
	                                            
	                                         }
                                         }

                                        // console.log("Team 1 scorecard added");

                                        // console.log(currentgeneratedmatches.team_1.scorecard_auto);

                                    }
                                    else if(currentteam.indexOf(team2details.team_name)>-1 || currentteam.indexOf(team2details.short_name)>-1 || currentteam.indexOf(team2details.alias)>-1){

                                    	var matchsegment = $(this).find('.flex-row>.wrap.header>.cell.runs').eq(1).text();

                                    	if(currentgeneratedmatches.match_type == 'test'){
	                                    	if(currentteam.indexOf('1st')>-1){
	                                    		innings_count.team_2 = 1;
	                                    	}
	                                    	else if(currentteam.indexOf('2nd')>-1){
	                                    		innings_count.team_2 = 2;
	                                    	}
	                                    }


                                        $(this).find(".flex-row>.wrap.batsmen").each(function(){

                                           // console.log("Team 2 scorecard start");

                                            //Set innings 
                                            setinnings(i,"team2",currentgeneratedmatches);

                                            
                                            var randomplayerid = Math.floor(Math.random() * (1000000 - 999999 + 1)) + 1000000;

                                            //Batting Scorecard
                                            var batsmanscorecard2 = {
                                                "innings":innings_count.team_2,
                                                "player_id":randomplayerid,
                                                "player_name":$(this).find(".cell.batsmen").text(),
                                                "score":$(this).find(".cell.runs").eq(0).text(),
                                                "wicket_notes":$(this).find(".cell.commentary").text()
                                            };

                                            if(matchsegment == "M"){
                                            	batsmanscorecard2.balls = $(this).find(".cell.runs").eq(2).text();
                                            	batsmanscorecard2.fours = $(this).find(".cell.runs").eq(3).text();
                                            	batsmanscorecard2.sixes = $(this).find(".cell.runs").eq(4).text();
                                            	batsmanscorecard2.strike_rate = $(this).find(".cell.runs").eq(5).text();
                                            }
                                            else{
                                            	batsmanscorecard2.balls = $(this).find(".cell.runs").eq(1).text();
                                            	batsmanscorecard2.fours = $(this).find(".cell.runs").eq(2).text();
                                            	batsmanscorecard2.sixes = $(this).find(".cell.runs").eq(3).text();
                                            	batsmanscorecard2.strike_rate = $(this).find(".cell.runs").eq(4).text();
                                            }

                                            //console.log("Batsman Scorecard2");


                                            if(batsmanscorecard2.wicket_notes!='not out' && batsmanscorecard2.wicket_notes!='retired hurt'){
                                                batsmanscorecard2.wicket = 1;
                                            }
                                            else{
                                                batsmanscorecard2.wicket = 0;
                                            }

                                            if(batsmanscorecard2.wicket_notes == 'not out'){
                                                batsmanscorecard2.playing = true;
                                            }

                                            currentgeneratedmatches.team_2.scorecard_auto.push(batsmanscorecard2);
                                        })

                                        $(this).find('.flex-row>.wrap.dnb>.cell').each(function(){
                                                if($(this).find('span').text().indexOf('wicket')>-1){
                                                    //console.log($(this).text());
                                                    if($(this).text()!=null){
                                                        var fall_of_wickets_details = $(this).text().split(':')[1];
                                                        var fall_of_wickets_list = fall_of_wickets_details.split('),');

                                                        fall_of_wickets_list.forEach(function(data){
                                                            console.log(data);
                                                            var temp = {
                                                                "innings":innings_count.team_2,
                                                                "player_name": data.split('(')[1].split(',')[0],
                                                                "overs":data.split('(')[1].split(',')[1].replace(' ','').split(' ')[0].split('.')[0],
                                                                "balls":data.split('(')[1].split(',')[1].replace(' ','').split(' ')[0].split('.')[1],
                                                                "wicket_position": data.split('(')[0].split(' ').join('').split('-')[0],
                                                                "score": data.split('(')[0].split(' ').join('').split('-')[1]
                                                            }
/*
                                                            console.log("TEAM 2 FALL OF WICKET");
                                                            console.log(temp);*/

                                                            currentgeneratedmatches.team_2.fall_of_wickets.push(temp);

                                                        })

                                                    }

                                                }
                                            })

                                        //console.log(currentgeneratedmatches.team_2.fall_of_wickets);


                                        //Bowling Scorecard
                                        $(this).find(".scorecard-section tbody tr").each(function(data, element){
                                              var bowlerscorecard2 = {
                                                "innings":innings_count.team_2,
                                                player_name: $(this).find('td').eq(0).text(),
                                                overs:$(this).find('td').eq(2).text(),
                                                maiden:$(this).find('td').eq(3).text(),
                                                runs: $(this).find('td').eq(4).text(),
                                                numberofwickets:$(this).find('td').eq(5).text(),
                                                economy:$(this).find('td').eq(6).text(),
                                                dots:$(this).find('td').eq(7).text(),
                                                fours:$(this).find('td').eq(8).text(),
                                                sixes:$(this).find('td').eq(9).text(),
                                                wide:$(this).find('td').eq(10).text(),
                                                noball:$(this).find('td').eq(11).text()
                                              }
                                               

                                              if(typeof bowlerscorecard2.overs!="undefined"){
                                                if(bowlerscorecard2.overs!=null){
                                                    bowlerscorecard2.balls = parseInt(bowlerscorecard2.overs.split(".")[0])*6 + parseInt(bowlerscorecard2.overs.split(".")[1]);
                                                }
                                              }  
                                              
                                              currentgeneratedmatches.team_2.bowler_scorecard_auto.push(bowlerscorecard2); 

                                        })


                                        //Total Scorecard
                                         var totalscorecard2 = $(this).find('.wrap.total > .cell').eq(1).text();
                                         var totalextras2 = $(this).find('.flex-row>.wrap.extras>.cell').eq(1).text();
                                         

                                         if(innings_count.team_2 == 1){
	                                         //console.log(totalscorecard2);

	                                         if(totalscorecard2.indexOf('all out')>-1){
	                                            currentgeneratedmatches.team_2.scores = totalscorecard2.split('(')[0].replace(" all out ","");
	                                            currentgeneratedmatches.team_2.wickets = 10;
	                                         }
	                                         else{
	                                            currentgeneratedmatches.team_2.scores = totalscorecard2.split('(')[0].split('/')[0];
	                                            currentgeneratedmatches.team_2.wickets = totalscorecard2.split('(')[0].split('/')[1];
	                                         }

	                                         

	                                         currentgeneratedmatches.team_2.overs = totalscorecard2.split('(')[1].split(',')[0].split(" ")[0].split('.')[0];

	                                         if(totalscorecard2.split('(')[1].split(',')[0].split(" ")[0].split('.').length>1){
	                                            currentgeneratedmatches.team_2.balls = totalscorecard2.split('(')[1].split(',')[0].split(" ")[0].split('.')[1];
	                                         }
	                                         else{
	                                            currentgeneratedmatches.team_2.balls = 0;
	                                         }

                                             //Extras
                                             var allextras = totalextras2.split(' (')[1].replace(')','').split(',');

                                             console.log("TEAM 2 EXTRAS innings 1");
                                             console.log(allextras);

                                             if(typeof allextras!="undefined"){
                                                currentgeneratedmatches.team_2.byes = 0;
                                                currentgeneratedmatches.team_2.legbyes = 0;
                                                currentgeneratedmatches.team_2.wide = 0;
                                                currentgeneratedmatches.team_2.noball = 0;

                                                allextras.forEach(function(extras,index){
                                                    if(index!=0){
                                                        extras = extras.replace(' ','');
                                                    }

                                                    var extras_title = extras.split(' ')[0];
                                                    var extras_value = extras.split(' ')[1];

                                                    if(extras_title == 'b'){
                                                        currentgeneratedmatches.team_2.byes = extras_value;
                                                    }
                                                    if(extras_title == 'lb'){
                                                        currentgeneratedmatches.team_2.legbyes = extras_value;
                                                    }
                                                    if(extras_title == 'w'){
                                                        currentgeneratedmatches.team_2.wide = extras_value;
                                                    }
                                                    if(extras_title == 'nb'){
                                                        currentgeneratedmatches.team_2.noball = extras_value;
                                                    }
                                                });
                                                
                                             }

	                                         
	                                         try{
	                                            currentgeneratedmatches.team_2.runrate = totalscorecard2.split('(')[1].split(',')[1].replace(')','').replace('RR: ','').replace(' ','');
	                                         }
	                                         catch(e){
	                                            
	                                         }                                            
                                         }
                                         else if(innings_count.team_2 == 2){

	                                         if(totalscorecard2.indexOf('all out')>-1){
	                                            currentgeneratedmatches.team_2.second_innings_scores = totalscorecard2.split('(')[0].replace(" all out ","");
	                                            currentgeneratedmatches.team_2.second_innings_wickets = 10;
	                                         }
	                                         else{
	                                            currentgeneratedmatches.team_2.second_innings_scores = totalscorecard2.split('(')[0].split('/')[0];
	                                            currentgeneratedmatches.team_2.second_innings_wickets = totalscorecard2.split('(')[0].split('/')[1];
	                                         }

	                                         

	                                         currentgeneratedmatches.team_2.second_innings_overs = totalscorecard2.split('(')[1].split(',')[0].split(" ")[0].split('.')[0];

	                                         if(totalscorecard2.split('(')[1].split(',')[0].split(" ")[0].split('.').length>1){
	                                            currentgeneratedmatches.team_2.second_innings_balls = totalscorecard2.split('(')[1].split(',')[0].split(" ")[0].split('.')[1];
	                                         }
	                                         else{
	                                            currentgeneratedmatches.team_2.second_innings_balls = 0;
	                                         }
	                                         
                                             //Extras
                                             var allextras = totalextras2.split(' (')[1].replace(')','').split(',');
                                             
                                             console.log("TEAM 2 EXTRAS innings 2");
                                             console.log(allextras);

                                             if(typeof allextras!='undefined'){
                                                currentgeneratedmatches.team_2.second_innings_byes = 0;
                                                currentgeneratedmatches.team_2.second_innings_legbyes = 0;
                                                currentgeneratedmatches.team_2.second_innings_wide = 0;
                                                currentgeneratedmatches.team_2.second_innings_noball = 0;
                                                allextras.forEach(function(extras,index){
                                                    if(index!=0){
                                                        extras = extras.replace(' ','');
                                                    }
                                                    var extras_title = extras.split(' ')[0];
                                                    var extras_value = extras.split(' ')[1];

                                                    if(extras_title == 'b'){
                                                        currentgeneratedmatches.team_2.second_innings_byes = extras_value;
                                                    }
                                                    if(extras_title == 'lb'){
                                                        currentgeneratedmatches.team_2.second_innings_legbyes = extras_value;
                                                    }
                                                    if(extras_title == 'w'){
                                                        currentgeneratedmatches.team_2.second_innings_wide = extras_value;
                                                    }
                                                    if(extras_title == 'nb'){
                                                        currentgeneratedmatches.team_2.second_innings_noball = extras_value;
                                                    }
                                                });
                                             }


	                                         try{
	                                            currentgeneratedmatches.team_2.runrate = totalscorecard2.split('(')[1].split(',')[1].replace(')','').replace('RR: ','').replace(' ','');
	                                         }
	                                         catch(e){
	                                            
	                                         }	
                                         }
                                    }
                                });

                                if(currentgeneratedmatches.current_match_status == 'result'){
                                    currentgeneratedmatches.status = $(".game-status").eq(1).text();
                                }
        
                                //Live Score update                    
                                if(currentgeneratedmatches.current_match_status == 'live'){
                                    request({
                                    "url":currentgeneratedmatches.auto_match_link,
                                    "jar":true
                                    }, function (livescoreerror, livescoreresponse, livescorebody) {

                                        var $ = cheerio.load(livescorebody);

                                        //console.log("currentinnings");

                                        //console.log(currentinnings);

                                        //console.log(currentinnings.indexOf(team1details.team_name.toLowerCase()));


                                        //Live score update for team1

                                        if(currentinnings.indexOf(team1details.team_name.toLowerCase())>-1 
                                            || currentinnings.indexOf(team1details.short_name.toLowerCase())>-1 
                                            || currentinnings.indexOf(team1details.alias.toLowerCase())>-1){

                                            scoredetails.team = team1details._id;
                                            scoredetails.overs = currentgeneratedmatches.team_1.overs;
                                            scoredetails.balls = currentgeneratedmatches.team_1.balls;
                                            currentgeneratedmatches.team_1.status = true;

                                            $('.commentary-item').each(function(){

                                                var commentary_over = $(this).find('.over > .time-stamp').text().split('.')[0];
                                                var commentary_balls = $(this).find('.over > .time-stamp').text().split('.')[1];
                                                var commentary_runs = $(this).find('.over > .over-circle').text();
                                                var commentary_description = $(this).find('.description').text();

                                                if(typeof commentary_balls!='undefined' && typeof commentary_runs!='undefined'){
                                                    Commentaries.findOneAndUpdate({ 
                                                        "match_id":currentgeneratedmatches._id,
                                                        "ball":commentary_balls,
                                                        "over":commentary_over,
                                                        "team":"team1"
                                                    }, 
                                                    {
                                                        "match_id":currentgeneratedmatches._id,
                                                        "ball":commentary_balls,
                                                        "over":commentary_over,
                                                        "team":"team1",
                                                        "created_At":new Date(),
                                                        "text":commentary_description
                                                    }, 
                                                    { 
                                                        upsert: true, 
                                                        new: true 
                                                    }, 
                                                    function (err, comm_res) {
                                                        if(!err){
                                                           // console.log("commentary added");
                                                        }
                                                        else{
                                                           // console.log("error in commentary add");
                                                        }

                                                    })
                                                }

                                                if(commentary_balls == 6){
                                                    commentary_over = parseInt(commentary_over) + 1;
                                                    commentary_balls = 0;
                                                }

                                                if(commentary_over == currentgeneratedmatches.team_1.overs 
                                                    && commentary_balls == currentgeneratedmatches.team_1.balls){
                                                    
                                                    scoredetails.event = {};

                                                    if(commentary_runs == "0"){
                                                        scoredetails.event.dot = 0;
                                                    }

                                                    if(commentary_runs == "1"){
                                                        scoredetails.event.one = 1;
                                                    }

                                                    if(commentary_runs == "2"){
                                                        scoredetails.event.two = 2;
                                                    }

                                                    if(commentary_runs == "3"){
                                                        scoredetails.event.three = 3;
                                                    }

                                                    if(commentary_runs == "4"){
                                                        scoredetails.event.four = 4;
                                                    }

                                                    if(commentary_runs == "6"){
                                                        scoredetails.event.six = 6;
                                                    }

                                                    if(commentary_runs == "W"){
                                                        scoredetails.event.wicket = 1;
                                                    }

                                                    if(commentary_runs.indexOf("w")>-1){
                                                        scoredetails.event.wide = 1;
                                                    }                                                
                                                }
                                            })
                                                
                                                        

                                            // Get Active batsman and Active Bowler
                                            
                                            scoredetails.batsman_id = [];

                                            $('.sub-module.current-inning table>tbody').eq(0).each(function(){
                                                $(this).find('tr').each(function(){
                                                    var activebatsman = $(this).find('td').eq(0).text();
                                                    
                                                    if(activebatsman.indexOf('*')>-1){
                                                        var activebatsman_name = $(this).find('td').eq(0).text();
                                                        scoredetails.active_batsman = {
                                                            player_name: activebatsman_name,
                                                            runs:$(this).find('td').eq(1).text(),
                                                            balls:$(this).find('td').eq(2).text(),
                                                            fours:$(this).find('td').eq(3).text(),
                                                            sixes:$(this).find('td').eq(4).text(),
                                                            strike_rate:$(this).find('td').eq(5).text(),
                                                            age: 0,
                                                            type:""
                                                        }

                                                    }

                                                    for(var i=0;i<currentgeneratedmatches.team_1.scorecard_auto.length;i++){
                                                        
                                                        //console.log("TEAM 1");

                                                       // console.log(currentgeneratedmatches.team_1.scorecard_auto[i].player_name);

                                                        //console.log(activebatsman.replace('*',''));

                                                        if(currentgeneratedmatches.team_1.scorecard_auto[i].player_name.indexOf(activebatsman.replace('*',''))>-1){
                                                            currentgeneratedmatches.team_1.scorecard_auto[i].striker_end_batsman = true;
                                                        }
                                                    }

                                                    scoredetails.batsman_id.push({
                                                        player_name: $(this).find('td').eq(0).text(),
                                                        runs:$(this).find('td').eq(1).text(),
                                                        balls:$(this).find('td').eq(2).text(),
                                                        fours:$(this).find('td').eq(3).text(),
                                                        sixes:$(this).find('td').eq(4).text(),
                                                        strike_rate:$(this).find('td').eq(5).text(),
                                                        age: 0,
                                                        type:""
                                                    })
                                                })
                                            })


                                            $('.sub-module.current-inning table>tbody').eq(1).find('tr').each(function(i){
                                                if(i==0){
                                                    scoredetails.active_bowler = {};
                                                    
                                                    scoredetails.active_bowler.player_name = $(this).find('td').eq(0).text();
                                                    scoredetails.active_bowler.age = "";
                                                    scoredetails.active_bowler.type = "";
                                                    scoredetails.active_bowler.overs = $(this).find('td').eq(1).text();
                                                    scoredetails.active_bowler.maiden = $(this).find('td').eq(2).text();
                                                    scoredetails.active_bowler.runs = $(this).find('td').eq(3).text();
                                                    scoredetails.active_bowler.wicket = $(this).find('td').eq(4).text();
                                                }

                                                if(i==1){
                                                    if(parseInt($(this).find('td').eq(1).text().split('.')[1])!=0){
                                                        scoredetails.active_bowler = {};
                                                        var activebowler_player_name = $(this).find('td').eq(0).text().split('(');
                                                        if(activebowler_player_name.length>0){
                                                            scoredetails.active_bowler.player_name = activebowler_player_name[0];
                                                        }
                                                        else{
                                                            scoredetails.active_bowler.player_name = activebowler_player_name;    
                                                        }
                                                        
                                                        scoredetails.active_bowler.age = "";
                                                        scoredetails.active_bowler.type = "";
                                                        scoredetails.active_bowler.overs = $(this).find('td').eq(1).text();
                                                        scoredetails.active_bowler.maiden = $(this).find('td').eq(2).text();
                                                        scoredetails.active_bowler.runs = $(this).find('td').eq(3).text();
                                                        scoredetails.active_bowler.wicket = $(this).find('td').eq(4).text();
                                                    }
                                                }

                                            })

                                            for(var i=0;i<currentgeneratedmatches.team_1.bowler_scorecard_auto.length;i++){
                                               // console.log("TEAM 1 bowling");
                                                if(currentgeneratedmatches.team_1.bowler_scorecard_auto[i].player_name.indexOf(scoredetails.active_bowler.player_name.replace('*',''))>-1){
                                                    currentgeneratedmatches.team_1.bowler_scorecard_auto[i].playing = true;
                                                }
                                            }

                                            $('.sub-module.current-inning table>tbody').eq(1).each(function(){                                                    

                                                $(this).find('tr').each(function(){
                                                    var activebatsman = $(this).find('td').eq(0).text();

                                                    if(activebatsman.indexOf('*')>-1){
                                                        scoredetails.active_batsman = {
                                                            player_name: $(this).find('td').eq(0).text(),
                                                            runs:$(this).find('td').eq(1).text(),
                                                            balls:$(this).find('td').eq(2).text(),
                                                            fours:$(this).find('td').eq(3).text(),
                                                            sixes:$(this).find('td').eq(4).text(),
                                                            strike_rate:$(this).find('td').eq(5).text(),
                                                            age: 0,
                                                            type:""
                                                        }
                                                    }

                                                    scoredetails.batsman_id.push({
                                                        player_name: $(this).find('td').eq(0).text(),
                                                        runs:$(this).find('td').eq(1).text(),
                                                        balls:$(this).find('td').eq(2).text(),
                                                        fours:$(this).find('td').eq(3).text(),
                                                        sixes:$(this).find('td').eq(4).text(),
                                                        strike_rate:$(this).find('td').eq(5).text(),
                                                        age: 0,
                                                        type:""
                                                    })
                                                })
                                            })
                                        }

                                        //Live score update for team2
                                        if(currentinnings.indexOf(team2details.team_name.toLowerCase())>-1 
                                            || currentinnings.indexOf(team2details.short_name.toLowerCase())>-1 
                                            || currentinnings.indexOf(team2details.alias.toLowerCase())>-1){

                                            scoredetails.team = team2details._id;
                                            scoredetails.overs = currentgeneratedmatches.team_2.overs;
                                            scoredetails.balls = currentgeneratedmatches.team_2.balls;

                                            currentgeneratedmatches.team_2.status = true;

                                            $('.commentary-item').each(function(){

                                                var commentary_over = $(this).find('.over > .time-stamp').text().split('.')[0];
                                                var commentary_balls = $(this).find('.over > .time-stamp').text().split('.')[1];
                                                var commentary_runs = $(this).find('.over > .over-circle').text();
                                                var commentary_description = $(this).find('.description').text();

                                                if(typeof commentary_balls!='undefined' && typeof commentary_runs!='undefined'){
                                                    Commentaries.findOneAndUpdate({ 
                                                        "match_id":currentgeneratedmatches._id,
                                                        "ball":commentary_balls,
                                                        "over":commentary_over,
                                                        "team":"team2"
                                                    }, 
                                                    {
                                                        "match_id":currentgeneratedmatches._id,
                                                        "ball":commentary_balls,
                                                        "over":commentary_over,
                                                        "created_At":new Date(),
                                                        "team":"team2",
                                                        "text":commentary_description
                                                    }, 
                                                    { 
                                                        upsert: true, 
                                                        new: true 
                                                    }, 
                                                    function (err, comm_res) {
                                                        if(!err){
                                                           // console.log("commentary added");
                                                        }
                                                        else{
                                                           // console.log("error in commentary add");
                                                        }

                                                    })
                                                }

                                                if(commentary_balls == 6){
                                                    commentary_over = parseInt(commentary_over) + 1;
                                                    commentary_balls = 0;
                                                }

                                                if(commentary_over == currentgeneratedmatches.team_2.overs 
                                                    && commentary_balls == currentgeneratedmatches.team_2.balls){
                                                    
                                                    scoredetails.event = {};

                                                    if(commentary_runs == "0"){
                                                        scoredetails.event.dot = 0;
                                                    }

                                                    if(commentary_runs == "1"){
                                                        scoredetails.event.one = 1;
                                                    }

                                                    if(commentary_runs == "2"){
                                                        scoredetails.event.two = 2;
                                                    }

                                                    if(commentary_runs == "3"){
                                                        scoredetails.event.three = 3;
                                                    }

                                                    if(commentary_runs == "4"){
                                                        scoredetails.event.four = 4;
                                                    }

                                                    if(commentary_runs == "6"){
                                                        scoredetails.event.six = 6;
                                                    }

                                                    if(commentary_runs == "W"){
                                                        scoredetails.event.wicket = 1;
                                                    }

                                                    if(commentary_runs.indexOf("w")>-1){
                                                        scoredetails.event.wide = 1;
                                                    }                                                
                                                }
                                            })

                                            
                                            scoredetails.batsman_id = [];

                                            $('.sub-module.current-inning table>tbody').eq(0).each(function(){
                                                $(this).find('tr').each(function(){
                                                    var activebatsman = $(this).find('td').eq(0).text();
                                                    
                                                    if(activebatsman.indexOf('*')>-1){
                                                        var activebatsman_name = $(this).find('td').eq(0).text();
                                                        scoredetails.active_batsman = {
                                                            player_name:activebatsman_name ,
                                                            runs:$(this).find('td').eq(1).text(),
                                                            balls:$(this).find('td').eq(2).text(),
                                                            fours:$(this).find('td').eq(3).text(),
                                                            sixes:$(this).find('td').eq(4).text(),
                                                            strike_rate:$(this).find('td').eq(5).text(),
                                                            age: 0,
                                                            type:""
                                                        }

                                                    }


                                                    for(var i=0;i<currentgeneratedmatches.team_2.scorecard_auto.length;i++){
                                                        
                                                        //console.log("TEAM 2");

                                                        //console.log(currentgeneratedmatches.team_2.scorecard_auto[i].player_name);

                                                        //console.log(activebatsman.replace('*',''));

                                                        if(currentgeneratedmatches.team_2.scorecard_auto[i].player_name.indexOf(activebatsman.replace('*',''))>-1){
                                                            currentgeneratedmatches.team_2.scorecard_auto[i].striker_end_batsman = true;
                                                        }
                                                    }

                                                    /*for(var i=0;i<currentgeneratedmatches.team_2.scorecard.length;i++){

                                                        console.log("TEAM 2");

                                                        console.log(currentgeneratedmatches.team_2.scorecard[i].player_name);

                                                        console.log(activebatsman);

                                                        if(currentgeneratedmatches.team_2.scorecard[i].player_name == activebatsman){
                                                            if(activebatsman.indexOf('*')>-1){
                                                                currentgeneratedmatches.team_2.scorecard[i].striker_end_batsman = true;
                                                            }
                                                        }
                                                    }*/

                                                    scoredetails.batsman_id.push({
                                                        player_name: $(this).find('td').eq(0).text(),
                                                        runs:$(this).find('td').eq(1).text(),
                                                        balls:$(this).find('td').eq(2).text(),
                                                        fours:$(this).find('td').eq(3).text(),
                                                        sixes:$(this).find('td').eq(4).text(),
                                                        strike_rate:$(this).find('td').eq(5).text(),
                                                        age: 0,
                                                        type:""
                                                    })
                                                })
                                            })


                                            $('.sub-module.current-inning table>tbody').eq(1).find('tr').each(function(i){
                                                if(i==0){
                                                    scoredetails.active_bowler = {};
                                                    var activebowler_player_name = $(this).find('td').eq(0).text().split('(');
                                                    if(activebowler_player_name.length>0){
                                                        scoredetails.active_bowler.player_name = activebowler_player_name[0];
                                                    }
                                                    else{
                                                        scoredetails.active_bowler.player_name = activebowler_player_name;    
                                                    }

                                                    scoredetails.active_bowler.age = "";
                                                    scoredetails.active_bowler.type = "";
                                                    scoredetails.active_bowler.overs = $(this).find('td').eq(1).text();
                                                    scoredetails.active_bowler.maiden = $(this).find('td').eq(2).text();
                                                    scoredetails.active_bowler.runs = $(this).find('td').eq(3).text();
                                                    scoredetails.active_bowler.wicket = $(this).find('td').eq(4).text();
                                                }

                                                if(i==1){
                                                    if(parseInt($(this).find('td').eq(1).text().split('.')[1])!=0){
                                                        scoredetails.active_bowler = {};
                                                        
                                                        scoredetails.active_bowler.player_name = $(this).find('td').eq(0).text().split('(')[0];
                                                        scoredetails.active_bowler.age = "";
                                                        scoredetails.active_bowler.type = "";
                                                        scoredetails.active_bowler.overs = $(this).find('td').eq(1).text();
                                                        scoredetails.active_bowler.maiden = $(this).find('td').eq(2).text();
                                                        scoredetails.active_bowler.runs = $(this).find('td').eq(3).text();
                                                        scoredetails.active_bowler.wicket = $(this).find('td').eq(4).text();
                                                    }
                                                }
                                            })

                                            for(var i=0;i<currentgeneratedmatches.team_2.bowler_scorecard_auto.length;i++){
                                                //console.log("TEAM 2 bowling");
                                                if(currentgeneratedmatches.team_2.bowler_scorecard_auto[i].player_name.indexOf(scoredetails.active_bowler.player_name.replace('*',''))>-1){
                                                    currentgeneratedmatches.team_2.bowler_scorecard_auto[i].playing = true;
                                                }
                                            }

                                            $('.sub-module.current-inning table>tbody').eq(1).each(function(){                                                    

                                                $(this).find('tr').each(function(){
                                                    var activebatsman = $(this).find('td').eq(0).text();

                                                    if(activebatsman.indexOf('*')>-1){
                                                        scoredetails.active_batsman = {
                                                            player_name: $(this).find('td').eq(0).text(),
                                                            runs:$(this).find('td').eq(1).text(),
                                                            balls:$(this).find('td').eq(2).text(),
                                                            fours:$(this).find('td').eq(3).text(),
                                                            sixes:$(this).find('td').eq(4).text(),
                                                            strike_rate:$(this).find('td').eq(5).text(),
                                                            age: 0,
                                                            type:""
                                                        }
                                                    }

                                                    scoredetails.batsman_id.push({
                                                        player_name: $(this).find('td').eq(0).text(),
                                                        runs:$(this).find('td').eq(1).text(),
                                                        balls:$(this).find('td').eq(2).text(),
                                                        fours:$(this).find('td').eq(3).text(),
                                                        sixes:$(this).find('td').eq(4).text(),
                                                        strike_rate:$(this).find('td').eq(5).text(),
                                                        age: 0,
                                                        type:""
                                                    })
                                                })
                                            })

                                            //console.log("Team 2 scorecard stop");

                                            //console.log(currentgeneratedmatches.team_2.scorecard_auto);
                                        }

                                        updatedatabase(currentgeneratedmatches);
                                    })
                                }
                                else if(currentgeneratedmatches.current_match_status == 'result'){
                                    
                                    currentgeneratedmatches.team_1.battingcompleted = true;
                                    currentgeneratedmatches.team_2.battingcompleted = true;

                                    var SUMMARY_LINK =  HOMEDOMAIN + $('.first-group>.sub>.game.react-router-link').attr("href");

                                    var LINK_TEXT = $('.first-group>.sub>.game.react-router-link>.link-text').text().toLowerCase();

                                    if(LINK_TEXT == 'live'){
                                        request({
                                        "url":SUMMARY_LINK,
                                        "jar":true
                                        }, function (summaryerror, summaryresponse, summarybody) {
                                            //console.log("Scorecard results block called");
                                            
                                            var $ = cheerio.load(summarybody);
                                            $('.sub-module.current-inning table>tbody').eq(0).each(function(){
                                                $(this).find('tr').each(function(){
                                                    var batsmen_1 = $(this).find('td').eq(0).text();

                                                    for(var i=0;i<currentgeneratedmatches.team_1.scorecard_auto.length;i++){
                                                        if(currentgeneratedmatches.team_1.scorecard_auto[i].player_name.indexOf(batsmen_1)>-1){
                                                            currentgeneratedmatches.team_1.scorecard_auto[i].playing = true;
                                                        }
                                                    }

                                                    for(var i=0;i<currentgeneratedmatches.team_2.scorecard_auto.length;i++){
                                                        if(currentgeneratedmatches.team_2.scorecard_auto[i].player_name.indexOf(batsmen_1)>-1){
                                                            currentgeneratedmatches.team_2.scorecard_auto[i].playing = true;
                                                        }
                                                    }
                                                })
                                            });

                                            $('.sub-module.scorecard-summary>.content>.inning>.two-col-table').eq(2).each(function(){
                                                var batsmen_1 =$(this).find('li>a').eq(0).text().replace('*','');
                                                var batsmen_2 =$(this).find('li>a').eq(1).text().replace('*','');
                                                
                                                //console.log("set batsman match summary");
                                                //console.log("batsmen_1",batsmen_1);
                                                //console.log("batsmen_2",batsmen_2);

                                                

                                            })
                                            
                                            $('.sub-module.current-inning table>tbody').eq(1).find('tr').each(function(i){
                                                if(i==0){
                                                    var activebowler_player_name = $(this).find('td').eq(0).text().split('(');
                                                    if(activebowler_player_name.length>0){
                                                        var bowler_1 = activebowler_player_name[0];

                                                    }
                                                    else{
                                                        var bowler_1 = activebowler_player_name;
                                                    }

                                                    for(var i=0;i<currentgeneratedmatches.team_1.bowler_scorecard_auto.length;i++){
                                                        if(currentgeneratedmatches.team_1.bowler_scorecard_auto[i].player_name.indexOf(bowler_1)>-1){
                                                            currentgeneratedmatches.team_1.bowler_scorecard_auto[i].playing = true;
                                                        }
                                                    }

                                                    for(var i=0;i<currentgeneratedmatches.team_2.bowler_scorecard_auto.length;i++){
                                                        if(currentgeneratedmatches.team_2.bowler_scorecard_auto[i].player_name.indexOf(bowler_1)>-1){
                                                            currentgeneratedmatches.team_2.bowler_scorecard_auto[i].playing = true;
                                                        }
                                                    }
                                                }

                                                if(i==1){
                                                    var activebowler_player_name = $(this).find('td').eq(0).text().split('(');
                                                    if(activebowler_player_name.length>0){
                                                        var bowler_1 = activebowler_player_name[0];

                                                    }
                                                    else{
                                                        var bowler_1 = activebowler_player_name;
                                                    }

                                                    for(var i=0;i<currentgeneratedmatches.team_1.bowler_scorecard_auto.length;i++){
                                                        if(currentgeneratedmatches.team_1.bowler_scorecard_auto[i].player_name.indexOf(bowler_1)>-1){
                                                            currentgeneratedmatches.team_1.bowler_scorecard_auto[i].playing = true;
                                                        }
                                                    }

                                                    for(var i=0;i<currentgeneratedmatches.team_2.bowler_scorecard_auto.length;i++){
                                                        if(currentgeneratedmatches.team_2.bowler_scorecard_auto[i].player_name.indexOf(bowler_1)>-1){
                                                            currentgeneratedmatches.team_2.bowler_scorecard_auto[i].playing = true;
                                                        }
                                                    }
                                                }
                                                                                                      
                                            })

                                            updatedatabase(currentgeneratedmatches);
                                        })   
                                    }
                                    else{
                                        request({
                                        "url":SUMMARY_LINK,
                                        "jar":true
                                        }, function (summaryerror, summaryresponse, summarybody) {
                                            //console.log("Scorecard results block called");
                                            
                                            var $ = cheerio.load(summarybody);

                                            $('.sub-module.scorecard-summary>.content>.inning>.two-col-table').eq(2).each(function(){
                                                var batsmen_1 =$(this).find('li>a').eq(0).text().replace('*','');
                                                var batsmen_2 =$(this).find('li>a').eq(1).text().replace('*','');
                                                
                                                //console.log("set batsman match summary");
                                                //console.log("batsmen_1",batsmen_1);
                                                //console.log("batsmen_2",batsmen_2);

                                                for(var i=0;i<currentgeneratedmatches.team_1.scorecard_auto.length;i++){
                                                    if(currentgeneratedmatches.team_1.scorecard_auto[i].player_name.indexOf(batsmen_1)>-1 || currentgeneratedmatches.team_1.scorecard_auto[i].player_name.indexOf(batsmen_2)>-1){
                                                        currentgeneratedmatches.team_1.scorecard_auto[i].playing = true;
                                                    }
                                                }

                                                for(var i=0;i<currentgeneratedmatches.team_2.scorecard_auto.length;i++){
                                                    if(currentgeneratedmatches.team_2.scorecard_auto[i].player_name.indexOf(batsmen_1)>-1 || currentgeneratedmatches.team_2.scorecard_auto[i].player_name.indexOf(batsmen_2)>-1){
                                                        currentgeneratedmatches.team_2.scorecard_auto[i].playing = true;
                                                    }
                                                }

                                            })

                                            $('.sub-module.scorecard-summary>.content>.inning>.two-col-table').eq(3).each(function(){
                                                var bowler_1 =$(this).find('li>a').eq(0).text().replace('*','');
                                                var bowler_2 =$(this).find('li>a').eq(1).text().replace('*','');


                                                //console.log("set bowler match summary");
                                                //console.log("bowler_1",bowler_1);
                                                //console.log("bowler_2",bowler_2);


                                                for(var i=0;i<currentgeneratedmatches.team_1.bowler_scorecard_auto.length;i++){
                                                    if(currentgeneratedmatches.team_1.bowler_scorecard_auto[i].player_name.indexOf(bowler_1)>-1 || currentgeneratedmatches.team_1.bowler_scorecard_auto[i].player_name.indexOf(bowler_2)>-1){
                                                        currentgeneratedmatches.team_1.bowler_scorecard_auto[i].playing = true;
                                                    }
                                                }

                                                for(var i=0;i<currentgeneratedmatches.team_2.bowler_scorecard_auto.length;i++){
                                                    if(currentgeneratedmatches.team_2.bowler_scorecard_auto[i].player_name.indexOf(bowler_1)>-1 || currentgeneratedmatches.team_2.bowler_scorecard_auto[i].player_name.indexOf(bowler_2)>-1){
                                                        currentgeneratedmatches.team_2.bowler_scorecard_auto[i].playing = true;
                                                    }
                                                }
                                            })

                                            updatedatabase(currentgeneratedmatches);
                                        })
                                    }
                                    //console.log("summary link");
                                    //console.log(SUMMARY_LINK);

                                }
                                else{
                                    updatedatabase(currentgeneratedmatches);   
                                }

                            })
                        }

                        
                        

                        if(typeof $('.first-group>.sub>.scorecard.react-router-link').attr("href")!='undefined'){
                            var SCORECARD_URL = HOMEDOMAIN+$('.first-group>.sub>.scorecard.react-router-link').attr("href");
                            //console.log(SCORECARD_URL);

                            updatescorecard(currentgeneratedmatches,SCORECARD_URL);
                        }
                        else{
                            updatedatabase(currentgeneratedmatches);
                        }

                        function updatedatabase(currentgeneratedmatches){

                                var updatematchdetails = JSON.parse(JSON.stringify(currentgeneratedmatches));

                                delete updatematchdetails.team_1.teamid;
                                delete updatematchdetails.team_2.teamid;
                                delete updatematchdetails.tournament;

                                updatematchdetails.team_1.teamid = currentgeneratedmatches.team_1.teamid._id;
                                updatematchdetails.team_2.teamid = currentgeneratedmatches.team_2.teamid._id;
                                updatematchdetails.tournament = currentgeneratedmatches.tournament._id;

                                //console.log(updatematchdetails);
                                //console.log("final results");
                                
                                var findmatchquery = {"auto_match_id":currentgeneratedmatches.auto_match_id};


                                //console.log(updatematchdetails);

                                

                                match.update(findmatchquery,updatematchdetails,function(err,updatedmatch){
                                    if(!err){
                                        if(currentgeneratedmatches.current_match_status == 'live'){
                                            //console.log("adding new score initialize");
                                            //Adding new score 
                                            var newscores = new scores(scoredetails);
                                            newscores.save(function (err,data) {
                                                if(!err){
                                                    Scorecarddetails.sendscorecard({},{},{
		                                                "matchID":currentgeneratedmatches._id,
		                                                "match":match,
		                                                "scores":scores,
		                                                "scoresauto":scoresauto,
		                                                "Commentaries":Commentaries,
		                                                "socketio":socket
		                                            },"socketio");
                                                    updatescores(autogeneratedmatches);
                                                    //console.log("score added successfully");
                                                }
                                                else{
                                                    Scorecarddetails.sendscorecard({},{},{
		                                                "matchID":currentgeneratedmatches._id,
		                                                "match":match,
		                                                "scores":scores,
		                                                "scoresauto":scoresauto,
		                                                "Commentaries":Commentaries,
		                                                "socketio":socket
		                                            },"socketio");
                                                    updatescores(autogeneratedmatches);
                                                    //console.log("error in add score");
                                                }
                                            })

                                        }
                                        else{
                                        	Scorecarddetails.sendscorecard({},{},{
                                                "matchID":currentgeneratedmatches._id,
                                                "match":match,
                                                "scores":scores,
                                                "scoresauto":scoresauto,
                                                "Commentaries":Commentaries,
                                                "socketio":socket
                                            },"socketio");

                                            updatescores(autogeneratedmatches);

                                            //console.log("match result");
                                        }
                                    }else{
                                    	Scorecarddetails.sendscorecard({},{},{
                                            "matchID":currentgeneratedmatches._id,
                                            "match":match,
                                            "scores":scores,
                                            "scoresauto":scoresauto,
                                            "Commentaries":Commentaries,
                                            "socketio":socket
                                        },"socketio");
                                        updatescores(autogeneratedmatches);
                                        //console.log(err);
                                        //console.log("Error in update match details");
                                    }
                                })
                            }    
                        }
                        else{
                            //console.log(scoreerror);
                            //console.log("score error in response");

                        }                       

                    })
                }
                else{

                    //After recursive end
                    //console.log("Score update processed");
                }
            }
	}
}