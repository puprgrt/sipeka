import { db } from '../db';
import * as schema from '../db/schema';

let masterDataInitPromise: Promise<void> | null = null;
export async function initMasterData() {
  if (masterDataInitPromise) return masterDataInitPromise;
  masterDataInitPromise = (async () => {
    try {
      const existingUsers = await db.select().from(schema.users).limit(1);
      if (existingUsers.length === 0) {
        await db.insert(schema.users).values({
          uid: 'system_default_uid',
          namaLengkap: 'Sistem Admin',
          role: 'Pengelola_Bangunan',
          email: 'admin@sipeka.com',
        });
      }
      
      const existingKlasifikasi = await db.select().from(schema.masterKlasifikasiKerusakan).limit(1);
      if (existingKlasifikasi.length === 0) {
        await db.insert(schema.masterKlasifikasiKerusakan).values([
          { namaKlasifikasi: 'Tidak Rusak', nilaiFaktor: '0.00' },
          { namaKlasifikasi: 'Rusak Sangat Ringan', nilaiFaktor: '0.20' },
          { namaKlasifikasi: 'Rusak Ringan', nilaiFaktor: '0.35' },
          { namaKlasifikasi: 'Rusak Sedang', nilaiFaktor: '0.50' },
          { namaKlasifikasi: 'Rusak Berat', nilaiFaktor: '0.70' },
          { namaKlasifikasi: 'Rusak Sangat Berat', nilaiFaktor: '0.85' },
          { namaKlasifikasi: 'Komponen Tidak Sesuai', nilaiFaktor: '1.00' },
        ]);
      }
      
      const existingKomponen = await db.select().from(schema.masterKomponen).limit(1);
      if (existingKomponen.length === 0) {
        await db.insert(schema.masterKomponen).values([
          { kategoriKomponen: 'Struktur', namaKomponen: 'Pondasi & Sloof', satuan: 'Estimasi', bobotFormA: '12.00', bobotFormB: '10.00', bobotFormC: '10.00', urutan: 1 },
          { kategoriKomponen: 'Struktur', namaKomponen: 'Kolom', satuan: 'unit', bobotFormA: '10.00', bobotFormB: '13.00', bobotFormC: '13.00', urutan: 2 },
          { kategoriKomponen: 'Struktur', namaKomponen: 'Balok', satuan: 'unit', bobotFormA: '8.00', bobotFormB: '12.00', bobotFormC: '12.00', urutan: 3 },
          { kategoriKomponen: 'Struktur', namaKomponen: 'Plat Lantai', satuan: 'unit', bobotFormA: '0.00', bobotFormB: '7.00', bobotFormC: '10.00', urutan: 4 },
          { kategoriKomponen: 'Struktur', namaKomponen: 'Tangga', satuan: 'unit', bobotFormA: '0.00', bobotFormB: '3.00', bobotFormC: '3.00', urutan: 5 },
          { kategoriKomponen: 'Struktur', namaKomponen: 'Atap', satuan: '%', bobotFormA: '7.00', bobotFormB: '10.00', bobotFormC: '7.00', urutan: 6 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Dinding / Partisi', satuan: '%', bobotFormA: '21.50', bobotFormB: '15.00', bobotFormC: '6.25', urutan: 7 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Plafond', satuan: '%', bobotFormA: '10.00', bobotFormB: '6.00', bobotFormC: '8.00', urutan: 8 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Lantai', satuan: '%', bobotFormA: '14.50', bobotFormB: '9.00', bobotFormC: '10.00', urutan: 9 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Kusen', satuan: 'unit', bobotFormA: '1.00', bobotFormB: '1.50', bobotFormC: '1.50', urutan: 10 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Pintu', satuan: 'unit', bobotFormA: '1.50', bobotFormB: '1.00', bobotFormC: '1.00', urutan: 11 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Jendela', satuan: 'unit', bobotFormA: '2.00', bobotFormB: '1.25', bobotFormC: '1.25', urutan: 12 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Finishing Plafond', satuan: '%', bobotFormA: '3.00', bobotFormB: '1.00', bobotFormC: '3.00', urutan: 13 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Finishing Dinding', satuan: '%', bobotFormA: '4.00', bobotFormB: '5.00', bobotFormC: '5.00', urutan: 14 },
          { kategoriKomponen: 'Arsitektur', namaKomponen: 'Finishing Kusen & Pintu', satuan: '%', bobotFormA: '2.00', bobotFormB: '1.00', bobotFormC: '3.00', urutan: 15 },
          { kategoriKomponen: 'Utilitas', namaKomponen: 'Instalasi Listrik', satuan: 'Estimasi', bobotFormA: '1.00', bobotFormB: '2.00', bobotFormC: '3.00', urutan: 16 },
          { kategoriKomponen: 'Utilitas', namaKomponen: 'Instalasi Air Bersih', satuan: 'Estimasi', bobotFormA: '1.00', bobotFormB: '1.00', bobotFormC: '1.50', urutan: 17 },
          { kategoriKomponen: 'Utilitas', namaKomponen: 'Drainase Limbah', satuan: 'm1', bobotFormA: '1.50', bobotFormB: '1.25', bobotFormC: '1.50', urutan: 18 }
        ]);
      }
    } catch (e) {
      masterDataInitPromise = null;
      throw e;
    }
  })();
  return masterDataInitPromise;
}
