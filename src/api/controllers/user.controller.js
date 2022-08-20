
const {getUserActivities,getUserNotifications,updateProfile,getTransactions,getDashboard,getStatistics,getAverageWaste
            ,getWasteDistribution,getRecoveryDistribution}=require("../services/user.service");

const {success,error}=require("../helpers/response");

module.exports={
    getUserActivities:(req,res)=>{
        var body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        if(body.from_id==null){
            res.json(erro(400,"from_id is required"));
        }

        getUserActivities(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"));
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getUserNotifications:(req,res)=>{
        var body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        if(body.from_id==null){
            res.json(erro(400,"from_id is required"));
        }

        getUserNotifications(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"));
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    updateProfile:(req,res)=>{
        var body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        if(body.name==null||body.name==""){
            res.json(erro(400,"name is required"));
        }

        if(body.address==null||body.address==""){
            res.json(error(400,"address is required"));
        }

        updateProfile(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"));
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getTransactions:(req,res)=>{
        var body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        if(body.from_id==null){
            res.json(error(400,"from_id is required"));
        }

        getTransactions(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"))
            }else{
                res.json(success(result.code,result.message,result.data))
            }
        })
    },

    getDashboard:(req,res)=>{
        var body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        getDashboard(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"));
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getStatistics:(req,res)=>{
        const body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        getStatistics(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"));
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getAverageWaste:(req,res)=>{
        const body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        if(body.filter==null||body.filter==""){
            res.json(error(400,"filter is required"));
        }

        getAverageWaste(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"))
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getWasteDistribution:(req,res)=>{
        const body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        if(body.filter==null||body.filter==""){
            res.json(error(400,"filter is required"));
        }

        getWasteDistribution(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"))
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    },

    getRecoveryDistribution:(req,res)=>{
        const body=req.body;

        if(body.producer_id==null){
            res.json(error(400,"producer_id is required"));
        }

        if(body.filter==null||body.filter==""){
            res.json(error(400,"filter is required"));
        }

        getRecoveryDistribution(body,function(err,result){
            if(err){
                res.json(error(500,"Database connection error"))
            }else{
                res.json(success(result.code,result.message,result.data));
            }
        })
    }
}