var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/User.js');
var Task = require('../models/Task.js');

router.get('/', function(req, res, next) {
	User.find(function(err, users){
		if(err) return next(err);
		res.json(users);
	});
});

router.get('/findMany', function(req, res, next){

	var ids = [];

	for(key in req.query){
		ids.push(req.query[key]);
	}

	User.find({
		'_id': { $in: ids }
	}, function(err, users){
		if(err) return next(err);
		res.json(users);
	});
});

router.post('/addProjectToSet/:userId/:projectId', function(req, res, next){
	//only add the project if it doesn't already exist
	User.findById(req.params.userId, function(err, get){
		if(get.projects.indexOf(req.params.projectId) != -1){
			res.json(get);
		} else {
			User.findByIdAndUpdate(
				{_id: req.params.userId},
				{$push: {projects: req.params.projectId}},
				{safe: true, upsert: true},
				function(err, post) {
					if(err) return next(err);
					res.json(post);
				}
				);
		}
	});
});

router.post('/addTaskToSet/:userId/:taskId', function(req, res, next){
	//only add the task if it doesn't already exist
	User.findById(req.params.userId, function(err, get){
		if(get.tasks.indexOf(req.params.taskId) != -1){
			res.json(get);
		} else {
			User.findByIdAndUpdate(
				{_id: req.params.userId},
				{$push: {tasks: req.params.taskId}},
				{safe: true, upsert: true},
				function(err, post) {
					if(err) return next(err);
					res.json(post);
				}
				);
		}
	});
});

router.delete('/removeProject/:userId/:projectId', function(req, res, next){
	User.findByIdAndUpdate(
		{_id: req.params.userId},
		{$pull: {projects: req.params.projectId}},
		{safe: true, upsert: true},
		function(err, del) {
			if(err) return next(err);
			res.json(del);
		}
		);
});

router.delete('/removeTask/:userId/:taskId', function(req, res, next){
	User.findByIdAndUpdate(
		{_id: req.params.userId},
		{$pull: {tasks: req.params.taskId}},
		{safe: true, upsert: true},
		function(err, del) {
			if(err) return next(err);
			res.json(del);
		}
		);
});

router.delete('/removeProjectFromAllUsers/:projectId', function(req, res, next){
	User.update(
		{},
		{$pull: {projects: req.params.projectId}},
		{multi: true},
		function(err, del){
			if(err) return next(err);
			res.json(del);
		}
		)
});

router.delete('/removeTaskTreeFromAllUsers/:rootTaskId', function(req, res, next){
	//puts the traversed nodes in the children array and calls the callback function when reaches a leaf
	function dfs(nodeId){
		Task.findById(nodeId, function(err, task){
			Task.find({
				'_id': { $in: task.subTasks }
			}).lean().exec(function(err, subTasks){
				for(var i in subTasks){
					dfs(subTasks[i]._id);
				}
			});
		});
		User.update(
			{},
			{$pull: {tasks: nodeId}},
			{multi: true},
			function(err, del){
				if(err) return next(err);
			}
			);
	}

	dfs(req.params.rootTaskId);

	//hopefully half a second will be enough to parse all the task tree
	setTimeout(function(){
		res.sendStatus(200);
	}, 500)
});

router.delete('/removeProjectTaskTreeFromAllUsers/:projectId', function(req, res, next){
	Task.find({'project': req.params.projectId}, function(err, tasks){
		var ids = tasks.map(function(x){return x._id});
		User.update(
			{},
			{$pull: {tasks: {$in: ids}}},
			{multi: true},
			function(err, del){
				if(err) return next(err);
				res.json(del);
			}
			);
	});
});

router.get('/:id', function(req, res, next) {
	User.findById(req.params.id, function(err, get){
		if(err) return next(err);
		res.json(get);
	});
});

router.post('/', function(req, res, next) {
	User.create(req.body, function(err, post){
		if(err) return next(err);
		res.json(post);
	});
});

router.put('/:id', function(req, res, next){
	User.findByIdAndUpdate(req.params.id, req.body, function(err, put){
		if(err) return next(err);
		res.json(put);
	});
});

router.delete('/:id', function(req, res, next){
	User.findByIdAndRemove(req.params.id, function(err, del){
		if(err) return next(err);
		res.json(del);
	});
});

module.exports = router;
