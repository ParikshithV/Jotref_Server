const express = require('express');
const ListModel = require('./models/listModel');
const ProfileModel = require('./models/profileModel');
const { sendEmailOtp } = require('./methods/sendEmailOtp');
const router = express.Router();

router.post('/post', (req, res) => {
    console.log('/post', req.body);
    const data = new ListModel({
        title: req.body.title,
        description: req.body.description,
        points: req.body.points,
        createdBy: req.body.userId,
        isDraft: req.body.isDraft || false
    })

    try {
        data.save().then(data => {
            console.log(data);
            res.status(201).json(data);
        })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

router.get('/getall', async (req, res) => {
    try {
        const offset = parseInt(req.query.offset);
        const limit = parseInt(req.query.limit);
        console.log('/getall', req.query)
        // dont show drafts
        const data = await ListModel.aggregate([
            {
                $match: {
                    isDraft: false
                }
            },
            {
                $skip: offset || 0,
            },
            {
                $limit: limit || 10
            },
            {
                $lookup: {
                    from: "profiles",
                    let: { createdBy: "$createdBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", { $toObjectId: "$$createdBy" }]
                                }
                            }
                        },
                        {
                            $project: {
                                email: 1,
                                _id: 0
                            }
                        }
                    ],
                    as: "createdBy"
                }
            },
            {
                $unwind: "$createdBy"
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    points: 1,
                    createdOn: 1,
                    createdBy: 1,
                    isDraft: 1
                }
            },
            {
                $sort: {
                    createdOn: -1
                }
            }
        ]);

        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.get('/getuserlist', async (req, res) => {
    const offset = parseInt(req.query.offset);
    const limit = parseInt(req.query.limit);
    const isDraft = req.query.isDraft || false;
    const userId = req.query.userId;
    console.log('/getuserlist', {
        offset: offset,
        limit: limit,
        isDraft: isDraft,
        userId: userId
    });
    try {
        const data = await ListModel.find(
            { createdBy: userId, isDraft: isDraft },
            { title: 1, description: 1, points: 1, createdOn: 1, createdBy: 1 },
            { skip: offset || 0, limit: limit || 10 }
        );
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})


// deletelist by id
router.delete('/deletelist', async (req, res) => {
    const listId = req.body.listId;
    try {
        const data = await ListModel.findByIdAndDelete(listId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.get('/getuserdrafts', async (req, res) => {
    const userId = req.body.userId;
    try {
        const data = await ListModel.find(
            { isDraft: true, createdBy: userId },
            { title: 1, description: 1, points: 1, createdOn: 1, createdBy: 1 }
        );
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// send email otp
router.post('/sendemailotp', async (req, res) => {
    console.log(req.body);
    const emailStat = await sendEmailOtp(req.body.email.toLowerCase());
    console.log('emailStat', emailStat);
    if (emailStat.length > 6) res.status(200).json({ message: "Email sent successfully" });
    else if (emailStat === 'limit') res.status(500).json({
        message: "OTP limit reached. Please contact jotref@mailo.com"
    });
    else if (emailStat) res.status(200).json({ message: "Email not sent" });
    else res.status(500).json({ message: "Email not sent" });
})

// verify email otp
router.post('/verifyemailotp', async (req, res) => {
    //verify email and return object id
    console.log(req.body);
    try {

        const emailStat = await ProfileModel.findOneAndUpdate(
            { email: req.body.email.toLowerCase(), otp: req.body.otp },
            { verified: true, otp: null, otpAttempts: 3 },
            { new: true },
        );

        if (!emailStat) {
            res.status(200).json({
                message: "Email not verified",
                status: false
            });
        }
        else {
            const userId = emailStat._id;
            res.status(200).json({
                message: "Email verified",
                status: true,
                userId: userId
            });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router;