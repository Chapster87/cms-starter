CREATE OR REPLACE FUNCTION public.create_model_field(
    p_model_id uuid,
    p_slug text,
    p_field_label text,
    p_field_type text,
    p_db_type text,
    p_is_required boolean,
    p_is_unique boolean,
    p_ui_order integer DEFAULT 0,
    p_settings jsonb DEFAULT '{}'::jsonb,
    p_block_id uuid DEFAULT NULL,
    p_fieldset_id uuid DEFAULT NULL,
    p_field_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_table_name text;
    v_field_id uuid;
BEGIN
    -- 1. If it's a model field, create the physical column
    IF p_model_id IS NOT NULL THEN
        SELECT table_name INTO v_table_name FROM public.models WHERE id = p_model_id;
        
        IF v_table_name IS NULL THEN
            RAISE EXCEPTION 'Model with ID % not found', p_model_id;
        END IF;

        -- Add physical column to table
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', v_table_name, p_slug, p_db_type);

        -- Add unique constraint if required
        IF p_is_unique THEN
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (%I)', 
                v_table_name, 
                v_table_name || '_' || p_slug || '_unique',
                p_slug
            );
        END IF;
        
        -- Note: NOT NULL constraint is handled via CMS logic/drafts, 
        -- we don't apply it physically to allow for draft flexibility.
    END IF;

    -- 2. Insert into registry
    INSERT INTO public.fields (
        model_id,
        block_id,
        fieldset_id,
        slug,
        field_label,
        field_type,
        is_required,
        is_unique,
        ui_order,
        settings,
        field_note
    )
    VALUES (
        p_model_id,
        p_block_id,
        p_fieldset_id,
        p_slug,
        p_field_label,
        p_field_type,
        p_is_required,
        p_is_unique,
        p_ui_order,
        p_settings,
        p_field_note
    )
    RETURNING id INTO v_field_id;

    RETURN v_field_id;
END;
$$;