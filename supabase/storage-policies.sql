-- Run this ONLY after creating the "product-images" bucket via the Dashboard
-- (Storage → New bucket → name it exactly "product-images" → toggle Public ON → Create).
--
-- If you already ran schema.sql fully, these two policies may already exist —
-- if you get a "policy already exists" error here, that's fine, it means it worked
-- the first time and you can ignore this file.

create policy "product images are publicly readable"
    on storage.objects for select
    using (bucket_id = 'product-images');

create policy "product images are manageable by authenticated users"
    on storage.objects for all
    using (bucket_id = 'product-images' and auth.role() = 'authenticated')
    with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
