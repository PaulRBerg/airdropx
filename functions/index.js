const firebase = require("firebase-admin");
firebase.initializeApp(functions.config().firebase);
firebase.firestore().settings( { timestampsInSnapshots: true });

const checker = require("./checker");
const users = require("./users");

module.exports = {
	checker: checker,
	users: users
}