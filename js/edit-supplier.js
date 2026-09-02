// ======================================================
// PackageHolidayCompare
// Edit Supplier
// ======================================================

let supplierId = null;

document.addEventListener("DOMContentLoaded", async () => {

    const form =
        document.getElementById(
            "supplierForm"
        );

    const params =
        new URLSearchParams(
            window.location.search
        );

    supplierId =
        params.get("id");

    if (!supplierId) {

        showMessage(
            "No supplier was selected.",
            true
        );

        return;
    }

    if (form) {

        form.addEventListener(
            "submit",
            updateSupplier
        );

    }

    await loadSupplier();

});


// ======================================================
// LOAD SUPPLIER
// ======================================================

async function loadSupplier() {

    if (!window.db) {

        showMessage(
            "Supabase is not connected.",
            true
        );

        return;
    }

    const button =
        document.getElementById(
            "saveSupplierButton"
        );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Loading...";

    }

    const {
        data: supplier,
        error
    } = await window.db
        .from("suppliers")
        .select("*")
        .eq(
            "id",
            supplierId
        )
        .single();

    if (error) {

        console.error(
            "Failed to load supplier:",
            error
        );

        showMessage(
            "The supplier could not be loaded.",
            true
        );

        if (button) {

            button.textContent =
                "Update Supplier";

        }

        return;

    }

    document.getElementById(
        "name"
    ).value =
        supplier.name || "";

    document.getElementById(
        "slug"
    ).value =
        supplier.slug || "";

    document.getElementById(
        "websiteUrl"
    ).value =
        supplier.website_url || "";

    document.getElementById(
        "logoUrl"
    ).value =
        supplier.logo_url || "";

    document.getElementById(
        "active"
    ).checked =
        Boolean(
            supplier.active
        );

    if (button) {

        button.disabled = false;

        button.textContent =
            "Update Supplier";

    }

}


// ======================================================
// UPDATE SUPPLIER
// ======================================================

async function updateSupplier(event) {

    event.preventDefault();

    if (!window.db) {

        showMessage(
            "Supabase is not connected.",
            true
        );

        return;
    }

    const button =
        document.getElementById(
            "saveSupplierButton"
        );

    const name =
        document.getElementById(
            "name"
        ).value.trim();

    const slug =
        document.getElementById(
            "slug"
        ).value.trim();

    const websiteUrl =
        document.getElementById(
            "websiteUrl"
        ).value.trim();

    const logoUrl =
        document.getElementById(
            "logoUrl"
        ).value.trim();

    const active =
        document.getElementById(
            "active"
        ).checked;

    if (
        !name ||
        !slug
    ) {

        showMessage(
            "Please complete all required fields.",
            true
        );

        return;
    }

    if (
        websiteUrl &&
        !isValidUrl(
            websiteUrl
        )
    ) {

        showMessage(
            "Please enter a valid website URL.",
            true
        );

        return;
    }

    if (
        logoUrl &&
        !isValidUrl(
            logoUrl
        )
    ) {

        showMessage(
            "Please enter a valid logo URL.",
            true
        );

        return;
    }

    button.disabled = true;

    button.textContent =
        "Updating...";

    showMessage(
        "",
        false
    );

    const updatedSupplier = {

        name:
            name,

        slug:
            slug,

        website_url:
            websiteUrl || null,

        logo_url:
            logoUrl || null,

        active:
            active,

        updated_at:
            new Date().toISOString()

    };

    const {
        error
    } = await window.db
        .from("suppliers")
        .update(
            updatedSupplier
        )
        .eq(
            "id",
            supplierId
        );

    if (error) {

        console.error(
            "Failed to update supplier:",
            error
        );

        let message =
            error.message;

        if (
            String(
                error.code || ""
            ) === "23505"
        ) {

            message =
                "A supplier with this name or slug already exists.";
        }

        showMessage(
            message,
            true
        );

        button.disabled = false;

        button.textContent =
            "Update Supplier";

        return;

    }

    showMessage(
        "Supplier updated successfully.",
        false
    );

    setTimeout(
        () => {

            window.location.href =
                "suppliers.html";

        },
        800
    );

}


// ======================================================
// URL VALIDATION
// ======================================================

function isValidUrl(value) {

    try {

        const url =
            new URL(value);

        return (
            url.protocol ===
                "https:" ||
            url.protocol ===
                "http:"
        );

    } catch (error) {

        return false;

    }

}


// ======================================================
// FORM MESSAGE
// ======================================================

function showMessage(
    text,
    isError
) {

    const message =
        document.getElementById(
            "formMessage"
        );

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.style.marginTop =
        "15px";

    message.style.color =
        isError
            ? "#d32f2f"
            : "#00875a";

}