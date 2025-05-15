"use strict";

const CustomError = require("../errors/customErrors");
const filterObj = require("../helpers/allowedFields");
const passwordEncrypt = require("../helpers/passwordEncrypt");
const Token = require("../models/token");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

module.exports = {
  list: async (req, res) => {
    /* 
            #swagger.tags = ["Users"]
            #swagger.summary = "List Users"
            #swagger.description = `
                You can use <u>filter[] & search[] & sort[] & page & limit</u> queries with endpoint.
                <ul> Examples:
                    <li>URL/?<b>filter[field1]=value1&filter[field2]=value2</b></li>
                    <li>URL/?<b>search[field1]=value1&search[field2]=value2</b></li>
                    <li>URL/?<b>sort[field1]=asc&sort[field2]=desc</b></li>
                    <li>URL/?<b>limit=10&page=1</b></li>
                </ul>
            `
        */

    const data = await res.getModelList(User);
    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(User),
      data,
    });
  },
  create: async (req, res) => {
    /* 
            #swagger.tags = ["Users"]
            #swagger.summary = "Create User"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    "username": "test",
                    "password": "1234",
                    "email": "test@site.com",
                    "firstName": "test",
                    "lastName": "test",
                }
            }
        */

    /* User is logged in when registered */
    const user = await User.create(req.body);

    // SIMPLE TOKEN

    const tokenData = await Token.create({
      userId: user._id,
      token: passwordEncrypt(user._id + Date.now()),
    });

    // JWT

    // Access Token
    const accessData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
    };
    // Convert to JWT
    const accessToken = jwt.sign(accessData, process.env.ACCESS_KEY, {
      expiresIn: "1d",
    });

    // Refresh Token

    const refreshData = {
      _id: user._id,
      password: user.password,
    };

    // Convert to JWT
    const refreshToken = jwt.sign(refreshData, process.env.REFRESH_KEY, {
      expiresIn: "3d",
    });

    res.status(200).send({
      error: false,
      token: tokenData.token,
      bearer: {
        access: accessToken,
        refresh: refreshToken,
      },
      user,
    });
  },
  read: async (req, res) => {
    /* 
            #swagger.tags = ["Users"]
            #swagger.summary = "Read User"
        */
    const data = await User.findOne({ _id: req.params.id });
    res.status(200).send({
      error: false,
      data,
    });
  },
  update: async (req, res) => {
    /* 
            #swagger.tags = ["Users"]
            #swagger.summary = "Update User"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    "username": "test",
                    "password": "1234",
                    "email": "test@site.com",
                    "firstName": "test",
                    "lastName": "test",
                }
            }
        */
    const data = await User.updateOne({ _id: req.params.id }, req.body, {
      runValidators: true,
    });
    res.status(200).send({
      error: false,
      data,
      new: await User.findOne({ _id: req.params.id }),
    });
  },
  delete: async (req, res) => {
    /* 
        #swagger.tags = ["Users"]
        #swagger.summary = "Delete User"
    */
    const data = await User.deleteOne({ _id: req.params.id });
    res.status(data.deletedCount ? 204 : 404).send({
      error: !data.deletedCount,
      data,
    });
  },
  updateMe: async (req, res) => {
    /*
        #swagger.tags = ["Users"]
        #swagger.summary = "Update User"
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                "firstName": "test",
                "lastName": "test",
                "image": "test",
                "city": "test",
                "bio": "test",
            }
        }
    */

    const filteredObj = filterObj(
      req.body,
      "firstName",
      "lastName",
      "image",
      "city",
      "bio"
    );

    const data = await User.updateOne({ _id: req.params.id }, filteredObj, {
      runValidators: true,
    });
    console.log(data);

    res.status(201).send({
      error: !data.modifiedCount,
      message: data.modifiedCount
        ? "User updated successfully"
        : "User update failed",
      data,
      new: await User.findOne({ _id: req.params.id }),
    });
  },
  changeMyPassword: async (req, res) => {
    /* 
        #swagger.tags = ["Users"]
        #swagger.summary = "Update User"
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                "currentPassword": "***",
                "newPassword": "***",
                "retypePassword": "***",
            }
        }
    */
    const { currentPassword, newPassword, retypePassword } = req.body;

    console.log(req.user);
    

    if (!currentPassword || !newPassword || !retypePassword) {
      throw new CustomError("Password filed required");
    }

    const user = await User.findOne({ _id: req.user._id });

    if (!user) {
      throw new CustomError("This user is not found", 404);
    }

    if (req.user?.password !== passwordEncrypt(currentPassword)) {
        throw new CustomError("Your current password is not match! Please write your existing password!")
    }

    if (newPassword !== retypePassword) {
        throw new CustomError("Passwords don't match!")
    }

    user.password = newPassword

    await user.save()

    res.status(201).send({
      error: false,
      message: "Password updated successfully",
      data: user,
    });
  },
};
