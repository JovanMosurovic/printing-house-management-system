import express from 'express'
import {ProductController} from "../controllers/product.controller";

const productRouter = express.Router()

productRouter.route("/admin/add-category").post(
    (req, res) =>
        new ProductController().addCategory(req, res)
);

productRouter.route("/admin/add-subcategory").post(
    (req, res) =>
        new ProductController().addSubcategory(req, res)
);

productRouter.route("/admin/statistics").get(
    (req, res) =>
        new ProductController().getAdminStatistics(req, res)
);

productRouter.route("/homepage").get(
    (req, res) =>
        new ProductController().getHomepageData(req, res)
);

productRouter.route("/categories").get(
    (req, res) =>
        new ProductController().getActiveCategories(req, res)
);

productRouter.route("/all-categories").get(
    (req, res) =>
        new ProductController().getAllCategories(req, res)
);

productRouter.route("/search").post(
    (req, res) =>
        new ProductController().searchProducts(req, res)
);

productRouter.route("/reaction").post(
    (req, res) =>
        new ProductController().setReaction(req, res)
);

productRouter.route("/comment").post(
    (req, res) =>
        new ProductController().addComment(req, res)
);

productRouter.route("/printer/add").post(
    (req, res) =>
        new ProductController().addProduct(req, res)
);

productRouter.route("/printer/update-quantity").post(
    (req, res) =>
        new ProductController().updateProductQuantity(req, res)
);

productRouter.route("/printer/import").post(
    (req, res) =>
        new ProductController().importProducts(req, res)
);

productRouter.route("/printer/:printerId").get(
    (req, res) =>
        new ProductController().getPrintingHouseProducts(req, res)
);

productRouter.route("/:productId").get(
    (req, res) =>
        new ProductController().getProductDetails(req, res)
);

export default productRouter;
