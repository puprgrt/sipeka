import { User } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        idUser: number;
        namaLengkap: string;
        email: string;
        role: string;
        supabaseId: string | null;
      };
      supabaseUser?: User;
    }
  }
}
