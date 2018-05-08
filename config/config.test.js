module.exports = {
    service: {
        host: 'http://careers.clofus.com',
        port: 7080,
        apiversion: "v1",
	baseurl: "http://careers.clofus.com"
    },
    database: {
        host: 'mongo.clofus.in',
        port: 27017,
        db: 'clofuscareers',
        username: 'clofuscareers',
        password: 'X9uR4R6XYStN9K3m',
        authSource: 'admin',
        replicaset: true,
        replicaSets: {
                        nodes: [{
                                host: "cluster0-shard-00-00-gzbli.mongodb.net",
                                port: "27017"
                        }, {
                                host: "cluster0-shard-00-01-gzbli.mongodb.net",
                                port: "27017"
                        }, {
                                host: "cluster0-shard-00-02-gzbli.mongodb.net",
                                port: "27017"
                        }],
                        options: {
                                ssl: "true",
                                replicaSet: "Cluster0-shard-0",
                                authSource: "admin"
                        }
        }
    },
    email: {
        username: "support@clofus.com",
        password: "0182680c955d37f1ba707640aba9b0ed",
        from: "support@clofus.com",
        service: "mailgun",
	host: "smtp.mailgun.org",
	port: 587,
	trackerimage: "/logo_tiny.png"
    },
	googlemaps:{
		key: "AIzaSyCAZS4vCDwjVZgs-COeAC0YQfJAZv8BQk4"
	}
};
