var config=require('../../config/db');
var db=config.getConnection;
var dbPromise=config.getPromiseConnection;
var jwt = require('jsonwebtoken');
const moment = require('moment');
const { now } = require('moment');


module.exports={
    getAllCategories:(data,callback)=>{

        db(function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                connection.query("SELECT * FROM categories ORDER BY category_name ASC",function(err,results){
                    if(err){
                        callback({code:500,error:err});
                    }else{
                        callback(null,{code:200,message:"Categories list fetched successfully",data:results});
                    }
                })

            }
        })
    },

    bookOrder:(data,callback)=>{
        const consumerId=data.consumer_id;
        const totalDistance=data.total_distance;
        const totalWeight=data.total_weight;
        const totalLocation=data.total_location;
        const totalDustbin=data.total_dustbin;
        const totalCost=data.total_cost;
        const categoriesName=data.categories_name;
        const timeFrom=data.time_from;
        const timeTo=data.time_to;
        const pickupDate=data.pickup_date;
        const pickupStatus=data.pickup_status;
        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        const createdAt=nowTime;
        const updatedAt=nowTime;

        const pickupLocations=data.pickup_locations;

        const dustbinPickupData={
            total_distance:totalDistance,
            total_weight:totalWeight,
            total_location:totalLocation,
            total_dustbin:totalDustbin,
            total_cost:totalCost,
            categories_name:categoriesName,
            time_from:timeFrom,
            time_to:timeTo,
            pickup_date:pickupDate,
            pickup_status:pickupStatus,
            created_at:createdAt,
            updated_at:updatedAt
        }

        dbPromise(function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                try{
                    await connection.beginTransaction();

                    const [dustbin_pickup]=await connection.query("INSERT INTO dustbin_pickups SET ?",dustbinPickupData);

                    const pickupId=dustbin_pickup.insertId;

                    pickupLocations.forEach(pickupLocation => {
                        const pickupLocationData={
                            pickup_id:pickupId,
                            consumer_id:consumerId,
                            producer_id:pickupLocation.producer_id,
                            dustbin_id:pickupLocation.dustbin_id,
                            from_date:pickupLocation.from_date,
                            to_date:pickupLocation.to_date,
                            total_weight:pickupLocation.total_weight,
                            total_cost:pickupLocation.total_cost,
                            pickup_status:0,
                            pickup_at:null,
                            created_at:nowTime,
                            updated_at:nowTime
                        }

                        const [pickup_location]=await connection.query("INSERT INTO pickup_locations SET ?",pickupLocationData);

                        connection.commit();
                        return callback(null,{code:200,message:"Pickup created successfully",data:null});
                    });
                }catch(error){
                    if(connection) await connection.rollback();
                    return callback({code:500,error:error});
                }finally{
                    if(connection) await connection.release();
                }
                
            }
        })
    },

    getOrderDetails:(data,callback)=>{

    },

    getAllOrders:(data,callback)=>{
        const consumerId=data.consumer_id;
        const fromId=data.from_id;
        const maxCount=data.limit;

        db(function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                var sql="";

                if(fromId==0){
                    sql="SELECT * FROM dustbin_pickups WHERE consumer_id="+consumerId+" ORDER BY id DESC LIMIT "+maxCount;
                }else{
                    sql="SELECT * FROM dustbin_pickups WHERE consumer_id="+consumerId+" AND id<"+fromid+" ORDER BY id DESC LIMIT "+maxCount;
                }

                connection.query(sql,function(err,results){
                    if(err){
                        callback({code:500,error:err});
                    }else{
                        callback(null,{code:200,message:"All orders fetched successfully",data:results});
                    }
                })
            }
        })
    }
}