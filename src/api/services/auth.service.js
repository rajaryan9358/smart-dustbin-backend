var config=require('../../config/db');
var db=config.getConnection;
var jwt = require('jsonwebtoken');
const moment = require('moment');
const { now } = require('moment');

module.exports={
    createSendOtp:(data,callback)=>{
        var phone =data.phone;
        const otp=Math.floor(Math.random()*(9999-1000+1)+1000);
        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        db(function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{
                connection.query("SELECT * FROM producer_user WHERE phone="+phone,function(err,results){
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
                                newOtpSql="UPDATE producer_user SET otp='"+otp+"', otp_expiry='"+expiryTime+"' WHERE phone="+phone;
                            }
                        }else{
                            newOtpSql="INSERT INTO producer_user(phone,otp,otp_expiry) VALUES('"+phone+"','"+otp+"','"+expiryTime+"')";
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

    createVerifyOtp:(data,callback)=>{
        var phone=data.phone;
        var otp=data.otp;
        const token=data.token;
        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        db(function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{
                connection.query("SELECT * FROM producer_user WHERE phone="+phone,function(err,results){
                    if(err){
                        return callback({code:500,error:err});
                    }else{
                        var producerUser=results[0];
                        var otpExpiry=producerUser.otp_expiry;
                        var userOtp=producerUser.otp;

                        if(otpExpiry>nowTime){
                            return callback(null,{code:300,message:"Otp expired",data:null});
                        }

                        if(otp!=userOtp){
                            return callback(null,{code:301,message:"Incorrect otp",data:null});
                        }

                        if(producerUser.name==null||producerUser.name==""){
                            return callback(null,{code:201,message:"User account doesn't exist",data:null});
                        }

                        connection.query("UPDATE producer_user SET token='"+token+"' WHERE phone="+phone,function(err,results){
                            if(err){
                                return callback({code:500,error:err});
                            }else{
                                var auth=jwt.sign({producer_id:producerUser.id},config.secret);

                                var responseData={
                                    id:producerUser.id,
                                    name:producerUser.name,
                                    phone:producerUser.phone,
                                    address:producerUser.address,
                                    wallet_balance:producerUser.wallet_balance,
                                    green_balance:producerUser.green_balance,
                                    lat:producerUser.lat,
                                    lng:producerUser.lng,
                                    auth:auth,
                                    token:producerUser.token
                                }

                                return callback(null,{code:200,message:"User logged in successfully",data:responseData});
                            }
                        })

                    }
                })
            }
        })
    },

    createUser:(data,callback)=>{
        var phone=data.phone;
        var name=data.name;
        var address=data.address;
        var lat=data.lat;
        var lng=data.lng;
        const nowTime=moment().utc().format("YYYY-MM-DD HH:mm:ss");

        var producerUser={
            name:name,
            address:address,
            wallet_balance:0,
            green_balance:0,
            lat:lat,
            lng:lng,
            updated_at:nowTime
        }

        db(function(err,connection){
            if(err){
                return callback({code:500,error:err});
            }else{

                connection.query("UPDATE producer_user SET ? WHERE phone = ?",[producerUser,phone],function(err,results){
                    if(err){
                        return callback({code:500,error:err});
                    }else{
                        if(results.affectedRows>0){
                            connection.query("SELECT * FROM producer_user WHERE phone="+phone,function(err,results){
                                if(err){
                                    return callback({code:500,error:err});
                                }else{
                                    if(results.length>0){
                                        var producerUser=results[0];

                                        var auth=jwt.sign({producer_id:producerUser.id},config.secret);

                                        var responseData={
                                            id:producerUser.id,
                                            name:producerUser.name,
                                            phone:producerUser.phone,
                                            address:producerUser.address,
                                            wallet_balance:producerUser.wallet_balance,
                                            green_balance:producerUser.green_balance,
                                            lat:producerUser.lat,
                                            lng:producerUser.lng,
                                            auth:auth,
                                            token:producerUser.token
                                        }

                                        return callback(null,{code:200,message:"User account created successfully",data:responseData});
                                    }else{

                                        return callback(null,{code:201,message:"User not found",data:null});
                                    }
                                }
                            })
                        }else{
                            return callback(null,{code:301,message:"Failed to create account",data:null});
                        }
                    }
                })
            }
        })
    }
}