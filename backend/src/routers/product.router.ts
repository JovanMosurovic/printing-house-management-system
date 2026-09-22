import express from 'express'
import {ProductController} from "../controllers/product.controller";

const productRouter = express.Router()

productRouter.route("/homepage").get(
    (req, res) =>
        new ProductController().getHomepageData(req, res)
);

productRouter.route("/categories").get(
    (req, res) =>
        new ProductController().getActiveCategories(req, res)
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

productRouter.route("/:productId").get(
    (req, res) =>
        new ProductController().getProductDetails(req, res)
);

export default productRouter;
