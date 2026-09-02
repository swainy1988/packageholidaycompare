// ======================================================
// PackageHolidayCompare
// Add Supplier
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById(
            "supplierForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            saveSupplier
        );

    }

    const nameInput =
        document.getElementById(
            "name"
        );

    if (nameInput) {

        nameInput.addEventListener(
            "input",
            autoCreateSlug
        );

    }

});


// ======================================================
// AUTO CREATE SLUG
// ======================================================

function autoCreateSlug() {

    const nameInput =
        document.getElementById(
            "name"
        );

    const slugInput =
        document.getElementById(
            "slug"
        );

    if (
        !nameInput ||
        !slugInput
    ) {
        return;
    }

    slugInput.value =
        createSlug(
            nameInput.value
        );

}


function createSlug(value) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /&/g,
            "and"
        )
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );

}


// ======================================================
// SAVE SUPPLIER
// ======================================================

async function saveSupplier(event) {

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
        "Saving...";

    showMessage(
        "",
        false
    );

    const supplier = {

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
        .insert([
            supplier
        ]);

    if (error) {

        console.error(
            "Failed to save supplier:",
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
            "Save Supplier";

        return;

    }

    showMessage(
        "Supplier added successfully.",
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