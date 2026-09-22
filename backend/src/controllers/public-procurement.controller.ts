import express from "express";
import {imageSize} from "image-size";

import PublicProcurementModel from "../models/public-procurement";
import ProductModel from "../models/product";
import UserModel from "../models/user";
import InvoiceModel from "../models/invoice";
import {EmailService} from "../services/email.service";
import {InvoicePdfService} from "../services/invoice-pdf.service";
import {PublicProcurementPdfService} from "../services/public-procurement-pdf.service";

export class PublicProcurementController {

    // Creates and downloads a report containing every offer and the selected winner
    // Used by a business client after their public procurement has finished
    async downloadPublicProcurementReport(req: express.Request, res: express.Response) {
        try {
            let clientId = req.params.clientId;
            let publicProcurementId = req.params.publicProcurementId;

            let publicProcurement = await PublicProcurementModel.findOne({
                _id: publicProcurementId,
                clientId: clientId
            });

            if (publicProcurement == null) {
                res.status(404).json({message: "Public procurement was not found."});
                return;
            }

            if (publicProcurement.status == "open") {
                res.status(409).json({message: "The report is available after the public procurement has finished."});
                return;
            }

            let pdf = await new PublicProcurementPdfService().createPublicProcurementReportPdf(publicProcurement);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="public_procurement_${publicProcurement._id}.pdf"`);
            res.send(pdf);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Entered ID is not valid."});
                return;
            }

            console.log("Error while creating public procurement report.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Returns all currently open public procurements for one approved printing house
    // Used on the printing house auctions page to list procurements and show whether an offer was submitted
    async getOpenPublicProcurements(req: express.Request, res: express.Response) {
        try {
            let printerId = req.params.printerId;
            let printer = await UserModel.findOne({_id: printerId, role: "printer", status: "approved"});

            if (printer == null) {
                res.status(404).json({message: "Approved printing house was not found."});
                return;
            }

            let publicProcurements = await PublicProcurementModel.find({
                status: "open",
                expiresAt: {$gt: new Date()}
            }).sort({createdAt: 1});

            let preparedPublicProcurements = [];

            for (let publicProcurement of publicProcurements) {
                let hasSubmittedOffer = false;

                for (let offer of publicProcurement.offers) {
                    if (offer.printerId.toString() == printerId) hasSubmittedOffer = true;
                }

                preparedPublicProcurements.push({
                    _id: publicProcurement._id,
                    institutionName: publicProcurement.institutionName,
                    items: publicProcurement.items,
                    expiresAt: publicProcurement.expiresAt,
                    status: publicProcurement.status,
                    createdAt: publicProcurement.createdAt,
                    hasSubmittedOffer: hasSubmittedOffer,
                    numberOfOffers: publicProcurement.offers.length
                });
            }

            res.json(preparedPublicProcurements);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Printing house ID is not valid."});
                return;
            }

            console.log("Error while getting open public procurements.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Creates one complete offer using matching products and services from a printing house
    // Used when a printing house submits an offer for every requested item in an open public procurement
    async submitOffer(req: express.Request, res: express.Response) {
        try {
            let printerId = req.body.printerId;
            let publicProcurementId = req.body.publicProcurementId;

            if (!printerId || !publicProcurementId) {
                res.status(400).json({message: "Printing house ID and public procurement ID are required."});
                return;
            }

            let printer = await UserModel.findOne({_id: printerId, role: "printer", status: "approved"});

            if (printer == null) {
                res.status(404).json({message: "Approved printing house was not found."});
                return;
            }

            let publicProcurement = await PublicProcurementModel.findById(publicProcurementId);

            if (publicProcurement == null) {
                res.status(404).json({message: "Public procurement was not found."});
                return;
            }

            if (publicProcurement.status != "open" || publicProcurement.expiresAt <= new Date()) {
                res.status(409).json({message: "Public procurement is no longer open."});
                return;
            }

            for (let offer of publicProcurement.offers) {
                if (offer.printerId.toString() == printerId) {
                    res.status(409).json({message: "This printing house has already submitted an offer."});
                    return;
                }
            }

            let products = await ProductModel.find({stamparijaId: printerId, kolicinaNaLageru: {$gt: 0}});
            let offerItems: any[] = [];
            let offerTotalPrice = 0;

            for (let procurementItem of publicProcurement.items) {
                let selectedProduct: any = null;
                let selectedPrintingService: any = null;

                for (let product of products) {
                    if (selectedProduct != null) continue;

                    if (product.naziv != procurementItem.productName ||
                        product.kategorija != procurementItem.category ||
                        product.potkategorija != procurementItem.subcategory) continue;

                    let availableColors = product.dostupneBoje.length > 0 ? product.dostupneBoje : ["Bela"];

                    if (!availableColors.includes(procurementItem.color)) continue;

                    let alreadyRequiredQuantity = 0;

                    for (let offerItem of offerItems) {
                        if (offerItem.productId.toString() == product._id.toString()) {
                            alreadyRequiredQuantity += offerItem.quantity;
                        }
                    }

                    if (alreadyRequiredQuantity + procurementItem.quantity > product.kolicinaNaLageru) continue;

                    for (let printingService of product.uslugeStampe) {
                        if (printingService.tipStampe == procurementItem.printingType) {
                            selectedProduct = product;
                            selectedPrintingService = printingService;
                        }
                    }
                }

                if (selectedProduct == null || selectedPrintingService == null) {
                    res.status(409).json({message: `The printing house cannot provide all requested items. Missing: ${procurementItem.productName}.`});
                    return;
                }

                let itemTotalPrice =
                    (selectedProduct.jedinicnaCena + selectedPrintingService.dodatnaCenaPoKomadu) *
                    procurementItem.quantity;

                offerItems.push({
                    procurementItemId: procurementItem._id,
                    productId: selectedProduct._id,
                    productCode: selectedProduct.sifra,
                    productName: selectedProduct.naziv,
                    printingServiceId: selectedPrintingService.idUsluge,
                    printingType: selectedPrintingService.tipStampe,
                    unitPrice: selectedProduct.jedinicnaCena,
                    additionalPricePerItem: selectedPrintingService.dodatnaCenaPoKomadu,
                    quantity: procurementItem.quantity,
                    totalPrice: itemTotalPrice
                });

                offerTotalPrice += itemTotalPrice;
            }

            publicProcurement.offers.push({
                printerId: printer._id,
                printingHouseName: printer.institution?.name || "",
                printingHouseCity: printer.institution?.city || "",
                items: offerItems,
                totalPrice: offerTotalPrice,
                createdAt: new Date()
            });

            await publicProcurement.save();

            let savedOffer = publicProcurement.offers[publicProcurement.offers.length - 1];
            res.status(201).json({message: "Offer was successfully submitted.", offer: savedOffer});
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

            console.log("Error while submitting public procurement offer.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Returns all public procurements created by one approved business client
    // Used on the business client public procurements page after finishing all expired procurements
    async getClientPublicProcurements(req: express.Request, res: express.Response) {
        try {
            let clientId = req.params.clientId as string;
            let client = await UserModel.findOne({_id: clientId, role: "businessClient", status: "approved"});

            if (client == null) {
                res.status(404).json({message: "Approved business client was not found."});
                return;
            }

            await this.finishExpiredPublicProcurements(clientId);

            let publicProcurements = await PublicProcurementModel.find({clientId: clientId}).sort({createdAt: -1});
            res.json(publicProcurements);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Client ID is not valid."});
                return;
            }

            console.log("Error while getting client public procurements.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Finishes all expired public procurements created by one business client
    // Used during the client's next login and when opening the public procurements page
    async finishExpiredPublicProcurements(clientId: string) {
        let publicProcurements = await PublicProcurementModel.find({
            clientId: clientId,
            status: "open",
            expiresAt: {$lte: new Date()}
        });

        for (let publicProcurement of publicProcurements) {
            let sortedOffers = [];

            for (let offer of publicProcurement.offers) sortedOffers.push(offer);

            sortedOffers.sort((firstOffer, secondOffer) => firstOffer.totalPrice - secondOffer.totalPrice);

            let winningOffer: any = null;
            let winningPrinter: any = null;
            let winningProducts: any[] = [];
            let invoiceItems: any[] = [];

            for (let offer of sortedOffers) {
                if (winningOffer != null) continue;

                let printer = await UserModel.findOne({_id: offer.printerId, role: "printer", status: "approved"});

                if (printer == null || offer.items.length != publicProcurement.items.length) continue;

                let offerIsValid = true;
                let currentProducts: any[] = [];
                let currentInvoiceItems: any[] = [];

                for (let procurementItem of publicProcurement.items) {
                    let offerItem: any = null;

                    for (let currentOfferItem of offer.items) {
                        if (currentOfferItem.procurementItemId.toString() == procurementItem._id.toString()) {
                            offerItem = currentOfferItem;
                        }
                    }

                    if (offerItem == null || offerItem.quantity != procurementItem.quantity) {
                        offerIsValid = false;
                        continue;
                    }

                    let product = await ProductModel.findOne({_id: offerItem.productId, stamparijaId: offer.printerId});

                    if (product == null || product.naziv != procurementItem.productName ||
                        product.kategorija != procurementItem.category ||
                        product.potkategorija != procurementItem.subcategory) {
                        offerIsValid = false;
                        continue;
                    }

                    let availableColors = product.dostupneBoje.length > 0 ? product.dostupneBoje : ["Bela"];

                    if (!availableColors.includes(procurementItem.color)) {
                        offerIsValid = false;
                        continue;
                    }

                    let printingServiceIsAvailable = false;

                    for (let printingService of product.uslugeStampe) {
                        if (printingService.idUsluge == offerItem.printingServiceId &&
                            printingService.tipStampe == procurementItem.printingType) {
                            printingServiceIsAvailable = true;
                        }
                    }

                    if (!printingServiceIsAvailable) {
                        offerIsValid = false;
                        continue;
                    }

                    let selectedProduct: any = null;

                    for (let currentProduct of currentProducts) {
                        if (currentProduct.product._id.toString() == product._id.toString()) selectedProduct = currentProduct;
                    }

                    if (selectedProduct == null) {
                        selectedProduct = {product: product, quantity: 0};
                        currentProducts.push(selectedProduct);
                    }

                    selectedProduct.quantity += offerItem.quantity;

                    if (selectedProduct.quantity > product.kolicinaNaLageru) {
                        offerIsValid = false;
                        continue;
                    }

                    currentInvoiceItems.push({
                        productId: product._id,
                        productCode: offerItem.productCode,
                        productName: offerItem.productName,
                        color: procurementItem.color,
                        printingServiceId: offerItem.printingServiceId,
                        printingType: offerItem.printingType,
                        unitPrice: offerItem.unitPrice,
                        additionalPricePerItem: offerItem.additionalPricePerItem,
                        quantity: offerItem.quantity,
                        totalPrice: offerItem.totalPrice,
                        preparationType: procurementItem.preparationType,
                        preparationText: procurementItem.preparationText,
                        preparationImage: procurementItem.preparationImage
                    });
                }

                if (offerIsValid) {
                    winningOffer = offer;
                    winningPrinter = printer;
                    winningProducts = currentProducts;
                    invoiceItems = currentInvoiceItems;
                }
            }

            if (winningOffer == null || winningPrinter == null) {
                publicProcurement.status = "unsuccessful";
                await publicProcurement.save();
                continue;
            }

            for (let winningProduct of winningProducts) {
                winningProduct.product.kolicinaNaLageru -= winningProduct.quantity;
                await winningProduct.product.save();
            }

            let invoice = new InvoiceModel({
                clientId: publicProcurement.clientId,
                clientUsername: publicProcurement.clientUsername,
                clientEmail: publicProcurement.clientEmail,
                printingHouseId: winningPrinter._id,
                printingHouseName: winningPrinter.institution?.name || "",
                printingHouseCity: winningPrinter.institution?.city || "",
                items: invoiceItems,
                totalPrice: winningOffer.totalPrice,
                status: "inPrinting",
                paymentMethod: "publicProcurement",
                paymentStatus: "notApplicable"
            });

            await invoice.save();

            publicProcurement.status = "completed";
            publicProcurement.winningOfferId = winningOffer._id;
            publicProcurement.winningPrinterId = winningPrinter._id;
            publicProcurement.invoiceId = invoice._id;
            await publicProcurement.save();

            try {
                let invoicePdf = await new InvoicePdfService().createInvoicePdf(invoice);

                await new EmailService().sendInvoiceEmail(publicProcurement.clientEmail, [{
                    filename: `invoice_${invoice._id}.pdf`,
                    content: invoicePdf
                }]);
            } catch (emailError) {
                console.log("Public procurement was completed, but the invoice email could not be sent.");
            }
        }
    }

    // Creates a ten-minute public procurement from a business client's shopping cart
    // Used when a business client confirms the shopping cart instead of creating invoices immediately
    async createPublicProcurement(req: express.Request, res: express.Response) {
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

            if (client.role != "businessClient" || client.status != "approved") {
                res.status(403).json({message: "Only an approved business client can create a public procurement."});
                return;
            }

            if (client.institution == null) {
                res.status(400).json({message: "Business client institution information is required."});
                return;
            }

            let procurementItems = [];

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

                if (cartItem.preparationType == "image" && !this.isValidImage(preparationImage)) {
                    res.status(400).json({message: "Preparation image must be a valid JPG, PNG or GIF file."});
                    return;
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

                procurementItems.push({
                    productName: product.naziv,
                    category: product.kategorija,
                    subcategory: product.potkategorija,
                    color: cartItem.color,
                    printingType: selectedPrintingService.tipStampe,
                    quantity: cartItem.quantity,
                    preparationType: cartItem.preparationType,
                    preparationText: cartItem.preparationType == "text" ? preparationText : "",
                    preparationImage: cartItem.preparationType == "image" ? preparationImage : ""
                });
            }

            let publicProcurement = new PublicProcurementModel({
                clientId: client._id,
                clientUsername: client.username,
                clientEmail: client.email,
                institutionName: client.institution.name,
                items: procurementItems,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                status: "open"
            });

            await publicProcurement.save();

            let printers = await UserModel.find({role: "printer", status: "approved"}).select("email");
            let printerEmails = [];

            for (let printer of printers) printerEmails.push(printer.email);

            let emailSent = true;

            try {
                await new EmailService().sendPublicProcurementEmail(printerEmails, publicProcurement);
            } catch (emailError) {
                emailSent = false;
                console.log("Public procurement was opened, but printing houses could not be notified by email.");
            }

            let responseMessage = emailSent
                ? "Public procurement was successfully opened. Printing houses were notified by email."
                : "Public procurement was successfully opened, but printing houses could not be notified by email.";

            res.status(201).json({message: responseMessage, publicProcurement: publicProcurement, emailSent: emailSent});
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

            console.log("Error while creating public procurement.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Validates a Base64 JPG, PNG or GIF preparation image
    private isValidImage(image: string) {
        try {
            let imageMatch = image.match(/^data:image\/(jpeg|png|gif);base64,(.+)$/);

            if (imageMatch == null) return false;

            let imageFormat = imageMatch[1];
            let imageBuffer = Buffer.from(imageMatch[2], "base64");
            let dimensions = imageSize(imageBuffer);
            let expectedImageType = imageFormat == "jpeg" ? "jpg" : imageFormat;

            return dimensions.type == expectedImageType;
        } catch {
            return false;
        }
    }
}
