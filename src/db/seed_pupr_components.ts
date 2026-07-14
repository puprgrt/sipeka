import 'dotenv/config';
import { db } from './index';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import { COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI } from '../types';

const puprComponents = [
  // STRUKTUR
  { kategori: 'Struktur', nama: 'Pondasi & Sloof', satuan: 'Estimasi' },
  { kategori: 'Struktur', nama: 'Kolom', satuan: 'unit' },
  { kategori: 'Struktur', nama: 'Balok', satuan: 'unit' },
  { kategori: 'Struktur', nama: 'Plat Lantai', satuan: 'unit' },
  { kategori: 'Struktur', nama: 'Tangga', satuan: 'unit' },
  { kategori: 'Struktur', nama: 'Atap', satuan: '%' },
  // ARSITEKTUR
  { kategori: 'Arsitektur', nama: 'Dinding / Partisi', satuan: '%' },
  { kategori: 'Arsitektur', nama: 'Plafond', satuan: '%' },
  { kategori: 'Arsitektur', nama: 'Lantai', satuan: '%' },
  { kategori: 'Arsitektur', nama: 'Kusen', satuan: 'unit' },
  { kategori: 'Arsitektur', nama: 'Pintu', satuan: 'unit' },
  { kategori: 'Arsitektur', nama: 'Jendela', satuan: 'unit' },
  { kategori: 'Arsitektur', nama: 'Finishing Plafond', satuan: '%' },
  { kategori: 'Arsitektur', nama: 'Finishing Dinding', satuan: '%' },
  { kategori: 'Arsitektur', nama: 'Finishing Kusen & Pintu', satuan: '%' },
  // UTILITAS
  { kategori: 'Utilitas', nama: 'Instalasi Listrik', satuan: 'Estimasi' },
  { kategori: 'Utilitas', nama: 'Instalasi Air Bersih', satuan: 'Estimasi' },
  { kategori: 'Utilitas', nama: 'Drainase Limbah', satuan: 'm1' },
];

async function seed() {
  console.log('Seeding PUPR components...');
  try {
    for (let i = 0; i < puprComponents.length; i++) {
      const comp = puprComponents[i];
      const bobotA = COMPONENT_WEIGHTS_1_LANTAI[comp.nama] || 0;
      const bobotB = COMPONENT_WEIGHTS_2_LANTAI[comp.nama] || 0;
      const bobotC = COMPONENT_WEIGHTS_3_LANTAI[comp.nama] || 0;
      
      const existing = await db.select().from(schema.masterKomponen).where(eq(schema.masterKomponen.namaKomponen, comp.nama));
      
      if (existing.length > 0) {
        await db.update(schema.masterKomponen).set({
          kategoriKomponen: comp.kategori as any,
          satuan: comp.satuan,
          bobotFormA: bobotA.toString(),
          bobotFormB: bobotB.toString(),
          bobotFormC: bobotC.toString(),
          urutan: i + 1
        }).where(eq(schema.masterKomponen.idKomponen, existing[0].idKomponen));
        console.log(`Updated: ${comp.nama}`);
      } else {
        await db.insert(schema.masterKomponen).values({
          kategoriKomponen: comp.kategori as any,
          namaKomponen: comp.nama,
          satuan: comp.satuan,
          bobotFormA: bobotA.toString(),
          bobotFormB: bobotB.toString(),
          bobotFormC: bobotC.toString(),
          urutan: i + 1
        });
        console.log(`Inserted: ${comp.nama}`);
      }
    }
    console.log('Seeding complete!');
  } catch (err) {
    console.error('Seeding failed:', err);
  }
  process.exit(0);
}

seed();
