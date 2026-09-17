export type UjianStatus = 'Belum Mulai' | 'Sedang Ujian' | 'Selesai' | 'Terkunci';

export interface Siswa {
  nis: string;
  nama: string;
  kelas: string;
  token: string;
  status: UjianStatus;
  jumlahPelanggaran: number;
}

export interface Soal {
  idSoal: string;
  jenis: 'PG' | 'PJ' | 'BS';
  pertanyaan: string;
  opsi?: string[];
  bobot?: number;
}

export interface Config {
  namaUjian: string;
  timerOn: boolean;
  durasiMenit: number;
  maxPelanggaran: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error: { code: string; details?: any } | null;
}
