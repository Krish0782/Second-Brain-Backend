import express from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { userModel, contentModel, linkModel } from './db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { userMiddleware } from './userMiddleware';
import cors from "cors"
import { error } from 'console';
import {Random} from './utils';
import dotenv from 'dotenv';



const jwtSecret = process.env.JWT_SECRET;
const mongoURI = process.env.MONGODB_URI;

const app = express();
app.use(express.json());
app.use(cors())
dotenv.config();

// password validate ker raha hoon 
const passwordValidation = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

app.post("/api/v1/signup", async (req, res) => {

    const checkEmail = req.body.email;
    const emailFound = await userModel.findOne({ email: checkEmail })
    if (emailFound) {
        res.status(403).json({ message: "Email already exist" })
        return
    }
    // Schema validation
    const requiredData = z.object({
        email: z.string().min(8).max(99).email(),
        password: z.string().min(8, { message: 'Password must contain at least 8 characters' })
            .regex(passwordValidation, { message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" }),
        username: z.string().min(3, { message: 'Username must contain at least 3 characters' })
    });

    // Schema validate krne ke baad body mein paas kiya
    const parsedDataWithSuccess = requiredData.safeParse(req.body);
    if (!parsedDataWithSuccess.success) {
        res.status(411).json({
            message: "Error in inputs",
        })
        return;

    }

    // validated schema joo aaya Zod se usko destructure kiya
    const { username, email, password } = parsedDataWithSuccess.data;
    try {
        // user creation
        await userModel.create({
            username,
            email,
            password
        });

        res.status(200).json({
            message: "User  created successfully"
        })
    } catch (e) {
        res.status(500).json({
            message: "Error creating user",
        })
    }
});

app.post("/api/v1/signin", async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await userModel.findOne({ email: email, password: password })
        if (!user) {
            res.status(403).json({ message: "Invalid email or password" })
            return
        }
        console.log("JWT_SECRET during signing:", jwtSecret);
        const token = jwt.sign(
            { id: user._id },
            jwtSecret
        )
        res.status(200).json({ token })
    } catch (e){
        res.status(500).json({ message: 'Internal server error ' ,
            error:e
        })
        
    }
})

app.post('/api/v1/content', userMiddleware, async (req, res) => {

    const { type, link, title } = req.body
    const userId = req.userId
    try {
        await contentModel.create({
            type,
            link,
            title,
            tag: [],
            userId
        })
        res.status(200).json({ message: "Content created successfully" })
    } catch (e) {
        res.status(500).json({ message: "Error creating content", error: e })
    }


})

app.get('/api/v1/content', userMiddleware, async (req, res) => {
    try {
        const userId = req.userId
        const content = await contentModel.find({
            userId: userId
        }).populate("userId", "username")
        res.status(200).json({
            content
        })
    } catch (e) {
        res.status(500).json({ message: "content not available", error: e })
    }




})

app.delete('/api/v1/content', userMiddleware, async (req, res) => {
    try {
        const contentId = req.body.contentId
        const result = await contentModel.deleteOne({
            _id: contentId,
            userId: req.userId
        })
        if (result.deletedCount === 0) {
            res.status(403).json({ message: "Trying to delete a doc you don't own" });
            return
        }
        res.status(200).json({ message: 'Content deleted' })

    } catch (e) {
        res.status(500).json({ message: "Error deleting content", error: e })
    }

})

app.post('/api/v1/brain/share', userMiddleware, async (req, res) => {
    const { share } = req.body;
    try {
        if (share) {
            const existingLink = await linkModel.findOne({
                userId: req.userId
            })
            if (existingLink) {
                res.status(400).json({
                    message: "You already have a link",
                    link: existingLink.hash
                })
                return;
            }
            const hashLink = Random(10)
            console.log(hashLink)
            await linkModel.create({
                userId: req.userId,
                hash: hashLink
            })
            res.status(200).json({
                message: "Link Created",
                link: hashLink
            })
        } else {
            await linkModel.deleteOne({
                userId: req.userId
            })
            res.status(200).json({ message: "Link deleted" })
        }
    } catch (e) {
        res.status(500).json({ message: "Error sharing link", error: e })
    }

})

app.get('/api/v1/brain/:shareLink', async (req, res)=>{
    const hash = req.params.shareLink
    const link = await linkModel.findOne({
        hash
    })
    if(!link){
        res.status(404).json({message: "Link not found"})
        return
    }
    const content = await contentModel.findOne({
        userId: link.userId
    })
    const user = await userModel.findOne({
        _id: link.userId
    })

    if(!user){
        res.status(404).json({message: "User not found , error should ideally not happen"})
        return
    }

    res.status(200).json({
        username:user.username,
        content:content

    })

})


async function main() {
    await mongoose.connect(mongoURI);
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
    console.log("Connected to MongoDB");
}

main();