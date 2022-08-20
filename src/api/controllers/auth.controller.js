const request = require('request-promise');

const {createSendOtp, createVerifyOtp, createUser}=require('../services/auth.service');

const {success, error}=require('../helpers/response');

module.exports={
    sendOtp:(req,res)=>{
        var body=req.body;
        console.log(body);
        if(body.phone==null||body.phone.length!=10){
            return res.json(error(400,"Enter a valid phone"));
        }

        createSendOtp(body,function(err,result){
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

        if(body.phone==null||body.phone.length!=10){
            return res.json(error(400,"Enter valid phone"))
        }

        if(body.otp==null||body.otp.length!=4){
            return res.json(error(400,"Enter valid otp"))
        }

        if(body.token==null||body.token==""){
            return res.json(error(400,"Token not provided"));
        }

        createVerifyOtp(body,function(err,result){
            if(err){
                return res.json(error(500,"Database connection error"))
            }else{
                return res.json(success(result.code,result.message,result.data));
            }
        })
    },

    registerUser:(req,res)=>{
        var body=req.body;

        if(body.phone==null||body.phone==""){
            return res.json(error(400,"Enter phone"));
        }

        if(body.name==null||body.name==""){
            return res.json(error(400,"Enter name"));
        }

        if(body.address==null||body.address==""){
            return res.json(error(400,"Enter address"));
        }

        if(body.lat==null||body.lng==null){
            return res.json(error(400,"Location cordinates required"));
        }

        createUser(body,function(err,result){
            if(err){
                console.log(err);
                return res.json(error(500,"Database connection error"));
            }else{
                return res.json(success(result.code,result.message,result.data));
            }
        })
    }
}