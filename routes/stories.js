'use strict';

module.exports = function (express, mongoose) {

    var express = require('express');
    var router = express.Router();
    var gencode = require('../lib/gencode');
    var Ajent = require("../models/ajents").getModel(mongoose);
    var stories = require("../models/stories").getModel(mongoose);
    
    var storiesroutes = {
        getStorieslist : function(req,res){
            var options = {}
            options._id = mongoose.Types.ObjectId(req.query.id);
            Ajent.findOne(options)
            .populate('stories')
            .exec((err,results)=>{
                if(err) res.send(err);
                else res.send(results);
            })
        },
        createStoryToAgent : function(req,res){
            const agentId = req.query.agentid;
            const storydata = new stories(req.body);
            storydata.save((err,result)=>{
                if(err) res.send(err);
                else{
                    const storyid = result._id;
                    Ajent.findOne({_id: agentId})
                    .exec((err,agentdata)=>{
                        if(err) res.send(err);
                        else{
                            agentdata.stories.push(storyid);
                            agentdata.save((err,response)=>{
                                if(err) res.send(err);
                                else {
                                    res.send(response);
                                }
                            })
                        }
                    })
                }
            })
        },
        deleteStory: function(req,res){
            var options = {}
            if(req.query.id){
                options._id = mongoose.Types.ObjectId(req.query.id);
            }
            stories.findOneAndRemove(options)
            .exec((err,results)=>{
                if(err) res.send(err);
                else res.send(results);
            })
        },
        updateStories: function(req,res){
            var options = {}
            options._id = mongoose.Types.ObjectId(req.body._id);
            const data = req.body
            stories.findOneAndUpdate(options,data)
            .exec((err,results)=>{
                if(err) res.send(err);
                else res.send(results);
            })
        },
        getStorybyId : function(req,res){
            const storyid = mongoose.Types.ObjectId(req.query.id);
            stories.findOne({_id:storyid})
            .exec((err,response)=>{
                if(err) res.send(err);
                else res.send(response);
            })
        },
};
   

router.get('/', storiesroutes.getStorieslist);
router.get('/intents', storiesroutes.getStorybyId);
router.post('/', storiesroutes.createStoryToAgent);
router.put('/', storiesroutes.updateStories);
router.delete('/', storiesroutes.deleteStory);

return router;

}