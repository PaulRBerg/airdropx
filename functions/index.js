const functions = require("firebase-functions");
const firebase = require("firebase-admin");
firebase.initializeApp(functions.config().firebase);
firebase.firestore().settings( { timestampsInSnapshots: true });

const users = require("./users");

module.exports = {
	users: users
};