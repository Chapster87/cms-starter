CREATE OR REPLACE FUNCTION public.drop_model_field(p_field_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_table_name text;
    v_slug text;
    v_model_id uuid;
BEGIN
    -- 1. Get field details
    SELECT model_id, slug INTO v_model_id, v_slug
    FROM public.fields
    WHERE id = p_field_id;

    IF v_slug IS NULL THEN
        RAISE EXCEPTION 'Field with ID % not found', p_field_id;
    END IF;

    -- 2. If it belongs to a model, drop the physical column
    IF v_model_id IS NOT NULL THEN
        SELECT table_name INTO v_table_name FROM public.models WHERE id = v_model_id;
        
        IF v_table_name IS NOT NULL THEN
            -- Drop the physical column
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS %I', v_table_name, v_slug);
        END IF;
    END IF;

    -- 3. Remove from registry
    DELETE FROM public.fields WHERE id = p_field_id;
END;
$$;