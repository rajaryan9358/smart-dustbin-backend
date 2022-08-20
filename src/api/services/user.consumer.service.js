var config=require('../../config/db');
var db=config.getConnection;
var jwt = require('jsonwebtoken');
const moment = require('moment');
const { now } = require('moment');


module.exports={

    getMyDashboard:(data,callback)=>{

    },
    
    getAllActivities:(data,callback)=>{

    },

    getMyCategories:(data,callback)=>{

    },

    getAllNotifications:(data,callback)=>{

    },

    getMyProfile:(data,callback)=>{

    },

    updateProfile:(data,callback)=>{

    },

    saveMyCategories:(data,callback)=>{

    },

    getMyTags:(data,callback)=>{

    },

    updateMyTags:(data,callback)=>{

    }

}