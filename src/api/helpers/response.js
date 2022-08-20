module.exports={
    success:(code,message,data)=>{
        return {
            code:code,
            status:"SUCCESS",
            message:message,
            data:data
        }
    },

    error:(code,message)=>{
        return {
            code:code,
            status:"FAILED",
            message:message
        }
    }
}