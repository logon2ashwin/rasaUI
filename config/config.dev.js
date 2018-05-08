module.exports = {
    service: {
        host: 'http://localhost',
        port: 9090,
        apiversion: "v1",
	    baseurl: "http://localhost"
    },
    database: {
        host: 'localhost',
        port: 27017,
        db: 'chatbot',
        username: '',
        password: ''       
	},
    email: {
        username: "",
        password: "",
        from: "",
        service: "",
	host: "",
	port: 587,
	trackerimage: "/logo_tiny.png"
    },
	googlemaps:{
		key: "AIzaSyCAZS4vCDwjVZgs-COeAC0YQfJAZv8BQk4"
    },
    aws: {
		url: "",
		mediareadurl: "",
		Bucket: "",
		AccessKey: '',
		SecretAccessKey: '',
		Region: 'us-east-1',
		category: {
			review: "",
			beautyboard: "",
			profile: "",
			portfolio: "",
			story: "",
			videos: ""
		},
		Email: {
			sesUser: "",
			smtpUsername: "",
			smtpPassword: "",
			Region: ''
		}
	}
};
