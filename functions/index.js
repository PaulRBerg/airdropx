const functions = require("firebase-functions");
const firebase = require("firebase-admin");
firebase.initializeApp(functions.config().firebase);
firebase.firestore().settings( { timestampsInSnapshots: true });

const db = firebase.firestore();
const express = require("express");

const app = express();

app.post("/" + functions.config().env.bot_token + "/new", (req, res) => {
	console.log("Testing out the Telegram bot webhook:", req.body);

	if (!req.body.message || !req.body.message.new_chat_members || req.body.message.new_chat_members.length === 0) {
		console.info("Received update from bot webhook, but it's not a new participant notification", req.body);
		return res.status(200).send("Received update from bot webhook, but it's not a new participant notification.\n");
	}

	const user = req.body.message.new_chat_members[0];
	const refId = req.body.message.text;
	if (!user.id) {
		console.warn("User id not defined");
		return res.status(422).send("User id not defined\n");
	}
	if (user.is_bot) {
		console.warn("Bots do not count as invited users");
		return res.status(403).send("Bots do not count as invited users.\n");
	}
	user.id = user.id.toString();
	db.collection("users").doc(user.id).get()
		.then(snapshot => {
			// This prevents double referrals (Sybil attacks)
			if (snapshot.exists) {
				res.status(200).send("User is already in the database.\n");
				return;
			}

			// Insert user otherwise
			// let refPromise = {};
			// if (!ref) {
			// 	console.info("User referral in the query but not in the database");
			// } else {
			// 	refPromise = db.collection("users").doc(ref).set({
			// 		referred: [...ref.referred, ref.referred.length]
			// 	}, {
			// 		merge: true
			// 	})
			// }

			const data = {
				first_name: user.first_name || null,
				referred: [],
				timestamp: firebase.firestore.FieldValue.serverTimestamp()
			};
			const userPromise = db.collection("users").doc(user.id).set(data)
				.then(() => {
					res.status(200).send("User inserted in the database, chieftain.\n");
				});

			return Promise.all([userPromise]);
		})
		.catch((err) => {
			console.error("Error inserting user: ", err);
			res.status(500).send("Error writing document\n");
		});
});

// app.get("/", (req, res) => {
// 	if (!req.query.ref) {
// 		res.status(200).send("Ref not defined, but ervice works ok");
// 	} else {
// 		db.collection("users").doc(req.query.ref).get()
// 			.then(snapshot => {
// 				if (!snapshot.exists) {
// 					console.info("User referral in the query but not in the database");
// 				} else {
// 					const user = snapshot.data();
//
// 					return db.collection("users").doc(req.query.ref).set({
// 						referred: [...user.referred, user.referred.length]
// 					}, {
// 						merge: true
// 					})
// 						.then(() => {
// 							console.info("User referral added to the database");
// 						});
// 				}
//
// 				res.redirect(functions.config().env.bot_group_url);
// 			})
// 			.catch(err => {
// 				console.error("Error inserting referral: ", err);
// 				res.status(500).send("Error writing document");
// 			});
// 	}
// });

exports.users = functions.https.onRequest(app);