var mailService = require("../../lib/mail");
var Promise = require("bluebird");
var config = require("../../lib/configuration").getconfig();			
var crypto = require("crypto");

module.exports = function(data){
	var account = require("../../models/account").getModel();

	return account.findOne({email: data.email}).exec().then(function(user){
		if(user){
            user.fpToken = crypto.randomBytes(64).toString("hex");
			return new Promise(function(resolve, reject){
				user.save(function(err){
					if(err){
						return reject(err);
					}else{
						return resolve(user);
					}
				})
			})
		}
		else{
			throw (new Error("UserNotFound"));
			return;
		}
	}).then(function(user){
		mailService.sendMail({
			from: 'FundingPort<'+config.email.from+'>',
			to: user.email,
			subject: 'Reset Password',
			html: '<p style="margin-top:0;color:#74787e;font-size:16px;line-height:1.5em">You are receiving this email because we received a password reset request for your account.</p>'+
					'<p style="margin-top:0;color:#74787e;font-size:16px;line-height:1.5em">If this is you, please click this <a href="'+ config.host +'/resetpwd?token='+ user.fpToken +'"> link </a> to reset the password. </p>'+
					'<p style="margin-top:0;color:#74787e;font-size:16px;line-height:1.5em">If you did not request a password reset, no further action is required.</p>'
		});
		return user;
	});
}