import mongoose from "mongoose";

const Schema = mongoose.Schema;

let CategorySchema = new Schema({
        naziv: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true
        },
        potkategorije: [{
            type: String,
            required: true,
            trim: true
        }]
    },
    {
        timestamps: true
    });

export default mongoose.model("CategoryModel", CategorySchema, "categories");