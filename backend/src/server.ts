import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import userRouter from './routers/user.router'
import mongoose from 'mongoose'

const app = express()
app.use(cors())
app.use(express.json({limit: "10mb"}))

mongoose.connect("mongodb://127.0.0.1:27017/printing-house-management-system");

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB on port 27017");
})

const router = express.Router()
router.use("/api/users", userRouter)

app.use("/", router)
app.listen(4000, ()=> console.log("Express running on port 4000!"))