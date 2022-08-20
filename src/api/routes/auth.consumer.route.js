const express=require('express');

const router=express.Router();

const {sendOtp,verifyOtp,registerAccount}=require('../controllers/auth.consumer.controller');

router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyOtp);
router.post('/register-account',registerAccount);

module.exports=router;