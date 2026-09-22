import express from 'express'
import { UserController } from '../controllers/user.controller'

const userRouter = express.Router()

userRouter.route("/admin/all").get(
    (req, res) =>
        new UserController().getAllUsers(req, res)
)

userRouter.route("/admin/update-user").post(
    (req, res) =>
        new UserController().adminUpdateUser(req, res)
)

userRouter.route("/admin/delete-user").post(
    (req, res) =>
        new UserController().deleteUser(req, res)
)

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

userRouter.route("/forgot-password").post(
    (req, res) =>
        new UserController().forgotPassword(req, res)
)

userRouter.route("/reset-password").post(
    (req, res) =>
        new UserController().resetPassword(req, res)
)



userRouter.route("/profile/update").post(
    (req, res) =>
        new UserController().updateUserProfile(req, res)
);

userRouter.route("/profile/:userId").get(
    (req, res) =>
        new UserController().getUserProfile(req, res)
);

export default userRouter;
