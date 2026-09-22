import express from "express";
import {InvoiceController} from "../controllers/invoice.controller";

const invoiceRouter = express.Router();

invoiceRouter.route("/confirm").post(
    (req, res) =>
        new InvoiceController().confirmOrder(req, res)
);

export default invoiceRouter;
