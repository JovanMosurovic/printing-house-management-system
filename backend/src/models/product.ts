import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PrintingServiceSchema = new Schema({
    idUsluge: {
        type: String,
        required: [true, "Printing service ID is required"],
        trim: true
    },
    tipStampe: {
        type: String,
        required: [true, "Printing type is required"],
        trim: true
    },
    dodatnaCenaPoKomadu: {
        type: Number,
        required: [true, "Additional price is required"],
        min: [0, "Additional price cannot be negative"]
    },
    maxSirinaMm: {
        type: Number,
        required: [true, "Maximum width is required"],
        min: [1, "Maximum width must be greater than zero"]
    },
    maxVisinaMm: {
        type: Number,
        required: [true, "Maximum height is required"],
        min: [1, "Maximum height must be greater than zero"]
    }
}, {
    _id: false
});

let ProductSchema = new Schema({
    stamparijaId: {
        type: Schema.Types.ObjectId,
        required: [true, "Printing house ID is required"]
    },
    nazivStamparije: {
        type: String,
        required: [true, "Printing house name is required"],
        trim: true
    },
    sifra: {
        type: String,
        required: [true, "Product code is required"],
        trim: true
    },
    naziv: {
        type: String,
        required: [true, "Product name is required"],
        trim: true
    },
    opis: {
        type: String,
        required: [true, "Product description is required"],
        trim: true
    },
    kategorija: {
        type: String,
        required: [true, "Product category is required"],
        trim: true
    },
    potkategorija: {
        type: String,
        required: [true, "Product subcategory is required"],
        trim: true
    },
    jedinicnaCena: {
        type: Number,
        required: [true, "Unit price is required"],
        min: [0, "Unit price cannot be negative"]
    },
    kolicinaNaLageru: {
        type: Number,
        required: [true, "Stock quantity is required"],
        min: [0, "Stock quantity cannot be negative"],
        validate: {
            validator: Number.isInteger,
            message: "Stock quantity must be an integer"
        }
    },
    dostupneBoje: {
        type: [String],
        default: ["Bela"]
    },
    slikaUrl: {
        type: String,
        default: ""
    },
    dodatneSlike: {
        type: [String],
        default: [],
        validate: {
            validator: function (images: string[]) {
                return images.length <= 3;
            },
            message: "A product can have at most three additional images"
        }
    },
    uslugeStampe: {
        type: [PrintingServiceSchema],
        default: []
    },
    svidjanja: [{
        type: Schema.Types.ObjectId
    }],
    nesvidjanja: [{
        type: Schema.Types.ObjectId
    }]
}, {
    timestamps: true
});

export default mongoose.model("ProductModel", ProductSchema, "products");