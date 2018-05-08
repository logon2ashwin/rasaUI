module.exports = {
	isemptyObj:function(obj){
		if(typeof obj!='undefined'){
			if(Object.keys(obj).length>0){
				return true;
			}
			else{
				return false;
			}
		}
		else{
			return true;
		}
	},
	isvalidData:function(text){
		if(typeof text !="undefined"){
			if(text !=null){
				if(text.length>0 && text!='null' && text!='undefined'){
					return true;
				}
				else{
					return false;
				}
			}
			else{
				return false;
			}
		}
		else{
			return false;
		}

	}	
}