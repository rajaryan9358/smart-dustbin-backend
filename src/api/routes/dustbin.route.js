const express=require('express');

const router=express.Router();

const {getAllDustbins,getDustbinDetails,requestNewDustbin,getAllCategories,getDustbinWasteDistribution}=require("../controllers/dustbin.controller");


router.get('/get-my-dustbins/:producer_id',getAllDustbins);
router.get('/get-dustbin-detail/:dustbin_id',getDustbinDetails);

router.post('/request-dustbin',requestNewDustbin);
router.get('/get-categories',getAllCategories);

router.post('/waste-distribution',getDustbinWasteDistribution);

module.exports=router;