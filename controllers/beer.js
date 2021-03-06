// Import Dependencies
const express = require('express')
const Brewery = require('../models/brewery')
const Beer = require('../models/beer')
const fetchBreweries = require('../utils/fetchBreweries')

// Moments helps convert dates into correct format
// (Mongoose iso date format is extensive and not always needed)
const moment = require('moment')

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

// INDEX OF BEERS TASTED (shows only the user's beers)
router.get('/index', (req, res) => {
    // destructure user info from req.session
    const { username, userId, loggedIn } = req.session
	const promiseList = []
	const beersWithInfo = []
	Beer.find({ owner: userId })
		.populate('brewery')
		.then (beers => {
			for (i in beers) {
				const promise = Promise.resolve(fetchBreweries.byId(beers[i].brewery.open_brewery_db_id))
					.then(brewery => {
						// create a DEEP copy
						beer = JSON.parse(JSON.stringify(beers[i]))
						beer.brewery = brewery
						return beer
					})
				promiseList.push(promise)
			}
			Promise.all(promiseList)
			.then( values => {
				beers = values
				console.log('beers: ', beers)
				console.log()
				res.render('beer/index', { beers , username, loggedIn })
			})
		})	
		.catch(error => {
			res.redirect(`/error?error=${error}`)
				})
})

// CREATE BEER TASTING - FORM (renders the form needed to submit a new beer tasting)
router.get('/:breweryid/create', (req, res) => {
	const { username, userId, loggedIn } = req.session
	const breweryId = req.params.breweryid
	Brewery.findById(breweryId)
		.then(brewery => {
			res.render('beer/create', {brewery,userId, username, loggedIn })
		})
		.catch(error=>{
			console.log('error fetching brewering', error)
		})
	})

// CREATE BEER TASTING - ACTION (creates a beer tasting record)
router.post('/create', (req, res) => {
	const newBeer = req.body
	console.log(newBeer)
	Beer.create(newBeer)
		.then(beer => {
			res.redirect(`./${beer.id}`)
		})
		.catch(error => {
			res.redirect(`/error?error=${error}`)
		})
})

// EDIT BEER TASTING - FORM (renders the form needed to submit edits to a beer tasting record)
router.get('/:id/edit', (req, res) => {
	const { username, userId, loggedIn } = req.session
	const beerId = req.params.id
	Beer.findById(beerId)
		.then(beer => {
			res.render('beer/edit', { beer, username, userId, loggedIn })
		})
		.catch((error) => {
			res.redirect(`/error?error=${error}`)
		})
})

// UPDATE BEER DETAILS (updates details about beer)
router.put('/:id', (req, res) => {
	const beerId = req.params.id
	Beer.findByIdAndUpdate(beerId, req.body, { new: true })
		.then(updatedBeer => {
			res.redirect(`/beer/${updatedBeer.id}`)
		})
		.catch((error) => {
			res.redirect(`/error?error=${error}`)
		})
})

// SHOW BEER DETAILS (show details about a particular beer)
router.get('/:id', (req, res) => {
	const {username, loggedIn, userId} = req.session
	const beerId = req.params.id
	Beer.findById(beerId)
		.populate('brewery')
		.then(beer => {
			console.log('BEER: ', beer)
			fetchBreweries.byId(beer.brewery.open_brewery_db_id)
					.then(brewery => {
						beer.date_tasted = moment(beer.date_tasted).format("MMM Do, YYYY")
						// create a DEEP copy
						beer = JSON.parse(JSON.stringify(beer))
						beer.breweryInfo = brewery
						console.log('BEER: ', beer)
						res.render('beer/showDetails', { beer, username, loggedIn, userId })
					})
		})
		.catch((error) => {
			res.redirect(`/error?error=${error}`)
		})
})

// DELETE BEER TASTING (delete beer tasting and return to brewery)
router.delete('/:id', (req, res) => {
	const beerId = req.params.id
	console.log('removing beer with id: ', beerId )
	Beer.findByIdAndRemove(beerId)
		.then(removedBeer => {
			console.log('brewery ID to reroute to: ', removedBeer.brewery)
			const brewery = removedBeer.brewery
			res.redirect(`/brewery/${brewery}`)
		})
		.catch(error => {
			res.redirect(`/error?error=${error}`)
		})
})

// Export the Router
module.exports = router
