module.exports = {
 
    upload: function(req,res,next){
        console.log(req.file);
        if(req.file){
            return res.send({name: req.file.filename});
        }else{
            return res.status(500).send({error: "Upload file failed."})
        }
    },
 
    remove: function(req, res){
        var fs = require("fs");
        var filePath = app.settings.appPath + "/uploads/" + req.params.fileName;
        return fs.unlink(filePath, function(err){
            if(err){
                return res.status(500).send({error: err});
            }else{
                return res.send(200);
            }
        })
    },
 
    removeMultipleFile: function(req, res){
        var fs = require("fs");
        var listFilesToRemove = req.body.listImage;
        console.log(listFilesToRemove);
        _.each(listFilesToRemove, function(fileName){
            var filePath = app.settings.appPath + "/uploads/" + fileName;
            return fs.unlinkSync(filePath);
        })
        return res.send(200);
    }
  
}