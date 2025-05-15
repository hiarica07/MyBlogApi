"use strict"

const router = require("express").Router()
/* ------------------------------------------------------- */

// auth:
router.use("/auth", require("./auth"))
// user:
router.use("/users", require("./user"))
//token:
router.use("/token", require("./token"))


//blog:
router.use("/blogs", require("./blog"))
//categories:
router.use("/categories", require("./category"))
//comment:
router.use("/comments", require("./comment"))
//documents:
router.use("/documents", require("./document"))

/* ------------------------------------------------------- */
module.exports = router