import type { ExamPackage, Question, QuestionOption, TableData } from '../types/exam';

const SEED_DATE = '2026-11-01T07:00:00.000Z';

function opts(a: string, b: string, c: string, d: string): QuestionOption[] {
  return [
    { id: 'A', text: a },
    { id: 'B', text: b },
    { id: 'C', text: c },
    { id: 'D', text: d },
  ];
}

function pg(
  id: string,
  subject: string,
  prompt: string,
  options: QuestionOption[],
  correctAnswer: string,
  extra?: { passage?: string; diagramId?: string; tableData?: TableData }
): Question {
  return {
    id,
    subject,
    type: 'pg',
    prompt,
    options,
    correctAnswer,
    maxScore: 1,
    weight: 1,
    sourceTag: 'Rujukan ASAS PDF',
    createdAt: SEED_DATE,
    ...extra,
  };
}

function essay(
  id: string,
  subject: string,
  prompt: string,
  correctAnswer: string,
  rubric: string,
  extra?: { passage?: string; diagramId?: string; tableData?: TableData }
): Question {
  return {
    id,
    subject,
    type: 'uraian',
    prompt,
    correctAnswer,
    rubric,
    maxScore: 4,
    weight: 1,
    sourceTag: 'Rujukan ASAS PDF',
    createdAt: SEED_DATE,
    ...extra,
  };
}

// --- 1. IPAS (20 PG + 5 Essay) ---
const IPAS_QUESTIONS: Question[] = [
  pg('ipas-pg-01', 'IPAS', 'Benda berikut yang dapat menghasilkan cahaya sendiri adalah ....', opts('Bulan', 'Cermin', 'Matahari', 'Meja'), 'C'),
  pg('ipas-pg-02', 'IPAS', 'Perhatikan gambar berikut. Sifat cahaya yang ditunjukkan oleh berkas cahaya senter adalah ....', opts('Cahaya dapat menembus benda bening', 'Cahaya merambat lurus', 'Cahaya dapat diuraikan', 'Cahaya selalu dipantulkan'), 'B', { diagramId: 'ipas-senter-gelas' }),
  pg('ipas-pg-03', 'IPAS', 'Ketika kita bercermin, bayangan wajah terlihat karena cahaya mengalami ....', opts('pembiasan', 'penyerapan', 'pemantulan', 'penguraian'), 'C'),
  pg('ipas-pg-04', 'IPAS', 'Pensil yang dimasukkan ke dalam gelas berisi air tampak bengkok. Peristiwa ini terjadi karena ....', opts('cahaya dibiaskan', 'cahaya merambat lurus', 'cahaya diserap', 'cahaya menghasilkan bunyi'), 'A'),
  pg('ipas-pg-05', 'IPAS', 'Benda yang dapat ditembus hampir seluruh cahaya sehingga benda di belakangnya terlihat jelas disebut benda ....', opts('opak', 'transparan', 'gelap', 'kasar'), 'B'),
  pg('ipas-pg-06', 'IPAS', 'Kita dapat melihat sebuah buku karena ....', opts('buku menghasilkan cahaya sendiri', 'cahaya dari buku masuk ke telinga', 'cahaya mengenai buku lalu dipantulkan ke mata', 'mata mengeluarkan cahaya ke buku'), 'C'),
  pg('ipas-pg-07', 'IPAS', 'Bunyi dihasilkan oleh benda yang ....', opts('diam', 'bergetar', 'mencair', 'berubah warna'), 'B'),
  pg('ipas-pg-08', 'IPAS', 'Ketika senar gitar dipetik, bunyi terdengar karena ....', opts('senar bergetar', 'senar berpindah tempat', 'udara berubah menjadi air', 'gitar menghasilkan cahaya'), 'A'),
  pg('ipas-pg-09', 'IPAS', 'Bunyi dapat merambat melalui ....', opts('ruang hampa saja', 'zat padat, cair, dan gas', 'cahaya saja', 'ruang tanpa udara saja'), 'B'),
  pg('ipas-pg-10', 'IPAS', 'Ketika berteriak di dekat tebing, suara terdengar kembali setelah beberapa saat. Peristiwa ini disebut ....', opts('pembiasan', 'gema', 'gaung listrik', 'getaran cahaya'), 'B'),
  pg('ipas-pg-11', 'IPAS', 'Bagian telinga yang berfungsi menangkap gelombang bunyi dari lingkungan ditunjukkan oleh huruf ....', opts('(a)', '(b)', '(c)', '(d)'), 'A', { diagramId: 'ipas-telinga' }),
  pg('ipas-pg-12', 'IPAS', 'Kebiasaan yang baik untuk menjaga kesehatan pendengaran adalah ....', opts('mendengarkan musik dengan volume sangat keras', 'memasukkan benda runcing ke telinga', 'menghindari suara yang terlalu keras', 'membersihkan telinga dengan benda tajam'), 'C'),
  pg('ipas-pg-13', 'IPAS', 'Komponen biotik dalam ekosistem sawah adalah ....', opts('air dan tanah', 'batu dan udara', 'padi dan belalang', 'cahaya matahari dan air'), 'C'),
  pg('ipas-pg-14', 'IPAS', 'Berikut yang termasuk komponen abiotik dalam ekosistem adalah ....', opts('rumput', 'katak', 'jamur', 'air'), 'D'),
  pg('ipas-pg-15', 'IPAS', 'Perhatikan rantai makanan berikut. Organisme yang berperan sebagai produsen adalah ....', opts('rumput', 'belalang', 'katak', 'ular'), 'A', { diagramId: 'ipas-rantai-makanan' }),
  pg('ipas-pg-16', 'IPAS', 'Urutan rantai makanan yang benar adalah ....', opts('ular → rumput → katak → belalang', 'rumput → belalang → katak → ular', 'katak → belalang → rumput → ular', 'belalang → ular → rumput → katak'), 'B'),
  pg('ipas-pg-17', 'IPAS', 'Jika jumlah ular di sawah berkurang drastis, kemungkinan yang terjadi pada populasi katak adalah ....', opts('meningkat karena pemangsanya berkurang', 'langsung punah seluruhnya', 'selalu tetap sama', 'berubah menjadi produsen'), 'A'),
  pg('ipas-pg-18', 'IPAS', 'Benda yang paling mungkin dapat ditarik oleh magnet adalah ....', opts('paku besi', 'penggaris plastik', 'kertas', 'kayu'), 'A'),
  pg('ipas-pg-19', 'IPAS', 'Perhatikan gambar rangkaian listrik di bawah ini. Lampu tidak menyala karena ....', opts('sakelar terbuka sehingga rangkaian terputus', 'lampu terlalu dekat dengan baterai', 'kabel berwarna gelap', 'baterai menghasilkan cahaya'), 'A', { diagramId: 'ipas-rangkaian-listrik' }),
  pg('ipas-pg-20', 'IPAS', 'Setrika listrik mengubah energi listrik menjadi energi ....', opts('bunyi', 'panas', 'gerak', 'kimia'), 'B'),
  essay('ipas-es-21', 'IPAS', 'Jelaskan mengapa magnet dapat menarik paku besi, tetapi tidak dapat menarik benda yang terbuat dari kayu atau plastik! Berikan dua contoh benda yang dapat ditarik magnet.', 'Magnet hanya dapat menarik benda yang terbuat dari bahan feromagnetik seperti besi, baja, nikel, dan kobalt. Kayu dan plastik merupakan bahan nonmagnetik sehingga tidak dapat ditarik magnet. Contoh benda yang dapat ditarik magnet: paku besi, jarum jahit, peniti, gunting besi.', '4: Menjelaskan bahan feromagnetik/magnetik vs nonmagnetik (kayu/plastik) dan memberi 2 contoh tepat; 3: Konsep benar namun contoh/penjelasan kurang lengkap; 2: Menyebutkan contoh benar; 1: Sebagian relevan; 0: Kosong.'),
  essay('ipas-es-22', 'IPAS', 'Berdasarkan jenis makanannya, hewan terbagi menjadi 3 kelompok. Tuliskan ketiga kelompok tersebut beserta contoh hewannya!', '1. Herbivora (pemakan tumbuhan), contoh: sapi, kambing, kelinci. 2. Karnivora (pemakan daging/hewan lain), contoh: singa, elang, harimau. 3. Omnivora (pemakan tumbuhan dan daging), contoh: ayam, tikus, beruang.', '4: Menuliskan ketiga kelompok dengan penjelasan tepat dan contoh hewan benar; 3: Ketiga kelompok benar namun contoh kurang lengkap; 2: Dua kelompok benar; 1: Satu kelompok benar; 0: Kosong.'),
  essay('ipas-es-23', 'IPAS', 'Tuliskan atau gambarkan contoh jaring-jaring makanan yang terdapat pada ekosistem sawah!', 'Contoh jaring-jaring makanan sawah: Padi (produsen) dimakan tikus, belalang, dan ulat. Tikus dimakan ular dan elang. Belalang dimakan katak dan burung pipit. Katak dimakan ular, lalu ular dimakan elang. Pengurai (jamur/bakteri) menguraikan makhluk hidup yang mati.', '4: Menjelaskan minimal 2 rantai makanan yang saling berhubungan di ekosistem sawah mulai produsen hingga predator puncak; 3: Jaring-jaring cukup jelas; 2: Hanya 1 rantai makanan; 1: Menyebutkan komponen sawah saja; 0: Kosong.'),
  essay('ipas-es-24', 'IPAS', 'Tuliskanlah 4 sifat-sifat cahaya beserta contohnya!', '1. Cahaya merambat lurus (contoh: sinar senter atau cahaya matahari masuk celah). 2. Cahaya dapat dipantulkan (contoh: bayangan di cermin). 3. Cahaya dapat menembus benda bening (contoh: cahaya melewati kaca jendela). 4. Cahaya dapat dibiaskan (contoh: pensil di gelas berisi air tampak patah).', '4: Menuliskan 4 sifat cahaya beserta contoh yang tepat; 3: 3 sifat beserta contoh; 2: 2 sifat benar; 1: 1 sifat benar; 0: Kosong.'),
  essay('ipas-es-25', 'IPAS', 'Tuliskan 4 cara menjaga kesehatan telinga!', '1. Menghindari suara yang terlalu keras. 2. Tidak memasukkan benda tajam/runcing ke dalam telinga. 3. Membersihkan bagian luar telinga secara lembut dan teratur. 4. Segera memeriksakan ke dokter THT jika telinga sakit atau berdenging.', '4: Menuliskan 4 cara menjaga kesehatan telinga yang tepat; 3: 3 cara tepat; 2: 2 cara tepat; 1: 1 cara tepat; 0: Kosong.'),
];

// --- 2. MATEMATIKA (20 PG + 5 Essay) ---
const MTK_QUESTIONS: Question[] = [
  pg('mtk-pg-01', 'Matematika', 'Bilangan 426.315 dibaca ....', opts('empat ratus dua puluh enam ribu tiga ratus lima belas', 'empat puluh dua ribu enam ratus tiga belas', 'empat ratus enam puluh dua ribu tiga ratus lima belas', 'empat ratus dua puluh enam ribu tiga puluh lima'), 'A'),
  pg('mtk-pg-02', 'Matematika', 'Pada bilangan 583.241, angka 8 menempati nilai tempat ....', opts('ratusan ribu', 'puluh ribu', 'ribuan', 'ratusan'), 'B'),
  pg('mtk-pg-03', 'Matematika', 'Tanda perbandingan yang tepat untuk 675.210 ... 675.120 adalah ....', opts('<', '>', '=', '+'), 'B'),
  pg('mtk-pg-04', 'Matematika', 'Urutan bilangan dari yang terkecil yang paling tepat adalah ....', opts('245.600, 245.060, 246.005', '245.060, 245.600, 246.005', '246.005, 245.600, 245.060', '245.600, 246.005, 245.060'), 'B'),
  pg('mtk-pg-05', 'Matematika', 'Bilangan berikut yang merupakan bilangan prima adalah ....', opts('21', '27', '29', '35'), 'C'),
  pg('mtk-pg-06', 'Matematika', 'Bilangan 17 disebut bilangan prima karena ....', opts('memiliki satu faktor', 'memiliki tepat dua faktor, yaitu 1 dan 17', 'dapat dibagi semua bilangan', 'merupakan bilangan genap'), 'B'),
  pg('mtk-pg-07', 'Matematika', 'Tiga kelipatan positif pertama dari 6 adalah ....', opts('6, 12, 18', '1, 2, 3', '6, 10, 14', '12, 18, 24'), 'A'),
  pg('mtk-pg-08', 'Matematika', 'Kelipatan persekutuan dari 4 dan 6 adalah ....', opts('8, 16, 24, ...', '10, 20, 30, ...', '12, 24, 36, ...', '24, 36, 48, ...'), 'C'),
  pg('mtk-pg-09', 'Matematika', 'KPK dari 5 dan 8 adalah ....', opts('13', '20', '30', '40'), 'D'),
  pg('mtk-pg-10', 'Matematika', 'Faktor dari 12 adalah ....', opts('1, 2, 3, 4, 6, 12', '1, 2, 4, 8, 12', '2, 3, 5, 6, 12', '1, 3, 4, 6, 8'), 'A'),
  pg('mtk-pg-11', 'Matematika', 'Faktor persekutuan dari 8 dan 12 adalah ....', opts('1, 2, 4', '1, 3, 6', '2, 4, 8', '1, 2, 3, 4, 6'), 'A'),
  pg('mtk-pg-12', 'Matematika', 'FPB dari 18 dan 24 adalah ....', opts('3', '6', '9', '12'), 'B'),
  pg('mtk-pg-13', 'Matematika', 'Keluarga Heslin membeli sebuah pizza saat jalan-jalan ke luar kota. Sampai di rumah Ibu membagi pizza tersebut menjadi 8 bagian sama besar. Kemudian diberikan kepada Heslin 2 potong. Berapakah bagian yang dipunya Heslin jika disederhanakan?', opts('1/4', '2/4', '3/4', '4/3'), 'A'),
  pg('mtk-pg-14', 'Matematika', 'Bentuk pecahan biasa dari 2 1/3 adalah ....', opts('3/7', '5/3', '6/3', '7/3'), 'D'),
  pg('mtk-pg-15', 'Matematika', 'Hasil dari 2/7 + 3/7 adalah ....', opts('5/14', '5/7', '6/7', '1/7'), 'B'),
  pg('mtk-pg-16', 'Matematika', 'Hasil dari 3/4 - 1/6 adalah ....', opts('2/10', '7/12', '18/24', '22/24'), 'B'),
  pg('mtk-pg-17', 'Matematika', 'Bangun datar yang memiliki empat sisi sama panjang dan empat sudut siku-siku adalah ....', opts('persegi', 'persegi panjang', 'segitiga', 'trapesium'), 'A'),
  pg('mtk-pg-18', 'Matematika', 'KPK dari 2, 3, dan 4 adalah ....', opts('12', '8', '6', '4'), 'A'),
  pg('mtk-pg-19', 'Matematika', 'FPB dari 4, 6, dan 8 adalah ....', opts('1', '2', '3', '4'), 'B'),
  pg('mtk-pg-20', 'Matematika', 'Sebuah mistar memiliki panjang 12 cm dan lebar 5 cm. Luasnya adalah ....', opts('17 cm²', '34 cm²', '60 cm²', '120 cm²'), 'C'),
  essay('mtk-es-21', 'Matematika', 'Perpustakaan sekolah memiliki 125.450 buku pelajaran dan 87.625 buku cerita. Kemudian sekolah menerima tambahan 12.750 buku. Berapa jumlah seluruh buku sekarang? Tuliskan langkah perhitungannya.', '125.450 + 87.625 + 12.750 = 213.075 + 12.750 = 225.825 buku.', '4: Operasi dan hasil benar (225.825) serta langkah lengkap; 3: Hasil benar dengan sedikit kekurangan langkah; 2: Proses sebagian benar; 1: Ada langkah relevan; 0: Kosong.'),
  essay('mtk-es-22', 'Matematika', 'Bel sekolah berbunyi setiap 12 menit, sedangkan bel latihan olahraga berbunyi setiap 18 menit. Jika kedua bel berbunyi bersama-sama pada pukul 08.00, berapa menit lagi keduanya akan berbunyi bersama-sama? Tentukan dengan faktorisasi prima atau cara lain.', 'KPK(12, 18): 12 = 2² × 3, 18 = 2 × 3², sehingga KPK = 2² × 3² = 36 menit. Keduanya berbunyi bersama lagi 36 menit kemudian (pukul 08.36).', '4: Faktorisasi/kelipatan, KPK=36 menit, dan kesimpulan benar; 3: Hasil benar langkah kurang lengkap; 2: Proses sebagian benar; 1: Ada langkah relevan; 0: Kosong.'),
  essay('mtk-es-23', 'Matematika', 'Ibu memiliki 36 jeruk dan 48 apel. Semua buah akan dimasukkan ke dalam beberapa paket dengan jumlah jeruk sama banyak dan jumlah apel sama banyak pada setiap paket, tanpa sisa. Berapa paket terbanyak yang dapat dibuat? Berapa jeruk dan apel dalam setiap paket?', 'FPB(36, 48) = 12 paket. Setiap paket berisi 36 ÷ 12 = 3 jeruk dan 48 ÷ 12 = 4 apel.', '4: FPB=12 paket serta isi 3 jeruk dan 4 apel per paket benar; 3: Hasil utama benar dengan kekurangan kecil; 2: Sebagian proses benar; 1: Ada langkah relevan; 0: Kosong.'),
  essay('mtk-es-24', 'Matematika', 'Untuk membuat kue, Sinta menggunakan 1 1/2 kg tepung pada pagi hari dan 3/4 kg pada siang hari. Persediaan tepung semula 3 kg. Berapa kg tepung yang telah digunakan seluruhnya dan berapa kg sisanya? Tuliskan langkah penyelesaian.', 'Tepung digunakan = 1 1/2 + 3/4 = 1 2/4 + 3/4 = 2 1/4 kg. Sisa = 3 - 2 1/4 = 3/4 kg.', '4: Konversi pecahan, penjumlahan (2 1/4 kg), pengurangan (3/4 kg) benar; 3: Hasil benar langkah kurang lengkap; 2: Sebagian langkah benar; 1: Ada langkah relevan; 0: Kosong.'),
  essay('mtk-es-25', 'Matematika', 'Perhatikan gambar taman berbentuk persegi berikut (panjang sisi 4 m). Hitunglah luas taman dan keliling taman tersebut. Tuliskan rumus dan langkah perhitungannya.', 'Luas persegi = s × s = 4 × 4 = 16 m². Keliling persegi = 4 × s = 4 × 4 = 16 m.', '4: Rumus, substitusi, luas (16 m²) dan keliling (16 m) benar beserta satuan; 3: Hasil benar dengan sedikit kekurangan; 2: Satu perhitungan benar; 1: Ada rumus relevan; 0: Kosong.', { diagramId: 'mtk-taman-persegi' }),
];

// --- 3. BAHASA INDONESIA (20 PG + 5 Essay) ---
const BINDO_QUESTIONS: Question[] = [
  pg('bindo-pg-01', 'Bahasa Indonesia', 'Karakter tokoh Rani pada kutipan cerita di atas adalah ....', opts('pemalu dan pendiam', 'ramah dan suka menolong', 'sombong dan acuh', 'ceroboh dan tergesa-gesa'), 'B', { passage: 'Hari pertama masuk kelas lima, Rani melihat Raka duduk sendirian di bangku belakang sambil menunduk. Dengan tersenyum ramah, Rani menghampiri Raka dan mengajaknya berkenalan serta meminjamkan pensil warna miliknya.' }),
  pg('bindo-pg-02', 'Bahasa Indonesia', 'Perhatikan kalimat-kalimat berikut!\n(1) Adik membaca buku cerita di teras rumah.\n(2) Dito dikenal sebagai anak yang jujur dan teliti.\n(3) Ibu membeli buah-buahan di pasar pagi tadi.\n(4) Kakak menyiram tanaman setiap sore.\nKalimat yang memuat kata sifat untuk menggambarkan karakter seseorang ditunjukkan oleh nomor ....', opts('(1)', '(2)', '(3)', '(4)'), 'B'),
  pg('bindo-pg-03', 'Bahasa Indonesia', 'Rencel selalu rajin mengulang pelajaran di rumah setiap malam sehingga prestasinya membanggakan.\nSinonim dari kata "rajin" pada kalimat di atas adalah ....', opts('malas', 'santai', 'giat', 'lamban'), 'C'),
  pg('bindo-pg-04', 'Bahasa Indonesia', 'Walaupun memiliki banyak prestasi di bidang melukis, Elsa bukanlah anak yang sombong, melainkan anak yang sangat ....', opts('rendah hati', 'tinggi hati', 'keras kepala', 'besar kepala'), 'A'),
  pg('bindo-pg-05', 'Bahasa Indonesia', 'Paman Bima bekerja sebagai pelukis pemandangan alam yang karyanya sudah dipamerkan di berbagai kota.\nMakna awalan pe- pada kata "pelukis" dalam kalimat tersebut adalah menyatakan ....', opts('alat untuk melakukan pekerjaan', 'sifat atau karakter seseorang', 'orang yang memiliki profesi atau pekerjaan', 'tempat berlangsungnya kegiatan'), 'C'),
  pg('bindo-pg-06', 'Bahasa Indonesia', 'Latar tempat dan waktu terjadinya peristiwa pada kutipan cerita di atas adalah ....', opts('ruang kelas pada siang hari', 'perpustakaan sekolah pada pagi hari', 'halaman sekolah pada sore hari', 'ruang guru pada pagi hari'), 'B', { passage: 'Pagi itu, suasana di perpustakaan sekolah tampak tenang. Sinar matahari masuk melalui jendela kaca, menerangi rak-rak buku yang tersusun rapi. Lala asyik membaca buku ensiklopedia satwa bersama Budi.' }),
  pg('bindo-pg-07', 'Bahasa Indonesia', 'Perhatikan kalimat berikut!\n"Angin pagi berbisik lembut menyapa dedaunan di halaman sekolah."\nMajas yang digunakan pada kalimat di atas adalah ....', opts('majas metafora', 'majas hiperbola', 'majas personifikasi', 'majas asosiasi'), 'C'),
  pg('bindo-pg-08', 'Bahasa Indonesia', 'Penulisan kalimat langsung yang paling tepat sesuai kaidah ejaan dan tanda baca adalah ....', opts('Ibu berkata, "Jangan lupa merapikan buku setelah belajar!"', 'Ibu berkata "Jangan lupa merapikan buku setelah belajar"!', '"Ibu berkata", Jangan lupa merapikan buku setelah belajar!', 'Ibu berkata, Jangan lupa merapikan buku setelah belajar!'), 'A'),
  pg('bindo-pg-09', 'Bahasa Indonesia', 'Berikut ini yang merupakan kelompok judul buku bacaan nonfiksi adalah ....', opts('Legenda Danau Toba dan Si Kancil', 'Petualangan di Negeri Awan dan Putri Salju', 'Ensiklopedia Tata Surya dan Cara Merawat Tanaman Hias', 'Dongeng Nusantara dan Misteri Pulau Hantu'), 'C'),
  pg('bindo-pg-10', 'Bahasa Indonesia', 'Bagian awal pada sebuah buku yang memuat daftar judul bab beserta nomor halamannya untuk memudahkan pembaca mencari materi disebut ....', opts('glosarium', 'daftar pustaka', 'kata pengantar', 'daftar isi'), 'D'),
  pg('bindo-pg-11', 'Bahasa Indonesia', 'Kalimat utama paragraf di atas terletak pada ....', opts('kalimat pertama', 'kalimat kedua', 'kalimat ketiga', 'seluruh kalimat'), 'A', { passage: 'Berkebun merupakan hobi yang sangat bermanfaat bagi kesehatan dan lingkungan. Dengan berkebun, tubuh kita banyak bergerak sehingga menjadi lebih bugar. Selain itu, tanaman yang tumbuh subur membuat udara di sekitar rumah terasa sejuk dan asri.' }),
  pg('bindo-pg-12', 'Bahasa Indonesia', 'Sebuah teks yang berisi tujuan serta langkah-langkah berurutan dan sistematis untuk membuat atau melakukan sesuatu disebut teks ....', opts('narasi', 'deskripsi', 'prosedur', 'eksposisi'), 'C'),
  pg('bindo-pg-13', 'Bahasa Indonesia', 'Jika kata dasar "tulis" dan "sapu" diberi imbuhan awalan me-, bentuk penulisan kata yang baku dan tepat adalah ....', opts('mentulis dan mensapu', 'menulis dan menyapu', 'metulis dan mesapu', 'memtulis dan memsapu'), 'B'),
  pg('bindo-pg-14', 'Bahasa Indonesia', 'Perhatikan kalimat berikut!\n"Potonglah kertas origami menjadi dua bagian yang sama besar!"\nFungsi imbuhan akhiran -lah pada kata "potonglah" dalam teks prosedur tersebut adalah ....', opts('menyatakan larangan', 'menyatakan kalimat perintah yang halus', 'menyatakan kejadian masa lampau', 'menyatakan sebab akibat'), 'B'),
  pg('bindo-pg-15', 'Bahasa Indonesia', 'Perhatikan dua kalimat tunggal berikut!\nKalimat 1: Edo gemar bermain sepak bola.\nKalimat 2: Kakaknya lebih suka membaca komik di rumah.\nPenggabungan kedua kalimat tersebut menjadi kalimat majemuk setara yang tepat adalah ....', opts('Edo gemar bermain sepak bola dan kakaknya lebih suka membaca komik di rumah.', 'Edo gemar bermain sepak bola atau kakaknya lebih suka membaca komik di rumah.', 'Edo gemar bermain sepak bola, sedangkan kakaknya lebih suka membaca komik di rumah.', 'Edo gemar bermain sepak bola sehingga kakaknya lebih suka membaca komik di rumah.'), 'C'),
  pg('bindo-pg-16', 'Bahasa Indonesia', 'Objek yang dideskripsikan pada paragraf tersebut adalah ....', opts('tas sekolah', 'buku tulis', 'kotak pensil', 'papan tulis'), 'B', { passage: 'Benda kesayanganku berbentuk persegi panjang dengan sampul berwarna biru cerah. Di bagian tengah sampulnya terdapat gambar roket luar angkasa. Di dalamnya berisi lembaran kertas bergaris putih bersih tempatku mencatat pelajaran sekolah setiap hari.' }),
  pg('bindo-pg-17', 'Bahasa Indonesia', 'Ubahlah kalimat langsung berikut menjadi kalimat tidak langsung!\nNadia berkata, "Aku akan meminjam buku cerita ini besok."\nBentuk kalimat tidak langsung yang tepat adalah ....', opts('Nadia berkata bahwa dia akan meminjam buku cerita itu keesokan harinya.', 'Nadia berkata bahwa aku akan meminjam buku cerita ini besok.', 'Nadia berkata, dia akan meminjam buku cerita itu besok.', 'Nadia berkata bahwa dia akan meminjam buku cerita ini sekarang.'), 'A'),
  pg('bindo-pg-18', 'Bahasa Indonesia', 'Bagian penutup yang tepat untuk melengkapi surat tersebut adalah ....', opts('Demikian permohonan ini disampaikan. Atas perhatiannya, kami ucapkan terima kasih.', 'Demikian undangan ini kami sampaikan. Atas perhatian Bapak kami ucapkan terima kasih.', 'Demikian informasi ini disampaikan. Atas kehadiran tepat waktu, kami ucapkan terima kasih.', 'Demikian permohonan ini kami sampaikan. Atas perhatian Bapak, kami ucapkan terima kasih.'), 'B', { passage: 'Dengan hormat,\nDalam rangka Ulang Tahun SDN 2 Makale Selatan, kami bermaksud mengadakan acara seminar dengan tema "Berprestasi Tanpa Narkoba". Oleh karena itu, kami mohon Bapak berkenan menjadi narasumber. Kegiatan akan dilaksanakan pada hari, tanggal : Selasa 18 Oktober 2026, pukul 13.00 WIB, tempat : Lapangan upacara SDN 2 Makale Selatan.\n[ ... ]' }),
  pg('bindo-pg-19', 'Bahasa Indonesia', 'Perhatikan langkah-langkah acak membuat pembatas buku berikut!\n(1) Hiasi kertas karton dengan gambar dan warna sesuai selera.\n(2) Siapkan kertas karton, gunting, pensil warna, dan pita.\n(3) Lubangi bagian atas karton lalu ikatkan pita sebagai hiasan.\n(4) Gunting kertas karton berbentuk persegi panjang berukuran 5 × 15 cm.\nUrutan langkah teks prosedur yang tepat adalah ....', opts('(2) – (1) – (4) – (3)', '(2) – (4) – (1) – (3)', '(4) – (2) – (1) – (3)', '(2) – (4) – (3) – (1)'), 'B'),
  pg('bindo-pg-20', 'Bahasa Indonesia', 'Kutipan surat pribadi di atas merupakan bagian ....', opts('alamat dan tanggal surat', 'penutup surat', 'pembuka dan awal isi surat', 'tanda tangan pengirim'), 'C', { passage: '"Halo Tari, apa kabar? Semoga kamu dan keluarga di Makassar selalu sehat, ya. Oh iya, sekarang aku sedang menekuni hobi baru, yaitu membuat kerajinan gantungan kunci dari tali makrame. Ternyata sangat seru, lho!"' }),
  essay('bindo-es-21', 'Bahasa Indonesia', 'Tulislah satu paragraf singkat (minimal 3 kalimat) yang mendeskripsikan ciri fisik dan sifat sahabatmu di sekolah! Gunakan minimal dua kata sifat dan satu kalimat majemuk setara di dalam paragraf tersebut!', 'Contoh jawaban: Sahabatku di sekolah bernama Tino. Ia memiliki tubuh yang tinggi dan rambut ikal berwarna hitam. Tino adalah anak yang rajin belajar dan ramah kepada semua teman, sedangkan adiknya sedikit pemalu.', '4: Minimal 3 kalimat deskriptif, memuat ≥ 2 kata sifat dan 1 kalimat majemuk setara dengan ejaan tepat; 3: Hampir lengkap; 2: Kurang salah satu unsur; 1: Menulis singkat tanpa syarat lengkap; 0: Kosong.'),
  essay('bindo-es-22', 'Bahasa Indonesia', 'Bacalah kutipan cerita berikut!\n"Sore itu di taman desa, Bima menemukan sebuah dompet kulit berwarna cokelat tergeletak di dekat bangku taman. Meskipun tidak ada orang yang melihat, Bima segera membawa dompet tersebut ke pos keamanan desa untuk dikembalikan kepada pemiliknya."\nTuliskan tokoh, watak tokoh, latar (tempat dan waktu), serta amanat dari kutipan cerita di atas!', 'Tokoh: Bima. Watak tokoh: Jujur dan bertanggung jawab. Latar: Taman desa (tempat) pada sore hari (waktu). Amanat: Kita harus selalu bersikap jujur dan mengembalikan barang temuan kepada pemiliknya meskipun tidak ada yang melihat.', '4: Menyebutkan keempat unsur (tokoh, watak, latar tempat & waktu, amanat) dengan benar; 3: Tiga unsur tepat; 2: Dua unsur tepat; 1: Satu unsur tepat; 0: Kosong.'),
  essay('bindo-es-23', 'Bahasa Indonesia', 'Jelaskan dua perbedaan utama antara buku fiksi dan buku nonfiksi, kemudian sebutkan tiga bagian penting yang biasanya terdapat pada sebuah buku!', 'Perbedaan: 1) Buku fiksi berisi cerita rekaan/khayalan, sedangkan nonfiksi berisi fakta nyata/penelitian. 2) Bahasa fiksi bersifat imajinatif/kiasan, sedangkan nonfiksi lugas dan baku. Tiga bagian penting buku: sampul (cover), daftar isi, dan isi/bab buku (atau kata pengantar/glosarium).', '4: Dua perbedaan tepat dan 3 bagian buku tepat; 3: Dua perbedaan atau 3 bagian kurang lengkap; 2: Sebagian benar; 1: Menjawab singkat; 0: Kosong.'),
  essay('bindo-es-24', 'Bahasa Indonesia', 'Susunlah sebuah teks prosedur sederhana tentang cara melakukan kegiatan hobi (misalnya cara menanam bunga di pot atau cara membuat minuman jus buah)! Tuliskan tujuan, alat/bahan, dan minimal 4 langkah berurutan menggunakan kata berimbuhan akhiran -lah atau -kan!', 'Tujuan: Membuat jus jeruk segar. Alat & Bahan: 2 buah jeruk manis, gula pasir, air matang, es batu, pemeras jeruk, gelas. Langkah: 1. Cucilah jeruk hingga bersih. 2. Belahlah menjadi dua dan peraslah ke dalam gelas. 3. Tambahkan gula dan air matang, lalu aduklah hingga larut. 4. Masukkan es batu dan sajikan.', '4: Lengkap memuat tujuan, alat/bahan, ≥ 4 langkah berurutan, dan kata berimbuhan -lah/-kan; 3: Struktur lengkap namun imbuhan kurang; 2: Langkah tidak lengkap; 1: Sangat singkat; 0: Kosong.'),
  essay('bindo-es-25', 'Bahasa Indonesia', 'Bayangkan kamu ingin mengirim surat pribadi kepada sahabatmu di luar kota untuk menceritakan hobi yang sedang kamu tekuni. Tuliskan bagian pembuka (tempat dan tanggal surat, salam pembuka) serta isi surat pribadi tersebut menggunakan bahasa yang santun dan ejaan yang tepat!', 'Contoh: Makale, 12 November 2026. Halo sahabatku Rina di Makassar, Apa kabarmu di sana? Semoga kamu selalu sehat dan semangat belajar, ya. Melalui surat ini, aku ingin bercerita tentang hobi baruku, yaitu melukis pemandangan alam...', '4: Memuat tempat & tanggal, salam pembuka, isi cerita hobi yang jelas, bahasa santun & ejaan tepat; 3: Cukup lengkap; 2: Kurang bagian pembuka/isi kurang jelas; 1: Sangat singkat; 0: Kosong.'),
];

// --- 4. PENDIDIKAN PANCASILA (20 PG + 5 Essay) ---
const PANCASILA_QUESTIONS: Question[] = [
  pg('pp-pg-01', 'Pendidikan Pancasila', 'Simbol yang melambangkan sila pertama Pancasila yang berbunyi "Ketuhanan Yang Maha Esa" adalah ....', opts('rantai emas', 'bintang', 'pohon beringin', 'padi dan kapas'), 'B'),
  pg('pp-pg-02', 'Pendidikan Pancasila', 'Contoh perilaku di sekolah yang sesuai dengan pengamalan nilai-nilai sila pertama Pancasila adalah ....', opts('berdoa sebelum dan sesudah belajar dengan khusyuk', 'membagi tugas piket kelas secara adil', 'menolong teman yang terjatuh di lapangan', 'bermusyawarah memilih ketua kelas'), 'A'),
  pg('pp-pg-03', 'Pendidikan Pancasila', 'Saat jam istirahat, Sarah melihat Nur terjatuh dan buku-bukunya berserakan di lantai. Sarah segera membantu Nur berdiri dan merapikan bukunya. Perilaku Sarah mencerminkan pengamalan Pancasila sila ke- ....', opts('satu', 'dua', 'tiga', 'empat'), 'B'),
  pg('pp-pg-04', 'Pendidikan Pancasila', 'Di kelas V terdapat siswa yang berasal dari berbagai suku dan daerah yang berbeda. Sikap yang tepat untuk menjaga persatuan sesuai sila ketiga Pancasila adalah ....', opts('hanya mau bermain dengan teman yang satu daerah saja', 'mengejek logat bahasa daerah teman yang berbeda', 'berteman dengan siapa saja tanpa membeda-bedakan suku', 'memilih-milih teman saat membentuk kelompok belajar'), 'C'),
  pg('pp-pg-05', 'Pendidikan Pancasila', 'Ketika teman sedang menyampaikan usulan dalam diskusi kelas, sikap yang mencerminkan nilai kerakyatan pada sila keempat Pancasila adalah ....', opts('memotong pembicaraan teman karena tidak setuju', 'menghargai pendapat orang lain dengan mendengarkan secara saksama', 'memaksakan pendapat sendiri agar disetujui semua teman', 'mengobrol sendiri saat teman sedang berbicara'), 'B'),
  pg('pp-pg-06', 'Pendidikan Pancasila', 'Contoh perilaku yang mencerminkan nilai keadilan sosial sesuai sila kelima Pancasila di lingkungan sekolah adalah ....', opts('membagi tugas piket kelas secara adil kepada seluruh anggota', 'memberikan tugas yang paling berat hanya kepada satu teman', 'membiarkan teman bekerja sendirian saat kerja bakti', 'mengutamakan kepentingan pribadi di atas kepentingan kelas'), 'A'),
  pg('pp-pg-07', 'Pendidikan Pancasila', 'Perhatikan pernyataan berikut!\n"Warga desa bersama-sama memperbaiki jembatan yang rusak akibat banjir tanpa mengharapkan imbalan."\nPerilaku tersebut merupakan penerapan Pancasila, khususnya sila yang dilambangkan dengan ....', opts('bintang', 'kepala banteng', 'pohon beringin', 'padi dan kapas'), 'C'),
  pg('pp-pg-08', 'Pendidikan Pancasila', 'Manfaat utama yang dirasakan apabila seluruh warga sekolah dan masyarakat menerapkan nilai-nilai Pancasila dalam kehidupan sehari-hari adalah ....', opts('munculnya persaingan yang tidak sehat antarteman', 'terciptanya kerukunan, kedamaian, dan persatuan', 'setiap orang bebas berbuat sesuka hatinya tanpa aturan', 'berkurangnya rasa kepedulian terhadap sesama'), 'B'),
  pg('pp-pg-09', 'Pendidikan Pancasila', 'Dalam kehidupan bermasyarakat, pengertian dari norma adalah ....', opts('kebiasaan yang boleh dilanggar kapan saja', 'aturan atau pedoman perilaku untuk mengatur kehidupan manusia', 'keinginan pribadi yang harus diikuti orang lain', 'hukuman yang diberikan kepada orang yang berprestasi'), 'B'),
  pg('pp-pg-10', 'Pendidikan Pancasila', 'Berikut ini yang merupakan contoh penerapan norma agama dalam kehidupan sehari-hari adalah ....', opts('mengucapkan permisi saat berjalan di depan orang tua', 'memakai helm saat mengendarai sepeda motor di jalan raya', 'beribadah tepat waktu sesuai ajaran agama masing-masing', 'mengembalikan dompet yang ditemukan di jalan kepada pemiliknya'), 'C'),
  pg('pp-pg-11', 'Pendidikan Pancasila', 'Perhatikan beberapa perilaku berikut!\n1) Berbicara santun dan lembut kepada orang tua serta guru.\n2) Menerobos lampu merah saat lalu lintas sepi.\n3) Mengucapkan salam ketika masuk ke dalam rumah.\n4) Mengambil barang milik teman tanpa izin.\nContoh perilaku yang sesuai dengan norma kesopanan ditunjukkan oleh nomor ....', opts('1 dan 2', '1 dan 3', '2 dan 4', '3 dan 4'), 'B'),
  pg('pp-pg-12', 'Pendidikan Pancasila', 'Setiap sekolah memiliki tata tertib yang wajib dipatuhi oleh seluruh warga sekolah. Tujuan utama dibuatnya peraturan di lingkungan sekolah adalah untuk ....', opts('membatasi kebebasan siswa dalam bermain', 'memberikan hukuman sebanyak-banyaknya kepada siswa', 'menciptakan ketertiban, keamanan, dan kenyamanan belajar', 'membuat siswa merasa takut datang ke sekolah'), 'C'),
  pg('pp-pg-13', 'Pendidikan Pancasila', 'Pengertian musyawarah yang tepat dalam kehidupan bermasyarakat adalah ....', opts('keputusan yang diambil secara sepihak oleh ketua kelompok', 'membahas suatu masalah bersama untuk mencapai keputusan bersama', 'perdebatan untuk mencari siapa yang paling pintar berbicara', 'pemungutan suara tanpa mendengarkan pendapat anggota'), 'B'),
  pg('pp-pg-14', 'Pendidikan Pancasila', 'Ketika mengikuti kegiatan musyawarah di kelas, ada teman yang menyampaikan pendapat yang berbeda dengan pendapatmu. Sikap yang harus kamu tunjukkan adalah ....', opts('mendengarkan dan menghargai pendapat tersebut dengan lapang dada', 'menertawakan pendapat teman karena dianggap kurang bagus', 'langsung meninggalkan ruang kelas karena merasa kesal', 'menyuruh teman tersebut berhenti berbicara'), 'A'),
  pg('pp-pg-15', 'Pendidikan Pancasila', 'Siswa kelas V mengadakan kegiatan gotong royong membersihkan halaman sekolah. Meskipun berasal dari latar belakang suku dan agama yang berbeda, mereka bekerja sama dengan kompak sehingga pekerjaan cepat selesai. Nilai Pancasila yang tercermin dalam ilustrasi tersebut adalah ....', opts('Ketuhanan Yang Maha Esa (sila pertama)', 'Kemanusiaan yang adil dan beradab (sila kedua)', 'Persatuan Indonesia (sila ketiga)', 'Keadilan sosial bagi seluruh rakyat Indonesia (sila kelima)'), 'C'),
  pg('pp-pg-16', 'Pendidikan Pancasila', 'Perhatikan tabel pasangan perilaku dan sila Pancasila berikut!\nPasangan perilaku dan sila Pancasila yang tepat ditunjukkan oleh nomor ....', opts('1, 2, dan 3', '1, 2, dan 4', '1, 3, dan 4', '2, 3, dan 4'), 'B', { tableData: { headers: ['No', 'Perilaku', 'Sila Pancasila'], rows: [['1', 'Membantu korban bencana alam', 'Sila kedua'], ['2', 'Mengikuti upacara bendera dengan khidmat', 'Sila ketiga'], ['3', 'Menghormati teman yang sedang beribadah', 'Sila keempat'], ['4', 'Menabung dan hidup hemat', 'Sila kelima']] } }),
  pg('pp-pg-17', 'Pendidikan Pancasila', 'Ekal tidak sengaja menemukan penghapus milik Geral yang terjatuh di bawah meja. Meskipun tidak ada orang yang melihat, Ekal merasa bersalah jika menyimpannya sehingga ia segera mengembalikan penghapus tersebut kepada Geral. Tindakan Ekal didasari oleh hati nurani yang sesuai dengan ....', opts('norma hukum', 'norma kesopanan', 'norma kesusilaan', 'norma adat'), 'C'),
  pg('pp-pg-18', 'Pendidikan Pancasila', 'Di sebuah sekolah, beberapa siswa sering datang terlambat, membuang sampah sembarangan, dan tidak mengerjakan tugas piket. Akibat yang mungkin terjadi dari pelanggaran aturan tersebut adalah ....', opts('lingkungan sekolah menjadi bersih dan nyaman', 'terjadi ketidaktertiban dan terganggunya kenyamanan belajar', 'hubungan antarwarga sekolah semakin harmonis', 'kegiatan belajar mengajar berjalan lebih lancar'), 'B'),
  pg('pp-pg-19', 'Pendidikan Pancasila', 'Perhatikan tahapan pelaksanaan musyawarah berikut!\n1) Membahas dan mempertimbangkan berbagai usulan\n2) Menyampaikan pokok permasalahan yang akan dibahas\n3) Mengambil dan menyepakati keputusan bersama\n4) Memberikan kesempatan peserta mengemukakan pendapat\nUrutan tahapan musyawarah yang paling tepat adalah ....', opts('2 – 4 – 1 – 3', '2 – 1 – 4 – 3', '4 – 2 – 1 – 3', '1 – 2 – 4 – 3'), 'A'),
  pg('pp-pg-20', 'Pendidikan Pancasila', 'Dalam musyawarah pemilihan tujuan karya wisata kelas, usulan Andi tidak terpilih karena sebagian besar teman memilih tempat lain. Sikap yang seharusnya ditunjukkan oleh Andi adalah ....', opts('menolak ikut kegiatan karya wisata bersama teman-teman', 'marah kepada ketua kelas yang memimpin musyawarah', 'menerima dan melaksanakan keputusan bersama dengan penuh tanggung jawab', 'mengajak teman lain untuk membatalkan hasil musyawarah'), 'C'),
  essay('pp-es-21', 'Pendidikan Pancasila', 'Di kelas V terdapat satu murid yang agamanya berbeda dengan mayoritas siswa di kelas. Beberapa teman terlihat enggan mengajaknya bermain, bahkan tidak mau mendekatinya. Bagaimana sikap yang seharusnya kamu lakukan sesuai dengan nilai-nilai Pancasila? Jelaskan alasanmu!', 'Sikap: Menyambut dengan ramah, menghargai perbedaan agama, mengajak bermain bersama, dan menasihati teman lain agar tidak membeda-bedakan (sesuai sila pertama dan sila ketiga). Alasan: Agar teman baru merasa nyaman dan kerukunan serta persatuan kelas tetap terjaga.', '4: Menyebutkan sila terkait, tindakan konkret toleransi, dan alasan tepat; 3: Sikap dan alasan benar namun sila belum disebut; 2: Hanya sikap benar; 1: Jawaban sangat umum; 0: Kosong.'),
  essay('pp-es-22', 'Pendidikan Pancasila', 'Bacalah kasus berikut dengan saksama!\n"Di sebuah kompleks perumahan, seorang warga memutar musik dengan suara sangat keras hingga larut malam sehingga mengganggu tetangga yang sedang beristirahat dan belajar."\nIdentifikasilah jenis norma yang dilanggar dalam peristiwa tersebut, lalu jelaskan alasan mengapa perilaku itu melanggar norma serta akibat yang ditimbulkannya!', 'Jenis norma: Norma kesopanan (dan norma hukum/ketertiban umum). Alasan: Tidak menghormati hak tetangga untuk beristirahat pada malam hari. Akibat: Mengganggu ketenangan lingkungan, menghambat warga belajar/istirahat, dan memicu pertengkaran antarwarga.', '4: Jenis norma, alasan pelanggaran, dan akibat dijawab lengkap; 3: Dua aspek lengkap; 2: Satu aspek tepat; 1: Menjawab singkat; 0: Kosong.'),
  essay('pp-es-23', 'Pendidikan Pancasila', 'Steven ketahuan mencoret-coret dinding kelas dan tidak memakai atribut seragam lengkap saat upacara bendera. Sebagai siswa yang bertanggung jawab terhadap tata tertib sekolah, tindakan apa saja yang seharusnya dilakukan Steven untuk memperbaiki perilakunya tersebut? Jelaskan!', 'Steven harus menyadari kesalahannya, meminta maaf kepada guru, membersihkan/mengecat kembali dinding yang dicoret, melengkapi atribut seragam upacara, menerima sanksi dengan lapang dada, serta berjanji mematuhi tata tertib agar sekolah tetap rapi dan disiplin.', '4: Mengakui kesalahan, tindakan perbaikan konkret (membersihkan dinding & melengkapi atribut), serta kesadaran disiplin; 3: Tindakan perbaikan benar namun belum lengkap; 2: Sebagian tepat; 1: Jawaban singkat; 0: Kosong.'),
  essay('pp-es-24', 'Pendidikan Pancasila', 'Kelas V berencana mengadakan pentas seni akhir tahun. Namun, terjadi perbedaan pendapat yang cukup tajam antara kelompok siswa yang ingin menampilkan drama dan kelompok yang ingin menampilkan tari daerah. Jelaskan langkah-langkah musyawarah yang tepat agar kelas V dapat mencapai kesepakatan bersama secara damai!', 'Langkah musyawarah: 1) Menyampaikan pokok permasalahan secara adil; 2) Memberi kesempatan kedua kelompok mengemukakan pendapat bergantian; 3) Membahas dan mempertimbangkan usulan terbaik (misalnya memadukan drama dan tari daerah); 4) Menyepakati keputusan bersama dan menjalankannya dengan tanggung jawab.', '4: Menjelaskan 4 langkah musyawarah runtut dan solusi damai; 3: Langkah cukup runtut; 2: Hanya menyebut musyawarah/voting tanpa langkah jelas; 1: Jawaban sangat singkat; 0: Kosong.'),
  essay('pp-es-25', 'Pendidikan Pancasila', 'Dalam kerja kelompok membuat poster, ketua kelompok membagi tugas secara tidak adil. Dua orang anggota diberi tugas yang sangat berat, sedangkan dua anggota lainnya hanya mendapat tugas yang sangat ringan sehingga memicu pertengkaran. Berikan solusi untuk menyelesaikan masalah tersebut berdasarkan nilai-nilai Pancasila dan prinsip musyawarah!', 'Menghentikan pertengkaran lalu bermusyawarah ulang secara terbuka sesuai sila ke-4 dan keadilan sosial (sila ke-5). Pembagian tugas diatur ulang secara adil sesuai kemampuan masing-masing anggota, lalu semua anggota melaksanakan kesepakatan dengan tanggung jawab.', '4: Mengaitkan sila ke-4 & ke-5 serta solusi musyawarah pembagian tugas adil; 3: Solusi tepat namun nilai sila kurang jelas; 2: Solusi singkat; 1: Sangat singkat; 0: Kosong.'),
];

// --- 5. SENI MUSIK (20 PG + 5 Essay) ---
const MUSIK_QUESTIONS: Question[] = [
  pg('musik-pg-01', 'Seni Musik', 'Perbedaan bunyi yang dihasilkan oleh pita suara manusia sehingga terdengar melengking atau berat/besar disebut sebagai perbedaan ....', opts('volume dan tempo suara', 'suara tinggi dan suara rendah', 'irama dan ketukan suara', 'warna dan dinamika suara'), 'B'),
  pg('musik-pg-02', 'Seni Musik', 'Jenis suara perempuan yang memiliki wilayah jangkauan nada paling tinggi disebut ....', opts('alto', 'mezzosopran', 'sopran', 'tenor'), 'C'),
  pg('musik-pg-03', 'Seni Musik', 'Jenis suara perempuan yang memiliki wilayah jangkauan nada paling rendah dan terdengar berat disebut ....', opts('sopran', 'mezzosopran', 'bas', 'alto'), 'D'),
  pg('musik-pg-04', 'Seni Musik', 'Laki-laki dewasa yang memiliki karakter suara merdu dengan jangkauan nada yang tinggi termasuk dalam jenis suara ....', opts('tenor', 'bariton', 'bas', 'alto'), 'A'),
  pg('musik-pg-05', 'Seni Musik', 'Jenis suara laki-laki dewasa yang memiliki wilayah jangkauan nada paling rendah dan terdengar sangat berat disebut ....', opts('sopran', 'tenor', 'bariton', 'bas'), 'D'),
  pg('musik-pg-06', 'Seni Musik', 'Perhatikan ciri-ciri suara berikut!\n1) Dimiliki oleh penyanyi laki-laki dewasa.\n2) Memiliki jangkauan nada menengah (antara nada tinggi dan nada rendah).\n3) Terdengar lebih berat dari tenor, tetapi lebih ringan dari bas.\nBerdasarkan karakteristik tersebut, jenis suara yang dimaksud adalah ....', opts('sopran', 'alto', 'bariton', 'mezzosopran'), 'C'),
  pg('musik-pg-07', 'Seni Musik', 'Manfaat utama mengenali jenis dan batas kemampuan suara sendiri sebelum bernyanyi adalah agar penyanyi dapat ....', opts('meniru gaya bernyanyi penyanyi terkenal dengan persis', 'memilih lagu sesuai jangkauan suara sehingga tidak merusak pita suara', 'menyanyikan semua lagu dengan nada yang sangat tinggi', 'bernyanyi lebih keras daripada suara alat musik pengiring'), 'B'),
  pg('musik-pg-08', 'Seni Musik', 'Sikap atau posisi tubuh yang paling baik dan benar saat bernyanyi agar aliran udara berjalan lancar adalah ....', opts('berdiri tegak dan rileks', 'membungkuk ke depan agar suara terdengar dekat', 'duduk bersandar dengan bahu terangkat', 'berdiri kaku dengan kepala menunduk'), 'A'),
  pg('musik-pg-09', 'Seni Musik', 'Teknik pernapasan yang paling dianjurkan dalam kegiatan bernyanyi karena mampu menampung udara lebih banyak dan stabil adalah ....', opts('pernapasan dada', 'pernapasan bahu', 'pernapasan hidung', 'pernapasan diafragma'), 'D'),
  pg('musik-pg-10', 'Seni Musik', 'Dalam bernyanyi, kemampuan mengucapkan setiap huruf dan kata secara jelas sehingga lirik lagu dapat dipahami pendengar disebut ....', opts('intonasi', 'artikulasi', 'frasering', 'resonansi'), 'B'),
  pg('musik-pg-11', 'Seni Musik', 'Pengertian dari intonasi dalam teknik bernyanyi adalah ....', opts('kejelasan pengucapan kata-kata dalam syair lagu', 'pemenggalan kalimat lagu di tempat yang tepat', 'ketepatan tinggi rendah nada saat menyanyikan lagu', 'keras lembutnya suara saat menyanyikan bagian lagu'), 'C'),
  pg('musik-pg-12', 'Seni Musik', 'Aturan pemenggalan kalimat bahasa maupun kalimat musik yang baik dan benar sesuai makna lagu serta tempat mengambil napas disebut ....', opts('frasering', 'artikulasi', 'intonasi', 'ekspresi'), 'A'),
  pg('musik-pg-13', 'Seni Musik', 'Perhatikan gambar berikut! Alat musik pada gambar yang berfungsi utama untuk mengatur irama dan ketukan lagu adalah ....', opts('pianika', 'seruling', 'gendang', 'gitar'), 'C', { diagramId: 'musik-alat-1' }),
  pg('musik-pg-14', 'Seni Musik', 'Perhatikan gambar berikut! Alat musik yang mampu menghasilkan rangkaian nada atau melodi utama sebuah lagu ditunjukkan oleh ....', opts('marakas', 'triangle', 'tamborin', 'pianika'), 'D', { diagramId: 'musik-alat-2' }),
  pg('musik-pg-15', 'Seni Musik', 'Perhatikan daftar alat musik berikut! Pengelompokan alat musik ritmis dan melodis yang tepat secara berurutan (1–4) adalah ....', opts('ritmis - melodis - melodis - ritmis', 'ritmis - melodis - ritmis - melodis', 'ritmis - ritmis - melodis - melodis', 'melodis - ritmis - melodis - ritmis'), 'B', { diagramId: 'musik-alat-3' }),
  pg('musik-pg-16', 'Seni Musik', 'Saat tampil menyanyikan lagu wajib nasional di depan kelas, Raka sering kehabisan napas di tengah kalimat lagu sehingga lagunya terdengar terputus-putus. Teknik bernyanyi yang perlu dilatih dan diperbaiki oleh Raka adalah ....', opts('teknik pernapasan', 'teknik artikulasi', 'sikap berdiri', 'ekspresi wajah'), 'A'),
  pg('musik-pg-17', 'Seni Musik', 'Rani menyanyikan sebuah lagu daerah dengan nada yang sudah tepat. Namun, teman-temannya kesulitan memahami isi lirik lagu karena pengucapan huruf vokal dan konsonan Rani terdengar kurang jelas. Teknik bernyanyi yang harus dilatih oleh Rani adalah ....', opts('intonasi', 'pernapasan', 'artikulasi', 'sikap tubuh'), 'C'),
  pg('musik-pg-18', 'Seni Musik', 'Perhatikan daftar alat musik berikut! Pengelompokan alat-alat musik berdasarkan fungsinya dalam permainan musik yang paling tepat adalah ....', opts('gitar dan gendang adalah alat musik ritmis; piano dan tamborin adalah alat musik melodis', 'gitar dan piano adalah alat musik melodis; gendang dan tamborin adalah alat musik ritmis', 'gendang dan piano adalah alat musik ritmis; gitar dan tamborin adalah alat musik melodis', 'gitar dan tamborin adalah alat musik melodis; gendang dan piano adalah alat musik ritmis'), 'B', { diagramId: 'musik-alat-4' }),
  pg('musik-pg-19', 'Seni Musik', 'Cara memainkan alat musik seperti pada gambar berikut adalah dengan cara ....', opts('ditiup sambil menutup lubang nadanya', 'dipukul menggunakan stik kayu', 'digoyangkan menggunakan kedua tangan', 'digesek menggunakan alat penggesek'), 'A', { diagramId: 'musik-seruling' }),
  pg('musik-pg-20', 'Seni Musik', 'Dalam sebuah pertunjukan musik ansambel sekolah, kelompok pemain musik dibagi menjadi dua bagian agar lagu terdengar indah dan teratur. Peran masing-masing kelompok alat musik tersebut adalah ....', opts('alat musik ritmis memainkan melodi utama, sedangkan alat musik melodis menjaga tempo', 'alat musik ritmis dan melodis sama-sama hanya berfungsi mengatur ketukan lagu', 'alat musik ritmis mengatur irama dan ketukan, sedangkan alat musik melodis memainkan rangkaian nada lagu', 'alat musik melodis menghentikan lagu, sedangkan alat musik ritmis menyanyikan syair lagu'), 'C'),
  essay('musik-es-21', 'Seni Musik', 'Dalam paduan suara sekolah terdapat empat anggota dengan karakter suara berbeda:\n• Siti: Suara perempuan yang tinggi dan nyaring.\n• Dayu: Suara perempuan yang rendah dan berat.\n• Beni: Suara laki-laki yang tinggi dan ringan.\n• Edo: Suara laki-laki yang sangat rendah dan besar.\nKelompokkan jenis suara keempat anak tersebut secara berurutan dan jelaskan mengapa mereka harus menyanyikan bagian nada yang sesuai dengan jenis suaranya masing-masing!', 'Siti = Sopran, Dayu = Alto, Beni = Tenor, Edo = Bas. Alasan: Agar setiap penyanyi dapat menjangkau nada dengan nyaman, menghasilkan harmoni suara yang indah, dan tidak merusak/mencederai pita suara.', '4: Keempat jenis suara benar berurutan dan alasan tepat; 3: Jenis suara benar namun alasan kurang lengkap; 2: Sebagian jenis suara benar; 1: Menjawab singkat; 0: Kosong.'),
  essay('musik-es-22', 'Seni Musik', 'Bacalah kasus berikut dengan saksama!\n"Budi mengikuti lomba menyanyi solo. Saat tampil, Budi bernyanyi sambil menunduk, nada suaranya sering meleset (fals), liriknya terdengar bergumam, dan ia tampak terengah-engah di akhir kalimat lagu."\nAnalisislah kesalahan teknik bernyanyi yang dilakukan oleh Budi dan jelaskan bagaimana cara memperbaikinya!', '1) Sikap tubuh menunduk → berdiri tegak dan rileks. 2) Intonasi fals → melatih ketepatan tinggi rendah nada. 3) Artikulasi bergumam → membuka mulut dan mengucapkan huruf vokal/konsonan dengan jelas. 4) Pernapasan terengah-engah → memakai pernapasan diafragma dan frasering yang tepat.', '4: Menjelaskan 4 kesalahan teknik (sikap, intonasi, artikulasi, pernapasan) beserta cara perbaikannya; 3: 3 kesalahan + perbaikan; 2: 2 kesalahan; 1: 1 kesalahan; 0: Kosong.'),
  essay('musik-es-23', 'Seni Musik', 'Kelompokkan keempat alat musik berikut (Pianika, Gendang, Seruling, Tamborin) ke dalam jenis alat musik ritmis dan alat musik melodis, lalu jelaskan cara memainkan masing-masing alat musik tersebut!', 'Alat musik ritmis: Gendang (dipukul dengan tangan/stik) dan Tamborin (digoyangkan atau dipukul tangan). Alat musik melodis: Pianika (ditiup lewat selang sambil menekan tuts) dan Seruling (ditiup sambil membuka-tutup lubang nada dengan jari).', '4: Pengelompokan ritmis/melodis dan cara bermain keempat alat musik tepat; 3: Pengelompokan tepat, cara main kurang 1 alat; 2: Pengelompokan saja benar; 1: Sebagian benar; 0: Kosong.', { diagramId: 'musik-alat-4-essay' }),
  essay('musik-es-24', 'Seni Musik', 'Sebuah kelompok musik kelas V akan mengiringi lagu "Ampar-Ampar Pisang" menggunakan alat musik pianika, gitar, dan gendang. Jelaskan perbedaan fungsi alat musik ritmis dan melodis dalam pertunjukan tersebut serta bagaimana keduanya bekerja sama menghasilkan permainan musik yang harmonis!', 'Gendang (ritmis) menjaga kestabilan tempo dan ketukan lagu; pianika & gitar (melodis) memainkan rangkaian nada utama dan akor pengiring. Keduanya bekerja sama dengan saling menyelaraskan tempo/ketukan sehingga musik terdengar kompak dan harmonis.', '4: Menjelaskan fungsi ritmis, melodis, dan kerja sama harmonis dengan jelas; 3: Fungsi benar, penjelasan kerja sama singkat; 2: Hanya menjelaskan salah satu fungsi; 1: Jawaban singkat; 0: Kosong.'),
  essay('musik-es-25', 'Seni Musik', 'Kelasmu mendapat tugas menampilkan pertunjukan musik sederhana secara berkelompok yang menggabungkan vokal (bernyanyi), alat musik ritmis, dan alat musik melodis. Rancanglah pembagian peran dalam kelompokmu (penyanyi, pemain ritmis, dan pemain melodis) serta jelaskan hal-hal yang harus diperhatikan agar penampilan kelompokmu kompak dan indah!', 'Pembagian peran: Penyanyi membawakan lirik dengan teknik vokal benar (diafragma, artikulasi, intonasi); pemain ritmis menjaga ketukan dengan gendang/tamborin; pemain melodis memainkan melodi utama dengan pianika/seruling. Hal yang diperhatikan: kekompakan tempo, keseimbangan volume (dinamika), dan latihan bersama rutin.', '4: Rancangan 3 peran jelas beserta ≥ 2 hal pendukung kekompakan; 3: Peran jelas, hal pendukung singkat; 2: Pembagian peran saja; 1: Jawaban sangat umum; 0: Kosong.'),
];

// --- 6. SENI RUPA (20 PG + 5 Essay) ---
const RUPA_QUESTIONS: Question[] = [
  pg('rupa-pg-01', 'Seni Rupa', 'Berikut ini yang bukan merupakan unsur seni rupa adalah ....', opts('raut dan bentuk', 'warna', 'perulangan', 'titik'), 'C'),
  pg('rupa-pg-02', 'Seni Rupa', 'Balok, kubus, dan kerucut termasuk contoh bentuk ....', opts('titik', 'garis', 'geometris', 'nongeometris'), 'C'),
  pg('rupa-pg-03', 'Seni Rupa', 'Pada gambar garis bernomor 1 sampai 5, garis yang berbentuk zig-zag ditunjukkan oleh nomor ....', opts('1', '2', '3', '4'), 'C', { diagramId: 'rupa-garis-zigzag' }),
  pg('rupa-pg-04', 'Seni Rupa', 'Objek yang memiliki bentuk geometris adalah ....', opts('daun', 'bentuk hiasan tidak beraturan', 'susunan benda berbentuk kotak', 'buah mangga'), 'C'),
  pg('rupa-pg-05', 'Seni Rupa', 'Berikut ini merupakan ciri dari irama dalam seni rupa, kecuali ....', opts('kesamaan', 'teratur', 'ada perubahan', 'tetap'), 'D'),
  pg('rupa-pg-06', 'Seni Rupa', 'Sifat dari irama adalah ....', opts('berantakan', 'teratur', 'diam', 'acak'), 'B'),
  pg('rupa-pg-07', 'Seni Rupa', 'Bahasa Sanskerta yang memiliki arti irama adalah ....', opts('rudit', 'satu', 'jeda', 'ritme'), 'C'),
  pg('rupa-pg-08', 'Seni Rupa', 'Irama pengulangan disebut juga ....', opts('repetitif', 'transisi', 'statis', 'konfiguratif'), 'A'),
  pg('rupa-pg-09', 'Seni Rupa', 'Ritme transisi cocok diterapkan pada ....', opts('pakaian', 'iklan', 'korden', 'lantai'), 'A'),
  pg('rupa-pg-10', 'Seni Rupa', 'Manusia prasejarah menggunakan tali untuk keperluan berikut, kecuali ....', opts('berburu', 'makrame', 'menyelam', 'memanjat'), 'C'),
  pg('rupa-pg-11', 'Seni Rupa', 'Alat yang cocok untuk membuat simpul tunggal dan simpul ganda adalah ....', opts('sumpit', 'lidi', 'penghapus', 'kertas'), 'B'),
  pg('rupa-pg-12', 'Seni Rupa', 'Bahan yang dapat digunakan untuk membuat tali prasejarah adalah ....', opts('rayon', 'nilon', 'serat kulit pohon', 'plastik'), 'C'),
  pg('rupa-pg-13', 'Seni Rupa', 'Simpul untuk mengakhiri rangkaian simpul ganda atau simpul tunggal adalah ....', opts('simpul kepala', 'simpul jangkar', 'simpul mati', 'simpul hidup'), 'C'),
  pg('rupa-pg-14', 'Seni Rupa', 'Makrame adalah karya seni rupa yang dibuat dengan teknik ....', opts('tenun', 'ikatan dan simpul', 'jahit', 'potong dan tempel'), 'B'),
  pg('rupa-pg-15', 'Seni Rupa', "Bahasa Arab 'macramia' mempunyai arti ....", opts('bulu domba', 'hiasan', 'susunan kisi-kisi', 'celemek'), 'B'),
  pg('rupa-pg-16', 'Seni Rupa', 'Berikut ini yang bukan merupakan contoh produk makrame adalah ....', opts('tenda', 'hiasan dinding', 'tas', 'gantungan kunci'), 'A'),
  pg('rupa-pg-17', 'Seni Rupa', 'Salah satu sifat tali yang umum untuk dijadikan karya makrame adalah ....', opts('mudah terbakar', 'kuat', 'tahan bakteri', 'elastis'), 'B'),
  pg('rupa-pg-18', 'Seni Rupa', 'Berikut ini adalah sifat benang wol, kecuali ....', opts('tidak mudah kusut', 'tahan sinar matahari', 'kuat', 'tidak lentur'), 'D'),
  pg('rupa-pg-19', 'Seni Rupa', 'Perhatikan daftar simpul berikut! Nomor simpul yang digunakan untuk mengikat tali pada tongkat sehingga membentuk ikatan kuat/tandu darurat adalah ....', opts('(1) dan (2)', '(2) dan (3)', '(3) dan (4)', '(4) dan (1)'), 'B', { diagramId: 'rupa-simpul' }),
  pg('rupa-pg-20', 'Seni Rupa', 'Berdasarkan gambar macam-macam simpul berikut, simpul yang digunakan untuk menyambung dua tali adalah ....', opts('simpul mati', 'simpul tiang', 'simpul jangkar', 'simpul hidup'), 'A', { diagramId: 'rupa-simpul' }),
  essay('rupa-es-21', 'Seni Rupa', 'Jelaskan pengertian makrame dengan bahasamu sendiri!', 'Makrame adalah karya seni kerajinan yang dibuat dengan teknik mengikat dan menyimpul tali atau benang hingga membentuk pola dan benda berguna.', '4: Pengertian jelas menyebut karya seni/kerajinan dengan teknik mengikat dan menyimpul tali/benang; 3: Cukup jelas; 2: Sebagian tepat; 1: Sangat singkat; 0: Kosong.'),
  essay('rupa-es-22', 'Seni Rupa', 'Sebutkan tiga contoh benda atau karya yang dapat dibuat dengan teknik makrame!', 'Contoh produk makrame: hiasan dinding, gantungan kunci, tas makrame, gelang tali, atau pot gantung.', '4: Menyebutkan 3 contoh karya makrame yang benar; 3: 2 contoh benar; 2: 1 contoh benar; 1: Contoh kurang tepat; 0: Kosong.'),
  essay('rupa-es-23', 'Seni Rupa', 'Apa perbedaan simpul mati dan simpul hidup?', 'Simpul mati digunakan untuk mengikat atau menyambung tali secara kuat agar tidak mudah lepas, sedangkan simpul hidup digunakan agar ikatan mudah dibuka atau dilepas kembali dengan menarik ujung talinya.', '4: Perbedaan fungsi dan cara pelepasan kedua simpul dijelaskan dengan tepat; 3: Cukup jelas; 2: Hanya menjelaskan satu simpul; 1: Sangat singkat; 0: Kosong.'),
  essay('rupa-es-24', 'Seni Rupa', 'Mengapa kita perlu menguasai simpul dasar sebelum membuat karya makrame? Jelaskan!', 'Karena simpul dasar menjadi fondasi pembentukan pola makrame; penguasaan simpul dasar membantu menghasilkan karya yang kuat, rapi, seimbang, dan sesuai desain yang diinginkan.', '4: Menjelaskan alasan pembentukan pola, kekuatan, dan kerapian karya; 3: Alasan benar namun singkat; 2: Kurang jelas; 1: Sangat singkat; 0: Kosong.'),
  essay('rupa-es-25', 'Seni Rupa', 'Sebutkan tiga hal yang perlu diperhatikan agar hasil karya makrame kuat, rapi, dan menarik!', '1) Memilih jenis tali yang kuat dan sesuai fungsi. 2) Mengukur panjang tali dengan tepat. 3) Menjaga tarikan setiap simpul tetap seimbang/konsisten dan merapikan ujung tali.', '4: Menyebutkan 3 hal teknis yang tepat; 3: 2 hal tepat; 2: 1 hal tepat; 1: Sangat umum; 0: Kosong.'),
];

// --- 7. BAHASA TORAJA (10 Essay) ---
const TORAJA_QUESTIONS: Question[] = [
  essay('toraja-es-01', 'Bahasa Toraja', 'Nenek moyang suku Toraja berasal dari ....', 'Menurut cerita rakyat/sejarah lisan Toraja, nenek moyang suku Toraja dipercaya berasal dari bangsa Austronesia/Yunan (Dataran Indo-Cina) yang berlayar menuju Sulawesi lalu menyusuri Sungai Sa’dan hingga menetap di pegunungan Tana Toraja (sering disebut Tomanurun / Pong Mulatau dalam mitologi lokal).', '4: Menyebutkan asal usul nenek moyang suku Toraja (Austronesia/Yunan atau kisah lokal dengan tepat); 3: Jawaban benar cukup jelas; 2: Kurang lengkap; 1: Singkat; 0: Kosong.'),
  essay('toraja-es-02', 'Bahasa Toraja', 'Apa yang dimaksud dengan pondok lepongan bulan?', 'Pondok Lepongan Bulan adalah sebutan filosofis bagi wilayah/kesatuan adat Toraja yang melambangkan keutuhan, persatuan, dan kesepakatan masyarakat Toraja seperti bulan purnama yang bulat sempurna.', '4: Menjelaskan makna Lepongan Bulan sebagai kesatuan adat/wilayah masyarakat Toraja yang utuh seperti bulan purnama; 3: Cukup jelas; 2: Sebagian tepat; 1: Singkat; 0: Kosong.'),
  essay('toraja-es-03', 'Bahasa Toraja', 'Apa yang dimaksud dengan tongkonan?', 'Tongkonan adalah rumah adat tradisional suku Toraja (dari kata "tongkon" yang berarti duduk bersama) yang menjadi pusat kehidupan sosial, adat istiadat, musyawarah keluarga, dan simbol martabat rumpun keluarga Toraja.', '4: Menjelaskan Tongkonan sebagai rumah adat Toraja beserta asal kata/fungsinya dalam adat & keluarga; 3: Cukup jelas; 2: Menyebut rumah adat saja; 1: Singkat; 0: Kosong.'),
  essay('toraja-es-04', 'Bahasa Toraja', 'Apa satuan tu pesiparan melo dipogau’ tu kita pasikola?', 'Sikap terpuji yang baik dilakukan oleh pelajar (pasikola) antara lain: mengasihi dan menghormati orang tua serta guru (meka’tu’/mengka’pa’), rajin belajar (mengkondoran/matutu massikola), tolong-menolong (sangmane/siangkaran), dan menjaga kebersihan serta sopan santun.', '4: Menyebutkan minimal 3 perilaku terpuji pelajar dalam budaya/bahasa Toraja; 3: 2 perilaku tepat; 2: 1 perilaku tepat; 1: Jawaban umum; 0: Kosong.'),
  essay('toraja-es-05', 'Bahasa Toraja', 'Sebutkan 5 alat musik tradisional Toraja!', 'Contoh alat musik tradisional Toraja: 1. Pa’suling (seruling bambu), 2. Pa’pompang / Pa’bas (angklung bambu Toraja), 3. Pa’gendang (gendang), 4. Pa’geso’-geso’ (alat musik gesek dua senar), 5. Pa’katung / Pa’barrung / Pa’pelle.', '4: Menyebutkan 5 alat musik tradisional Toraja dengan benar; 3: 4 benar; 2: 2–3 benar; 1: 1 benar; 0: Kosong.'),
  essay('toraja-es-06', 'Bahasa Toraja', 'Sebutkan 5 jenis tarian tradisional Toraja!', 'Contoh tarian tradisional Toraja: 1. Tari Pa’gellu, 2. Tari Pa’boneballa, 3. Tari Ma’badong, 4. Tari Pa’tirra, 5. Tari Ma’marakka / Pa’randing / Manganda’.', '4: Menyebutkan 5 tarian tradisional Toraja dengan benar; 3: 4 benar; 2: 2–3 benar; 1: 1 benar; 0: Kosong.'),
  essay('toraja-es-07', 'Bahasa Toraja', 'Tuliskanlah 3 jenis permainan tradisional!', 'Contoh permainan tradisional di Toraja: 1. Ma’gasing (bermain gasing), 2. Ma’longga’ / Egrang bambu, 3. Ma’dende’ (engklek) / Ma’kalembo’ / Ma’tengko.', '4: Menyebutkan 3 permainan tradisional dengan benar; 3: 2 benar; 2: 1 benar; 1: Kurang tepat; 0: Kosong.'),
  essay('toraja-es-08', 'Bahasa Toraja', 'Tuliskanlah 5 jenis makanan tradisional Toraja!', 'Contoh makanan tradisional Toraja: 1. Pa’piong (masakan dalam bambu), 2. Pantollo’ Pamarrasan (kuah kluwek hitam), 3. Deppa Tori’, 4. Kapurung / Pokon / Baje’, 5. Piongan / Tuak manis atau Dangkot.', '4: Menyebutkan 5 makanan tradisional Toraja dengan benar; 3: 4 benar; 2: 2–3 benar; 1: 1 benar; 0: Kosong.'),
  essay('toraja-es-09', 'Bahasa Toraja', 'Tuliskanlah 5 buah kata dengan antonimnya (dalam Bahasa Toraja)!', 'Contoh antonim Bahasa Toraja: 1. Melo (baik) × Kadake (buruk), 2. Kapua (besar) × Bitti’ (kecil), 3. Malangka’ (tinggi) × Pendek / Marandang, 4. Malassu (panas) × Makarra’ / Madingin (dingin), 5. Masannang (senang) × Masussa (susah).', '4: Menuliskan 5 pasangan antonim dalam Bahasa Toraja secara benar; 3: 4 pasangan benar; 2: 2–3 benar; 1: 1 benar; 0: Kosong.'),
  essay('toraja-es-10', 'Bahasa Toraja', 'Tuliskanlah 5 buah kata dengan sinonimnya (dalam Bahasa Toraja)!', 'Contoh sinonim Bahasa Toraja: 1. Melo = Madatu / Maballo (baik/indah), 2. Matutu = Makarimman / Mapia (rajin/tekun), 3. Masannang = Parannu (senang/gembira), 4. Banua = Tongkonan (rumah), 5. Malolo = Marante / Mapia (lurus/baik).', '4: Menuliskan 5 pasangan sinonim dalam Bahasa Toraja secara benar; 3: 4 pasangan benar; 2: 2–3 benar; 1: 1 benar; 0: Kosong.'),
];

// --- 8. MULTI-BENTUK TKA (PG Kompleks, Benar/Salah, Isian Singkat) ---
const TKA_EXTRA_QUESTIONS: Question[] = [
  {
    id: 'tka-pgk-01',
    subject: 'IPAS',
    type: 'pg_kompleks',
    prompt: 'Pilih DUA pernyataan yang benar mengenai sifat-sifat cahaya dalam kehidupan sehari-hari!',
    options: opts(
      'Cahaya merambat lurus ketika melewati celah jendela.',
      'Pensil dalam gelas berisi air tampak patah akibat pembiasan cahaya.',
      'Cahaya tidak dapat menembus kaca bening sama sekali.',
      'Cermin datar menyerap seluruh cahaya yang mengenainya.'
    ),
    correctAnswer: ['A', 'B'],
    maxScore: 1,
    weight: 1,
    sourceTag: 'Pengayaan TKA Multi-Bentuk',
    createdAt: SEED_DATE,
  },
  {
    id: 'tka-bs-01',
    subject: 'Pendidikan Pancasila',
    type: 'benar_salah',
    prompt: 'Tentukan Benar atau Salah pernyataan berikut:\n"Mengakui pendapat teman yang berbeda saat musyawarah kelas merupakan wujud pengamalan sila keempat Pancasila."',
    options: [
      { id: 'BENAR', text: 'Benar' },
      { id: 'SALAH', text: 'Salah' },
    ],
    correctAnswer: 'BENAR',
    maxScore: 1,
    weight: 1,
    sourceTag: 'Pengayaan TKA Multi-Bentuk',
    createdAt: SEED_DATE,
  },
  {
    id: 'tka-is-01',
    subject: 'Matematika',
    type: 'isian_singkat',
    prompt: 'Tuliskan bilangan hasil perhitungan KPK dari 12 dan 18 dengan angka saja!',
    correctAnswer: '36',
    maxScore: 1,
    weight: 1,
    sourceTag: 'Pengayaan TKA Multi-Bentuk',
    createdAt: SEED_DATE,
  },
];

export const SEED_QUESTIONS: Question[] = [
  ...IPAS_QUESTIONS,
  ...MTK_QUESTIONS,
  ...BINDO_QUESTIONS,
  ...PANCASILA_QUESTIONS,
  ...MUSIK_QUESTIONS,
  ...RUPA_QUESTIONS,
  ...TORAJA_QUESTIONS,
  ...TKA_EXTRA_QUESTIONS,
];

function makeExam(
  id: string,
  shareCode: string,
  title: string,
  subject: string,
  assessmentType: ExamPackage['assessmentType'],
  durationMinutes: number,
  questionIds: string[],
  countsByType: ExamPackage['countsByType']
): ExamPackage {
  return {
    id,
    shareCode,
    title,
    subject,
    assessmentType,
    gradeLevel: 'V (Lima) / Fase C',
    academicYear: '2026/2027',
    schoolName: 'UPT SDN 2 Makale Selatan',
    durationMinutes,
    token: '',
    isActive: true,
    showResultsToStudent: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    selectionMode: 'manual',
    countsByType,
    questionIds,
    scoringMode: 'weighted_split',
    objectiveWeightPercent: countsByType.pg + countsByType.pg_kompleks + countsByType.benar_salah + countsByType.isian_singkat > 0 && countsByType.uraian > 0 ? 60 : countsByType.uraian > 0 ? 0 : 100,
    essayWeightPercent: countsByType.pg + countsByType.pg_kompleks + countsByType.benar_salah + countsByType.isian_singkat > 0 && countsByType.uraian > 0 ? 40 : countsByType.uraian > 0 ? 100 : 0,
    instructions: [
      'Berdoalah sebelum mulai mengerjakan soal.',
      'Tulislah nama lengkap dan kelas pada tempat yang tersedia.',
      'Bacalah setiap soal dengan cermat sebelum menjawab.',
      'Periksa kembali seluruh jawaban sebelum menekan tombol kumpulkan.',
    ],
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  };
}

export const SEED_EXAMS: ExamPackage[] = [
  makeExam(
    'exam-asas-ipas-v',
    'ASAS-IPAS-V',
    'ASAS Ganjil IPAS Kelas V',
    'IPAS',
    'ASAS Ganjil',
    90,
    IPAS_QUESTIONS.map((q) => q.id),
    { pg: 20, pg_kompleks: 0, benar_salah: 0, isian_singkat: 0, uraian: 5 }
  ),
  makeExam(
    'exam-asas-mtk-v',
    'ASAS-MTK-V',
    'ASAS Ganjil Matematika Kelas V',
    'Matematika',
    'ASAS Ganjil',
    90,
    MTK_QUESTIONS.map((q) => q.id),
    { pg: 20, pg_kompleks: 0, benar_salah: 0, isian_singkat: 0, uraian: 5 }
  ),
  makeExam(
    'exam-asas-bindo-v',
    'ASAS-BINDO-V',
    'ASAS Ganjil Bahasa Indonesia Kelas V',
    'Bahasa Indonesia',
    'ASAS Ganjil',
    90,
    BINDO_QUESTIONS.map((q) => q.id),
    { pg: 20, pg_kompleks: 0, benar_salah: 0, isian_singkat: 0, uraian: 5 }
  ),
  makeExam(
    'exam-asas-pancasila-v',
    'ASAS-PANCASILA-V',
    'ASAS Ganjil Pendidikan Pancasila Kelas V',
    'Pendidikan Pancasila',
    'ASAS Ganjil',
    90,
    PANCASILA_QUESTIONS.map((q) => q.id),
    { pg: 20, pg_kompleks: 0, benar_salah: 0, isian_singkat: 0, uraian: 5 }
  ),
  makeExam(
    'exam-asas-musik-v',
    'ASAS-MUSIK-V',
    'ASAS Ganjil Seni Musik Kelas V',
    'Seni Musik',
    'ASAS Ganjil',
    60,
    MUSIK_QUESTIONS.map((q) => q.id),
    { pg: 20, pg_kompleks: 0, benar_salah: 0, isian_singkat: 0, uraian: 5 }
  ),
  makeExam(
    'exam-asas-rupa-v',
    'ASAS-RUPA-V',
    'ASAS Ganjil Seni Rupa Kelas V',
    'Seni Rupa',
    'ASAS Ganjil',
    90,
    RUPA_QUESTIONS.map((q) => q.id),
    { pg: 20, pg_kompleks: 0, benar_salah: 0, isian_singkat: 0, uraian: 5 }
  ),
  makeExam(
    'exam-asas-toraja-v',
    'ASAS-TORAJA-V',
    'ASAS Ganjil Bahasa Toraja Kelas V',
    'Bahasa Toraja',
    'ASAS Ganjil',
    60,
    TORAJA_QUESTIONS.map((q) => q.id),
    { pg: 0, pg_kompleks: 0, benar_salah: 0, isian_singkat: 0, uraian: 10 }
  ),
  makeExam(
    'exam-tka-latihan-v',
    'TKA-LATIHAN-V',
    'Latihan Terpadu Kelas V (Multi-Bentuk)',
    'Campuran',
    'Tryout Terpadu',
    30,
    [
      'ipas-pg-01',
      'mtk-pg-05',
      'bindo-pg-01',
      'pp-pg-03',
      'tka-pgk-01',
      'tka-bs-01',
      'tka-is-01',
      'ipas-es-21',
      'mtk-es-22',
    ],
    { pg: 4, pg_kompleks: 1, benar_salah: 1, isian_singkat: 1, uraian: 2 }
  ),
];
