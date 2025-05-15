"use strict"

module.exports = (err, req, res, next) => {
    console.log("Error-->", err);
    
    return res.status(res?.errorStatusCode || 500).send({
        error: true,
        message: err.message || 'Internal Server Error',
        cause: err.cause,
        body: req.body,
        stack: err.stack
    })
}