import Link from "next/link";
import Button from "@/components/ui/Button";
import { Shield, ArrowRight } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import MarkdownContent from "@/components/MarkdownContent";
import Image from "next/image";

export default async function PrivacyPolicyPage() {
  const content = `# Dasar Privasi

## Platform Komuniti N.18 Inanam

Dasar Privasi ini menerangkan bagaimana Platform Komuniti N.18 Inanam ("kami", "kita", "platform") mengumpul, menggunakan, menyimpan, dan melindungi maklumat peribadi anda. Kami komited untuk melindungi privasi anda dan mematuhi Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia.

**Tarikh Berkuatkuasa:** ${new Date().toLocaleDateString('ms-MY', { year: 'numeric', month: 'long', day: 'numeric' })}

---

## 1. Maklumat Yang Kami Kumpul

### 1.1 Maklumat Peribadi
Apabila anda mendaftar dan menggunakan platform ini, kami mungkin mengumpul maklumat berikut:

- **Maklumat Identiti:** Nama penuh, nombor kad pengenalan (IC), alamat e-mel, nombor telefon
- **Maklumat Lokasi:** Alamat kediaman, zon, kampung, koordinat GPS (jika anda memberikan kebenaran)
- **Maklumat Akaun:** Nama pengguna, kata laluan (disimpan dalam bentuk terenkripsi), status keahlian
- **Maklumat Isi Rumah:** Maklumat ahli keluarga yang berkaitan dengan program bantuan dan perkhidmatan komuniti
- **Maklumat Laporan:** Butiran isu yang dilaporkan, foto, video, dan dokumen yang dikemukakan
- **Maklumat Interaksi:** Sejarah komunikasi dengan kakitangan, maklum balas, dan aktiviti dalam platform

### 1.2 Maklumat Teknikal
Kami secara automatik mengumpul beberapa maklumat teknikal apabila anda melayari platform:

- Alamat IP
- Jenis pelayar dan versi
- Sistem operasi
- Masa dan tarikh akses
- Halaman yang dilawati
- Rujukan URL

### 1.3 Cookies dan Teknologi Serupa
Platform ini menggunakan cookies untuk meningkatkan pengalaman pengguna. Cookies adalah fail teks kecil yang disimpan pada peranti anda. Anda boleh mengawal penggunaan cookies melalui tetapan pelayar anda.

---

## 2. Tujuan Pengumpulan dan Penggunaan Data

Kami menggunakan maklumat peribadi anda untuk tujuan berikut:

### 2.1 Penyediaan Perkhidmatan
- Memproses dan menguruskan laporan isu komuniti
- Menyediakan akses kepada program bantuan dan perkhidmatan
- Memudahkan komunikasi antara penduduk dan pihak berkuasa tempatan
- Menguruskan keahlian dan keutamaan pengguna

### 2.2 Peningkatan Perkhidmatan
- Menganalisis penggunaan platform untuk penambahbaikan
- Menyediakan statistik dan laporan kepada pihak berkuasa
- Menjalankan penyelidikan dan analisis data (dalam bentuk agregat dan tidak boleh dikenal pasti)

### 2.3 Komunikasi
- Menghantar notifikasi tentang status laporan anda
- Menghantar pengumuman penting kepada komuniti
- Menjawab pertanyaan dan memberikan sokongan

### 2.4 Pematuhan Undang-undang
- Mematuhi keperluan undang-undang dan peraturan
- Menyediakan maklumat kepada pihak berkuasa apabila diperlukan oleh undang-undang
- Melindungi hak dan keselamatan pengguna dan orang lain

---

## 3. Pendedahan Maklumat

### 3.1 Perkongsian dengan Pihak Ketiga
Kami tidak menjual, menyewakan, atau memperdagangkan maklumat peribadi anda kepada pihak ketiga. Namun, kami mungkin berkongsi maklumat dalam situasi berikut:

- **Pihak Berkuasa Tempatan:** Maklumat laporan isu dikongsi dengan agensi kerajaan yang berkaitan untuk tujuan penyelesaian isu
- **Pembekal Perkhidmatan:** Kami mungkin berkongsi data dengan pembekal perkhidmatan teknologi yang membantu mengendalikan platform (dengan perjanjian kerahsiaan)
- **Keperluan Undang-undang:** Apabila diperlukan oleh undang-undang, mahkamah, atau pihak berkuasa yang berwibawa

### 3.2 Perkongsian dengan Komuniti
Beberapa maklumat mungkin dipaparkan secara awam dalam platform:

- Nama pengguna (bukan nama sebenar) pada laporan awam
- Status dan kemajuan laporan isu (tanpa maklumat peribadi yang sensitif)
- Statistik komuniti dalam bentuk agregat

---

## 4. Keselamatan Data

### 4.1 Langkah Keselamatan
Kami mengambil langkah keselamatan yang wajar untuk melindungi maklumat peribadi anda:

- **Penyulitan:** Data sensitif disimpan dalam bentuk terenkripsi
- **Kawalan Akses:** Hanya kakitangan yang diberi kuasa mempunyai akses kepada maklumat peribadi
- **Audit Log:** Semua akses kepada data direkodkan untuk tujuan audit
- **Sokongan Teknikal:** Sistem keselamatan sentiasa dikemas kini dan dipantau

### 4.2 Penyimpanan Data
Data anda disimpan di pelayan yang selamat di Malaysia. Kami memastikan bahawa pembekal perkhidmatan kami mematuhi standard keselamatan yang tinggi.

---

## 5. Tempoh Penyimpanan Data

Kami akan menyimpan maklumat peribadi anda selagi diperlukan untuk:

- Menyediakan perkhidmatan yang diminta
- Mematuhi keperluan undang-undang dan peraturan
- Menyelesaikan pertikaian atau menegakkan perjanjian

Selepas tempoh yang munasabah atau apabila data tidak lagi diperlukan, kami akan memadam atau menganonimkan data tersebut mengikut prosedur yang selamat.

---

## 6. Hak Anda di Bawah PDPA

Di bawah Akta Perlindungan Data Peribadi 2010, anda mempunyai hak berikut:

### 6.1 Hak Akses
Anda berhak untuk meminta akses kepada maklumat peribadi yang kami simpan tentang anda.

### 6.2 Hak Pembetulan
Anda berhak untuk meminta pembetulan maklumat peribadi yang tidak tepat, tidak lengkap, atau mengelirukan.

### 6.3 Hak Menarik Balik Persetujuan
Anda berhak untuk menarik balik persetujuan anda untuk pemprosesan data peribadi pada bila-bila masa.

### 6.4 Hak Menghadkan Pemprosesan
Anda berhak untuk meminta kami menghadkan pemprosesan data peribadi anda dalam keadaan tertentu.

### 6.5 Hak Memadam Data
Anda berhak untuk meminta pemadaman data peribadi anda, tertakluk kepada keperluan undang-undang untuk mengekalkan rekod tertentu.

### 6.6 Cara Menggunakan Hak Anda
Untuk menggunakan mana-mana hak di atas, sila hubungi kami melalui:

- **E-mel:** [alamat e-mel]
- **Telefon:** [nombor telefon]
- **Melalui Platform:** Log masuk dan akses bahagian profil anda

Kami akan memproses permintaan anda dalam tempoh yang munasabah (biasanya dalam 21 hari bekerja).

---

## 7. Data Kanak-kanak

Platform ini tidak ditujukan untuk kanak-kanak di bawah umur 13 tahun. Kami tidak sengaja mengumpul maklumat peribadi daripada kanak-kanak. Jika anda mengetahui bahawa kanak-kanak telah memberikan maklumat peribadi kepada kami, sila hubungi kami dengan segera.

---

## 8. Pautan ke Laman Web Pihak Ketiga

Platform ini mungkin mengandungi pautan ke laman web pihak ketiga. Kami tidak bertanggungjawab terhadap dasar privasi atau kandungan laman web tersebut. Kami menggalakkan anda untuk membaca dasar privasi setiap laman web yang anda lawati.

---

## 9. Pindaan kepada Dasar Privasi

Kami berhak untuk mengubah atau meminda Dasar Privasi ini dari semasa ke semasa. Sebarang perubahan akan dimaklumkan melalui:

- Notifikasi dalam platform
- E-mel kepada pengguna berdaftar (jika perubahan ketara)
- Kemas kini tarikh "Berkuatkuasa" di bahagian atas dokumen ini

Kami menggalakkan anda untuk menyemak Dasar Privasi ini secara berkala. Penggunaan berterusan platform selepas sebarang perubahan bermakna anda menerima Dasar Privasi yang dikemaskini.

---

## 10. Persetujuan

Dengan menggunakan platform ini, anda mengakui bahawa anda telah membaca, memahami, dan bersetuju dengan Dasar Privasi ini. Jika anda tidak bersetuju dengan mana-mana bahagian dasar ini, sila jangan gunakan platform ini.

---

## 11. Hubungi Kami

Jika anda mempunyai sebarang pertanyaan, kebimbangan, atau permintaan berkaitan dengan Dasar Privasi ini atau cara kami mengendalikan maklumat peribadi anda, sila hubungi kami:

**Platform Komuniti N.18 Inanam**

- **Alamat:** [Alamat Pejabat]
- **E-mel:** [Alamat E-mel]
- **Telefon:** [Nombor Telefon]
- **Waktu Pejabat:** Isnin - Jumaat: 9:00 AM - 5:00 PM

---

## 12. Bahasa

Dokumen ini disediakan dalam Bahasa Malaysia. Sekiranya terdapat sebarang percanggahan antara versi Bahasa Malaysia dan versi bahasa lain, versi Bahasa Malaysia akan mengatasi.

---

**Terima kasih kerana mempercayai Platform Komuniti N.18 Inanam dengan maklumat peribadi anda. Kami komited untuk melindungi privasi anda dan memastikan keselamatan data anda.**`;

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen">
      <PublicHeader />

      <main className="flex flex-col items-center">
        {/* Hero Banner */}
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700 p-8 md:p-12 lg:p-16">
              {/* Background Image */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10">
                <Image
                  src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80"
                  alt="Privacy and data protection"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <Shield className="size-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em] text-white">
                  Dasar Privasi
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  Komited untuk melindungi privasi dan keselamatan data peribadi anda mengikut Akta Perlindungan Data Peribadi 2010 (PDPA).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="w-full max-w-4xl px-4 md:px-0 py-10 md:py-20">
          <div className="mb-8">
            <MarkdownContent content={content} />
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button asChild className="rounded-lg h-12 px-5 bg-primary text-white text-base font-bold">
              <Link href="/terms-of-service" className="flex items-center gap-2">
                Baca Terma Perkhidmatan
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg h-12 px-5">
              <Link href="/contact">Hubungi Kami</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
