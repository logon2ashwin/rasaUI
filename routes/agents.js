'use strict';

module.exports = function (express, mongoose) {

    var express = require('express');
    var router = express.Router();
    var gencode = require('../lib/gencode');
    var Ajent = require("../models/ajents").getModel(mongoose);

    var ajentroutes = {

        getapplicant: function (req, res) {
            var options = {};
            if (req.query.id) {
                options._id = mongoose.Types.ObjectId(req.query.id);
            }
            applicant.find(options)
                .populate('answers.questionid')
                .exec(function (err, result) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        res.send(result);
                    }
                })
        },

        createAgent: function (req, res) {
            var data  = req.body;
            var newAgent = new Ajent(data);
            newAgent.save((err, result) =>{
                if (err) {
                    console.log(err, 'errrr');
                    res.send(err);
                } else {
                    res.send(result);
                }
            })

        },
        getAgent: function(req,res){
            var options = {}
            if(req.query.id){
                options._id = mongoose.Types.ObjectId(req.query.id);
            }
            Ajent.find(options)
            .exec((err,results)=>{
                if(err) res.send(err);
                else res.send(results);
            })
        },
        updateAgent: function(req,res){
            var options = {}
            if(req.body._id){
                options._id = mongoose.Types.ObjectId(req.body._id);
            }
            Ajent.findOneAndUpdate(options,req.body)
            .exec((err,results)=>{
                if(err) res.send(err);
                else res.send(results);
            })
        },
        deleteAgent: function(req,res){
            var options = {}
            if(req.query.id){
                options._id = mongoose.Types.ObjectId(req.query.id);
            }
            Ajent.findOneAndRemove(options)
            .exec((err,results)=>{
                if(err) res.send(err);
                else res.send(results);
            })
        }
    };


    router.post('/', ajentroutes.createAgent);
    router.put('/', ajentroutes.updateAgent);
    router.get('/', ajentroutes.getAgent);
    router.delete('/',ajentroutes.deleteAgent);


    return router;

}