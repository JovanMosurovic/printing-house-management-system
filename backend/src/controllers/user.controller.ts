import express from 'express'
import bcrypt from 'bcryptjs'

import UserModel from '../models/user';

export class UserController{
    async login(req: express.Request, res: express.Response) {
        try {
            let username = req.body.username;
            let password = req.body.password;
            let role = req.body.role;

            let user = await UserModel.findOne({
                username: username,
                role: role
            }).select("+passwordHash")

            if (user == null) {
                res.json(null);
                return;
            }

            if (user.status != "approved") {
                res.json(null);
                return;
            }

            let correctPassword = await bcrypt.compare(password, user.passwordHash)
            if (!correctPassword) {
                res.json(null);
                return;
            }

            user.lastLogin = new Date();
            await user.save();

            res.json(user)
        } catch (e) {
            console.log("Error in login.");
            res.json(null);
        }
    }

    async register (req: express.Request, res: express.Response) {
        try {
            let username = req.body.username
            let password = req.body.password

            let firstName = req.body.firstName
            let lastName = req.body.lastName
            let phone = req.body.phone
            let email = req.body.email
            let role = req.body.role
            let institution = req.body.institution

            if (!password) {
                res.status(400).json({message: "Password is required"});
                return;
            }

            if (role == "admin") {
                res.status(400).json({message: "Administrator cannot be registered. This is said in project instructions."})
                return;
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
        } catch (e) {
            console.log("Error in register.")

            res.json({ message: "Error" });
        }

    }
}