import express from 'express'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import {imageSize} from 'image-size'
import crypto from 'crypto'

import UserModel from '../models/user';
import {EmailService} from '../services/email.service'
import {PublicProcurementController} from './public-procurement.controller'

export class UserController{

    // Returns all client and printing house accounts
    // Used on the administrator user management page
    async getAllUsers(req: express.Request, res: express.Response) {
        try {
            let users = await UserModel.find({role: {$ne: "admin"}}).sort({role: 1, username: 1});
            res.json(users);
        } catch (e) {
            console.log("Error while getting all users.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Validates and updates one client or printing house account
    // Used by the administrator to edit user account information and status
    async adminUpdateUser(req: express.Request, res: express.Response) {
        try {
            let userId = req.body.userId;
            let username = req.body.username?.trim();
            let firstName = req.body.firstName?.trim();
            let lastName = req.body.lastName?.trim();
            let phone = req.body.phone?.trim();
            let email = req.body.email?.trim().toLowerCase();
            let profileImage = req.body.profileImage;
            let status = req.body.status;
            let institution = req.body.institution;

            if (!userId || !username || !firstName || !lastName || !phone || !email || !status) {
                res.status(400).json({message: "All user information is required."});
                return;
            }

            if (status != "pending" && status != "approved" && status != "rejected") {
                res.status(400).json({message: "User status is not valid."});
                return;
            }

            let user = await UserModel.findById(userId);

            if (user == null) {
                res.status(404).json({message: "User was not found."});
                return;
            }

            if (user.role == "admin") {
                res.status(403).json({message: "Administrator account cannot be updated here."});
                return;
            }

            let userWithSameUsername = await UserModel.findOne({_id: {$ne: userId}, username: username});

            if (userWithSameUsername != null) {
                res.status(409).json({message: "Username is already in use."});
                return;
            }

            let userWithSameEmail = await UserModel.findOne({_id: {$ne: userId}, email: email});

            if (userWithSameEmail != null) {
                res.status(409).json({message: "Email address is already in use."});
                return;
            }

            if (user.role == "businessClient" || user.role == "printer") {
                if (institution == null) {
                    res.status(400).json({message: "Institution information is required."});
                    return;
                }

                let userWithSameRegistrationNumber = await UserModel.findOne({
                    _id: {$ne: userId},
                    "institution.registrationNumber": institution.registrationNumber
                });

                if (userWithSameRegistrationNumber != null) {
                    res.status(409).json({message: "Registration number is already in use."});
                    return;
                }

                let userWithSameTaxId = await UserModel.findOne({
                    _id: {$ne: userId},
                    "institution.taxId": institution.taxId
                });

                if (userWithSameTaxId != null) {
                    res.status(409).json({message: "Tax ID is already in use."});
                    return;
                }
            }

            if (profileImage) {
                try {
                    let imageMatch = profileImage.match(/^data:image\/(jpeg|png|gif);base64,(.+)$/);

                    if (imageMatch == null) {
                        res.status(400).json({message: "Profile image must be a JPG, PNG or GIF file."});
                        return;
                    }

                    let imageFormat = imageMatch[1];
                    let imageBuffer = Buffer.from(imageMatch[2], "base64");
                    let dimensions = imageSize(imageBuffer);
                    let expectedImageType = imageFormat == "jpeg" ? "jpg" : imageFormat;

                    if (dimensions.type != expectedImageType) {
                        res.status(400).json({message: "Profile image format is not valid."});
                        return;
                    }

                    if (dimensions.width < 100 || dimensions.height < 100 ||
                        dimensions.width > 250 || dimensions.height > 250) {
                        res.status(400).json({message: "Profile image dimensions must be between 100x100 and 250x250 pixels."});
                        return;
                    }
                } catch {
                    res.status(400).json({message: "Profile image must be a valid JPG, PNG or GIF file."});
                    return;
                }
            }

            user.username = username;
            user.firstName = firstName;
            user.lastName = lastName;
            user.phone = phone;
            user.email = email;
            user.status = status;

            if (profileImage) user.profileImage = profileImage;

            if (user.role == "businessClient" || user.role == "printer") user.institution = institution;

            await user.save();
            res.json(user);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "User ID is not valid."});
                return;
            }

            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];
                res.status(400).json({message: firstError.message});
                return;
            }

            if (e.code == 11000) {
                res.status(409).json({message: "Username or email address is already in use."});
                return;
            }

            console.log("Error while updating user account.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Deletes one client or printing house account
    // Used by the administrator to remove a user account from the system
    async deleteUser(req: express.Request, res: express.Response) {
        try {
            let userId = req.body.userId;

            if (!userId) {
                res.status(400).json({message: "User ID is required."});
                return;
            }

            let user = await UserModel.findById(userId);

            if (user == null) {
                res.status(404).json({message: "User was not found."});
                return;
            }

            if (user.role == "admin") {
                res.status(403).json({message: "Administrator account cannot be deleted."});
                return;
            }

            await UserModel.deleteOne({_id: userId});
            res.json({message: "User account was successfully deleted."});
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "User ID is not valid."});
                return;
            }

            console.log("Error while deleting user account.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Used by the separate administrator login page and returns only an approved administrator
    async adminLogin(req: express.Request, res: express.Response) {
        try {
            let username = req.body.username;
            let password = req.body.password;

            if (!username || !password) {
                res.status(400).json({message: "Username and password are required."});
                return;
            }

            let admin = await UserModel.findOne({
                username: username,
                role: "admin"
            }).select("+passwordHash");

            if (admin == null) {
                res.status(401).json({message: "Incorrect administrator username or password."});
                return;
            }

            let correctPassword = await bcrypt.compare(password, admin.passwordHash);

            if (!correctPassword) {
                res.status(401).json({message: "Incorrect administrator username or password."});
                return;
            }

            admin.lastLogin = new Date();
            await admin.save();

            res.json(admin);
        } catch (e) {
            console.log("Error in admin login.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Used on the administrator page to list all registration requests waiting for approval
    async getPendingUsers(req: express.Request, res: express.Response) {
        try {
            let users = await UserModel.find({
                status: "pending",
                role: {$ne: "admin"}
            }).sort({createdAt: 1});

            res.json(users);
        } catch (e) {
            console.log("Error while getting pending users.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Used by the public login form and returns an approved client or printing house
    async login(req: express.Request, res: express.Response) {
        try {
            let username = req.body.username;
            let password = req.body.password;

            if (!username || !password) {
                res.status(400).json({message: "Username and password are required."});
                return;
            }

            let user = await UserModel.findOne({
                username: username
            }).select("+passwordHash")

            if (user == null) {
                res.status(401).json({message: "Incorrect username or password."});
                return;
            }

            let correctPassword = await bcrypt.compare(password, user.passwordHash);

            if (!correctPassword) {
                res.status(401).json({message: "Incorrect username or password."});
                return;
            }

            if (user.role == "admin") {
                res.status(403).json({message: "Administrators must use the administrator login page."});
                return;
            }

            if (user.status == "pending") {
                res.status(403).json({message: "Your registration is waiting for administrator approval."});
                return;
            }

            if (user.status == "rejected") {
                res.status(403).json({message: "Your registration has been rejected."});
                return;
            }

            if (user.role == "businessClient") {
                await new PublicProcurementController().finishExpiredPublicProcurements(user._id.toString());
            }

            user.lastLogin = new Date();
            await user.save();

            res.json(user)
        } catch (e) {
            console.log("Error in login.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Used by the registration page to validate and create a new pending user request
    async register (req: express.Request, res: express.Response) {
        try {
            let username = req.body.username
            let password = req.body.password

            let firstName = req.body.firstName
            let lastName = req.body.lastName
            let phone = req.body.phone
            let email = req.body.email?.trim().toLowerCase()
            let role = req.body.role
            let institution = req.body.institution

            let profileImage = req.body.profileImage

            if (!profileImage) {
                let defaultImagePath = path.join(__dirname, "../../data/images/profiles/default_profile_image.jpg")
                let defaultImageBase64 = fs.readFileSync(defaultImagePath).toString("base64")

                profileImage = `data:image/jpeg;base64,${defaultImageBase64}`
            } else {
                try {
                    let imageMatch = profileImage.match(/^data:image\/(jpeg|png|gif);base64,(.+)$/)

                    if (imageMatch == null) {
                        res.status(400).json({message: "Profile image must be a JPG, PNG or GIF file."})
                        return
                    }

                    let imageFormat = imageMatch[1]
                    let imageBuffer = Buffer.from(imageMatch[2], "base64")
                    let dimensions = imageSize(imageBuffer)
                    let expectedImageType = imageFormat == "jpeg" ? "jpg" : imageFormat

                    if (dimensions.type != expectedImageType) {
                        res.status(400).json({message: "Profile image format is not valid."})
                        return
                    }

                    if (dimensions.width < 100 || dimensions.height < 100 ||
                        dimensions.width > 250 || dimensions.height > 250) {
                        res.status(400).json({message: "Profile image dimensions must be between 100x100 and 250x250 pixels."})
                        return
                    }
                } catch {
                    res.status(400).json({message: "Profile image must be a valid JPG, PNG or GIF file."})
                    return
                }
            }

            if (!password) {
                res.status(400).json({message: "Password is required"});
                return;
            }

            let passwordRegex = /^(?=[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

            if (!passwordRegex.test(password)) {
                res.status(400).json({
                    message: "Password must start with a letter, contain 8-12 characters, one uppercase letter, one number and one special character."
                });
                return;
            }

            if (role == "admin") {
                res.status(400).json({message: "Administrator cannot be registered. This is said in project instructions."})
                return;
            }

            let userWithSameUsername = await UserModel.findOne({username: username});

            if (userWithSameUsername != null) {
                res.status(409).json({message: "Username is already in use."});
                return;
            }

            let userWithSameEmail = await UserModel.findOne({email: email});

            if (userWithSameEmail != null) {
                res.status(409).json({message: "Email address is already in use."});
                return;
            }

            if ((role == "businessClient" || role == "printer") && institution != null) {
                let userWithSameRegistrationNumber = await UserModel.findOne({
                    "institution.registrationNumber": institution.registrationNumber
                });

                if (userWithSameRegistrationNumber != null) {
                    res.status(409).json({message: "Registration number is already in use."});
                    return;
                }

                let userWithSameTaxId = await UserModel.findOne({
                    "institution.taxId": institution.taxId
                });

                if (userWithSameTaxId != null) {
                    res.status(409).json({message: "Tax ID is already in use."});
                    return;
                }
            }

            let passwordHash = await bcrypt.hash(password, 8)

            await UserModel.insertOne({
                username: username,
                passwordHash: passwordHash,
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                email: email,
                profileImage: profileImage,
                role: role,
                status: "pending",
                institution: institution
            });

            res.status(201).json({message: "User successfully added."})
        } catch (e: any) {
            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];

                res.status(400).json({message: firstError.message});
                return;
            }

            if (e.code == 11000) {
                let duplicatedField = Object.keys(e.keyPattern)[0];

                if (duplicatedField == "username") {
                    res.status(409).json({message: "Username is already in use."});
                    return;
                }

                if (duplicatedField == "email") {
                    res.status(409).json({message: "Email address is already in use."});
                    return;
                }

                res.status(409).json({message: "Entered data already exists."});
                return;
            }

            console.log("Error in register.");
            res.status(500).json({message: "Unexpected server error."});
        }

    }

    // Used by the administrator to approve or reject a pending registration request
    async updateUserStatus(req: express.Request, res: express.Response) {
        try {
            let userId = req.body.userId;
            let status = req.body.status;

            if (!userId) {
                res.status(400).json({message: "User ID is required."});
                return;
            }

            if (status != "approved" && status != "rejected") {
                res.status(400).json({message: "Status must be approved or rejected."});
                return;
            }

            let user = await UserModel.findById(userId);

            if (user == null) {
                res.status(404).json({message: "User not found."});
                return;
            }

            if (user.role == "admin") {
                res.status(400).json({message: "Administrator status cannot be changed."});
                return;
            }

            if (user.status != "pending") {
                res.status(409).json({message: "Registration has already been processed."});
                return;
            }

            user.status = status;
            await user.save();

            if (status == "approved") {
                res.json({message: "User registration successfully approved."});
            } else {
                res.json({message: "User registration successfully rejected."});
            }
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Invalid user ID."});
                return;
            }

            console.log("Error while updating user status.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Used by the forgot password page to create and email a five-minute reset link
    async forgotPassword(req: express.Request, res: express.Response) {
        try {
            let usernameOrEmail = req.body.usernameOrEmail?.trim()

            if (!usernameOrEmail) {
                res.status(400).json({message: "Username or email is required."})
                return
            }

            let user = await UserModel.findOne({
                $or: [
                    {username: usernameOrEmail},
                    {email: usernameOrEmail.toLowerCase()}
                ]
            })

            if (user == null) {
                res.status(404).json({message: "User was not found."})
                return
            }

            let resetToken = crypto.randomBytes(32).toString("hex")
            let resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")

            user.passwordResetTokenHash = resetTokenHash
            user.passwordResetExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
            await user.save()

            let frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200"
            let resetLink = `${frontendUrl}/reset-password/${resetToken}`

            await new EmailService().sendPasswordResetEmail(user.email, resetLink)

            res.json({message: "Reset link was sent to your email."})
        } catch (e) {
            console.log("Error while creating password reset link.")
            res.status(500).json({message: "Unexpected server error."})
        }
    }

    // Used by the reset password page to validate the token and save the new password
    async resetPassword(req: express.Request, res: express.Response) {
        try {
            let token = req.body.token
            let newPassword = req.body.newPassword
            let confirmPassword = req.body.confirmPassword

            if (!token || !newPassword || !confirmPassword) {
                res.status(400).json({message: "Token, new password and password confirmation are required."})
                return
            }

            if (newPassword != confirmPassword) {
                res.status(400).json({message: "Passwords do not match."})
                return
            }

            let passwordRegex = /^(?=[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/

            if (!passwordRegex.test(newPassword)) {
                res.status(400).json({
                    message: "Password must start with a letter, contain 8-12 characters, one uppercase letter, one number and one special character."
                })
                return
            }

            let resetTokenHash = crypto.createHash("sha256").update(token).digest("hex")

            let user = await UserModel.findOne({
                passwordResetTokenHash: resetTokenHash,
                passwordResetExpiresAt: {$gt: new Date()}
            }).select("+passwordResetTokenHash +passwordResetExpiresAt")

            if (user == null) {
                res.status(400).json({message: "Password reset link is invalid or has expired."})
                return
            }

            user.passwordHash = await bcrypt.hash(newPassword, 8)
            user.passwordResetTokenHash = null
            user.passwordResetExpiresAt = null
            await user.save()

            res.json({message: "Password was successfully changed."})
        } catch (e) {
            console.log("Error while resetting password.")
            res.status(500).json({message: "Unexpected server error."})
        }
    }

    // Used on client and printing house profile pages to load current user information
    async getUserProfile(req: express.Request, res: express.Response) {
        try {
            let userId = req.params.userId;

            let user = await UserModel.findById(userId);

            if (user == null) {
                res.status(404).json({message: "User was not found."});
                return;
            }

            if (user.role == "admin") {
                res.status(403).json({
                    message: "Administrator profile is not available here."
                });
                return;
            }

            res.json(user);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "User ID is not valid."});
                return;
            }

            console.log("Error while getting user profile.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Used on client and printing house profile pages to validate and save profile changes
    async updateUserProfile(req: express.Request, res: express.Response) {
        try {
            let userId = req.body.userId;
            let firstName = req.body.firstName;
            let lastName = req.body.lastName;
            let phone = req.body.phone;
            let email = req.body.email?.trim().toLowerCase();
            let profileImage = req.body.profileImage;
            let institution = req.body.institution;
            let currentPassword = typeof req.body.currentPassword == "string" ? req.body.currentPassword : "";
            let newPassword = typeof req.body.newPassword == "string" ? req.body.newPassword : "";
            let confirmPassword = typeof req.body.confirmPassword == "string" ? req.body.confirmPassword : "";

            if (!userId || !firstName || !lastName || !phone || !email) {
                res.status(400).json({message: "All personal information is required."});
                return;
            }

            let user = await UserModel.findById(userId).select("+passwordHash");

            if (user == null) {
                res.status(404).json({message: "User was not found."});
                return;
            }

            if (user.role == "admin") {
                res.status(403).json({message: "Administrator profile cannot be updated here."});
                return;
            }

            let passwordChangeRequested = currentPassword != "" || newPassword != "" || confirmPassword != "";

            if (passwordChangeRequested) {
                if (!currentPassword || !newPassword || !confirmPassword) {
                    res.status(400).json({message: "Current password, new password and password confirmation are required."});
                    return;
                }

                if (newPassword != confirmPassword) {
                    res.status(400).json({message: "Passwords do not match."});
                    return;
                }

                let passwordRegex = /^(?=[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

                if (!passwordRegex.test(newPassword)) {
                    res.status(400).json({message: "Password must start with a letter, contain 8-12 characters, one uppercase letter, one number and one special character."});
                    return;
                }

                let correctPassword = await bcrypt.compare(currentPassword, user.passwordHash);

                if (!correctPassword) {
                    res.status(401).json({message: "Current password is not correct."});
                    return;
                }
            }

            let userWithSameEmail = await UserModel.findOne({
                _id: {$ne: userId},
                email: email
            });

            if (userWithSameEmail != null) {
                res.status(409).json({message: "Email address is already in use."});
                return;
            }

            if (user.role == "businessClient" || user.role == "printer") {
                if (institution == null) {
                    res.status(400).json({message: "Institution information is required."});
                    return;
                }

                let userWithSameRegistrationNumber = await UserModel.findOne({
                    _id: {$ne: userId},
                    "institution.registrationNumber":
                    institution.registrationNumber
                });

                if (userWithSameRegistrationNumber != null) {
                    res.status(409).json({message: "Registration number is already in use."});
                    return;
                }

                let userWithSameTaxId = await UserModel.findOne({
                    _id: {$ne: userId},
                    "institution.taxId": institution.taxId
                });

                if (userWithSameTaxId != null) {
                    res.status(409).json({message: "Tax ID is already in use."});
                    return;
                }
            }

            if (profileImage) {
                try {
                    let imageMatch =
                        profileImage.match(/^data:image\/(jpeg|png|gif);base64,(.+)$/);

                    if (imageMatch == null) {
                        res.status(400).json({message: "Profile image must be a JPG, PNG or GIF file."});
                        return;
                    }

                    let imageFormat = imageMatch[1];
                    let imageBuffer = Buffer.from(imageMatch[2], "base64");

                    let dimensions = imageSize(imageBuffer);

                    let expectedImageType =
                        imageFormat == "jpeg" ? "jpg" : imageFormat;

                    if (dimensions.type != expectedImageType) {
                        res.status(400).json({message: "Profile image format is not valid."});
                        return;
                    }

                    if (dimensions.width < 100 ||
                        dimensions.height < 100 ||
                        dimensions.width > 250 ||
                        dimensions.height > 250) {
                        res.status(400).json({message: "Profile image dimensions must be between 100x100 and 250x250 pixels."});
                        return;
                    }
                } catch {
                    res.status(400).json({
                        message: "Profile image must be a valid JPG, PNG or GIF file."});
                    return;
                }
            }

            user.firstName = firstName;
            user.lastName = lastName;
            user.phone = phone;
            user.email = email;

            if (profileImage) {
                user.profileImage = profileImage;
            }

            if (user.role == "businessClient" ||
                user.role == "printer") {
                user.institution = institution;
            }

            if (passwordChangeRequested) user.passwordHash = await bcrypt.hash(newPassword, 8);

            await user.save();

            res.json(user);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "User ID is not valid."});
                return;
            }

            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];

                res.status(400).json({message: firstError.message});
                return;
            }

            console.log("Error while updating user profile.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }
}
