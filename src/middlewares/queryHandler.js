"use strict"

module.exports = (req, res, next) => {

    /* FILTERING & SEARCHING & SORTING & PAGINATION */

    // ### FILTERING ###

    // URL?filter[key1]=value1&filter[key2]=value2

    const filter = req.query?.filter || {}
    // console.log(filter)

    // ### SEARCHING ###

    // URL?search[key1]=value1&search[key2]=value2

    // https://www.mongodb.com/docs/manual/reference/operator/query/regex/

    const search = req.query?.search || {}
   
    // const example = { title: { $regex: 'test', $options: 'i' } } // const example = { title: /test/ }

    for (let key in search) search[key] = { $regex: search[key], $options: 'i' } 
    // i: case insensitive

    // ### SORTING ###

    // URL?sort[key1]=asc&sort[key2]=desc
    // asc: A-Z - desc: Z-A
    const sort = req.query?.sort || {}
    // console.log(sort)

    // ### PAGINATION ###

    //* LIMIT:
    let limit = Number(req.query?.limit)
    // console.log(limit)
    limit = limit > 0 ? limit : Number(process.env.PAGE_SIZE || 24)
    // console.log(typeof limit, limit)

    //* PAGE:
    let page = parseInt(req.query?.page)
    page = page > 0 ? page : 1

    //* SKIP:
    let skip = parseInt(req.query?.skip)
    skip = skip > 0 ? skip : (page - 1) * limit

    /* FILTERING & SEARCHING & SORTING & PAGINATION */

    // Run for output:
    res.getModelList = async (Model, customFilter = {}, populate = null) => {
        return await Model.find({ ...filter, ...search, ...customFilter }).sort(sort).skip(skip).limit(limit).populate(populate)
    }

    // Details:
    res.getModelListDetails = async (Model, customFilter = {}) => {

        const count = await Model.countDocuments({ ...filter, ...search, ...customFilter })

        let details = {
            filter,
            search,
            sort,
            skip,
            limit,
            page,
            totalRecords: count,
            pages: count <= limit ? false : {
                prev: (page > 1 ? page - 1 : false),
                current: page,
                next: page < Math.ceil(count / limit) ? page + 1 : false,
                total: Math.ceil(count / limit)
            }
        };

        return details
    }

    next()
}