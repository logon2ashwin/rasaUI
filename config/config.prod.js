module.exports = {
    service: {
        host: 'https://analytics.clofus.com',
        port: 9090,
        apiversion: "v1",
	baseurl: "https://analytics.clofus.com"
    },
    database: {
        host: 'localhost',
        port: 27017,
        db: 'clofusanalytics',
        username: '',
        password: ''       
    },
    email: {
        username: "support@clofus.com",
        password: "0182680c955d37f1ba707640aba9b0ed",
        from: "support@clofus.com",
        service: "mailgun",
		host: "smtp.mailgun.org",
		port: 587,
		trackerimage: "/logo_tiny.png"
    }
};
