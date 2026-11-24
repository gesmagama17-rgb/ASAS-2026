import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

export async function buildSampleWordTemplateBuffer(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'TEMPLATE BANK SOAL TKA / ASAS SD (WORD)',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Petunjuk: Guru dapat langsung mengunggah file Word (.docx) soal yang sudah jadi. Format standar di bawah ini mendukung Pilihan Ganda, PG Kompleks, Benar/Salah, Isian Singkat, dan Uraian beserta Skor dan Bobot.'
              ),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'I. PILIHAN GANDA',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: '1. Bagian telinga yang berfungsi menangkap gelombang bunyi dari luar adalah ....',
          }),
          new Paragraph({ text: 'A. Koklea' }),
          new Paragraph({ text: 'B. Daun telinga' }),
          new Paragraph({ text: 'C. Tulang martil' }),
          new Paragraph({ text: 'D. Saluran eustachius' }),
          new Paragraph({ text: 'Kunci: B' }),
          new Paragraph({ text: 'Skor: 1' }),
          new Paragraph({ text: 'Bobot: 1' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'II. PILIHAN GANDA KOMPLEKS',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: '2. Pilihlah dua pernyataan yang merupakan sifat cahaya!',
          }),
          new Paragraph({ text: 'A. Merambat lurus' }),
          new Paragraph({ text: 'B. Hanya merambat di ruang hampa' }),
          new Paragraph({ text: 'C. Dapat dipantulkan' }),
          new Paragraph({ text: 'D. Tidak dapat menembus kaca bening' }),
          new Paragraph({ text: 'Kunci: A, C' }),
          new Paragraph({ text: 'Skor: 2' }),
          new Paragraph({ text: 'Bobot: 2' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'III. BENAR / SALAH',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: '3. Tumbuhan hijau berperan sebagai produsen dalam rantai makanan karena mampu membuat makanan sendiri melalui fotosintesis.',
          }),
          new Paragraph({ text: 'A. Benar' }),
          new Paragraph({ text: 'B. Salah' }),
          new Paragraph({ text: 'Kunci: Benar' }),
          new Paragraph({ text: 'Skor: 1' }),
          new Paragraph({ text: 'Bobot: 1' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'IV. ISIAN SINGKAT',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: '4. Organisme yang menguraikan sisa makhluk hidup menjadi zat hara disebut ....',
          }),
          new Paragraph({ text: 'Kunci: pengurai|dekomposer' }),
          new Paragraph({ text: 'Skor: 2' }),
          new Paragraph({ text: 'Bobot: 1' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'V. URAIAN',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: '5. Jelaskan 3 cara menjaga kesehatan mata agar terhindar dari gangguan penglihatan!',
          }),
          new Paragraph({
            text: 'Kunci: Membaca di tempat terang, menjaga jarak baca minimal 30 cm, dan mengonsumsi makanan bergizi kaya vitamin A.',
          }),
          new Paragraph({
            text: 'Rubrik: Skor 4 jika menyebutkan 3 cara tepat, skor 2 jika 1-2 cara.',
          }),
          new Paragraph({ text: 'Skor: 4' }),
          new Paragraph({ text: 'Bobot: 2' }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
