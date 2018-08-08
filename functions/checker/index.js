const functions = require("firebase-functions");
const firebase = require("firebase-admin");

// [START makeUppercase]
// Listens for new messages added to /messages/:documentId/original and creates an
// uppercase version of the message to /messages/:documentId/uppercase
// [START makeUppercaseTrigger]
module.exports = functions.firestore.document("/users/{userId}")
	.onCreate((snap, context) => {
		return true;
		// [END makeUppercaseTrigger]
		// [START makeUppercaseBody]
		// Grab the current value of what was written to the Realtime Database.
		// const original = snap.data().original;
		// console.log("Uppercasing", context.params.documentId, original);
		// const uppercase = original.toUpperCase();
		// You must return a Promise when performing asynchronous tasks inside a Functions such as
		// writing to the Firebase Realtime Database.
		// Setting an 'uppercase' sibling in the Realtime Database returns a Promise.
		// return snap.ref.set({uppercase}, {merge: true});
		// [END makeUppercaseBody]
	});
// [END makeUppercase]
// [END all]