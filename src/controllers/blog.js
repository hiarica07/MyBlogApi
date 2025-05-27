"use strict"

const Blog = require("../models/blog")
// const mongoose = require("mongoose")
const {mongoose} = require("../configs/dbConnection")

module.exports = {
    list: async(req, res) => {
        /* 
            #swagger.tags = ["Blogs"]
            #swagger.summary = "List Blogs"
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
        const data = await res.getModelList(Blog, {}, ["userId", "categoryId", "comments"])
        const details = await res.getModelListDetails(Blog)
        res.status(200).send({
            error: false,
            details,
            data
        })
    },
    stats: async(req, res) => {

        const stats = {
            totalVisitors:0,
            totalLikes:0,
            totalComments:0,
            totalRecords:0,
            published:0,
            draft:0,
        }

        const userId = new mongoose.Types.ObjectId(String(req.params.userId))

        const totalRecords = await Blog.countDocuments({userId});
        const publishedCount = await Blog.countDocuments({userId, isPublish: true});

        stats.totalRecords = totalRecords;
        stats.published = publishedCount;
        stats.draft = totalRecords - publishedCount;


// Blog.aggregate
// This function summarizes blog statistics for a specific user.
// It calculates total number of blog posts, published and draft counts,
// total number of visitors, likes, and comments across all posts.
// "countDocuments" is used to count total and published records.
// The "aggregate" method is used for more complex operations:
//    - "$group" collects all matched blog posts into one group.
//    - "$sum" and "$size" are used to count visitors, likes, and comments per post.
//    - "$ifNull" ensures that if "likes" or "comments" fields are null or missing, it doesn't cause errors.
// All calculated data is stored in the "stats" object and returned as the API response.

        const result = await Blog.aggregate([
            {
                $match: {userId}
            },
            {
                $group: {
                    _id: null,
                    totalVisitors: {$sum: "$countOfVisitors"},
                    totalLikes: {$sum: {$size: {$ifNull: ["$likes", []]}}}},
                    totalComments: {$sum: {$size: {$ifNull: ["$comments", []]}},
                }
            }
        ]);

        stats.totalVisitors = result[0]?.totalVisitors || 0;
        stats.totalLikes = result[0]?.totalLikes || 0;
        stats.totalComments = result[0]?.totalComments || 0;

        res.status(200).send({
            ...stats
        })


    },
    create: async(req, res) => {
        /* 
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Create Blog"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    $ref:"#/definitions/Blog"
                }
            }
        */
        // Set userId from logged in user
        // console.log(req.user);
        
        req.body.userId = req.user._id
        const result = await Blog.create(req.body)
        res.status(201).send({
            error: false,
            result
        })
    },
    read: async(req, res) => {
        /*
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Get Single Blog"
        */
        const data = await Blog.findOne({_id: req.params.id}).populate(["userId", "categoryId"])
        data.countOfVisitors += 1
        data.save()
        res.status(200).send({
            error: false,
            data
        })
    },
    update: async(req, res) => {
        /*
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Update Blog"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    $ref:"#/definitions/Blog"
                }
            }
        */
        const blogData = await Blog.findOne({_id: req.params.id}) //.populate("userId")
        // console.log(blogData);
        // console.log(req.user);
        //?? id neden olmadı?
       
        if (blogData.userId.toString() != req.user._id) {
            res.errorStatusCode = 401;
            throw new Error("You cannot update someone else's blog post")
        }
        const result = await Blog.updateOne({_id: req.params.id}, req.body, {runValidators: true})
        res.status(202).send({
            error: false,
            result,
            new: await Blog.findOne({_id: req.params.id}) //.populate(["userId", "categoryId"])
        })
    },
    delete: async(req, res) => {
        /* 
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Delete Blog"
        */
        const blogData = await Blog.findOne({_id: req.params.id}).populate("userId")
        // console.log(blogData.userId._id);
        // console.log(req.user);
        //?? id neden olmadı?
       
        if (blogData.userId.username !== req.user.username) {
            res.errorStatusCode = 401;
            throw new Error("You cannot delete someone else's blog post")
        }

        const result = await Blog.deleteOne({_id: req.params.id})
        res.status(result.deletedCount ? 204 : 404).send({
            error: !result.deletedCount,
            message: "Blog deleted successfully!",
            result
        })
    },
    getLike: async(req, res) => {
        /* 
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Get Like Info"
        */
        const result = await Blog.findOne({_id: req.params.id})
        // console.log(result.likes);
        
        res.status(200).send({
            error: false,
            likes: result.likes
        })
    },
    postLike: async(req, res) => {
        /* 
            #swagger.tags = ["Blogs"]
            #swagger.summary = "Add/Remove Like"
        */
        const result = await Blog.findOne({_id: req.params.id})
        // console.log(result);
        
        let likes = result?.likes.map((id)=>id.toString()) || []
        const userId = req.user._id.toString()
        
        // console.log(likes);
        if (likes.includes(userId)) {
            // console.log("hello");            
            likes = likes.filter((id) => id !== userId)            
            // console.log(likes);
        } else {
            likes.push(userId)
        }
        
        result.likes = likes
        await result.save()
        res.status(200).send({
            error: false,
            result,
        })
    },
    // User's own Blogs
    getMyBlogsData: async (req, res) => {
    /*
      #swagger.tags = ["Blogs"]
      #swagger.summary = "Get Single User Blogs"
      #swagger.description = "Fetch all blogs for a specific user."
      #swagger.parameters['userId'] = {
          in: 'path',
          required: true,
          description: 'ID of the user to fetch blogs for.',
          type: 'string',
        }
    */
    // console.log(req.user);
    const userId = req.user?._id.toString();
    // console.log(userId);

    const data = await res.getModelList(Blog, {userId}, [
      "categoryId",
    ]);
    // console.log(data);

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(Blog, {userId}),
      data,
    });
    },
    getPublishedBlogsData: async (req, res) => {
    /*
      #swagger.tags = ["Blogs"]
      #swagger.summary = "Get Published Blogs"
      #swagger.description = "Fetch Published blogs"
      #swagger.parameters['isPublish'] = {
          in: 'path',
          required: true,
          description: 'ID of the user to fetch blogs for.',
          type: 'string',
        }
    */

    const publishedBlogs = await res.getModelList(Blog, {isPublish:true}, [
      "categoryId","userId"
    ]);
    // console.log(data);

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(Blog, {isPublish:true}),
      data: publishedBlogs,
    });
    },
    
}