import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ProcurementItemSchema = new Schema({
    productName: {
        type: String,
        required: [true, "Product name is required"],
        trim: true
    },
    category: {
        type: String,
        required: [true, "Product category is required"],
        trim: true
    },
    subcategory: {
        type: String,
        required: [true, "Product subcategory is required"],
        trim: true
    },
    color: {
        type: String,
        required: [true, "Product color is required"]
    },
    printingType: {
        type: String,
        required: [true, "Printing type is required"]
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be greater than zero"],
        validate: {
            validator: Number.isInteger,
            message: "Quantity must be an integer"
        }
    },
    preparationType: {
        type: String,
        enum: ["text", "image"],
        required: [true, "Preparation type is required"]
    },
    preparationText: {
        type: String,
        default: ""
    },
    preparationImage: {
        type: String,
        default: ""
    }
});

const OfferItemSchema = new Schema({
    procurementItemId: {
        type: Schema.Types.ObjectId,
        required: [true, "Procurement item ID is required"]
    },
    productId: {
        type: Schema.Types.ObjectId,
        required: [true, "Product ID is required"]
    },
    productCode: {
        type: String,
        required: [true, "Product code is required"]
    },
    productName: {
        type: String,
        required: [true, "Product name is required"]
    },
    printingServiceId: {
        type: String,
        required: [true, "Printing service ID is required"]
    },
    printingType: {
        type: String,
        required: [true, "Printing type is required"]
    },
    unitPrice: {
        type: Number,
        required: [true, "Unit price is required"],
        min: [0, "Unit price cannot be negative"]
    },
    additionalPricePerItem: {
        type: Number,
        required: [true, "Additional price is required"],
        min: [0, "Additional price cannot be negative"]
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be greater than zero"]
    },
    totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
        min: [0, "Total price cannot be negative"]
    }
}, {
    _id: false
});

const OfferSchema = new Schema({
    printerId: {
        type: Schema.Types.ObjectId,
        required: [true, "Printing house ID is required"]
    },
    printingHouseName: {
        type: String,
        required: [true, "Printing house name is required"]
    },
    printingHouseCity: {
        type: String,
        required: [true, "Printing house city is required"]
    },
    items: {
        type: [OfferItemSchema],
        validate: {
            validator: function (items: any[]) {
                return items.length > 0;
            },
            message: "Offer must contain at least one item"
        }
    },
    totalPrice: {
        type: Number,
        required: [true, "Offer total price is required"],
        min: [0, "Offer total price cannot be negative"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

let PublicProcurementSchema = new Schema({
    clientId: {
        type: Schema.Types.ObjectId,
        required: [true, "Client ID is required"]
    },
    clientUsername: {
        type: String,
        required: [true, "Client username is required"]
    },
    clientEmail: {
        type: String,
        required: [true, "Client email is required"]
    },
    institutionName: {
        type: String,
        required: [true, "Institution name is required"]
    },
    items: {
        type: [ProcurementItemSchema],
        validate: {
            validator: function (items: any[]) {
                return items.length > 0;
            },
            message: "Public procurement must contain at least one item"
        }
    },
    offers: {
        type: [OfferSchema],
        default: []
    },
    expiresAt: {
        type: Date,
        required: [true, "Expiration time is required"]
    },
    status: {
        type: String,
        enum: ["open", "completed", "unsuccessful"],
        default: "open"
    },
    winningOfferId: {
        type: Schema.Types.ObjectId,
        default: null
    },
    winningPrinterId: {
        type: Schema.Types.ObjectId,
        default: null
    },
    invoiceId: {
        type: Schema.Types.ObjectId,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.model(
    "PublicProcurementModel",
    PublicProcurementSchema,
    "publicProcurements"
);
