import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PdfPrinter from "pdfmake";

export const dynamic = "force-dynamic";
import { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import path from "path";

// Roboto font - supports Turkish characters
const fonts = {
  Roboto: {
    normal: path.join(process.cwd(), "fonts", "Roboto-Regular.ttf"),
    bold: path.join(process.cwd(), "fonts", "Roboto-Bold.ttf"),
    italics: path.join(process.cwd(), "fonts", "Roboto-Italic.ttf"),
    bolditalics: path.join(process.cwd(), "fonts", "Roboto-BoldItalic.ttf"),
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const yil = searchParams.get("yil");
    const ay = searchParams.get("ay");
    const reportType = searchParams.get("reportType") || "supplier"; // "supplier" or "factory"
    const isFactoryReport = reportType === "factory";

    if (!supplierId || !yil || !ay) {
      return NextResponse.json(
        { error: "Tedarikçi, yıl ve ay parametreleri zorunludur" },
        { status: 400 }
      );
    }

    // Get supplier info
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Tedarikçi bulunamadı" },
        { status: 404 }
      );
    }

    // Get all timesheets for this supplier in the given period
    const timesheets = await prisma.timesheet.findMany({
      where: {
        vehicle: { supplierId },
        yil: parseInt(yil),
        ay: parseInt(ay),
      },
      include: {
        project: true,
        vehicle: true,
        entries: {
          include: { route: true },
          orderBy: { tarih: "asc" },
        },
      },
    });

    // Get extra work entries for this supplier in the given period
    const startDate = new Date(parseInt(yil), parseInt(ay) - 1, 1);
    const endDate = new Date(parseInt(yil), parseInt(ay), 1);
    
    const extraWorks = await prisma.extraWork.findMany({
      where: {
        supplierId,
        tarih: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        project: true,
        vehicle: true,
      },
      orderBy: { tarih: "asc" },
    });

    // Calculate puantaj totals
    let puantajTotal = 0;
    let puantajKdv = 0;

    const summaryRows: TableCell[][] = [];

    timesheets.forEach((ts) => {
      const routeTotals = new Map<string, { sefer: number; tutar: number; kdv: number; birimFiyat: number }>();

      ts.entries.forEach((entry) => {
        const existing = routeTotals.get(entry.routeId) || { sefer: 0, tutar: 0, kdv: 0, birimFiyat: 0 };
        
        // Use factory price if factory report and available, otherwise use supplier price
        const priceToUse = isFactoryReport 
          ? (entry.fabrikaFiyatSnapshot ?? entry.route.fabrikaFiyati ?? entry.birimFiyatSnapshot)
          : entry.birimFiyatSnapshot;
        
        const lineTotal = entry.seferSayisi * priceToUse;
        const lineKdv = lineTotal * (entry.kdvOraniSnapshot / 100);

        routeTotals.set(entry.routeId, {
          sefer: existing.sefer + entry.seferSayisi,
          tutar: existing.tutar + lineTotal,
          kdv: existing.kdv + lineKdv,
          birimFiyat: priceToUse,
        });
      });

      // Add summary rows for each route
      routeTotals.forEach((totals, routeId) => {
        const route = ts.entries.find((e) => e.routeId === routeId)?.route;
        if (!route) return;

        const displayPrice = isFactoryReport 
          ? (route.fabrikaFiyati ?? route.birimFiyat)
          : route.birimFiyat;

        summaryRows.push([
          ts.vehicle.plaka,
          ts.project.ad,
          route.ad,
          route.km?.toString() || "-",
          totals.sefer.toString(),
          formatCurrency(displayPrice),
          formatCurrency(totals.tutar),
          formatCurrency(totals.kdv),
        ]);

        puantajTotal += totals.tutar;
        puantajKdv += totals.kdv;
      });
    });

    // Calculate extra work totals (no KDV for extra work by default)
    let extraWorkTotal = 0;
    const extraWorkRows: TableCell[][] = extraWorks.map((ew) => {
      // Use factory price if factory report and available
      const priceToUse = isFactoryReport 
        ? (ew.fabrikaFiyati ?? ew.fiyat)
        : ew.fiyat;
      
      extraWorkTotal += priceToUse;
      return [
        formatDate(new Date(ew.tarih)),
        ew.project.ad,
        ew.vehicle.plaka,
        ew.aciklama,
        formatCurrency(priceToUse),
      ];
    });

    // Grand totals (including extra work)
    const grandTotal = puantajTotal + extraWorkTotal;
    const grandKdv = puantajKdv; // Extra work doesn't have KDV in this model
    const grandAraToplam = grandTotal + grandKdv;
    const grandTevkifat = grandKdv * 0.5;
    const grandFatura = grandAraToplam - grandTevkifat;

    // Generate report number
    const reportCount = await prisma.timesheet.count({
      where: {
        vehicle: { supplierId },
        yil: parseInt(yil),
      },
    });
    const reportPrefix = isFactoryReport ? "FAB" : "TED";
    const reportNo = `${reportPrefix}-${yil}-${String(reportCount + 1).padStart(3, "0")}`;

    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    // Build PDF content
    const reportTitle = isFactoryReport ? "FABRİKA RAPORU" : "TEDARİKÇİ RAPORU";
    const pdfContent: Content[] = [
      // Header
      {
        text: reportTitle,
        style: "header",
        alignment: "center",
        color: isFactoryReport ? "#d97706" : "#333",
      },
      {
        text: `${monthNames[parseInt(ay) - 1]} ${yil}`,
        style: "subheader",
        alignment: "center",
        margin: [0, 0, 0, 20],
      },

      // Report Info
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "RAPOR BİLGİLERİ", style: "sectionHeader" },
              { text: `Rapor No: ${reportNo}`, margin: [0, 5, 0, 2] },
              { text: `Rapor Tarihi: ${formatDate(new Date())}`, margin: [0, 2, 0, 2] },
              { text: `Dönem: ${monthNames[parseInt(ay) - 1]} ${yil}`, margin: [0, 2, 0, 2] },
              { text: `Rapor Tipi: ${isFactoryReport ? "Fabrika Fiyatları" : "Tedarikçi Fiyatları"}`, margin: [0, 2, 0, 10], color: isFactoryReport ? "#d97706" : "#333" },
            ],
          },
          {
            width: "*",
            stack: [
              { text: "TEDARİKÇİ BİLGİLERİ", style: "sectionHeader" },
              { text: `Firma: ${supplier.firmaAdi}`, margin: [0, 5, 0, 2] },
              { text: `Vergi No: ${supplier.vergiNo || "-"}`, margin: [0, 2, 0, 2] },
              { text: `Vergi Dairesi: ${supplier.vergiDairesi || "-"}`, margin: [0, 2, 0, 10] },
            ],
          },
        ],
      },

      // Summary Table (Puantaj)
      {
        text: "PUANTAJ ÖZETİ",
        style: "sectionHeader",
        margin: [0, 20, 0, 10],
      },
    ];

    // Add summary table or "no data" message
    if (summaryRows.length > 0) {
      pdfContent.push({
        table: {
          headerRows: 1,
          widths: ["auto", "*", "*", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Plaka", style: "tableHeader" },
              { text: "Proje", style: "tableHeader" },
              { text: "Güzergah", style: "tableHeader" },
              { text: "KM", style: "tableHeader" },
              { text: "Sefer", style: "tableHeader" },
              { text: "Birim Fiyat", style: "tableHeader" },
              { text: "Toplam", style: "tableHeader" },
              { text: "KDV", style: "tableHeader" },
            ],
            ...summaryRows,
          ],
        },
        layout: "lightHorizontalLines",
      } as Content);

      // Puantaj subtotal
      pdfContent.push({
        margin: [0, 10, 0, 0],
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: "Puantaj Toplam:", alignment: "right", bold: true },
              { text: formatCurrency(puantajTotal), alignment: "right", bold: true },
            ],
          ],
        },
        layout: "noBorders",
      } as Content);
    } else {
      pdfContent.push({
        text: "Bu dönem için puantaj kaydı bulunmamaktadır.",
        italics: true,
        margin: [0, 10, 0, 10],
      } as Content);
    }

    // Extra Work Section
    pdfContent.push({
      text: "EK İŞ / MESAİ",
      style: "sectionHeader",
      margin: [0, 20, 0, 10],
    } as Content);

    if (extraWorkRows.length > 0) {
      pdfContent.push({
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "*", "auto"],
          body: [
            [
              { text: "Tarih", style: "tableHeader" },
              { text: "Proje", style: "tableHeader" },
              { text: "Plaka", style: "tableHeader" },
              { text: "Açıklama", style: "tableHeader" },
              { text: "Tutar", style: "tableHeader" },
            ],
            ...extraWorkRows,
          ],
        },
        layout: "lightHorizontalLines",
      } as Content);

      // Extra work subtotal
      pdfContent.push({
        margin: [0, 10, 0, 0],
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: "Ek İş Toplam:", alignment: "right", bold: true },
              { text: formatCurrency(extraWorkTotal), alignment: "right", bold: true },
            ],
          ],
        },
        layout: "noBorders",
      } as Content);
    } else {
      pdfContent.push({
        text: "Bu dönem için ek iş kaydı bulunmamaktadır.",
        italics: true,
        margin: [0, 10, 0, 10],
      } as Content);
    }

    // Grand Totals
    pdfContent.push({
      text: "GENEL HESAPLAMA",
      style: "sectionHeader",
      margin: [0, 30, 0, 10],
    } as Content);

    pdfContent.push({
      margin: [0, 0, 0, 0],
      table: {
        widths: ["*", "auto"],
        body: [
          [
            { text: "Puantaj Toplam", alignment: "right" },
            { text: formatCurrency(puantajTotal), alignment: "right" },
          ],
          [
            { text: "Ek İş Toplam", alignment: "right" },
            { text: formatCurrency(extraWorkTotal), alignment: "right" },
          ],
          [
            { text: "Toplam (Net)", alignment: "right", bold: true },
            { text: formatCurrency(grandTotal), alignment: "right", bold: true },
          ],
          [
            { text: "KDV (%20)", alignment: "right" },
            { text: formatCurrency(grandKdv), alignment: "right" },
          ],
          [
            { text: "Ara Toplam", alignment: "right" },
            { text: formatCurrency(grandAraToplam), alignment: "right" },
          ],
          [
            { text: "Tevkifat (5/10)", alignment: "right" },
            { text: `-${formatCurrency(grandTevkifat)}`, alignment: "right", color: "red" },
          ],
          [
            { text: "FATURA TUTARI", alignment: "right", bold: true, fontSize: 12 },
            { text: formatCurrency(grandFatura), alignment: "right", bold: true, fontSize: 14 },
          ],
        ],
      },
      layout: "noBorders",
    } as Content);

    // Build PDF document
    const docDefinition: TDocumentDefinitions = {
      content: pdfContent,
      styles: {
        header: {
          fontSize: 18,
          bold: true,
        },
        subheader: {
          fontSize: 14,
          color: "#666",
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: "#333",
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          fillColor: "#f3f4f6",
        },
      },
      defaultStyle: {
        font: "Roboto",
        fontSize: 9,
      },
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [40, 40, 40, 40],
    };

    // Create PDF
    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    // Collect PDF chunks
    const chunks: Buffer[] = [];
    return new Promise<NextResponse>((resolve, reject) => {
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${reportNo}.pdf"`,
            },
          })
        );
      });
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });
  } catch (error) {
    console.error("Supplier report error:", error);
    return NextResponse.json(
      { error: "Rapor oluşturulamadı" },
      { status: 500 }
    );
  }
}
