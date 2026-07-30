-- Create table for storing overall component assessment data
-- This separates overall component photo from damage detail photos

CREATE TABLE IF NOT EXISTS assessment_components_data (
  id SERIAL PRIMARY KEY,
  id_permohonan UUID NOT NULL REFERENCES permohonan_penilaian(id_permohonan) ON DELETE CASCADE,
  id_komponen INTEGER NOT NULL REFERENCES master_komponen(id_komponen),
  url_foto_keseluruhan TEXT,
  catatan_komponen TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_permohonan, id_komponen)
);

-- Create index for fast lookup
CREATE INDEX idx_assessment_comp_permohonan ON assessment_components_data(id_permohonan);
CREATE INDEX idx_assessment_comp_komponen ON assessment_components_data(id_komponen);

-- Add comment for documentation
COMMENT ON TABLE assessment_components_data IS 'Stores overall component assessment data including overall component photo (Foto Keseluruhan Komponen)';
COMMENT ON COLUMN assessment_components_data.url_foto_keseluruhan IS 'Overall component photo - FOTO KESELURUHAN KOMPONEN';
