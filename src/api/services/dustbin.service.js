var config=require('../../config/db');
var db=config.getConnection;
var dbPromise=config.getPromiseConnection;
var jwt = require('jsonwebtoken');
const moment = require('moment');
const { now } = require('moment');

module.exports={
    getAllDustbins:(data,callback)=>{
        var producerId=data.producer_id;

        db(function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{
                connection.query("SELECT * FROM dustbins WHERE producer_id="+producerId,function(err,results){
                    if(err){
                        return callback({code:500,error:err});
                    }else{
                        return callback(null,{code:200,message:"All dustbin fetched successfully",data:results});
                    }
                })
            }
        })
    },

    getDustbinDetails:(data,callback)=>{
        var dustbinId=data.dustbin_id;

        dbPromise(async function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{

                const lastWeek=moment().subtract(7,'days').utc().format("YYYY-MM-DD")+" 00:00:00";
                
                const [dustbin]=await connection.query("SELECT dustbins.*,categories.category_name,categories.category_image FROM dustbins LEFT JOIN categories ON dustbins.category_id=categories.id  WHERE dustbins.id="+dustbinId);
                const producerId=dustbin[0].producer_id;

                const [total_waste]=await connection.query("SELECT COALESCE(sum(total_weight),0) as total_weight FROM pickup_locations WHERE producer_id="+producerId+" AND dustbin_id="+dustbinId+" AND pickup_status=1");

                const [dustbins] = await connection.query("SELECT * FROM dustbins WHERE producer_id="+producerId+" AND id="+dustbinId);
                var dustbinc=dustbins[0];
                var dustbinsCurrentWeight=0;

                dustbinc.current_capacity=+dustbinc.current_capacity;
                dustbinsCurrentWeight=dustbinsCurrentWeight+dustbinc.current_capacity;

                const dustbin_weight=total_waste[0].total_weight+dustbinsCurrentWeight;

                const [firstDate]=await connection.query("SELECT created_at FROM dustbin_contents WHERE producer_id="+producerId+" AND dustbin_id="+dustbinId+" ORDER BY created_at ASC LIMIT 1");

                var given = moment(firstDate[0].created_at, "YYYY-MM-DD hh:mm:ss");
                var current = moment().startOf('day');

                const total_days=parseInt(moment.duration(current.diff(given)).asDays());

                var daily_average_weight=0;
                if(total_days!=null&&total_days!=0){
                    daily_average_weight=dustbin_weight/total_days;
                }
                 
                const [highest_daily_weight]=await connection.query("SELECT max(dayWiseMax.highest_daily_weight) AS highest_daily_weight FROM (SELECT COALESCE(sum(quantity),0) as highest_daily_weight FROM dustbin_contents WHERE producer_id="+producerId+" AND dustbin_id="+dustbinId+" GROUP BY DATE_FORMAT(created_at,'%Y-%m-%d')) AS dayWiseMax")

                const [last_week_waste]=await connection.query("SELECT COALESCE(sum(quantity),0) as total_quantity FROM dustbin_contents WHERE producer_id="+producerId+" AND dustbin_id="+dustbinId+" AND created_at>='"+lastWeek+"'");

                const startDate=lastWeek;
                const endDate=moment().format("YYYY-MM-DD hh:mm:ss");;
               
                const [wasteDistribution]=await connection.query("SELECT COALESCE(sum(dustbin_contents.quantity),0) as quantity,dustbin_contents.dustbin_id,dustbins.dustbin_name,DATE_FORMAT(dustbin_contents.created_at,'%d/%m') as day FROM dustbin_contents LEFT JOIN dustbins ON dustbin_contents.dustbin_id=dustbins.id WHERE dustbin_contents.producer_id="+producerId+" AND dustbin_contents.dustbin_id="+dustbinId+" AND dustbin_contents.created_at>='"+startDate+"' AND dustbin_contents.created_at<='"+endDate+"' GROUP BY dustbin_contents.dustbin_id,DATE_FORMAT(dustbin_contents.created_at,'%d/%m')");


                var responseData={
                    dustbin_weight:dustbin_weight,
                    daily_average_weight:daily_average_weight,
                    highest_daily_weight:highest_daily_weight[0].highest_daily_weight,
                    last_week_waste:last_week_waste[0].total_quantity,
                    dustbin:dustbin,
                    distribution:wasteDistribution
                }

                return callback(null,{code:200,message:"Dustbin details fetched successfully",data:responseData});
            }
        })

    },

    requestNewDustbin:(data,callback)=>{
        const producerId=data.producer_id;
        const dustbinName=data.dustbin_name;
        const totalCapacity=0;
        const dustbinStatus=1;
        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        const categoryId=data.category_id;

        const dustbinRaw={
            producer_id:producerId,
            dustbin_name:dustbinName,
            total_capacity:totalCapacity,
            category_id:categoryId,
            current_capacity:0,
            dustbin_status:dustbinStatus,
            created_at:nowTime,
            updated_at:nowTime
        }

        console.log(dustbinRaw);

        dbPromise(async function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                try{
                    await connection.beginTransaction();
                    const [dustbin] =await connection.query("INSERT INTO dustbins SET ?",dustbinRaw);
                    console.log(dustbin);

                    connection.commit();
                    return callback(null,{code:200,message:"Dustbin created successfully",data:null});
                }catch(error){
                    if(connection) await connection.rollback();
                    return callback({code:500,error:error});
                }finally{
                    if(connection) await connection.release();
                }
            }
        })
    },

    getAllCategories:(data,callback)=>{

        db(function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{
             connection.query("SELECT * FROM categories ORDER BY id",function(err,results){
                if(err){
                    callback({code:500,error:err});
                }else{
                    return callback(null,{code:200,message:"Categories list fetched successfully",data:results});
                }
             });
            }
        })
    },

    addDustbinData:(data,callback)=>{
        const dustbinId=data.dustbin_id;
        const wasteWeight=data.waste_weight;
        const dustbinDepth=data.dustbin_depth;
        const weeklyPrediction=data.weekly_prediction;

        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        dbPromise(async function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                try{
                    await connection.beginTransaction();
                    const [dustbin]=await connection.query("SELECT * FROM dustbins WHERE id="+dustbinId);
                    const producerId=dustbin.producer_id;
                    const categoryId=dustbin.category_id;
                    const currentCapacity=dustbin.current_capacity;
                    const currentDepth=dustbin.current_depth;
    
                    const dustbinContentData={
                        producer_id:producerId,
                        dustbin_id:dustbinId,
                        quantity:wasteWeight,
                        closing_quantity:wasteWeight+currentCapacity,
                        depth:dustbinDepth,
                        closing_depth:dustbinDepth+currentDepth,
                        created_at:nowTime
                    }
    
                    const [dustbinContent]=await connection.query("INSERT INTO dustbin_contents SET ?",dustbinContentData);
    
                    weeklyPrediction.forEach(async dayWisePrediction => {
                        const predictedDate=dayWisePrediction.date;
                        const predictedWeight=dayWisePrediction.predicted_weight;
                        const predictedDepth=dayWisePrediction.predicted_depth;
    
                        const insertData=[predictedDate.dustbinId,predictedDate,dustbinId,categoryId,predictedWeight,predictedDepth,nowTime,nowTime];
                        const updateData={
                            predicted_weight:predictedWeight,
                            predicted_depth:predictedDepth,
                            updated_at:nowTime
                        }
                        const [dustbin_prediction]=await connection.query("INSERT INTO dustbin_predictions(id,date,dustbin_id,category_id,predicted_weight,predicted_depth,created_at,updated_at) VALUES ? ON DUPLICATE KEY UPDATE ?",[insertData],updateData);
                    });
                    connection.commit();
                    return callback(null,{code:200,message:"Waste data updated successfully",data:null});
                }catch(error){
                    if(connection) await connection.rollback();
                    return callback({code:500,error:error});
                }finally{
                    if(connection) await connection.release();
                }
            }
        })
    },

    getDustbinWasteDistribution:(data,callback)=>{
        const dustbinId=data.dustbin_id;
        const filter=data.filter;

        var startDate="";
        var endDate="";

        if(filter=="LAST-WEEK"){
            startDate=moment().subtract(1, 'weeks').startOf('isoWeek').utc().format("YYYY-MM-DD hh:mm:ss");
            endDate=moment().subtract(1, 'weeks').endOf('isoWeek').utc().format("YYYY-MM-DD hh:mm:ss");
        }else if(filter=="THIS-MONTH"){
            startDate=moment().startOf('month').utc().format("YYYY-MM-DD hh:mm:ss");
            endDate=moment().endOf('month').utc().format("YYYY-MM-DD hh:mm:ss");
        }else if(filter=="LAST-MONTH"){
            startDate=moment().subtract(1, 'month').startOf('month').utc().format("YYYY-MM-DD hh:mm:ss");
            endDate=moment().subtract(1, 'month').endOf('month').utc().format("YYYY-MM-DD hh:mm:ss");
        }else if(filter=="LAST-SIX-MONTH"){
            startDate=moment().subtract(6, 'month').startOf('month').utc().format("YYYY-MM-DD hh:mm:ss");
            endDate=moment().endOf('month').utc().format("YYYY-MM-DD hh:mm:ss");
        }else if(filter=="LAST-YEAR"){
            startDate=moment().subtract(1, 'year').startOf('year').utc().format("YYYY-MM-DD hh:mm:ss");
            endDate=moment().subtract(1,'year').endOf('year').utc().format("YYYY-MM-DD hh:mm:ss");
        }

        dbPromise(async function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{

                const [dustbins] = await connection.query("SELECT * FROM dustbins WHERE id="+dustbinId);
                const dustbin=dustbins[0];
                const producerId=dustbin.producer_id;
               
                const [wasteDistribution]=await connection.query("SELECT COALESCE(sum(dustbin_contents.quantity),0) as quantity,dustbin_contents.dustbin_id,dustbins.dustbin_name,DATE_FORMAT(dustbin_contents.created_at,'%d/%m') as day FROM dustbin_contents LEFT JOIN dustbins ON dustbin_contents.dustbin_id=dustbins.id WHERE dustbin_contents.producer_id="+producerId+" AND dustbin_contents.dustbin_id="+dustbinId+" AND dustbin_contents.created_at>='"+startDate+"' AND dustbin_contents.created_at<='"+endDate+"' GROUP BY dustbin_contents.dustbin_id,DATE_FORMAT(dustbin_contents.created_at,'%d/%m')");

                callback(null,{code:200,message:"Dustbin waste distribution fetched successfully",data:wasteDistribution});
            }
        })
    }

}