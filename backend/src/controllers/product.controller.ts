import express from "express";
import ProductModel from "../models/product";
import UserModel from "../models/user";
import InvoiceModel from "../models/invoice";
import CategoryModel from "../models/category";
import {imageSize} from "image-size";

export class ProductController {

    // Creates a new product category without initial subcategories
    // Used by the administrator on the product category management page
    async addCategory(req: express.Request, res: express.Response) {
        try {
            let categoryName = req.body.categoryName?.trim();

            if (!categoryName) {
                res.status(400).json({message: "Category name is required."});
                return;
            }

            let existingCategory = await CategoryModel.findOne({naziv: categoryName});

            if (existingCategory != null) {
                res.status(409).json({message: "Category already exists."});
                return;
            }

            let category = new CategoryModel({naziv: categoryName, potkategorije: []});
            await category.save();
            res.status(201).json(category);
        } catch (e: any) {
            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];
                res.status(400).json({message: firstError.message});
                return;
            }

            if (e.code == 11000) {
                res.status(409).json({message: "Category already exists."});
                return;
            }

            console.log("Error while adding product category.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Adds one subcategory to an existing product category
    // Used by the administrator on the product category management page
    async addSubcategory(req: express.Request, res: express.Response) {
        try {
            let categoryId = req.body.categoryId;
            let subcategoryName = req.body.subcategoryName?.trim();

            if (!categoryId || !subcategoryName) {
                res.status(400).json({message: "Category ID and subcategory name are required."});
                return;
            }

            let category = await CategoryModel.findById(categoryId);

            if (category == null) {
                res.status(404).json({message: "Category was not found."});
                return;
            }

            for (let currentSubcategory of category.potkategorije) {
                if (currentSubcategory.toLowerCase() == subcategoryName.toLowerCase()) {
                    res.status(409).json({message: "Subcategory already exists in the selected category."});
                    return;
                }
            }

            category.potkategorije.push(subcategoryName);
            await category.save();
            res.status(201).json(category);
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Category ID is not valid."});
                return;
            }

            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];
                res.status(400).json({message: firstError.message});
                return;
            }

            console.log("Error while adding product subcategory.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Returns homepage statistics, active categories and top five products
    // Used on the public homepage to return printing house count, active categories and top five products
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
    // Used by public and client search forms to list categories that contain products in stock
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

    // Returns all predefined product categories and subcategories
    // Used by the printing house product form to list all predefined categories and subcategories
    async getAllCategories(req: express.Request, res: express.Response) {
        try {
            let categories = await CategoryModel.find().sort({naziv: 1});
            res.json(categories);
        } catch (e) {
            console.log("Error while getting all categories.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Searches available products by name and category and sorts the results
    // Used by public and client search pages to return sorted products that are currently in stock
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

    // Returns all products that belong to one printing house
    // Used on the printing house products page to list all of its products, including out-of-stock products
    async getPrintingHouseProducts(req: express.Request, res: express.Response) {
        try {
            let printerId = req.params.printerId;
            let printer = await UserModel.findOne({_id: printerId, role: "printer", status: "approved"});

            if (printer == null) {
                res.status(404).json({message: "Approved printing house was not found."});
                return;
            }

            let products = await ProductModel.find({stamparijaId: printerId}).sort({naziv: 1});
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
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Printing house ID is not valid."});
                return;
            }

            console.log("Error while getting printing house products.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Adds one product and its printing services to a printing house
    // Used on the printing house products page to add one product, its images and printing services
    async addProduct(req: express.Request, res: express.Response) {
        try {
            let printerId = req.body.printerId;
            let sifra = req.body.sifra?.trim() || "";
            let naziv = req.body.naziv?.trim() || "";
            let opis = req.body.opis?.trim() || "";
            let kategorija = req.body.kategorija;
            let potkategorija = req.body.potkategorija;
            let jedinicnaCena = req.body.jedinicnaCena;
            let kolicinaNaLageru = req.body.kolicinaNaLageru;
            let dostupneBoje = req.body.dostupneBoje;
            let slikaUrl = req.body.slikaUrl;
            let dodatneSlike = req.body.dodatneSlike;
            let uslugeStampe = req.body.uslugeStampe;

            if (!printerId || !sifra || !naziv || !opis || !kategorija || !potkategorija || !slikaUrl) {
                res.status(400).json({message: "All product information and the main image are required."});
                return;
            }

            if (typeof jedinicnaCena != "number" || jedinicnaCena < 0) {
                res.status(400).json({message: "Unit price cannot be negative."});
                return;
            }

            if (!Number.isInteger(kolicinaNaLageru) || kolicinaNaLageru < 0) {
                res.status(400).json({message: "Stock quantity must be a non-negative integer."});
                return;
            }

            if (!Array.isArray(uslugeStampe) || uslugeStampe.length == 0) {
                res.status(400).json({message: "At least one printing service is required."});
                return;
            }

            if (!Array.isArray(dodatneSlike) || dodatneSlike.length > 3) {
                res.status(400).json({message: "A product can have at most three additional images."});
                return;
            }

            let printer = await UserModel.findOne({_id: printerId, role: "printer", status: "approved"});

            if (printer == null) {
                res.status(404).json({message: "Approved printing house was not found."});
                return;
            }

            let category = await CategoryModel.findOne({naziv: kategorija, potkategorije: potkategorija});

            if (category == null) {
                res.status(400).json({message: "Selected category and subcategory are not valid."});
                return;
            }

            let productWithSameCode = await ProductModel.findOne({stamparijaId: printerId, sifra: sifra});

            if (productWithSameCode != null) {
                res.status(409).json({message: "A product with this code already exists in the printing house."});
                return;
            }

            if (!this.isValidProductImage(slikaUrl)) {
                res.status(400).json({message: "Main product image must be a valid JPG, PNG or GIF file."});
                return;
            }

            for (let additionalImage of dodatneSlike) {
                if (!this.isValidProductImage(additionalImage)) {
                    res.status(400).json({message: "Every additional image must be a valid JPG, PNG or GIF file."});
                    return;
                }
            }

            let preparedColors: string[] = [];

            if (Array.isArray(dostupneBoje)) {
                for (let color of dostupneBoje) {
                    if (typeof color == "string" && color.trim() && !preparedColors.includes(color.trim())) {
                        preparedColors.push(color.trim());
                    }
                }
            }

            if (preparedColors.length == 0) preparedColors.push("Bela");

            for (let i = 0; i < uslugeStampe.length; i++) {
                let printingService = uslugeStampe[i];

                if (typeof printingService.idUsluge != "string" || !printingService.idUsluge.trim() ||
                    typeof printingService.tipStampe != "string" || !printingService.tipStampe.trim()) {
                    res.status(400).json({message: "Printing service ID and type are required."});
                    return;
                }

                if (typeof printingService.dodatnaCenaPoKomadu != "number" || printingService.dodatnaCenaPoKomadu < 0 ||
                    typeof printingService.maxSirinaMm != "number" || printingService.maxSirinaMm < 1 ||
                    typeof printingService.maxVisinaMm != "number" || printingService.maxVisinaMm < 1) {
                    res.status(400).json({message: "Printing service prices and dimensions are not valid."});
                    return;
                }

                for (let j = i + 1; j < uslugeStampe.length; j++) {
                    if (typeof uslugeStampe[j].idUsluge == "string" &&
                        printingService.idUsluge.trim() == uslugeStampe[j].idUsluge.trim()) {
                        res.status(409).json({message: "Printing service IDs must be unique within one product."});
                        return;
                    }
                }
            }

            let product = new ProductModel({
                stamparijaId: printer._id,
                nazivStamparije: printer.institution?.name || "",
                sifra: sifra,
                naziv: naziv,
                opis: opis,
                kategorija: kategorija,
                potkategorija: potkategorija,
                jedinicnaCena: jedinicnaCena,
                kolicinaNaLageru: kolicinaNaLageru,
                dostupneBoje: preparedColors,
                slikaUrl: slikaUrl,
                dodatneSlike: dodatneSlike,
                uslugeStampe: uslugeStampe
            });

            await product.save();
            res.status(201).json({message: "Product was successfully added."});
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Printing house ID is not valid."});
                return;
            }

            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];
                res.status(400).json({message: firstError.message});
                return;
            }

            console.log("Error while adding product.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Changes the stock quantity of one printing house product
    // Used on the printing house products page to update the quantity of one owned product
    async updateProductQuantity(req: express.Request, res: express.Response) {
        try {
            let printerId = req.body.printerId;
            let productId = req.body.productId;
            let quantity = req.body.quantity;

            if (!printerId || !productId) {
                res.status(400).json({message: "Printing house ID and product ID are required."});
                return;
            }

            if (!Number.isInteger(quantity) || quantity < 0) {
                res.status(400).json({message: "Stock quantity must be a non-negative integer."});
                return;
            }

            let printer = await UserModel.findOne({_id: printerId, role: "printer", status: "approved"});

            if (printer == null) {
                res.status(404).json({message: "Approved printing house was not found."});
                return;
            }

            let product = await ProductModel.findOne({_id: productId, stamparijaId: printerId});

            if (product == null) {
                res.status(404).json({message: "Printing house product was not found."});
                return;
            }

            product.kolicinaNaLageru = quantity;
            await product.save();

            res.json({message: "Product quantity was successfully updated."});
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Entered ID is not valid."});
                return;
            }

            console.log("Error while updating product quantity.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Imports products and printing services from a JSON file after images are added
    // Used on the JSON import page to validate and save all loaded products after their images are added
    async importProducts(req: express.Request, res: express.Response) {
        try {
            let printerId = req.body.printerId;
            let importedProducts = req.body.products;

            if (!printerId) {
                res.status(400).json({message: "Printing house ID is required."});
                return;
            }

            if (!Array.isArray(importedProducts) || importedProducts.length == 0) {
                res.status(400).json({message: "The JSON file must contain at least one product."});
                return;
            }

            let printer = await UserModel.findOne({_id: printerId, role: "printer", status: "approved"});

            if (printer == null) {
                res.status(404).json({message: "Approved printing house was not found."});
                return;
            }

            let preparedProducts: any[] = [];
            let importedProductCodes: string[] = [];

            for (let importedProduct of importedProducts) {
                let sifra = typeof importedProduct.sifra == "string" ? importedProduct.sifra.trim() : "";
                let naziv = typeof importedProduct.naziv == "string" ? importedProduct.naziv.trim() : "";
                let opis = typeof importedProduct.opis == "string" ? importedProduct.opis.trim() : "";
                let kategorija = importedProduct.kategorija;
                let potkategorija = importedProduct.potkategorija;
                let jedinicnaCena = importedProduct.jedinicnaCena;
                let kolicinaNaLageru = importedProduct.kolicinaNaLageru;
                let slikaUrl = importedProduct.slikaUrl;
                let dodatneSlike = Array.isArray(importedProduct.dodatneSlike) ? importedProduct.dodatneSlike : [];
                let uslugeStampe = importedProduct.uslugeStampe;

                if (!sifra || !naziv || !opis || !kategorija || !potkategorija || !slikaUrl) {
                    res.status(400).json({message: "Every imported product must contain all information and a main image."});
                    return;
                }

                if (typeof jedinicnaCena != "number" || jedinicnaCena < 0) {
                    res.status(400).json({message: `Unit price is not valid for product ${naziv}.`});
                    return;
                }

                if (!Number.isInteger(kolicinaNaLageru) || kolicinaNaLageru < 0) {
                    res.status(400).json({message: `Stock quantity is not valid for product ${naziv}.`});
                    return;
                }

                if (!Array.isArray(uslugeStampe) || uslugeStampe.length == 0) {
                    res.status(400).json({message: `At least one printing service is required for product ${naziv}.`});
                    return;
                }

                if (dodatneSlike.length > 3) {
                    res.status(400).json({message: `Product ${naziv} can have at most three additional images.`});
                    return;
                }

                let category = await CategoryModel.findOne({naziv: kategorija, potkategorije: potkategorija});

                if (category == null) {
                    res.status(400).json({message: `Category and subcategory are not valid for product ${naziv}.`});
                    return;
                }

                if (importedProductCodes.includes(sifra)) {
                    res.status(409).json({message: `Product code ${sifra} appears more than once in the JSON file.`});
                    return;
                }

                let existingProduct = await ProductModel.findOne({stamparijaId: printerId, sifra: sifra});

                if (existingProduct != null) {
                    res.status(409).json({message: `A product with code ${sifra} already exists in the printing house.`});
                    return;
                }

                if (!this.isValidProductImage(slikaUrl)) {
                    res.status(400).json({message: `Main image is not valid for product ${naziv}.`});
                    return;
                }

                for (let additionalImage of dodatneSlike) {
                    if (!this.isValidProductImage(additionalImage)) {
                        res.status(400).json({message: `One of the additional images is not valid for product ${naziv}.`});
                        return;
                    }
                }

                let preparedColors: string[] = [];

                if (Array.isArray(importedProduct.dostupneBoje)) {
                    for (let color of importedProduct.dostupneBoje) {
                        if (typeof color == "string" && color.trim() && !preparedColors.includes(color.trim())) {
                            preparedColors.push(color.trim());
                        }
                    }
                }

                if (preparedColors.length == 0) preparedColors.push("Bela");

                let preparedServices = [];

                for (let i = 0; i < uslugeStampe.length; i++) {
                    let printingService = uslugeStampe[i];

                    if (typeof printingService.idUsluge != "string" || !printingService.idUsluge.trim() ||
                        typeof printingService.tipStampe != "string" || !printingService.tipStampe.trim()) {
                        res.status(400).json({message: `Printing service ID and type are required for product ${naziv}.`});
                        return;
                    }

                    if (typeof printingService.dodatnaCenaPoKomadu != "number" || printingService.dodatnaCenaPoKomadu < 0 ||
                        typeof printingService.maxSirinaMm != "number" || printingService.maxSirinaMm < 1 ||
                        typeof printingService.maxVisinaMm != "number" || printingService.maxVisinaMm < 1) {
                        res.status(400).json({message: `Printing service data is not valid for product ${naziv}.`});
                        return;
                    }

                    for (let j = i + 1; j < uslugeStampe.length; j++) {
                        if (typeof uslugeStampe[j].idUsluge == "string" &&
                            printingService.idUsluge.trim() == uslugeStampe[j].idUsluge.trim()) {
                            res.status(409).json({message: `Printing service IDs must be unique for product ${naziv}.`});
                            return;
                        }
                    }

                    preparedServices.push({
                        idUsluge: printingService.idUsluge.trim(),
                        tipStampe: printingService.tipStampe.trim(),
                        dodatnaCenaPoKomadu: printingService.dodatnaCenaPoKomadu,
                        maxSirinaMm: printingService.maxSirinaMm,
                        maxVisinaMm: printingService.maxVisinaMm
                    });
                }

                importedProductCodes.push(sifra);
                preparedProducts.push({
                    stamparijaId: printer._id,
                    nazivStamparije: printer.institution?.name || "",
                    sifra: sifra,
                    naziv: naziv,
                    opis: opis,
                    kategorija: kategorija,
                    potkategorija: potkategorija,
                    jedinicnaCena: jedinicnaCena,
                    kolicinaNaLageru: kolicinaNaLageru,
                    dostupneBoje: preparedColors,
                    slikaUrl: slikaUrl,
                    dodatneSlike: dodatneSlike,
                    uslugeStampe: preparedServices
                });
            }

            for (let preparedProduct of preparedProducts) {
                let product = new ProductModel(preparedProduct);
                await product.save();
            }

            res.status(201).json({message: `${preparedProducts.length} products were successfully imported.`});
        } catch (e: any) {
            if (e.name == "CastError") {
                res.status(400).json({message: "Printing house ID is not valid."});
                return;
            }

            if (e.name == "ValidationError") {
                let firstErrorName = Object.keys(e.errors)[0];
                let firstError = e.errors[firstErrorName];
                res.status(400).json({message: firstError.message});
                return;
            }

            console.log("Error while importing products.");
            res.status(500).json({message: "Unexpected server error."});
        }
    }

    // Returns complete details about one available product and its printing house
    // This is for product details page
    // Used on the product details page to return product, printing house, rating and latest comments
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
    // Used in the product archive to add or change a client's reaction to a received product
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
    // Used in the product archive to add a client's comment to a received product
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

    // Used while adding or importing products to verify Base64 JPG, PNG and GIF images
    private isValidProductImage(image: string) {
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
