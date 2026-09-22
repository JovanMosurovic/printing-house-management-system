import mongoose from "mongoose";

const Schema = mongoose.Schema;

const InvoiceItemSchema = new Schema({
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
    color: {
        type: String,
        required: [true, "Product color is required"]
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
        min: [1, "Quantity must be greater than zero"],
        validate: {
            validator: Number.isInteger,
            message: "Quantity must be an integer"
        }
    },
    totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
        min: [0, "Total price cannot be negative"]
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
}, {
    _id: false
});

let InvoiceSchema = new Schema({
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
    printingHouseId: {
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
        type: [InvoiceItemSchema],
        validate: {
            validator: function (items: any[]) {
                return items.length > 0;
            },
            message: "Invoice must contain at least one item"
        }
    },
    totalPrice: {
        type: Number,
        required: [true, "Invoice total price is required"],
        min: [0, "Invoice total price cannot be negative"]
    },
    status: {
        type: String,
        enum: ["ordered", "inPrinting", "delivered", "received", "cancelled"],
        default: "ordered"
    },
    paymentMethod: {
        type: String,
        enum: ["", "card", "publicProcurement"],
        default: ""
    },
    paymentStatus: {
        type: String,
        enum: ["", "paid", "refunded", "notApplicable"],
        default: ""
    },
    cardLastFour: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

export default mongoose.model("InvoiceModel", InvoiceSchema, "invoices");
