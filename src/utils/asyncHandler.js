// const asyncHandler1 = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next)).catch((err) => { next(err) })
//     }
// }


const asyncHandler = (fn)=> async (req,res,next)=>{
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(error.code || 400).json({
            success:false,  // use to give status in Error Message
            message : error.message
        })
    }
}

export { asyncHandler }