import express from "express";
import {InvoiceController} from "../controllers/invoice.controller";

const invoiceRouter = express.Router();

invoiceRouter.route("/printer/update-status").post(
    (req, res) =>
        new InvoiceController().updateInvoiceStatus(req, res)
);

invoiceRouter.route("/printer/:printerId").get(
    (req, res) =>
        new InvoiceController().getPrintingHouseInvoices(req, res)
);

invoiceRouter.route("/cancel").post(
    (req, res) =>
        new InvoiceController().cancelInvoice(req, res)
);

invoiceRouter.route("/mark-received").post(
    (req, res) =>
        new InvoiceController().markAsReceived(req, res)
);

invoiceRouter.route("/archive/:clientId").get(
    (req, res) =>
        new InvoiceController().getProductArchive(req, res)
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
