import express from "express";
import {imageSize} from "image-size";
import InvoiceModel from "../models/invoice";
import ProductModel from "../models/product";
import UserModel from "../models/user";
import {InvoicePdfService} from "../services/invoice-pdf.service";
import {EmailService} from "../services/email.service";

export class InvoiceController {

    // Returns all non-cancelled invoices that belong to one printing house
    async getPrintingHouseInvoices(req: express.Request, res: express.Response) {
        try {
            let printerId = req.params.printerId;
            let printer = await UserModel.findOne({_id: printerId, role: "printer", status: "approved"});

            if (printer == null) {
                res.status(404).json({message: "Approved printing house was not found."});
                return;
            }

            let invoices = await InvoiceModel.find({
                printingHouseId: printerId,
                status: {$ne: "cancelled"}
            }).sort({createdAt: -1});

            res.json(invoices);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Printing house ID is not valid."});
                return;
            }

            console.log("Error while getting printing house invoices.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Changes an invoice from ordered to in printing or from in printing to delivered
    async updateInvoiceStatus(req: express.Request, res: express.Response) {
        try {
            let printerId = req.body.printerId;
            let invoiceId = req.body.invoiceId;
            let newStatus = req.body.status;

            if (!printerId || !invoiceId || !newStatus) {
                res.status(400).json({message: "Printing house ID, invoice ID and status are required."});
                return;
            }

            let printer = await UserModel.findOne({_id: printerId, role: "printer", status: "approved"});

            if (printer == null) {
                res.status(404).json({message: "Approved printing house was not found."});
                return;
            }

            let invoice = await InvoiceModel.findOne({_id: invoiceId, printingHouseId: printerId});

            if (invoice == null) {
                res.status(404).json({message: "Invoice was not found."});
                return;
            }

            let validTransition =
                (invoice.status == "ordered" && newStatus == "inPrinting") ||
                (invoice.status == "inPrinting" && newStatus == "delivered");

            if (!validTransition) {
                res.status(409).json({message: "Requested order status change is not allowed."});
                return;
            }

            invoice.status = newStatus;
            await invoice.save();

            res.json({message: "Order status was successfully updated."});
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Entered ID is not valid."});
                return;
            }

            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];
                res.status(400).json({message: firstError.message});
                return;
            }

            console.log("Error while updating invoice status.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Returns all invoices that belong to one client
    async getClientInvoices(req: express.Request, res: express.Response) {
        try {
            let clientId = req.params.clientId;
            let client = await UserModel.findById(clientId);

            if (client == null) {
                res.status(404).json({message: "Client was not found."});
                return;
            }

            if (client.role != "individualClient" && client.role != "businessClient") {
                res.status(403).json({message: "Entered user is not a client."});
                return;
            }

            let invoices = await InvoiceModel.find({
                clientId: clientId,
                status: {$ne: "cancelled"}
            }).sort({createdAt: -1});
            res.json(invoices);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Client ID is not valid."});
                return;
            }

            console.log("Error while getting client invoices.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Cancels an ordered invoice and restores product quantities to stock
    async cancelInvoice(req: express.Request, res: express.Response) {
        try {
            let clientId = req.body.clientId;
            let invoiceId = req.body.invoiceId;

            if (!clientId || !invoiceId) {
                res.status(400).json({message: "Client ID and invoice ID are required."});
                return;
            }

            let invoice = await InvoiceModel.findOne({_id: invoiceId, clientId: clientId});

            if (invoice == null) {
                res.status(404).json({message: "Invoice was not found."});
                return;
            }

            if (invoice.status != "ordered") {
                res.status(409).json({message: "Only an ordered invoice can be cancelled."});
                return;
            }

            let productsToRestore: any[] = [];

            for (let invoiceItem of invoice.items) {
                let productToRestore: any = null;

                for (let currentProductToRestore of productsToRestore) {
                    if (currentProductToRestore.productId.toString() == invoiceItem.productId.toString()) {
                        productToRestore = currentProductToRestore;
                    }
                }

                if (productToRestore == null) {
                    productToRestore = {
                        productId: invoiceItem.productId,
                        quantity: 0,
                        product: null
                    };
                    productsToRestore.push(productToRestore);
                }

                productToRestore.quantity += invoiceItem.quantity;
            }

            for (let productToRestore of productsToRestore) {
                productToRestore.product = await ProductModel.findById(productToRestore.productId);

                if (productToRestore.product == null) {
                    res.status(404).json({message: "One of the ordered products was not found."});
                    return;
                }
            }

            for (let productToRestore of productsToRestore) {
                productToRestore.product.kolicinaNaLageru += productToRestore.quantity;
                await productToRestore.product.save();
            }

            invoice.status = "cancelled";
            await invoice.save();

            res.json({message: "Order was successfully cancelled."});
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Entered ID is not valid."});
                return;
            }

            console.log("Error while cancelling invoice.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Creates one invoice for each printing house represented in the shopping cart
    async confirmOrder(req: express.Request, res: express.Response) {
        try {
            let clientId = req.body.clientId;
            let cartItems = req.body.items;

            if (!clientId) {
                res.status(400).json({message: "Client ID is required."});
                return;
            }

            if (!Array.isArray(cartItems) || cartItems.length == 0) {
                res.status(400).json({message: "The shopping cart is empty."});
                return;
            }

            let client = await UserModel.findById(clientId);

            if (client == null) {
                res.status(404).json({message: "Client was not found."});
                return;
            }

            if (client.status != "approved") {
                res.status(403).json({message: "Only approved clients can create orders."});
                return;
            }

            if (client.role == "businessClient") {
                res.status(400).json({message: "Business clients must create a public procurement."});
                return;
            }

            if (client.role != "individualClient") {
                res.status(403).json({message: "Only clients can create orders."});
                return;
            }

            let requestedProducts: any[] = [];
            let invoiceGroups: any[] = [];

            for (let cartItem of cartItems) {
                if (!cartItem.productId || !cartItem.printingServiceId || !cartItem.color) {
                    res.status(400).json({message: "Product, color and printing service are required."});
                    return;
                }

                if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) {
                    res.status(400).json({message: "Product quantity must be a positive integer."});
                    return;
                }

                if (cartItem.preparationType != "text" && cartItem.preparationType != "image") {
                    res.status(400).json({message: "Preparation type must be text or image."});
                    return;
                }

                let preparationText = cartItem.preparationText?.trim() || "";
                let preparationImage = cartItem.preparationImage || "";

                if (cartItem.preparationType == "text" && !preparationText) {
                    res.status(400).json({message: "Preparation text is required."});
                    return;
                }

                if (cartItem.preparationType == "image") {
                    try {
                        let imageMatch = preparationImage.match(/^data:image\/(jpeg|png|gif);base64,(.+)$/);

                        if (imageMatch == null) {
                            res.status(400).json({message: "Preparation image must be a JPG, PNG or GIF file."});
                            return;
                        }

                        let imageFormat = imageMatch[1];
                        let imageBuffer = Buffer.from(imageMatch[2], "base64");
                        let dimensions = imageSize(imageBuffer);
                        let expectedImageType = imageFormat == "jpeg" ? "jpg" : imageFormat;

                        if (dimensions.type != expectedImageType) {
                            res.status(400).json({message: "Preparation image format is not valid."});
                            return;
                        }
                    } catch {
                        res.status(400).json({message: "Preparation image must be a valid JPG, PNG or GIF file."});
                        return;
                    }
                }

                let product = await ProductModel.findById(cartItem.productId);

                if (product == null || product.kolicinaNaLageru < 1) {
                    res.status(404).json({message: "One of the selected products is no longer available."});
                    return;
                }

                let printer = await UserModel.findOne({
                    _id: product.stamparijaId,
                    role: "printer",
                    status: "approved"
                });

                if (printer == null) {
                    res.status(404).json({message: "Printing house for one of the products is not available."});
                    return;
                }

                let availableColors = product.dostupneBoje.length > 0 ? product.dostupneBoje : ["Bela"];

                if (!availableColors.includes(cartItem.color)) {
                    res.status(400).json({message: `Selected color is not available for product ${product.naziv}.`});
                    return;
                }

                let selectedPrintingService: any = null;

                for (let printingService of product.uslugeStampe) {
                    if (printingService.idUsluge == cartItem.printingServiceId) selectedPrintingService = printingService;
                }

                if (selectedPrintingService == null) {
                    res.status(400).json({message: `Selected printing service is not available for product ${product.naziv}.`});
                    return;
                }

                let requestedProduct: any = null;

                for (let currentRequestedProduct of requestedProducts) {
                    if (currentRequestedProduct.product._id.toString() == product._id.toString()) {
                        requestedProduct = currentRequestedProduct;
                    }
                }

                if (requestedProduct == null) {
                    requestedProduct = {
                        product: product,
                        quantity: 0
                    };
                    requestedProducts.push(requestedProduct);
                }

                requestedProduct.quantity += cartItem.quantity;

                if (requestedProduct.quantity > product.kolicinaNaLageru) {
                    res.status(409).json({message: `There are not enough ${product.naziv} products currently in stock.`});
                    return;
                }

                let itemTotalPrice = (product.jedinicnaCena + selectedPrintingService.dodatnaCenaPoKomadu) * cartItem.quantity;

                let preparedItem = {
                    productId: product._id,
                    productCode: product.sifra,
                    productName: product.naziv,
                    color: cartItem.color,
                    printingServiceId: selectedPrintingService.idUsluge,
                    printingType: selectedPrintingService.tipStampe,
                    unitPrice: product.jedinicnaCena,
                    additionalPricePerItem: selectedPrintingService.dodatnaCenaPoKomadu,
                    quantity: cartItem.quantity,
                    totalPrice: itemTotalPrice,
                    preparationType: cartItem.preparationType,
                    preparationText: cartItem.preparationType == "text" ? preparationText : "",
                    preparationImage: cartItem.preparationType == "image" ? preparationImage : ""
                };

                let invoiceGroup: any = null;

                for (let currentInvoiceGroup of invoiceGroups) {
                    if (currentInvoiceGroup.printingHouseId.toString() == product.stamparijaId.toString()) {
                        invoiceGroup = currentInvoiceGroup;
                    }
                }

                if (invoiceGroup == null) {
                    invoiceGroup = {
                        printingHouseId: product.stamparijaId,
                        printingHouseName: product.nazivStamparije,
                        printingHouseCity: printer.institution?.city || "",
                        items: [],
                        totalPrice: 0
                    };
                    invoiceGroups.push(invoiceGroup);
                }

                invoiceGroup.items.push(preparedItem);
                invoiceGroup.totalPrice += itemTotalPrice;
            }

            for (let requestedProduct of requestedProducts) {
                requestedProduct.product.kolicinaNaLageru -= requestedProduct.quantity;
                await requestedProduct.product.save();
            }

            let createdInvoices = [];

            for (let invoiceGroup of invoiceGroups) {
                let invoice = new InvoiceModel({
                    clientId: client._id,
                    clientUsername: client.username,
                    clientEmail: client.email,
                    printingHouseId: invoiceGroup.printingHouseId,
                    printingHouseName: invoiceGroup.printingHouseName,
                    printingHouseCity: invoiceGroup.printingHouseCity,
                    items: invoiceGroup.items,
                    totalPrice: invoiceGroup.totalPrice,
                    status: "ordered"
                });

                await invoice.save();
                createdInvoices.push(invoice);
            }

            let emailSent = true;

            try {
                let attachments = [];
                let invoicePdfService = new InvoicePdfService();

                for (let invoice of createdInvoices) {
                    let pdfBuffer = await invoicePdfService.createInvoicePdf(invoice);

                    attachments.push({
                        filename: `invoice_${invoice._id}.pdf`,
                        content: pdfBuffer
                    });
                }

                await new EmailService().sendInvoiceEmail(client.email, attachments);
            } catch (emailError) {
                emailSent = false;
                console.log("Order was confirmed, but invoice email could not be sent.");
            }

            let responseMessage = emailSent
                ? "Order was successfully confirmed. Invoices were sent to your email address."
                : "Order was successfully confirmed, but invoices could not be sent to your email address.";

            res.status(201).json({
                message: responseMessage,
                invoices: createdInvoices,
                emailSent: emailSent
            });
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Entered ID is not valid."});
                return;
            }

            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];
                res.status(400).json({message: firstError.message});
                return;
            }

            console.log("Error while confirming order.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }
}
