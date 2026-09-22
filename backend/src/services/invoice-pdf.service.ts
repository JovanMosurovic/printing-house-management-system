import PDFDocument from "pdfkit";
import path from "path";

export class InvoicePdfService {

    createInvoicePdf(invoice: any): Promise<Buffer> {
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

            pdf.font("DejaVuBold").fontSize(22).text("FAKTURA", {align: "center"});
            pdf.moveDown();

            pdf.font("DejaVu").fontSize(11);
            pdf.text(`ID fakture: ${invoice._id}`);
            pdf.text(`Datum izdavanja: ${new Date(invoice.createdAt).toLocaleString("sr-RS")}`);
            pdf.text(`Status: ${invoice.status}`);
            pdf.moveDown();

            pdf.font("DejaVuBold").text("Klijent");
            pdf.font("DejaVu").text(`Korisničko ime: ${invoice.clientUsername}`);
            pdf.text(`Imejl: ${invoice.clientEmail}`);
            pdf.moveDown();

            pdf.font("DejaVuBold").text("Štamparija");
            pdf.font("DejaVu").text(`Naziv: ${invoice.printingHouseName}`);
            pdf.text(`Grad: ${invoice.printingHouseCity}`);
            pdf.moveDown();

            pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
            pdf.moveDown();

            pdf.font("DejaVuBold").fontSize(14).text("Proizvodi");
            pdf.moveDown(0.5);

            for (let i = 0; i < invoice.items.length; i++) {
                let item = invoice.items[i];

                if (pdf.y > 650) {
                    pdf.addPage();
                    pdf.font("DejaVu");
                }

                pdf.font("DejaVuBold").fontSize(11).text(`${i + 1}. ${item.productName} (${item.productCode})`);
                pdf.font("DejaVu").text(`Boja: ${item.color}`);
                pdf.text(`Vrsta štampe: ${item.printingType}`);
                pdf.text(`Količina: ${item.quantity}`);
                pdf.text(`Cena proizvoda po komadu: ${item.unitPrice} RSD`);
                pdf.text(`Dodatna cena štampe po komadu: ${item.additionalPricePerItem} RSD`);
                pdf.text(`Ukupna cena stavke: ${item.totalPrice} RSD`);

                if (item.preparationType == "text") {
                    pdf.text(`Tekst za štampu: ${item.preparationText}`);
                } else {
                    pdf.text("Priprema za štampu: priložena slika");
                }

                pdf.moveDown();
            }

            pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).stroke();
            pdf.moveDown();
            pdf.font("DejaVuBold").fontSize(14).text(`UKUPAN IZNOS: ${invoice.totalPrice} RSD`, {align: "right"});

            pdf.end();
        });
    }
}
