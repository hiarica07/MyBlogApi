"use strict"

const router = require("express").Router()
/* ------------------------------------------------------- */
// routes/comment:

const comment = require("../controllers/comment")

router.route("/")
    .get(comment.list)
    .post(comment.create)
router.route("/:id")
    .get(comment.read)
    .put(comment.update)
    .patch(comment.update)
    .delete(comment.delete)
router.get("/:id/getLike", comment.getLike)
router.post("/:id/postLike", comment.postLike)
router.route("/blog/:blogId").get(comment.getSingleBlogComments);
/* ------------------------------------------------------- */
// Exports:
module.exports = router