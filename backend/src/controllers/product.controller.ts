import express from "express";
import ProductModel from "../models/product";
import UserModel from "../models/user";

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
                brojNesvidjanja: product.nesvidjanja.length
            };

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

}
