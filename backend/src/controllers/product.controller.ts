import express from "express";
import ProductModel from "../models/product";
import UserModel from "../models/user";
import InvoiceModel from "../models/invoice";

export class ProductController {

    // Returns homepage statistics, active categories and top five products
    async getHomepageData(req: express.Request, res: express.Response) {
        try {
            let printers = await UserModel.find({
                role: "printer",
                status: "approved"
            }).select("_id");

            let printerIds = [];

            for (let printer of printers) {
                printerIds.push(printer._id);
            }

            let products = await ProductModel.find({
                stamparijaId: {$in: printerIds},
                kolicinaNaLageru: {$gt: 0}
            });

            let categories: string[] = [];

            for (let product of products) {
                if (!categories.includes(product.kategorija)) {
                    categories.push(product.kategorija);
                }
            }

            categories.sort((firstCategory, secondCategory) =>
                firstCategory.localeCompare(secondCategory, "sr")
            );

            products.sort((firstProduct, secondProduct) => {
                let likesDifference = secondProduct.svidjanja.length - firstProduct.svidjanja.length;

                if (likesDifference != 0) {
                    return likesDifference;
                }

                return firstProduct.naziv.localeCompare(secondProduct.naziv, "sr");
            });

            let preparedTopProducts = [];

            for (let i = 0; i < products.length && i < 5; i++) {
                let product = products[i];

                let data = {
                    _id: product._id,
                    stamparijaId: product.stamparijaId,
                    nazivStamparije: product.nazivStamparije,
                    sifra: product.sifra,
                    naziv: product.naziv,
                    opis: product.opis,
                    kategorija: product.kategorija,
                    potkategorija: product.potkategorija,
                    jedinicnaCena: product.jedinicnaCena,
                    kolicinaNaLageru: product.kolicinaNaLageru,
                    dostupneBoje: product.dostupneBoje,
                    slikaUrl: product.slikaUrl,
                    dodatneSlike: product.dodatneSlike,
                    uslugeStampe: product.uslugeStampe,
                    brojSvidjanja: product.svidjanja.length,
                    brojNesvidjanja: product.nesvidjanja.length
                };

                preparedTopProducts.push(data);
            }

            res.json({
                brojStamparija: printers.length,
                kategorije: categories,
                topProizvodi: preparedTopProducts
            });
        } catch (e) {
            console.log("Error while getting homepage data.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Returns categories that currently have products in stock
    async getActiveCategories(req: express.Request, res: express.Response) {
        try {
            let printers = await UserModel.find({
                role: "printer",
                status: "approved"
            }).select("_id");

            let printerIds = [];

            for (let printer of printers) {
                printerIds.push(printer._id);
            }

            let products = await ProductModel.find({
                stamparijaId: {$in: printerIds},
                kolicinaNaLageru: {$gt: 0}
            }).select("kategorija");

            let categories: string[] = [];

            for (let product of products) {
                if (!categories.includes(product.kategorija)) categories.push(product.kategorija);
            }

            categories.sort((firstCategory, secondCategory) => firstCategory.localeCompare(secondCategory, "sr"));
            res.json(categories);
        } catch (e) {
            console.log("Error while getting active categories.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Searches available products by name and category and sorts the results
    async searchProducts(req: express.Request, res: express.Response) {
        try {
            let naziv = req.body.naziv?.trim() || "";
            let kategorija = req.body.kategorija || "";
            let sortDirection = req.body.sortDirection == "desc" ? "desc" : "asc";

            let printers = await UserModel.find({
                role: "printer",
                status: "approved"
            }).select("_id");

            let printerIds = [];

            for (let printer of printers) {
                printerIds.push(printer._id);
            }

            let searchConditions: any = {
                stamparijaId: {$in: printerIds},
                kolicinaNaLageru: {$gt: 0}
            };

            if (naziv) {
                searchConditions.naziv = { // partially match naziv and ignore upper/lower case
                    $regex: naziv,
                    $options: "i"
                };
            }

            if (kategorija) {
                searchConditions.kategorija = kategorija;
            }

            let products = await ProductModel.find(searchConditions);

            products.sort((firstProduct, secondProduct) => {
                if (sortDirection == "desc") {
                    return secondProduct.naziv.localeCompare(firstProduct.naziv, "sr");
                }

                return firstProduct.naziv.localeCompare(secondProduct.naziv, "sr");
            });

            let preparedProducts = [];

            for (let product of products) {
                let data = {
                    _id: product._id,
                    stamparijaId: product.stamparijaId,
                    nazivStamparije: product.nazivStamparije,
                    sifra: product.sifra,
                    naziv: product.naziv,
                    opis: product.opis,
                    kategorija: product.kategorija,
                    potkategorija: product.potkategorija,
                    jedinicnaCena: product.jedinicnaCena,
                    kolicinaNaLageru: product.kolicinaNaLageru,
                    dostupneBoje: product.dostupneBoje,
                    slikaUrl: product.slikaUrl,
                    dodatneSlike: product.dodatneSlike,
                    uslugeStampe: product.uslugeStampe,
                    brojSvidjanja: product.svidjanja.length,
                    brojNesvidjanja: product.nesvidjanja.length
                };

                preparedProducts.push(data);
            }

            res.json(preparedProducts);
        } catch (e) {
            console.log("Error while searching products.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Returns complete details about one available product and its printing house
    // This is for product details page
    async getProductDetails(req: express.Request, res: express.Response) {
        try {
            let productId = req.params.productId;

            let product = await ProductModel.findOne({
                _id: productId,
                kolicinaNaLageru: {$gt: 0}
            });

            if (product == null) {
                res.status(404).json({message: "Product was not found."});
                return;
            }

            let printer = await UserModel.findOne({
                _id: product.stamparijaId,
                role: "printer",
                status: "approved"
            });

            if (printer == null) {
                res.status(404).json({message: "Printing house was not found."});
                return;
            }

            let data = {
                _id: product._id,
                stamparijaId: product.stamparijaId,
                sifra: product.sifra,
                naziv: product.naziv,
                opis: product.opis,
                kategorija: product.kategorija,
                potkategorija: product.potkategorija,
                jedinicnaCena: product.jedinicnaCena,
                kolicinaNaLageru: product.kolicinaNaLageru,
                dostupneBoje: product.dostupneBoje.length > 0 ? product.dostupneBoje : ["Bela"],
                nazivStamparije: product.nazivStamparije,
                adresaStamparije: printer.institution?.address || "",
                grad: printer.institution?.city || "",
                slikaUrl: product.slikaUrl,
                dodatneSlike: product.dodatneSlike,
                uslugeStampe: product.uslugeStampe,
                brojSvidjanja: product.svidjanja.length,
                brojNesvidjanja: product.nesvidjanja.length,
                comments: [] as any[]
            };

            let sortedComments = [];

            for (let comment of product.comments) {
                sortedComments.push(comment);
            }

            sortedComments.sort((firstComment, secondComment) =>
                secondComment.createdAt.getTime() - firstComment.createdAt.getTime()
            );

            for (let i = 0; i < sortedComments.length && i < 5; i++) {
                data.comments.push(sortedComments[i]);
            }

            res.json(data);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Product ID is not valid."});
                return;
            }

            console.log("Error while getting product details.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Adds or changes a client's reaction to a received product
    async setReaction(req: express.Request, res: express.Response) {
        try {
            let clientId = req.body.clientId;
            let productId = req.body.productId;
            let reaction = req.body.reaction;

            if (!clientId || !productId || !reaction) {
                res.status(400).json({message: "Client ID, product ID and reaction are required."});
                return;
            }

            if (reaction != "like" && reaction != "dislike") {
                res.status(400).json({message: "Reaction must be like or dislike."});
                return;
            }

            let receivedInvoice = await InvoiceModel.findOne({
                clientId: clientId,
                status: "received",
                "items.productId": productId
            });

            if (receivedInvoice == null) {
                res.status(403).json({message: "Only a received product can be rated."});
                return;
            }

            let product = await ProductModel.findById(productId);

            if (product == null) {
                res.status(404).json({message: "Product was not found."});
                return;
            }

            for (let i = product.svidjanja.length - 1; i >= 0; i--) {
                if (product.svidjanja[i].toString() == clientId) product.svidjanja.splice(i, 1);
            }

            for (let i = product.nesvidjanja.length - 1; i >= 0; i--) {
                if (product.nesvidjanja[i].toString() == clientId) product.nesvidjanja.splice(i, 1);
            }

            if (reaction == "like") product.svidjanja.push(clientId);
            if (reaction == "dislike") product.nesvidjanja.push(clientId);

            await product.save();
            res.json({message: "Product reaction was successfully saved."});
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Entered ID is not valid."});
                return;
            }

            console.log("Error while saving product reaction.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Adds a client's comment to a received product
    async addComment(req: express.Request, res: express.Response) {
        try {
            let clientId = req.body.clientId;
            let productId = req.body.productId;
            let text = req.body.text?.trim() || "";

            if (!clientId || !productId || !text) {
                res.status(400).json({message: "Client ID, product ID and comment text are required."});
                return;
            }

            let receivedInvoice = await InvoiceModel.findOne({
                clientId: clientId,
                status: "received",
                "items.productId": productId
            });

            if (receivedInvoice == null) {
                res.status(403).json({message: "Only a received product can be commented on."});
                return;
            }

            let client = await UserModel.findById(clientId);

            if (client == null || (client.role != "individualClient" && client.role != "businessClient")) {
                res.status(404).json({message: "Client was not found."});
                return;
            }

            let product = await ProductModel.findById(productId);

            if (product == null) {
                res.status(404).json({message: "Product was not found."});
                return;
            }

            product.comments.push({
                clientId: client._id,
                username: client.username,
                text: text,
                createdAt: new Date()
            });

            await product.save();
            res.json({message: "Comment was successfully added."});
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

            console.log("Error while adding product comment.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

}
