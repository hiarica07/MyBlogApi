"use strict"

const passwordEncrypt = require("../helpers/passwordEncrypt");
const Token = require("../models/token");
const User = require("../models/user");
const jwt = require("jsonwebtoken")

module.exports = {
    login: async (req, res) => {
        /*
            #swagger.tags = ["Authentication"]
            #swagger.summary = "Login"
            #swagger.description = 'Login with username (or email) and password for get simpleToken and JWT'
            #swagger.parameters["body"] = {
                in: "body",
                required: true,
                schema: {
                    "username": "test",
                    "password": "aA?123456",
                }
            }
        */
        const {username, email, password} = req.body
        // console.log(req.body);
        if (!((username || email) && password)) {
            res.errorStatusCode = 401;
            throw new Error("UserName/Email and Password required!")
        }

        const user = await User.findOne({$or: [{email}, {username}]})

        if (user?.password !== passwordEncrypt(password)) {
            res.errorStatusCode = 401;
            throw new Error("Incorrect username/email or password.");
        }

        if (!user.isActive) {
            res.errorStatusCode = 401;
            throw new Error("This account is not active.");
        }

        // Simple Token

        let tokenData = await Token.findOne({userId: user?._id})
        if (!tokenData) {
            tokenData = await Token.create({
                userId: user._id,
                token: passwordEncrypt(Date.now() + user._id)
            })
        }

        // JWT        
        // AccessToken
        const accessData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            isActive: user.isActive,
            isAdmin: user.isAdmin
        }

        const accessToken = jwt.sign(accessData, process.env.ACCESS_KEY, {expiresIn: "1d"})
        
        // RefreshToken

        const refreshData = {
            _id: user._id,
            password: user.password
        }

        const refreshToken = jwt.sign(refreshData, process.env.REFRESH_KEY, {expiresIn: "3d"})
        
        res.send({
            error: false,
            token: tokenData.token,
            bearer: {
                access: accessToken,
                refresh: refreshToken
            },
            user
        })
    },
    refresh: async (req, res) => {
        /*
            #swagger.tags = ["Authentication"]
            #swagger.summary = "Refresh"
            #swagger.description = 'Refresh with refreshToken for get accessToken'
            #swagger.parameters["body"] = {
                in: "body",
                required: true,
                schema: {
                    "bearer": {
                        refresh: '...refresh_token...'
                    }
                }
            }
        */
        const refreshToken = req.body?.bearer?.refresh

        if (!refreshToken) {
            res.errorStatusCode = 401
            throw new Error('Please enter bearer.refresh')
        }
        const refreshData = await jwt.verify(refreshToken, process.env.REFRESH_KEY)
        if (!refreshData) {
            res.errorStatusCode = 401
            throw new Error('JWT refresh Token is wrong.')
        }
        const user = await User.findOne({ _id: refreshData._id })
        if (!(user && (user.password === refreshData.password))) {
            res.errorStatusCode = 401
            throw new Error('Wrong id or password.')
        }
        if (!user.isActive) {
            res.errorStatusCode = 401
            throw new Error("This account is not active. Please contact with support!")
        }

        const accessData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            isActive: user.isActive,
            isAdmin: user.isAdmin
        }

        res.send({
            error: false,
            bearer: {
                access: jwt.sign(accessData, process.env.ACCESS_KEY, { expiresIn: '1d'})
            }
        })
    },
    logout: async (req, res) => {
        /*
            #swagger.tags = ["Authentication"]
            #swagger.summary = "simpleToken: Logout"
            #swagger.description = 'Delete token key.'
        */
        const auth = req.headers?.authorization
        const tokenKey = auth ? auth.split(" ") : null
        if (tokenKey[0] == "Token") {
            const result = await Token.deleteOne({token: tokenKey[1]})
            res.send({
                error: !result.deletedCount,
                message: "User's Token deleted",
                result
            })
        } else if (tokenKey[0] == "Bearer") {            
            res.send({
                error: false,
                message: 'JWT: No need any process for logout. It will expire sometime'
            })
        }
        }
}