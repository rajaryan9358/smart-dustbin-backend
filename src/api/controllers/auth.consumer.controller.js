const request = require('request-promise');

const {sendOtp, verifyOtp, registerAccount}=require('../services/auth.consumer.service');

const {success, error}=require('../helpers/response');

module.exports={
    sendOtp:(req,res)=>{
        var body=req.body;
        console.log(body);
        if(body.consumer_phone==null||body.consumer_phone.length!=10){
            return res.json(error(400,"Enter a valid phone"));
        }

        sendOtp(body,function(err,result){
            if(err){
                console.log(err);
                return res.json(error(500,"Database connection error"));
            }else{
                var phone=result.data.phone;
                var otp=result.data.otp;

                const options = {
                    method: 'POST',
                    uri: 'https://messagebyte.com/smsapi/sendjson?user=61e017481aa459603a41042d&pswd=33738378&type=text',
                    body: {
                        "message": {
                            "submit": {
                                "sender": "SOTOPY",
                                "content": otp+" is your ZP App Verification Code.\n\nSOTOPY",
                                "peid": "1001553370000068465",
                                "content_id": "1007165346551480135",
                                "da": [
                                    {
                                        "msisdn": "91"+phone,
                                        "name": "zp-user",
                                        "email": "zpuser@zaruripapers.com"
                                    }
                                ]
                            }
                        }
                    },
                    json: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }

                request(options).then(function (response) {
                    if(response.status==200){
                        return res.json(success(result.code,result.message,null))
                    }else{
                        return res.json(error(301,"Failed to send otp"))
                    }
                })
                .catch(function (err) {
                    return res.json(error(301,"Failed to send otp"))
                });
            }
        })
    },

    verifyOtp:(req,res)=>{
        var body=req.body;

        if(body.consumer_phone==null||body.consumer_phone.length!=10){
            return res.json(error(400,"Enter valid phone"))
        }

        if(body.otp==null||body.otp.length!=4){
            return res.json(error(400,"Enter valid otp"))
        }

        if(body.token==null||body.token==""){
            return res.json(error(400,"Token not provided"));
        }

        verifyOtp(body,function(err,result){
            if(err){
                return res.json(error(500,"Database connection error"))
            }else{
                return res.json(success(result.code,result.message,result.data));
            }
        })
    },

    registerAccount:(req,res)=>{
        var body=req.body;

        if(body.consumer_phone==null||body.consumer_phone==""){
            return res.json(error(400,"Enter phone"));
        }

        if(body.consumer_name==null||body.consumer_name==""){
            return res.json(error(400,"Enter name"));
        }

        if(body.consumer_address==null||body.consumer_address==""){
            return res.json(error(400,"Enter address"));
        }

        if(body.estimated_waste_quantity==null){
            body.estimated_waste_quantity=0;
        }

        if(body.lat==null||body.lng==null){
            return res.json(error(400,"Location cordinates required"));
        }

        if(body.consumer_tags==null||body.consumer_tags.length==0){
            return res.json(error(400,"consumer_tags id array is required"));
        }

        registerAccount(body,function(err,result){
            if(err){
                console.log(err);
                return res.json(error(500,"Database connection error"));
            }else{
                return res.json(success(result.code,result.message,result.data));
            }
        })
    }
}