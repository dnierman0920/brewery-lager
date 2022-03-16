// Import Dependencies
const express = require('express')
const Brewery = require('../models/brewery')
const Beer = require('../models/beer')
const fetchBreweryData = require('../utils/fetchApi')

// Create router
const router = express.Router()

// Router Middleware
// Authorization middleware
// If you have some resources that should be accessible to everyone regardless of loggedIn status, this middleware can be moved, commented out, or deleted. 
router.use((req, res, next) => {
	// checking the loggedIn boolean of our session
	if (req.session.loggedIn) {
		// if they're logged in, go to the next thing(thats the controller)
		next()
	} else {
		// if they're not logged in, send them to the login page
		res.redirect('/auth/login')
	}
})
/////////////////////////////////////
// Routes
//////////////////////////////////////

// INDEX/LIST BUCKETLIST(shows only the user's breweries) - DONE FOR NOW
router.get('/bucketlist', (req, res) => {
    // destructure user info from req.session
    const { username, userId, loggedIn } = req.session
    Brewery.find({ $and: [{owner: userId}, {visited:false}]})
		.then(breweries => {
			res.render('brewery/bucketlist', {breweries, username, loggedIn })
		})
		.catch(error => {
			res.redirect(`/error?error=${error}`)
		})
})
// INDEX/LIST VISITEDLIST (shows only the user's breweries) - DONE FOR NOW
router.get('/visitedlist', (req, res) => {
    const { username, userId, loggedIn } = req.session
	Brewery.find({ $and: [{owner: userId}, {visited:true}]})
		.then(breweries => {
			res.render('brewery/visitedlist', {breweries, username, loggedIn })
		})
		.catch(error => {
			res.redirect(`/error?error=${error}`)
		})
})

// SEARCH FORM FOR BREWERY  (Allows a user to seach for a brewery and then add it to bucketlist)
router.get('/search', (req, res) => {
	const { username, userId, loggedIn } = req.session
	res.render('brewery/search', { username, loggedIn })
})

// SEARCH RESULTS
router.post('/searchResults', async (req, res) => {
	const { username, userId, loggedIn } = req.session // IS THIS NEEDED ON ALL TO PASS THE SESSION INFO TO LAYOUT???????
	const searchMethod = req.body.searchMethod
	const input = req.body.input
	const searchResults = await fetchBreweryData(searchMethod, input)
		console.log('Search Results', searchResults) // this is returning empty
		res.send(searchResults)
})

// create -> POST route that actually calls the db and makes a new document
router.post('/', (req, res) => {
	req.body.ready = req.body.ready === 'on' ? true : false

	req.body.owner = req.session.userId
	Example.create(req.body)
		.then(example => {
			console.log('this was returned from create', example)
			res.redirect('/examples')
		})
		.catch(error => {
			res.redirect(`/error?error=${error}`)
		})
})

// edit route -> GET that takes us to the edit form view
router.get('/:id/edit', (req, res) => {
	// we need to get the id
	const exampleId = req.params.id
	Example.findById(exampleId)
		.then(example => {
			res.render('examples/edit', { example })
		})
		.catch((error) => {
			res.redirect(`/error?error=${error}`)
		})
})

// update route
router.put('/:id', (req, res) => {
	const exampleId = req.params.id
	req.body.ready = req.body.ready === 'on' ? true : false

	Example.findByIdAndUpdate(exampleId, req.body, { new: true })
		.then(example => {
			res.redirect(`/examples/${example.id}`)
		})
		.catch((error) => {
			res.redirect(`/error?error=${error}`)
		})
})

// show route
router.get('/:id', (req, res) => {
	const breweryId = req.params.id
	Brewery.findById(breweryId)
		.then(brewery => {
            const {username, loggedIn, userId} = req.session
			res.render('brewery/showBrewery', { brewery, username, loggedIn, userId })
		})
		.catch((error) => {
			res.redirect(`/error?error=${error}`)
		})
})

// delete route
router.delete('/:id', (req, res) => {
	const exampleId = req.params.id
	Example.findByIdAndRemove(exampleId)
		.then(example => {
			res.redirect('/examples')
		})
		.catch(error => {
			res.redirect(`/error?error=${error}`)
		})
})

// Export the Router
module.exports = router