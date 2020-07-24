const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { DocumentStore } = require('ravendb');

const jsonP = bodyParser.json();

app.listen(3000, () => {
	console.log('Server running on port 3000');
});

const store = new DocumentStore('http://localhost:8080', 'test');
store.conventions.findCollectionNameForObjectLiteral = (entity) =>
	entity['collection'];
store.initialize();

const session = store.openSession();

app.post('/users', jsonP, async (req, res) => {
	const user = { ...req.body, collection: 'users' };
	await session.store(user);
	await session.saveChanges();
	res.json(user);
});

app.get('/users', async (req, res) => {
	res.json(await session.query({ collection: 'users' }).all());
});

app.put('/users/:id', jsonP, async (req, res) => {
	const usr = await session.load('users/' + req.params.id);
	if (!usr) {
		res.status(404).send('not found');
		return;
	}

	// update direct
	usr.name = req.body.name;
	usr.email = req.body.email;
	usr.password = req.body.password;

	await session.saveChanges();
	res.json(usr);
});

app.get('/users/:id', async (req, res) => {
	res.json(await session.load('users/' + req.params.id));
});

app.delete('/users/:id', async (req, res) => {
	const usr = await session.load('users/' + req.params.id);
	if (!usr) {
		res.status(404).send('not found');
		return;
	}

	await session.delete(usr);
	await session.saveChanges();
	res.send('deleted');
});
