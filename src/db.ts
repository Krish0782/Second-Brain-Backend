import { hash } from "crypto";
import mongoose from "mongoose";

const Schema = mongoose.Schema
const ObjectID = mongoose.Types.ObjectId

const userSchema = new Schema({
    username: String,
    email: { type: String, unique: true },
    password: String
})
const contentSchema = new Schema({
    type: { type: String, required: true, enum: ["document", "tweet", "youtube", "link"] },
    link: { type: String, required: true },
    title: { type: String, required: true },
    tags: { type: [String], default: [] },
    userId: { type: ObjectID, ref: "user", required: true }
})
const linkSchema = new Schema({
    hash: String,
    userId: { type: ObjectID, ref: "user", required: true, unique: true }
})


export const contentModel = mongoose.model("content", contentSchema)
export const userModel = mongoose.model("user", userSchema);
export const linkModel = mongoose.model("links", linkSchema)
