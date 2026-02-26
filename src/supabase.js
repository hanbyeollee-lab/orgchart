import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = "orgchart";
const FILE_PATH = "current.pdf";
const META_PATH = "meta.json";

export async function uploadPdf(file, uploadedBy) {
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(FILE_PATH, file, { upsert: true, contentType: "application/pdf" });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(FILE_PATH);

  const meta = {
    name: file.name,
    uploadedBy,
    uploadedAt: new Date().toLocaleString("ko-KR"),
    url: publicUrl,
  };
  const { error: metaError } = await supabase.storage
    .from(BUCKET)
    .upload(META_PATH, JSON.stringify(meta), {
      upsert: true,
      contentType: "application/json",
    });
  if (metaError) throw metaError;

  return meta;
}

export async function getPdfMeta(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(META_PATH);
      if (error) {
        if (i === retries - 1) return null;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      const meta = JSON.parse(await data.text());
      // Add cache-busting timestamp to URL
      meta.url = `${meta.url}?t=${Date.now()}`;
      return meta;
    } catch (err) {
      if (i === retries - 1) return null;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

export async function deletePdf() {
  await supabase.storage.from(BUCKET).remove([FILE_PATH, META_PATH]);
}
