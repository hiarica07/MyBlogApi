"use strict"

const router = require("express").Router()
/* ------------------------------------------------------- */
// routes/category:

const category = require("../controllers/category")

router.route("/all").get(category.listCategories) // Without pagination
router.route("/")
    .get(category.list)
    .post(category.create)
router.route("/:id")
    .get(category.read)
    .put(category.update)
    .patch(category.update)
    .delete(category.delete)


/* ------------------------------------------------------- */
// Exports:
module.exports = router
