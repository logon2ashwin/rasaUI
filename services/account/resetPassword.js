var Promise = require("bluebird");

module.exports = function(data){
	var account = require("../../models/account").getModel();

	actions = {
		findUser: function(){
			return account.findOne({fpToken: data.token,email:data.email}).exec()
		},

		changePassword: function(user){
			if(user){
				user.password = account.encryptPassword(data.password);
				user.fpToken = null;
				user.emailToken=null;
				user.status='active';
				return new Promise(function(resolve, reject){
					user.save(function(err){
						if(err){
							return reject(err);
						}else{
							return resolve(user);
						}
					})
				})
			}else{
				throw (new Error("The reset token is no longer existed"))
				return;
			}
		}
	}
	return actions.findUser().then(actions.changePassword);
}