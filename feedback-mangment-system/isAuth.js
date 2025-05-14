require('dotenv').config()
const jwt = require('jsonwebtoken')

const Authenticate = (req,res,next)=>{
const token = req.cookies.token
if (!token) return res.status(401).json({ message: 'Unauthorized: Token missing' });

jwt.verify(token,process.env.JWT_SECRET,(error,payload)=>{
    if(error){
        return res.status(403).json({ message: 'Invalid token' });
    }
    req.username = payload.username
    next()
})
}

module.exports = Authenticate