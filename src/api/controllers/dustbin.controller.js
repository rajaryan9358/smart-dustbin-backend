

const {getAllDustbins,getDustbinDetails,requestNewDustbin,getAllCategories,getDustbinWasteDistribution}=require("../services/dustbin.service");

const {success,error}=require("../helpers/response");

module.exports={
    getAllDustbins:(req,res)=>{
        var params=req.params;

        if(params.producer_id==null){
            return res.json(error(400,"producer_id is required"));
        }

        getAllDustbins(params,function(err,result){
            if(err){
                return res.json(error(500,"Database connection error"));
            }else{
                return res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getDustbinDetails:(req,res)=>{
        var params=req.params;

        if(params.dustbin_id==null){
            return res.json(error(400,"dustbin_id is required"));
        }

        getDustbinDetails(params,function(err,result){
            if(err){
                return res.json(error(500,"Database connection error"));
            }else{
                return res.json(success(result.code,result.message,result.data));
            }
        })
    },

    requestNewDustbin:(req,res)=>{
        var body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        if(body.dustbin_name==null||body.dustbin_name==""){
            res.json(error(400,"dustbin_name is required"));
        }

        if(body.category_id==null){
            res.json(error(400,"category_id is required"));
        }


        requestNewDustbin(body,function(err,result){
            if(err){
                console.log(err.error);
                res.json(error(400,"Database connection error"));
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getAllCategories:(req,res)=>{

        getAllCategories(null,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"));
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getDustbinWasteDistribution:(req,res)=>{
        const body=req.body;

        if(body.dustbin_id==null){
            res.json(error(400,"dustbin_id is required"));
        }

        if(body.filter==null||body.filter==""){
            res.json(error(400,"filter is required"));
        }

        getDustbinWasteDistribution(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"))
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    }
}