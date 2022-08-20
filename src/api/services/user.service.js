var config=require('../../config/db');
var db=config.getConnection;
var dbPromise=config.getPromiseConnection;
var jwt = require('jsonwebtoken');
const moment = require('moment');
const { now } = require('moment');

module.exports={
    getUserActivities:(data,callback)=>{
        const producerId=data.producer_id;
        const fromId=data.from_id;
        const maxCount=20;

        db(function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                var sql="";
                if(fromId==0){
                    sql="SELECT * FROM producer_activities WHERE producer_id="+producerId+" ORDER BY id DESC LIMIT "+maxCount;
                }else{
                    sql="SELECT * FROM producer_activities WHERE producer_id="+producerId+" AND id<"+fromId +" ORDER BY id DESC LIMIT "+maxCount;
                }
                connection.query(sql,function(err,results){
                    if(err){
                        callback({code:500,error:err});
                    }else{
                        callback(null,{code:200,message:"User activity retrived successfully",data:results});
                    }
                })
            }
        })
    },

    getUserNotifications:(data,callback)=>{
        const producerId=data.producer_id;
        const fromId=data.from_id;
        const maxCount=20;

        db(function(err,connection){
            if(err){
                callback({code:500,error:err})
            }else{
                var sql="";

                if(fromId==0){
                    sql="SELECT * FROM producer_notifications WHERE producer_id="+producerId+" ORDER BY id DESC LIMIT "+maxCount;
                }else{
                    sql="SELECT * FROM producer_notifications WHERE producer_id="+producerId+" AND id<"+fromId +" ORDER BY id DESC LIMIT "+maxCount;
                }

                connection.query(sql,function(err,results){
                    if(err){
                        callback({code:500,error:err});
                    }else{
                        callback(null,{code:200,message:"User notifications retrived successfully",data:results})
                    }
                })
            }
        })
    },

    updateProfile:(data,callback)=>{
        const producerId=data.producer_id;
        const name=data.name;
        const address=data.address;

        const updateData={
            name:name,
            address:address
        }

        db(function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{

                connection.query("UPDATE producer_user SET ? WHERE id="+producerId,updateData,function(err,results){
                    if(err){
                        callback({code:500,error:err})
                    }else{
                        callback(null,{code:200,message:"Producer profile updated successfully",data:null})
                    }
                })

            }
        })
    },

    getTransactions:(data,callback)=>{
        const producerId=data.producer_id;
        const fromId=data.from_id;
        const maxCount=20;

        db(function(err,connection){
            if(err){
                callback({code:500,error:err})
            }else{
                var sql="";
                if(fromId==0){
                    sql="SELECT * FROM transactions WHERE producer_id="+producerId+" ORDER BY created_at DESC LIMIT "+maxCount;
                }else{
                    sql="SELECT * FROM transactions WHERE producer_id="+producerId+" AND id<"+ fromId +" ORDER BY created_at DESC LIMIT "+maxCount;
                }
                connection.query(sql,function(err,results){
                    if(err){
                        callback({code:500,error:err})
                    }else{
                        callback(null,{code:200,message:"Producer transactions fetched successfully",data:results});
                    }
                })
            }
        })
    },

    getDashboard:(data,callback)=>{
        const producerId=data.producer_id;

        dbPromise(async function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{

                const [total_waste]=await connection.query("SELECT COALESCE(sum(total_weight),0) as total_weight FROM pickup_locations WHERE producer_id="+producerId+" AND pickup_status=1");

                const [dustbins] = await connection.query("SELECT * FROM dustbins WHERE producer_id="+producerId);

                var dustbinData=[];
                var dustbinsCurrentWeight=0;
                dustbins.forEach(dustbin => {
                    const singleDustbinData={
                        dustbin_id:dustbin.id,
                        dustbin_name:dustbin.dustbin_name,
                        total_weight:dustbin.current_capacity,
                        total_capacity:dustbin.current_capacity, // use total capacity in db to find percentage
                    }

                    dustbinData.push(singleDustbinData);

                    dustbin.current_capacity=+dustbin.current_capacity;

                    dustbinsCurrentWeight=dustbinsCurrentWeight+dustbin.current_capacity;
                });

                const all_dustbins_weight=total_waste[0].total_weight+dustbinsCurrentWeight;

                const [scheduledPickups]=await connection.query("SELECT dustbins.dustbin_name,dustbin_pickups.pickup_date,pickup_locations.total_weight FROM pickup_locations LEFT JOIN dustbins ON pickup_locations.dustbin_id=dustbins.id LEFT JOIN dustbin_pickups ON pickup_locations.pickup_id=dustbin_pickups.id WHERE pickup_locations.producer_id="+producerId+" AND pickup_locations.pickup_status=0");

                const [dayWiseDistribution]=await connection.query("SELECT COALESCE(sum(dustbin_contents.quantity),0) as quantity,dustbin_contents.dustbin_id,dustbins.dustbin_name,DATE_FORMAT(dustbin_contents.created_at,'%a') as day FROM dustbin_contents LEFT JOIN dustbins ON dustbin_contents.dustbin_id=dustbins.id WHERE dustbin_contents.producer_id="+producerId+" GROUP BY dustbin_contents.dustbin_id,DATE_FORMAT(dustbin_contents.created_at,'%a')");

                const lastMonth=moment().subtract(1,'months').utc().format("YYYY-MM-DD")+" 00:00:00";

                const [monthlyDistribution]=await connection.query("SELECT COALESCE(sum(pickup_locations.total_weight),0) as total_weight, tags.tag_name FROM pickup_locations LEFT JOIN consumer_tags ON consumer_tags.consumer_id=pickup_locations.consumer_id INNER JOIN tags ON tags.id=consumer_tags.tag_id WHERE pickup_locations.producer_id="+producerId+" AND pickup_locations.created_at>='"+lastMonth+"' GROUP BY tags.tag_name");

                const responseData={
                    total_weight:all_dustbins_weight,
                    dustbin_data:dustbinData,
                    pickup_schedules:scheduledPickups,
                    day_wise_distribution:dayWiseDistribution,
                    monthly_distribution:monthlyDistribution
                }

                callback(null,{code:200,message:"Dashboard fetched successfully",data:responseData});

            }
        })
    },

    getStatistics:(data,callback)=>{
        const producerId=data.producer_id;

        dbPromise(async function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                const lastWeek=moment().subtract(7,'days').utc().format("YYYY-MM-DD")+" 00:00:00";

                const [total_waste]=await connection.query("SELECT COALESCE(sum(total_weight),0) as total_weight FROM pickup_locations WHERE producer_id="+producerId+" AND pickup_status=1");

                const [dustbins] = await connection.query("SELECT * FROM dustbins WHERE producer_id="+producerId);

                var dustbinsCurrentWeight=0;
                dustbins.forEach(dustbin => {
                    dustbin.current_capacity=+dustbin.current_capacity;
                    dustbinsCurrentWeight=dustbinsCurrentWeight+dustbin.current_capacity;
                });

                const all_dustbins_weight=total_waste[0].total_weight+dustbinsCurrentWeight;

                const [firstDate]=await connection.query("SELECT created_at FROM dustbin_contents WHERE producer_id="+producerId+" ORDER BY created_at ASC LIMIT 1");

                var given = moment(firstDate[0].created_at, "YYYY-MM-DD hh:mm:ss");
                var current = moment().startOf('day');

                const total_days=parseInt(moment.duration(current.diff(given)).asDays());

                var daily_average_weight=0;
                if(total_days!=null&&total_days!=0){
                    daily_average_weight=all_dustbins_weight/total_days;
                }
                 
                const [highest_daily_weight]=await connection.query("SELECT max(dayWiseMax.highest_daily_weight) AS highest_daily_weight FROM (SELECT COALESCE(sum(quantity),0) as highest_daily_weight FROM dustbin_contents WHERE producer_id="+producerId+" GROUP BY DATE_FORMAT(created_at,'%Y-%m-%d')) AS dayWiseMax")

                const [last_week_waste]=await connection.query("SELECT COALESCE(sum(quantity),0) as total_quantity FROM dustbin_contents WHERE producer_id="+producerId+" AND created_at>='"+lastWeek+"'");

                const startDate=lastWeek;
                const endDate=moment().format("YYYY-MM-DD hh:mm:ss");;

                const [average_waste]=await connection.query("SELECT COALESCE(sum(quantity),0)/count(DATE_FORMAT(created_at,'%Y-%m-%d')) as quantity,DATE_FORMAT(created_at,'%a') as day FROM dustbin_contents WHERE producer_id="+producerId+" AND created_at>='"+startDate+"' AND created_at<='"+endDate+"' GROUP BY DATE_FORMAT(created_at,'%a')");

                const [wasteDistribution]=await connection.query("SELECT COALESCE(sum(dustbin_contents.quantity),0) as quantity,dustbin_contents.dustbin_id,dustbins.dustbin_name,DATE_FORMAT(dustbin_contents.created_at,'%d/%m') as day FROM dustbin_contents LEFT JOIN dustbins ON dustbin_contents.dustbin_id=dustbins.id WHERE dustbin_contents.producer_id="+producerId+" AND dustbin_contents.created_at>='"+startDate+"' AND dustbin_contents.created_at<='"+endDate+"' GROUP BY dustbin_contents.dustbin_id,DATE_FORMAT(dustbin_contents.created_at,'%d/%m')");

                const [recoveryDistribution]=await connection.query("SELECT COALESCE(sum(pickup_locations.total_weight),0) as total_weight, tags.tag_name,DATE_FORMAT(created_at,'%a') as day FROM pickup_locations LEFT JOIN consumer_tags ON consumer_tags.consumer_id=pickup_locations.consumer_id INNER JOIN tags ON tags.id=consumer_tags.tag_id WHERE pickup_locations.producer_id="+producerId+" AND pickup_locations.created_at>='"+startDate+"' AND pickup_locations.created_at<='"+endDate+"' GROUP BY tags.tag_name,DATE_FORMAT(created_at,'%a')");

                const responseData={
                    daily_average_weight:daily_average_weight,
                    highest_daily_waste:highest_daily_weight[0].highest_daily_weight,
                    last_week_waste:last_week_waste[0].total_quantity,
                    average_waste:average_waste,
                    waste_distribution:wasteDistribution,
                    recovery_distribution:recoveryDistribution
                }

                callback(null,{code:200,message:"Statistics fetched successfully",data:responseData});
            }
        })
    },

    getAverageWaste:(data,callback)=>{
        const producerId=data.producer_id;
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

        //option to select date range need to be implemented later on

        dbPromise(async function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                const [average_waste]=await connection.query("SELECT COALESCE(sum(quantity),0)/count(DATE_FORMAT(created_at,'%Y-%m-%d')) as quantity,DATE_FORMAT(created_at,'%a') as day FROM dustbin_contents WHERE producer_id="+producerId+" AND created_at>='"+startDate+"' AND created_at<='"+endDate+"' GROUP BY DATE_FORMAT(created_at,'%a')");

                callback(null,{code:200,message:"Average waste fetched successfully",data:average_waste});
            }
        })
    },

    getWasteDistribution:(data,callback)=>{
        const producerId=data.producer_id;
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

        //option to select date range need to be implemented later on

        dbPromise(async function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                const [wasteDistribution]=await connection.query("SELECT COALESCE(sum(dustbin_contents.quantity),0) as quantity,dustbin_contents.dustbin_id,dustbins.dustbin_name,DATE_FORMAT(dustbin_contents.created_at,'%d/%m') as day FROM dustbin_contents LEFT JOIN dustbins ON dustbin_contents.dustbin_id=dustbins.id WHERE dustbin_contents.producer_id="+producerId+" AND dustbin_contents.created_at>='"+startDate+"' AND dustbin_contents.created_at<='"+endDate+"' GROUP BY dustbin_contents.dustbin_id,DATE_FORMAT(dustbin_contents.created_at,'%d/%m')");

                callback(null,{code:200,message:"Waste distribution fetched successfully",data:wasteDistribution});
            }
        })
    },

    getRecoveryDistribution:(data,callback)=>{
        const producerId=data.producer_id;
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

        //option to select date range need to be implemented later on

        dbPromise(async function(err,connection){
            if(err){
                callback({code:500,error:err});
            }else{
                const [recoveryDistribution]=await connection.query("SELECT COALESCE(sum(pickup_locations.total_weight),0) as total_weight, tags.tag_name,DATE_FORMAT(created_at,'%a') as day FROM pickup_locations LEFT JOIN consumer_tags ON consumer_tags.consumer_id=pickup_locations.consumer_id INNER JOIN tags ON tags.id=consumer_tags.tag_id WHERE pickup_locations.producer_id="+producerId+" AND pickup_locations.created_at>='"+startDate+"' AND pickup_locations.created_at<='"+endDate+"' GROUP BY tags.tag_name,DATE_FORMAT(created_at,'%a')");

                callback(null,{code:200,message:"Recovery distribution fetched successfully",data:recoveryDistribution});
            }
        })
    }
}