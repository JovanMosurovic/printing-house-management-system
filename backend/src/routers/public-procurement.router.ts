import express from "express";
import {PublicProcurementController} from "../controllers/public-procurement.controller";

const publicProcurementRouter = express.Router();

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
