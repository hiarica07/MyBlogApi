"use strict"
/* ------------------------------------------------------- */
const {mongoose} = require("../configs/dbConnection")
const passwordEncrypt = require("../helpers/passwordEncrypt")
/* ------------------------------------------------------- *
{
    "username": "admin",
    "password": "aA?123456",
    "email": "admin@site.com",
    "firstName": "admin",
    "lastName": "admin",
    "isActive": true,
    "isStaff": true,
    "isAdmin": true
}
/* ------------------------------------------------------- */
const UserSchema = new mongoose.Schema({

    username: {
        type: String,
        trim: true,
        required: [true, "Username is required"],
        unique: true,
        index: true
    },

    password: {
        type: String,
        trim: true,
        required: true
    },

    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        index: true
    },

    firstName: {
        type: String,
        trim: true,
        required: [true, "First name is required"],
    },

    lastName: {
        type: String,
        trim: true,
        required: [true, "Last name is required"],
    },

    image: {
        type: String,
        trim: true
    },

    city: {
        type: String,
        trim: true
    },

    bio: {
        type: String,
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true
    },

    isStaff: {
        type: Boolean,
        default: false
    },

    isAdmin: {
        type: Boolean,
        default: false
    },
}, {
    collection: 'users',
    timestamps: true
})

/* ------------------------------------------------------- */

UserSchema.pre(["save", "updateOne"], function(next) {
    // console.log("Pre-save run!")
    console.log(this)
    
    const data = this?._update ?? this

    // Email Validation Control

    const isEmailValidated = data.email ? /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email) : true

    if (!isEmailValidated) {
        next(new Error("Email is not validated, please write a proper email!"))
    }

    // Password Validation Control

    const isPasswordValidated = data.password ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.]).{8,}$/.test(data.password) : true

    if (!isPasswordValidated) {
        next(new Error('Password must be at least 8 characters long and contain at least one special character and  at least one uppercase character.'))
    }

    if (data.password) {
        if (this?._update) {
            // Update password
            this._update.password = passwordEncrypt(data.password)
        } else {
            // Create password
            this.password = passwordEncrypt(data.password)
        }
    }
    next()
})
/* ------------------------------------------------------- */
module.exports = mongoose.model("User", UserSchema)