const functions = require("firebase-functions");
const firebase = require("firebase-admin");

const db = firebase.firestore();
const express = require("express");
const app = express();

app.get("/" + functions.config().env.bot_token, (req, res) => {
	db.collection("users").where("still_active", "==", true).get().then(snap => {
		if (!snap.exists) {
			return res.status(200).send("No users in the database.\n");
		}
		console.log("snap.data()", snap.data());

		const users = [];
		snap.data().forEach(user => {
			users.push(user);
		});

		return res.status(200).json(users);
	}).catch(err => {
		console.error("Error querying for users: ", err);
		res.status(500).send("Error querying for users");
	})
});

app.post("/" + functions.config().env.bot_token + "/new", (req, res) => {
	if (!req.body.message || !req.body.message.new_chat_members || req.body.message.new_chat_members.length === 0) {
		console.info("Received update from bot webhook, but it's not a new participant notification", req.body);
		return res.status(200).send("Received update from bot webhook, but it's not a new participant notification.\n");
	}

	console.info("Testing out the Telegram bot webhook:", req.body);

	const user = req.body.message.new_chat_members[0];
	if (!user.id) {
		console.warn("User id not defined");
		return res.status(422).send("User id not defined\n");
	}
	if (user.is_bot) {
		console.warn("Bots do not count as invited users");
		return res.status(403).send("Bots do not count as invited users.\n");
	}
	user.id = user.id.toString();
	return db.collection("users").doc(user.id).get()
		.then(snapshot => {
			// This prevents double referrals (Sybil attacks)
			if (snapshot.exists) {
				res.status(200).send("User is already in the database.\n");
				return;
			}

			const data = {
				first_name: user.first_name || null,
				still_active: true,
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

module.exports = functions.https.onRequest(app);