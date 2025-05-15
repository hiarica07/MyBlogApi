"use strict"

const {mongoose} = require("../configs/dbConnection")
/* ----------------------------------------
{
    "categoryId": "676aa56034b3e2154d72694d",
    "title": "Test title 1",
    "content": "Test content 1",
    "image": "image-1",
    "isPublish": true
}
-------------------------------------*/

const BlogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    content: {
        type: String,
        required: [true, 'Content is required!'],
        trim: true
    },

    image: {
        type: String,
        required: true,
        trim: true
    },

    isPublish: {
        type: Boolean,
        default: true
    },

    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],

    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    countOfVisitors: {
        type: Number,
        default: 0
    },
}, {
    collection: "blogs",
    timestamps: true,
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
})

// blogSchema.methods.incrementVisitors = async function () {
//     this.countOfVisitors += 1;
//     await this.save();
// };
  
// blogSchema.virtual("countInfo").get(function () {
//     return {
//       likesCount: this.likes.length,
//       commentsCount: this.comments.length,
//     };
// });

module.exports = mongoose.model("Blog", BlogSchema)
