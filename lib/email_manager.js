var email_manager = function (projectdetails, mailto, subject, content, calltoaction_link, calltoaction_text, attachmentlinks, trackerimage, callback) {

   var fs = require("fs");	
   var config = require("../lib/configuration").getconfig();		
   var nodemailer = require('nodemailer');
   var smtpTransport = require('nodemailer-smtp-transport');
   var cheerio = require('cheerio')
	
   var smtpconfig = projectdetails.smtp;
	
   console.log("email config", smtpconfig)

    var options = {
        host: smtpconfig.host,
        port: smtpconfig.port,
        auth: {
            user: smtpconfig.username,
            pass: smtpconfig.password
        }
    };


var Handlebars = require('handlebars');


Handlebars.registerHelper('inc', function(number, options) {
    if(typeof(number) === 'undefined' || number === null)
        return null;

    // Increment by inc parameter if it exists or just by one
    return number + (options.hash.inc || 1);
});


var templatesDir = "../templates";
	
	
    var generateEmailMarkup = function (data, callback) {
	    var template = "blank";
		var emailsignature = "signature";
	
		if (smtpconfig.template)
	       template = smtpconfig.template;

	    var templatefilename = __dirname + "/" + templatesDir + "/" + template + ".html";
		var signaturefilename = __dirname + "/" + templatesDir + "/" + emailsignature + ".html";

		fs.readFile(templatefilename, function read(err, templatefile) {
	            if (err) {
	              throw err;
	            }
		    //console.log("RAW HTML", templatefile.toString())
		    //console.log("RAW DATA", data)

		    var template = Handlebars.compile(templatefile.toString());
		    var html = template(data);
		    html = html.split("<table").join('<table style="border: 1px solid black; width: 70%;"');
		    html = html.replace("<tr", '<tr style="border: 1px solid black;background: #999999;color: #fff;"');
	 	    html = html.split("<th").join('<th style="border: 1px solid black;"');
	 	    html = html.split("<td").join('<td style="border: 1px solid black; padding: 15px;"');

            fs.readFile(signaturefilename, function read(err, signaturefilehtml) {
               if (err) {
                 throw err;
               }
           		
			   $ = cheerio.load(signaturefilehtml);
			   
			   $('a').each(function() {
				   console.log("this.href", this.attribs.href);
				   $(this).attr('href', this.attribs.href  + "?projectleadid="+projectdetails.projectleadid);
			   });
		   
               html = html + $.html();
	       	   console.log("GENERATED HTML",html);
	       	   callback(err, html);
            });

		});
	};

    var transport = nodemailer.createTransport(smtpTransport(options));

	var attachments = [];
	for(var i=0;i<attachmentlinks.length;i++){
		console.log("all_links", attachmentlinks[i])
		
		var ufilename= attachmentlinks[i].split("?")[0].split("/attachment/")[1];
		var nicefilename = ufilename.split("__")[0]+"." + ufilename.split(".")[1]
		var link = {   // use URL as an attachment
	   		filename: nicefilename,
	   		path: attachmentlinks[i]
		}
		attachments.push(link);
	}
	
	
    var data = {
        subject: subject,
        message: content,
        calltoaction_link: calltoaction_link,
        calltoaction_text: calltoaction_text,
		trackerimage: trackerimage,
		attachments: attachments
    };    


    generateEmailMarkup(data, function (err, html) {
		
	var emaildata = {
            from: smtpconfig.from, // sender address
            to: mailto, // comma separated list of receivers
            subject: subject, // Subject line
            html: html,
	    	attachments: attachments
        };

//do this to avoid attaching files to email and jsut use buttons
    emaildata.attachments = [];
		
		console.log("emaildata", emaildata);

        transport.sendMail(emaildata, function (error, response) {
            if (error) {
                console.log(error);
                callback("error", error)
            } else {
                console.log("Message sent: " + response.message + " to " + mailto)
                callback("success", response.message)
            }
        });
    });
};


/* Example Usage

 var email = require("./common/email_manager")
 email.sendEmail("clofusschool3@hotmail.com","testingemail","from clofus", "http://clofus.com/signup","Signup",function(status, detail){
 console.log("email sent", status, detail)
 });

 */


module.exports = {
    sendEmail: email_manager
};
