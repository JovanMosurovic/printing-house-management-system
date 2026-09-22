import express from "express";
import {InvoiceController} from "../controllers/invoice.controller";

const invoiceRouter = express.Router();

invoiceRouter.route("/cancel").post(
    (req, res) =>
        new InvoiceController().cancelInvoice(req, res)
);

invoiceRouter.route("/client/:clientId").get(
    (req, res) =>
        new InvoiceController().getClientInvoices(req, res)
);

invoiceRouter.route("/confirm").post(
    (req, res) =>
        new InvoiceController().confirmOrder(req, res)
);

export default invoiceRouter;
