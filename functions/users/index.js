const functions = require("firebase-functions");
const firebase = require("firebase-admin");

const db = firebase.firestore();
const express = require("express");
const app = express();

app.get("/" + functions.config().env.api_token, (req, res) => {
	return db.collection("users").where("still_in_group", "==", req.query.still_in_group || true).get().then(snap => {
		if (snap.empty) {
			return res.status(200).send("No users in the database.\n");
		}
		const users = [];
		snap.docs.forEach(user => {
			users.push({
				id: user.id,
				first_name: user.data().first_name,
				joined: user.data().joined
			});
		});

		return res.status(200).json(users);
	}).catch(err => {
		console.error("Error querying for users: ", err);
		res.status(500).send("Error querying for users");
	});
});

app.post("/" + functions.config().env.api_token + "/manage", (req, res) => {

	if (!req.body.message) {
		console.info("Update object is not defined", req.body);
		return res.status(422).send("Update object is not defined");
	}
	console.info("Received body:", req.body);

	const validate = user => {
		if (!user.id) {
			console.warn("User id not defined");
			return [422, "User id is not defined"];
		}
		if (user.is_bot) {
			console.warn("Bots do not count as invited users.");
			return [403, "Bots do not count as invited users."];
		}
		return true;
	};

	if (req.body.message.new_chat_members && req.body.message.new_chat_members.length !== 0) {
		const user = req.body.message.new_chat_members[0];
		const err = validate(user); if (Array.isArray(err)) {
			return res.status(err[0]).send(err[1]);
		}

		user.id = user.id.toString();
		return db.collection("users").doc(user.id).get()
			.then(snap => {
				if (snap.exists) {
					if (snap.data().still_in_group) {
						res.status(200).send("User is already in the database.");
					} else {
						return db.collection("users").doc(user.id).update({
							still_in_group: false,
							updated: firebase.firestore.FieldValue.serverTimestamp()
						})
							.then(snap => {
								console.log("User updated: ", snap);
								res.status(200).send("User is already in the database, and the 'still_in_group' field is now set to true");
							});
					}
				}

				const timestamp = firebase.firestore.FieldValue.serverTimestamp();
				const data = {
					first_name: user.first_name || null,
					still_in_group: true,
					joined: timestamp,
					updated: timestamp
				};
				return db.collection("users").doc(user.id).set(data)
					.then(() => {
						res.status(200).send("User inserted in the database, chieftain.");
					});
			})
			.catch((err) => {
				console.error("Error inserting user: ", err);
				res.status(500).send("Error inserting user");
			});
	}

	if (req.body.message.left_chat_member) {
		const user = req.body.message.left_chat_member;
		const err = validate(user); if (Array.isArray(err)) {
			return res.status(err[0]).send(err[1]);
		}

		user.id = user.id.toString();
		return db.collection("users").doc(user.id).update({
			still_in_group: false,
			updated: firebase.firestore.FieldValue.serverTimestamp()
		})
			.then(snap => {
				console.log("User updated: ", snap);
			})
			.catch((err) => {
				console.error("Error updating user: ", err);
				res.status(500).send("Error updating user\n");
			});
	}

	console.info("Received update from bot webhook, but it's not a new participant notification", req.body);
	return res.status(200).send("Received update from bot webhook, but it's not a new participant notification.\n");
});

module.exports = functions.https.onRequest(app);