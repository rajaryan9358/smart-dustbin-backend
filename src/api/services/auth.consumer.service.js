var config=require('../../config/db');
var db=config.getConnection;
var dbPromise=config.getPromiseConnection;
var jwt = require('jsonwebtoken');
const moment = require('moment');
const { now } = require('moment');

module.exports={
    sendOtp:(data,callback)=>{
        var phone =data.phone;
        const otp=Math.floor(Math.random()*(9999-1000+1)+1000);
        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        db(function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{
                connection.query("SELECT * FROM consumer_user WHERE consumer_phone="+phone,function(err,results){
                    if(err){
                        return callback({code:500,error:err});
                    }else{
                        var newOtpSql="";
                        const expiryTime=moment().add(5,'m').utc().format("YYYY-MM-DD HH:mm:ss");
                        if(results.length>0){
                            var user=results[0];
                            var otpExpiry=user.otp_expiry;
                            if(otpExpiry>nowTime){
                                otp=user.otp;
                            }else{
                                newOtpSql="UPDATE consumer_user SET otp='"+otp+"', otp_expiry='"+expiryTime+"' WHERE consumer_phone="+phone;
                            }
                        }else{
                            newOtpSql="INSERT INTO consumer_user(consumer_phone,otp,otp_expiry) VALUES('"+phone+"','"+otp+"','"+expiryTime+"')";
                        }

                        connection.query(newOtpSql,function(err,results){
                            if(err){
                                return callback({code:500,error:err});
                            }else{
                                const res={
                                    phone:phone,
                                    otp:otp
                                }

                                return callback(null,{code:200,message:"Otp sent successfully",data:res});
                            }
                        })
                    }
                })
            }
        })
    },

    verifyOtp:(data,callback)=>{
        var phone=data.phone;
        var otp=data.otp;
        const token=data.token;
        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        db(function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{
                connection.query("SELECT * FROM consumer_user WHERE consumer_phone="+phone,function(err,results){
                    if(err){
                        return callback({code:500,error:err});
                    }else{
                        var consumerUser=results[0];
                        var otpExpiry=consumerUser.otp_expiry;
                        var userOtp=consumerUser.otp;

                        if(otpExpiry>nowTime){
                            return callback(null,{code:300,message:"Otp expired",data:null});
                        }

                        if(otp!=userOtp){
                            return callback(null,{code:301,message:"Incorrect otp",data:null});
                        }

                        if(consumerUser.name==null||consumerUser.name==""){
                            return callback(null,{code:201,message:"User account doesn't exist",data:null});
                        }

                        connection.query("UPDATE consumer_user SET token='"+token+"' WHERE consumer_phone="+phone,function(err,results){
                            if(err){
                                return callback({code:500,error:err});
                            }else{
                                var auth=jwt.sign({consumer_id:consumerUser.id},config.secret);

                                var responseData={
                                    id:consumerUser.id,
                                    name:consumerUser.name,
                                    phone:consumerUser.phone,
                                    address:consumerUser.address,
                                    wallet_balance:consumerUser.wallet_balance,
                                    green_balance:consumerUser.green_balance,
                                    lat:consumerUser.lat,
                                    lng:consumerUser.lng,
                                    auth:auth,
                                    token:consumerUser.token
                                }

                                return callback(null,{code:200,message:"User logged in successfully",data:responseData});
                            }
                        })

                    }
                })
            }
        })
    },

    registerAccount:(data,callback)=>{
        var consumerPhone=data.consumer_phone;
        var consumerName=data.consumer_name;
        var consumerAddress=data.consumer_address;
        var estimatedWasteQuantity=data.estimated_waste_quantity;
        var lat=data.lat;
        var lng=data.lng;
        var consumerTags=data.consumer_tags;
        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        var consumerUserData={
            consumer_name:consumerName,
            consumer_address:consumerAddress,
            estimated_waste_quantity:estimatedWasteQuantity,
            lat:lat,
            lng:lng,
            updated_at:nowTime
        }

        dbPromise(async function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{

                const [updateConsumerUser]=await connection.query("UPDATE consumer_user SET ? WHERE consumer_phone = ?",[consumerUserData,consumerPhone]);
                
                if(updateConsumerUser.affectedRows>0){
                    const [consumerUsers]=await connection.query("SELECT * FROM consumer_user WHERE consumer_phone="+consumerPhone);
                    if(consumerUsers.length>0){
                        var consumerUser=consumerUsers[0];

                        consumerTags.forEach(async element => {
                            var consumerTagData={
                                consumer_id:consumerUser.id,
                                tag_id:element
                            }
                            const [ct]=await connection.query("INSERT INTO consumer_tags SET ?",consumerTagData);
                        });
    
                        var auth=jwt.sign({consumer_id:consumerUser.id},config.secret);
    
                        const [consumerTag]=await connection.query("SELECT * FROM consumer_tags WHERE consumer_id="+consumerUser.id);
    
                        var responseData={
                            id:consumerUser.id,
                            consumer_name:consumerUser.consumer_name,
                            consumer_phone:consumerUser.consumer_phone,
                            consumer_address:consumerUser.consumer_address,
                            estimated_waste_quantity:consumerUser.estimated_waste_quantity,
                            lat:consumerUser.lat,
                            lng:consumerUser.lng,
                            auth:auth,
                            token:consumerUser.token,
                            tags:consumerTag
                        }
    
                        return callback(null,{code:200,message:"User account created successfully",data:responseData});
                    }else{
                        return callback(null,{code:201,message:"User not found",data:null});
                    }
                }else{
                    return callback(null,{code:301,message:"Failed to create account",data:null});
                }
            }
        })
    }
}