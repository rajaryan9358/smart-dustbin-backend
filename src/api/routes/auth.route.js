const express=require('express');

const router=express.Router();

const {sendOtp,verifyOtp,registerUser}=require('../controllers/auth.controller');

router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyOtp);
router.post('/register-user',registerUser);

module.exports=router;