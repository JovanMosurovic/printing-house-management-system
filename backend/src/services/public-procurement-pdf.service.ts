import PDFDocument from "pdfkit";
import path from "path";

export class PublicProcurementPdfService {

    createPublicProcurementReportPdf(publicProcurement: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let pdf = new PDFDocument({size: "A4", margin: 50});
            let pdfParts: Buffer[] = [];

            pdf.on("data", part => pdfParts.push(part));
            pdf.on("end", () => resolve(Buffer.concat(pdfParts)));
            pdf.on("error", error => reject(error));

            let regularFontPath = path.join(
                __dirname,
                "../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"
            );

            let boldFontPath = path.join(
                __dirname,
                "../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"
            );

            pdf.registerFont("DejaVu", regularFontPath);
            pdf.registerFont("DejaVuBold", boldFontPath);

            pdf.font("DejaVuBold").fontSize(20).text("IZVESTAJ O JAVNOJ NABAVCI", {align: "center"});
            pdf.moveDown();

            pdf.font("DejaVu").fontSize(11);
            pdf.text(`ID javne nabavke: ${publicProcurement._id}`);
            pdf.text(`Ustanova: ${publicProcurement.institutionName}`);
            pdf.text(`Datum raspisivanja: ${new Date(publicProcurement.createdAt).toLocaleString("sr-RS")}`);
            pdf.text(`Rok za ponude: ${new Date(publicProcurement.expiresAt).toLocaleString("sr-RS")}`);
            pdf.text(`Status: ${publicProcurement.status}`);
            pdf.moveDown();

            pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
            pdf.moveDown();
            pdf.font("DejaVuBold").fontSize(14).text("TRAZENI PROIZVODI");
            pdf.moveDown(0.5);

            for (let i = 0; i < publicProcurement.items.length; i++) {
                let item = publicProcurement.items[i];

                if (pdf.y > 650) pdf.addPage();

                pdf.font("DejaVuBold").fontSize(11).text(`${i + 1}. ${item.productName}`);
                pdf.font("DejaVu").text(`Kategorija: ${item.category} / ${item.subcategory}`);
                pdf.text(`Boja: ${item.color}`);
                pdf.text(`Vrsta stampe: ${item.printingType}`);
                pdf.text(`Kolicina: ${item.quantity}`);
                pdf.moveDown();
            }

            if (pdf.y > 610) pdf.addPage();

            pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
            pdf.moveDown();
            pdf.font("DejaVuBold").fontSize(14).text("PRISTIGLE PONUDE");
            pdf.moveDown(0.5);

            if (publicProcurement.offers.length == 0) {
                pdf.font("DejaVu").fontSize(11).text("Nije primljena nijedna ponuda.");
                pdf.moveDown();
            }

            for (let i = 0; i < publicProcurement.offers.length; i++) {
                let offer = publicProcurement.offers[i];
                let isWinningOffer = publicProcurement.winningOfferId != null &&
                    offer._id.toString() == publicProcurement.winningOfferId.toString();

                if (pdf.y > 590) pdf.addPage();

                let result = isWinningOffer ? " - POBEDNICKA PONUDA" : "";
                pdf.font("DejaVuBold").fontSize(12).text(`${i + 1}. ${offer.printingHouseName}${result}`);
                pdf.font("DejaVu").fontSize(11).text(`Grad: ${offer.printingHouseCity}`);
                pdf.text(`Datum slanja: ${new Date(offer.createdAt).toLocaleString("sr-RS")}`);
                pdf.text(`Ukupna cena: ${offer.totalPrice} RSD`);
                pdf.text("Ponudjeni proizvodi:");

                for (let offerItem of offer.items) {
                    if (pdf.y > 700) pdf.addPage();
                    pdf.text(`- ${offerItem.productName}, ${offerItem.quantity} kom, ${offerItem.totalPrice} RSD`, {indent: 15});
                }

                pdf.moveDown();
            }

            if (pdf.y > 650) pdf.addPage();

            pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
            pdf.moveDown();

            let winningOffer = null;

            for (let offer of publicProcurement.offers) {
                if (publicProcurement.winningOfferId != null &&
                    offer._id.toString() == publicProcurement.winningOfferId.toString()) {
                    winningOffer = offer;
                }
            }

            if (winningOffer == null) {
                pdf.font("DejaVuBold").fontSize(12).text("Nije izabrana pobednicka ponuda.");
            } else {
                pdf.font("DejaVuBold").fontSize(12).text("IZABRANA PONUDA");
                pdf.font("DejaVu").fontSize(11).text(`Stamparija: ${winningOffer.printingHouseName}`);
                pdf.text(`Ukupan iznos: ${winningOffer.totalPrice} RSD`);
                pdf.text(`ID fakture: ${publicProcurement.invoiceId}`);
            }

            pdf.end();
        });
    }
}
