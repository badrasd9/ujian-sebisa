import { ApiResponse, Soal } from "./types";

// Mock Data for the preview environment
let mockStatus: "Belum Mulai" | "Sedang Ujian" | "Selesai" | "Terkunci" = "Belum Mulai";
let mockPelanggaran = 0;

const mockQuestions: Soal[] = [
  {
    idSoal: "Q1",
    jenis: "BS",
    pertanyaan: "Tentukan kebenaran dari masing-masing pernyataan terkait hukum kekekalan energi dan termodinamika berikut:\n\nEnergi tidak dapat diciptakan maupun dimusnahkan, hanya dapat berubah dari satu bentuk ke bentuk lain.",
    bobot: 1.5
  },
  {
    idSoal: "Q2",
    jenis: "BS",
    pertanyaan: "Efisiensi termal dari mesin kalor Carnot pada kondisi riil dapat mencapai 100% tanpa adanya pelepasan kalor ke reservoir rendah.",
    bobot: 1.5
  },
  {
    idSoal: "Q3",
    jenis: "PG",
    pertanyaan: "Diberikan fungsi kuadrat f(x) = 2x² - 8x + 6. Titik puncak (koordinat optimum) dari grafik fungsi parabola tersebut berada pada titik...",
    opsi: [
      "(-2, -2)",
      "(2, 2)",
      "(2, -2)",
      "(4, 6)",
      "(-4, 14)"
    ],
    bobot: 2
  },
  {
    idSoal: "Q4",
    jenis: "PJ",
    pertanyaan: "Perhatikan karakteristik organel sel berikut. Manakah dari organel sel di bawah ini yang memiliki membran ganda dan materi genetik (DNA) mandiri di dalam sel eukariotik?\n\n*Petunjuk: Anda diperbolehkan mencentang lebih dari satu pilihan jawaban.*",
    opsi: [
      "Mitokondria",
      "Ribosom",
      "Kloroplas (pada sel tumbuhan)",
      "Badan Golgi",
      "Nukleus / Inti Sel"
    ],
    bobot: 3
  }
];

// Generate 40 questions to simulate a full exam
for (let i = 5; i <= 40; i++) {
  mockQuestions.push({
    idSoal: `Q${i}`,
    jenis: "PG",
    pertanyaan: `Pertanyaan simulasi nomor ${i}. Manakah jawaban yang paling tepat?`,
    opsi: ["A", "B", "C", "D", "E"],
    bobot: 1
  });
}


class ApiClient {
  private url: string;
  private useMock: boolean = true; // Use mock by default for AI Studio preview

  constructor() {
    this.url = import.meta.env.VITE_GAS_URL || "";
    if (this.url) {
      this.useMock = false;
    }
  }

  async login(nis: string, token: string): Promise<ApiResponse> {
    if (this.useMock) {
      return new Promise(resolve => setTimeout(() => {
        if (nis && token) {
          if (mockStatus === "Terkunci") {
            resolve({ success: false, message: "Akun terkunci", data: null, error: { code: "BLOCKED" } });
            return;
          }
          mockStatus = "Sedang Ujian";
          resolve({
            success: true,
            message: "Login sukses",
            data: {
              nama: "Fauzan Hidayat",
              kelas: "XII IPA",
              timerOn: true,
              durasiMenit: 60,
              jumlahPelanggaran: mockPelanggaran,
              status: mockStatus,
              namaUjian: "Penilaian Tengah Semester Genap"
            },
            error: null
          });
        } else {
          resolve({ success: false, message: "NIS/Token salah", data: null, error: { code: "AUTH_FAILED" } });
        }
      }, 500));
    }

    return this.post({ aksi: "login", nis, token });
  }

  async getSoal(nis: string, token: string): Promise<ApiResponse> {
    if (this.useMock) {
      return new Promise(resolve => setTimeout(() => {
        resolve({
          success: true,
          message: "Soal berhasil diambil",
          data: {
            soal: mockQuestions,
            durasiMenit: 60,
            timerOn: true
          },
          error: null
        });
      }, 500));
    }
    return this.post({ aksi: "getSoal", nis, token });
  }

  async logPelanggaran(nis: string, token: string, jenis: string, keterangan: string): Promise<ApiResponse> {
    if (this.useMock) {
      return new Promise(resolve => setTimeout(() => {
        mockPelanggaran++;
        let blocked = false;
        if (mockPelanggaran >= 3) {
          blocked = true;
          mockStatus = "Terkunci";
        }
        resolve({
          success: true,
          message: "Pelanggaran dicatat",
          data: { blocked, jumlahPelanggaran: mockPelanggaran },
          error: null
        });
      }, 500));
    }
    return this.post({ aksi: "logPelanggaran", nis, token, jenis, keterangan });
  }

  async checkStatus(nis: string, token: string): Promise<ApiResponse> {
    if (this.useMock) {
      return new Promise(resolve => setTimeout(() => resolve({
        success: true,
        message: "Status OK",
        data: { status: mockStatus, jumlahPelanggaran: mockPelanggaran },
        error: null
      }), 200));
    }
    return this.post({ aksi: "checkStatus", nis, token });
  }

  async submitJawaban(nis: string, token: string, jawaban: {idSoal: string, jawabanSiswa: string}[]): Promise<ApiResponse> {
    if (this.useMock) {
      return new Promise(resolve => setTimeout(() => {
        mockStatus = "Selesai";
        resolve({
          success: true,
          message: "Jawaban tersimpan",
          data: { skor: 85, jumlahBenar: 34, jumlahSalah: 6 },
          error: null
        });
      }, 1000));
    }
    return this.post({ aksi: "submitJawaban", nis, token, jawaban });
  }

  private async post(body: any): Promise<ApiResponse> {
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // GAS CORS requirement
        },
        body: JSON.stringify(body)
      });
      return await response.json();
    } catch (e: any) {
      return {
        success: false,
        message: "Network Error",
        data: null,
        error: { code: "NETWORK_ERROR", details: e.message }
      };
    }
  }
}

export const api = new ApiClient();
