module.exports = {
    sendMail: function(data){
        //var Mailgun = require('mailgun-js');
		var nodemailer = require("nodemailer");
		var smtpTransport = require('nodemailer-smtp-transport');
		var config = require('../config/environment');
		
		var options = {
			host: config.email.host,
			port: config.email.port,
			auth: {
				user: config.email.uname,
				pass: config.email.pwd
			}
		};
		
        var transporter = nodemailer.createTransport(smtpTransport(options));

        transporter.sendMail(data , function(error, info){
            if(error){
                console.log(error);
            }
            console.log('Message sent: ', info);
        });

    }
}