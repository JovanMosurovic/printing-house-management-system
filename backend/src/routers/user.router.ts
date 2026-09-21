import express from 'express'
import { UserController } from '../controllers/user.controller'

const userRouter = express.Router()

userRouter.route("/admin/login").post(
    (req, res) =>
        new UserController().adminLogin(req, res)
)

userRouter.route("/admin/pending").get(
    (req, res) =>
        new UserController().getPendingUsers(req, res)
)

userRouter.route("/admin/update-user-status").post(
    (req, res) =>
        new UserController().updateUserStatus(req, res)
)

userRouter.route("/login").post(
    (req, res) =>
        new UserController().login(req, res)
)

userRouter.route("/register").post(
    (req, res) =>
        new UserController().register(req, res)
)

export default userRouter;