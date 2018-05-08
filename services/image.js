module.exports = {

    upload: function(req,res,next){
        console.log(req.file);
        if(req.file){
            return res.send({name: req.file.filename});
        }else{
            return res.status(500).send({error: "Upload image failed."})
        }
    }

  
}