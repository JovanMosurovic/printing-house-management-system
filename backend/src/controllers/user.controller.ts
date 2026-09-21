import express from 'express'
import bcrypt from 'bcryptjs'

import UserModel from '../models/user';

export class UserController{

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

            user.lastLogin = new Date();
            await user.save();

            res.json(user)
        } catch (e) {
            console.log("Error in login.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

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
}