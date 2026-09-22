import express from "express";
import {PublicProcurementController} from "../controllers/public-procurement.controller";

const publicProcurementRouter = express.Router();

publicProcurementRouter.route("/report/:clientId/:publicProcurementId").get(
    (req, res) =>
        new PublicProcurementController().downloadPublicProcurementReport(req, res)
);

publicProcurementRouter.route("/client/:clientId").get(
    (req, res) =>
        new PublicProcurementController().getClientPublicProcurements(req, res)
);

publicProcurementRouter.route("/printer/:printerId").get(
    (req, res) =>
        new PublicProcurementController().getOpenPublicProcurements(req, res)
);

publicProcurementRouter.route("/offer").post(
    (req, res) =>
        new PublicProcurementController().submitOffer(req, res)
);

publicProcurementRouter.route("/create").post(
    (req, res) =>
        new PublicProcurementController().createPublicProcurement(req, res)
);

export default publicProcurementRouter;
