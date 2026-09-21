import express from 'express'
import { UserController } from '../controllers/user.controller'

const userRouter = express.Router()

userRouter.route("/admin/login").post(
    (req, res)=>
        new UserController().adminLogin(req, res)
)

userRouter.route("/login").post(
    (req, res)=>
        new UserController().login(req, res)
)

userRouter.route("/register").post(
    (req, res)=>
        new UserController().register(req, res)
)

export default userRouter;