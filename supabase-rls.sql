-- Supabase Row Level Security (RLS) 정책
-- Storage Bucket "orgchart"에 대한 접근 제한

-- 1. 읽기 권한: @myrealtrip.com 계정만
CREATE POLICY "Allow myrealtrip.com to read orgchart"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'orgchart' AND
  auth.jwt()->>'email' LIKE '%@myrealtrip.com'
);

-- 2. 업로드 권한: 관리자만
CREATE POLICY "Allow admins to upload orgchart"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'orgchart' AND
  auth.jwt()->>'email' IN (
    'hanbyeol.lee@myrealtrip.com',
    'haein.cho@myrealtrip.com',
    'yoonjae.lee@myrealtrip.com'
  )
);

-- 3. 삭제 권한: 관리자만
CREATE POLICY "Allow admins to delete orgchart"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'orgchart' AND
  auth.jwt()->>'email' IN (
    'hanbyeol.lee@myrealtrip.com',
    'haein.cho@myrealtrip.com',
    'yoonjae.lee@myrealtrip.com'
  )
);

-- 4. 업데이트 권한: 관리자만
CREATE POLICY "Allow admins to update orgchart"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'orgchart' AND
  auth.jwt()->>'email' IN (
    'hanbyeol.lee@myrealtrip.com',
    'haein.cho@myrealtrip.com',
    'yoonjae.lee@myrealtrip.com'
  )
);
