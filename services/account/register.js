var Promise = require("bluebird");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var transporter = require("../../lib/mail");
var config = require("../../lib/configuration").getconfig();

module.exports = function(data){
	var account = require("../../models/account").getModel();

	var actions = {
		checkUser: function(){
			return new Promise(function(resolve, reject){
				console.log("check user");
				if((!data.username || !data.email) || !data.password){
					return reject(new Error("InvalidParameters"));
				}else{
					return account.findOne({username: data.username}).exec().then(function(user){
						if(user){
							return reject(new Error("AlreadyRegisterUsername"));
						}
						else{
							return account.findOne({email: data.email}).exec().then(function(usermail){
								if(usermail){
									return reject(new Error("AlreadyRegisterEmail"));
								}
								else{
									return resolve(true);
								}
							}, function(err){
								return reject(err);
							})
						}
					}, function(err){
						return reject(err);
					})
				}
			})
		},
		createUser: function(r){
			//data.password = account.encryptPassword(data.password);
			data.emailToken = null;
			console.log("asfwefer");
			console.log(data);	
			var user = new account(data);
            return new Promise(function(resolve, reject){
                return user.save(function(err){
                    if(err){
                        return reject(err);
                    }else{
                        return resolve(user);
                    }
                })
            })
		},
		sendEmail: function(user){
			console.log("---------------------------------sendmail-----------------------------------------------")
			transporter.sendMail({
				  from: 'FundingPort<'+config.email.from+'>',
				  to: user.email,
				  subject: 'Your Email Verification',
				  html: 'Please click to <a href="'+ config.host +'/confirmEmail?token='+ user.emailToken +'">Verify your account</a>'
				}, function(error, info){
				console.log("send email ID")
			    if(error){
			        console.log(error);
			    }
			    console.log('Confirmation Mail Sent : ' + info.response);
			});

			return user;
		}
	}
	if(data.provider == "admin"){
		return actions.checkUser().then(actions.createUser);
	}
	else{
			return actions.checkUser().then(actions.createUser);
			//return actions.checkUser().then(actions.createUser).then(actions.sendEmail);
	}
	
}