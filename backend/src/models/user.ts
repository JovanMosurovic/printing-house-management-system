import mongoose from "mongoose";

const Schema = mongoose.Schema;

const InstitutionSchema = new Schema({
    name: {
        type: String,
        required: [true, "Institution name is required"],
    },
    address: {
        type: String,
        required: [true, "Institution address is required"],
    },
    registrationNumber: {
        type: String,
        required: [true, "Registration number is required"],
        match: [
            /^\d{8}$/,
            "Registration number must contain exactly 8 digits"
        ]
    },
    taxId: {
        type: String,
        required: [true, "Tax ID is required"],
        match: [
            /^[1-9]\d{8}$/,
            "Tax ID must contain 9 digits and cannot start with zero"
        ]
    }
});

let UserSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Email address is not valid"
        ]
    },
    profileImage: {
        type: String,
        required: [true, "Profile image is required"]
    },
    role: {
        type: String,
        enum: ["individualClient", "businessClient", "printer", "admin"],
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    institution: {
        type: InstitutionSchema,
        required: function (this: any) {
            return (this.role === "businessClient" || this.role === "printer");
        }
    },
    lastLogin: {
        type: Date,
        default: null
    }},
    {
        timestamps: true
    }
);

UserSchema.set("toJSON", {
    transform: function (_, returnedObject: any) {
        delete returnedObject.passwordHash;
        return returnedObject;
    }
});

export default mongoose.model("UserModel", UserSchema, "users");